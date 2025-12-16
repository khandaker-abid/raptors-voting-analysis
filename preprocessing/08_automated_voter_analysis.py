#!/usr/bin/env python3
"""
Prepro-8: Automated Voter Analysis (OPTIONAL)

This script validates voter addresses using USPS Address Validation API.
This is an optional step that can improve data quality.
"""
import sys
import logging
from pathlib import Path
import time
import base64
import json
import os
import argparse

sys.path.append(str(Path(__file__).parent))

from utils.database import DatabaseManager, load_config
from utils.voter_collections import get_voter_collection_name
import requests

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)




class USPSAddressValidator:
    """Validates voter addresses using USPS Address Validation API"""
    
    def __init__(self, config_path='config.json'):
        self.db = DatabaseManager(config_path)
        self.config = load_config(config_path)
        
        self.consumer_key = self.config['apiKeys'].get('uspsConsumerKey')
        self.consumer_secret = self.config['apiKeys'].get('uspsConsumerSecret')
        
        if not self.consumer_key or not self.consumer_secret:
            raise ValueError("USPS API credentials not found in config.json")
        
        self.oauth_url = "https://api.usps.com/oauth2/v3/token"
        self.validate_url = "https://api.usps.com/addresses/v3/address"
        
        self.access_token = None
        self.token_expires_at = 0
        
        logger.info("✓ USPS API configured successfully")
    
    def get_access_token(self) -> str:
        """
        Get OAuth2 access token from USPS
        Tokens are valid for a certain period, so we cache and reuse
        """
        if self.access_token and time.time() < self.token_expires_at:
            return self.access_token
        
        logger.info("Requesting new USPS access token...")
        
        credentials = f"{self.consumer_key}:{self.consumer_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            'Authorization': f'Basic {encoded_credentials}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        data = {
            'grant_type': 'client_credentials'
        }
        
        try:
            response = requests.post(self.oauth_url, headers=headers, data=data, timeout=10)
            response.raise_for_status()
            
            token_data = response.json()
            self.access_token = token_data['access_token']
            self.token_expires_at = time.time() + token_data.get('expires_in', 3600) - 300
            
            logger.info("✓ Access token obtained")
            return self.access_token
            
        except Exception as e:
            # Surface the response body if available; USPS often returns useful error details.
            details = ""
            try:
                if isinstance(e, requests.HTTPError) and e.response is not None:
                    details = f" | status={e.response.status_code} body={e.response.text[:500]}"
            except Exception:
                details = ""
            logger.error(f"Failed to get USPS access token: {e}{details}")
            raise
    
    def validate_address(self, address_dict: dict) -> dict:
        """
        Validate an address using USPS API
        
        Args:
            address_dict: Dict with keys: street, city, state, zipCode
        
        Returns validation result with:
        - isValid: bool
        - correctedAddress: dict (if corrections were made)
        - validationSource: str
        - dpvConfirmation: USPS delivery point validation
        """
        street = address_dict.get('street', '').strip()
        city = address_dict.get('city', '').strip()
        state = address_dict.get('state', '').strip()
        zipcode = address_dict.get('zipCode', '').strip()
        
        if not all([street, city, state]):
            return {
                'isValid': False,
                'correctedAddress': None,
                'validationSource': 'pre_validation_failed',
                'validatedAt': time.strftime('%Y-%m-%d'),
                'errorMessage': 'Missing required address fields'
            }
        
        try:
            token = self.get_access_token()
        except Exception as e:
            logger.warning(f"Could not get access token: {e}")
            return {
                'isValid': False,
                'correctedAddress': None,
                'validationSource': 'token_error',
                'validatedAt': time.strftime('%Y-%m-%d'),
                'errorMessage': str(e)
            }
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            "streetAddress": street,
            "city": city,
            "state": state,
            "ZIPCode": zipcode[:5] if zipcode else ""
        }
        
        try:
            response = requests.post(
                self.validate_url,
                headers=headers,
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                
                validated_address = result.get('address', {})
                
                dpv_confirmation = validated_address.get('deliveryPoint', {}).get('confirmationIndicator', 'N')
                is_valid = dpv_confirmation in ['Y', 'S', 'D']  # Y=confirmed, S=secondary, D=dual
                
                corrected = None
                if is_valid:
                    corrected = {
                        'street': validated_address.get('streetAddress', street),
                        'city': validated_address.get('city', city),
                        'state': validated_address.get('state', state),
                        'zipCode': validated_address.get('ZIPCode', zipcode)
                    }
                
                return {
                    'isValid': is_valid,
                    'correctedAddress': corrected,
                    'validationSource': 'usps_api',
                    'validatedAt': time.strftime('%Y-%m-%d'),
                    'dpvConfirmation': dpv_confirmation,
                    'uspsFootnotes': validated_address.get('footnotes', [])
                }
            
            else:
                logger.warning(f"USPS API returned status {response.status_code}: {response.text}")
                return {
                    'isValid': False,
                    'correctedAddress': None,
                    'validationSource': 'usps_api_error',
                    'validatedAt': time.strftime('%Y-%m-%d'),
                    'errorMessage': f"API error: {response.status_code}"
                }
        
        except Exception as e:
            logger.warning(f"Error validating address: {e}")
            return {
                'isValid': False,
                'correctedAddress': None,
                'validationSource': 'validation_exception',
                'validatedAt': time.strftime('%Y-%m-%d'),
                'errorMessage': str(e)
            }
    
    def process_voters(self, limit: int = 5000, batch_size: int = 100):
        """
        Process voters for address validation
        
        Args:
            limit: Maximum number of voters to process
            batch_size: Process in batches with pauses
        """
        logger.info(f"Validating addresses for up to {limit:,} voters...")

        voter_collection = get_voter_collection_name(self.db)
        voters = list(self.db.find_many(voter_collection, {
            '$or': [
                {'addressValidation': None},
                {'addressValidation': {'$exists': False}}
            ]
        }, limit=limit))
        
        if not voters:
            logger.info("All voters already validated")
            return 0
        
        logger.info(f"Found {len(voters):,} voters to validate")
        
        validated = 0
        valid_count = 0
        invalid_count = 0
        corrected_count = 0
        
        # If USPS OAuth is failing, don't hammer the endpoint for every voter.
        # This step is OPTIONAL in the pipeline, so we fail fast and let the pipeline continue.
        skip_on_token_error = os.environ.get("PREPRO8_SKIP_ON_TOKEN_ERROR", "1").strip().lower() in {"1", "true", "yes", "y"}
        token_error_streak = 0
        max_token_errors = int(os.environ.get("PREPRO8_MAX_TOKEN_ERRORS", "1") or 1)

        for i, voter in enumerate(voters):
            address = voter.get('address', {})

            # Defensive: some DBs contain malformed address values (string/null/etc.).
            # Prepro-9b repairs these, but Prepro-8 runs earlier and is optional.
            if not isinstance(address, dict):
                continue

            if not address.get('street'):
                continue
            
            address['state'] = voter.get('stateAbbr', '')
            
            validation = self.validate_address(address)

            # If token retrieval fails, optionally bail out quickly.
            if validation.get('validationSource') == 'token_error':
                token_error_streak += 1
                if skip_on_token_error and token_error_streak >= max_token_errors:
                    logger.warning(
                        "USPS token retrieval failed; skipping remaining address validation "
                        "(this step is optional)."
                    )
                    break
            else:
                token_error_streak = 0
            
            if validation['isValid']:
                valid_count += 1
                if validation['correctedAddress']:
                    corrected_count += 1
            else:
                invalid_count += 1
            
            self.db.upsert_one(
                voter_collection,
                {'_id': voter['_id']},
                {'addressValidation': validation}
            )
            
            validated += 1
            
            if (i + 1) % 10 == 0:
                logger.info(f"  Validated {i + 1:,}/{len(voters):,} voters (valid: {valid_count}, invalid: {invalid_count}, corrected: {corrected_count})")
            
            if (i + 1) % batch_size == 0:
                logger.info(f"  Pausing 2 seconds...")
                time.sleep(2)
            else:
                time.sleep(0.1)  # Small delay between requests
        
        logger.info("\n" + "="*70)
        logger.info("ADDRESS VALIDATION SUMMARY")
        logger.info("="*70)
        logger.info(f"Total addresses validated: {validated:,}")
        if validated > 0:
            logger.info(f"Valid addresses: {valid_count:,} ({valid_count/validated*100:.1f}%)")
            logger.info(f"Invalid addresses: {invalid_count:,} ({invalid_count/validated*100:.1f}%)")
            logger.info(f"Addresses corrected: {corrected_count:,} ({corrected_count/validated*100:.1f}%)")
        else:
            logger.info("Valid addresses: 0 (n/a)")
            logger.info("Invalid addresses: 0 (n/a)")
            logger.info("Addresses corrected: 0 (n/a)")
        logger.info("="*70)

        if validated == 0:
            logger.info("No addresses were validated (likely due to missing/empty street fields).")
            return 0
        
        return validated


def main():
    """Main execution"""
    try:
        parser = argparse.ArgumentParser(description="Prepro-8: Optional USPS address validation")
        parser.add_argument(
            "--no",
            action="store_true",
            help="Skip address validation (no prompt).",
        )
        args = parser.parse_args()

        db = DatabaseManager()
        voter_collection = get_voter_collection_name(db)
        voter_count = db.count_documents(voter_collection)
        
        if voter_count == 0:
            logger.info("="*70)
            logger.info("OPTIONAL: Automated Voter Address Validation with USPS")
            logger.info("="*70)
            logger.info(f"\nNo voter registration records found in database ({voter_collection})")
            logger.info("Skipping address validation (nothing to validate)")
            logger.info("\nNext step: Run 09_geocode_voters_to_census_blocks.py (optional)")
            return
        
        logger.info("="*70)
        logger.info("OPTIONAL: Automated Voter Address Validation with USPS")
        logger.info("="*70)
        logger.info(f"\nFound {voter_count:,} voter records to potentially validate")
        logger.info("This script validates voter addresses using the USPS API")
        logger.info("Benefits:")
        logger.info("  - Verify addresses are deliverable")
        logger.info("  - Standardize address formatting")
        logger.info("  - Correct typos and errors")
        logger.info("  - Improve data quality for geocoding")

        assume_no = args.no or os.environ.get("PREPROCESS_ASSUME_NO", "").strip().lower() in {"1", "true", "yes", "y"}

        if assume_no:
            logger.info("Skipping address validation.")
            logger.info("Next step: Run 09_geocode_voters_to_census_blocks.py (optional)")
            return

        # Proceed by default. If USPS keys are missing, skip instead of crashing.
        config = load_config('config.json')
        api_keys = (config.get('apiKeys') or {})
        if not api_keys.get('uspsConsumerKey') or not api_keys.get('uspsConsumerSecret'):
            logger.info("USPS API credentials not found - skipping address validation")
            logger.info("Next step: Run 09_geocode_voters_to_census_blocks.py (optional)")
            return
        
        validator = USPSAddressValidator()
        count = validator.process_voters(limit=5000, batch_size=100)
        
        logger.info(f"\n✓ Successfully validated {count:,} voter addresses!")
        logger.info("Next step: Run 09_geocode_voters_to_census_blocks.py (optional)")
        
    except Exception as e:
        logger.error(f"Error validating addresses: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()

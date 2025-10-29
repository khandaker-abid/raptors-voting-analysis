#!/usr/bin/env python3
"""
Prepro-9: Geocode Voters to Census Blocks (OPTIONAL)

This script geocodes voter addresses to census block FIPS codes.
This is an optional step that provides more granular geographic assignment.
"""
import sys
import logging
from pathlib import Path
import time

# Add utils to path
sys.path.append(str(Path(__file__).parent))

from utils.database import DatabaseManager
from utils.geocoding import CompositeGeocoder

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class VoterGeocoder:
    """Geocodes voters to census blocks"""
    
    def __init__(self, config_path='config.json'):
        self.db = DatabaseManager(config_path)
        self.geocoder = CompositeGeocoder(config_path)
    
    def geocode_voter(self, voter: dict) -> dict:
        """
        Geocode a voter's address
        
        Returns update dict with censusBlock field
        """
        # Skip if already geocoded
        if voter.get('censusBlock'):
            return None
        
        # Build full address
        address = voter.get('address', {})
        street = address.get('street', '')
        city = address.get('city', '')
        state = voter.get('stateAbbr', '')
        zipcode = address.get('zipCode', '')
        
        if not street:
            return None
        
        full_address = f"{street}, {city}, {state} {zipcode}"
        
        # Geocode
        result = self.geocoder.geocode(full_address)
        
        if result and result.get('census_block'):
            return {
                'censusBlock': result['census_block'],
                'geocodedCoordinates': {
                    'lat': result.get('lat'),
                    'lon': result.get('lon')
                },
                'geocodeSource': result.get('source', 'unknown')
            }
        
        return None
    
    def process_voters(self, batch_size: int = 1000, max_voters: int = 10000):
        """
        Process voters for geocoding
        
        Args:
            batch_size: Number of voters to process per batch
            max_voters: Maximum total voters to geocode (to avoid hitting API limits)
        """
        logger.info(f"Geocoding up to {max_voters:,} voters...")
        
        # Get voters without census blocks
        voters = list(self.db.find_many('voterRegistration', {
            '$or': [
                {'censusBlock': None},
                {'censusBlock': {'$exists': False}}
            ]
        }, limit=max_voters))
        
        if not voters:
            logger.info("All voters already geocoded")
            return 0
        
        logger.info(f"Found {len(voters):,} voters to geocode")
        logger.warning(f"Note: Geocoding uses external APIs with rate limits")
        logger.warning(f"This may take a while... Processing in batches of {batch_size}")
        
        geocoded = 0
        failed = 0
        
        for i, voter in enumerate(voters):
            try:
                update = self.geocode_voter(voter)
                
                if update:
                    self.db.upsert_one(
                        'voterRegistration',
                        {'_id': voter['_id']},
                        update
                    )
                    geocoded += 1
                else:
                    failed += 1
            
            except Exception as e:
                logger.warning(f"Error geocoding voter {voter.get('voterId')}: {e}")
                failed += 1
            
            # Progress and rate limiting
            if (i + 1) % 10 == 0:
                time.sleep(1)  # Rate limiting
            
            if (i + 1) % batch_size == 0:
                logger.info(f"  Processed {i + 1:,}/{len(voters):,} voters (success: {geocoded:,}, failed: {failed:,})")
                logger.info(f"  Pausing 5 seconds to respect rate limits...")
                time.sleep(5)
        
        # Summary
        logger.info("\n" + "="*70)
        logger.info("GEOCODING SUMMARY")
        logger.info("="*70)
        logger.info(f"Total voters processed: {len(voters):,}")
        logger.info(f"Successfully geocoded: {geocoded:,} ({geocoded/len(voters)*100:.1f}%)")
        logger.info(f"Failed to geocode: {failed:,} ({failed/len(voters)*100:.1f}%)")
        logger.info("="*70)
        
        return geocoded


def main():
    """Main execution"""
    try:
        # First, check if there are any voter records to geocode
        from utils.database import DatabaseManager
        db = DatabaseManager()
        voter_count = db.count_documents('voterRegistration')
        
        if voter_count == 0:
            logger.info("="*70)
            logger.info("OPTIONAL: Geocode Voters to Census Blocks")
            logger.info("="*70)
            logger.info("\nNo voter registration records found in database")
            logger.info("Skipping geocoding (nothing to geocode)")
            logger.info("\nNext step: Run 10_assign_voters_to_eavs_regions.py")
            return
        
        logger.info("="*70)
        logger.info("OPTIONAL: Geocode Voters to Census Blocks")
        logger.info("="*70)
        logger.info(f"\nFound {voter_count:,} voter records to potentially geocode")
        logger.info("This script is optional but recommended for:")
        logger.info("  - More accurate EAVS region assignment")
        logger.info("  - Demographic analysis at census block level")
        logger.info("  - Spatial analysis capabilities")
        logger.info("\nNote: This uses external geocoding APIs with rate limits")
        logger.info("Processing may take several hours for large datasets")
        
        response = input("\nDo you want to proceed? (yes/no): ")
        
        if response.lower() not in ['yes', 'y']:
            logger.info("Skipping geocoding.")
            logger.info("Next step: Run 10_assign_voters_to_eavs_regions.py")
            return
        
        geocoder = VoterGeocoder()
        count = geocoder.process_voters(batch_size=1000, max_voters=10000)
        
        logger.info(f"\n✓ Successfully geocoded {count:,} voters!")
        logger.info("Next step: Run 10_assign_voters_to_eavs_regions.py")
        
    except Exception as e:
        logger.error(f"Error geocoding voters: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()

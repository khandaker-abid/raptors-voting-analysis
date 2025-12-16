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
import os
import argparse

sys.path.append(str(Path(__file__).parent))

from utils.database import DatabaseManager
from utils.geocoding import CompositeGeocoder
from utils.voter_collections import get_voter_collection_name

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)




class VoterGeocoder:
    """Geocodes voters to census blocks"""
    
    def __init__(self, config_path='config.json'):
        self.db = DatabaseManager(config_path)
        # Default to Census-only for reliability. Nominatim is slow, rate-limited,
        # and frequently times out, which makes unattended preprocessing brittle.
        # Opt back in with PREPRO9_USE_FALLBACK=1.
        use_fallback = os.environ.get("PREPRO9_USE_FALLBACK", "").strip().lower() in {"1", "true", "yes", "y"}
        self.geocoder = CompositeGeocoder(config_path, use_fallback=use_fallback)
    
    def geocode_voter(self, voter: dict) -> dict:
        """
        Geocode a voter's address
        
        Returns update dict with censusBlock field
        """
        if not isinstance(voter, dict):
            return None

        if voter.get('censusBlock'):
            return None
        
        address = voter.get('address', {})
        if not isinstance(address, dict):
            return None

        street = address.get('street', '')
        city = address.get('city', '')
        state = voter.get('stateAbbr', '')
        zipcode = address.get('zipCode', '')
        
        if not street:
            return None
        
        full_address = f"{street}, {city}, {state} {zipcode}"
        
        try:
            result = self.geocoder.geocode(full_address)
        except Exception as e:
            # Never let a single slow/failed network call stall the whole run.
            logger.debug(f"Geocode failed for address '{full_address}': {e}")
            return None
        
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

        voter_collection = get_voter_collection_name(self.db)

        # IMPORTANT: This repo is frequently run from fish shell which expands `$...`.
        # While that doesn't affect Python source directly, it *does* affect common
        # one-liners users run in the terminal. To keep behavior consistent and to
        # avoid any accidental `$`-operator mishaps, build Mongo operator keys
        # programmatically here.
        op_or = "$" + "or"
        op_exists = "$" + "exists"

        missing_filter = {
            op_or: [
                {'censusBlock': None},
                {'censusBlock': ''},
                {'censusBlock': {op_exists: False}},
            ]
        }

        voters = list(self.db.find_many(voter_collection, missing_filter, limit=max_voters))
        
        if not voters:
            logger.info("All voters already geocoded")
            return 0
        
        logger.info(f"Found {len(voters):,} voters to geocode")
        logger.warning(f"Note: Geocoding uses external APIs with rate limits")
        logger.warning(f"This may take a while... Processing in batches of {batch_size}")
        
        geocoded = 0
        failed = 0
        none_results = 0
        no_block_results = 0
        write_failures = 0
        
        malformed = 0

        for i, voter in enumerate(voters):
            try:
                if not isinstance(voter, dict):
                    malformed += 1
                    continue

                update = self.geocode_voter(voter)
                
                if update:
                    try:
                        wrote = self.db.upsert_one(
                            voter_collection,
                            {'_id': voter['_id']},
                            update
                        )
                        if wrote:
                            geocoded += 1
                        else:
                            write_failures += 1
                            failed += 1
                    except Exception:
                        write_failures += 1
                        failed += 1
                else:
                    failed += 1
                    # distinguish None result vs result without census block
                    try:
                        address = voter.get('address', {}) if isinstance(voter, dict) else {}
                        street = address.get('street', '') if isinstance(address, dict) else ''
                        city = address.get('city', '') if isinstance(address, dict) else ''
                        state = voter.get('stateAbbr', '') if isinstance(voter, dict) else ''
                        zipcode = address.get('zipCode', '') if isinstance(address, dict) else ''
                        if street:
                            full_address = f"{street}, {city}, {state} {zipcode}"
                            result = self.geocoder.geocode(full_address)
                            if result is None:
                                none_results += 1
                            elif not result.get('census_block'):
                                no_block_results += 1
                    except Exception:
                        pass
            
            except Exception as e:
                voter_id = voter.get('voterId') if isinstance(voter, dict) else None
                logger.warning(f"Error geocoding voter {voter_id}: {e}")
                failed += 1
            
            if (i + 1) % 10 == 0:
                time.sleep(1)  # Rate limiting
            
            if (i + 1) % batch_size == 0:
                logger.info(f"  Processed {i + 1:,}/{len(voters):,} voters (success: {geocoded:,}, failed: {failed:,})")
                if malformed:
                    logger.warning(f"  Skipped malformed voter records so far: {malformed:,}")
                if none_results or no_block_results:
                    logger.info(f"  Failure breakdown so far: geocoder returned None={none_results:,}, no census_block={no_block_results:,}")
                if write_failures:
                    logger.warning(f"  Write failures so far: {write_failures:,}")
                logger.info(f"  Pausing 5 seconds to respect rate limits...")
                time.sleep(5)
        
        logger.info("\n" + "="*70)
        logger.info("GEOCODING SUMMARY")
        logger.info("="*70)
        logger.info(f"Total voters processed: {len(voters):,}")
        logger.info(f"Successfully geocoded: {geocoded:,} ({geocoded/len(voters)*100:.1f}%)")
        logger.info(f"Failed to geocode: {failed:,} ({failed/len(voters)*100:.1f}%)")
        if malformed:
            logger.info(f"Skipped malformed voter records: {malformed:,}")
        if none_results or no_block_results:
            logger.info(f"Failure breakdown: geocoder returned None={none_results:,}, no census_block={no_block_results:,}")
        if write_failures:
            logger.info(f"Write failures: {write_failures:,}")
        logger.info("="*70)
        
        return geocoded


def main():
    """Main execution"""
    try:
        parser = argparse.ArgumentParser(description="Prepro-9: Optional geocoding of voter addresses")
        parser.add_argument(
            "--yes",
            action="store_true",
            help="Run non-interactively (assume yes). Kept for compatibility; this is now the default.",
        )
        parser.add_argument(
            "--no",
            action="store_true",
            help="Skip geocoding (no prompt).",
        )

        parser.add_argument(
            "--batch-size",
            type=int,
            default=1000,
            help="Number of voter records to process per batch (default: 1000).",
        )
        parser.add_argument(
            "--max-voters",
            type=int,
            default=10000,
            help="Maximum number of voters to attempt to geocode (default: 10000).",
        )
        args = parser.parse_args()

        from utils.database import DatabaseManager
        db = DatabaseManager()
        voter_collection = get_voter_collection_name(db)
        voter_count = db.count_documents(voter_collection)
        
        if voter_count == 0:
            logger.info("="*70)
            logger.info("OPTIONAL: Geocode Voters to Census Blocks")
            logger.info("="*70)
            logger.info(f"\nNo voter registration records found in database ({voter_collection})")
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

        assume_no = args.no or os.environ.get("PREPROCESS_ASSUME_NO", "").strip().lower() in {"1", "true", "yes", "y"}

        if assume_no:
            logger.info("Skipping geocoding.")
            logger.info("Next step: Run 10_assign_voters_to_eavs_regions.py")
            return

        # Proceed by default. (Use --no or PREPROCESS_ASSUME_NO=1 to skip.)
        
        geocoder = VoterGeocoder()
        count = geocoder.process_voters(batch_size=args.batch_size, max_voters=args.max_voters)
        
        logger.info(f"\n✓ Successfully geocoded {count:,} voters!")
        logger.info("Next step: Run 10_assign_voters_to_eavs_regions.py")
        
    except Exception as e:
        logger.error(f"Error geocoding voters: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()

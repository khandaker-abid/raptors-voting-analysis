#!/usr/bin/env python3
"""
Prepro-10: Assign Voters to EAVS Regions

This script assigns voters to EAVS regions (counties) based on their addresses.
Uses spatial joins with county boundaries.
"""
import sys
import logging
from pathlib import Path
import os

sys.path.append(str(Path(__file__).parent))

from utils.database import DatabaseManager
from utils.geojson_tools import point_in_polygon
from utils.geocoding import CompositeGeocoder
from utils.voter_collections import get_voter_collection_name

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)




class VoterRegionAssigner:
    """Assigns voters to EAVS regions"""
    
    def __init__(self, config_path='config.json'):
        self.db = DatabaseManager(config_path)
        # Demo/runtime controls
        # - PREPRO10_MAX_VOTERS: limit total voters processed (default: 5000)
        # - PREPRO10_DISABLE_GEOCODING: if truthy, do NOT call geocoding APIs; use censusBlock or county-name fallback only
        #
        # We cap by default to keep the end-to-end preprocessing run demo-friendly.
        # For a full run, set PREPRO10_MAX_VOTERS=0 (or a large number).
        self.max_voters = self._parse_int_env("PREPRO10_MAX_VOTERS")
        if self.max_voters is None:
            self.max_voters = 5000
        self.disable_geocoding = self._parse_bool_env("PREPRO10_DISABLE_GEOCODING", default=False)

        self.geocoder = None if self.disable_geocoding else CompositeGeocoder(config_path)
        
        logger.info("Loading county boundaries...")
        self.boundaries = list(self.db.find_many('boundaryData', {'boundaryType': 'county'}))
        logger.info(f"Loaded {len(self.boundaries)} county boundaries")

        if self.disable_geocoding:
            logger.warning("PREPRO10_DISABLE_GEOCODING is enabled: will not call external geocoding APIs")
        if self.max_voters is not None and self.max_voters > 0:
            logger.warning(f"DEMO MODE: Prepro-10 will process at most {self.max_voters:,} voters")
            logger.warning("To run full Prepro-10 on all voters, set PREPRO10_MAX_VOTERS=0 before running.")

    @staticmethod
    def _parse_bool_env(name: str, default: bool = False) -> bool:
        val = os.environ.get(name)
        if val is None:
            return default
        return val.strip().lower() in {"1", "true", "yes", "y", "on"}

    @staticmethod
    def _parse_int_env(name: str):
        val = os.environ.get(name)
        if val is None or not str(val).strip():
            return None
        try:
            return int(str(val).strip())
        except ValueError:
            return None
    
    def find_county_for_point(self, lat: float, lon: float) -> str:
        """Find county FIPS for a given lat/lon point"""
        point = [lon, lat]  # GeoJSON uses [lon, lat]
        
        for boundary in self.boundaries:
            geometry = boundary['boundaryData']
            if point_in_polygon(point, geometry):
                return boundary['fipsCode']
        
        return None
    
    def assign_voter_region(self, voter: dict) -> dict:
        """Assign EAVS region to a voter"""
        if voter.get('eavsRegionFips'):
            return None
        
        census_block = voter.get('censusBlock')
        if census_block:
            county_fips = census_block[:5]
            return {'eavsRegionFips': county_fips}
        
        address = voter.get('address', {})
        street = address.get('street', '')
        city = address.get('city', '')
        state = voter.get('stateAbbr', '')
        zipcode = address.get('zipCode', '')
        
        full_address = f"{street}, {city}, {state} {zipcode}"

        if self.geocoder is not None:
            result = self.geocoder.geocode(full_address)

            if result and result.get('lat') and result.get('lon'):
                lat = result['lat']
                lon = result['lon']

                county_fips = self.find_county_for_point(lat, lon)

                if county_fips:
                    return {'eavsRegionFips': county_fips}
        
        county_name = voter.get('county', '').lower()
        if county_name:
            for boundary in self.boundaries:
                if county_name in boundary['jurisdiction'].lower():
                    if boundary['state'].lower().endswith(state.lower()):
                        return {'eavsRegionFips': boundary['fipsCode']}
        
        return None
    
    def process_all_voters(self):
        """Process all voters and assign regions"""
        logger.info("Assigning EAVS regions to voters...")

        voter_collection = get_voter_collection_name(self.db)
        limit = self.max_voters if (self.max_voters is not None and self.max_voters > 0) else 0

        voters = list(self.db.find_many(voter_collection, {
            '$or': [
                {'eavsRegionFips': None},
                {'eavsRegionFips': {'$exists': False}}
            ]
        }, limit=limit))
        
        total = len(voters)
        
        if total == 0:
            logger.info("All voters already have region assignments")
            return 0
        
        logger.info(f"Processing {total:,} voters...")
        
        assigned = 0
        failed = 0
        
        for i, voter in enumerate(voters):
            try:
                update = self.assign_voter_region(voter)
                
                if update:
                    self.db.upsert_one(
                        voter_collection,
                        {'_id': voter['_id']},
                        update
                    )
                    assigned += 1
                else:
                    failed += 1
            
            except Exception as e:
                logger.warning(f"Error assigning region for voter {voter.get('voterId')}: {e}")
                failed += 1
            
            if (i + 1) % 1000 == 0:
                logger.info(f"  Processed {i + 1:,}/{total:,} voters (assigned: {assigned:,}, failed: {failed:,})")
        
        logger.info("\n" + "="*70)
        logger.info("REGION ASSIGNMENT SUMMARY")
        logger.info("="*70)
        logger.info(f"Total voters processed: {total:,}")
        logger.info(f"Successfully assigned: {assigned:,} ({assigned/total*100:.1f}%)")
        logger.info(f"Failed to assign: {failed:,} ({failed/total*100:.1f}%)")
        logger.info("="*70)
        
        return assigned


def main():
    """Main execution"""
    try:
        assigner = VoterRegionAssigner()
        count = assigner.process_all_voters()
        
        logger.info(f"\n✓ Successfully assigned {count:,} voters to EAVS regions!")
        logger.info("Next step: Run 11_download_election_results.py")
        
    except Exception as e:
        logger.error(f"Error assigning regions: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()

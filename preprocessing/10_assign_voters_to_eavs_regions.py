#!/usr/bin/env python3
"""
Prepro-10: Assign Voters to EAVS Regions

This script assigns voters to EAVS regions (counties) based on their addresses.
Uses spatial joins with county boundaries.
"""
import sys
import logging
from pathlib import Path

# Add utils to path
sys.path.append(str(Path(__file__).parent))

from utils.database import DatabaseManager
from utils.geojson_tools import point_in_polygon
from utils.geocoding import CompositeGeocoder

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class VoterRegionAssigner:
    """Assigns voters to EAVS regions"""
    
    def __init__(self, config_path='config.json'):
        self.db = DatabaseManager(config_path)
        self.geocoder = CompositeGeocoder(config_path)
        
        # Load county boundaries
        logger.info("Loading county boundaries...")
        self.boundaries = list(self.db.find_many('boundaryData', {'boundaryType': 'county'}))
        logger.info(f"Loaded {len(self.boundaries)} county boundaries")
    
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
        # Check if already assigned
        if voter.get('eavsRegionFips'):
            return None
        
        # Check if already geocoded
        census_block = voter.get('censusBlock')
        if census_block:
            # Extract county FIPS from census block (first 5 digits)
            county_fips = census_block[:5]
            return {'eavsRegionFips': county_fips}
        
        # Try geocoding the address
        address = voter.get('address', {})
        street = address.get('street', '')
        city = address.get('city', '')
        state = voter.get('stateAbbr', '')
        zipcode = address.get('zipCode', '')
        
        full_address = f"{street}, {city}, {state} {zipcode}"
        
        # Geocode
        result = self.geocoder.geocode(full_address)
        
        if result and result.get('lat') and result.get('lon'):
            lat = result['lat']
            lon = result['lon']
            
            # Find county
            county_fips = self.find_county_for_point(lat, lon)
            
            if county_fips:
                return {'eavsRegionFips': county_fips}
        
        # Fallback: Try to match by county name
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
        
        # Get voters without region assignment
        voters = list(self.db.find_many('voterRegistration', {
            '$or': [
                {'eavsRegionFips': None},
                {'eavsRegionFips': {'$exists': False}}
            ]
        }))
        
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
                        'voterRegistration',
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
        
        # Summary
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

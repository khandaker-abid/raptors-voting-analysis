#!/usr/bin/env python3
"""
Prepro-12: Download CVAP (Citizen Voting Age Population) Data

This script downloads American Community Survey (ACS) CVAP data
for detailed states using the Census Bureau API.
"""
import sys
import logging
from pathlib import Path

# Add utils to path
sys.path.append(str(Path(__file__).parent))

from utils.database import DatabaseManager, load_config, get_state_fips_mapping
from utils.census_api import CensusAPI

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class CVAPDataDownloader:
    """Downloads CVAP data from Census API"""
    
    def __init__(self, config_path='config.json'):
        self.db = DatabaseManager(config_path)
        self.config = load_config(config_path)
        
        # Get Census API key from config
        census_api_key = self.config['apiKeys'].get('censusApiKey')
        if not census_api_key:
            raise ValueError("Census API key not found in config.json")
        
        self.census = CensusAPI(census_api_key)
        
        self.detailed_states = self.config['detailedStates']['stateAbbrs']
        self.state_fips = get_state_fips_mapping()
        
        logger.info(f"Processing CVAP data for: {self.detailed_states}")
    
    def process_cvap_for_state(self, state_abbr: str):
        """Process CVAP data for a state"""
        logger.info(f"\nProcessing CVAP data for {state_abbr}...")
        
        state_fips = self.state_fips[state_abbr]
        
        # Download CVAP data by county (using 2023 as most recent year)
        cvap_data = self.census.get_cvap_data(year=2023, state_fips=state_fips)
        
        if not cvap_data or len(cvap_data) < 2:
            logger.warning(f"No CVAP data retrieved for {state_abbr}")
            return 0
        
        # Parse response (first row is headers)
        headers = cvap_data[0]
        rows = cvap_data[1:]
        
        logger.info(f"Retrieved CVAP data for {len(rows)} counties")
        
        # Transform and store
        documents = []
        
        for row in rows:
            # Create dict from headers and row
            county_data = dict(zip(headers, row))
            
            # Extract county FIPS
            state_code = county_data.get('state', '')
            county_code = county_data.get('county', '')
            county_fips = f"{state_code}{county_code}"
            
            # Build document
            doc = {
                'fipsCode': county_fips,  # Required by validation
                'state': state_abbr,       # Required by validation
                'stateFips': state_fips,
                'stateAbbr': state_abbr,
                'countyFips': county_fips,
                'countyName': county_data.get('NAME', ''),
                'year': 2023,
                'dataSource': 'ACS 5-Year Estimates',
                'citizenVotingAgePopulation': {
                    'total': self.census._parse_int(county_data.get('B05003_001E')) or 0,
                    'byDemographic': {
                        'white': self.census._parse_int(county_data.get('B05003_008E')) or 0,
                        'africanAmerican': self.census._parse_int(county_data.get('B05003_011E')) or 0,
                        'hispanic': self.census._parse_int(county_data.get('B05003_021E')) or 0,
                        'asian': self.census._parse_int(county_data.get('B05003_012E')) or 0
                    }
                }
            }
            
            documents.append(doc)
        
        # Store in database
        if documents:
            logger.info(f"Storing {len(documents)} CVAP records...")
            for doc in documents:
                self.db.upsert_one(
                    'demographicData',
                    {
                        'countyFips': doc['countyFips'],
                        'year': doc['year']
                    },
                    doc
                )
            logger.info(f"✓ Stored {len(documents)} CVAP records for {state_abbr}")
        
        return len(documents)
    
    def process_all_states(self):
        """Process all detailed states"""
        total = 0
        
        for state in self.detailed_states:
            try:
                count = self.process_cvap_for_state(state)
                total += count
            except Exception as e:
                logger.error(f"Error processing {state}: {e}")
        
        return total


def main():
    """Main execution"""
    try:
        downloader = CVAPDataDownloader()
        count = downloader.process_all_states()
        
        if count > 0:
            logger.info(f"\n✓ Successfully downloaded CVAP data for {count} counties!")
            logger.info("\n" + "="*70)
            logger.info("ALL PREPROCESSING COMPLETE!")
            logger.info("="*70)
            logger.info("\nYou can now:")
            logger.info("  1. Run validate_preprocessing.py to check data quality")
            logger.info("  2. Start your backend server and query the data")
            logger.info("  3. Run your frontend to visualize the results")
        else:
            logger.warning("\n⚠ No CVAP data was downloaded")
            logger.warning("Check your Census API key in config.json")
        
    except Exception as e:
        logger.error(f"Error downloading CVAP data: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()

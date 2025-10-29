#!/usr/bin/env python3
"""
Prepro-7: Download Voter Registration Data

This script downloads voter registration data for detailed states.
Currently supports Maryland voter registration data.
"""
import sys
import logging
from pathlib import Path
import csv

# Add utils to path
sys.path.append(str(Path(__file__).parent))

from utils.database import DatabaseManager, load_config, get_state_fips_mapping
from utils.data_sources import VOTER_REGISTRATION_SOURCES
import requests

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class VoterRegistrationDownloader:
    """Downloads voter registration data for detailed states"""
    
    def __init__(self, config_path='config.json'):
        self.db = DatabaseManager(config_path)
        self.config = load_config(config_path)
        self.cache_dir = Path(self.config['processing']['cacheDir']) / 'voter_registration'
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Get detailed states
        self.detailed_states = self.config['detailedStates']['stateAbbrs']
        self.state_fips = get_state_fips_mapping()
        
        logger.info(f"Processing voter registration for: {self.detailed_states}")
    
    def download_file(self, url: str, filename: str) -> Path:
        """Download voter registration file"""
        filepath = self.cache_dir / filename
        
        if filepath.exists():
            logger.info(f"Using cached file: {filepath}")
            return filepath
        
        logger.info(f"Downloading {filename}...")
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        
        with open(filepath, 'wb') as f:
            if total_size == 0:
                f.write(response.content)
            else:
                downloaded = 0
                for chunk in response.iter_content(chunk_size=8192):
                    downloaded += len(chunk)
                    f.write(chunk)
                    
                    # Progress
                    if total_size > 0:
                        pct = (downloaded / total_size) * 100
                        logger.info(f"  Progress: {pct:.1f}%")
        
        logger.info(f"✓ Downloaded to {filepath}")
        return filepath
    
    def parse_maryland_data(self, filepath: Path) -> list:
        """
        Parse Maryland voter registration CSV
        
        Expected format:
        - Comma or tab-delimited
        - Columns: voter_id, first_name, last_name, address, city, zip, county, party, status, registration_date
        """
        logger.info(f"Parsing Maryland data from {filepath.name}...")
        
        voters = []
        
        # Try comma-delimited first
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                # Detect delimiter
                sample = f.read(1024)
                f.seek(0)
                
                delimiter = ',' if sample.count(',') > sample.count('\t') else '\t'
                
                reader = csv.DictReader(f, delimiter=delimiter)
                
                for row in reader:
                    # Extract relevant fields
                    voter = {
                        'stateAbbr': 'MD',
                        'stateFips': self.state_fips['MD'],
                        'voterId': row.get('voter_id') or row.get('VOTER_ID'),
                        'firstName': row.get('first_name') or row.get('FIRST_NAME'),
                        'lastName': row.get('last_name') or row.get('LAST_NAME'),
                        'address': {
                            'street': row.get('address') or row.get('ADDRESS'),
                            'city': row.get('city') or row.get('CITY'),
                            'zipCode': row.get('zip') or row.get('ZIP')
                        },
                        'county': row.get('county') or row.get('COUNTY'),
                        'partyAffiliation': row.get('party') or row.get('PARTY'),
                        'registrationStatus': row.get('status') or row.get('STATUS') or 'Active',
                        'registrationDate': row.get('registration_date') or row.get('REGISTRATION_DATE'),
                        'eavsRegionFips': None,  # Will be assigned in script 10
                        'censusBlock': None  # Will be assigned in script 09 (optional)
                    }
                    
                    voters.append(voter)
                    
                    if len(voters) % 10000 == 0:
                        logger.info(f"  Parsed {len(voters):,} voters...")
        
        except Exception as e:
            logger.error(f"Error parsing CSV: {e}")
            raise
        
        logger.info(f"✓ Parsed {len(voters):,} voters")
        return voters
    
    def process_maryland(self):
        """Process Maryland voter registration"""
        logger.info("\nProcessing Maryland voter registration...")
        
        url = VOTER_REGISTRATION_SOURCES.get('MD')
        if not url:
            logger.warning("No voter registration source configured for Maryland")
            logger.info("Maryland voter registration requires manual download or API access")
            logger.info("Skipping Maryland - aggregate data available in EAVS records")
            return 0
        
        # Download
        filepath = self.download_file(url, 'maryland_voters.csv')
        
        # Parse
        voters = self.parse_maryland_data(filepath)
        
        # Store in database
        if voters:
            logger.info(f"Storing {len(voters):,} voters in database...")
            self.db.bulk_upsert('voterRegistration', voters, key_field='voterId')
            logger.info(f"✓ Stored {len(voters):,} Maryland voters")
        
        return len(voters)
    
    def process_arkansas(self):
        """Process Arkansas voter registration (if available)"""
        logger.info("\nArkansas voter registration:")
        logger.info("Arkansas does not provide public voter registration files.")
        logger.info("Aggregate data is available in EAVS records.")
        return 0
    
    def process_rhode_island(self):
        """Process Rhode Island voter registration (if available)"""
        logger.info("\nRhode Island voter registration:")
        logger.info("Rhode Island does not provide public voter registration files.")
        logger.info("Aggregate data is available in EAVS records.")
        return 0
    
    def process_all_states(self):
        """Process all detailed states"""
        total = 0
        
        for state in self.detailed_states:
            if state == 'MD':
                total += self.process_maryland()
            elif state == 'AR':
                total += self.process_arkansas()
            elif state == 'RI':
                total += self.process_rhode_island()
        
        return total


def main():
    """Main execution"""
    try:
        downloader = VoterRegistrationDownloader()
        count = downloader.process_all_states()
        
        if count > 0:
            logger.info(f"\n✓ Processed {count:,} voter registration records!")
            logger.info("\nNext steps:")
            logger.info("  1. (Optional) Run 08_automated_voter_analysis.py to validate addresses")
            logger.info("  2. (Optional) Run 09_geocode_voters_to_census_blocks.py to geocode voters")
            logger.info("  3. Run 10_assign_voters_to_eavs_regions.py to assign EAVS regions")
        else:
            logger.info("\n✓ Processed 0 voter registration records!")
            logger.info("Note: AR, MD, and RI do not provide public voter files")
            logger.info("Aggregate registration data is available in EAVS records")
        
    except Exception as e:
        logger.error(f"Error processing voter registration: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()

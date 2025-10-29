#!/usr/bin/env python3
"""
Prepro-6b: Import Verified Voting Equipment Data

This script imports equipment data from VerifiedVoting.org CSV files
that have been downloaded and committed to the repository.

Data covers:
- Arkansas, Maryland, Rhode Island
- Years: 2016, 2020, 2024
- Types: Standard Equipment, Accessible Equipment
"""

import sys
import logging
import csv
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict

# Add utils to path
sys.path.append(str(Path(__file__).parent))

from utils.database import DatabaseManager, load_config

logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')
logger = logging.getLogger(__name__)


class EquipmentDataImporter:
    """Import equipment data from VerifiedVoting CSV files"""
    
    def __init__(self, config_path='config.json'):
        self.db = DatabaseManager(config_path)
        self.config = load_config(config_path)
        self.cache_dir = Path(self.config['processing']['cacheDir']) / 'equipment'
        
        self.detailed_states = self.config['detailedStates']['stateAbbrs']
        self.years = [2016, 2020, 2024]
        self.equipment_types = ['standard', 'accessible']
        
        logger.info("Equipment Data Importer initialized")
        logger.info(f"States: {', '.join(self.detailed_states)}")
        logger.info(f"Years: {', '.join(map(str, self.years))}")
    
    def import_all_equipment(self) -> int:
        """Import all equipment data from CSV files"""
        total_records = 0
        
        for state_abbr in self.detailed_states:
            for year in self.years:
                for equipment_type in self.equipment_types:
                    filename = f"{state_abbr}_{equipment_type}_{year}.csv"
                    filepath = self.cache_dir / filename
                    
                    if not filepath.exists():
                        logger.warning(f"File not found: {filename}")
                        continue
                    
                    logger.info(f"\nProcessing {filename}...")
                    records = self.parse_equipment_csv(filepath, state_abbr, year, equipment_type)
                    
                    if records:
                        self.store_equipment_records(records)
                        total_records += len(records)
                        logger.info(f"  ✓ Imported {len(records)} records")
                    else:
                        logger.warning(f"  No records found in {filename}")
        
        return total_records
    
    def parse_equipment_csv(self, filepath: Path, state_abbr: str, year: int, equipment_type: str) -> List[Dict]:
        """Parse equipment CSV file from VerifiedVoting"""
        records = []
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                # Skip the first line (VerifiedVoting header)
                header_line = f.readline()
                
                # Read the CSV header line
                csv_header = f.readline()
                
                # Parse the CSV data
                records = self._parse_verifier_csv(f, csv_header, state_abbr, year, equipment_type)
                    
        except Exception as e:
            logger.error(f"Error parsing {filepath.name}: {e}")
        
        return records
    
    def _parse_verifier_csv(self, file_obj, csv_header: str, state_abbr: str, year: int, equipment_type: str) -> List[Dict]:
        """Parse VerifiedVoting CSV format (merged jurisdictions + machines data)"""
        records = []
        
        # Parse the header to get column names
        # The CSV header line should contain the column names
        import io
        header_reader = csv.reader(io.StringIO(csv_header))
        columns = next(header_reader)
        
        # Now parse the data rows
        reader = csv.reader(file_obj)
        
        for row in reader:
            # Skip empty rows
            if not row or not any(row):
                continue
            
            # Create a dictionary from the row
            row_dict = {}
            for i, value in enumerate(row):
                if i < len(columns):
                    row_dict[columns[i].strip()] = value.strip() if value else ''
            
            # Skip if no jurisdiction info
            jurisdiction = row_dict.get('Jurisdiction', row_dict.get('County', ''))
            if not jurisdiction:
                continue
            
            # Create the record
            record = {
                'stateAbbr': state_abbr,
                'jurisdiction': jurisdiction,
                'year': year,
                'equipmentType': equipment_type,
                'dataSource': 'VerifiedVoting.org',
                'lastUpdated': datetime.now(timezone.utc),
            }
            
            # Add relevant fields
            if 'FIPS code' in row_dict and row_dict['FIPS code']:
                record['fipsCode'] = row_dict['FIPS code']
            
            if 'Registered Voters' in row_dict and row_dict['Registered Voters']:
                try:
                    record['registeredVoters'] = int(row_dict['Registered Voters'])
                except (ValueError, TypeError):
                    pass
            
            if 'Precincts' in row_dict and row_dict['Precincts']:
                try:
                    record['precincts'] = int(row_dict['Precincts'])
                except (ValueError, TypeError):
                    pass
            
            # Extract equipment/voting methods
            marking_method = row_dict.get('Election Day Marking Method', '')
            tabulation = row_dict.get('Election Day Tabulation', '')
            
            if marking_method:
                record['markingMethod'] = marking_method
            if tabulation:
                record['tabulationMethod'] = tabulation
            
            # Add all data as equipment details
            equipment_details = {}
            for key, value in row_dict.items():
                if key not in ['FIPS code', 'State', 'Jurisdiction', 'County'] and value:
                    equipment_details[key] = value
            
            if equipment_details:
                record['equipmentDetails'] = equipment_details
            
            records.append(record)
        
        return records
    
    def store_equipment_records(self, records: List[Dict]):
        """Store equipment records in database"""
        for record in records:
            # Upsert based on state, jurisdiction (if present), year, and equipment type
            query = {
                'stateAbbr': record['stateAbbr'],
                'year': record['year'],
                'equipmentType': record.get('equipmentType', 'standard')
            }
            
            # Add jurisdiction to query if present
            if 'jurisdiction' in record:
                query['jurisdiction'] = record['jurisdiction']
            elif 'manufacturer' in record and 'model' in record:
                query['manufacturer'] = record['manufacturer']
                query['model'] = record['model']
            
            self.db.upsert_one(
                'votingEquipmentData',
                query,
                record
            )


def main():
    """Main execution function"""
    logger.info("="*70)
    logger.info("EQUIPMENT DATA IMPORT")
    logger.info("="*70)
    logger.info("")
    
    importer = EquipmentDataImporter()
    
    # Import all equipment data
    total_records = importer.import_all_equipment()
    
    logger.info("")
    logger.info("="*70)
    logger.info("IMPORT SUMMARY")
    logger.info("="*70)
    logger.info(f"Total records imported: {total_records}")
    logger.info("="*70)
    logger.info("")
    
    if total_records > 0:
        logger.info("✓ Equipment data imported successfully!")
        logger.info("")
        logger.info("Next step: Run 06_calculate_equipment_quality.py to calculate quality scores")
    else:
        logger.warning("⚠️  No equipment records imported")
        logger.warning("Check that CSV files exist in preprocessing/cache/equipment/")


if __name__ == '__main__':
    main()

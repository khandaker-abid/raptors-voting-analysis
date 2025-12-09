#!/usr/bin/env python3
"""
Prepro-6c: Import Equipment Make/Model Details

This script imports the detailed equipment section (make/model/manufacturer)
from VerifiedVoting CSV files. This is section 2 of the CSV which contains
the actual voting machine specifications.

Data imported:
- Equipment Type (Scanner, BMD, etc.)
- Manufacturer (ES&S, Dominion, etc.)
- Model (DS200, ExpressVote, etc.)
- First Year in Use
- Usage details (Election Day, Early Voting, Mail)
"""

import sys
import logging
import csv
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict

sys.path.append(str(Path(__file__).parent))

from utils.database import DatabaseManager, load_config

logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')
logger = logging.getLogger(__name__)


class EquipmentDetailsImporter:
    """Import detailed equipment make/model data from VerifiedVoting CSV files"""
    
    def __init__(self, config_path='config.json'):
        self.db = DatabaseManager(config_path)
        self.config = load_config(config_path)
        self.cache_dir = Path(self.config['processing']['cacheDir']) / 'equipment'
        
        self.detailed_states = self.config['detailedStates']['stateAbbrs']
        self.years = [2016, 2020, 2024]
        self.equipment_types = ['standard', 'accessible']
        
        logger.info("Equipment Details Importer initialized")
        logger.info(f"States: {', '.join(self.detailed_states)}")
        logger.info(f"Years: {', '.join(map(str, self.years))}")
    
    def import_all_equipment_details(self) -> int:
        """Import all equipment detail data from CSV files"""
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
                    records = self.parse_equipment_details(filepath, state_abbr, year, equipment_type)
                    
                    if records:
                        self.store_equipment_details(records)
                        total_records += len(records)
                        logger.info(f"  ✓ Imported {len(records)} equipment detail records")
                    else:
                        logger.info(f"  No equipment details found in {filename}")
        
        return total_records
    
    def parse_equipment_details(self, filepath: Path, state_abbr: str, year: int, equipment_type: str) -> List[Dict]:
        """Parse equipment details section from VerifiedVoting CSV"""
        records = []
        in_equipment_section = False
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                
                for row in reader:
                    if not row or not any(row):
                        continue
                    
                    if 'Equipment Type' in str(row) or 'Manufacturer' in str(row):
                        columns = [col.strip() for col in row if col]
                        in_equipment_section = True
                        logger.info(f"  Found equipment details section with {len(columns)} columns")
                        break
                
                if not in_equipment_section:
                    return records
                
                for row in reader:
                    if not row or not any(row):
                        continue
                    
                    row_dict = {}
                    for i, value in enumerate(row):
                        if i < len(columns):
                            row_dict[columns[i]] = value.strip() if value else ''
                    
                    equipment_type_val = row_dict.get('Equipment Type', '')
                    manufacturer = row_dict.get('Manufacturer', '')
                    model = row_dict.get('Model', '')
                    
                    if not equipment_type_val and not manufacturer:
                        continue
                    
                    if any(term in equipment_type_val for term in ['Internet Voting', 'Electronic Poll Book']):
                        continue  # Skip internet voting and poll books
                    
                    jurisdiction = row_dict.get('Jurisdiction', '')
                    fips_code = row_dict.get('FIPS code', '')
                    
                    record = {
                        'stateAbbr': state_abbr,
                        'year': year,
                        'dataSource': 'VerifiedVoting.org',
                        'recordType': 'equipment_detail',
                        'lastUpdated': datetime.now(timezone.utc),
                    }
                    
                    if jurisdiction:
                        record['jurisdiction'] = jurisdiction
                    if fips_code:
                        record['fipsCode'] = fips_code
                    
                    if equipment_type_val:
                        record['equipmentType'] = equipment_type_val
                    if manufacturer:
                        record['manufacturer'] = manufacturer
                    if model:
                        record['model'] = model
                    
                    first_year = row_dict.get('First Year in Use', '')
                    if first_year and first_year.isdigit():
                        record['firstYearInUse'] = int(first_year)
                        record['age'] = year - int(first_year)
                    
                    usage_details = {}
                    for field in ['Election Day Standard', 'Election Day Accessible', 
                                  'Early Voting Standard', 'Early Voting Accessible',
                                  'Mail Ballot/Absentee Equipment']:
                        if field in row_dict and row_dict[field]:
                            usage_details[field] = row_dict[field]
                    
                    if usage_details:
                        record['usageDetails'] = usage_details
                    
                    details = {}
                    for key, value in row_dict.items():
                        if key not in ['FIPS code', 'State', 'Jurisdiction', 'Equipment Type', 
                                       'Manufacturer', 'Model', 'First Year in Use'] and value:
                            details[key] = value
                    
                    if details:
                        record['additionalDetails'] = details
                    
                    records.append(record)
                    
        except Exception as e:
            logger.error(f"Error parsing equipment details from {filepath.name}: {e}")
        
        return records
    
    def store_equipment_details(self, records: List[Dict]):
        """Store equipment detail records in database"""
        for record in records:
            query = {
                'stateAbbr': record['stateAbbr'],
                'year': record['year'],
                'recordType': 'equipment_detail',
            }
            
            if 'manufacturer' in record:
                query['manufacturer'] = record['manufacturer']
            if 'model' in record:
                query['model'] = record['model']
            if 'jurisdiction' in record:
                query['jurisdiction'] = record['jurisdiction']
            
            self.db.upsert_one(
                'votingEquipmentDetails',  # Different collection
                query,
                record
            )


def main():
    """Main execution function"""
    logger.info("="*70)
    logger.info("EQUIPMENT DETAILS IMPORT (Make/Model)")
    logger.info("="*70)
    logger.info("")
    
    importer = EquipmentDetailsImporter()
    
    total_records = importer.import_all_equipment_details()
    
    logger.info("")
    logger.info("="*70)
    logger.info("IMPORT SUMMARY")
    logger.info("="*70)
    logger.info(f"Total equipment detail records imported: {total_records}")
    logger.info("="*70)
    logger.info("")
    
    if total_records > 0:
        logger.info("✓ Equipment details imported successfully!")
        logger.info("")
        logger.info("Equipment details stored in 'votingEquipmentDetails' collection")
    else:
        logger.warning("⚠️  No equipment detail records imported")
        logger.warning("This may be normal for states without detailed equipment data")


if __name__ == '__main__':
    main()

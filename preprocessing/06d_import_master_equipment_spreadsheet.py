#!/usr/bin/env python3
"""
Prepro-6d: Import Master Equipment Spreadsheet

This script imports equipment specifications from the master CSE416 equipment
spreadsheet that contains data from all teams for all states.

Data imported:
- Manufacturer
- Equipment Type
- Model Name
- Manufacturing dates
- OS and Firmware
- Battery Life
- Scanning Rate
- VVPAT support
- Paper Capacity
- Certification Level
- Security Risks
- Discontinued status
"""

import sys
import logging
import csv
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict, Optional

sys.path.append(str(Path(__file__).parent))

from utils.database import DatabaseManager, load_config

logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')
logger = logging.getLogger(__name__)


class MasterEquipmentImporter:
    """Import master equipment spreadsheet data"""
    
    def __init__(self, config_path='config.json'):
        self.db = DatabaseManager(config_path)
        self.config = load_config(config_path)
        self.cache_dir = Path(self.config['processing']['cacheDir']) / 'equipment'
        
        logger.info("Master Equipment Importer initialized")
    
    def normalize_value(self, value: str) -> Optional[str]:
        """Normalize CSV values, converting empty strings and N/A to None"""
        if not value or value.strip() in ['', 'N/A', 'n/a', 'NA']:
            return None
        return value.strip()
    
    def parse_battery_life(self, value: str) -> Optional[int]:
        """Parse battery life to hours (int)"""
        if not value or value.strip() in ['', 'N/A', 'Device Reliant', 'AC-powered', 
                                           'Connected  to UPS', 'Connected AC/UPS',
                                           'Mobile', 'iPad Battery', 'Apple iPad battery',
                                           'Internal battery']:
            return None
        
        try:
            # Handle negative values (indicates AC-powered)
            val = int(value)
            return val if val > 0 else None
        except ValueError:
            # Handle "X hours" format
            if 'hour' in value.lower():
                try:
                    return int(value.split()[0])
                except (ValueError, IndexError):
                    return None
            return None
    
    def parse_scanning_rate(self, value: str) -> Optional[int]:
        """Parse scanning rate to ballots per minute (int)"""
        if not value or value.strip() in ['', 'N/A', 'Hand-fed', 'Highspeed', 
                                           'High-speed', 'N/A (for ID)',
                                           'Online ballot']:
            return None
        
        try:
            # Handle pure numbers
            return int(float(value))
        except ValueError:
            # Handle "X ballots/min" format
            if 'ballot' in value.lower():
                try:
                    return int(value.split()[0].replace('-', ''))
                except (ValueError, IndexError):
                    return None
            return None
    
    def parse_paper_capacity(self, value: str) -> Optional[int]:
        """Parse paper capacity to number of ballots (int)"""
        if not value or value.strip() in ['', 'N/A', 'Hand-fed', '1 / Hand-fed',
                                           'N/A', 'Online']:
            return None
        
        try:
            # Handle pure numbers
            val = int(float(value))
            return val if val > 0 else None
        except ValueError:
            # Handle "X ballots" format
            if 'ballot' in value.lower():
                try:
                    return int(value.split()[0])
                except (ValueError, IndexError):
                    return None
            return None
    
    def parse_boolean(self, value: str) -> Optional[bool]:
        """Parse boolean values"""
        if not value or value.strip() == '':
            return None
        
        value_lower = value.strip().upper()
        if value_lower in ['TRUE', 'YES', 'Y', 'OPTIONAL / TRUE']:
            return True
        elif value_lower in ['FALSE', 'NO', 'N']:
            return False
        return None
    
    def parse_year(self, value: str) -> Optional[int]:
        """Parse year values"""
        if not value or value.strip() in ['', 'N/A']:
            return None
        
        try:
            # Handle dates like "6/30/2015"
            if '/' in value:
                return int(value.split('/')[-1])
            return int(value)
        except (ValueError, IndexError):
            return None
    
    def import_master_spreadsheet(self, csv_path: Path) -> int:
        """Import master equipment spreadsheet"""
        
        if not csv_path.exists():
            logger.error(f"Master spreadsheet not found: {csv_path}")
            return 0
        
        logger.info(f"\nImporting master equipment spreadsheet: {csv_path}")
        
        equipment_records = []
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                manufacturer = self.normalize_value(row.get('Manufacturer'))
                model = self.normalize_value(row.get('Model Name'))
                
                # Skip rows without manufacturer or model
                if not manufacturer or not model:
                    continue
                
                # Create equipment specification record
                record = {
                    'manufacturer': manufacturer,
                    'equipmentType': self.normalize_value(row.get('Equipment Type')),
                    'model': model,
                    'firstManufactured': self.parse_year(row.get('First Manufactured')),
                    'lastManufactured': self.parse_year(row.get('Last Manufactured')),
                    'os': self.normalize_value(row.get('OS')),
                    'firmwareVersion': self.normalize_value(row.get('Firmware Version')),
                    'batteryLife': self.parse_battery_life(row.get('Battery Life', '')),
                    'scanningRate': self.parse_scanning_rate(row.get('Scanning Rate', '')),
                    'vvpat': self.parse_boolean(row.get('VVPAT?', '')),
                    'paperCapacity': self.parse_paper_capacity(row.get('Paper Capacity', '')),
                    'certificationLevel': self.normalize_value(row.get('Certification Level')),
                    'securityRisks': self.normalize_value(row.get('Security Risks')),
                    'notes': self.normalize_value(row.get('Notes/Misc.')),
                    'discontinued': self.parse_boolean(row.get('Discontinued', 'FALSE')) or False,
                    'teamContributor': self.normalize_value(row.get('Team that added')),
                    'dataSource': 'master_spreadsheet',
                    'lastUpdated': datetime.now(timezone.utc)
                }
                
                equipment_records.append(record)
        
        if not equipment_records:
            logger.warning("No equipment records found in spreadsheet")
            return 0
        
        # Store in database - use a new collection for master equipment specs
        collection = 'equipmentSpecifications'
        
        # Clear existing master spreadsheet data
        self.db.delete_many(collection, {'dataSource': 'master_spreadsheet'})
        
        # Insert new records
        result = self.db.insert_many(collection, equipment_records)
        
        logger.info(f"\n✓ Imported {len(equipment_records)} equipment specifications")
        
        # Summary statistics
        manufacturers = set(r['manufacturer'] for r in equipment_records)
        equipment_types = set(r['equipmentType'] for r in equipment_records if r['equipmentType'])
        discontinued_count = sum(1 for r in equipment_records if r['discontinued'])
        
        logger.info(f"\nSummary:")
        logger.info(f"  Manufacturers: {len(manufacturers)}")
        logger.info(f"  Equipment Types: {len(equipment_types)}")
        logger.info(f"  Discontinued: {discontinued_count}/{len(equipment_records)}")
        logger.info(f"  Active: {len(equipment_records) - discontinued_count}/{len(equipment_records)}")
        
        return len(equipment_records)


def main():
    logger.info("="*70)
    logger.info("MASTER EQUIPMENT SPREADSHEET IMPORT")
    logger.info("="*70)
    logger.info("")
    
    importer = MasterEquipmentImporter()
    
    # Master equipment specifications CSV path
    # Try data/ first (committed), then cache/ (local)
    csv_path = Path(__file__).parent / 'data' / 'master_equipment_specs.csv'
    if not csv_path.exists():
        csv_path = Path(__file__).parent / 'cache' / 'equipment' / 'master_equipment_specs.csv'
    
    if not csv_path.exists():
        logger.error(f"Spreadsheet not found in data/ or cache/equipment/")
        logger.error("Please ensure the master equipment spreadsheet is in preprocessing/data/")
        return
    
    total = importer.import_master_spreadsheet(csv_path)
    
    logger.info("")
    logger.info("="*70)
    logger.info("IMPORT SUMMARY")
    logger.info("="*70)
    logger.info(f"Total records imported: {total}")
    logger.info("="*70)
    logger.info("")
    logger.info("✓ Master equipment spreadsheet import complete!")
    logger.info("")
    logger.info("Next step: Match equipment in votingEquipmentData with specifications")


if __name__ == "__main__":
    main()

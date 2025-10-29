#!/usr/bin/env python3
"""
Prepro-5b: Extract Basic Equipment Data from EAVS

This script extracts equipment presence flags from EAVS data and creates
basic equipment records. This provides the foundation for equipment quality
scoring in Prepro-6.

Note: Detailed equipment data (make, model, age, OS) would need to be scraped
from Verified Voting or EAC websites separately.
"""
import sys
import logging
from pathlib import Path
from collections import defaultdict

# Add utils to path
sys.path.append(str(Path(__file__).parent))

from utils.database import DatabaseManager

logging.basicConfig(level=logging.INFO, format='INFO:%(name)s:%(message)s')
logger = logging.getLogger(__name__)


EQUIPMENT_TYPES = {
    'F3a': 'DRE no VVPAT',
    'F4a': 'DRE with VVPAT',
    'F5a': 'Ballot Marking Device',
    'F6a': 'Scanner'
}


class EquipmentExtractor:
    """Extracts equipment data from EAVS records"""
    
    def __init__(self, config_path='config.json'):
        self.db = DatabaseManager(config_path)
    
    def extract_equipment_from_eavs(self):
        """
        Extract equipment presence data from EAVS records
        Creates votingEquipmentData collection with basic equipment info
        """
        logger.info("Extracting equipment data from EAVS records...")
        
        # Get all EAVS records
        eavs_records = self.db.find_many('eavsData')
        total = len(eavs_records)
        
        if total == 0:
            logger.warning("No EAVS records found")
            return 0
        
        logger.info(f"Processing {total:,} EAVS records...")
        
        # Group by state and year
        state_equipment = defaultdict(lambda: defaultdict(lambda: {
            'dreNoVVPAT': 0,
            'dreWithVVPAT': 0,
            'ballotMarkingDevice': 0,
            'scanner': 0,
            'jurisdictions': []
        }))
        
        for record in eavs_records:
            state_full = record.get('stateFull', 'Unknown')
            state_abbr = record.get('stateAbbr', 'Unknown')
            year = record.get('year', 0)
            jurisdiction = record.get('jurisdictionName', 'Unknown')
            fips = record.get('fipsCode', '')
            
            # Count equipment types
            if record.get('F3a'):  # DRE no VVPAT
                state_equipment[(state_full, state_abbr)][year]['dreNoVVPAT'] += 1
            if record.get('F4a'):  # DRE with VVPAT
                state_equipment[(state_full, state_abbr)][year]['dreWithVVPAT'] += 1
            if record.get('F5a'):  # BMD
                state_equipment[(state_full, state_abbr)][year]['ballotMarkingDevice'] += 1
            if record.get('F6a'):  # Scanner
                state_equipment[(state_full, state_abbr)][year]['scanner'] += 1
            
            # Track jurisdictions
            state_equipment[(state_full, state_abbr)][year]['jurisdictions'].append({
                'name': jurisdiction,
                'fips': fips,
                'equipment': {
                    'dreNoVVPAT': bool(record.get('F3a')),
                    'dreWithVVPAT': bool(record.get('F4a')),
                    'ballotMarkingDevice': bool(record.get('F5a')),
                    'scanner': bool(record.get('F6a'))
                }
            })
        
        # Create equipment records
        equipment_records = []
        
        for (state_full, state_abbr), years in state_equipment.items():
            for year, data in years.items():
                # Create summary record for this state-year
                record = {
                    'state': state_full,
                    'stateAbbr': state_abbr,
                    'year': year,
                    'equipmentSummary': {
                        'dreNoVVPAT': data['dreNoVVPAT'],
                        'dreWithVVPAT': data['dreWithVVPAT'],
                        'ballotMarkingDevice': data['ballotMarkingDevice'],
                        'scanner': data['scanner']
                    },
                    'jurisdictions': data['jurisdictions'],
                    # Default equipment details (would need external source for real data)
                    'equipmentDetails': self._create_default_equipment_details(data),
                    'dataSource': 'EAVS',
                    'dataNote': 'Equipment presence only; detailed specs would require Verified Voting data'
                }
                
                equipment_records.append(record)
        
        # Store in database
        if equipment_records:
            logger.info(f"\nStoring {len(equipment_records):,} equipment records...")
            
            # Check if data already exists
            existing_count = self.db.count_documents('votingEquipmentData')
            
            if existing_count > 0:
                logger.info(f"Found {existing_count:,} existing equipment records")
                logger.info("Checking if update is needed...")
                
                # Sample check
                sample = equipment_records[0]
                existing = self.db.find_one(
                    'votingEquipmentData',
                    {'state': sample['state'], 'year': sample['year']}
                )
                
                if existing and existing.get('equipmentSummary') == sample['equipmentSummary']:
                    logger.info("✓ Equipment data is up-to-date - skipping upsert")
                    return existing_count
            
            # Bulk upsert - need to create composite key for state+year
            from pymongo import UpdateOne
            collection = self.db.get_collection('votingEquipmentData')
            
            operations = [
                UpdateOne(
                    {'state': rec['state'], 'year': rec['year']},
                    {'$set': rec},
                    upsert=True
                )
                for rec in equipment_records
            ]
            
            if operations:
                result = collection.bulk_write(operations, ordered=False)
                modified_count = result.modified_count + result.upserted_count
                logger.info(f"Bulk upserted {modified_count} documents into votingEquipmentData")
            logger.info(f"✓ Stored {len(equipment_records):,} equipment records")
        
        # Summary
        logger.info("\n" + "="*70)
        logger.info("EQUIPMENT EXTRACTION SUMMARY")
        logger.info("="*70)
        logger.info(f"Total equipment records created: {len(equipment_records):,}")
        logger.info(f"States covered: {len(state_equipment)}")
        logger.info(f"Years covered: {sorted(set(year for _, years in state_equipment.items() for year in years))}")
        logger.info("="*70)
        
        return len(equipment_records)
    
    def _create_default_equipment_details(self, data):
        """
        Create default equipment detail entries
        
        Note: Real implementation would scrape Verified Voting for:
        - Make and model
        - Age/purchase year
        - Operating system
        - Certification status
        - Performance metrics
        """
        details = []
        
        # Create placeholder entries for each equipment type present
        if data['dreNoVVPAT'] > 0:
            details.append({
                'equipmentType': 'DRE no VVPAT',
                'quantity': data['dreNoVVPAT'],
                'makeAndModel': 'Unknown (requires Verified Voting data)',
                'yearAcquired': None,
                'operatingSystem': 'Unknown',
                'certificationStatus': 'Unknown',
                'malfunctionsReported': 0,
                'ballotsRejected': 0,
                'totalBallotsProcessed': 1
            })
        
        if data['dreWithVVPAT'] > 0:
            details.append({
                'equipmentType': 'DRE with VVPAT',
                'quantity': data['dreWithVVPAT'],
                'makeAndModel': 'Unknown (requires Verified Voting data)',
                'yearAcquired': None,
                'operatingSystem': 'Unknown',
                'certificationStatus': 'Unknown',
                'malfunctionsReported': 0,
                'ballotsRejected': 0,
                'totalBallotsProcessed': 1
            })
        
        if data['ballotMarkingDevice'] > 0:
            details.append({
                'equipmentType': 'Ballot Marking Device',
                'quantity': data['ballotMarkingDevice'],
                'makeAndModel': 'Unknown (requires Verified Voting data)',
                'yearAcquired': None,
                'operatingSystem': 'Unknown',
                'certificationStatus': 'Unknown',
                'malfunctionsReported': 0,
                'ballotsRejected': 0,
                'totalBallotsProcessed': 1
            })
        
        if data['scanner'] > 0:
            details.append({
                'equipmentType': 'Scanner',
                'quantity': data['scanner'],
                'makeAndModel': 'Unknown (requires Verified Voting data)',
                'yearAcquired': None,
                'operatingSystem': 'Unknown',
                'certificationStatus': 'Unknown',
                'malfunctionsReported': 0,
                'ballotsRejected': 0,
                'totalBallotsProcessed': 1
            })
        
        return details


def main():
    """Main execution"""
    try:
        extractor = EquipmentExtractor()
        count = extractor.extract_equipment_from_eavs()
        
        if count > 0:
            logger.info(f"\n✓ Successfully extracted {count:,} equipment records from EAVS!")
            logger.info("\nNext step: Run 06_calculate_equipment_quality.py")
            logger.info("\nNote: Equipment quality scores will be basic without detailed specs.")
            logger.info("For production use, consider scraping Verified Voting for:")
            logger.info("  - Equipment make/model")
            logger.info("  - Purchase year/age")
            logger.info("  - Operating system details")
            logger.info("  - Certification status")
        else:
            logger.warning("\n⚠ No equipment records extracted")
        
    except Exception as e:
        logger.error(f"Error extracting equipment: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()

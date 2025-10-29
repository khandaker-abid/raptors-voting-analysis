#!/usr/bin/env python3
"""
Prepro-5: Calculate Data Completeness Score for EAVS Data

This script calculates a data completeness score (0-1) for each EAVS record
based on how many required fields have non-null values.
"""
import sys
import logging
from pathlib import Path

# Add utils to path
sys.path.append(str(Path(__file__).parent))

from utils.database import DatabaseManager

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# Required fields for GUI use cases - weighted by importance
REQUIRED_FIELDS = {
    # Critical fields (high weight)
    'A1a': 2.0,  # Total Registered
    'A1b': 2.0,  # Active
    'A1c': 2.0,  # Inactive
    
    # Important fields (medium weight)
    'E1a': 1.5,  # Provisional Ballots Cast
    'C9a': 1.5,  # Mail Ballots Rejected
    'F1a': 1.5,  # Total Voters
    
    # Standard fields (normal weight)
    'E2a': 1.0, 'E2b': 1.0, 'E2c': 1.0, 'E2d': 1.0, 'E2e': 1.0,
    'E2f': 1.0, 'E2g': 1.0, 'E2h': 1.0, 'E2i': 1.0,
    
    'C9b': 1.0, 'C9c': 1.0, 'C9d': 1.0, 'C9e': 1.0, 'C9f': 1.0,
    'C9g': 1.0, 'C9h': 1.0, 'C9i': 1.0, 'C9j': 1.0, 'C9k': 1.0,
    'C9l': 1.0, 'C9m': 1.0, 'C9n': 1.0, 'C9o': 1.0, 'C9p': 1.0, 'C9q': 1.0,
    
    'A12b': 1.0, 'A12c': 1.0, 'A12d': 1.0, 'A12e': 1.0,
    'A12f': 1.0, 'A12g': 1.0, 'A12h': 1.0,
    
    'F3a': 1.0, 'F4a': 1.0, 'F5a': 1.0, 'F6a': 1.0,
    'C3a': 1.0, 'F1b': 1.0, 'F1c': 1.0, 'F1d': 1.0,
    'F1e': 1.0, 'F1f': 1.0, 'B24a': 1.0, 'E1d': 1.0,
}


class DataCompletenessCalculator:
    """Calculates data completeness scores"""
    
    def __init__(self, config_path='config.json'):
        self.db = DatabaseManager(config_path)
    
    def calculate_completeness_score(self, record: dict) -> dict:
        """
        Calculate completeness score for a record
        
        Returns dict with score and details
        """
        total_weight = sum(REQUIRED_FIELDS.values())
        achieved_weight = 0
        missing_count = 0
        
        for field, weight in REQUIRED_FIELDS.items():
            value = record.get(field)
            
            # Consider field complete if it has a non-null value
            if value is not None:
                achieved_weight += weight
            else:
                missing_count += 1
        
        # Calculate score (0-1)
        score = achieved_weight / total_weight if total_weight > 0 else 0
        
        return {
            'dataCompletenessScore': round(score, 4),
            'missingFieldCount': missing_count,
            'totalFieldCount': len(REQUIRED_FIELDS)
        }
    
    def process_all_records(self):
        """Process all EAVS records and update completeness scores"""
        logger.info("Calculating data completeness scores...")
        
        # Get all EAVS records
        records = self.db.find_many('eavsData')
        total = len(records)
        
        if total == 0:
            logger.warning("No EAVS records found in database")
            return 0
        
        logger.info(f"Processing {total:,} records...")
        
        updated = 0
        score_distribution = {
            '0.0-0.2': 0,
            '0.2-0.4': 0,
            '0.4-0.6': 0,
            '0.6-0.8': 0,
            '0.8-1.0': 0
        }
        
        for i, record in enumerate(records):
            # Calculate score
            score_data = self.calculate_completeness_score(record)
            
            # Track distribution
            score = score_data['dataCompletenessScore']
            if score < 0.2:
                score_distribution['0.0-0.2'] += 1
            elif score < 0.4:
                score_distribution['0.2-0.4'] += 1
            elif score < 0.6:
                score_distribution['0.4-0.6'] += 1
            elif score < 0.8:
                score_distribution['0.6-0.8'] += 1
            else:
                score_distribution['0.8-1.0'] += 1
            
            # Update record
            self.db.upsert_one(
                'eavsData',
                {'_id': record['_id']},
                score_data
            )
            
            updated += 1
            
            if (i + 1) % 1000 == 0:
                logger.info(f"  Processed {i + 1:,}/{total:,} records...")
        
        # Summary
        logger.info("\n" + "="*70)
        logger.info("DATA COMPLETENESS SUMMARY")
        logger.info("="*70)
        logger.info(f"Total records processed: {updated:,}")
        logger.info("\nScore Distribution:")
        for range_name, count in score_distribution.items():
            pct = (count / total * 100) if total > 0 else 0
            logger.info(f"  {range_name}: {count:,} records ({pct:.1f}%)")
        logger.info("="*70)
        
        return updated


def main():
    """Main execution"""
    try:
        calculator = DataCompletenessCalculator()
        count = calculator.process_all_records()
        
        if count > 0:
            logger.info(f"\n✓ Successfully calculated completeness for {count:,} records!")
            logger.info("Next step: Run 06_calculate_equipment_quality.py")
        else:
            logger.warning("\n⚠ No records processed")
        
    except Exception as e:
        logger.error(f"Error calculating completeness: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()

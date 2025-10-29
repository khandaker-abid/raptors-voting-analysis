#!/usr/bin/env python3
"""
Prepro-6: Calculate Equipment Quality Score

This script calculates a quality score for voting equipment based on:
- Age (40%): How recent is the equipment
- Certification status (30%): Is it certified
- OS/Software (15%): Is the OS up to date
- Performance factors (15%): Rejection rates, malfunctions, etc.
"""
import sys
import logging
from pathlib import Path
from datetime import datetime

# Add utils to path
sys.path.append(str(Path(__file__).parent))

from utils.database import DatabaseManager

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# Scoring weights
WEIGHT_AGE = 0.40
WEIGHT_CERTIFICATION = 0.30
WEIGHT_OS = 0.15
WEIGHT_PERFORMANCE = 0.15

# Equipment type expected lifespans (years)
EXPECTED_LIFESPANS = {
    'DRE': 10,
    'Optical Scan': 15,
    'BMD': 10,
    'VVPAT': 8,
    'EMS': 12,
    'Other': 10
}

CURRENT_YEAR = datetime.now().year


class EquipmentQualityCalculator:
    """Calculates quality scores for voting equipment"""
    
    def __init__(self, config_path='config.json'):
        self.db = DatabaseManager(config_path)
    
    def calculate_age_score(self, year_acquired: int, equipment_type: str) -> float:
        """
        Calculate age score (0-1)
        Newer equipment gets higher scores
        """
        if not year_acquired or year_acquired < 1990:
            return 0.0
        
        age = CURRENT_YEAR - year_acquired
        lifespan = EXPECTED_LIFESPANS.get(equipment_type, 10)
        
        # Score decreases linearly as equipment ages
        # 0 years old = 1.0, lifespan years old = 0.0
        score = max(0.0, 1.0 - (age / (lifespan * 1.5)))
        
        return round(score, 3)
    
    def calculate_certification_score(self, certification_status: str) -> float:
        """
        Calculate certification score (0-1)
        """
        status_map = {
            'Federally certified': 1.0,
            'State certified': 0.85,
            'Conditionally certified': 0.6,
            'Provisionally certified': 0.5,
            'Not certified': 0.0,
            'Expired certification': 0.2,
            'Unknown': 0.3
        }
        
        return status_map.get(certification_status, 0.3)
    
    def calculate_os_score(self, os_info: str) -> float:
        """
        Calculate OS/software score (0-1)
        """
        if not os_info:
            return 0.5  # Unknown
        
        os_lower = os_info.lower()
        
        # Modern, supported OS
        if any(x in os_lower for x in ['windows 10', 'windows 11', 'linux 5', 'linux 6', 'ubuntu 20', 'ubuntu 22']):
            return 1.0
        
        # Older but still supported
        if any(x in os_lower for x in ['windows 8', 'windows 7', 'linux 4', 'ubuntu 18']):
            return 0.7
        
        # Legacy/unsupported
        if any(x in os_lower for x in ['windows xp', 'windows vista', 'windows 2000', 'linux 3']):
            return 0.3
        
        # Unknown/proprietary
        return 0.5
    
    def calculate_performance_score(self, record: dict) -> float:
        """
        Calculate performance score based on malfunction/rejection data
        """
        score = 1.0
        
        # Get performance indicators (if available)
        malfunctions = record.get('malfunctionsReported', 0)
        rejected_ballots = record.get('ballotsRejected', 0)
        total_usage = record.get('totalBallotsProcessed', 1)
        
        # Malfunction penalty
        if malfunctions > 0:
            malfunction_rate = malfunctions / 100  # per 100 units
            score -= min(0.5, malfunction_rate * 0.1)
        
        # Rejection rate penalty
        if rejected_ballots > 0 and total_usage > 0:
            rejection_rate = rejected_ballots / total_usage
            if rejection_rate > 0.02:  # More than 2% rejection
                score -= min(0.3, (rejection_rate - 0.02) * 10)
        
        return max(0.0, round(score, 3))
    
    def calculate_quality_score(self, record: dict) -> dict:
        """
        Calculate overall quality score
        
        Returns dict with score and component scores
        """
        # Extract fields
        year_acquired = record.get('yearAcquired', 0)
        equipment_type = record.get('equipmentType', 'Other')
        certification = record.get('certificationStatus', 'Unknown')
        os_info = record.get('operatingSystem', '')
        
        # Calculate component scores
        age_score = self.calculate_age_score(year_acquired, equipment_type)
        cert_score = self.calculate_certification_score(certification)
        os_score = self.calculate_os_score(os_info)
        perf_score = self.calculate_performance_score(record)
        
        # Weighted average
        quality_score = (
            age_score * WEIGHT_AGE +
            cert_score * WEIGHT_CERTIFICATION +
            os_score * WEIGHT_OS +
            perf_score * WEIGHT_PERFORMANCE
        )
        
        return {
            'qualityScore': round(quality_score, 4),
            'componentScores': {
                'age': age_score,
                'certification': cert_score,
                'operatingSystem': os_score,
                'performance': perf_score
            }
        }
    
    def process_all_equipment(self):
        """Process all equipment records and update quality scores"""
        logger.info("Calculating equipment quality scores...")
        
        # Get all equipment records
        records = self.db.find_many('votingEquipmentData')
        total = len(records)
        
        if total == 0:
            logger.warning("No equipment records found in database")
            logger.info("\nTo create equipment records, run: 05b_extract_equipment_from_eavs.py")
            return 0
        
        logger.info(f"Processing {total:,} equipment records...")
        
        # Count how many have detailed equipment data
        detailed_count = sum(1 for r in records if r.get('equipmentDetails'))
        if detailed_count == 0:
            logger.warning(f"Found {total} equipment records but none have detailed specs")
            logger.warning("Quality scores will be based on limited data from EAVS")
            logger.info("For better quality scores, consider scraping Verified Voting database")
        
        updated = 0
        score_distribution = {
            'Excellent (0.8-1.0)': 0,
            'Good (0.6-0.8)': 0,
            'Fair (0.4-0.6)': 0,
            'Poor (0.2-0.4)': 0,
            'Critical (0.0-0.2)': 0
        }
        
        for i, record in enumerate(records):
            # Check if this is old EAVS format (equipmentDetails is a list)
            # or new VerifiedVoting format (equipment info in root)
            equipment_details = record.get('equipmentDetails', [])
            
            # Skip VerifiedVoting records for now (they have dict equipmentDetails)
            # Quality scoring for VerifiedVoting format would need different logic
            if isinstance(equipment_details, dict):
                # This is a VerifiedVoting record, skip for now
                continue
            
            if not equipment_details or not isinstance(equipment_details, list):
                # No detailed equipment in this record, skip
                continue
            
            # Calculate scores for each equipment item (EAVS format only)
            for equipment in equipment_details:
                # Skip if equipment is not a dict (defensive check)
                if not isinstance(equipment, dict):
                    continue
                    
                # Calculate score
                score_data = self.calculate_quality_score(equipment)
                
                # Track distribution
                score = score_data['qualityScore']
                if score >= 0.8:
                    score_distribution['Excellent (0.8-1.0)'] += 1
                elif score >= 0.6:
                    score_distribution['Good (0.6-0.8)'] += 1
                elif score >= 0.4:
                    score_distribution['Fair (0.4-0.6)'] += 1
                elif score >= 0.2:
                    score_distribution['Poor (0.2-0.4)'] += 1
                else:
                    score_distribution['Critical (0.0-0.2)'] += 1
                
                # Update equipment item with scores
                equipment.update(score_data)
            
            # Update the entire record with scored equipment details
            self.db.upsert_one(
                'votingEquipmentData',
                {'_id': record['_id']},
                {'equipmentDetails': equipment_details}
            )
            
            updated += 1
            
            if (i + 1) % 10 == 0:
                logger.info(f"  Processed {i + 1:,}/{total:,} records...")

        
        # Summary
        logger.info("\n" + "="*70)
        logger.info("EQUIPMENT QUALITY SUMMARY")
        logger.info("="*70)
        logger.info(f"Total equipment processed: {updated:,}")
        logger.info("\nQuality Distribution:")
        for category, count in score_distribution.items():
            pct = (count / total * 100) if total > 0 else 0
            logger.info(f"  {category}: {count:,} ({pct:.1f}%)")
        logger.info("="*70)
        
        return updated


def main():
    """Main execution"""
    try:
        calculator = EquipmentQualityCalculator()
        count = calculator.process_all_equipment()
        
        if count > 0:
            logger.info(f"\n✓ Successfully calculated quality for {count:,} equipment records!")
            logger.info("Next step: Run 07_download_voter_registration.py")
        else:
            logger.warning("\n⚠ No records processed")
        
    except Exception as e:
        logger.error(f"Error calculating quality: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()

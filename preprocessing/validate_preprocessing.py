#!/usr/bin/env python3
"""
Validation script for preprocessing data

Checks that all required data has been properly loaded into MongoDB
"""
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent))

from utils.database import DatabaseManager
import logging

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)


def validate_preprocessing():
    """Validate all preprocessing data"""
    db = DatabaseManager()
    
    validation_results = {
        'passed': [],
        'failed': [],
        'warnings': []
    }
    
    logger.info("="*70)
    logger.info("PREPROCESSING DATA VALIDATION")
    logger.info("="*70)
    
    collections_to_check = {
        'boundaryData': {
            'min_count': 48,
            'description': 'State boundaries (Prepro-1)',
            'required_fields': ['fipsCode', 'state', 'boundaryData', 'centerPoint']
        },
        'felonyVotingData': {
            'min_count': 48,
            'description': 'Felony voting policies (Prepro-13)',
            'required_fields': ['stateAbbr', 'felonyVotingPolicy']
        },
        'eavsData': {
            'min_count': 100,
            'description': 'EAVS data (Prepro-2/3)',
            'required_fields': ['year', 'fipsCode', 'stateFull'],
            'optional': True
        },
        'votingEquipmentData': {
            'min_count': 1,
            'description': 'Voting equipment (Prepro-6)',
            'required_fields': ['state', 'year'],
            'optional': True
        },
        'demographicData': {
            'min_count': 1,
            'description': 'CVAP demographic data (Prepro-12)',
            'required_fields': ['fipsCode', 'state'],
            'optional': True
        },
        'voter_registration': {
            'min_count': 1,
            'description': 'Individual voter records (Prepro-17)',
            'required_fields': ['state', 'county', 'firstName', 'lastName', 'party'],
            'optional': False
        },
        'electionResults': {
            'min_count': 1,
            'description': 'Election results (Prepro-11)',
            'required_fields': ['electionYear', 'stateAbbr', 'county', 'results'],
            'optional': True
        }
    }
    
    for collection_name, config in collections_to_check.items():
        logger.info(f"\n--- Checking {collection_name} ---")
        
        count = db.count_documents(collection_name)
        logger.info(f"  Documents: {count}")
        
        if count == 0:
            if config.get('optional'):
                validation_results['warnings'].append(
                    f"{collection_name}: No data (optional - {config['description']})"
                )
                logger.warning(f"  ⚠️  No data found (optional)")
            else:
                validation_results['failed'].append(
                    f"{collection_name}: No data found"
                )
                logger.error(f"  ❌ No data found (REQUIRED)")
            continue
        
        if count < config['min_count']:
            if config.get('optional'):
                validation_results['warnings'].append(
                    f"{collection_name}: Only {count} documents (expected {config['min_count']}+)"
                )
                logger.warning(f"  ⚠️  Less than expected ({config['min_count']})")
            else:
                validation_results['failed'].append(
                    f"{collection_name}: Only {count} documents (expected {config['min_count']}+)"
                )
                logger.error(f"  ❌ Less than expected minimum ({config['min_count']})")
        else:
            logger.info(f"  ✅ Count OK")
        
        sample = db.find_one(collection_name, {})
        if sample:
            missing_fields = [
                field for field in config['required_fields']
                if field not in sample
            ]
            
            if missing_fields:
                validation_results['failed'].append(
                    f"{collection_name}: Missing fields: {', '.join(missing_fields)}"
                )
                logger.error(f"  ❌ Missing required fields: {', '.join(missing_fields)}")
            else:
                logger.info(f"  ✅ Required fields present")
                validation_results['passed'].append(f"{collection_name}: OK")
    
    logger.info(f"\n--- Special Validations ---")
    
    eavs_with_scores = db.count_documents('eavsData', {'dataCompletenessScore': {'$exists': True}})
    eavs_total = db.count_documents('eavsData')
    if eavs_total > 0:
        score_pct = (eavs_with_scores / eavs_total) * 100
        logger.info(f"  EAVS records with completeness scores: {eavs_with_scores}/{eavs_total} ({score_pct:.1f}%)")
        if score_pct < 100:
            validation_results['warnings'].append(
                f"Prepro-5: Only {score_pct:.1f}% of EAVS records have completeness scores"
            )
    
    # Check equipment quality scores - supports both formats:
    # 1. EAVS format: equipmentDetails is array with qualityScore in each item
    # 2. VerifiedVoting format: qualityScore at record level
    equip_eavs_scored = db.count_documents('votingEquipmentData', {'equipmentDetails.qualityScore': {'$exists': True}})
    equip_vv_scored = db.count_documents('votingEquipmentData', {'qualityScore': {'$exists': True}})
    equip_total_scored = equip_eavs_scored + equip_vv_scored
    equip_total = db.count_documents('votingEquipmentData')
    
    if equip_total > 0:
        score_pct = (equip_total_scored / equip_total) * 100
        logger.info(f"  Equipment records with quality scores: {equip_total_scored}/{equip_total} ({score_pct:.1f}%)")
        logger.info(f"    EAVS format (list): {equip_eavs_scored}")
        logger.info(f"    VerifiedVoting format: {equip_vv_scored}")
        
        if score_pct < 50:
            validation_results['warnings'].append(
                f"Prepro-6: Only {score_pct:.1f}% of equipment records have quality scores"
            )
    
    logger.info("\n" + "="*70)
    logger.info("VALIDATION SUMMARY")
    logger.info("="*70)
    
    logger.info(f"\n✅ Passed: {len(validation_results['passed'])}")
    for item in validation_results['passed']:
        logger.info(f"  - {item}")
    
    if validation_results['warnings']:
        logger.info(f"\n⚠️  Warnings: {len(validation_results['warnings'])}")
        for item in validation_results['warnings']:
            logger.warning(f"  - {item}")
    
    if validation_results['failed']:
        logger.info(f"\n❌ Failed: {len(validation_results['failed'])}")
        for item in validation_results['failed']:
            logger.error(f"  - {item}")
        logger.info("\n❌ VALIDATION FAILED")
        return False
    else:
        logger.info("\n✅ VALIDATION PASSED")
        if validation_results['warnings']:
            logger.info("   (with warnings for optional features)")
        return True


if __name__ == '__main__':
    try:
        success = validate_preprocessing()
        sys.exit(0 if success else 1)
    except Exception as e:
        logger.error(f"Validation error: {e}", exc_info=True)
        sys.exit(1)

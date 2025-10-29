#!/usr/bin/env python3
"""
Prepro-13: Collect and store felony voting rights policies

This script adds felony voting policy data to the database for
all states, with special attention to Political Party states.
"""
import sys
import logging
from pathlib import Path
from datetime import datetime, timezone

# Add utils to path
sys.path.append(str(Path(__file__).parent))

from utils.database import DatabaseManager, load_config
from utils.data_sources import FELONY_VOTING_POLICIES

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


POLICY_DESCRIPTIONS = {
    'no denial of voting': {
        'description': 'No denial of voting rights for people with felony convictions',
        'details': 'Individuals can vote while incarcerated'
    },
    'automatic restoration upon release from prison': {
        'description': 'Voting rights automatically restored upon release from prison',
        'details': 'Rights restored immediately after completing prison sentence'
    },
    'restoration after completing parole and probation': {
        'description': 'Voting rights restored after completing parole and probation',
        'details': 'Rights restored after completing full sentence including supervision'
    },
    'additional action required for restoration': {
        'description': 'Additional action required for restoration of voting rights',
        'details': 'May require petition, waiting period, or other steps'
    }
}


class FelonyVotingDataProcessor:
    """Processes and stores felony voting policy data"""
    
    def __init__(self, config_path='config.json'):
        self.db = DatabaseManager(config_path)
        self.config = load_config(config_path)
        self.detailed_states = self.config.get('detailedStates', {})
    
    def process_felony_policies(self):
        """Process and store felony voting policies for all states"""
        documents = []
        
        # Get state name mapping
        from utils.data_sources import FELONY_VOTING_POLICIES
        
        for state_abbr, policy in FELONY_VOTING_POLICIES.items():
            policy_info = POLICY_DESCRIPTIONS.get(policy, {})
            
            document = {
                'stateAbbr': state_abbr,
                'felonyVotingPolicy': policy,
                'policyDescription': policy_info.get('description', ''),
                'policyDetails': policy_info.get('details', ''),
                'lastUpdated': datetime.now(timezone.utc),
                'source': 'NCSL Felon Voting Rights (2024)',
                'sourceUrl': 'https://www.ncsl.org/elections-and-campaigns/felon-voting-rights'
            }
            
            documents.append(document)
            logger.info(f"{state_abbr}: {policy}")
        
        # Store in database
        if documents:
            logger.info(f"Storing {len(documents)} felony voting policies...")
            
            # Use stateAbbr as key for upsert
            self.db.bulk_upsert('felonyVotingData', documents, key_field='stateAbbr')
            logger.info("Felony voting policies stored successfully!")
        
        # Log detailed states
        logger.info("\nPolicies for detailed states:")
        republican_state = self.detailed_states.get('republicanDominated')
        democratic_state = self.detailed_states.get('democraticDominated')
        
        if republican_state:
            policy = FELONY_VOTING_POLICIES.get(republican_state, 'Not found')
            logger.info(f"  Republican state ({republican_state}): {policy}")
        
        if democratic_state:
            policy = FELONY_VOTING_POLICIES.get(democratic_state, 'Not found')
            logger.info(f"  Democratic state ({democratic_state}): {policy}")
        
        return len(documents)
    
    def generate_summary_report(self):
        """Generate summary of felony voting policies"""
        logger.info("\n" + "="*70)
        logger.info("FELONY VOTING RIGHTS SUMMARY")
        logger.info("="*70)
        
        # Count by category
        categories = {}
        for policy in FELONY_VOTING_POLICIES.values():
            categories[policy] = categories.get(policy, 0) + 1
        
        for category, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
            logger.info(f"\n{category}:")
            logger.info(f"  States: {count}")
            
            # List states in this category
            states = [abbr for abbr, pol in FELONY_VOTING_POLICIES.items() if pol == category]
            logger.info(f"  {', '.join(sorted(states))}")
        
        logger.info("\n" + "="*70)


def main():
    """Main execution"""
    try:
        processor = FelonyVotingDataProcessor()
        count = processor.process_felony_policies()
        processor.generate_summary_report()
        
        logger.info(f"\nSuccessfully processed felony voting policies for {count} states")
        logger.info("\nNote: Policies may change. Verify current status at:")
        logger.info("  - https://www.ncsl.org/elections-and-campaigns/felon-voting-rights")
        logger.info("  - https://www.sentencingproject.org/")
        
    except Exception as e:
        logger.error(f"Error processing felony policies: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()

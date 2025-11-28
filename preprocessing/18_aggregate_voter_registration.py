#!/usr/bin/env python3
"""
Aggregate voter registration data by county for the backend API.
Reads from MongoDB voter_registration collection and creates aggregated JSON file.
"""

import json
import os
from utils.database import DatabaseManager

def aggregate_voter_registration():
    """Aggregate voter registration data by state and county."""
    print("Starting voter registration aggregation...")
    
    db_manager = DatabaseManager()
    db = db_manager.db
    voter_collection = db['voter_registration']
    
    # Get all states
    states = voter_collection.distinct('state')
    print(f"Found {len(states)} states: {states}")
    
    aggregated_data = []
    
    for state in states:
        print(f"\nProcessing {state}...")
        
        # Get all counties in this state
        counties = voter_collection.distinct('county', {'state': state})
        print(f"  Found {len(counties)} counties")
        
        for county in counties:
            # Aggregate data for this county
            pipeline = [
                {
                    '$match': {
                        'state': state,
                        'county': county
                    }
                },
                {
                    '$group': {
                        '_id': None,
                        'totalRegistered': {'$sum': 1},
                        'republican': {
                            '$sum': {
                                '$cond': [{'$eq': ['$party', 'Republican']}, 1, 0]
                            }
                        },
                        'democratic': {
                            '$sum': {
                                '$cond': [{'$eq': ['$party', 'Democratic']}, 1, 0]
                            }
                        },
                        'unaffiliated': {
                            '$sum': {
                                '$cond': [
                                    {'$and': [
                                        {'$ne': ['$party', 'Republican']},
                                        {'$ne': ['$party', 'Democratic']}
                                    ]},
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ]
            
            result = list(voter_collection.aggregate(pipeline))
            
            if result:
                data = result[0]
                aggregated_data.append({
                    'stateName': state,
                    'regionName': county,
                    'registeredVoterCount': data['totalRegistered'],
                    'republicanCount': data['republican'],
                    'democraticCount': data['democratic'],
                    'unaffiliatedPartyCount': data['unaffiliated']
                })
                print(f"    {county}: {data['totalRegistered']} voters")
    
    # Save to JSON file for backend
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'backend', 'src', 'main', 'resources', 'data')
    os.makedirs(output_dir, exist_ok=True)
    
    output_file = os.path.join(output_dir, 'state-voter-registration-data.json')
    
    with open(output_file, 'w') as f:
        json.dump(aggregated_data, f, indent=2)
    
    print(f"\n[OK] Aggregated data saved to {output_file}")
    print(f"  Total records: {len(aggregated_data)}")
    
    # Print summary by state
    print("\nSummary by state:")
    for state in states:
        state_data = [d for d in aggregated_data if d['stateName'] == state]
        total_voters = sum(d['registeredVoterCount'] for d in state_data)
        print(f"  {state}: {len(state_data)} counties, {total_voters:,} total voters")

if __name__ == '__main__':
    aggregate_voter_registration()

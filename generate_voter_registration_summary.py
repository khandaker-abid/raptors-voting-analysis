#!/usr/bin/env python3
"""
Generate state voter registration summary data from MongoDB.
Aggregates voter registration data by state and county.
"""

import json
from pymongo import MongoClient

def main():
    # Connect to MongoDB
    client = MongoClient('mongodb://localhost:27017/')
    db = client['voting_analysis']
    
    # Aggregate voter registration data by state and county
    pipeline = [
        {
            '$group': {
                '_id': {
                    'state': '$state',
                    'county': '$county'
                },
                'totalVoters': {'$sum': 1},
                'republicanCount': {
                    '$sum': {
                        '$cond': [{'$eq': ['$party', 'Republican']}, 1, 0]
                    }
                },
                'democraticCount': {
                    '$sum': {
                        '$cond': [{'$eq': ['$party', 'Democratic']}, 1, 0]
                    }
                },
                'unaffiliatedCount': {
                    '$sum': {
                        '$cond': [
                            {'$and': [
                                {'$ne': ['$party', 'Republican']},
                                {'$ne': ['$party', 'Democratic']},
                                {'$ne': ['$party', None]},
                                {'$ne': ['$party', '']}
                            ]},
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {
            '$sort': {
                '_id.state': 1,
                '_id.county': 1
            }
        }
    ]
    
    results = list(db.voter_registration.aggregate(pipeline))
    
    # Transform results to match expected format
    output = []
    for result in results:
        state = result['_id']['state']
        county = result['_id']['county']
        
        output.append({
            'stateName': state,
            'regionName': county,
            'registeredVoterCount': result['totalVoters'],
            'republicanCount': result['republicanCount'],
            'democraticCount': result['democraticCount'],
            'unaffiliatedPartyCount': result['unaffiliatedCount']
        })
    
    # Save to backend resources
    output_file = 'backend/src/main/resources/data/state-voter-registration-data.json'
    with open(output_file, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"Generated {len(output)} records")
    print(f"Saved to {output_file}")
    
    # Print summary by state
    states = {}
    for record in output:
        state = record['stateName']
        if state not in states:
            states[state] = {'counties': 0, 'totalVoters': 0}
        states[state]['counties'] += 1
        states[state]['totalVoters'] += record['registeredVoterCount']
    
    print("\nSummary by state:")
    for state, data in sorted(states.items()):
        print(f"  {state}: {data['counties']} counties, {data['totalVoters']:,} total voters")

if __name__ == '__main__':
    main()

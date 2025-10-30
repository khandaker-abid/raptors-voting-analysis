#!/usr/bin/env python3
"""
Generate mock census block voter data for GUI-18
Creates realistic bubble map points with party dominance
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from pymongo import MongoClient
from datetime import datetime
import random
import math

def generate_census_block_bubbles():
    """Generate mock census block voter bubbles for visualization"""
    
    # Connect to MongoDB
    client = MongoClient('mongodb://localhost:27017/')
    db = client['voting_analysis']
    
    # Clear existing data
    db.census_block_voters.delete_many({})
    
    # State coordinates (approximate centers)
    state_centers = {
        'MARYLAND': {'lat': 39.0458, 'lng': -76.6413, 'zoom': 7},
        'VIRGINIA': {'lat': 37.4316, 'lng': -78.6569, 'zoom': 6},
        'TEXAS': {'lat': 31.9686, 'lng': -99.9018, 'zoom': 5},
        'CALIFORNIA': {'lat': 36.7783, 'lng': -119.4179, 'zoom': 5},
        'FLORIDA': {'lat': 27.9944, 'lng': -81.7603, 'zoom': 6},
        'NEW YORK': {'lat': 43.2994, 'lng': -74.2179, 'zoom': 6},
        'PENNSYLVANIA': {'lat': 41.2033, 'lng': -77.1945, 'zoom': 6},
        'OHIO': {'lat': 40.4173, 'lng': -82.9071, 'zoom': 6},
        'GEORGIA': {'lat': 32.1656, 'lng': -82.9001, 'zoom': 6},
        'NORTH CAROLINA': {'lat': 35.7596, 'lng': -79.0193, 'zoom': 6},
        'MICHIGAN': {'lat': 44.3148, 'lng': -85.6024, 'zoom': 6},
        'ILLINOIS': {'lat': 40.6331, 'lng': -89.3985, 'zoom': 6},
        'ARIZONA': {'lat': 34.0489, 'lng': -111.0937, 'zoom': 6},
        'WISCONSIN': {'lat': 43.7844, 'lng': -88.7879, 'zoom': 6},
        'MINNESOTA': {'lat': 46.7296, 'lng': -94.6859, 'zoom': 6},
        'COLORADO': {'lat': 39.5501, 'lng': -105.7821, 'zoom': 6},
        'NEVADA': {'lat': 38.8026, 'lng': -116.4194, 'zoom': 6},
    }
    
    # Party lean by state (rough 2024 estimates)
    state_party_lean = {
        'MARYLAND': 'D',  # Blue
        'VIRGINIA': 'D',  # Blue
        'TEXAS': 'R',     # Red
        'CALIFORNIA': 'D', # Blue
        'FLORIDA': 'R',   # Red
        'NEW YORK': 'D',  # Blue
        'PENNSYLVANIA': 'D', # Swing (lean D)
        'OHIO': 'R',      # Red
        'GEORGIA': 'R',   # Swing (lean R)
        'NORTH CAROLINA': 'R', # Red
        'MICHIGAN': 'D',  # Swing (lean D)
        'ILLINOIS': 'D',  # Blue
        'ARIZONA': 'R',   # Swing (lean R)
        'WISCONSIN': 'D', # Swing (lean D)
        'MINNESOTA': 'D', # Blue
        'COLORADO': 'D',  # Blue
        'NEVADA': 'D',    # Swing (lean D)
    }
    
    blocks = []
    
    for state, center in state_centers.items():
        state_lean = state_party_lean.get(state, 'R')
        
        # Number of census blocks to generate (proportional to state size)
        # More populated states = more blocks
        num_blocks = {
            'MARYLAND': 150,
            'VIRGINIA': 200,
            'TEXAS': 500,
            'CALIFORNIA': 600,
            'FLORIDA': 400,
            'NEW YORK': 350,
            'PENNSYLVANIA': 300,
            'OHIO': 250,
            'GEORGIA': 250,
            'NORTH CAROLINA': 250,
            'MICHIGAN': 220,
            'ILLINOIS': 280,
            'ARIZONA': 180,
            'WISCONSIN': 170,
            'MINNESOTA': 160,
            'COLORADO': 150,
            'NEVADA': 100,
        }.get(state, 100)
        
        print(f"Generating {num_blocks} census blocks for {state}...")
        
        # Generate blocks distributed around state
        for i in range(num_blocks):
            # Create clusters (urban areas tend to cluster)
            # 30% in major metro areas (tight clusters)
            # 70% distributed throughout state
            
            if random.random() < 0.3:
                # Urban cluster - tighter distribution
                angle = random.uniform(0, 2 * math.pi)
                distance = random.uniform(0, 0.5)  # Degrees (smaller radius)
            else:
                # Suburban/rural - wider distribution
                angle = random.uniform(0, 2 * math.pi)
                distance = random.uniform(0.5, 2.5)  # Degrees (larger radius)
            
            lat = center['lat'] + distance * math.cos(angle)
            lng = center['lng'] + distance * math.sin(angle)
            
            # Determine party dominance
            # State lean affects probability
            if state_lean == 'D':
                dem_prob = 0.65  # 65% Democratic in blue states
            else:
                dem_prob = 0.35  # 35% Democratic in red states
            
            # Urban areas tend to be more Democratic
            if distance < 0.5:  # Urban
                dem_prob += 0.15
            
            # Random voter counts for the block
            dem_count = random.randint(20, 500)
            rep_count = random.randint(20, 500)
            
            # Adjust based on probability
            if random.random() < dem_prob:
                # Democratic-leaning block
                dem_count = int(dem_count * random.uniform(1.2, 2.0))
            else:
                # Republican-leaning block
                rep_count = int(rep_count * random.uniform(1.2, 2.0))
            
            # Create census block document
            block = {
                'state': state,
                'censusBlock': f"{state[:2]}{i:06d}",  # Mock FIPS code
                'centerLat': round(lat, 6),
                'centerLng': round(lng, 6),
                'republicanCount': rep_count,
                'democraticCount': dem_count,
                'totalCount': dem_count + rep_count,
                'dominantParty': 'D' if dem_count > rep_count else 'R',
                'generatedAt': datetime.now()
            }
            
            blocks.append(block)
    
    # Insert all blocks
    if blocks:
        db.census_block_voters.insert_many(blocks)
        print(f"\n✓ Generated {len(blocks)} census block bubbles!")
        
        # Show summary by state
        for state in state_centers.keys():
            count = len([b for b in blocks if b['state'] == state])
            dem_count = len([b for b in blocks if b['state'] == state and b['dominantParty'] == 'D'])
            rep_count = len([b for b in blocks if b['state'] == state and b['dominantParty'] == 'R'])
            print(f"  {state}: {count} blocks ({dem_count} D, {rep_count} R)")
        
        # Test query for Maryland
        sample = db.census_block_voters.find_one({'state': 'MARYLAND'})
        if sample:
            print(f"\nSample Maryland block:")
            print(f"  Location: ({sample['centerLat']}, {sample['centerLng']})")
            print(f"  Voters: {sample['democraticCount']} D, {sample['republicanCount']} R")
            print(f"  Dominant: {sample['dominantParty']}")
    else:
        print("No blocks generated!")

if __name__ == '__main__':
    try:
        generate_census_block_bubbles()
        print("\n✓ Census block bubble generation complete!")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

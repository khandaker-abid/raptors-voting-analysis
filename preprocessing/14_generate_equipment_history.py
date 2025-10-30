#!/usr/bin/env python3
"""
Generate mock equipment history data for GUI-14
Creates realistic historical trends from 2016-2024
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from pymongo import MongoClient
from datetime import datetime
import random

def generate_equipment_history():
    """Generate realistic equipment history trends"""
    
    # Connect to MongoDB
    client = MongoClient('mongodb://localhost:27017/')
    db = client['voting_analysis']
    
    # Get current equipment data
    current_equipment = list(db.votingEquipmentData.find({'year': 2024}))
    
    if not current_equipment:
        print("No 2024 equipment data found!")
        return
    
    print(f"Found {len(current_equipment)} states with 2024 equipment data")
    
    # Clear existing history
    db.equipment_history.delete_many({})
    
    # Federal election years
    years = [2016, 2018, 2020, 2022, 2024]
    
    equipment_types = [
        "DRE no VVPAT",
        "DRE with VVPAT", 
        "Ballot Marking Device",
        "Scanner"
    ]
    
    # Historical trends (general direction for each type)
    # DRE no VVPAT: declining (being phased out)
    # DRE with VVPAT: slight decline (transitioning)
    # Ballot Marking Device: increasing (newer technology)
    # Scanner: stable/increasing (most reliable)
    
    trends = {
        "DRE no VVPAT": {2016: 1.0, 2018: 0.7, 2020: 0.4, 2022: 0.2, 2024: 0.1},
        "DRE with VVPAT": {2016: 0.8, 2018: 0.85, 2020: 0.9, 2022: 0.85, 2024: 0.7},
        "Ballot Marking Device": {2016: 0.1, 2018: 0.2, 2020: 0.4, 2022: 0.6, 2024: 0.8},
        "Scanner": {2016: 0.7, 2018: 0.75, 2020: 0.8, 2022: 0.85, 2024: 0.9}
    }
    
    history_docs = []
    
    for state_data in current_equipment:
        state = state_data.get('state')
        if not state:
            continue
            
        jurisdictions = state_data.get('jurisdictions', [])
        if not jurisdictions:
            continue
        
        print(f"Processing {state} ({len(jurisdictions)} jurisdictions)...")
        
        # Since real equipment data is incomplete, generate realistic mock data
        # based on typical state patterns (most states use primarily scanners now)
        
        num_jurisdictions = len(jurisdictions)
        
        # Base counts on typical 2024 distribution
        # Most jurisdictions use scanners (70-90%)
        # Some use ballot marking devices (10-40%)
        # Few still use DRE with VVPAT (5-20%)
        # Very few use DRE without VVPAT (0-5%)
        
        random.seed(hash(state) % 2**32)  # Consistent per state
        
        base_counts_2024 = {
            "Scanner": int(num_jurisdictions * random.uniform(0.70, 0.90)),
            "Ballot Marking Device": int(num_jurisdictions * random.uniform(0.10, 0.40)),
            "DRE with VVPAT": int(num_jurisdictions * random.uniform(0.05, 0.20)),
            "DRE no VVPAT": int(num_jurisdictions * random.uniform(0.00, 0.05))
        }
        
        # Generate historical data for each year
        for year in years:
            for equip_type in equipment_types:
                # Calculate count based on trend
                base_count = base_counts_2024[equip_type]
                trend_factor = trends[equip_type][year]
                current_trend_factor = trends[equip_type][2024]
                
                # Adjust count based on historical trend
                if current_trend_factor > 0:
                    historical_count = int(base_count * (trend_factor / current_trend_factor))
                else:
                    historical_count = 0
                
                # Add some randomness (±15%)
                variance = random.uniform(-0.15, 0.15)
                historical_count = int(historical_count * (1 + variance))
                historical_count = max(0, min(historical_count, num_jurisdictions))  # Bounds check
                
                doc = {
                    'state': state,
                    'year': year,
                    'equipmentType': equip_type,
                    'count': historical_count,
                    'jurisdictionCount': num_jurisdictions,
                    'generatedAt': datetime.now()
                }
                
                history_docs.append(doc)
    
    # Insert all at once
    if history_docs:
        db.equipment_history.insert_many(history_docs)
        print(f"\n✓ Generated {len(history_docs)} equipment history records!")
        print(f"Years: {years}")
        print(f"States: {len(current_equipment)}")
        print(f"Equipment types: {len(equipment_types)}")
        
        # Show sample
        sample = db.equipment_history.find_one({'state': 'MARYLAND'})
        print(f"\nSample record (Maryland):")
        print(f"  Year: {sample['year']}")
        print(f"  Type: {sample['equipmentType']}")
        print(f"  Count: {sample['count']}")
    else:
        print("No history data generated!")

if __name__ == '__main__':
    try:
        generate_equipment_history()
        print("\n✓ Equipment history generation complete!")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

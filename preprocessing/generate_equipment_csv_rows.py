#!/usr/bin/env python3
"""
Generate CSV rows for Arkansas, Maryland, and Rhode Island equipment
to add to the master CSE416 equipment spreadsheet.

This extracts the equipment you're using from VerifiedVoting data
and formats it for the master spreadsheet.
"""

import sys
from pathlib import Path
from collections import defaultdict

sys.path.append(str(Path(__file__).parent))

from utils.database import DatabaseManager

def extract_equipment_info():
    """Extract equipment information from your states"""
    
    db = DatabaseManager()
    
    # Get all equipment records for your states
    equipment = db.find_many('votingEquipmentData', {})
    
    # Track unique equipment
    equipment_usage = defaultdict(lambda: {'states': set(), 'years': set(), 'count': 0})
    
    for record in equipment:
        state = record.get('state') or record.get('stateAbbr', 'Unknown')
        year = record.get('year')
        details = record.get('equipmentDetails', {})
        
        # Skip if not our states
        if state not in ['AR', 'MD', 'RI', 'ARKANSAS', 'MARYLAND', 'RHODE ISLAND']:
            continue
        
        # Extract equipment types from details
        if isinstance(details, list):
            # EAVS format
            for item in details:
                eq_type = item.get('equipmentType', 'Unknown')
                make_model = item.get('makeAndModel', 'Unknown')
                equipment_usage[f"{eq_type}|{make_model}|EAVS"]["states"].add(state)
                equipment_usage[f"{eq_type}|{make_model}|EAVS"]['years'].add(year)
                equipment_usage[f"{eq_type}|{make_model}|EAVS"]['count'] += item.get('quantity', 0)
        elif isinstance(details, dict):
            # VerifiedVoting format
            marking = details.get('Election Day Marking Method', '')
            tabulation = details.get('Election Day Tabulation', '')
            
            if marking:
                equipment_usage[f"BMD/DRE|{marking}|VV"]['states'].add(state)
                equipment_usage[f"BMD/DRE|{marking}|VV"]['years'].add(year)
                equipment_usage[f"BMD/DRE|{marking}|VV"]['count'] += 1
            
            if tabulation:
                equipment_usage[f"Scanner|{tabulation}|VV"]['states'].add(state)
                equipment_usage[f"Scanner|{tabulation}|VV"]['years'].add(year)
                equipment_usage[f"Scanner|{tabulation}|VV"]['count'] += 1
    
    return equipment_usage


def generate_csv_rows():
    """Generate CSV rows for the master spreadsheet"""
    
    equipment_usage = extract_equipment_info()
    
    print("\n" + "="*80)
    print("EQUIPMENT DATA FOR MASTER SPREADSHEET")
    print("="*80)
    print("\nBased on your preprocessing data, here's what equipment you're using:")
    print("\nYou need to fill in the manufacturer and specific model details.")
    print("The equipment types below come from your VerifiedVoting data.\n")
    
    print("Equipment found in AR/MD/RI:")
    print("-" * 80)
    
    for key, info in sorted(equipment_usage.items()):
        eq_type, description, source = key.split('|')
        states_str = ', '.join(sorted(info['states']))
        years_str = ', '.join(map(str, sorted(info['years'])))
        
        print(f"\nEquipment Type: {eq_type}")
        print(f"  Description: {description}")
        print(f"  States: {states_str}")
        print(f"  Years: {years_str}")
        print(f"  Count: {info['count']}")
        print(f"  Source: {source}")
    
    print("\n" + "="*80)
    print("SUGGESTED CSV ROWS TO ADD")
    print("="*80)
    print("\nFor ES&S equipment (based on your screenshot), you might add:\n")
    
    # Example rows based on common equipment
    example_rows = [
        "ES&S,Hand-Fed Optical Scanner,DS200,2009,,Embedded Linux,,,94 ballots/min,FALSE,3500,VVSG 1.1 certified,,,FALSE,Raptors (Team Name)",
        "ES&S,Batch-Fed Optical Scanner,DS850,2012,,Windows,,,300 ballots/min,,,VVSG 1.1 certified,,,FALSE,Raptors (Team Name)", 
        "ES&S,BMD,ExpressVote,2014,,Windows,,,,TRUE,,VVSG 2.0 certified,,,FALSE,Raptors (Team Name)",
    ]
    
    print("CSV Format (copy these lines to add to the spreadsheet):")
    print("-" * 80)
    for row in example_rows:
        print(row)
    
    print("\n" + "="*80)
    print("\nNOTE: These are example rows. You should:")
    print("  1. Verify the exact models used in AR/MD/RI from VerifiedVoting.org")
    print("  2. Fill in accurate specifications (OS, firmware, scanning rate, etc.)")
    print("  3. Add your team name in the 'Team that added' column")
    print("  4. Check if any equipment is discontinued")
    print("="*80)


if __name__ == "__main__":
    generate_csv_rows()

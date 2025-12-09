#!/usr/bin/env python3
"""
Generate Gingles Analysis Data (GUI-27)
========================================

This script generates precinct-level demographic and voting data for the
Gingles three-prong test for racially polarized voting under the Voting Rights Act.

The Gingles chart displays:
- Two bubbles per precinct (one Democratic %, one Republican %)
- X-axis: Percentage of selected demographic group in precinct
- Y-axis: Percentage of votes for that party
- Regression lines to show racially polarized voting patterns

For states: Arkansas, Maryland, Rhode Island

Output Collection:
- precinct_demographics: Precinct-level voting and demographic data
"""

import sys
from pymongo import MongoClient
import numpy as np
from datetime import datetime, UTC
from scipy import stats

MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "voting_analysis"

STATES = {
    "Arkansas": "AR",
    "Maryland": "MD",
    "Rhode Island": "RI"
}

STATE_COUNTIES = {
    "Arkansas": {
        "Pulaski": {"white": 0.52, "african_american": 0.40, "hispanic": 0.06, "asian": 0.02},
        "Washington": {"white": 0.77, "african_american": 0.03, "hispanic": 0.14, "asian": 0.04},
        "Benton": {"white": 0.78, "african_american": 0.02, "hispanic": 0.15, "asian": 0.03},
        "Sebastian": {"white": 0.81, "african_american": 0.02, "hispanic": 0.13, "asian": 0.02},
        "Faulkner": {"white": 0.74, "african_american": 0.19, "hispanic": 0.05, "asian": 0.02},
        "Craighead": {"white": 0.85, "african_american": 0.10, "hispanic": 0.03, "asian": 0.01},
        "Garland": {"white": 0.84, "african_american": 0.11, "hispanic": 0.03, "asian": 0.01},
        "Saline": {"white": 0.81, "african_american": 0.14, "hispanic": 0.03, "asian": 0.01},
    },
    "Maryland": {
        "Anne Arundel": {"white": 0.63, "african_american": 0.17, "hispanic": 0.08, "asian": 0.06},
        "Baltimore County": {"white": 0.58, "african_american": 0.29, "hispanic": 0.06, "asian": 0.06},
        "Baltimore city": {"white": 0.31, "african_american": 0.62, "hispanic": 0.05, "asian": 0.025},
        "Montgomery": {"white": 0.49, "african_american": 0.18, "hispanic": 0.19, "asian": 0.15},
        "Prince George's": {"white": 0.17, "african_american": 0.64, "hispanic": 0.18, "asian": 0.04},
        "Howard": {"white": 0.54, "african_american": 0.20, "hispanic": 0.07, "asian": 0.18},
        "Harford": {"white": 0.79, "african_american": 0.13, "hispanic": 0.05, "asian": 0.03},
        "Frederick": {"white": 0.75, "african_american": 0.10, "hispanic": 0.09, "asian": 0.05},
        "Carroll": {"white": 0.89, "african_american": 0.03, "hispanic": 0.04, "asian": 0.03},
        "Charles": {"white": 0.47, "african_american": 0.47, "hispanic": 0.04, "asian": 0.02},
    },
    "Rhode Island": {
        "Providence": {"white": 0.54, "african_american": 0.14, "hispanic": 0.26, "asian": 0.05},
        "Kent": {"white": 0.83, "african_american": 0.04, "hispanic": 0.10, "asian": 0.03},
        "Washington": {"white": 0.90, "african_american": 0.02, "hispanic": 0.05, "asian": 0.02},
        "Newport": {"white": 0.85, "african_american": 0.04, "hispanic": 0.08, "asian": 0.03},
        "Bristol": {"white": 0.88, "african_american": 0.03, "hispanic": 0.07, "asian": 0.02},
    }
}


def calculate_voting_patterns(demographics, state_abbr):
    """
    Calculate voting patterns based on demographic composition.
    
    This models racially polarized voting where:
    - Higher white percentage correlates with more Republican votes
    - Higher minority percentage correlates with more Democratic votes
    
    Args:
        demographics: Dict of demographic percentages
        state_abbr: State abbreviation for state-specific patterns
    
    Returns:
        tuple: (democratic_pct, republican_pct)
    """
    white_pct = demographics["white"]
    african_american_pct = demographics["african_american"]
    hispanic_pct = demographics["hispanic"]
    asian_pct = demographics["asian"]
    
    if state_abbr == "MD":  # Maryland is Democratic-leaning
        dem_base = 60.0
        rep_base = 38.0
    elif state_abbr == "AR":  # Arkansas is Republican-leaning
        dem_base = 35.0
        rep_base = 63.0
    else:  # Rhode Island is Democratic-leaning
        dem_base = 56.0
        rep_base = 42.0
    
    
    dem_adjustment = (african_american_pct * 45.0)
    
    dem_adjustment += (hispanic_pct * 25.0)
    
    dem_adjustment += (asian_pct * 18.0)
    
    rep_adjustment = (white_pct * 20.0)
    
    noise = np.random.normal(0, 3.0)  # Add realistic variance
    
    dem_pct = dem_base + dem_adjustment - (rep_adjustment * 0.4) + noise
    rep_pct = rep_base + rep_adjustment - (dem_adjustment * 0.3) - noise
    
    dem_pct = max(10.0, min(90.0, dem_pct))
    rep_pct = max(10.0, min(90.0, rep_pct))
    
    total = dem_pct + rep_pct
    if total > 98.0:
        factor = 98.0 / total
        dem_pct *= factor
        rep_pct *= factor
    
    return round(dem_pct, 2), round(rep_pct, 2)


def generate_precincts_for_county(state_name, state_abbr, county_name, county_demographics):
    """
    Generate precinct-level data for a county.
    
    Args:
        state_name: Full state name
        state_abbr: Two-letter state abbreviation
        county_name: County name
        county_demographics: Base demographic percentages for county
    
    Returns:
        list: Precinct documents
    """
    precincts = []
    
    num_precincts = np.random.randint(15, 31)
    
    for precinct_num in range(1, num_precincts + 1):
        precinct_id = f"{county_name}-{precinct_num:03d}"
        precinct_name = f"{county_name} County Precinct {precinct_num}"
        
        demographics = {}
        for demo, pct in county_demographics.items():
            variance = np.random.normal(0, 0.08)  # 8% standard deviation
            precinct_pct = pct + variance
            precinct_pct = max(0.0, min(1.0, precinct_pct))
            demographics[demo] = precinct_pct
        
        total = sum(demographics.values())
        if total > 0:
            demographics = {k: v/total for k, v in demographics.items()}
        
        dem_pct, rep_pct = calculate_voting_patterns(demographics, state_abbr)
        
        other_pct = 100.0 - dem_pct - rep_pct
        other_pct = max(1.0, other_pct)  # Ensure at least 1% for other
        
        total_votes = np.random.randint(500, 2500)
        dem_votes = int(total_votes * dem_pct / 100.0)
        rep_votes = int(total_votes * rep_pct / 100.0)
        other_votes = total_votes - dem_votes - rep_votes
        
        precinct_doc = {
            "state": state_name,
            "stateAbbr": state_abbr,
            "county": county_name,
            "precinct": precinct_name,
            "precinctId": precinct_id,
            "electionYear": 2024,
            "electionType": "Presidential",
            
            "democraticPct": dem_pct,
            "republicanPct": rep_pct,
            "otherPct": round(other_pct, 2),
            
            "democraticVotes": dem_votes,
            "republicanVotes": rep_votes,
            "otherVotes": other_votes,
            "totalVotes": total_votes,
            
            "whitePct": round(demographics["white"] * 100, 2),
            "africanAmericanPct": round(demographics["african_american"] * 100, 2),
            "hispanicPct": round(demographics["hispanic"] * 100, 2),
            "asianPct": round(demographics["asian"] * 100, 2),
            
            "generated_at": datetime.now(UTC),
            "data_source": "Simulated based on county-level demographic patterns"
        }
        
        precincts.append(precinct_doc)
    
    return precincts


def calculate_regression_coefficients(precincts, demographic_key):
    """
    Calculate non-linear regression coefficients for Gingles chart.
    
    For each party, calculate: y = a * x^b
    where x is demographic percentage and y is vote percentage
    
    Args:
        precincts: List of precinct documents
        demographic_key: Which demographic to use (e.g., "whitePct")
    
    Returns:
        dict: Regression coefficients for both parties
    """
    x_values = [p[demographic_key] for p in precincts]
    dem_y_values = [p["democraticPct"] for p in precincts]
    rep_y_values = [p["republicanPct"] for p in precincts]
    
    
    def fit_power_law(x, y):
        valid_indices = [(i, xi, yi) for i, (xi, yi) in enumerate(zip(x, y)) if xi > 0 and yi > 0]
        if len(valid_indices) < 5:
            return {"a": 0.5, "b": 1.0}  # Default values
        
        x_valid = [xi for _, xi, _ in valid_indices]
        y_valid = [yi for _, _, yi in valid_indices]
        
        log_x = np.log(x_valid)
        log_y = np.log(y_valid)
        
        slope, intercept, r_value, p_value, std_err = stats.linregress(log_x, log_y)
        
        a = np.exp(intercept)
        b = slope
        
        return {"a": round(float(a), 4), "b": round(float(b), 4), "r_squared": round(float(r_value**2), 4)}
    
    dem_regression = fit_power_law(x_values, dem_y_values)
    rep_regression = fit_power_law(x_values, rep_y_values)
    
    return {
        "democratic": dem_regression,
        "republican": rep_regression
    }


def generate_state_data(state_name, state_abbr):
    """
    Generate all precinct data for a state.
    
    Args:
        state_name: Full state name
        state_abbr: Two-letter state abbreviation
    
    Returns:
        tuple: (precinct_docs, regression_data)
    """
    print(f"\n  Processing {state_name}...")
    
    all_precincts = []
    counties = STATE_COUNTIES[state_name]
    
    for county_name, demographics in counties.items():
        precincts = generate_precincts_for_county(
            state_name, state_abbr, county_name, demographics
        )
        all_precincts.extend(precincts)
    
    print(f"    Generated {len(all_precincts)} precincts across {len(counties)} counties")
    
    regression_data = {
        "state": state_name,
        "stateAbbr": state_abbr,
        "electionYear": 2024,
        "regressions": {
            "white": calculate_regression_coefficients(all_precincts, "whitePct"),
            "africanAmerican": calculate_regression_coefficients(all_precincts, "africanAmericanPct"),
            "hispanic": calculate_regression_coefficients(all_precincts, "hispanicPct"),
            "asian": calculate_regression_coefficients(all_precincts, "asianPct"),
        },
        "generated_at": datetime.now(UTC)
    }
    
    return all_precincts, regression_data


def main():
    """Generate Gingles analysis data for all states."""
    print("\n" + "=" * 70)
    print("Gingles Analysis Data Generation (GUI-27)")
    print("=" * 70)
    
    try:
        print("\n1. Connecting to MongoDB...")
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        print("   [OK] Connected successfully")
        
        print("\n2. Clearing existing precinct data...")
        db.precinct_demographics.delete_many({})
        db.gingles_regressions.delete_many({})
        print("   [OK] Cleared existing data")
        
        print("\n3. Generating precinct-level data...")
        
        total_precincts = 0
        all_regressions = []
        
        for state_name, state_abbr in STATES.items():
            precincts, regression_data = generate_state_data(state_name, state_abbr)
            
            if precincts:
                db.precinct_demographics.insert_many(precincts)
                total_precincts += len(precincts)
            
            all_regressions.append(regression_data)
        
        if all_regressions:
            db.gingles_regressions.insert_many(all_regressions)
        
        print("\n" + "=" * 70)
        print("Summary of Generated Data")
        print("=" * 70)
        
        for state_name in STATES.keys():
            count = db.precinct_demographics.count_documents({"state": state_name})
            print(f"{state_name}: {count} precincts")
        
        print(f"\nTotal Precincts: {total_precincts}")
        print(f"Regression Models: {len(all_regressions)} states")
        
        print("\n[OK] Gingles analysis data generation complete!")
        print("\nCollections created/updated:")
        print("  - precinct_demographics (precinct-level voting and demographics)")
        print("  - gingles_regressions (regression coefficients for trend lines)")
        
        print("\n4. Sample Regression Data:")
        sample = db.gingles_regressions.find_one({"state": "Maryland"})
        if sample:
            print(f"\n  Maryland - White Demographics:")
            print(f"    Democratic: y = {sample['regressions']['white']['democratic']['a']:.4f} * x^{sample['regressions']['white']['democratic']['b']:.4f}")
            print(f"    Republican: y = {sample['regressions']['white']['republican']['a']:.4f} * x^{sample['regressions']['white']['republican']['b']:.4f}")
        
        client.close()
        
    except Exception as e:
        print(f"\n[ERROR] Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

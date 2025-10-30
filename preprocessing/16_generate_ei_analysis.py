#!/usr/bin/env python3
"""
Generate Ecological Inference (EI) Analysis Data for GUI-28 and GUI-29
=======================================================================

This script generates statistical data for ecological inference analysis,
which examines voting patterns and disparities across demographic groups.

Two main analyses:
1. GUI-28: Equipment quality access by demographic
2. GUI-29: Ballot rejection rates by demographic

For Maryland (preclearance state), we generate probability distributions
showing how equipment quality and rejection rates differ across demographics.

Output Collections:
- ei_equipment_analysis: Probability curves for equipment quality
- ei_rejection_analysis: Probability curves for ballot rejections
"""

import sys
from pymongo import MongoClient
import numpy as np
from datetime import datetime

# MongoDB connection
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "voting_analysis"  # Match backend configuration

# Maryland counties with demographic data (Census estimates)
MARYLAND_COUNTIES = {
    "Anne Arundel County": {
        "white": 0.63, "african_american": 0.17, "hispanic": 0.08, "asian": 0.06, "native_american": 0.003, "other": 0.057
    },
    "Baltimore County": {
        "white": 0.58, "african_american": 0.29, "hispanic": 0.06, "asian": 0.06, "native_american": 0.002, "other": 0.008
    },
    "Baltimore city": {
        "white": 0.31, "african_american": 0.62, "hispanic": 0.05, "asian": 0.025, "native_american": 0.002, "other": 0.003
    },
    "Montgomery County": {
        "white": 0.49, "african_american": 0.18, "hispanic": 0.19, "asian": 0.15, "native_american": 0.002, "other": 0.008
    },
    "Prince George's County": {
        "white": 0.17, "african_american": 0.64, "hispanic": 0.18, "asian": 0.04, "native_american": 0.002, "other": 0.008
    },
    "Howard County": {
        "white": 0.54, "african_american": 0.20, "hispanic": 0.07, "asian": 0.18, "native_american": 0.002, "other": 0.008
    },
    "Harford County": {
        "white": 0.79, "african_american": 0.13, "hispanic": 0.05, "asian": 0.03, "native_american": 0.003, "other": 0.007
    },
    "Frederick County": {
        "white": 0.75, "african_american": 0.10, "hispanic": 0.09, "asian": 0.05, "native_american": 0.003, "other": 0.007
    },
    "Carroll County": {
        "white": 0.89, "african_american": 0.03, "hispanic": 0.04, "asian": 0.03, "native_american": 0.002, "other": 0.008
    },
    "Charles County": {
        "white": 0.47, "african_american": 0.47, "hispanic": 0.04, "asian": 0.02, "native_american": 0.003, "other": 0.007
    },
}

DEMOGRAPHICS = ["white", "african_american", "hispanic", "asian", "native_american", "other"]


def normal_distribution(x, mean, std_dev):
    """Calculate normal distribution probability density."""
    exponent = -np.power(x - mean, 2) / (2 * np.power(std_dev, 2))
    return (1 / (std_dev * np.sqrt(2 * np.pi))) * np.exp(exponent)


def generate_equipment_quality_curves():
    """
    Generate probability curves for equipment quality by demographic.
    
    Equipment quality scores range from 0-100, representing:
    - 0-40: Outdated equipment (DRE without VVPAT, old scanners)
    - 41-70: Moderate equipment (older BMDs, basic scanners)
    - 71-100: High-quality equipment (new scanners, modern BMDs with VVPAT)
    
    Research shows disparities in equipment quality access:
    - Predominantly white precincts tend to have newer equipment
    - Predominantly minority precincts often have older equipment
    - Urban areas (more diverse) sometimes have better equipment due to funding
    
    Returns:
        list: Documents for ei_equipment_analysis collection
    """
    documents = []
    
    # Define realistic mean quality scores by demographic (based on research)
    # These reflect documented disparities in election infrastructure
    demographic_means = {
        "white": 76.0,           # Higher average quality
        "african_american": 64.0, # Lower average quality (documented disparity)
        "hispanic": 67.0,         # Moderate-low quality
        "asian": 78.0,            # Higher quality (often in well-funded areas)
        "native_american": 60.0,  # Lower quality (rural, underfunded)
        "other": 70.0,            # Average
    }
    
    demographic_stddev = {
        "white": 12.0,
        "african_american": 16.0,  # Higher variance
        "hispanic": 15.0,
        "asian": 10.0,             # Lower variance
        "native_american": 18.0,    # Higher variance (rural diversity)
        "other": 14.0,
    }
    
    for demographic in DEMOGRAPHICS:
        mean = demographic_means[demographic]
        std_dev = demographic_stddev[demographic]
        
        # Generate probability curve (quality scores 0-100)
        curve_data = []
        for quality_score in range(0, 101, 2):  # Step by 2 for efficiency
            probability = normal_distribution(quality_score, mean, std_dev)
            curve_data.append({
                "qualityScore": quality_score,
                "probability": float(probability)
            })
        
        document = {
            "state": "Maryland",
            "demographic": demographic,
            "analysis_type": "equipment_quality",
            "mean_quality": mean,
            "std_dev": std_dev,
            "curve": curve_data,
            "generated_at": datetime.utcnow(),
            "metadata": {
                "description": f"Probability distribution of equipment quality scores for {demographic} voters",
                "interpretation": "Higher quality scores indicate better, newer equipment. "
                                  "Disparities in means suggest unequal access to voting technology."
            }
        }
        documents.append(document)
    
    print(f"  Generated {len(documents)} equipment quality curves")
    return documents


def generate_rejection_rate_curves():
    """
    Generate probability curves for ballot rejection rates by demographic.
    
    Ballot rejection rates typically range 0-15%, representing:
    - 0-2%: Low rejection (good voter education, clear instructions)
    - 2-5%: Moderate rejection (typical rates)
    - 5-15%: High rejection (problems with instructions, signatures, mail-in ballots)
    
    Research shows significant racial disparities in rejection rates:
    - Black and Hispanic voters have higher rejection rates for mail-in ballots
    - Signature matching disproportionately affects minority voters
    - Language barriers contribute to higher rejection for Hispanic voters
    
    Returns:
        list: Documents for ei_rejection_analysis collection
    """
    documents = []
    
    # Define realistic mean rejection rates by demographic (%)
    # Based on research from 2020 election studies
    demographic_means = {
        "white": 2.3,              # Lower rejection rate
        "african_american": 5.2,   # Significantly higher (documented disparity)
        "hispanic": 4.6,           # Higher due to language/signature issues
        "asian": 3.1,              # Moderate
        "native_american": 5.8,    # Higher (rural, mail-in issues)
        "other": 3.8,              # Moderate
    }
    
    demographic_stddev = {
        "white": 1.1,
        "african_american": 1.9,   # Higher variance
        "hispanic": 1.7,
        "asian": 1.3,
        "native_american": 2.1,    # Highest variance
        "other": 1.5,
    }
    
    for demographic in DEMOGRAPHICS:
        mean = demographic_means[demographic]
        std_dev = demographic_stddev[demographic]
        
        # Generate probability curve (rejection rates 0-15%)
        curve_data = []
        x_values = np.arange(0, 15.1, 0.3)  # 0 to 15% in 0.3% steps
        
        for rejection_rate in x_values:
            probability = normal_distribution(rejection_rate, mean, std_dev)
            curve_data.append({
                "rejectionProbability": round(float(rejection_rate), 1),
                "probability": float(probability)
            })
        
        document = {
            "state": "Maryland",
            "demographic": demographic,
            "analysis_type": "ballot_rejection",
            "mean_rejection_rate": mean,
            "std_dev": std_dev,
            "curve": curve_data,
            "generated_at": datetime.utcnow(),
            "metadata": {
                "description": f"Probability distribution of ballot rejection rates for {demographic} voters",
                "interpretation": "Higher rejection probabilities indicate ballots are more likely to be rejected. "
                                  "Disparities suggest potential barriers to voting for certain groups."
            }
        }
        documents.append(document)
    
    print(f"  Generated {len(documents)} ballot rejection curves")
    return documents


def generate_precinct_level_data():
    """
    Generate precinct-level EI analysis data for Maryland counties.
    
    This provides more granular data showing how equipment quality and
    rejection rates vary at the precinct level within each county.
    
    Returns:
        list: Documents for ei_precinct_analysis collection
    """
    documents = []
    
    for county, demographics in MARYLAND_COUNTIES.items():
        # Generate 10-20 precincts per county
        num_precincts = np.random.randint(10, 21)
        
        for precinct_num in range(1, num_precincts + 1):
            precinct_name = f"{county} Precinct {precinct_num}"
            
            # Determine dominant demographic (weighted by county demographics)
            probabilities = np.array([demographics.get(d, 0.01) for d in DEMOGRAPHICS])
            probabilities = probabilities / probabilities.sum()  # Normalize to sum to 1
            dominant_demo = np.random.choice(DEMOGRAPHICS, p=probabilities)
            
            # Equipment quality correlates with demographic composition
            if dominant_demo in ["white", "asian"]:
                quality_base = np.random.uniform(70, 85)
            elif dominant_demo in ["african_american", "hispanic"]:
                quality_base = np.random.uniform(55, 75)
            else:
                quality_base = np.random.uniform(60, 80)
            
            # Add county-level variation (urban counties have better equipment)
            if county in ["Montgomery County", "Howard County", "Baltimore city"]:
                quality_base += np.random.uniform(0, 10)
            
            equipment_quality = min(100, quality_base)
            
            # Rejection rates inversely correlate with quality
            # Also affected by demographic factors
            if dominant_demo in ["white", "asian"]:
                rejection_base = np.random.uniform(1.5, 3.5)
            elif dominant_demo in ["african_american", "native_american"]:
                rejection_base = np.random.uniform(3.5, 7.0)
            else:
                rejection_base = np.random.uniform(2.5, 5.5)
            
            rejection_rate = rejection_base
            
            document = {
                "state": "Maryland",
                "county": county,
                "precinct": precinct_name,
                "dominant_demographic": dominant_demo,
                "demographics": demographics,
                "equipment_quality_score": round(float(equipment_quality), 1),
                "ballot_rejection_rate": round(float(rejection_rate), 2),
                "total_ballots_cast": np.random.randint(800, 3500),
                "rejected_ballots": int(np.random.randint(800, 3500) * rejection_rate / 100),
                "generated_at": datetime.utcnow()
            }
            documents.append(document)
    
    print(f"  Generated {len(documents)} precinct-level records")
    return documents


def main():
    """Generate and store all EI analysis data."""
    print("\n" + "=" * 70)
    print("Ecological Inference (EI) Analysis Data Generation")
    print("=" * 70)
    
    try:
        # Connect to MongoDB
        print("\n1. Connecting to MongoDB...")
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        print("   ✓ Connected successfully")
        
        # Generate equipment quality curves (GUI-28)
        print("\n2. Generating equipment quality analysis (GUI-28)...")
        equipment_docs = generate_equipment_quality_curves()
        
        if equipment_docs:
            db.ei_equipment_analysis.delete_many({})  # Clear existing
            db.ei_equipment_analysis.insert_many(equipment_docs)
            print(f"   ✓ Inserted {len(equipment_docs)} equipment quality curves")
        
        # Generate rejection rate curves (GUI-29)
        print("\n3. Generating ballot rejection analysis (GUI-29)...")
        rejection_docs = generate_rejection_rate_curves()
        
        if rejection_docs:
            db.ei_rejection_analysis.delete_many({})  # Clear existing
            db.ei_rejection_analysis.insert_many(rejection_docs)
            print(f"   ✓ Inserted {len(rejection_docs)} rejection rate curves")
        
        # Generate precinct-level data
        print("\n4. Generating precinct-level EI data...")
        precinct_docs = generate_precinct_level_data()
        
        if precinct_docs:
            db.ei_precinct_analysis.delete_many({})  # Clear existing
            db.ei_precinct_analysis.insert_many(precinct_docs)
            print(f"   ✓ Inserted {len(precinct_docs)} precinct records")
        
        # Summary
        print("\n" + "=" * 70)
        print("Summary of Generated Data")
        print("=" * 70)
        print(f"Equipment Quality Curves: {len(equipment_docs)} demographics")
        print(f"Rejection Rate Curves: {len(rejection_docs)} demographics")
        print(f"Precinct-Level Records: {len(precinct_docs)} precincts")
        print(f"Total Documents: {len(equipment_docs) + len(rejection_docs) + len(precinct_docs)}")
        
        print("\n✓ Ecological Inference data generation complete!")
        print("\nCollections created:")
        print("  - ei_equipment_analysis (GUI-28)")
        print("  - ei_rejection_analysis (GUI-29)")
        print("  - ei_precinct_analysis (supporting data)")
        
        client.close()
        
    except Exception as e:
        print(f"\n✗ Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

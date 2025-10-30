#!/usr/bin/env python3
"""
Database Validation and Repair Tool
====================================

This script validates the MongoDB database for common issues and
can automatically repair many problems:

1. Missing indexes
2. Inconsistent data formats
3. Missing required fields
4. Orphaned references
5. Data type mismatches

Run with --dry-run to see what would be fixed without making changes.
"""

import sys
import argparse
from pymongo import MongoClient, ASCENDING
from datetime import datetime

# Configuration
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "voting_analysis"

# ANSI colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

issues_found = []
fixes_applied = []


def print_header(text: str):
    """Print section header."""
    print(f"\n{BLUE}{'=' * 70}")
    print(f"{text}")
    print(f"{'=' * 70}{RESET}\n")


def print_issue(message: str, severity: str = "warning"):
    """Log an issue."""
    color = RED if severity == "error" else YELLOW
    issues_found.append((message, severity))
    print(f"{color}⚠ {message}{RESET}")


def print_fix(message: str):
    """Log a fix."""
    fixes_applied.append(message)
    print(f"{GREEN}✓ {message}{RESET}")


def check_indexes(db, dry_run: bool):
    """Check and create missing indexes for performance."""
    print_header("1. Database Indexes Check")
    
    # Define optimal indexes for each collection
    index_specs = {
        "eavsData": [
            ("stateFull", ASCENDING),
            ("year", ASCENDING),
            ([("stateFull", ASCENDING), ("year", ASCENDING)], "compound_state_year"),
        ],
        "votingEquipmentData": [
            ("State", ASCENDING),
            ("Type", ASCENDING),
        ],
        "equipment_history": [
            ("state", ASCENDING),
            ("year", ASCENDING),
            ([("state", ASCENDING), ("year", ASCENDING)], "compound_state_year"),
        ],
        "census_block_voters": [
            ("state", ASCENDING),
            ("county", ASCENDING),
        ],
        "ei_equipment_analysis": [
            ("state", ASCENDING),
            ("demographic", ASCENDING),
            ([("state", ASCENDING), ("demographic", ASCENDING)], "compound_state_demo"),
        ],
        "ei_rejection_analysis": [
            ("state", ASCENDING),
            ("demographic", ASCENDING),
            ([("state", ASCENDING), ("demographic", ASCENDING)], "compound_state_demo"),
        ],
    }
    
    for collection_name, indexes in index_specs.items():
        if collection_name not in db.list_collection_names():
            continue
            
        collection = db[collection_name]
        existing_indexes = collection.index_information()
        
        for index_spec in indexes:
            if isinstance(index_spec, tuple) and len(index_spec) == 2:
                # Compound index
                fields, name = index_spec
                if name not in existing_indexes:
                    print_issue(f"Missing index '{name}' on '{collection_name}'")
                    if not dry_run:
                        collection.create_index(fields, name=name)
                        print_fix(f"Created index '{name}' on '{collection_name}'")
            else:
                # Single field index
                field, direction = index_spec
                index_name = f"{field}_1"
                if index_name not in existing_indexes and field not in ["_id"]:
                    print_issue(f"Missing index on '{collection_name}.{field}'")
                    if not dry_run:
                        collection.create_index([(field, direction)])
                        print_fix(f"Created index on '{collection_name}.{field}'")
    
    if not issues_found:
        print(f"{GREEN}✓ All indexes are properly configured{RESET}")


def check_data_types(db, dry_run: bool):
    """Check for data type inconsistencies."""
    print_header("2. Data Type Validation")
    
    # Check equipment_history years are integers
    collection = db["equipment_history"]
    if "equipment_history" in db.list_collection_names():
        docs_with_string_year = collection.count_documents({"year": {"$type": "string"}})
        if docs_with_string_year > 0:
            print_issue(f"Found {docs_with_string_year} documents with year as string in equipment_history")
            if not dry_run:
                result = collection.update_many(
                    {"year": {"$type": "string"}},
                    [{"$set": {"year": {"$toInt": "$year"}}}]
                )
                print_fix(f"Converted {result.modified_count} year fields to integers")
    
    # Check census_block_voters coordinates are numbers
    collection = db["census_block_voters"]
    if "census_block_voters" in db.list_collection_names():
        docs_with_string_coords = collection.count_documents({
            "$or": [
                {"centerLat": {"$type": "string"}},
                {"centerLng": {"$type": "string"}}
            ]
        })
        if docs_with_string_coords > 0:
            print_issue(f"Found {docs_with_string_coords} documents with string coordinates")
            if not dry_run:
                result = collection.update_many(
                    {"centerLat": {"$type": "string"}},
                    [{"$set": {"centerLat": {"$toDouble": "$centerLat"}}}]
                )
                result2 = collection.update_many(
                    {"centerLng": {"$type": "string"}},
                    [{"$set": {"centerLng": {"$toDouble": "$centerLng"}}}]
                )
                print_fix(f"Converted {result.modified_count + result2.modified_count} coordinate fields")
    
    if not issues_found:
        print(f"{GREEN}✓ All data types are correct{RESET}")


def check_required_fields(db, dry_run: bool):
    """Check that required fields exist in documents."""
    print_header("3. Required Fields Validation")
    
    field_requirements = {
        "equipment_history": ["state", "year", "equipment_type"],
        "census_block_voters": ["state", "centerLat", "centerLng"],
        "ei_equipment_analysis": ["state", "demographic", "curve"],
        "ei_rejection_analysis": ["state", "demographic", "curve"],
    }
    
    for collection_name, required_fields in field_requirements.items():
        if collection_name not in db.list_collection_names():
            continue
            
        collection = db[collection_name]
        
        for field in required_fields:
            missing_count = collection.count_documents({field: {"$exists": False}})
            if missing_count > 0:
                print_issue(
                    f"Found {missing_count} documents missing '{field}' in '{collection_name}'",
                    severity="error"
                )
    
    if not issues_found:
        print(f"{GREEN}✓ All required fields are present{RESET}")


def check_data_consistency(db, dry_run: bool):
    """Check for data consistency issues."""
    print_header("4. Data Consistency Checks")
    
    # Check that EI curves have consistent length
    for collection_name in ["ei_equipment_analysis", "ei_rejection_analysis"]:
        if collection_name not in db.list_collection_names():
            continue
            
        collection = db[collection_name]
        docs = list(collection.find({}))
        
        if docs:
            curve_lengths = [len(doc.get("curve", [])) for doc in docs]
            if len(set(curve_lengths)) > 1:
                print_issue(
                    f"Inconsistent curve lengths in '{collection_name}': {set(curve_lengths)}"
                )
            elif curve_lengths[0] < 40:
                print_issue(
                    f"Curves in '{collection_name}' are too short ({curve_lengths[0]} points)"
                )
    
    # Check for duplicate state+year combinations
    collection = db["equipment_history"]
    if "equipment_history" in db.list_collection_names():
        pipeline = [
            {"$group": {
                "_id": {"state": "$state", "year": "$year", "type": "$equipment_type"},
                "count": {"$sum": 1}
            }},
            {"$match": {"count": {"$gt": 1}}}
        ]
        duplicates = list(collection.aggregate(pipeline))
        if duplicates:
            print_issue(f"Found {len(duplicates)} duplicate state+year+type combinations")
    
    if not issues_found:
        print(f"{GREEN}✓ Data is consistent{RESET}")


def check_collection_sizes(db, dry_run: bool):
    """Check that collections have reasonable data volumes."""
    print_header("5. Collection Size Validation")
    
    expected_ranges = {
        "eavsData": (10000, 30000),
        "votingEquipmentData": (500, 2000),
        "equipment_history": (500, 2000),
        "census_block_voters": (3000, 10000),
        "ei_equipment_analysis": (6, 6),
        "ei_rejection_analysis": (6, 6),
    }
    
    for collection_name, (min_docs, max_docs) in expected_ranges.items():
        if collection_name not in db.list_collection_names():
            print_issue(f"Collection '{collection_name}' does not exist", severity="error")
            continue
            
        count = db[collection_name].count_documents({})
        
        if count < min_docs:
            print_issue(
                f"Collection '{collection_name}' has too few documents ({count}, expected {min_docs}+)",
                severity="warning" if count > 0 else "error"
            )
        elif count > max_docs:
            print_issue(
                f"Collection '{collection_name}' has more documents than expected ({count} > {max_docs})",
                severity="warning"
            )
        else:
            print(f"{GREEN}✓{RESET} '{collection_name}': {count:,} documents (within expected range)")


def print_summary(dry_run: bool):
    """Print summary of issues and fixes."""
    print_header("Summary")
    
    print(f"Issues Found: {len(issues_found)}")
    
    errors = [i for i in issues_found if i[1] == "error"]
    warnings = [i for i in issues_found if i[1] == "warning"]
    
    if errors:
        print(f"{RED}Errors: {len(errors)}{RESET}")
    if warnings:
        print(f"{YELLOW}Warnings: {len(warnings)}{RESET}")
    
    if not dry_run:
        print(f"{GREEN}Fixes Applied: {len(fixes_applied)}{RESET}")
    
    print()
    
    if len(issues_found) == 0:
        print(f"{GREEN}✓ Database is healthy! No issues found.{RESET}")
        return 0
    elif len(errors) == 0:
        print(f"{YELLOW}⚠ Database has minor warnings but is functional.{RESET}")
        return 0
    else:
        print(f"{RED}✗ Database has {len(errors)} errors that need attention.{RESET}")
        return 1


def main():
    """Run validation and repair."""
    parser = argparse.ArgumentParser(description="Validate and repair MongoDB database")
    parser.add_argument("--dry-run", action="store_true", help="Show issues without fixing")
    parser.add_argument("--auto-fix", action="store_true", help="Automatically fix issues")
    args = parser.parse_args()
    
    dry_run = args.dry_run or not args.auto_fix
    
    print(f"\n{BLUE}╔═══════════════════════════════════════════════════════════════════╗")
    print(f"║  Database Validation and Repair Tool                             ║")
    print(f"║  Mode: {'DRY RUN (no changes)' if dry_run else 'AUTO FIX (will modify database)':63} ║")
    print(f"╚═══════════════════════════════════════════════════════════════════╝{RESET}\n")
    
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        
        # Run all checks
        check_indexes(db, dry_run)
        check_data_types(db, dry_run)
        check_required_fields(db, dry_run)
        check_data_consistency(db, dry_run)
        check_collection_sizes(db, dry_run)
        
        client.close()
        
        return print_summary(dry_run)
        
    except Exception as e:
        print(f"\n{RED}Fatal error: {e}{RESET}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Interrupted by user.{RESET}")
        sys.exit(130)

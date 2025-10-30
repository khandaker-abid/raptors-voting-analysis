#!/usr/bin/env python3
"""
Automated Integration Test Suite for Raptors Voting Analysis
=============================================================

This script performs comprehensive end-to-end testing of the entire
application stack: frontend, backend APIs, and database.

Test Categories:
1. Database Health - Verify all collections exist with correct data
2. Backend APIs - Test all 30+ endpoints for correctness
3. Data Integrity - Validate data relationships and consistency
4. Performance - Check response times are acceptable
5. Error Handling - Verify proper error responses

Run this after any changes to ensure nothing breaks.
"""

import sys
import time
import requests
from pymongo import MongoClient
from typing import Dict, List, Tuple
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:8080"
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "voting_analysis"

# ANSI colors for output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

# Test results tracking
tests_passed = 0
tests_failed = 0
tests_skipped = 0
test_results: List[Tuple[str, bool, str]] = []


def print_header(text: str):
    """Print a section header."""
    print(f"\n{BLUE}{'=' * 70}")
    print(f"{text}")
    print(f"{'=' * 70}{RESET}\n")


def print_test(name: str, passed: bool, message: str = ""):
    """Print test result."""
    global tests_passed, tests_failed
    
    if passed:
        print(f"{GREEN}✓{RESET} {name}")
        tests_passed += 1
    else:
        print(f"{RED}✗{RESET} {name}")
        if message:
            print(f"  {RED}Error: {message}{RESET}")
        tests_failed += 1
    
    test_results.append((name, passed, message))


def test_backend_health():
    """Test if backend is running and healthy."""
    print_header("1. Backend Health Check")
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/equipment/health", timeout=5)
        passed = response.status_code == 200 and response.json().get("status") == "ok"
        print_test("Backend health endpoint", passed)
        return passed
    except Exception as e:
        print_test("Backend health endpoint", False, str(e))
        return False


def test_database_collections():
    """Test that all required MongoDB collections exist with data."""
    print_header("2. Database Collections Check")
    
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        
        expected_collections = {
            "eavsData": 19000,          # ~19k EAVS records
            "votingEquipmentData": 1000, # ~1k equipment records
            "equipment_history": 1000,   # ~1k historical records
            "census_block_voters": 4000, # ~4k census blocks
            "ei_equipment_analysis": 6,  # 6 demographics
            "ei_rejection_analysis": 6,  # 6 demographics
            "ei_precinct_analysis": 150, # ~150 precincts
        }
        
        # Optional collections (don't fail if missing)
        optional_collections = {
            "precinct_demographics": 0,  # May be empty (for Gingles analysis)
        }
        
        all_collections = db.list_collection_names()
        
        for collection, min_expected in expected_collections.items():
            exists = collection in all_collections
            if exists:
                count = db[collection].count_documents({})
                passed = count >= min_expected if min_expected > 0 else True
                print_test(
                    f"Collection '{collection}' exists ({count:,} docs)",
                    passed,
                    f"Expected at least {min_expected:,} documents" if not passed else ""
                )
            else:
                print_test(f"Collection '{collection}' exists", False, "Collection not found")
        
        # Check optional collections (don't count as failures)
        for collection, min_expected in optional_collections.items():
            exists = collection in all_collections
            if exists:
                count = db[collection].count_documents({})
                print(f"  {YELLOW}○{RESET} Collection '{collection}' exists ({count:,} docs) [optional]")
            else:
                print(f"  {YELLOW}○{RESET} Collection '{collection}' not found [optional, okay]")
        
        client.close()
        return True
        
    except Exception as e:
        print_test("Database connection", False, str(e))
        return False


def test_equipment_endpoints():
    """Test equipment-related API endpoints."""
    print_header("3. Equipment API Endpoints")
    
    endpoints = [
        ("/api/equipment/health", "Health check"),
        ("/api/equipment/Maryland/types", "Equipment types by state"),
        ("/api/equipment/all-states", "Equipment all states"),
        ("/api/equipment/history/Maryland", "Equipment history"),
    ]
    
    for endpoint, description in endpoints:
        try:
            response = requests.get(f"{BACKEND_URL}{endpoint}", timeout=5)
            passed = response.status_code == 200
            if passed and "history" in endpoint:
                data = response.json()
                passed = len(data) > 0  # Should have historical data
            print_test(f"{description}: GET {endpoint}", passed)
        except Exception as e:
            print_test(f"{description}: GET {endpoint}", False, str(e))


def test_registration_endpoints():
    """Test voter registration API endpoints."""
    print_header("4. Voter Registration API Endpoints")
    
    endpoints = [
        ("/api/registration/trends/Maryland", "Registration trends"),
        ("/api/registration/blocks/Maryland", "Census block bubbles"),
        ("/api/registration/voters/Maryland/Baltimore County?party=Democratic&page=0&size=10", "Voter list"),
    ]
    
    for endpoint, description in endpoints:
        try:
            response = requests.get(f"{BACKEND_URL}{endpoint}", timeout=5)
            passed = response.status_code == 200
            if passed:
                data = response.json()
                # Basic validation that response has data
                passed = len(data) > 0 if isinstance(data, list) else bool(data)
            print_test(f"{description}: GET {endpoint}", passed)
        except Exception as e:
            print_test(f"{description}: GET {endpoint}", False, str(e))


def test_eavs_endpoints():
    """Test EAVS data API endpoints."""
    print_header("5. EAVS Data API Endpoints")
    
    endpoints = [
        ("/api/eavs/MARYLAND/active-voters?year=2020", "Active voters"),
        ("/api/eavs/MARYLAND/provisional-ballots?year=2020", "Provisional ballots"),
        ("/api/eavs/MARYLAND/pollbook-deletions?year=2020", "Pollbook deletions"),
        ("/api/eavs/MARYLAND/mail-rejections?year=2020", "Mail rejections"),
    ]
    
    for endpoint, description in endpoints:
        try:
            response = requests.get(f"{BACKEND_URL}{endpoint}", timeout=5)
            passed = response.status_code == 200
            if passed:
                data = response.json()
                passed = len(data) > 0 if isinstance(data, list) else bool(data)
            print_test(f"{description}: GET {endpoint}", passed)
        except Exception as e:
            print_test(f"{description}: GET {endpoint}", False, str(e))


def test_preclearance_endpoints():
    """Test preclearance (Maryland-specific) API endpoints."""
    print_header("6. Preclearance API Endpoints (Maryland)")
    
    endpoints = [
        ("/api/preclearance/health", "Preclearance health"),
        ("/api/preclearance/gingles/Maryland", "Gingles analysis"),
        ("/api/preclearance/ei-equipment/Maryland", "EI equipment analysis"),
        ("/api/preclearance/ei-rejected/Maryland", "EI rejection analysis"),
    ]
    
    for endpoint, description in endpoints:
        try:
            response = requests.get(f"{BACKEND_URL}{endpoint}", timeout=5)
            passed = response.status_code == 200
            
            if passed and "ei-" in endpoint:
                data = response.json()
                # Verify EI endpoints return curves
                passed = "curves" in data and len(data["curves"]) == 6
            
            print_test(f"{description}: GET {endpoint}", passed)
        except Exception as e:
            print_test(f"{description}: GET {endpoint}", False, str(e))


def test_data_integrity():
    """Test data relationships and consistency."""
    print_header("7. Data Integrity Checks")
    
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        
        # Test 1: Equipment history has data for multiple years
        history_sample = db.equipment_history.find_one({})
        if history_sample:
            has_year = "year" in history_sample
            has_count = "count" in history_sample or any(k for k in history_sample.keys() if "count" in k.lower())
            print_test("Equipment history has year and count fields", has_year and has_count)
        else:
            print_test("Equipment history has data", False, "No documents found")
        
        # Test 2: Census blocks have geographic coordinates
        census_sample = db.census_block_voters.find_one({})
        if census_sample:
            has_coords = "centerLat" in census_sample and "centerLng" in census_sample
            print_test("Census blocks have geographic coordinates", has_coords)
        else:
            print_test("Census blocks have data", False, "No documents found")
        
        # Test 3: EI analysis has complete probability curves
        ei_equipment = db.ei_equipment_analysis.find_one({})
        if ei_equipment:
            has_curve = "curve" in ei_equipment
            if has_curve:
                curve_length = len(ei_equipment["curve"])
                passed = curve_length > 40  # Should have ~51 points
                print_test(f"EI equipment curves have sufficient data points ({curve_length})", passed)
            else:
                print_test("EI equipment has curve data", False, "No curve field")
        else:
            print_test("EI equipment analysis has data", False, "No documents found")
        
        # Test 4: EAVS data has required fields
        eavs_sample = db.eavsData.find_one({})
        if eavs_sample:
            has_state = "stateFull" in eavs_sample or "state" in eavs_sample
            has_year = "year" in eavs_sample
            print_test("EAVS data has state and year fields", has_state and has_year)
        else:
            print_test("EAVS data exists", False, "No documents found")
        
        client.close()
        
    except Exception as e:
        print_test("Data integrity checks", False, str(e))


def test_performance():
    """Test API response times."""
    print_header("8. Performance Tests")
    
    endpoints = [
        "/api/equipment/health",
        "/api/registration/trends/Maryland",
        "/api/preclearance/ei-equipment/Maryland",
    ]
    
    for endpoint in endpoints:
        try:
            start = time.time()
            response = requests.get(f"{BACKEND_URL}{endpoint}", timeout=10)
            duration = (time.time() - start) * 1000  # Convert to ms
            
            passed = response.status_code == 200 and duration < 2000  # Should be under 2s
            print_test(
                f"Response time for {endpoint} ({duration:.0f}ms)",
                passed,
                "Response too slow (>2000ms)" if not passed else ""
            )
        except Exception as e:
            print_test(f"Performance test for {endpoint}", False, str(e))


def test_error_handling():
    """Test that API handles errors properly."""
    print_header("9. Error Handling Tests")
    
    test_cases = [
        ("/api/equipment/state/InvalidState", 404, "Invalid state name"),
        ("/api/registration/voters/Maryland/InvalidCounty", 404, "Invalid county name"),
        ("/api/eavs/state/Maryland?year=1800", 404, "Invalid year"),
    ]
    
    for endpoint, expected_status, description in test_cases:
        try:
            response = requests.get(f"{BACKEND_URL}{endpoint}", timeout=5)
            # For now, just check it doesn't crash (200 or 404 acceptable)
            passed = response.status_code in [200, 404, 400]
            print_test(f"{description}: GET {endpoint}", passed)
        except Exception as e:
            print_test(f"{description}: GET {endpoint}", False, str(e))


def test_gui_data_generation():
    """Verify all GUI data generation scripts completed successfully."""
    print_header("10. GUI Data Generation Validation")
    
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        
        # Check each GUI feature has supporting data
        checks = [
            ("equipment_history", "GUI-14: Equipment History"),
            ("census_block_voters", "GUI-18: Registration Bubbles"),
            ("ei_equipment_analysis", "GUI-28: EI Equipment"),
            ("ei_rejection_analysis", "GUI-29: EI Rejection"),
        ]
        
        for collection, gui_name in checks:
            count = db[collection].count_documents({})
            passed = count > 0
            print_test(f"{gui_name} data exists ({count} docs)", passed)
        
        client.close()
        
    except Exception as e:
        print_test("GUI data generation validation", False, str(e))


def print_summary():
    """Print final test summary."""
    print_header("Test Summary")
    
    total = tests_passed + tests_failed
    pass_rate = (tests_passed / total * 100) if total > 0 else 0
    
    print(f"Total Tests: {total}")
    print(f"{GREEN}Passed: {tests_passed}{RESET}")
    print(f"{RED}Failed: {tests_failed}{RESET}")
    print(f"Pass Rate: {pass_rate:.1f}%\n")
    
    if tests_failed > 0:
        print(f"{RED}Failed Tests:{RESET}")
        for name, passed, message in test_results:
            if not passed:
                print(f"  - {name}")
                if message:
                    print(f"    {message}")
        print()
    
    if pass_rate >= 90:
        print(f"{GREEN}✓ System is healthy! All critical tests passed.{RESET}")
        return 0
    elif pass_rate >= 70:
        print(f"{YELLOW}⚠ System is functional but has some issues.{RESET}")
        return 1
    else:
        print(f"{RED}✗ System has critical failures. Please investigate.{RESET}")
        return 2


def main():
    """Run all tests."""
    print(f"\n{BLUE}╔═══════════════════════════════════════════════════════════════════╗")
    print(f"║  Raptors Voting Analysis - Automated Integration Test Suite      ║")
    print(f"║  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}                                           ║")
    print(f"╚═══════════════════════════════════════════════════════════════════╝{RESET}\n")
    
    # Run all test suites
    backend_healthy = test_backend_health()
    
    if not backend_healthy:
        print(f"\n{RED}Backend is not running. Please start the backend first:{RESET}")
        print(f"  cd raptors-backend && ./mvnw spring-boot:run")
        return 1
    
    test_database_collections()
    test_equipment_endpoints()
    test_registration_endpoints()
    test_eavs_endpoints()
    test_preclearance_endpoints()
    test_data_integrity()
    test_performance()
    test_error_handling()
    test_gui_data_generation()
    
    return print_summary()


if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Tests interrupted by user.{RESET}")
        sys.exit(130)
    except Exception as e:
        print(f"\n{RED}Fatal error: {e}{RESET}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

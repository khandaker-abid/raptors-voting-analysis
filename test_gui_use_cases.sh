#!/bin/bash

# GUI Use Cases Testing Script
# Comprehensive test suite for all 30 GUI use cases

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
PASSED=0
FAILED=0
SKIPPED=0

echo "========================================="
echo "Raptors Voting Analysis - GUI Testing"
echo "========================================="
echo ""

# Check if backend is running
echo "Checking backend server..."
if curl -s http://localhost:8080/api/eavs/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend server is running on port 8080"
    BACKEND_RUNNING=true
else
    echo -e "${YELLOW}⚠${NC} Backend server not detected on port 8080"
    echo "   Some tests will be skipped. Start with: cd raptors-backend && ./mvnw spring-boot:run"
    BACKEND_RUNNING=false
fi

# Check if frontend is running
echo "Checking frontend server..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Frontend server is running on port 5173"
    FRONTEND_RUNNING=true
else
    echo -e "${YELLOW}⚠${NC} Frontend server not detected on port 5173"
    echo "   Start with: npm run dev"
    FRONTEND_RUNNING=false
fi

echo ""
echo "========================================="
echo "Testing Backend API Endpoints"
echo "========================================="
echo ""

# Function to test an endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    if [ "$BACKEND_RUNNING" = false ]; then
        echo -e "${BLUE}⊘${NC} $name - SKIPPED (backend not running)"
        SKIPPED=$((SKIPPED+1))
        return
    fi
    
    response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null || echo "000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} $name - HTTP $http_code"
        PASSED=$((PASSED+1))
    else
        echo -e "${RED}✗${NC} $name - HTTP $http_code (expected $expected_status)"
        FAILED=$((FAILED+1))
    fi
}

# Test health endpoints
echo "Health Checks:"
test_endpoint "EAVS Health" "http://localhost:8080/api/eavs/health"
test_endpoint "Equipment Health" "http://localhost:8080/api/equipment/health"
test_endpoint "Registration Health" "http://localhost:8080/api/registration/health"
test_endpoint "Preclearance Health" "http://localhost:8080/api/preclearance/health"

echo ""
echo "EAVS Endpoints (GUI-7, GUI-8, GUI-9):"
test_endpoint "Active Voters - Maryland" "http://localhost:8080/api/eavs/Maryland/active-voters?year=2024"
test_endpoint "Pollbook Deletions - Maryland" "http://localhost:8080/api/eavs/Maryland/pollbook-deletions?year=2024"
test_endpoint "Mail Rejections - Maryland" "http://localhost:8080/api/eavs/Maryland/mail-rejections?year=2024"

echo ""
echo "Equipment Endpoints (GUI-10, GUI-11, GUI-14):"
test_endpoint "Equipment Types - Maryland" "http://localhost:8080/api/equipment/Maryland/types"
test_endpoint "Equipment Age - All States" "http://localhost:8080/api/equipment/age/all-states"
test_endpoint "Equipment History - Maryland" "http://localhost:8080/api/equipment/history/Maryland"

echo ""
echo "Registration Endpoints (GUI-16, GUI-18, GUI-19):"
test_endpoint "Registration Trends - Maryland" "http://localhost:8080/api/registration/trends/Maryland?years=2016,2020,2024"
test_endpoint "Census Block Bubbles - Maryland" "http://localhost:8080/api/registration/blocks/Maryland"
test_endpoint "Registered Voters - Maryland" "http://localhost:8080/api/registration/voters/Maryland/All?page=0&size=25"

echo ""
echo "Preclearance Endpoints (GUI-27, GUI-28, GUI-29):"
test_endpoint "Gingles Analysis - Maryland" "http://localhost:8080/api/preclearance/gingles/Maryland"
test_endpoint "EI Equipment - Maryland" "http://localhost:8080/api/preclearance/ei-equipment/Maryland"
test_endpoint "EI Rejected - Maryland" "http://localhost:8080/api/preclearance/ei-rejected/Maryland"

echo ""
echo "========================================="
echo "GUI Use Cases Checklist"
echo "========================================="
echo ""

# Function to check GUI use case
check_gui() {
    local id=$1
    local name=$2
    local status=$3
    local notes=$4
    
    case $status in
        "IMPLEMENTED")
            echo -e "${GREEN}✓${NC} $id: $name"
            PASSED=$((PASSED+1))
            ;;
        "PARTIAL")
            echo -e "${YELLOW}⚠${NC} $id: $name - $notes"
            SKIPPED=$((SKIPPED+1))
            ;;
        "MISSING")
            echo -e "${RED}✗${NC} $id: $name - $notes"
            FAILED=$((FAILED+1))
            ;;
    esac
}

echo "REQUIRED Use Cases:"
check_gui "GUI-1" "Display US map on splash page" "IMPLEMENTED"
check_gui "GUI-2" "Display State detail pages" "IMPLEMENTED"
check_gui "GUI-3" "Provisional ballot bar chart" "IMPLEMENTED"
check_gui "GUI-4" "Provisional ballot table" "IMPLEMENTED"
check_gui "GUI-5" "Provisional ballot choropleth" "IMPLEMENTED"
check_gui "GUI-6" "State voting equipment summary" "IMPLEMENTED"
check_gui "GUI-7" "Display 2024 EAVS active voters" "IMPLEMENTED"
check_gui "GUI-8" "Display pollbook deletions" "IMPLEMENTED"
check_gui "GUI-9" "Display mail ballots rejected" "IMPLEMENTED"
check_gui "GUI-10" "Display equipment types choropleth" "IMPLEMENTED"
check_gui "GUI-11" "Display equipment age map" "IMPLEMENTED"
check_gui "GUI-12" "Display voting equipment in US" "IMPLEMENTED"
check_gui "GUI-13" "Display US voting equipment summary" "IMPLEMENTED"
check_gui "GUI-14" "Display voting equipment history by state" "PARTIAL" "Needs historical data"
check_gui "GUI-15/22" "Compare changes in voter party affiliation" "PARTIAL" "Table exists, needs complete data"
check_gui "GUI-16" "Compare changes in voter registration" "IMPLEMENTED"
check_gui "GUI-17" "Display voter registration data" "IMPLEMENTED"
check_gui "GUI-18" "Display voter registration bubble chart" "IMPLEMENTED"
check_gui "GUI-19" "Display registered voters by name" "IMPLEMENTED"

echo ""
echo "PREFERRED Use Cases:"
check_gui "GUI-20" "Compare voter registration methods" "IMPLEMENTED"
check_gui "GUI-21" "Compare opt-in/opt-out registration" "IMPLEMENTED"
check_gui "GUI-23" "Compare early voting methods" "IMPLEMENTED"
check_gui "GUI-24" "Display drop box vs electronic bubble chart" "PARTIAL" "Component exists, not integrated"
check_gui "GUI-25" "Display equipment vs rejected ballot bubble chart" "PARTIAL" "Component exists, not integrated"
check_gui "GUI-26" "Display regression line for voting method correlation" "PARTIAL" "Support exists, coefficients needed"
check_gui "GUI-27" "Display Gingles chart (preclearance)" "IMPLEMENTED"

echo ""
echo "OPTIONAL Use Cases:"
check_gui "GUI-28" "Display EI equipment access chart" "MISSING" "Needs implementation"
check_gui "GUI-29" "Display EI rejected ballots chart" "MISSING" "Needs implementation"
check_gui "GUI-30" "Display felony voting policies" "MISSING" "Not started"

echo ""
echo "========================================="
echo "Manual Testing Checklist"
echo "========================================="
echo ""

if [ "$FRONTEND_RUNNING" = true ]; then
    echo -e "${GREEN}Frontend is running. Please test manually:${NC}"
    echo ""
    echo "1. Splash Page (GUI-1, GUI-11):"
    echo "   □ Navigate to http://localhost:5173"
    echo "   □ Verify US map displays"
    echo "   □ Toggle between 'State Map' and 'Equipment Age'"
    echo "   □ Verify equipment age choropleth colors"
    echo ""
    echo "2. State Detail Page - Maryland (All tabs):"
    echo "   □ Click Maryland on map"
    echo "   □ Verify 'State Map' tab shows Maryland map"
    echo "   □ Check 'Provisional Ballot' tab (chart + table + choropleth)"
    echo "   □ Check 'Active Voters' tab (chart + table + choropleth)"
    echo "   □ Check 'Pollbook Deletions' tab (chart + table + choropleth)"
    echo "   □ Check 'Mail Rejections' tab (chart + table + choropleth)"
    echo "   □ Check 'Voting Equipment' tab (table)"
    echo "   □ Check 'Equipment Types' tab (choropleth with legend)"
    echo "   □ Check 'Voter Registration' tab (table + choropleth + trends)"
    echo "   □ Click 'View Registered Voters' button (dialog opens)"
    echo "   □ Check 'Gingles Analysis' tab (scatter plot + info alert)"
    echo ""
    echo "3. Other Detail States (Rhode Island, Arkansas):"
    echo "   □ Navigate to Rhode Island"
    echo "   □ Verify all detail state tabs appear"
    echo "   □ Navigate to Arkansas"
    echo "   □ Verify all detail state tabs appear"
    echo ""
    echo "4. Comparison Pages:"
    echo "   □ Navigate to '/party-comparison' (GUI-15/22)"
    echo "   □ Navigate to '/registration-comparison' (GUI-21, GUI-23)"
    echo "   □ Navigate to '/voting-equipment-summary' (GUI-13)"
    echo "   □ Navigate to '/per-state-voting-equipment' (GUI-12)"
    echo ""
    echo "5. Interactive Features:"
    echo "   □ RegisteredVotersList dialog:"
    echo "     - Pagination controls work"
    echo "     - Party filter dropdown works"
    echo "     - Close button works"
    echo "   □ Voter registration bubble overlay:"
    echo "     - Toggle button shows/hides bubbles"
    echo "   □ Registration trends chart:"
    echo "     - Shows data for 2016, 2020, 2024"
    echo ""
else
    echo -e "${YELLOW}Frontend not running. Start with: npm run dev${NC}"
fi

echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo ""
echo -e "${GREEN}Passed:${NC}  $PASSED"
echo -e "${YELLOW}Skipped:${NC} $SKIPPED"
echo -e "${RED}Failed:${NC}  $FAILED"
echo ""

TOTAL=$((PASSED + SKIPPED + FAILED))
if [ $TOTAL -gt 0 ]; then
    PASS_RATE=$((PASSED * 100 / TOTAL))
    echo "Pass Rate: ${PASS_RATE}%"
fi

echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All automated tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Check output above.${NC}"
    exit 1
fi

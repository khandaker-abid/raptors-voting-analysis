#!/bin/bash

# Preprocessing Verification Script
# Checks if all required preprocessing has been completed successfully

set -e

echo "========================================="
echo "Raptors Voting Analysis - Preprocessing Verification"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ERRORS=0
WARNINGS=0

# Check MongoDB connection
echo "1. Checking MongoDB connection..."
if mongo --eval "db.version()" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} MongoDB is running"
else
    echo -e "${RED}✗${NC} MongoDB is not running or not accessible"
    echo "   Run: sudo systemctl start mongod"
    ERRORS=$((ERRORS+1))
fi

# Check if database exists
echo ""
echo "2. Checking voting_analysis database..."
DB_EXISTS=$(mongo voting_analysis --quiet --eval "db.getName()" 2>/dev/null || echo "")
if [ "$DB_EXISTS" == "voting_analysis" ]; then
    echo -e "${GREEN}✓${NC} Database 'voting_analysis' exists"
else
    echo -e "${RED}✗${NC} Database 'voting_analysis' not found"
    echo "   You need to run preprocessing scripts"
    ERRORS=$((ERRORS+1))
fi

# Check required collections
echo ""
echo "3. Checking MongoDB collections..."
REQUIRED_COLLECTIONS=(
    "eavs_data"
    "equipment"
    "boundaries"
    "voter_registration"
    "election_results"
    "cvap_data"
)

for COLLECTION in "${REQUIRED_COLLECTIONS[@]}"; do
    COUNT=$(mongo voting_analysis --quiet --eval "db.${COLLECTION}.count()" 2>/dev/null || echo "0")
    if [ "$COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓${NC} ${COLLECTION}: ${COUNT} documents"
    else
        echo -e "${YELLOW}⚠${NC} ${COLLECTION}: 0 documents or missing"
        WARNINGS=$((WARNINGS+1))
    fi
done

# Check for detailed state data
echo ""
echo "4. Checking detailed state data..."
STATES=("Rhode Island" "Maryland" "Arkansas")
for STATE in "${STATES[@]}"; do
    COUNT=$(mongo voting_analysis --quiet --eval "db.eavs_data.count({stateFull: '${STATE}'})" 2>/dev/null || echo "0")
    if [ "$COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓${NC} ${STATE}: ${COUNT} EAVS records"
    else
        echo -e "${RED}✗${NC} ${STATE}: No EAVS data found"
        ERRORS=$((ERRORS+1))
    fi
done

# Check Maryland voter registration (special case)
echo ""
echo "5. Checking Maryland voter registration..."
MD_VOTERS=$(mongo voting_analysis --quiet --eval "db.voter_registration.count({state: 'Maryland'})" 2>/dev/null || echo "0")
if [ "$MD_VOTERS" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Maryland voter registration: ${MD_VOTERS} records"
else
    echo -e "${YELLOW}⚠${NC} Maryland voter registration: 0 records"
    echo "   GUI-19 (Registered Voters List) will not work"
    WARNINGS=$((WARNINGS+1))
fi

# Check equipment data
echo ""
echo "6. Checking equipment data..."
EQUIPMENT_COUNT=$(mongo voting_analysis --quiet --eval "db.equipment.count()" 2>/dev/null || echo "0")
if [ "$EQUIPMENT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Equipment data: ${EQUIPMENT_COUNT} records"
    
    # Check if equipment has age data
    AGE_COUNT=$(mongo voting_analysis --quiet --eval "db.equipment.count({'equipments.age': {\$exists: true}})" 2>/dev/null || echo "0")
    if [ "$AGE_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓${NC} Equipment age data available"
    else
        echo -e "${YELLOW}⚠${NC} Equipment age data missing (GUI-11 won't work)"
        WARNINGS=$((WARNINGS+1))
    fi
else
    echo -e "${RED}✗${NC} Equipment data: 0 records"
    ERRORS=$((ERRORS+1))
fi

# Check preprocessing log
echo ""
echo "7. Checking preprocessing logs..."
if [ -f "preprocessing/preprocessing_output.log" ]; then
    LAST_RUN=$(tail -1 preprocessing/preprocessing_output.log)
    echo -e "${GREEN}✓${NC} Log file exists"
    echo "   Last entry: ${LAST_RUN}"
else
    echo -e "${YELLOW}⚠${NC} No preprocessing log found"
    WARNINGS=$((WARNINGS+1))
fi

# Check config.json
echo ""
echo "8. Checking preprocessing configuration..."
if [ -f "preprocessing/config.json" ]; then
    echo -e "${GREEN}✓${NC} config.json exists"
    
    # Check MongoDB URI
    MONGO_URI=$(python3 -c "import json; print(json.load(open('preprocessing/config.json'))['mongodb']['uri'])" 2>/dev/null || echo "")
    if [ "$MONGO_URI" == "mongodb://localhost:27017" ]; then
        echo -e "${GREEN}✓${NC} MongoDB URI configured correctly"
    else
        echo -e "${YELLOW}⚠${NC} MongoDB URI: ${MONGO_URI}"
    fi
    
    # Check detailed states
    DETAILED_STATES=$(python3 -c "import json; print(','.join(json.load(open('preprocessing/config.json'))['detailed_states']))" 2>/dev/null || echo "")
    echo "   Detailed states: ${DETAILED_STATES}"
else
    echo -e "${RED}✗${NC} config.json not found"
    ERRORS=$((ERRORS+1))
fi

# Check for cache directories
echo ""
echo "9. Checking preprocessing cache..."
CACHE_DIRS=("boundaries" "eavs" "equipment" "election_results")
for DIR in "${CACHE_DIRS[@]}"; do
    if [ -d "preprocessing/cache/${DIR}" ]; then
        FILE_COUNT=$(find "preprocessing/cache/${DIR}" -type f | wc -l)
        echo -e "${GREEN}✓${NC} ${DIR}: ${FILE_COUNT} cached files"
    else
        echo -e "${YELLOW}⚠${NC} ${DIR}: cache directory missing"
        WARNINGS=$((WARNINGS+1))
    fi
done

# Summary
echo ""
echo "========================================="
echo "Verification Summary"
echo "========================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "You're ready to start the backend server:"
    echo "  cd backend && ./mvnw spring-boot:run"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ ${WARNINGS} warnings found${NC}"
    echo ""
    echo "Some optional features may not work, but you can proceed."
    echo "To fix warnings, run the relevant preprocessing scripts."
    exit 0
else
    echo -e "${RED}✗ ${ERRORS} errors found, ${WARNINGS} warnings${NC}"
    echo ""
    echo "Critical issues detected. You need to:"
    echo "  1. Start MongoDB: sudo systemctl start mongod"
    echo "  2. Run preprocessing: cd preprocessing && bash run_all_preprocessing.sh"
    echo ""
    exit 1
fi

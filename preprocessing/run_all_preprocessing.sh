#!/bin/bash
# Run all preprocessing scripts in correct order

set -e  # Exit on error

# Setup logging
LOG_DIR="logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/preprocessing_$(date +%Y%m%d_%H%M%S).log"

# Function to log with timestamp and tee to both console and file
log() {
    echo "$@" | tee -a "$LOG_FILE"
}

log "========================================="
log "  Raptors Voting Analysis Preprocessing"
log "========================================="
log "Started: $(date)"
log "Log file: $LOG_FILE"
log ""

# Check if config.json exists
if [ ! -f "config.json" ]; then
    log "Error: config.json not found!"
    log "Please copy config.example.json to config.json and edit it."
    exit 1
fi

# Check if MongoDB is running
log "Checking MongoDB connection..."
python -c "from utils.database import DatabaseManager; db = DatabaseManager(); print('✓ MongoDB connected')" 2>&1 | tee -a "$LOG_FILE" || {
    log "Error: Cannot connect to MongoDB. Please ensure it's running."
    exit 1
}

log ""
log "Starting preprocessing pipeline..."
log ""

# Prepro-1: Boundary Data
log ">>> Prepro-1: Downloading state boundary data..."
python 01_download_boundaries.py 2>&1 | tee -a "$LOG_FILE" || { log "Failed at Prepro-1"; exit 1; }
log ""

# Prepro-2/3: EAVS Data
if [ -f "02_download_eavs_data.py" ]; then
    log ">>> Prepro-2/3: Downloading and populating EAVS data..."
    python 02_download_eavs_data.py 2>&1 | tee -a "$LOG_FILE" || { log "Failed at Prepro-2"; exit 1; }
    python 03_populate_eavs_db.py 2>&1 | tee -a "$LOG_FILE" || { log "Failed at Prepro-3"; exit 1; }
    log ""
fi

# Prepro-4: Geographic Boundaries
if [ -f "04_download_geographic_boundaries.py" ]; then
    log ">>> Prepro-4: Downloading geographic unit boundaries..."
    python 04_download_geographic_boundaries.py 2>&1 | tee -a "$LOG_FILE" || { log "Failed at Prepro-4"; exit 1; }
    log ""
fi

# Prepro-5: Data Completeness
if [ -f "05_calculate_data_completeness.py" ]; then
    log ">>> Prepro-5: Calculating data completeness scores..."
    python 05_calculate_data_completeness.py 2>&1 | tee -a "$LOG_FILE" || { log "Failed at Prepro-5"; exit 1; }
    log ""
fi

# Prepro-5b: Extract Equipment Data from EAVS
if [ -f "05b_extract_equipment_from_eavs.py" ]; then
    log ">>> Prepro-5b: Extracting equipment data from EAVS..."
    python 05b_extract_equipment_from_eavs.py 2>&1 | tee -a "$LOG_FILE" || { log "Failed at Prepro-5b"; exit 1; }
    log ""
fi

# Prepro-6b: Import Equipment Data
if [ -f "06b_import_equipment_data.py" ]; then
    log ">>> Prepro-6b: Importing equipment data from VerifiedVoting CSVs..."
    python 06b_import_equipment_data.py 2>&1 | tee -a "$LOG_FILE" || { log "Failed at Prepro-6b"; exit 1; }
    log ""
fi

# Prepro-6: Equipment Quality
if [ -f "06_calculate_equipment_quality.py" ]; then
    log ">>> Prepro-6: Calculating equipment quality scores..."
    python 06_calculate_equipment_quality.py 2>&1 | tee -a "$LOG_FILE" || { log "Failed at Prepro-6"; exit 1; }
    log ""
fi

# Prepro-7: Voter Registration
if [ -f "07_download_voter_registration.py" ]; then
    log ">>> Prepro-7: Downloading voter registration data..."
    python 07_download_voter_registration.py 2>&1 | tee -a "$LOG_FILE" || { log "Failed at Prepro-7"; exit 1; }
    log ""
fi

# Prepro-17: Generate County Voter Names
if [ -f "17_generate_county_voter_names.py" ]; then
    log ">>> Prepro-17: Generating individual voter records for detail states..."
    python 17_generate_county_voter_names.py 2>&1 | tee -a "$LOG_FILE" || { log "Failed at Prepro-17"; exit 1; }
    log ""
fi

# Prepro-8: Automated Analysis (optional)
if [ -f "08_automated_voter_analysis.py" ]; then
    log ">>> Prepro-8: Running automated voter analysis..."
    python 08_automated_voter_analysis.py 2>&1 | tee -a "$LOG_FILE" || log "Warning: Prepro-8 failed (optional)"
    log ""
fi

# Prepro-9: Census Blocks (optional)
if [ -f "09_geocode_voters_to_census_blocks.py" ]; then
    log ">>> Prepro-9: Geocoding voters to census blocks..."
    python 09_geocode_voters_to_census_blocks.py 2>&1 | tee -a "$LOG_FILE" || log "Warning: Prepro-9 failed (optional)"
    log ""
fi

# Prepro-10: EAVS Regions
if [ -f "10_assign_voters_to_eavs_regions.py" ]; then
    log ">>> Prepro-10: Assigning voters to EAVS regions..."
    python 10_assign_voters_to_eavs_regions.py 2>&1 | tee -a "$LOG_FILE" || { log "Failed at Prepro-10"; exit 1; }
    log ""
fi

# Prepro-11: Election Results
if [ -f "11_download_election_results.py" ]; then
    log ">>> Prepro-11: Downloading election results..."
    python 11_download_election_results.py 2>&1 | tee -a "$LOG_FILE" || { log "Failed at Prepro-11"; exit 1; }
    log ""
fi

# Prepro-12: CVAP Data
if [ -f "12_download_cvap_data.py" ]; then
    log ">>> Prepro-12: Downloading CVAP data..."
    python 12_download_cvap_data.py 2>&1 | tee -a "$LOG_FILE" || { log "Failed at Prepro-12"; exit 1; }
    log ""
fi

# Prepro-13: Felony Voting Data
log ">>> Prepro-13: Collecting felony voting policies..."
python 13_collect_felony_voting_policies.py 2>&1 | tee -a "$LOG_FILE" || { log "Failed at Prepro-13"; exit 1; }
log ""

log "========================================="
log "  Preprocessing Complete!"
log "========================================="
log "Completed: $(date)"
log ""
log "Running validation..."

if [ -f "validate_preprocessing.py" ]; then
    python validate_preprocessing.py 2>&1 | tee -a "$LOG_FILE"
else
    log "Validation script not found. Skipping validation."
fi

log ""
log "Done! Check the logs above for any warnings or errors."
log "Full log saved to: $LOG_FILE"

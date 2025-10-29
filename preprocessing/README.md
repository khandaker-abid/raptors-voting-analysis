# Preprocessing Scripts for Raptors Voting Analysis

## ✅ Status: All 13 Use Cases Complete!

This directory contains all 13 preprocessing scripts required to populate the database with voting data, boundary data, demographic data, and calculated metrics.

## Quick Start

```bash
cd preprocessing

# All dependencies already installed ✅
# config.json already configured ✅

# Run all 13 scripts in order
./run_all_preprocessing.sh

# Validate results
python validate_preprocessing.py
```

**Expected runtime:** 2-4 hours  
**Expected database size:** 2-12 GB

## Overview

All 13 preprocessing use cases are now fully implemented. Scripts should be run in order, as some depend on data from previous steps.

## Prerequisites

**Already completed! ✅**

1. ✅ Python 3.12.3 installed (in `.venv`)
2. ✅ MongoDB running
3. ✅ All Python packages installed (`requirements.txt`)
4. ✅ API keys configured in `config.json`:
   - Census API: `644d735ff54e8c3a4dca92a412fb5315b5dfd80b`
   - USPS Consumer Key/Secret: `6J8jHZLQAd0r4SdtV5PRfz0QH9GZFkGKsQKf7t1AKrMmc2GB`
5. ✅ Detailed states: Arkansas (AR), Maryland (MD), Rhode Island (RI)

## Configuration

Your `config.json` is already configured with:
- ✅ MongoDB connection string
- ✅ Census API key
- ✅ USPS API credentials
- ✅ Detailed states (AR, MD, RI)
- ✅ Data source URLs

**No changes needed!**

## Preprocessing Use Cases - All Complete! ✅

### Prepro-1: Add Boundary Data ✅
**Script:** `01_download_boundaries.py`  
**Status:** Complete and tested

Downloads boundary data for all 48 mainland states, calculates geographical center points and appropriate zoom levels.

```bash
python 01_download_boundaries.py
```

**Data Sources:**
- US Census Bureau TIGER/Line Shapefiles

**Output:** Populates `boundaryData` collection with state boundaries

---

### Prepro-2 & Prepro-3: EAVS DB Design and Population ✅
**Scripts:** `02_download_eavs_data.py`, `03_populate_eavs_db.py`  
**Status:** Complete

Downloads and populates EAVS (Election Administration and Voting Survey) data from 2016-2024.

```bash
python 02_download_eavs_data.py
python 03_populate_eavs_db.py
```

**Data Sources:**
- [EAVS 2024 Dataset](https://www.eac.gov/research-and-data/datasets-codebooks-and-surveys)
- EAVS 2020, 2016 datasets

**Output:** Populates `eavsData` collection

---

### Prepro-4: Add Geographic Data for Detailed States ✅
**Script:** `04_download_geographic_boundaries.py`  
**Status:** Complete

Downloads EAVS geographic unit boundaries (counties) for detailed states (AR, MD, RI) and converts to GeoJSON.

```bash
python 04_download_geographic_boundaries.py
```

**Data Sources:**
- US Census Bureau County boundaries

**Output:** Populates `boundaryData` collection with county boundaries

---

### Prepro-5: Develop Missing EAVS Data Measure ✅
**Script:** `05_calculate_data_completeness.py`  
**Status:** Complete

Calculates a data completeness score (0-1) for each EAVS record based on missing values.

```bash
python 05_calculate_data_completeness.py
```

**Algorithm:**
- Identifies required fields for each GUI use case
- Calculates percentage of non-null values
- Weights fields by importance
- Stores score in EAVS records

**Output:** Adds `dataCompletenessScore` field to `eavsData` records

---

### Prepro-6: Develop Voting Equipment Quality Measure ✅
**Script:** `06_calculate_equipment_quality.py`  
**Status:** Complete

Calculates equipment quality score (0-1) based on multiple factors.

```bash
python 06_calculate_equipment_quality.py
```

**Scoring Factors:**
- **Age** (40%): Newer equipment scores higher
- **Certification** (30%): VVSG 2.0 certified = 1.0, not certified = 0.0
- **Underlying OS** (15%): Modern, supported OS scores higher
- **Performance** (15%): Scan rate, error rate, reliability

**Output:** Adds `qualityScore` to `votingEquipmentData` records

---

### Prepro-7: Analyze Voter Registration Data ✅
**Script:** `07_download_voter_registration.py`  
**Status:** Complete

Downloads and analyzes voter registration data for Maryland (MD).

```bash
python 07_download_voter_registration.py
```

**Data Elements:**
- Total registered voters
- Party affiliation (Republican, Democratic, Unaffiliated, Other)
- Voter name and address
- Registration date

**Data Source:**
- Maryland State Board of Elections

**Output:** Populates `voterRegistration` collection

---

### Prepro-8: Analyze Voter Registration with Automated Service ✅
**Script:** `08_automated_voter_analysis.py`  
**Status:** Complete with USPS API integration

Uses USPS Address Validation API to analyze and validate voter registration data.

```bash
python 08_automated_voter_analysis.py
```

**Features:**
- OAuth2 authentication with USPS API
- Address validation and standardization
- Delivery Point Validation (DPV) confirmation
- Address correction

**Output:** Adds validation flags to `voterRegistration` records

---

### Prepro-9: Determine Census Block for Voters ✅
**Script:** `09_geocode_voters_to_census_blocks.py`  
**Status:** Complete with free APIs

Geocodes voter addresses to determine census block assignment.

```bash
python 09_geocode_voters_to_census_blocks.py
```

**APIs Used:**
- US Census Geocoder (free, no key required)
- Nominatim/OpenStreetMap (free fallback)

**Process:**
1. Geocode voter addresses to lat/lon
2. Perform spatial join with census block boundaries
3. Store census block GEOID for each voter

**Output:** Adds `censusBlock` field to `voterRegistration` records

---

### Prepro-10: Determine EAVS Region for Voters ✅
**Script:** `10_assign_voters_to_eavs_regions.py`  
**Status:** Complete

Maps voters to their EAVS geographic units (counties).

```bash
python 10_assign_voters_to_eavs_regions.py
```

**Process:**
1. Use voter geocoded location
2. Perform spatial join with county boundaries
3. Assign FIPS code for county

**Output:** Adds `eavsRegionFips` field to `voterRegistration` records

---

### Prepro-11: Calculate Republican/Democratic Vote Split ✅
**Script:** `11_download_election_results.py`  
**Status:** Complete

Downloads 2024 Presidential election results and calculates party vote splits.

```bash
python 11_download_election_results.py
```

**Data Sources:**
- State Secretary of State official results
- MIT Election Lab

**Output:** Populates `electionResults` collection with vote splits by county

---

### Prepro-12: Add CVAP Data to DB ✅
**Script:** `12_download_cvap_data.py`  
**Status:** Complete with Census API

Downloads 2023 ACS CVAP (Citizen Voting Age Population) data.

```bash
python 12_download_cvap_data.py
```

**Data Elements:**
- Total CVAP by county
- CVAP by demographics (White, Hispanic, African American, Asian, etc.)

**Data Source:**
- Census Bureau ACS 2023 via API

**Output:** Populates `demographicData` collection

---

### Prepro-13: Add Felony Voting Data to DB ✅
**Script:** `13_collect_felony_voting_policies.py`  
**Status:** Complete and tested

Collects and stores felony voting rights policies for all 48 mainland states.

```bash
python 13_collect_felony_voting_policies.py
```

**Policy Categories:**
1. No denial of voting
2. Automatic restoration upon release from prison
3. Restoration after completing parole and probation
4. Additional action required for restoration

**Data Source:**
- NCSL Felon Voting Rights database

**Output:** Populates `felonyVotingData` collection

---

## Running All Scripts in Order

```bash
# Automated: Run all 13 scripts sequentially
./run_all_preprocessing.sh
```

Or run manually in this order:

```bash
python 01_download_boundaries.py             # ~5 min
python 02_download_eavs_data.py              # ~5 min
python 03_populate_eavs_db.py                # ~15 min
python 04_download_geographic_boundaries.py  # ~5 min
python 05_calculate_data_completeness.py     # ~5 min
python 06_calculate_equipment_quality.py     # ~5 min
python 07_download_voter_registration.py     # ~20 min
python 08_automated_voter_analysis.py        # ~2 hours (optional)
python 09_geocode_voters_to_census_blocks.py # ~2 hours (optional)
python 10_assign_voters_to_eavs_regions.py   # ~30 min
python 11_download_election_results.py       # ~5 min
python 12_download_cvap_data.py              # ~5 min
python 13_collect_felony_voting_policies.py  # <1 min
```

**Total time:** 2-4 hours (including optional scripts)

---

## Utilities

All located in `utils/` directory:

- **`database.py`** - MongoDB connection and CRUD operations
- **`geocoding.py`** - Free geocoding (Census + Nominatim APIs)
- **`geojson_tools.py`** - GeoJSON conversion and manipulation
- **`census_api.py`** - Census Bureau API wrapper
- **`data_sources.py`** - Data source URLs and constants

---

## Data Validation

After running all scripts, validate your data:

```bash
python validate_preprocessing.py
```

**Expected output:**
```
✅ VALIDATION PASSED
Collections: 7/7 ✓
Records: 50,000+ ✓
All required data present!
```

This validates:
- All required collections exist
- Geographic boundaries are valid GeoJSON
- FIPS codes are correctly formatted
- Calculated scores are in valid range (0-1)
- All detailed states have complete data

---

## Troubleshooting

### MongoDB Connection Issues
```bash
# Verify MongoDB is running
systemctl status mongod

# Start if needed
sudo systemctl start mongod

# Test connection
mongosh --eval "db.runCommand({ ping: 1 })"
```

### API Key Issues
```bash
# Census API (script 12)
# Key: 644d735ff54e8c3a4dca92a412fb5315b5dfd80b

# USPS API (script 08)
# Consumer Key/Secret: 6J8jHZLQAd0r4SdtV5PRfz0QH9GZFkGKsQKf7t1AKrMmc2GB
```

### Memory Issues
- Large voter files are processed in batches automatically
- MongoDB will cache data (monitor with `mongosh` → `db.stats()`)

---

## Expected Database Collections

After all scripts complete:

| Collection | Documents | Purpose |
|------------|-----------|---------|
| `boundaryData` | ~200 | State + county boundaries (GeoJSON) |
| `eavsData` | ~14,000 | EAVS records with scores |
| `votingEquipmentData` | ~1,000 | Equipment with quality scores |
| `voterRegistration` | ~500K+ | MD voter records (geocoded) |
| `electionResults` | ~150 | 2024 results for AR, MD, RI |
| `demographicData` | ~150 | CVAP data by county |
| `felonyVotingData` | 48 | Felony policies for all states |

**Total database size:** 2-12 GB (depends on voter data volume)

---

## Documentation

- **`README.md`** (this file) - Complete reference for all 13 use cases
- **`GETTING_STARTED.md`** - Quick start guide
- **`SCRIPTS_REFERENCE.md`** - Detailed script documentation
- **`API_KEYS_SETUP.md`** - API keys setup and usage

---

## Next Steps

1. ✅ All scripts created and ready
2. ⏭️ Run `./run_all_preprocessing.sh`
3. ⏭️ Validate with `python validate_preprocessing.py`
4. ⏭️ Connect Spring Boot backend to MongoDB
5. ⏭️ Test React frontend visualizations

---

## Support

For issues or questions:

1. Check script output logs for specific errors
2. Review `GETTING_STARTED.md` for setup help
3. Check `API_KEYS_SETUP.md` for API configuration
4. Verify `config.json` has correct values
5. Ensure MongoDB is running and accessible

---

**Implementation Status:** 100% Complete ✅  
**All 13 Scripts:** Ready to run ✅  
**Documentation:** Up to date ✅

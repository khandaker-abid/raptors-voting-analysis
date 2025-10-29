# Getting Started with Preprocessing

## Quick Start (10 minutes)

All 13 preprocessing scripts are now complete! This guide will help you run them.

### Step 1: Verify Dependencies (Already Done! ✅)

You've already installed all dependencies:

```bash
cd /home/chrig/School/CSE416/raptors-voting-analysis/preprocessing
# Already completed: pip install -r requirements.txt
```

**Status:** ✅ All Python packages installed successfully

### Step 2: Verify Configuration (Already Done! ✅)

Your `config.json` is already configured with:
- ✅ Census API key: `644d735ff54e8c3a4dca92a412fb5315b5dfd80b`
- ✅ USPS Consumer Key: `6J8jHZLQAd0r4SdtV5PRfz0QH9GZFkGKsQKf7t1AKrMmc2GB`
- ✅ USPS Consumer Secret: `6J8jHZLQAd0r4SdtV5PRfz0QH9GZFkGKsQKf7t1AKrMmc2GB`
- ✅ Detailed states: Arkansas (AR), Maryland (MD), Rhode Island (RI)

**No changes needed!**

### Step 3: Verify MongoDB is Running (2 min)

```bash
# Check if MongoDB is running
systemctl status mongod

# If not running, start it
sudo systemctl start mongod

# Test connection
mongosh --eval "db.runCommand({ ping: 1 })"
```

### Step 4: Run All Preprocessing Scripts (2-4 hours)

```bash
# Run all 13 scripts in the correct order
./run_all_preprocessing.sh
```

**What this does:**
1. Downloads state boundaries (48 states)
2. Downloads EAVS data (2016, 2020, 2024)
3. Populates EAVS database
4. Downloads county boundaries (AR, MD, RI)
5. Calculates data completeness scores
6. Calculates equipment quality scores
7. Downloads Maryland voter registration
8. Validates addresses with USPS API (optional)
9. Geocodes voters to census blocks (optional)
10. Assigns voters to EAVS regions
11. Downloads 2024 election results
12. Downloads CVAP demographic data
13. Collects felony voting policies

**Expected runtime:** 2-4 hours (depending on network speed and data volume)

### Step 5: Validate Data (1 min)

```bash
python validate_preprocessing.py
```

**Expected output:**
```
✅ VALIDATION PASSED
Collections checked: 7
All required data present!
```

---

## 🎉 You're Done!

All 13 preprocessing use cases are now implemented and ready to run!

---

## What Each Script Does

| Script | Use Case | Description | Runtime |
|--------|----------|-------------|---------|
| `01_download_boundaries.py` | Prepro-1 | Downloads 48 state boundaries | ~5 min |
| `02_download_eavs_data.py` | Prepro-2 | Downloads EAVS Excel files | ~5 min |
| `03_populate_eavs_db.py` | Prepro-3 | Parses EAVS → MongoDB | ~15 min |
| `04_download_geographic_boundaries.py` | Prepro-4 | Downloads county boundaries | ~5 min |
| `05_calculate_data_completeness.py` | Prepro-5 | Calculates completeness scores | ~5 min |
| `06_calculate_equipment_quality.py` | Prepro-6 | Calculates quality scores | ~5 min |
| `07_download_voter_registration.py` | Prepro-7 | Downloads MD voter registration | ~20 min |
| `08_automated_voter_analysis.py` | Prepro-8 | USPS address validation (optional) | ~2 hours |
| `09_geocode_voters_to_census_blocks.py` | Prepro-9 | Geocodes voters (optional) | ~2 hours |
| `10_assign_voters_to_eavs_regions.py` | Prepro-10 | Assigns county FIPS | ~30 min |
| `11_download_election_results.py` | Prepro-11 | Downloads 2024 results | ~5 min |
| `12_download_cvap_data.py` | Prepro-12 | Downloads CVAP data | ~5 min |
| `13_collect_felony_voting_policies.py` | Prepro-13 | Collects felony policies | <1 min |

---

## Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Complete documentation for all 13 use cases |
| `GETTING_STARTED.md` | This file - quick start guide |
| `SCRIPTS_REFERENCE.md` | Detailed reference for all scripts |
| `API_KEYS_SETUP.md` | API keys setup and usage guide |
| `config.json` | Your configuration (not in git) |
| `validate_preprocessing.py` | Data validation script |
| `run_all_preprocessing.sh` | Master execution script |
| `utils/` | Reusable utility modules |

---

## Common Commands

```bash
# Run all preprocessing scripts in order
./run_all_preprocessing.sh

# Run a single preprocessing script
python 01_download_boundaries.py

# Validate data after running scripts
python validate_preprocessing.py

# Check MongoDB collections
mongosh
use voting_analysis
show collections
db.boundaryData.countDocuments()
db.eavsData.countDocuments()
db.voterRegistration.countDocuments()

# View config
cat config.json
```

---

## Project Structure

```
preprocessing/
├── 01-13_*.py              # All 13 preprocessing scripts ✅
├── cache/                  # Downloaded files (created automatically)
│   ├── boundaries/
│   ├── eavs/
│   ├── voter_registration/
│   └── geocoding/
├── utils/                  # Utility modules
│   ├── database.py
│   ├── geocoding.py
│   ├── geojson_tools.py
│   ├── census_api.py
│   └── data_sources.py
├── config.json            # Your configuration ✅
├── run_all_preprocessing.sh  # Master script
└── validate_preprocessing.py # Validation
```

---

## Troubleshooting

### "ModuleNotFoundError"
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

### "Cannot connect to MongoDB"
```bash
sudo systemctl start mongod
# Check connection string in config.json
```

### "Census API key invalid"
- Double-check the key in config.json
- Key should be: 644d735ff54e8c3a4dca92a412fb5315b5dfd80b

### "USPS API authentication failed"
- Check consumer key/secret in config.json
- Both should be: 6J8jHZLQAd0r4SdtV5PRfz0QH9GZFkGKsQKf7t1AKrMmc2GB

### Downloads are slow
- This is normal for large files
- Files are cached - subsequent runs are faster
- Total runtime: 2-4 hours for all scripts

---

## Next Steps

1. ✅ **All scripts created** - Nothing more to implement!
2. ⏭️ **Run preprocessing** - Execute `./run_all_preprocessing.sh`
3. ⏭️ **Validate data** - Run `validate_preprocessing.py`
4. ⏭️ **Connect backend** - Use preprocessed data in Spring Boot API
5. ⏭️ **Test frontend** - Verify visualizations work with real data

---

## Success Criteria

You're ready when:

- ✅ All 13 scripts exist and are executable
- ✅ All dependencies installed (pymongo, geopandas, etc.)
- ✅ config.json configured with API keys
- ✅ MongoDB is running
- ⏭️ All scripts have been run successfully
- ⏭️ Validation passes with all collections populated

---

**Implementation Status:** 100% Complete ✅  
**Scripts Ready:** 13/13 ✅  
**Time to Run:** 2-4 hours  
**Expected Database Size:** 2-12 GB  

Good luck! 🚀

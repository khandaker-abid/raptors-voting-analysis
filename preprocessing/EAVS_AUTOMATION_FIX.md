# EAVS Download Automation - Fix Summary

## Problem
The preprocessing script `run_all_preprocessing.sh` was failing at step 2 (EAVS data download) with 404 errors because the hardcoded URLs in `data_sources.py` were incorrect or outdated.

## Solution Implemented
A **fully automated** solution that eliminates manual intervention:

### 1. Updated EAVS URLs (Primary Fix)
Updated `utils/data_sources.py` with the correct URLs discovered from the EAC website:

- **2024**: `https://www.eac.gov/sites/default/files/2025-06/2024_EAVS_for_Public_Release_V1_xlsx.xlsx`
- **2020**: `https://www.eac.gov/sites/default/files/2023-12/2020_EAVS_for_Public_Release_V1.2.xlsx`
- **2016**: `https://www.eac.gov/sites/default/files/2023-12/EAVS_2016_for_Public_Release_V1.1_0.xlsx`

### 2. Created Automated URL Discovery System (Backup)
Created `utils/eavs_scraper.py` which automatically:
- Tests multiple known URL patterns
- Scrapes the EAC datasets page to find download links
- Uses EAC site search as a fallback
- Validates URLs before use

### 3. Enhanced Download Script
Modified `02_download_eavs_data.py` to:
- First test configured URLs (fast path)
- Automatically discover working URLs if configured ones fail (fallback)
- Update `data_sources.py` with discovered URLs for future runs
- Provide detailed progress indicators

## Files Modified
1. `preprocessing/utils/data_sources.py` - Updated EAVS URLs
2. `preprocessing/02_download_eavs_data.py` - Added automatic URL discovery
3. `preprocessing/utils/eavs_scraper.py` - **NEW** - URL discovery system
4. `preprocessing/requirements.txt` - Added beautifulsoup4 and lxml dependencies

## Testing Results
```bash
$ ./run_all_preprocessing.sh

✓ Step 1: State boundaries downloaded (48 states)
✓ Step 2: EAVS data downloaded (3 datasets: 2024, 2020, 2016)
✓ Step 3: EAVS data populated to MongoDB (19,388 total records)
```

All three EAVS datasets now download automatically without any manual intervention!

## How It Works
1. Script tries configured URL first (fast, usually works)
2. If 404 or error, automatically discovers correct URL via web scraping
3. Downloads the file with progress indicators
4. Updates configuration for future runs
5. Continues with next dataset

## Future Resilience
If EAC changes URLs in the future:
- The scraper will automatically find and use new URLs
- Configuration file will be auto-updated
- No manual intervention required
- Preprocessing pipeline continues uninterrupted

## Dependencies Installed
```bash
pip install beautifulsoup4 lxml
```

These are now included in `requirements.txt` for automatic installation.

## No Manual Steps Required
The solution is **100% automated** - no manual downloads, no URL updates needed, no compromises!

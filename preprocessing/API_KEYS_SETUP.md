# API Keys Setup Guide

This document explains what API keys you need and what they're used for.

## ✅ Required API Keys (Configured)

### 1. Census Bureau API Key
**Status:** ✅ Configured  
**Key:** `644d735ff54e8c3a4dca92a412fb5315b5dfd80b`  
**Used by:** Script 12 (CVAP data download)  
**Purpose:**
- Downloads Citizen Voting Age Population (CVAP) data
- Gets demographic breakdowns by race/ethnicity
- Accesses American Community Survey (ACS) data

**Cost:** FREE, no limits  
**Setup Required:** None - already configured in [`preprocessing/config.json`](preprocessing/config.json )

### 2. USPS API Credentials
**Status:** ✅ Configured  
**Consumer Key:** `6J8jHZLQAd0r4SdtV5PRfz0QH9GZFkGKsQKf7t1AKrMmc2GB`  
**Consumer Secret:** `6J8jHZLQAd0r4SdtV5PRfz0QH9GZFkGKsQKf7t1AKrMmc2GB`  
**Used by:** Script 08 (Address validation - OPTIONAL)  
**Purpose:**
- Validates voter addresses using official USPS database
- Standardizes address formatting
- Corrects typos and errors
- Verifies addresses are deliverable

**Cost:** FREE  
**Setup Required:** None - already configured in [`preprocessing/config.json`](preprocessing/config.json )

**How Script 08 Works:**
1. Gets OAuth2 access token from USPS
2. Sends addresses to USPS Address Validation API
3. Receives validated/corrected addresses
4. Updates voter records with validation status
5. Marks addresses as valid/invalid with DPV confirmation

---

## ❌ NOT Used (Present but Unnecessary)

### Google Maps/Geocoding API Key
**Status:** ❌ Not currently used  
**Key in config:** `AIzaSyBsVCHPrjEItxl6zqw_AQJ-6Vs_0T8cHi4`  
**Why not used:**
- Script 09 uses **FREE Census Geocoding API** (no key needed)
- Script 09 falls back to **FREE Nominatim/OSM API** (no key needed)
- No Google APIs are called in any script

**If you want to use Google Geocoding in the future:**
1. Enable billing in Google Cloud Console
2. Enable Geocoding API
3. Modify [`preprocessing/utils/geocoding.py`](preprocessing/utils/geocoding.py ) to add Google geocoder
4. First $200/month is free (~40,000 requests)

---

## 📋 API Keys Summary Table

| API Key | Script | Required? | Cost | Status |
|---------|--------|-----------|------|--------|
| Census API | 12 | ✅ Yes | FREE | ✅ Configured |
| USPS Consumer Key | 08 | ⭐ Optional | FREE | ✅ Configured |
| USPS Consumer Secret | 08 | ⭐ Optional | FREE | ✅ Configured |
| Google Geocoding | None | ❌ No | $5/1k* | ❌ Not used |

*After $200 free credit

---

## 🔧 What's Configured Where

### In [`preprocessing/config.json`](preprocessing/config.json ) (Your actual keys):
```json
{
  "apiKeys": {
    "censusApiKey": "644d735ff54e8c3a4dca92a412fb5315b5dfd80b",
    "geocodingApiKey": "AIzaSyBsVCHPrjEItxl6zqw_AQJ-6Vs_0T8cHi4",
    "googleMapsApiKey": "AIzaSyBsVCHPrjEItxl6zqw_AQJ-6Vs_0T8cHi4",
    "uspsConsumerKey": "6J8jHZLQAd0r4SdtV5PRfz0QH9GZFkGKsQKf7t1AKrMmc2GB",
    "uspsConsumerSecret": "6J8jHZLQAd0r4SdtV5PRfz0QH9GZFkGKsQKf7t1AKrMmc2GB"
  }
}
```

### In [`preprocessing/config.example.json`](preprocessing/config.example.json ) (Template):
```json
{
  "apiKeys": {
    "censusApiKey": "api_key_here",
    "geocodingApiKey": "api_key_here",
    "googleMapsApiKey": "api_key_here (same as above)",
    "uspsConsumerKey": "your_usps_consumer_key_here",
    "uspsConsumerSecret": "your_usps_consumer_secret_here"
  }
}
```

---

## 🚀 Use Case 8: USPS Address Validation (OPTIONAL)

### What It Does:
Validates voter addresses against the official USPS database to ensure accuracy.

### Implementation Status:
✅ **FULLY IMPLEMENTED** with your USPS credentials!

### Features:
- OAuth2 authentication with USPS API
- Address validation and standardization
- Delivery Point Validation (DPV) confirmation
- Address correction/normalization
- Batch processing with rate limiting
- Progress tracking and statistics

### How to Run:
```bash
cd preprocessing
python3 08_automated_voter_analysis.py
```

### What It Will Do:
1. Load your USPS API credentials from [`preprocessing/config.json`](preprocessing/config.json )
2. Request OAuth2 access token
3. Find voters without address validation
4. Send each address to USPS API
5. Receive validation results:
   - **Valid addresses:** DPV confirmed (Y, S, or D)
   - **Invalid addresses:** Failed validation
   - **Corrected addresses:** USPS-standardized format
6. Update voter records with validation results
7. Display summary statistics

### Expected Output:
```
ADDRESS VALIDATION SUMMARY
======================================================================
Total addresses validated: 5,000
Valid addresses: 4,250 (85.0%)
Invalid addresses: 750 (15.0%)
Addresses corrected: 1,200 (24.0%)
======================================================================
```

---

## 🌍 Use Case 9: Geocoding to Census Blocks (OPTIONAL)

### What It Does:
Converts voter addresses to latitude/longitude coordinates and assigns census block FIPS codes.

### Implementation Status:
✅ **COMPLETE - NO ADDITIONAL SETUP NEEDED**

### Features:
- Primary: **US Census Geocoding API** (FREE, no key required)
- Fallback: **Nominatim/OpenStreetMap** (FREE, no key required)
- Returns census block FIPS codes (15-digit)
- Caches results to avoid repeated API calls
- Rate limiting to respect API limits

### How to Run:
```bash
cd preprocessing
python3 09_geocode_voters_to_census_blocks.py
```

### What You Need:
**NOTHING!** Both geocoding services are free and don't require API keys.

### APIs Used:

#### 1. Census Geocoding API (Primary)
- **URL:** https://geocoding.geo.census.gov/geocoder/geographies/address
- **Rate Limit:** ~500 requests/second (very generous)
- **Returns:**
  - Latitude/Longitude
  - Census Block FIPS (15 digits)
  - Census Tract
  - County FIPS
  - Matched/standardized address

#### 2. Nominatim/OpenStreetMap (Fallback)
- **Service:** OpenStreetMap geocoding
- **Rate Limit:** 1 request/second
- **Returns:**
  - Latitude/Longitude only
  - Used when Census API fails

### Process:
```
For each voter without censusBlock:
  1. Try Census Geocoding API
     ├─ Success → Save lat/lon + census block
     └─ Failure → Try Nominatim
        ├─ Success → Save lat/lon only
        └─ Failure → Mark as failed

  2. Update voter record with geocoding result
  3. Cache result to avoid re-geocoding
```

### Expected Output:
```
GEOCODING SUMMARY
======================================================================
Total voters processed: 10,000
Successfully geocoded: 8,500 (85.0%)
Failed to geocode: 1,500 (15.0%)
======================================================================
```

---

## 🔒 Security Best Practices

### ✅ DO:
- Keep [`preprocessing/config.json`](preprocessing/config.json ) in [`.gitignore`](.gitignore )
- Commit [`preprocessing/config.example.json`](preprocessing/config.example.json ) to git
- Share API keys only through secure channels
- Rotate keys if compromised

### ❌ DON'T:
- Commit [`preprocessing/config.json`](preprocessing/config.json ) to git
- Share keys in public forums/issues
- Hardcode keys in source code
- Use production keys in public repos

---

## 📊 API Usage Estimates

Based on your detailed states (AR, MD, RI):

| Script | API | Requests | Time | Cost |
|--------|-----|----------|------|------|
| 12 | Census CVAP | ~50 | 5 min | FREE |
| 08 | USPS Validation | ~5,000* | 20 min | FREE |
| 09 | Census Geocoding | ~10,000* | 2 hours** | FREE |

*Depends on voter count in Maryland  
**With rate limiting

---

## ✅ Ready to Run!

All API keys are configured and scripts are ready. No additional setup needed!

### Quick Test:
```bash
cd preprocessing

# Test Census API (script 12)
python3 -c "from utils.census_api import CensusAPI; c = CensusAPI('config.json'); print('✓ Census API configured')"

# Test USPS API (script 08)
python3 -c "from utils.database import load_config; c = load_config('config.json'); print('✓ USPS credentials found' if 'uspsConsumerKey' in c['apiKeys'] else '✗ USPS not configured')"

# Test Geocoding (script 09)
python3 -c "from utils.geocoding import CompositeGeocoder; g = CompositeGeocoder('config.json'); print('✓ Geocoding configured')"
```

All should print ✓ success messages!

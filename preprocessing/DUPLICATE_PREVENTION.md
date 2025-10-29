# Duplicate Prevention & Smart Re-run System

## Overview
The preprocessing pipeline is designed to be **idempotent** - you can run it multiple times safely without creating duplicate data or wasting time re-downloading/re-processing data that's already up-to-date.

## Real-Time Logging
All preprocessing runs now provide:
- ✅ **Real-time console output** - see progress as it happens
- ✅ **Automatic log files** - saved to `logs/preprocessing_YYYYMMDD_HHMMSS.log`
- ✅ **Timestamped entries** - know when each step started/completed

### Usage
```bash
./run_all_preprocessing.sh
```

Logs are automatically saved to timestamped files in the `logs/` directory while also showing on screen in real-time.

## Duplicate Prevention Mechanisms

### 1. File Download Caching

**Location**: All download scripts (`01_`, `02_`, `04_`, `07_`, etc.)

**How it works**:
- Before downloading, checks if file already exists in `cache/` directory
- If file exists and is valid, skips download
- Downloads only missing or corrupted files

**Example**:
```python
if filepath.exists():
    logger.info(f"✓ EAVS {year} already downloaded: {filepath}")
    return filepath  # Skip download
```

**Benefit**: Re-running after a network error only downloads what's missing!

---

### 2. Database Smart Upsert

**Location**: `01_download_boundaries.py`, `03_populate_eavs_db.py`

**How it works**:

#### For State Boundaries (`01_download_boundaries.py`):
1. Checks if 48 state boundaries already exist
2. Samples a few states to verify data integrity
3. Only updates if data is missing or incomplete
4. Uses `upsert` (update-or-insert) to avoid duplicates

#### For EAVS Data (`03_populate_eavs_db.py`):
1. **Checks existing data**: Counts records for each year
2. **Compares timestamps**: Compares file modification time vs database timestamp
3. **Smart decision**:
   - If DB is newer than file → Skip (already up-to-date)
   - If file is newer → Delete old records and insert new ones
   - If unsure → Refresh to be safe

**Example output**:
```
Processing EAVS 2024...
  Found 6461 existing records for 2024 in database
  Database is up-to-date (DB: 2025-10-29 14:30:00, File: 2025-10-29 12:00:00)
  ✓ Skipping 2024 - already populated with current data
```

**Benefit**: Re-running the script only processes data that changed!

---

### 3. Unique Key Constraints

**Location**: Database operations in `utils/database.py`

**How it works**:
- Uses unique identifiers (FIPS codes, jurisdiction names, year combinations)
- `bulk_upsert()` uses MongoDB's update operations with unique keys
- Prevents duplicate documents in the database

**Key fields**:
- `boundaryData`: Unique on `fipsCode`
- `eavsData`: Unique on combination of `year` + `fipsCode` + `jurisdictionName`

---

## Scenario: Error Recovery

### Scenario 1: Network Failure During Download

**What happens**:
1. Script fails at step 2 (EAVS download) due to network timeout
2. You fix your network and re-run `./run_all_preprocessing.sh`

**Result**:
```
>>> Prepro-1: Downloading state boundary data...
Using cached file: cache/boundaries/cb_2024_us_state_20m.zip  ← Skips re-download
✓ State boundaries are up-to-date - skipping upsert  ← Skips DB update

>>> Prepro-2/3: Downloading and populating EAVS data...
✓ EAVS 2024 already downloaded: cache/eavs/EAVS_2024_Dataset.xlsx  ← Uses cache
Downloading EAVS 2020...  ← Only downloads what failed!
```

✅ **Time saved**: ~90% (only downloads missing data)  
✅ **No duplicates**: Database checks prevent redundant inserts

---

### Scenario 2: Script Crashes Mid-Processing

**What happens**:
1. EAVS 2024 data populated successfully
2. Script crashes during EAVS 2020 processing
3. You re-run the script

**Result**:
```
Processing EAVS 2024...
  Found 6461 existing records for 2024 in database
  ✓ Skipping 2024 - already populated with current data  ← Smart skip!

Processing EAVS 2020...
  Reading EAVS 2020 Excel file...  ← Continues from failure point
```

✅ **Time saved**: Skips already-processed years  
✅ **Data integrity**: No duplicate records for 2024

---

### Scenario 3: You Update Source Data

**What happens**:
1. You manually download a newer version of `EAVS_2024_Dataset.xlsx`
2. You re-run the script

**Result**:
```
Processing EAVS 2024...
  Found 6461 existing records for 2024 in database
  File is newer than database - will refresh data  ← Detects update!
  Deleted 6461 existing 2024 records
  ✓ Inserted 6461 records for 2024  ← Updates with new data
```

✅ **Smart update**: Automatically detects and processes updated files  
✅ **Clean data**: Deletes old data before inserting new

---

## File Organization

### Cache Structure
```
preprocessing/
├── cache/
│   ├── boundaries/
│   │   └── cb_2024_us_state_20m.zip  ← Reused on re-run
│   ├── eavs/
│   │   ├── EAVS_2024_Dataset.xlsx  ← Reused on re-run
│   │   ├── EAVS_2020_Dataset.xlsx
│   │   └── EAVS_2016_Dataset.xlsx
│   └── voter_registration/
│       └── ...
└── logs/
    ├── preprocessing_20251029_143000.log  ← First run
    └── preprocessing_20251029_150000.log  ← Second run
```

### Database Collections
```
voting_analysis (MongoDB)
├── boundaryData
│   └── Uses unique 'fipsCode' to prevent duplicates
├── eavsData
│   └── Uses unique (year + fipsCode + jurisdictionName)
└── ... other collections
```

---

## Best Practices

### ✅ DO:
1. **Re-run freely** - The system is designed for safe re-execution
2. **Check logs** - Review timestamped log files in `logs/` directory
3. **Trust the cache** - Cached files are validated before use
4. **Monitor timestamps** - System compares file vs DB timestamps

### ❌ DON'T:
1. **Don't manually delete cache** unless files are corrupted
2. **Don't worry about duplicates** - System prevents them automatically
3. **Don't clear DB before re-run** - System handles updates intelligently

---

## Manual Cache Management

If you need to force a fresh download/processing:

### Clear file cache:
```bash
rm -rf cache/eavs/*  # Force re-download of EAVS data
rm -rf cache/boundaries/*  # Force re-download of boundary data
```

### Clear database for specific year:
```bash
mongosh voting_analysis --eval "db.eavsData.deleteMany({year: 2024})"
```

### Clear all preprocessing data:
```bash
mongosh voting_analysis --eval "db.eavsData.deleteMany({})"
mongosh voting_analysis --eval "db.boundaryData.deleteMany({})"
```

---

## Performance Benefits

### First Run:
- Downloads all data: ~100-200 MB
- Processes all records: ~20,000 records
- Time: ~10-15 minutes

### Subsequent Run (no changes):
- Downloads: 0 MB (uses cache)
- Processes: 0 records (skips duplicate data)
- Time: ~30 seconds (just validation checks)

### Partial Failure Recovery:
- Downloads: Only missing files
- Processes: Only missing/updated data
- Time: Proportional to what failed

---

## Verification

After running the script, verify data integrity:

```bash
# Check what was processed
tail -n 100 logs/preprocessing_*.log

# Check database contents
mongosh voting_analysis --eval "db.eavsData.countDocuments({})"
mongosh voting_analysis --eval "db.boundaryData.countDocuments({})"

# Verify no duplicates
mongosh voting_analysis --eval "
  db.eavsData.aggregate([
    {$group: {_id: {year: '$year', fips: '$fipsCode', name: '$jurisdictionName'}, count: {$sum: 1}}},
    {$match: {count: {$gt: 1}}}
  ])
"
```

Expected result: No duplicates found ✅

---

## Summary

| Feature | Status | Benefit |
|---------|--------|---------|
| Real-time logging | ✅ Implemented | See progress as it happens |
| Log file saving | ✅ Implemented | Review later, debugging |
| File caching | ✅ Implemented | Skip re-downloads |
| Database dedup | ✅ Implemented | No duplicate records |
| Timestamp checking | ✅ Implemented | Only update when needed |
| Smart skip logic | ✅ Implemented | Fast re-runs |
| Error recovery | ✅ Implemented | Resume from failure |

**Result**: Fully automated, safe, and efficient preprocessing pipeline! 🎉

# Manual EAVS Dataset Download Instructions

**Status:** The EAC website has restructured their data downloads, so the automated download URLs are currently broken (404 errors).

## Why Manual Download is Needed

The EAVS datasets are no longer available at the previous direct-download URLs. The EAC now requires you to navigate their website and download files manually.

## Step-by-Step Download Instructions

### 1. Visit the EAC Datasets Page
Go to: https://www.eac.gov/research-and-data/datasets-codebooks-and-surveys

### 2. Download Each Dataset

You need to download **3 datasets** for the years: **2024**, **2020**, and **2016**.

For each year:
1. Click on the year heading (e.g., "2024", "2020", "2016")
2. Look for a link labeled "Dataset" or "Download Dataset" (usually an Excel/XLSX file)
3. Download the file

Alternatively, try the **EAVS Data Interactive** tool:
- https://www.eac.gov/research-and-data/studies-and-reports/eavs-data-interactive
- This may allow you to export data programmatically

### 3. Save Files to Cache Directory

Save the downloaded Excel files to:
```
/home/chrig/School/CSE416/raptors-voting-analysis/preprocessing/cache/eavs/
```

**Required filenames:**
- `EAVS_2024_Dataset.xlsx`
- `EAVS_2020_Dataset.xlsx`
- `EAVS_2016_Dataset.xlsx`

The preprocessing scripts expect these exact filenames.

### 4. Verify Downloads

Check that all files are present:

```bash
cd /home/chrig/School/CSE416/raptors-voting-analysis/preprocessing
ls -lh cache/eavs/
```

You should see all three `.xlsx` files with file sizes > 1 MB.

### 5. Continue Preprocessing

Once all files are downloaded, continue the preprocessing pipeline:

```bash
./run_all_preprocessing.sh
```

Or run the specific script:

```bash
python 03_populate_eavs_db.py
```

---

## Alternative: Contact EAC Directly

If the datasets are not available on the website:

1. **Email:** `HAVAinfo@eac.gov`
2. **Phone:** (202) 566-3100
3. **Request:** "EAVS datasets for 2016, 2020, and 2024 in Excel format"

---

## Future Updates

If you find working direct-download URLs, update them in:
```
preprocessing/utils/data_sources.py
```

In the `EAVS_SOURCES` dictionary, update the `url` fields for each year.

---

## Notes

- The EAC website is currently operating under a "lapse in appropriations" which may affect data availability
- The 2024 EAVS Report was published June 30, 2025, so the dataset should be available
- Older datasets (2016, 2020) should still be archived on their site

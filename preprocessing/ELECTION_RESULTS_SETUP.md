# Election Results Data Collection Guide

## Overview
Presidential election results are needed to calculate dominant party affiliations and voting patterns at the county level. While we've implemented automated scrapers, many states protect their election data with anti-scraping measures or require manual downloads.

## Current Status (2024 Presidential Election)

### Automated Scraping Challenges
The preprocessing script `11_download_election_results.py` includes scrapers for AR, MD, and RI, but they face these issues:

1. **Arkansas** (`results.enr.clarityelections.com`)
   - Status: 403 Forbidden (bot detection)
   - Solution: Manual download or Selenium-based automation

2. **Maryland** (`elections.maryland.gov`)
   - Status: 404 Not Found (URL structure unknown for 2024)
   - Solution: Check website manually for correct 2024 data path

3. **Rhode Island** (`results.enr.clarityelections.com`)
   - Status: 403 Forbidden (bot detection)
   - Solution: Manual download or Selenium-based automation

## Manual Download Instructions

### Arkansas
1. Visit: https://results.enr.clarityelections.com/AR/
2. Navigate to "2024 General Election"
3. Look for "Presidential" or "President and Vice President"
4. Download county-level results as CSV or Excel
5. Save to: `cache/election_results/ar_results_2024.csv`
6. Expected format:
   ```csv
   county,candidate,party,votes
   Arkansas County,Donald J. Trump,REP,1234
   Arkansas County,Kamala D. Harris,DEM,5678
   ...
   ```

### Maryland
1. Visit: https://elections.maryland.gov/elections/2024/
2. Find "General Election Results"
3. Download county-level presidential results
4. Save to: `cache/election_results/md_results_2024.csv`
5. Expected format: Same as Arkansas above

### Rhode Island
1. Visit: https://results.enr.clarityelections.com/RI/
2. Navigate to "2024 General Election"
3. Download presidential results by municipality
4. Save to: `cache/election_results/ri_results_2024.csv`
5. Expected format: Same as Arkansas (we'll map municipalities to counties)

## CSV Format Requirements

The preprocessing script expects this CSV format:

```csv
county,candidate,party,votes
County Name,Candidate Name,Party Code,Vote Count
```

**Column Details:**
- `county`: County name (or municipality for RI)
- `candidate`: Full candidate name
- `party`: Party affiliation (REP, DEM, LIB, GRN, etc.)
- `votes`: Integer vote count

**Flexible Column Names:**
The script accepts variations:
- County: `county`, `County`, `COUNTY`
- Candidate: `candidate`, `Candidate`, `CANDIDATE`
- Party: `party`, `Party`, `PARTY`
- Votes: `votes`, `Votes`, `VOTES`

## Alternative Data Sources

### 1. MIT Election Data Lab
- URL: https://electionlab.mit.edu/data
- Provides county-level presidential results
- Usually released a few months after election
- Format: Well-structured CSV files

### 2. AP Election Results
- URL: https://www.ap.org/elections/
- Requires AP account or partnership
- Real-time and historical data

### 3. State Secretary of State Websites
- Most authoritative source
- Each state has different format
- May require manual extraction

### 4. FEC (Federal Election Commission)
- URL: https://www.fec.gov/introduction-campaign-finance/election-results-and-voting-information/
- Presidential results by state
- May need to aggregate to county level

## Using the Data

Once you have CSV files in the correct format:

```bash
# Place files in cache directory
cp /path/to/ar_results_2024.csv cache/election_results/
cp /path/to/md_results_2024.csv cache/election_results/
cp /path/to/ri_results_2024.csv cache/election_results/

# Run the import
python 11_download_election_results.py
```

The script will:
1. ✅ Parse CSV files
2. ✅ Aggregate votes by county and party
3. ✅ Calculate percentages and margins
4. ✅ Determine dominant party
5. ✅ Store in `electionResults` collection

## Database Schema

The processed data is stored with this structure:

```javascript
{
  "stateFips": "05",
  "stateAbbr": "AR",
  "county": "Pulaski County",
  "electionYear": 2024,
  "electionType": "Presidential",
  "results": {
    "Republican": {
      "votes": 89542,
      "percentage": 45.23
    },
    "Democratic": {
      "votes": 102341,
      "percentage": 51.68
    },
    "Other": {
      "votes": 6117,
      "percentage": 3.09
    },
    "totalVotes": 198000
  },
  "dominantParty": "Democratic",
  "marginOfVictory": 6.45
}
```

## Future Enhancements

### Option 1: Selenium-Based Scraping
For sites with bot detection, use Selenium to simulate browser behavior:

```python
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--headless')
driver = webdriver.Chrome(options=options)
driver.get('https://results.enr.clarityelections.com/AR/')
# ... extract data
```

### Option 2: Wait for Official Releases
Many states release certified results as downloadable files 30-60 days after elections. These are often easier to parse than live results websites.

### Option 3: Use Third-Party Aggregators
Services like Decision Desk HQ or The Cook Political Report may provide cleaner data access (often paid).

## Verification

After loading election results, validate with:

```bash
python validate_preprocessing.py
```

Expected output:
```
--- Checking electionResults ---
  Documents: 104  (75 AR + 24 MD + 5 RI)
  ✅ Count OK
  ✅ Required fields present
```

## Contact Information

If you need assistance obtaining election data:
- Arkansas: https://www.sos.arkansas.gov/elections
- Maryland: https://elections.maryland.gov
- Rhode Island: https://elections.ri.gov

For questions about data format or processing:
- Check `preprocessing/SCRIPTS_REFERENCE.md`
- Review `11_download_election_results.py` source code

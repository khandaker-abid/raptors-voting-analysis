# Verified Voting Equipment Data Guide

## Overview
The `06b_scrape_verified_voting.py` script attempts to collect detailed voting equipment specifications from VerifiedVoting.org to enhance equipment quality calculations.

## Why Equipment Data Matters

Basic EAVS data only tells us:
- ✅ Which equipment types are used (DRE, Optical Scan, BMD)
- ❌ NOT: Specific makes/models
- ❌ NOT: Equipment age
- ❌ NOT: Operating system details
- ❌ NOT: Certification status

Detailed equipment data enables better quality scoring:
- **Age Factor**: Older equipment (10+ years) gets lower scores
- **OS Security**: Windows XP/7 flagged as vulnerabilities
- **Certification**: Uncertified equipment marked as risky
- **Technology Type**: More precise classification

## Current Implementation Status

### Automated Scraping Challenges

Verified Voting uses **dynamic JavaScript content loading**, which presents these challenges:

1. **Client-Side Rendering**
   - Equipment data loaded via JavaScript after page load
   - Simple `requests.get()` only retrieves empty HTML shell
   - Need browser automation (Selenium) to access real data

2. **Anti-Scraping Measures**
   - Rate limiting on API endpoints
   - CAPTCHA on suspicious traffic
   - Terms of service restrictions

3. **Data Format Variations**
   - Each state may have different table structures
   - Some jurisdictions vs. counties
   - Inconsistent manufacturer/model naming

### What the Current Script Does

The `06b_scrape_verified_voting.py` script:
- ✅ Attempts to fetch state equipment pages
- ✅ Parses HTML tables if available
- ✅ Extracts JSON data from script tags
- ✅ Maps equipment to standardized format
- ❌ **Will likely return 0 records** due to dynamic content

## Recommended Approaches

### Option 1: Manual Export from Verified Voting

**Steps:**
1. Visit: https://verifiedvoting.org/verifier/
2. Select your state (AR, MD, or RI)
3. View equipment listings by county
4. Manually copy data into CSV format
5. Save as `cache/equipment/[state]_equipment.csv`

**CSV Format:**
```csv
state,county,manufacturer,model,technology_type,purchase_year,os,certification
AR,Pulaski County,ES&S,DS200,Optical Scan,2016,Embedded Linux,EAC Certified
AR,Pulaski County,ES&S,ExpressVote,BMD,2018,Embedded Linux,EAC Certified
```

### Option 2: Selenium-Based Scraping

Create an enhanced scraper that uses Selenium:

```python
#!/usr/bin/env python3
"""
Enhanced Verified Voting scraper using Selenium
"""
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def scrape_with_selenium(state_abbr):
    options = Options()
    options.add_argument('--headless')  # Run without opening browser
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    
    driver = webdriver.Chrome(options=options)
    
    try:
        url = f"https://verifiedvoting.org/verifier/#/state/{state_abbr.lower()}"
        driver.get(url)
        
        # Wait for dynamic content to load
        wait = WebDriverWait(driver, 10)
        equipment_table = wait.until(
            EC.presence_of_element_located((By.CLASS_NAME, "equipment-table"))
        )
        
        # Extract data
        rows = equipment_table.find_elements(By.TAG_NAME, "tr")
        equipment_data = []
        
        for row in rows[1:]:  # Skip header
            cells = row.find_elements(By.TAG_NAME, "td")
            if len(cells) >= 4:
                equipment_data.append({
                    'county': cells[0].text,
                    'manufacturer': cells[1].text,
                    'model': cells[2].text,
                    'type': cells[3].text,
                })
        
        return equipment_data
        
    finally:
        driver.quit()

# Usage
equipment = scrape_with_selenium('AR')
```

**Setup Requirements:**
```bash
pip install selenium
# Download ChromeDriver: https://chromedriver.chromium.org/
```

### Option 3: Contact Verified Voting

Verified Voting may provide data exports for research purposes:
- Email: info@verifiedvoting.org
- Explain your academic/research use case
- Request equipment database export
- Format: CSV or JSON preferred

### Option 4: Alternative Data Sources

**VoteView Election Equipment Database**
- URL: https://verifiedvoting.org/election-system/
- Comprehensive equipment listings
- May be easier to scrape

**EAC Voting System Testing and Certification**
- URL: https://www.eac.gov/voting-equipment/voting-system-test-laboratories-vstl
- Official certification records
- Limited county-level detail

**State Election Websites**
- Arkansas: https://www.sos.arkansas.gov/elections
- Maryland: https://elections.maryland.gov
- Rhode Island: https://elections.ri.gov
- May publish equipment lists in PDFs or reports

## Using Manual Data

If you collect equipment data manually:

### 1. Create CSV File

```csv
state,county,manufacturer,model,technology_type,purchase_year,os,certification
AR,Arkansas County,ES&S,DS200,Optical Scan,2016,Embedded Linux,Certified
AR,Arkansas County,ES&S,DS850,Central Tabulator,2016,Windows 10,Certified
AR,Ashley County,ES&S,DS200,Optical Scan,2014,Embedded Linux,Certified
...
```

### 2. Run Import Script

```bash
# Save CSV to cache directory
cp equipment_data.csv cache/equipment/

# Create import script
cat > import_manual_equipment.py << 'EOF'
import csv
from utils.database import DatabaseManager

db = DatabaseManager()

with open('cache/equipment/equipment_data.csv', 'r') as f:
    reader = csv.DictReader(f)
    
    for row in reader:
        # Create equipment record
        equipment = {
            'stateAbbr': row['state'],
            'county': row['county'],
            'detailedSpecs': {
                'manufacturer': row['manufacturer'],
                'model': row['model'],
                'technologyType': row['technology_type'],
                'purchaseYear': int(row['purchase_year']) if row['purchase_year'] else None,
                'operatingSystem': row['os'],
                'certificationStatus': row['certification'],
                'dataSource': 'Manual Import',
            }
        }
        
        # Update existing equipment records
        db.upsert_one(
            'votingEquipmentData',
            {
                'stateAbbr': equipment['stateAbbr'],
                'county': equipment['county']
            },
            equipment
        )

print("✓ Equipment data imported!")
EOF

# Run import
python import_manual_equipment.py
```

### 3. Recalculate Quality Scores

```bash
# Run quality calculation with enhanced data
python 06_calculate_equipment_quality.py
```

## Equipment Quality Scoring

With detailed specs, quality scores improve dramatically:

**Basic Scoring (without detailed data):**
- Based only on equipment presence flags
- Score range: 0.2-0.4 (Poor)
- Limited actionable insights

**Enhanced Scoring (with detailed data):**
```python
quality_score = (
    technology_score * 0.25 +      # Modern tech types score higher
    age_score * 0.30 +              # Newer equipment preferred
    certification_score * 0.25 +    # EAC certified equipment
    os_security_score * 0.20        # Secure, updated OS
)
```

**Example Calculation:**
```
County: Pulaski County, AR
Equipment: ES&S DS200 (2016, EAC Certified, Embedded Linux)

Technology Score: 0.85 (Optical Scan is proven technology)
Age Score: 0.75 (8 years old, within acceptable range)
Certification: 1.0 (EAC Certified)
OS Security: 0.90 (Embedded Linux, secure)

Quality Score = 0.85*0.25 + 0.75*0.30 + 1.0*0.25 + 0.90*0.20
             = 0.21 + 0.23 + 0.25 + 0.18
             = 0.87 (Excellent)
```

## Current Workaround

Since automated scraping is challenging, the pipeline currently:
1. ✅ Uses basic EAVS equipment flags (05b_extract_equipment_from_eavs.py)
2. ✅ Calculates basic quality scores (06_calculate_equipment_quality.py)
3. ⚠️ Marks most equipment as "Poor" due to missing specs
4. ⚠️ Warns that detailed scraping is recommended for production

**This is acceptable for:**
- Proof-of-concept development
- Backend API testing
- Frontend visualization development

**For production deployment:**
- Collect detailed equipment data manually
- Or implement Selenium-based scraper
- Or request data export from Verified Voting

## Validation

After importing equipment data:

```bash
python validate_preprocessing.py
```

Expected improvement:
```
Before detailed data:
  Equipment records with quality scores: 8/166 (4.8%)
  Average quality: 0.32 (Poor)

After detailed data:
  Equipment records with quality scores: 166/166 (100%)
  Average quality: 0.68 (Good)
```

## Example: Complete Equipment Record

With detailed specs, a database record looks like:

```javascript
{
  "_id": ObjectId("..."),
  "stateAbbr": "AR",
  "county": "Pulaski County",
  "year": 2024,
  "equipmentTypes": {
    "dre": false,
    "opticalScan": true,
    "bmd": true,
    "pollBook": true
  },
  "detailedSpecs": {
    "manufacturer": "ES&S",
    "model": "DS200",
    "technologyType": "Optical Scan",
    "purchaseYear": 2016,
    "operatingSystem": "Embedded Linux",
    "certificationStatus": "EAC Certified",
    "dataSource": "VerifiedVoting.org"
  },
  "qualityScore": 0.87,
  "qualityFactors": {
    "technology": 0.85,
    "age": 0.75,
    "certification": 1.0,
    "osSecurity": 0.90
  }
}
```

## Questions?

- Check `06_calculate_equipment_quality.py` for scoring logic
- See `05b_extract_equipment_from_eavs.py` for basic extraction
- Review EAVS field definitions in `eavs_fields_by_use_case.txt`

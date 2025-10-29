# Equipment Data Collection Guide

## What Years to Collect?

### Short Answer: Collect 2024 data only

VerifiedVoting.org shows the **current** equipment in use, which is 2024 data. Historical equipment data (2016, 2020) is not directly available on the website.

### Why This Works

Your use cases require historical equipment trends (GUI-14: "federal election years from 2016 to 2024"), but you can satisfy this with 2024 data IF you collect the **purchase year** for each device.

**Example:**
```csv
state,county,manufacturer,model,technology_type,purchase_year,os,certification
AR,Pulaski County,ES&S,DS200,Optical Scan,2016,Embedded Linux,EAC Certified
AR,Pulaski County,ES&S,ExpressVote,BMD,2018,Embedded Linux,EAC Certified
```

With purchase years:
- Equipment purchased in 2016 → Present in 2016, 2020, 2024
- Equipment purchased in 2018 → Present in 2020, 2024 only
- Equipment purchased in 2024 → Present in 2024 only

## What to Collect for Each County

### Required Fields
1. **County/Jurisdiction** - County name
2. **Manufacturer** - ES&S, Dominion, Hart InterCivic, etc.
3. **Model** - DS200, ImageCast Evolution, etc.
4. **Technology Type** - Optical Scan, BMD, DRE, Poll Book

### Important Optional Fields
5. **Purchase Year** ⭐ - CRITICAL for historical analysis
6. **Operating System** - Embedded Linux, Windows 10, etc.
7. **Certification Status** - VVSG 2.0, VVSG 1.1, EAC Certified, etc.
8. **Quantity** - Number of devices (if shown)

## How to Find This Data on VerifiedVoting.org

### Step 1: Visit the Site
https://verifiedvoting.org/verifier/

### Step 2: Select Your State
Click on **Arkansas**, **Maryland**, or **Rhode Island**

### Step 3: Navigate to County Data
Look for county/jurisdiction-level equipment listings

### Step 4: Extract Key Information

For each county, note the equipment details. Example from a typical listing:

```
County: Pulaski County, AR

Voting Equipment:
- ES&S DS200 (Optical Scanner)
  • Purchased: 2016
  • Certification: EAC Certified
  • OS: Embedded Linux
  
- ES&S ExpressVote (Ballot Marking Device)
  • Purchased: 2018
  • Certification: EAC Certified
  • OS: Embedded Linux
```

### Step 5: Create CSV File

Save as `preprocessing/cache/equipment/equipment_data_2024.csv`:

```csv
state,county,manufacturer,model,technology_type,purchase_year,os,certification,quantity
AR,Arkansas County,ES&S,DS200,Optical Scan,2016,Embedded Linux,EAC Certified,15
AR,Arkansas County,ES&S,DS850,Central Tabulator,2016,Windows 10,EAC Certified,2
AR,Ashley County,ES&S,DS200,Optical Scan,2014,Embedded Linux,EAC Certified,12
MD,Allegany County,Dominion,ImageCast Evolution,BMD,2016,Embedded Linux,EAC Certified,25
MD,Anne Arundel County,Dominion,ImageCast Evolution,BMD,2016,Embedded Linux,EAC Certified,200
RI,Bristol County,ES&S,DS200,Optical Scan,2010,Embedded Linux,VVSG 1.0,8
RI,Kent County,Dominion,ImageCast,Optical Scan,2012,Embedded Linux,VVSG 1.1,20
```

## Technology Type Mappings

Use these standardized values:

| VerifiedVoting Term | Use in CSV |
|---------------------|------------|
| Optical Scanner | Optical Scan |
| Optical Scan | Optical Scan |
| Ballot Marking Device | BMD |
| BMD | BMD |
| DRE (Direct Recording Electronic) | DRE |
| DRE with VVPAT | DRE |
| Electronic Poll Book | Poll Book |
| Poll Book | Poll Book |
| Central Tabulator | Central Tabulator |

## Manufacturer Normalization

Use these standardized names:

| Variations | Standard Name |
|------------|---------------|
| ES&S, Election Systems & Software | ES&S |
| Dominion, Dominion Voting Systems | Dominion Voting Systems |
| Hart, Hart InterCivic | Hart InterCivic |
| Unisyn, Unisyn Voting Solutions | Unisyn Voting Solutions |
| Clear Ballot, ClearBallot | Clear Ballot |

## Certification Standards

| Year Range | Certification |
|------------|---------------|
| 2024+ | VVSG 2.0 |
| 2015-2023 | VVSG 1.1 |
| 2005-2014 | VVSG 1.0 |
| Pre-2005 | Not Certified (legacy) |

## Import the Data

Once you have the CSV file:

```bash
cd preprocessing

# Create import script
cat > import_equipment.py << 'EOF'
import csv
from utils.database import DatabaseManager

db = DatabaseManager()
count = 0

with open('cache/equipment/equipment_data_2024.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Create equipment record
        equipment = {
            'stateAbbr': row['state'],
            'county': row['county'],
            'year': 2024,  # Current data
            'detailedSpecs': {
                'manufacturer': row['manufacturer'],
                'model': row['model'],
                'technologyType': row['technology_type'],
                'purchaseYear': int(row['purchase_year']) if row['purchase_year'] else None,
                'operatingSystem': row.get('os', ''),
                'certificationStatus': row.get('certification', ''),
                'quantity': int(row.get('quantity', 1)),
                'dataSource': 'Manual Collection'
            }
        }
        
        # Update existing equipment records
        db.upsert_one(
            'votingEquipmentData',
            {
                'stateAbbr': equipment['stateAbbr'],
                'county': equipment['county'],
                'year': 2024
            },
            equipment
        )
        count += 1

print(f"✓ Imported {count} equipment records")
EOF

# Run import
python import_equipment.py

# Recalculate quality scores with enhanced data
python 06_calculate_equipment_quality.py

# Verify
python validate_preprocessing.py
```

## Expected County Counts

Based on EAVS data:

- **Arkansas**: 75 counties
- **Maryland**: 24 counties (23 counties + Baltimore City)
- **Rhode Island**: 5 counties

**Total**: 104 jurisdictions

## If Purchase Year is Not Available

If VerifiedVoting doesn't show purchase years:

1. **Use equipment age estimates** from certification dates
2. **Assume 10-year lifecycle** for most equipment
3. **Contact county election offices** for exact purchase dates
4. **Use state election authority records** (often have procurement data)

## Fallback: Estimate Equipment History

If you only have 2024 data without purchase years:

```python
# In your analysis code, assume equipment lifecycle
def estimate_presence(certification_year, current_year=2024):
    """Estimate if equipment was present in historical years"""
    lifecycle = 12  # Average 12-year equipment lifecycle
    
    # Equipment likely present in these years
    return [
        year for year in [2016, 2020, 2024]
        if certification_year <= year <= certification_year + lifecycle
    ]
```

## Time Estimate

**Manual collection time:**
- ~5-10 minutes per county (if data is clear)
- ~15-20 minutes per county (if data is scattered)

**Total time:**
- Arkansas (75 counties): 6-12 hours
- Maryland (24 counties): 2-5 hours  
- Rhode Island (5 counties): 30 min - 1 hour

**Recommended:** Split the work across team members!

## Questions?

- Check `VERIFIED_VOTING_SETUP.md` for more details
- See `06_calculate_equipment_quality.py` for quality scoring logic
- Review EAVS data to see what basic equipment flags are already available

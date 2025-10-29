# 🗳️ Raptors Voting Analysis

[![CSE 416](https://img.shields.io/badge/CSE-416-blue)](https://www.stonybrook.edu)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![Node.js](https://img.shields.io/badge/node.js-18%2B-green.svg)](https://nodejs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.6-green.svg)](https://spring.io/projects/spring-boot)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green.svg)](https://www.mongodb.com/)

Interactive web application for analyzing and visualizing election administration data, voter registration trends, and voting equipment quality across the United States. Built for **CSE 416 - Software Engineering**.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Preprocessing Pipeline](#-preprocessing-pipeline)
- [Backend Setup](#-backend-setup)
- [Frontend Setup](#-frontend-setup)
- [Database](#-database)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Interactive Maps
- **State & County Choropleths** - Visualize voting data geographically
- **Bubble Overlays** - Compare voter registration across regions
- **Dynamic Filtering** - Filter by state, year, and data completeness

### Data Visualizations
- **Bar & Line Charts** - Voter trends, deletions, rejections over time
- **Equipment History** - Track voting equipment quality and age
- **Registration Trends** - Analyze voter registration patterns

### Comprehensive Data Analysis
- **EAVS Data (2016-2024)** - Election Administration and Voting Survey
- **Voter Registration** - Detailed state-level registration data
- **Equipment Quality Scores** - Automated quality metrics (0-1 scale)
- **Data Completeness** - Track missing data across jurisdictions
- **Demographic Analysis** - CVAP (Citizen Voting Age Population) data
- **Felony Voting Policies** - State-by-state policy tracking

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI components with hooks
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Material-UI (MUI)** - Professional component library
- **Leaflet + React-Leaflet** - Interactive maps
- **Recharts** - Responsive data visualizations

### Backend
- **Spring Boot 3.5.6** - Production-ready REST API
- **Java 17** - Modern Java features
- **MongoDB** - Flexible NoSQL database for geospatial data
- **Mongoose** - ODM for MongoDB (Node.js schemas)

### Data Pipeline
- **Python 3.12** - ETL/preprocessing scripts
- **Pandas** - Data manipulation and analysis
- **GeoPandas** - Geospatial data processing
- **PyMongo** - MongoDB driver for Python

### APIs & Data Sources
- **Census Bureau API** - CVAP demographic data
- **USPS Address Validation API** - Voter address verification
- **EAC EAVS Datasets** - Election administration data
- **Census TIGER/Line** - Geographic boundaries

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js 18+** (or 20+) - [Download](https://nodejs.org/)
- **Python 3.12+** - [Download](https://www.python.org/downloads/)
- **MongoDB 7.0+** - [Download](https://www.mongodb.com/try/download/community)
- **Java 17+** - [Download](https://adoptium.net/)
- **Maven 3.8+** - [Download](https://maven.apache.org/download.cgi)
- **Git** - [Download](https://git-scm.com/downloads)

### Optional (Recommended)
- **MongoDB Compass** - GUI for MongoDB
- **Postman** - API testing
- **VS Code** - Code editor with extensions

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/khandaker-abid/raptors-voting-analysis.git
cd raptors-voting-analysis
```

### 2. Install Dependencies

**Frontend:**
```bash
npm install
```

**Preprocessing:**
```bash
cd preprocessing
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

**Backend:**
```bash
cd raptors-backend
./mvnw clean install
cd ..
```

### 3. Start MongoDB
```bash
# Ubuntu/Linux
sudo systemctl start mongod

# macOS
brew services start mongodb-community

# Windows
net start MongoDB
```

### 4. Run Preprocessing (First Time Only)
```bash
cd preprocessing
./run_all_preprocessing.sh
python validate_preprocessing.py
cd ..
```

### 5. Start the Application

**Terminal 1 - Backend:**
```bash
cd raptors-backend
./mvnw spring-boot:run
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

**Access the app:** http://localhost:5173

### 6. Switch from Mock Data to Real Data

After preprocessing completes and backend is running:

```typescript
// src/data/api.ts - Line 14
const USE_MOCKS = false;  // Change from true to false
```

This switches the frontend from mock data to real MongoDB data via your Spring Boot API.

---

## 📁 Project Structure

```
raptors-voting-analysis/
├── src/                          # React frontend source
│   ├── components/              # Reusable UI components
│   ├── pages/                   # Page components
│   ├── charts/                  # Chart components (Recharts)
│   ├── tables/                  # Table components
│   ├── data/                    # API client & data utilities
│   └── assets/                  # Images, icons
│
├── preprocessing/               # Python data pipeline ⭐
│   ├── 01-13_*.py              # 13 preprocessing scripts
│   ├── utils/                   # Shared utilities
│   │   ├── database.py         # MongoDB connection
│   │   ├── geocoding.py        # Address geocoding
│   │   ├── census_api.py       # Census API wrapper
│   │   └── geojson_tools.py    # GeoJSON utilities
│   ├── config.json              # Database & API configuration
│   ├── run_all_preprocessing.sh # Master script
│   └── validate_preprocessing.py # Data validation
│
├── raptors-backend/             # Spring Boot backend
│   ├── src/main/java/          # Java source code
│   │   └── com/raptors/        # Application packages
│   │       ├── controller/     # REST controllers
│   │       ├── service/        # Business logic
│   │       ├── repository/     # MongoDB repositories
│   │       └── model/          # Data models
│   └── pom.xml                 # Maven dependencies
│
├── mongo-app/                   # MongoDB schemas
│   ├── schema.cjs              # Collection schemas
│   ├── models/                 # Mongoose models
│   └── app.cjs                 # Node.js connection
│
├── public/                      # Static assets
│   └── *.geojson               # US geographic boundaries
│
├── package.json                 # Node.js dependencies
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

---

## 🔄 Preprocessing Pipeline

The preprocessing pipeline consists of **13 scripts** that download, clean, and populate the MongoDB database with election data.

### Overview

```
Phase 1: Geographic Data → Phase 2: EAVS Data → Phase 3: Scores → 
Phase 4: Voter Data → Phase 5: Demographics
```

### Quick Start (Fully Automated)

```bash
cd preprocessing
./run_all_preprocessing.sh  # Runs all 13 scripts
python validate_preprocessing.py  # Verify results
```

**Runtime:** ~20 seconds (with caching) or 2-4 hours (first time)

### Manual Data Collection (Optional Enhancements)

Two optional enhancements require manual data collection due to anti-scraping measures:

#### 📊 Enhancement 1: Election Results (Prepro-11)

**Why manual?** State election websites use bot detection; 2024 data not yet in MIT Election Lab

**How to collect:**

<details>
<summary><b>Click to expand manual steps</b></summary>

**Option A: Wait for MIT Election Lab (Recommended)**

The MIT Election Data + Science Lab releases county-level presidential results 2-3 months after elections:

1. **Check availability**: https://dataverse.harvard.edu/dataverse/medsl_election_returns
2. **Download**: Look for "County Presidential Election Returns 2024"
3. **Place file**: `preprocessing/cache/election_results/countypres_2024.csv`
4. **Run script**: `python 11_download_election_results.py`

**Expected format:**
```csv
year,state,state_po,county_name,county_fips,office,candidate,party,candidatevotes,totalvotes
2024,ARKANSAS,AR,Pulaski County,05119,US PRESIDENT,DONALD J TRUMP,REPUBLICAN,89542,198000
2024,ARKANSAS,AR,Pulaski County,05119,US PRESIDENT,KAMALA D HARRIS,DEMOCRAT,102341,198000
```

**Option B: Download from State Websites**

**Arkansas:**
1. Visit: https://results.ark.org/ (or Secretary of State website)
2. Navigate to "2024 General Election" → "Presidential Results"
3. Download county-level data (CSV or Excel)
4. Convert to format: `county,candidate,party,votes`
5. Save as: `preprocessing/cache/election_results/ar_results_2024.csv`

**Maryland:**
1. Visit: https://elections.maryland.gov/elections/2024/index.html
2. Find "General Election Results" section
3. Download "Presidential Election Results by County" (CSV/Excel)
4. Save as: `preprocessing/cache/election_results/md_results_2024.csv`

**Rhode Island:**
1. Visit: https://elections.ri.gov/elections/2024/
2. Download presidential results by municipality
3. Save as: `preprocessing/cache/election_results/ri_results_2024.csv`

**After downloading files:**
```bash
cd preprocessing
python 11_download_election_results.py  # Auto-detects and imports CSV files
python validate_preprocessing.py         # Verify 104 county results
```

</details>

#### ⚙️ Enhancement 2: Detailed Equipment Specs (Prepro-6b)

**Why manual?** VerifiedVoting.org uses dynamic JavaScript; data not accessible via simple HTTP requests

**How to collect:**

<details>
<summary><b>Click to expand collection options</b></summary>

**Option A: Selenium-Based Automated Scraping (Recommended)**

Use browser automation to extract data from VerifiedVoting.org:

1. **Install Selenium** (first time only):
```bash
cd preprocessing
pip install selenium webdriver-manager
```

2. **Run the scraper**:
```bash
python 06c_selenium_verified_voting.py
```

3. **Recalculate quality scores**:
```bash
python 06_calculate_equipment_quality.py
```

**Expected Results:**
- ✅ Extracts equipment data for AR, MD, RI automatically
- ✅ Normalizes vendor names and equipment types
- ✅ Stores detailed specs in MongoDB
- ⚠️ May return 0 records if website structure changed

**If scraping fails:** See `SELENIUM_SETUP.md` for troubleshooting, or use Option B below.

---

**Option B: Manual Export from Verified Voting**

1. **Visit**: https://verifiedvoting.org/verifier/
2. **Select state**: Choose Arkansas, Maryland, or Rhode Island
3. **Export data**: For each county, note:
   - Manufacturer (e.g., ES&S, Dominion, Hart InterCivic)
   - Model (e.g., DS200, ExpressVote, ImageCast)
   - Technology type (Optical Scan, BMD, DRE, etc.)
   - Purchase year (if available)
4. **Create CSV**:
```csv
state,county,manufacturer,model,technology_type,purchase_year,os,certification
AR,Pulaski County,ES&S,DS200,Optical Scan,2016,Embedded Linux,EAC Certified
AR,Pulaski County,ES&S,ExpressVote,BMD,2018,Embedded Linux,EAC Certified
MD,Baltimore County,Dominion,ImageCast Evolution,BMD,2016,Embedded Linux,EAC Certified
```

5. **Save file**: `preprocessing/cache/equipment/equipment_data.csv`

6. **Import to database**:
```bash
cd preprocessing
cat > import_equipment.py << 'EOF'
import csv
from utils.database import DatabaseManager

db = DatabaseManager()
count = 0

with open('cache/equipment/equipment_data.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        db.upsert_one('votingEquipmentData', 
            {'stateAbbr': row['state'], 'county': row['county']},
            {'detailedSpecs': {
                'manufacturer': row['manufacturer'],
                'model': row['model'],
                'technologyType': row['technology_type'],
                'purchaseYear': int(row['purchase_year']) if row['purchase_year'] else None,
                'operatingSystem': row['os'],
                'certificationStatus': row['certification'],
                'dataSource': 'Manual Import'
            }}
        )
        count += 1

print(f"✓ Imported {count} equipment records")
EOF

python import_equipment.py
python 06_calculate_equipment_quality.py  # Recalculate with enhanced data
```

**Option B: Contact Verified Voting**

For bulk data access, contact Verified Voting directly:
- Email: info@verifiedvoting.org
- Explain: Academic research for CSE 416 project
- Request: Equipment database export for AR, MD, RI

**Impact on quality scores:**

Without detailed specs:
- Quality scores: 0.2-0.4 (Poor)
- Scoring based only on equipment presence flags

With detailed specs:
- Quality scores: 0.6-1.0 (Good-Excellent)
- Age-based scoring (penalize 10+ year old equipment)
- OS security assessment (flag Windows XP/7)
- Certification status (EAC certified preferred)

</details>

**Note:** Both enhancements are **optional**. The core pipeline (11/13 scripts, 85%) runs fully automated and provides all essential data for the application.

---

### All 13 Scripts (Run Automatically)

| # | Script | Purpose | Runtime |
|---|--------|---------|---------|
| 01 | `download_boundaries.py` | Download 48 state boundaries | ~5 min |
| 02 | `download_eavs_data.py` | Download EAVS Excel files (2016-2024) | ~5 min |
| 03 | `populate_eavs_db.py` | Parse EAVS data → MongoDB | ~15 min |
| 04 | `download_geographic_boundaries.py` | Download county boundaries | ~5 min |
| 05 | `calculate_data_completeness.py` | Calculate completeness scores | ~5 min |
| 05b | `extract_equipment_from_eavs.py` | Extract equipment flags from EAVS | ~2 min |
| 06 | `calculate_equipment_quality.py` | Calculate quality scores | ~5 min |
| 06b | `scrape_verified_voting.py` | ⚠️ Scrape detailed equipment specs (optional) | varies |
| 07 | `download_voter_registration.py` | Download voter registration (MD) | ~20 min |
| 08 | `automated_voter_analysis.py` | USPS address validation (optional) | ~2 hours |
| 09 | `geocode_voters_to_census_blocks.py` | Geocode voters (optional) | ~2 hours |
| 10 | `assign_voters_to_eavs_regions.py` | Assign county FIPS codes | ~30 min |
| 11 | `download_election_results.py` | ⚠️ Download 2024 Presidential results | ~5 min |
| 12 | `download_cvap_data.py` | Download CVAP demographic data | ~5 min |
| 13 | `collect_felony_voting_policies.py` | Collect felony voting policies | <1 min |

**Total Runtime:** ~20 seconds (cached) or 2-4 hours (first time)

**Legend:**
- ⚠️ = May require manual data collection (see enhancement guides above)
- Scripts 05b and 06b added as optional enhancements

### Quick Start

```bash
cd preprocessing

# Run all scripts automatically
./run_all_preprocessing.sh

# Validate results
python validate_preprocessing.py
```

### Configuration

The preprocessing pipeline uses free API keys (already configured):
- **Census API** - Public demographic data (CVAP)
- **USPS API** - Address validation (only used if voter data available)

**Note:** All API keys are free tier and included in `config.json` for team convenience. This is a **private repository** for educational use only.

#### About USPS API Keys

The USPS API keys are **fully implemented but currently unused**:

**Why?** 
- USPS validation requires voter registration data
- AR/RI don't provide public voter files
- MD requires data purchase
- Script auto-skips when no voter data present

**When would it be used?**
If you obtain voter registration data, the script would automatically:
- ✅ Validate addresses using USPS API  
- ✅ Standardize formatting
- ✅ Flag undeliverable addresses
- ✅ Mark delivery point validation (DPV) status

**Status:** Ready to use, waiting for voter data input

---

### Data Output

After preprocessing, MongoDB contains:

| Collection | Documents | Size | Description |
|------------|-----------|------|-------------|
| `boundaryData` | ~200 | ~50 MB | State & county GeoJSON boundaries |
| `eavsData` | ~14,000 | ~500 MB | EAVS records (2016-2024) with scores |
| `votingEquipmentData` | ~1,000 | ~10 MB | Equipment with quality metrics |
| `voterRegistration` | ~500K+ | 2-10 GB | MD voter records (geocoded) |
| `electionResults` | ~150 | ~5 MB | 2024 Presidential results |
| `demographicData` | ~150 | ~5 MB | CVAP by county |
| `felonyVotingData` | 48 | <1 MB | State felony voting policies |

**Total:** 2-12 GB (varies by state data)

### Detailed States

The project focuses on three states for in-depth analysis:
- **Arkansas (AR)** - Republican-dominated, opt-out without same-day registration
- **Maryland (MD)** - Democratic-dominated, opt-out with same-day registration, voter registration data
- **Rhode Island (RI)** - Opt-in state

### Documentation

See [`preprocessing/README.md`](preprocessing/README.md) for complete documentation on:
- Individual script details
- Troubleshooting common issues
- API key setup
- Manual data download instructions

---

## 🖥️ Backend Setup

### Start Development Server
```bash
cd raptors-backend
./mvnw spring-boot:run
```

**Server runs on:** http://localhost:8080

### MongoDB Connection

Backend connects to the same MongoDB database populated by preprocessing:

```properties
# application.properties
spring.data.mongodb.uri=mongodb://localhost:27017/voting_analysis
spring.data.mongodb.database=voting_analysis
```

### API Endpoints

```
GET  /api/eavs/states           - Get all EAVS data by state
GET  /api/eavs/states/{abbr}    - Get EAVS data for specific state
GET  /api/boundaries/states     - Get state boundary GeoJSON
GET  /api/boundaries/counties   - Get county boundaries
GET  /api/voters/registration   - Get voter registration data
GET  /api/equipment/quality     - Get equipment quality scores
GET  /api/demographics/cvap     - Get CVAP demographic data
```

### Build for Production
```bash
./mvnw clean package
java -jar target/raptors-backend-0.0.1-SNAPSHOT.jar
```

---

## 💻 Frontend Setup

### Development Server
```bash
npm run dev
```

**App runs on:** http://localhost:5173

### Build for Production
```bash
npm run build
npm run preview  # Preview production build
```

### Environment Variables

Create `.env.local`:
```bash
VITE_API_BASE_URL=http://localhost:8080/api
VITE_MONGODB_URI=mongodb://localhost:27017/voting_analysis
```

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Lint TypeScript/React code
```

---

## 🗄️ Database

### MongoDB Setup

**Local Database (Development):**
```bash
# Install MongoDB
brew install mongodb-community  # macOS
sudo apt-get install mongodb    # Ubuntu

# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Ubuntu

# Verify connection
mongosh
use voting_analysis
show collections
```

**Expected Collections:**
```javascript
> show collections
boundaryData
eavsData
votingEquipmentData
voterRegistration
electionResults
demographicData
felonyVotingData
```

**Cloud Database (Production):**

For team collaboration, consider **MongoDB Atlas** (free tier):
1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster (512 MB)
3. Update `preprocessing/config.json` with Atlas connection string
4. One person runs preprocessing to populate cloud database
5. Team members connect to shared database

### Verify Data

```bash
cd preprocessing
python validate_preprocessing.py
```

**Expected output:**
```
✅ VALIDATION PASSED
Collections: 7/7 ✓
Records: 500,000+ ✓
All required data present!
```

---

## 📚 API Documentation

### REST API Endpoints

Full API documentation available at: http://localhost:8080/swagger-ui.html (when backend is running)

### Example Requests

**Get EAVS data for Maryland:**
```bash
curl http://localhost:8080/api/eavs/states/MD
```

**Get voter registration statistics:**
```bash
curl http://localhost:8080/api/voters/registration?state=MD&year=2024
```

**Get equipment quality scores:**
```bash
curl http://localhost:8080/api/equipment/quality?minScore=0.7
```

---

## 🤝 Contributing

### Team Members
This is a CSE 416 student project. Team members should:

1. **Never commit:**
   - `.venv/` directory (Python virtual environment)
   - `preprocessing/cache/` (downloaded data files)
   - `__pycache__/` (Python bytecode)
   - `.env` files (though `.env.example` is okay)

2. **Always commit:**
   - Source code changes
   - Documentation updates
   - Configuration templates

3. **Before pushing:**
   ```bash
   # Check what's being committed
   git status
   
   # Verify .gitignore is working
   git check-ignore preprocessing/cache/*
   ```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Description of changes"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
```

---

## 🔒 Security Note

**API Keys in Repository:**

This repository includes API keys in `preprocessing/config.json` for team convenience.

⚠️ **These are FREE, PUBLIC API keys with no billing:**
- Census API (public government data)
- USPS API (free address validation)

**DO NOT:**
- Make this repository public
- Use these keys for production/commercial projects
- Share these keys outside the team

**This is acceptable for:**
- ✅ Private educational repositories
- ✅ Free tier API services
- ✅ Trusted team members only

---

## 📄 License

This project is developed for **CSE 416 - Software Engineering** at Stony Brook University.

Educational use only. Not for commercial distribution.

---

## 📞 Support

### Documentation
- **Preprocessing:** [`preprocessing/README.md`](preprocessing/README.md)
- **Getting Started:** [`preprocessing/GETTING_STARTED.md`](preprocessing/GETTING_STARTED.md)
- **Scripts Reference:** [`preprocessing/SCRIPTS_REFERENCE.md`](preprocessing/SCRIPTS_REFERENCE.md)
- **API Keys Setup:** [`preprocessing/API_KEYS_SETUP.md`](preprocessing/API_KEYS_SETUP.md)
- **Manual EAVS Download:** [`preprocessing/MANUAL_EAVS_DOWNLOAD.md`](preprocessing/MANUAL_EAVS_DOWNLOAD.md) ⭐
- **Election Results Setup:** [`preprocessing/ELECTION_RESULTS_SETUP.md`](preprocessing/ELECTION_RESULTS_SETUP.md) (Optional)
- **Verified Voting Setup:** [`preprocessing/VERIFIED_VOTING_SETUP.md`](preprocessing/VERIFIED_VOTING_SETUP.md) (Optional)
- **Enhancements Summary:** [`preprocessing/ENHANCEMENTS_SUMMARY.md`](preprocessing/ENHANCEMENTS_SUMMARY.md)

**Legend:** ⭐ = Required for 2024+ data | (Optional) = Enhancement features

### Troubleshooting

**MongoDB Connection Issues:**
```bash
sudo systemctl status mongod  # Check if running
sudo systemctl start mongod   # Start if stopped
mongosh                       # Test connection
```

**Preprocessing Errors:**
```bash
cd preprocessing
python validate_preprocessing.py  # Check data integrity
```

**Backend Won't Start:**
```bash
cd raptors-backend
./mvnw clean install  # Rebuild
```

**Frontend Issues:**
```bash
rm -rf node_modules package-lock.json
npm install  # Reinstall dependencies
```

**Election Results Scraper Returns 0 Records:**

This is **expected** for 2024 data until official releases become available.

**Why?**
- State websites use bot detection (403 Forbidden errors)
- MIT Election Lab hasn't released 2024 data yet (typically 2-3 months post-election)
- Dynamic content requires browser automation

**Solutions:**
1. **Wait for MIT Election Lab release** (recommended): https://dataverse.harvard.edu/dataverse/medsl_election_returns
2. **Manual download**: Follow steps in preprocessing section above
3. **Use development data**: App works fine without election results (optional feature)

See detailed guide: `preprocessing/ELECTION_RESULTS_SETUP.md`

**Equipment Scraper Returns 0 Records:**

This is **expected** due to JavaScript-rendered content.

**Why?**
- VerifiedVoting.org loads data dynamically via JavaScript
- Simple HTTP requests only get empty HTML shell
- Requires browser automation (Selenium) for access

**Solutions:**
1. **Manual collection**: Export from VerifiedVoting.org (15-30 min for 3 states)
2. **Accept basic scoring**: Current pipeline uses EAVS equipment flags (functional but limited)
3. **Contact Verified Voting**: Request data export for academic use

See detailed guide: `preprocessing/VERIFIED_VOTING_SETUP.md`

**Low Equipment Quality Scores (0.2-0.4):**

This is **expected** without detailed equipment specifications.

**Why?**
- Basic EAVS data only includes equipment type flags (DRE, optical scan, BMD)
- Quality scoring needs make/model/age/OS for accurate assessment

**Impact:**
- ✅ Equipment data still available and functional
- ⚠️ Quality metrics limited to basic presence/absence scoring
- ✅ Sufficient for development and demonstration

**To improve scores:**
- Collect detailed equipment specs (see enhancement guide above)
- Quality scores will improve from 0.3 → 0.7+ with detailed data

---

## 🎯 Project Status

- ✅ **Preprocessing Pipeline:** 13/13 scripts complete
- ✅ **Database Schema:** Fully designed and implemented
- ✅ **Backend API:** Spring Boot REST endpoints
- ✅ **Frontend UI:** React components with visualizations
- 🚧 **Testing:** In progress
- 🚧 **Documentation:** Ongoing updates

---

## 🚧 Known Limitations & Constraints

The preprocessing pipeline is **85% automated** (11/13 scripts). Here are the known limitations:

### 1. EAVS Manual Downloads (2024-2026)
- **Issue:** EAC blocks automated downloads with bot detection (403 Forbidden)
- **Workaround:** Manual download documented in `MANUAL_EAVS_DOWNLOAD.md`
- **Timeline:** 1-2 minutes per year, every 2 years

### 2. Election Results Bot Detection
- **Issue:** State election websites use Cloudflare/anti-bot measures (403 Forbidden)
- **Issue:** MIT Election Lab 2024 data not yet released (404 Not Found)
- **Workaround:** Manual download from state sites or MIT (when available)
- **Documentation:** `ELECTION_RESULTS_SETUP.md`

### 3. Equipment Specs Dynamic Rendering
- **Issue:** VerifiedVoting.org uses JavaScript rendering (empty HTML without browser)
- **Issue:** Multi-extraction strategies fail on dynamically loaded content
- **Workaround:** Manual copy-paste from website
- **Documentation:** `VERIFIED_VOTING_SETUP.md`

### 4. Voter Registration Restricted Access
- **Issue:** AR/RI have no public voter files (state law prohibits)
- **Issue:** MD requires data purchase ($500-$1000)
- **Impact:** Scripts 08-09 auto-skip, core analysis unaffected

### 5. USPS API Rate Limits
- **Issue:** Free tier limited to 5,000 addresses/day
- **Issue:** MD has ~4.6M registered voters
- **Impact:** Full validation requires 920 days or paid tier ($1,000/year)

### 6. Census API Rate Limits
- **Issue:** 500 requests/day for CVAP data
- **Issue:** Can throttle on first run for states with many counties
- **Workaround:** Script auto-caches and retries with exponential backoff

### 7. Geocoding Service Costs
- **Issue:** Census Geocoder is free but rate-limited (10,000/day)
- **Issue:** Google Maps costs $5/1000 addresses (~$23,000 for 4.6M voters)
- **Impact:** Script 09 optional, uses free Census API

### 8. Historical Data Gaps
- **Issue:** EAVS only available 2016-2024 (biennial survey)
- **Issue:** Some states skip surveys or submit incomplete data
- **Impact:** Completeness scores reflect actual reporting gaps

### 9. County Boundary Changes
- **Issue:** Rare but possible (e.g., Broomfield County, CO in 2001)
- **Issue:** Scripts use 2024 boundaries for all historical data
- **Impact:** Minor geocoding discrepancies in edge cases

### 10. Browser-Based Authentication
- **Issue:** Some sites require interactive login (e.g., Maryland voter portal)
- **Issue:** Cannot be fully automated without credentials storage
- **Workaround:** Manual download, then script auto-ingests files

**Overall:** Core pipeline (11/13 scripts, 85%) is fully automated. Optional enhancements (election results, equipment specs) have manual workarounds documented.

---

## ❓ FAQ

<details>
<summary><b>Q: Do I need to manually collect election results and equipment data?</b></summary>

**A: No, it's optional.**

The core preprocessing pipeline (11/13 scripts, 85%) runs fully automatically and provides all essential data:
- ✅ State & county boundaries
- ✅ EAVS data (19,388 records)
- ✅ Data completeness scores
- ✅ Basic equipment data
- ✅ CVAP demographics
- ✅ Felony voting policies

**Election results** and **detailed equipment specs** are optional enhancements that improve visualizations but aren't required for core functionality.

**For development/testing:** Current automated data is sufficient.

**For production:** Consider collecting the optional enhancements manually (15-60 min total).

</details>

<details>
<summary><b>Q: Why do the election results and equipment scrapers fail?</b></summary>

**A: Expected behavior due to anti-scraping measures.**

State election websites and VerifiedVoting.org use:
- Bot detection (403 Forbidden errors)
- Dynamic JavaScript rendering
- CAPTCHA challenges
- Rate limiting

These are **intentional security measures** and not bugs in our code.

**Solutions:**
- Wait for official data releases (MIT Election Lab)
- Manual collection (documented in preprocessing section)
- Accept that scrapers will be updated when data is officially available

</details>

<details>
<summary><b>Q: Are the USPS API keys being used?</b></summary>

**A: Not currently, but they're ready.**

The USPS API keys are fully implemented in `08_automated_voter_analysis.py` but only activate when voter registration data is available.

**Current status:**
- AR: No public voter files (by law)
- RI: No public voter files (by law)
- MD: Requires data purchase

**If you obtain voter data:**
- Script automatically detects it
- USPS validation runs automatically
- Addresses are standardized and verified

**No action needed** - implementation is ready whenever data becomes available.

</details>

<details>
<summary><b>Q: How long does preprocessing take?</b></summary>

**A: 20 seconds (cached) or 2-4 hours (first time).**

**First run (downloading all data):**
- 2-4 hours total
- Largest time: Voter registration download and geocoding (if available)
- Can leave running overnight

**Subsequent runs (with cache):**
- ~20 seconds
- Uses cached boundary and EAVS files
- Only updates changed data

**Skip long steps:**
- Prepro-8 (USPS validation): Optional, auto-skips if no voter data
- Prepro-9 (Geocoding): Optional, auto-skips if no voter data

</details>

<details>
<summary><b>Q: Can I use this project with different states?</b></summary>

**A: Yes, but requires configuration changes.**

**To add/change states:**

1. **Edit config**: `preprocessing/config.json`
```json
{
  "detailedStates": {
    "stateAbbrs": ["CA", "TX", "NY"]  // Change these
  }
}
```

2. **Re-run preprocessing**:
```bash
cd preprocessing
./run_all_preprocessing.sh
```

3. **Update frontend**: Modify state lists in `src/data/states.ts`

**Note:** Some states may not have public voter registration data. Check state election websites first.

</details>

<details>
<summary><b>Q: What if I don't have Python 3.12?</b></summary>

**A: Python 3.10+ should work.**

Officially tested with Python 3.12, but the code should work with:
- ✅ Python 3.12 (tested)
- ✅ Python 3.11 (should work)
- ✅ Python 3.10 (should work)
- ⚠️ Python 3.9 (may have issues)

**If using older Python:**
```bash
# Check version
python --version

# Create virtual environment
python3.11 -m venv .venv  # Use your version
source .venv/bin/activate
pip install -r requirements.txt
```

</details>

<details>
<summary><b>Q: Is MongoDB required, or can I use another database?</b></summary>

**A: MongoDB is required for geospatial features.**

MongoDB is used because:
- ✅ Native GeoJSON support (state/county boundaries)
- ✅ Flexible schema for varying EAVS data
- ✅ Fast geospatial queries
- ✅ Excellent Python integration (PyMongo)

**Switching databases would require:**
- Rewriting preprocessing scripts
- Updating backend repositories
- Losing geospatial query capabilities
- Significant development effort

**Not recommended** unless you have specific requirements.

</details>

---

**Built with ❤️ by the Raptors Team for CSE 416**

---

## 🔗 Quick Links

### Project Documentation
- [Preprocessing Documentation](preprocessing/README.md) - Complete preprocessing guide
- [Manual EAVS Download Guide](preprocessing/MANUAL_EAVS_DOWNLOAD.md) - Required for 2024+ EAVS data
- [Election Results Setup](preprocessing/ELECTION_RESULTS_SETUP.md) - Optional enhancement
- [Verified Voting Setup](preprocessing/VERIFIED_VOTING_SETUP.md) - Optional enhancement
- [Enhancements Summary](preprocessing/ENHANCEMENTS_SUMMARY.md) - Technical implementation details
- [Quick Reference](preprocessing/QUICK_REFERENCE.md) - Fast lookup guide

### External Resources
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev)
- [MongoDB Documentation](https://docs.mongodb.com)
- [EAVS Data Source](https://www.eac.gov/research-and-data/datasets-codebooks-and-surveys)
- [Census API](https://www.census.gov/data/developers/data-sets.html)
- [MIT Election Lab](https://electionlab.mit.edu/)
- [VerifiedVoting.org](https://verifiedvoting.org/)

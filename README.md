# 🗳️ Raptors Voting Analysis

[![CSE 416](https://img.shields.io/badge/CSE-416-blue)](https://www.stonybrook.edu)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![Node.js](https://img.shields.io/badge/node.js-18%2B-green.svg)](https://nodejs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.6-green.svg)](https://spring.io/projects/spring-boot)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green.svg)](https://www.mongodb.com/)
[![Tests](https://img.shields.io/badge/tests-37%2F37%20passing-brightgreen.svg)]()
[![Use Cases](https://img.shields.io/badge/use%20cases-55%2F55%20complete-brightgreen.svg)]()

Interactive web application for analyzing and visualizing election administration data, voter registration trends, voting equipment quality, and Voting Rights Act preclearance analysis across the United States. Built for **CSE 416 - Software Engineering**.

**Full-stack application featuring:**
- 🎨 **React Frontend** - Interactive maps, charts, and data visualizations with 30 GUI components
- ⚙️ **Spring Boot Backend** - RESTful API with 30+ endpoints and MongoDB integration
- 🗄️ **MongoDB Database** - 26,636+ records across 11 collections
- 🔄 **Automated Pipeline** - 16 preprocessing scripts with full automation
- ✅ **Testing Suite** - 100% pass rate on 37 integration tests
- 📊 **Statistical Analysis** - Non-linear regression and ecological inference modeling

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

### Interactive Maps & Visualizations
- **Geographic Choropleths** - State and county-level voting data visualizations
- **Census Block Bubbles** - Voter registration overlays with demographic data
- **Dynamic Filtering** - Filter by state, year, party, and data completeness

### Data Analysis & Charts
- **Equipment History** - Track voting equipment types and quality over time (2016-2024)
- **Registration Trends** - Multi-year voter registration pattern analysis with sorted timelines
- **EAVS Insights** - Active voters, provisional ballots, pollbook deletions, mail rejections
- **Party Comparisons** - Republican vs Democratic state analysis
- **Equipment Quality** - Automated quality metrics with rejection rate correlations
- **Regression Analysis** - Power curve regression lines showing statistical correlations

### Voting Rights Act Analysis
- **Gingles Factors** - Three-prong test for Section 2 VRA compliance
- **Ecological Inference** - Equipment quality and ballot rejection analysis by demographics
- **Statistical Modeling** - Normal distribution curves for six demographic groups
- **Disparities Detection** - Automated identification of voting access inequalities
- **Preclearance Tools** - Comprehensive VRA Section 2 analysis for covered jurisdictions

---

## 🛠️ Tech Stack

### Frontend
- **React 19.1** - Modern UI components with hooks
- **TypeScript 5.8** - Type-safe development
- **Vite 7.1** - Lightning-fast build tool
- **Material-UI (MUI) 7.3** - Professional component library
- **Leaflet + React-Leaflet** - Interactive geographic maps
- **Recharts 3.2** - Responsive data visualizations
- **Axios** - HTTP client for API communication

### Backend
- **Spring Boot 3.5.6** - Production-ready REST API
- **Java 17** - Modern Java features with Maven build
- **MongoDB 7.0+** - NoSQL database with native GeoJSON support
- **Spring Data MongoDB** - Data access layer
- **CORS Support** - Cross-origin resource sharing enabled

### Data Pipeline
- **Python 3.12** - 16 automated ETL/preprocessing scripts
- **Pandas** - Data manipulation and analysis
- **NumPy** - Statistical modeling and computations
- **PyMongo** - MongoDB driver for Python
- **Requests** - HTTP library for API calls

### Testing & Validation
- **Integration Tests** - 37 automated tests covering all endpoints
- **Database Validation** - Automated schema and data integrity checks
- **Performance Testing** - Response time validation (<100ms target)

### APIs & Data Sources
- **Census Bureau API** - CVAP demographic data
- **EAC EAVS Datasets** - Election administration surveys (2016-2024)
- **Census TIGER/Line** - Geographic boundaries
- **MIT Election Lab** - Presidential election results (2000-2024)
- **VerifiedVoting** - Voting equipment specifications

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

### 2. Start MongoDB
```bash
# Ubuntu/Linux
sudo systemctl start mongod

# macOS
brew services start mongodb-community

# Windows
net start MongoDB
```

### 3. Setup and Run (Choose One)

**Option A: Full Stack with Real Data**

```bash
# Terminal 1 - Setup and populate database
cd preprocessing
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
./run_all_preprocessing.sh  # Populates MongoDB (~30 seconds)
cd ..

# Terminal 2 - Start backend
cd raptors-backend
./mvnw clean install
./mvnw spring-boot:run  # Runs on http://localhost:8080

# Terminal 3 - Start frontend
npm install
npm run dev  # Runs on http://localhost:5173

# Terminal 4 (Optional) - Run integration tests
python test_integration.py  # Validates entire stack
```

Then configure frontend to use real data:
```typescript
// src/data/api.ts - Line 14
const USE_MOCKS = false;  // Change from true to false
```

**Option B: Quick Start with Mock Data**

```bash
# Install and start frontend only
npm install
npm run dev  # Runs on http://localhost:5173
```

Frontend will use mock data - perfect for UI development without database setup.

**Access the app:** http://localhost:5173

---

## 📁 Project Structure

```
raptors-voting-analysis/
├── src/                          # React frontend source
│   ├── components/              # Reusable UI components
│   ├── pages/                   # Page components (30 GUI features)
│   ├── charts/                  # Chart components (Recharts)
│   ├── tables/                  # Table components
│   ├── data/                    # API client & data utilities
│   └── assets/                  # Images, icons
│
├── preprocessing/               # Python data pipeline ⭐
│   ├── 01-16_*.py              # 16 preprocessing scripts
│   │   ├── 01-04: Boundaries   # Geographic data
│   │   ├── 05-06: EAVS/Quality # Survey data & quality metrics
│   │   ├── 07-10: Voters       # Registration & geocoding
│   │   ├── 11-13: Elections    # Results, CVAP, policies
│   │   ├── 14-15: GUI Data     # Equipment history, bubbles
│   │   └── 16: EI Analysis     # Ecological inference
│   ├── utils/                   # Shared utilities
│   │   ├── database.py         # MongoDB connection
│   │   ├── census_api.py       # Census API wrapper
│   │   └── geojson_tools.py    # GeoJSON utilities
│   ├── config.json              # Database & API configuration
│   ├── run_all_preprocessing.sh # Master automation script
│   └── validate_preprocessing.py # Data validation
│
├── raptors-backend/             # Spring Boot backend
│   ├── src/main/java/          # Java source code
│   │   └── com/example/raptorsbackend/
│   │       ├── controller/     # REST controllers (6 files)
│   │       │   ├── EAVSController.java
│   │       │   ├── EquipmentController.java
│   │       │   ├── RegistrationController.java
│   │       │   ├── PreclearanceController.java
│   │       │   ├── PartyComparisonController.java
│   │       │   └── DataController.java
│   │       ├── service/        # Business logic
│   │       └── model/          # Data models
│   ├── pom.xml                 # Maven dependencies
│   └── target/                 # Compiled JAR files
│
├── mongo-app/                   # MongoDB schemas
│   ├── schema.cjs              # Collection schemas
│   ├── models/                 # Mongoose models
│   └── app.cjs                 # Node.js connection
│
├── public/                      # Static assets
│   └── *.geojson               # US geographic boundaries
│
├── test_integration.py          # Integration test suite (37 tests)
├── validate_database.py         # Database validation tool
├── package.json                 # Node.js dependencies
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

---

## 🔄 Data Pipeline

The data pipeline automatically populates MongoDB with election data from multiple sources.

### Quick Setup

```bash
cd preprocessing
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
./run_all_preprocessing.sh  # Runs all 16 scripts
python validate_preprocessing.py  # Verify results
```

**Runtime:** ~30 seconds | **Status:** Fully automated with cached data files

### Data Sources

**Automated sources:**
- EAVS survey data (2016-2024) from EAC
- State/county boundaries from Census TIGER/Line
- CVAP demographics from Census API
- Felony voting policies (50 states)
- Equipment history trends (2016-2024)
- Census block geocoded voters

**Committed data files:**
- MIT Election Lab results: `countypres_2000-2024.csv` (8.4 MB)
- VerifiedVoting equipment CSVs: 18 files (404 KB)

All data files are cached and committed to the repository for zero-setup deployment.

### Pipeline Details

The pipeline runs 16 automated scripts organized by function:

**Geographic Setup (Scripts 1-4):**
1. Download state/county boundaries
2. Download EAVS survey data (2016-2024)
3. Populate EAVS database
4. Download geographic boundaries

**Data Quality (Scripts 5-6):**
5. Calculate data completeness metrics
6. Calculate equipment quality scores

**Voter Analysis (Scripts 7-10):**
7. Download voter registration data
8. Automated voter analysis
9. Geocode voters to census blocks
10. Assign voters to EAVS regions

**Supplementary Data (Scripts 11-13):**
11. Download election results
12. Download CVAP demographic data
13. Collect felony voting policies

**GUI Data Generation (Scripts 14-16):**
14. Generate equipment history trends
15. Generate census block bubbles
16. Generate ecological inference analysis

**Total runtime:** ~30 seconds | **Configuration:** `preprocessing/config.json`

For detailed script documentation, see [`preprocessing/README.md`](preprocessing/README.md).

### Database Collections

After running the pipeline, MongoDB contains 26,636+ records across 11 collections:

| Collection | Documents | Description |
|------------|-----------|-------------|
| `eavsData` | 19,388 | EAVS survey records (2016-2024) |
| `census_block_voters` | 4,510 | Geocoded voter registration by census block |
| `equipment_history` | 1,120 | Equipment type trends over time |
| `votingEquipmentData` | 1,008 | Equipment specifications and quality metrics |
| `ei_precinct_analysis` | 154 | Ecological inference precinct-level data |
| `boundaryData` | 152 | State & county GeoJSON boundaries |
| `electionResults` | 138 | Presidential election results by county |
| `demographicData` | 104 | CVAP demographic data |
| `felonyVotingData` | 50 | State felony voting policies |
| `ei_equipment_analysis` | 6 | EI equipment quality curves by demographic |
| `ei_rejection_analysis` | 6 | EI ballot rejection curves by demographic |

**Focus States:** Arkansas (Republican), Maryland (Democratic), Rhode Island (Opt-in)

---

## 🖥️ Backend API

### Start Server
```bash
cd raptors-backend
./mvnw clean install
./mvnw spring-boot:run
```

**Server:** http://localhost:8080 | **Tech:** Spring Boot 3.5.6 + MongoDB

### Key Endpoints

**EAVS Data:**
```
GET  /api/eavs/{state}/active-voters?year=2024        - Active/inactive voter counts
GET  /api/eavs/{state}/provisional-ballots?year=2024  - Provisional ballot data
GET  /api/eavs/{state}/pollbook-deletions?year=2024   - Voter removal reasons
GET  /api/eavs/{state}/mail-rejections?year=2024      - Mail ballot rejection reasons
GET  /api/eavs/health                                 - Health check
```

**Equipment Data:**
```
GET  /api/equipment/{state}/types                     - Equipment types by state
GET  /api/equipment/history/{state}                   - Historical equipment data (2016-2024)
GET  /api/equipment/age/all-states                    - Equipment age by state
GET  /api/equipment/vs-rejected/{state}               - Equipment quality vs rejection correlation
GET  /api/equipment/health                            - Health check
```

**Voter Registration:**
```
GET  /api/registration/trends/{state}                 - Registration trends (2016-2024, sorted)
GET  /api/registration/blocks/{state}                 - Census block bubble data
GET  /api/registration/voters/{state}/{county}        - Paginated voter list with party filter
GET  /api/registration/opt-in-out-comparison          - Opt-in vs opt-out states
GET  /api/registration/health                         - Health check
```

**Preclearance Analysis:**
```
GET  /api/preclearance/gingles/{state}                - Gingles three-prong test
GET  /api/preclearance/ei-equipment/{state}           - EI equipment quality curves
GET  /api/preclearance/ei-rejected/{state}            - EI rejection rate curves
GET  /api/preclearance/health                         - Health check
```

**Party Comparison:**
```
GET  /api/comparison/party-states                     - Republican vs Democratic states
GET  /api/eavs/dropbox-bubbles/{state}                - Drop box voting bubble chart data
GET  /api/registration/early-voting/comparison        - Early voting comparisons
```

### Configuration

MongoDB connection in `application.properties`:
```properties
spring.data.mongodb.uri=mongodb://localhost:27017/voting_analysis
spring.data.mongodb.database=voting_analysis
```

### Production Build
```bash
./mvnw clean package
java -jar target/raptors-backend-0.0.1-SNAPSHOT.jar
```

---

## 💻 Frontend UI

### Development Server
```bash
npm install
npm run dev
```

**App:** http://localhost:5173 | **Tech:** React 18 + TypeScript + Vite

### Features

**30 GUI Components Organized by Category:**

**EAVS Data Visualization:**
- Active and inactive voter tracking with percentages
- Provisional ballot analysis with detailed rejection reasons
- Pollbook deletion tracking by category
- Mail ballot rejection analysis with comprehensive breakdowns
- Geographic choropleths for county-level patterns

**Equipment Analysis:**
- Equipment type distribution maps by county
- Equipment age choropleth with 1-10 year bins
- Historical equipment trends (2016-2024) with multi-year comparisons
- State-level equipment summaries with quality scores
- Equipment quality vs ballot rejection correlation analysis

**Voter Registration Analysis:**
- Multi-year registration trends (2016-2024) sorted by volume
- Census block bubble visualizations showing party dominance
- Paginated voter list tables with filtering by party
- Party affiliation breakdowns by geographic unit
- Opt-in vs opt-out state comparisons

**Comparative Analysis:**
- Republican vs Democratic state comparisons across metrics
- Early voting method comparisons (in-person, mail, drop box)
- Drop box distribution bubble charts with vote correlation
- Equipment quality impact on rejection rates with regression lines
- Registration policy effects on turnout

**Voting Rights Act Analysis:**
- Gingles three-prong test visualization for VRA compliance
- Ecological inference equipment quality curves by demographic
- Ballot rejection rate analysis across demographic groups
- Statistical disparity detection with normal distributions
- Preclearance jurisdiction analysis tools

**Technology Stack:**
- Material-UI (MUI) design system
- Leaflet for interactive mapping
- Recharts for data visualization
- TypeScript for type safety

### Mock vs Real Data

Toggle between mock and real data in `src/data/api.ts`:
```typescript
const USE_MOCKS = true;  // false to use backend API
```

### Production Build
```bash
npm run build       # Build for production
npm run preview     # Preview build locally
```

---

## 🗄️ Database

### MongoDB Setup

**Local Development:**
```bash
# Install MongoDB
brew install mongodb-community  # macOS
sudo apt-get install mongodb    # Ubuntu

# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Ubuntu

# Verify connection
mongosh
> use voting_analysis
> show collections
```

**Expected Collections (11 total):**
- `eavsData` - EAVS survey records (19,388 docs)
- `census_block_voters` - Geocoded voters (4,510 docs)
- `equipment_history` - Equipment trends (1,120 docs)
- `votingEquipmentData` - Equipment specs (1,008 docs)
- `ei_precinct_analysis` - EI precinct data (154 docs)
- `boundaryData` - Geographic boundaries (152 docs)
- `electionResults` - Election results (138 docs)
- `demographicData` - CVAP demographics (104 docs)
- `felonyVotingData` - State policies (50 docs)
- `ei_equipment_analysis` - EI equipment curves (6 docs)
- `ei_rejection_analysis` - EI rejection curves (6 docs)

**Total:** 26,636+ documents

**Cloud Deployment (Production):**

Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier (512 MB):
1. Create cluster and get connection string
2. Update `preprocessing/config.json` with Atlas URI
3. Run preprocessing to populate cloud database
4. Update backend `application.properties` with Atlas URI

### Data Verification

```bash
cd preprocessing
python validate_preprocessing.py

# Or use the comprehensive database validator
python validate_database.py --dry-run       # Check for issues
python validate_database.py --auto-fix      # Apply repairs
```

---

## 📚 Documentation

### API Reference

**Base URL:** `http://localhost:8080/api`

**Example API calls:**
```bash
# EAVS Data
curl http://localhost:8080/api/eavs/MARYLAND/active-voters?year=2020
curl http://localhost:8080/api/eavs/MARYLAND/provisional-ballots?year=2024

# Equipment Data
curl http://localhost:8080/api/equipment/Maryland/types
curl http://localhost:8080/api/equipment/history/Maryland

# Registration Data
curl http://localhost:8080/api/registration/trends/Maryland
curl http://localhost:8080/api/registration/blocks/Maryland

# Preclearance Analysis
curl http://localhost:8080/api/preclearance/gingles/Maryland
curl http://localhost:8080/api/preclearance/ei-equipment/Maryland
```

### Response Format

All endpoints return JSON. Example response structure:

```json
{
  "state": "MARYLAND",
  "year": 2020,
  "data": [
    {
      "geographicUnit": "Baltimore County",
      "activeVoters": 567890,
      "totalVoters": 612345,
      "activePercentage": 92.7
    }
  ]
}
```

### Project Documentation

- **[preprocessing/README.md](preprocessing/README.md)** - Complete data pipeline guide
- **Integration Tests** - Run `python test_integration.py` for API validation
- **Database Validator** - Run `python validate_database.py --dry-run` for schema checks
- **Component Docs** - See inline JSDoc/TSDoc comments in `src/` files

---

## 🤝 Development Workflow

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Description of changes"

# Push and create pull request
git push origin feature/your-feature-name
```

### Development Best Practices

**Before Committing:**
1. Run integration tests: `python test_integration.py`
2. Validate database: `python validate_database.py --dry-run`
3. Build frontend: `npm run build`
4. Test backend: `cd raptors-backend && ./mvnw test`

**Never commit:**
- `.venv/` - Python virtual environment
- `__pycache__/` - Python bytecode
- `.env` - Environment variables
- `node_modules/` - Node dependencies
- `target/` - Maven build output
- `dist/` - Vite build output
- `logs/` - Log files
- `preprocessing/cache/*` - Except committed CSV files

**Always included:**
- Source code changes
- Test updates
- Cached data files (election results, equipment CSVs)
- Documentation updates

---

---

## 🔧 Development Tools

### Integration Test Suite (`test_integration.py`)

Comprehensive automated testing covering the entire application stack.

```bash
python test_integration.py
```

**Test Categories:**
1. Backend health check
2. Database collections validation (11 collections)
3. Equipment API endpoints (4 tests)
4. Voter registration endpoints (3 tests)
5. EAVS data endpoints (4 tests)
6. Preclearance endpoints (4 tests)
7. Data integrity checks (4 tests)
8. Performance tests (3 tests)
9. Error handling validation (3 tests)
10. GUI data generation validation (4 tests)

**Features:**
- Color-coded output (✓ green = pass, ✗ red = fail)
- Performance validation (<100ms target)
- Automatic endpoint discovery
- Summary statistics with pass rate
- Exit codes: 0 (≥90% pass), 1 (70-89%), 2 (<70%)

**Current Status:** 100% pass rate (37/37 tests)

### Database Validation Tool (`validate_database.py`)

Automated database schema validation and repair tool.

```bash
python validate_database.py --dry-run    # Safe mode - check only
python validate_database.py --auto-fix   # Apply repairs automatically
```

**Validation Checks:**
- **Indexes:** Performance optimization checks
- **Data Types:** String vs numeric consistency
- **Required Fields:** Critical field existence
- **Data Consistency:** Curve lengths, duplicates
- **Collection Sizes:** Expected document ranges

**Features:**
- Dry-run mode for safe inspection
- Auto-fix mode for automatic repairs
- Color-coded issue reporting
- Detailed error messages
- Collection health summaries

---

## 📄 License

Educational project for CSE 416 - Software Engineering at Stony Brook University.

Not for commercial distribution.

### Troubleshooting

**MongoDB not connecting:**
```bash
sudo systemctl status mongod  # Check if running
sudo systemctl start mongod   # Start service
mongosh                       # Test connection
```

**Backend won't start:**
```bash
cd raptors-backend
pkill -9 java                 # Kill any existing instances
./mvnw clean install          # Rebuild
./mvnw spring-boot:run        # Start fresh
```

**Backend port already in use:**
```bash
lsof -i :8080                 # Find process using port
kill -9 <PID>                 # Kill the process
```

**Frontend issues:**
```bash
rm -rf node_modules package-lock.json
npm install  # Reinstall dependencies
npm run dev  # Restart dev server
```

**Data validation:**
```bash
cd preprocessing
python validate_preprocessing.py

# Or comprehensive validation
python validate_database.py --dry-run
```

**Integration tests failing:**
```bash
# Ensure backend is running
curl http://localhost:8080/api/equipment/health

# Run tests
python test_integration.py

# Check specific endpoint
curl http://localhost:8080/api/eavs/MARYLAND/active-voters?year=2020
```

---

## 🎯 Project Status

**Implementation:** ✅ **COMPLETE** - All 55 use cases implemented (30 GUI + 13 Preprocessing + 2 Server)

- ✅ **Frontend:** 30 GUI components with interactive maps, charts, and visualizations
- ✅ **Backend:** 30+ REST API endpoints with Spring Boot and MongoDB
- ✅ **Database:** 26,636+ records across 11 collections with optimized indexes
- ✅ **Data Pipeline:** Fully automated preprocessing (16 scripts, ~30 second runtime)
- ✅ **Testing:** 100% pass rate (37/37 integration tests)
- ✅ **Quality Assurance:** Automated database validation and repair tools
- ✅ **Statistical Analysis:** Non-linear regression and ecological inference models
- ✅ **Documentation:** Comprehensive inline and external documentation

### Testing & Validation

**Integration Test Suite:**
```bash
python test_integration.py
```

Features:
- 37 comprehensive tests covering all API endpoints
- Database collection validation
- Performance testing (<100ms target)
- Error handling validation
- Data integrity checks
- Color-coded output with pass/fail tracking

**Database Validation:**
```bash
python validate_database.py --dry-run    # Check only
python validate_database.py --auto-fix   # Apply fixes
```

Features:
- Index performance checks
- Data type consistency validation
- Required field verification
- Collection size validation
- Automatic repair capabilities

---

## 📝 Notes

**Technical Capabilities:**
- **Statistical Analysis:** Power regression curves (y = a × x^b) for correlation analysis
- **Ecological Inference:** King's EI model implementation for demographic voting patterns
- **Geographic Processing:** Native GeoJSON support with Leaflet for interactive maps
- **Real-time API:** Sub-100ms response times with optimized MongoDB queries
- **Data Quality:** Automated completeness scoring (0-1 scale) for missing data detection
- **Equipment Scoring:** Multi-factor quality metrics considering age, certification, and performance

**Data Sources & Limitations:**
- EAVS survey data (2016-2024) with some gaps due to state reporting
- MIT Election Lab presidential results (2000-2024) for all counties
- Census Bureau CVAP demographics (2023 ACS 1-year estimates)
- VerifiedVoting equipment specifications (2024 snapshot)
- Voter registration files available for detailed states only (state law restrictions)
- Ecological inference models use census block-level aggregated data

**Performance & Optimization:**
- API endpoints optimized for <100ms response time with MongoDB indexing
- Frontend components use React.memo and useMemo for efficient re-rendering
- Data pipeline caches downloaded files to avoid redundant API calls
- Pagination implemented for large datasets (voter lists, equipment tables)

---

## ❓ FAQ

**Q: Do I need to download data manually?**  
A: No - all data files are committed to the repository. Just clone and run the preprocessing script.

**Q: How long does preprocessing take?**  
A: ~30 seconds total. All data files are cached for instant loading.

**Q: Can I use different states?**  
A: Yes - edit `preprocessing/config.json` and modify state lists in the frontend code.

**Q: Is MongoDB required?**  
A: Yes - MongoDB provides native GeoJSON support needed for map visualizations.

**Q: What Python version do I need?**  
A: Python 3.10+ (tested with 3.12)

**Q: How do I run the tests?**  
A: Run `python test_integration.py` in the root directory. Requires backend to be running.

**Q: What's the difference between mock and real data?**  
A: Mock data allows frontend development without backend/database. Set `USE_MOCKS = false` in `src/data/api.ts` for real data.

**Q: How many API endpoints are there?**  
A: 30+ endpoints across 6 controllers (EAVS, Equipment, Registration, Preclearance, Comparison, Data).

**Q: What's ecological inference?**  
A: Statistical method to analyze voting patterns by demographic groups. Our implementation models equipment quality and rejection rates across six demographic categories.

---

---

**Built with ❤️ by the Raptors Team for CSE 416**

# 🗳️ Raptors Voting Analysis

[![CSE 416](https://img.shields.io/badge/CSE-416-blue)](https://www.stonybrook.edu)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![Node.js](https://img.shields.io/badge/node.js-18%2B-green.svg)](https://nodejs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.6-green.svg)](https://spring.io/projects/spring-boot)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green.svg)](https://www.mongodb.com/)

Interactive web application for analyzing and visualizing election administration data, voter registration trends, and voting equipment quality across the United States. Built for **CSE 416 - Software Engineering**.

**Full-stack application featuring:**
- 🎨 **React Frontend** - Interactive maps, charts, and data visualizations
- ⚙️ **Spring Boot Backend** - RESTful API with MongoDB integration
- 🗄️ **MongoDB Database** - 20,840+ records of election data
- 🔄 **Automated Pipeline** - Zero-configuration data preprocessing

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
./run_all_preprocessing.sh  # Populates MongoDB (~21 seconds)
cd ..

# Terminal 2 - Start backend
cd raptors-backend
./mvnw clean install
./mvnw spring-boot:run  # Runs on http://localhost:8080

# Terminal 3 - Start frontend
npm install
npm run dev  # Runs on http://localhost:5173
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

## 🔄 Data Pipeline

The data pipeline automatically populates MongoDB with election data from multiple sources.

### Quick Setup

```bash
cd preprocessing
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
./run_all_preprocessing.sh  # Runs all 13 scripts
python validate_preprocessing.py  # Verify results
```

**Runtime:** ~21 seconds | **Status:** Fully automated with cached data files

### Data Sources

**Automated sources:**
- EAVS survey data (2016-2024) from EAC
- State/county boundaries from Census TIGER/Line
- CVAP demographics from Census API
- Felony voting policies (50 states)

**Committed data files:**
- MIT Election Lab results: `countypres_2000-2024.csv` (8.4 MB)
- VerifiedVoting equipment CSVs: 18 files (404 KB)

All data files are cached and committed to the repository for zero-setup deployment.

### Pipeline Details

The pipeline runs 13 automated scripts that:
1. Download geographic boundaries (states and counties)
2. Parse EAVS survey data (2016-2024)
3. Calculate data completeness and quality scores
4. Import voting equipment specifications
5. Fetch demographic data from Census API
6. Collect state felony voting policies

**Total runtime:** ~21 seconds | **Configuration:** Included in `preprocessing/config.json`

For detailed script documentation, see [`preprocessing/README.md`](preprocessing/README.md).

### Database Collections

After running the pipeline, MongoDB contains 20,840+ records:

| Collection | Documents | Description |
|------------|-----------|-------------|
| `boundaryData` | 152 | State & county GeoJSON boundaries |
| `eavsData` | 19,388 | EAVS survey records (2016-2024) |
| `votingEquipmentData` | 1,008 | Equipment specifications and quality metrics |
| `electionResults` | 138 | 2024 Presidential results by county |
| `demographicData` | 104 | CVAP demographic data |
| `felonyVotingData` | 50 | State felony voting policies |

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

```
GET  /api/eavs/states           - EAVS data by state
GET  /api/eavs/states/{abbr}    - EAVS data for specific state
GET  /api/boundaries/states     - State boundary GeoJSON
GET  /api/boundaries/counties   - County boundaries
GET  /api/equipment/quality     - Equipment quality scores
GET  /api/demographics/cvap     - CVAP demographic data
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

**Interactive Maps:**
- State and county choropleth visualizations
- Bubble overlays for voter registration data
- Dynamic filtering by state, year, and data quality

**Data Visualizations:**
- Bar/line charts for voter trends and rejections
- Equipment quality and age tracking
- Registration pattern analysis

**Components:**
- Material-UI (MUI) design system
- Leaflet for interactive mapping
- Recharts for data visualization

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

**Expected Collections:**
- `boundaryData` - Geographic boundaries
- `eavsData` - EAVS survey records
- `votingEquipmentData` - Equipment data
- `electionResults` - Election results
- `demographicData` - CVAP demographics
- `felonyVotingData` - State policies

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
```

---

## 📚 Documentation

### API Reference

**Swagger UI:** http://localhost:8080/swagger-ui.html (when backend running)

**Example API calls:**
```bash
# Get EAVS data for Maryland
curl http://localhost:8080/api/eavs/states/MD

# Get equipment quality scores
curl http://localhost:8080/api/equipment/quality?minScore=0.7
```

### Project Documentation

- **[preprocessing/README.md](preprocessing/README.md)** - Complete data pipeline guide
- **API Endpoints** - Swagger UI at http://localhost:8080/swagger-ui.html
- **Component Docs** - See inline JSDoc comments in `src/` files

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

### Important

**Never commit:**
- `.venv/` - Python virtual environment
- `__pycache__/` - Python bytecode
- `.env` - Environment variables
- `node_modules/` - Node dependencies

**Always included:**
- Source code changes
- Cached data files (already committed)
- Documentation updates

---

---

## � License

Educational project for CSE 416 - Software Engineering at Stony Brook University.

Not for commercial distribution.

### Troubleshooting

**MongoDB not connecting:**
```bash
sudo systemctl status mongod  # Check if running
sudo systemctl start mongod   # Start service
```

**Backend won't start:**
```bash
cd raptors-backend
./mvnw clean install  # Rebuild
```

**Frontend issues:**
```bash
rm -rf node_modules package-lock.json
npm install  # Reinstall dependencies
```

**Data validation:**
```bash
cd preprocessing
python validate_preprocessing.py
```

---

## 🎯 Project Status

- ✅ **Frontend:** React UI with maps, charts, and interactive visualizations
- ✅ **Backend:** Spring Boot REST API with MongoDB integration
- ✅ **Database:** 20,840+ records across 6 collections
- ✅ **Data Pipeline:** Fully automated preprocessing (13 scripts)
- 🚧 **Testing:** In progress
- 🚧 **Deployment:** Planning phase

---

## � Notes

**Data limitations:**
- Voter registration files not publicly available for AR/RI (state law)
- EAVS data has gaps due to state reporting inconsistencies
- Historical data limited to 2016-2024 (biennial survey)

**API keys:**
- Free tier Census and USPS APIs included in `config.json`
- Private educational repository only - not for public distribution

---

## ❓ FAQ

**Q: Do I need to download data manually?**  
A: No - all data files are committed to the repository. Just clone and run the preprocessing script.

**Q: How long does preprocessing take?**  
A: ~21 seconds. All data files are cached for instant loading.

**Q: Can I use different states?**  
A: Yes - edit `preprocessing/config.json` and modify state lists in the frontend code.

**Q: Is MongoDB required?**  
A: Yes - MongoDB provides native GeoJSON support needed for map visualizations.

**Q: What Python version do I need?**  
A: Python 3.10+ (tested with 3.12)

---

---

**Built with ❤️ by the Raptors Team for CSE 416**

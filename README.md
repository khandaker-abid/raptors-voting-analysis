<div align="center">

<img src="public/raptors+compass.png" alt="" height="96" />

# Raptors Voting Analysis

Full-stack election data visualization platform for analyzing voting patterns,<br>equipment quality, and Voting Rights Act compliance.

[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-6db33f?style=flat-square&logo=spring&logoColor=white)](https://spring.io/projects/spring-boot)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47a248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.12-3776ab?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)

[Features](#features) · [Quick Start](#quick-start) · [Architecture](#architecture) · [API](#api-reference)

</div>

## Overview

Interactive web application built for **CSE 416 (Software Engineering)** at Stony Brook University. Visualizes U.S. election administration data including EAVS surveys (2016-2024), voting equipment specs, and VRA Section 2 preclearance assessments.

## Features

- **Interactive Maps** — State/county choropleths with census block voter overlays
- **Equipment Analysis** — Voting machine types, age, and quality metrics (2016-2024)
- **EAVS Insights** — Active voters, provisional ballots, pollbook deletions, mail rejections
- **VRA Compliance** — Gingles factors, ecological inference, demographic disparity detection
- **Data Export** — Download charts, tables, and analysis results

## Quick Start

> [!TIP]
> Run the frontend with mock data instantly—no database setup required.

**Frontend only:**

```bash
npm install && npm run dev
```

**Full stack** (requires Node.js 22+, Java 17+, MongoDB 7.0+, Python 3.12+):

```bash
# Start MongoDB
sudo systemctl start mongod

# Run preprocessing (~10 min first run, ~2 min cached)
cd preprocessing
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && ./run_all_preprocessing.sh

# Start backend (new terminal)
cd backend && ./mvnw spring-boot:run

# Start frontend (new terminal)
npm install && npm run dev
```

Open http://localhost:5173. Toggle `USE_MOCKS` in `src/data/api.ts` for real data.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  React + Vite   │────▶│  Spring Boot    │────▶│    MongoDB      │
│  Material-UI    │     │  REST API       │     │  26k+ records   │
│  Leaflet/Charts │     │  Java 17        │     │  GeoJSON        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │ Python Pipeline │
                        │ 21 ETL stages   │
                        └─────────────────┘
```

### Project Structure

```
├── src/                    # React frontend (19 components, 14 pages)
├── backend/                # Spring Boot API (8 controllers, 30+ endpoints)
├── preprocessing/          # Python ETL pipeline (21 stages)
└── public/                 # Static GeoJSON boundaries
```

### Data Sources

| Source | Data |
|--------|------|
| [EAC EAVS](https://www.eac.gov/research-and-data/datasets-codebooks-and-surveys) | Election administration surveys (2016-2024) |
| [Census TIGER/Line](https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html) | State/county boundaries |
| [MIT Election Lab](https://electionlab.mit.edu/data) | Presidential results (2000-2024) |
| [VerifiedVoting](https://verifiedvoting.org/) | Equipment specifications |

## API Reference

Base URL: `http://localhost:8080/api`

| Category | Endpoints |
|----------|-----------|
| EAVS | `/eavs/{state}/active-voters`, `/provisional-ballots`, `/mail-rejections` |
| Equipment | `/equipment/{state}/types`, `/history/{state}`, `/age/all-states` |
| Registration | `/registration/trends/{state}`, `/blocks/{state}`, `/voters/{state}/{county}` |
| Preclearance | `/preclearance/gingles/{state}`, `/ei-equipment/{state}`, `/ei-rejected/{state}` |

## Testing

```bash
python test_integration.py          # 37 integration tests
npm test                            # Frontend unit tests
python preprocessing/validate_preprocessing.py
```

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, TypeScript, Vite, Material-UI, Leaflet, Recharts |
| Backend | Spring Boot 3.5, Java 17, Spring Data MongoDB |
| Database | MongoDB 7.0 (GeoJSON) |
| Pipeline | Python 3.12, Pandas, PyMongo |

## License

MIT

---

<div align="center">
<sub>Built for CSE 416 — Stony Brook University</sub>
</div>

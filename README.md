# Raptors Voting Analysis

Interactive web app for analyzing and visualizing election administration and voter
registration data (EAVS, voting equipment, registration trends). Built for **CSE 416**.

### Languages
- **Java** — Backend REST API serving EAVS/registration/equipment data
- **Python** — ETL/preprocessing: clean EAVS CSVs, compute percentages, sort orders,
  combine year series, block centroids & dominant party
- **TypeScript** — Frontend logic, types, API client, React components
- **HTML** — SPA shell (Vite)
- **CSS** — Styling via MUI + small utilities

### Libraries
- **React** — UI components, routing, state
- **Recharts / Chart.js** — Bar & line charts (voters, deletions, rejections, equipment history, trends)
- **Leaflet (+ React-Leaflet)** — Maps: state/ county choropleths, bubble overlays
- **MUI** — Layout, tables, accordions, tabs, theming

### Frameworks
- **Spring Boot** - Fast, production-ready REST APIs with auto-config and a huge ecosystem.

### Databases
- **PostgreSQL + PostGIS (star-ish schema)** -  Robust SQL + spatial analytics; clean, fast per-county/year aggregates.

### 1) Install
```bash
# Node 18+ (or 20+) recommended
npm install
# Dev server
npm run dev
```

### run spring server
``` cd raptors-backend
./mvnw spring-boot:run
```

# GUI

| Number | Checkbox |
|--------|----------|
| 1      | - [ ]      |
| 2      | - [ ]      |
| 3      | - [ ]      |
| 4      | - [ ]      |
| 5      | - [ ]      |
| 6      | - [ ]      |
| 7      | - [ ]      |
| 8      | - [ ]      |
| 9      | - [ ]      |
| 10     | - [ ]      |
| 11     | - [ ]      |
| 12     | - [ ]      |
| 13     | - [ ]      |
| 14     | - [ ]      |
| 15     | - [ ]      |
| 16     | - [ ]      |
| 17     | - [ ]      |
| 18     | - [ ]      |
| 19     | - [ ]      |
| 20     | - [ ]      |
| 21     | - [ ]      |
| 22     | - [ ]      |
| 23     | - [ ]      |
| 24     | - [ ]      |
| 25     | - [ ]      |
| 26     | - [ ]      |
| 27     | - [ ]      |

# GeoVISTA — Geospatial Volumetric Intelligence & Spatial Topology Architecture

### Smart India Hackathon 2026 — Software Edition
**Problem Statement ID:** PS26011  
**Problem Statement Title:** "3D ULPIN Generation and Vertical Property Mapping System"  
**Ministry / Organization:** Ministry of Rural Development — Department of Land Resources (DoLR)  
**Theme:** Smart Automation  

---

## 🌐 Overview

**GeoVISTA** is a 3D urban cadastral visualization and property-intelligence platform designed to extend traditional 2D land records into a **three-dimensional property representation**.

Traditional cadastral systems primarily describe property using:

* Parcel boundaries
* Ownership information
* Land area
* 2D coordinates

GeoVISTA extends this model by introducing the **vertical dimension (Z-axis)**, enabling buildings, floors and spatial units to be represented in a 3D environment.

The platform combines **GIS parcel data, building footprints, elevation information, 3D visualization and property metadata** into a unified interface.

### Core Concept

```text
2D Parcel / GIS Data
        +
Building Footprint
        +
Building Height / Elevation
        +
Floor / Vertical Information
        ↓
3D Property Representation
        ↓
Vertical Delineation
        ↓
Property / Unit Intelligence
        ↓
3D ULPIN-ready Data Model
```

---

# 🎯 Objectives

GeoVISTA is designed around the following objectives:

* Transform conventional 2D cadastral information into a **3D spatial representation**
* Visualize buildings and property boundaries in an interactive 3D environment
* Represent the **vertical extent of properties**
* Integrate building-height and elevation datasets
* Provide a foundation for **3D ULPIN / vertical property identification**
* Support public-facing and administrative workflows
* Enable future integration with authoritative cadastral and land-record systems
* Provide scalable storage for large geospatial datasets
* Improve spatial understanding of dense urban properties

---

# ✨ Key Features

## 🏙️ 3D Urban Cadastre

Interactive visualization of urban buildings and cadastral information in a 3D environment.

The viewer is designed to support:

* 3D buildings
* Building footprints
* Building heights
* Property boundaries
* Terrain/elevation
* Spatial navigation
* Property selection

---

## 🧭 Z-Axis Property Representation

Unlike conventional 2D cadastral systems, GeoVISTA considers the vertical dimension of a property.

```text
             Z
             ↑
             │
        ┌───────────┐
        │  Floor 3  │
        ├───────────┤
        │  Floor 2  │
        ├───────────┤
        │  Floor 1  │
        ├───────────┤
        │   Ground  │
        └───────────┘
             │
             └────────────→ X / Y
```

This creates the foundation for identifying:

* Individual buildings
* Floors
* Vertical units
* Building-level property information
* Future 3D parcel/property identifiers

---

## 🗺️ Bhopal Spatial Dataset

The current prototype uses **Bhopal** as the demonstration area.

The project includes workflows for processing:

* Building footprints
* Building-height information
* Bhopal boundary data
* Ward boundaries
* Digital elevation / terrain data
* Microsoft building data
* Derived 3D building information

Large geospatial datasets are intentionally kept outside the Git repository and can be provided through runtime storage.

---

## ☁️ Azure Runtime Dataset Integration

Large geospatial files can be expensive to store and version directly in Git.

GeoVISTA therefore supports an architecture where large datasets are stored in **Azure Blob Storage** and loaded by the application when required.

```text
                 Azure Blob Storage
                        │
             ┌──────────┼──────────┐
             │          │          │
        Buildings   Boundaries   Terrain
             │          │          │
             └──────────┼──────────┘
                        ↓
                  GeoVISTA Backend
                        ↓
                  Frontend / Viewer
                        ↓
                 Interactive 3D Map
```

This approach keeps the Git repository lightweight while allowing the application to work with larger spatial datasets.

---

# 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │      User / Officer  │
                         └──────────┬───────────┘
                                    │
                                    ↓
                         ┌──────────────────────┐
                         │   GeoVISTA Frontend  │
                         │   React + TypeScript  │
                         └──────────┬───────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ↓                  ↓                  ↓
          3D Visualization     Property UI       Guided Assistant
                 │                  │                  │
                 └──────────────────┼──────────────────┘
                                    │
                                    ↓
                         ┌──────────────────────┐
                         │    Node.js Backend   │
                         │       REST API       │
                         └──────────┬───────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ↓                  ↓                  ↓
          Spatial Datasets      AI / LLM API     Runtime Services
                 │
                 ↓
         ┌─────────────────────┐
         │  Azure Blob Storage │
         └─────────────────────┘
```

---

# 🧩 Technology Stack

| Layer                         | Technology                    |
| ----------------------------- | ----------------------------- |
| Frontend                      | React                         |
| Language                      | TypeScript                    |
| Build Tool                    | Vite                          |
| 3D / Geospatial Visualization | CesiumJS                      |
| Backend                       | Node.js                       |
| API                           | REST                          |
| AI Assistant                  | Groq API                      |
| Spatial Processing            | Python                        |
| Geospatial Formats            | GeoJSON, TIFF, CSV            |
| Cloud Storage                 | Azure Blob Storage            |
| Version Control               | Git + GitHub                  |
| Styling                       | CSS                           |
| Icons / UI                    | Lucide / custom UI components |

---

# 📁 Project Structure

```text
z-axis/
│
├── backend/
│   ├── src/
│   │   ├── config.js
│   │   └── routes/
│   │       └── ai.js
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AccountPanels.tsx
│   │   │   ├── CityCadastreWorkspace.tsx
│   │   │   ├── EvidenceList.tsx
│   │   │   ├── GuidedAssistant.tsx
│   │   │   ├── IssueReportModal.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── Viewer3D.tsx
│   │   │   ├── Viewer3DV2.tsx
│   │   │   └── bhopalDataset.worker.ts
│   │   │
│   │   ├── context/
│   │   │   └── UISettingsContext.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── OfficerPortal.tsx
│   │   │   ├── PublicPortal.tsx
│   │   │   └── ScenariosPage.tsx
│   │   │
│   │   └── services/
│   │       └── api.ts
│   │
│   └── index.html
│
├── scripts/
│   ├── add_building_elevation.py
│   ├── add_microsoft_building_height.py
│   ├── check_osm_building_heights.py
│   ├── clip_bhopal_buildings.py
│   ├── clip_bhopal_dem.py
│   ├── convert_dem.py
│   ├── create_3d_buildings.py
│   ├── dissolve_bhopal_boundary.py
│   ├── download_bhopal_building_height.py
│   ├── download_bhopal_tiles.py
│   ├── download_dem.py
│   ├── find_bhopal_tiles.py
│   ├── inspect_lidar_zip.py
│   ├── profile_bhopal_buildings.py
│   └── upload-azure-data.ps1
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── map/
│   │   ├── property/
│   │   └── search/
│   │
│   ├── data/
│   ├── pages/
│   └── types/
│
├── public/
├── docs/
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

---

# 🔄 Geospatial Data Processing Workflow

The project contains multiple Python utilities for preparing spatial data.

The general workflow is:

```text
Raw Spatial Data
       │
       ↓
Data Inspection
       │
       ↓
Bhopal Boundary Extraction
       │
       ↓
Building Footprint Processing
       │
       ↓
Building Height Integration
       │
       ↓
DEM / Elevation Processing
       │
       ↓
Spatial Clipping
       │
       ↓
3D Building Generation
       │
       ↓
GeoJSON / Runtime Dataset
       │
       ↓
Azure Blob Storage
       │
       ↓
GeoVISTA 3D Viewer
```

---

# 🏢 3D Building Generation

Building footprints can be combined with height/elevation information to create a three-dimensional representation.

Conceptually:

```text
Building Footprint
        +
Height / Elevation
        ↓
Extrusion
        ↓
3D Building
```

For a building footprint:

```text
Polygon(X, Y)
      +
Height(Z)
      ↓
Polygon(X, Y, Z)
```

The resulting geometry can then be visualized inside the 3D viewer.

---

# 🗃️ Runtime Dataset Architecture

The prototype is designed so that large datasets do not need to be committed directly to Git.

Example runtime structure:

```text
3d-data/
│
├── buildings/
│   └── bhopal_buildings_3d.geojson
│
├── boundaries/
│   ├── bhopal_boundary.geojson
│   └── bhopal_wards.geojson
│
└── terrain/
    └── bhopal_dem_clipped.tif
```

These datasets can be uploaded to Azure Blob Storage using the provided upload workflow.

---

# 🤖 Guided Assistant

GeoVISTA includes an optional AI-powered guided assistant.

The assistant can be used as an interface layer for helping users understand and interact with the platform.

The backend keeps the provider API key server-side.

```text
Frontend
   │
   │ User Query
   ↓
Node.js API
   │
   ↓
LLM Provider
   │
   ↓
Response
   │
   ↓
Frontend Assistant
```

### Security Principle

Provider API keys should **never** be placed inside frontend source code.

Use the local backend environment file instead.

---

# 🔐 Environment Configuration

Create a local environment file for the backend.

Example:

```env
PORT=8000
HOST=0.0.0.0
CORS_ORIGINS=http://localhost:5173
APP_ENV=development

GROQ_API_KEY=your_api_key_here
GROQ_MODEL=your_model_here
```

The repository contains an `.env.example` template.

### Important

Never commit:

```text
.env
.env.local
.env.production
```

or any file containing real API keys, access tokens or cloud credentials.

The repository uses GitHub push protection to help prevent accidental secret exposure.

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/harsh5ingh/z-axis.git
cd z-axis
```

---

## 2. Install Dependencies

Install the root/frontend dependencies:

```bash
npm install
```

If working with the backend separately:

```bash
cd backend
npm install
```

---

## 3. Configure Environment Variables

Create:

```text
backend/.env
```

using:

```text
backend/.env.example
```

as the template.

Add your own local API credentials where required.

---

## 4. Start the Application

Run the frontend development server:

```bash
npm run dev
```

The development server will normally be available at:

```text
http://localhost:5173
```

Start the backend using the project's configured Node.js scripts.

---

# 🗺️ 3D Viewer Workflow

A typical user interaction follows this flow:

```text
Open GeoVISTA
      ↓
Select / Search Property
      ↓
Load Spatial Data
      ↓
Display Building / Parcel
      ↓
Inspect 3D Geometry
      ↓
View Property Information
      ↓
Inspect Vertical / Z-Axis Information
      ↓
Use Additional Property Tools
```

---

# 👥 Intended Users

GeoVISTA can support multiple classes of users.

### 🧑‍💼 Government / Administrative Officers

Potential workflows include:

* Property inspection
* Spatial verification
* Building assessment
* Cadastral data visualization
* Identification of vertical structures
* Dataset validation

### 👤 Citizens / Public Users

Potential workflows include:

* Searching properties
* Viewing spatial information
* Understanding building/property structure
* Accessing property-related information
* Reporting issues

### 🧑‍💻 GIS / Technical Teams

Potential workflows include:

* Dataset processing
* Spatial analysis
* Building-height integration
* 3D data generation
* Data validation
* Cloud dataset management

---

# 📊 Data Pipeline

The platform follows a modular spatial-data pipeline:

```text
                    DATA SOURCES
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       GIS Data      Building Data   Elevation
          │              │              │
          └──────────────┼──────────────┘
                         ↓
                Data Processing
                         ↓
                Spatial Validation
                         ↓
              3D Dataset Generation
                         ↓
                 Cloud Storage
                         ↓
                  Backend API
                         ↓
                GeoVISTA Frontend
                         ↓
                  Cesium Viewer
                         ↓
             3D Property Intelligence
```

---

# 🧪 Current Prototype Scope

The current implementation focuses on establishing the technical foundation for:

* Bhopal-based 3D visualization
* Building-height integration
* 3D building generation
* Terrain/elevation integration
* Azure-backed spatial datasets
* Interactive cadastral workspace
* Public and officer-oriented interfaces
* Guided AI assistance
* A future-ready 3D property data model

The prototype is intended to demonstrate the workflow and architecture rather than represent a production cadastral database.

---

# 🔮 Future Scope

The platform can be extended with:

### 1. True 3D ULPIN Generation

Generate a persistent identifier based on:

```text
Parcel ID
+
Building ID
+
Floor ID
+
Unit ID
+
Vertical Extent
+
Spatial Reference
```

---

### 2. Floor-Level Cadastre

Support:

```text
Building
   │
   ├── Floor 1
   │     ├── Unit 101
   │     └── Unit 102
   │
   ├── Floor 2
   │     ├── Unit 201
   │     └── Unit 202
   │
   └── Floor 3
         ├── Unit 301
         └── Unit 302
```

---

### 3. Authoritative Data Integration

Future versions can integrate with authoritative:

* Cadastral databases
* Municipal property records
* Survey data
* Building approvals
* Land records
* Property tax systems

---

### 4. Advanced 3D Spatial Analysis

Possible capabilities include:

* Vertical overlap detection
* Property-volume calculations
* Building-height validation
* Floor-area calculations
* 3D intersection analysis
* Spatial conflict detection
* Change detection

---

### 5. Production Cloud Architecture

A production deployment could evolve toward:

```text
             Web / Mobile Client
                     │
                     ↓
               API Gateway
                     │
          ┌──────────┴──────────┐
          ↓                     ↓
     Application API       Authentication
          │
          ↓
    Spatial Data Services
          │
    ┌─────┼──────────┐
    ↓     ↓          ↓
PostGIS Azure Blob  DEM/3D Data
    │
    ↓
Spatial Analytics
```

---

# 🔒 Security Considerations

Security is an important part of the platform because cadastral and property information can become sensitive when combined with personally identifiable information.

The current architecture follows these principles:

* API keys remain server-side
* `.env` files are excluded from version control
* Large datasets are separated from application source code
* GitHub secret scanning / push protection is enabled
* Runtime cloud credentials should not be committed
* Production deployments should use managed secrets
* Authentication and authorization should be enforced before exposing sensitive property information

---

# 📌 Repository Workflow

The project uses Git branches for development.

Recommended workflow:

```text
main
 │
 ├── feature/<feature-name>
 │
 ├── fix/<issue-name>
 │
 └── experiment/<experiment-name>
```

Changes should be developed on a feature branch and merged into `main` through a Pull Request.

---

# 🤝 Contributing

Contributions are welcome.

### Basic workflow

```bash
git checkout main
git pull origin main

git checkout -b feature/my-feature

# Make changes

git add .
git commit -m "feat: describe the change"

git push -u origin feature/my-feature
```

Then create a Pull Request against `main`.

### Commit Convention

Recommended prefixes:

```text
feat:     New functionality
fix:      Bug fix
docs:     Documentation
refactor: Code restructuring
style:    UI / formatting changes
test:     Tests
chore:    Maintenance
```

Example:

```text
feat: add floor-level property selection
```

---

# ⚠️ Data & Prototype Disclaimer

GeoVISTA is a **Smart India Hackathon prototype**.

The spatial datasets used in the demonstration are intended for development, visualization and proof-of-concept purposes.

They should not be interpreted as authoritative legal cadastral records unless independently validated and provided by the appropriate competent authority.

---

# 📄 License

This project is licensed under the **MIT License**.

See [`LICENSE`](./LICENSE) for details.

---

# 👨‍💻 Project

**GeoVISTA — 3D Urban Cadastre & Z-Axis Property Intelligence**

Built as a **Smart India Hackathon 2026 prototype** with a focus on 3D cadastral visualization, spatial data integration and vertical property representation.

---

## ⭐ Vision

> **From 2D parcels to intelligent 3D property.**

GeoVISTA aims to provide the technical foundation for representing urban property not only by **where it is**, but also by **where it exists vertically**.

```text
             3D PROPERTY
                  │
       ┌──────────┼──────────┐
       │          │          │
       X          Y          Z
    Location   Location   Vertical
                          Extent
       │          │          │
       └──────────┼──────────┘
                  ↓
          3D Property Identity
                  ↓
           Future 3D ULPIN
```

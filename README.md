# ⚽ FOCCACIA - Football Complete Clubs API and Chelas Internet Application

[![Node.js](https://img.shields.io/badge/Node.js-5.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-blue.svg)](https://expressjs.com/)
[![ElasticSearch](https://img.shields.io/badge/ElasticSearch-8.15-yellow.svg)](https://www.elastic.co/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

**FOCCACIA** is a sophisticated web application built with **Node.js** and **Express** that serves as a centralized hub for football enthusiasts to manage their "Best XI" squads. It leverages real-world data from the **Football Data API (v4)** and provides both a responsive **Web Interface** (SSR) and a robust **RESTful API**.

---

## 🚀 Key Features

- **Real-time Data Integration**: Seamlessly fetches competitions, teams, and player data from the official Football Data API.
- **Squad Management**: Create and customize "Best XI" groups with a strict 11-player validation logic.
- **Dual Presentation Layer**:
  - **Web Site**: Interactive UI built with Handlebars and Bootstrap, featuring secure session-based authentication.
  - **REST API**: Full-featured JSON API protected by Bearer Token authentication for programmatic access.
- **Interactive Documentation**: Integrated **Swagger UI** for exploring and testing API endpoints.
- **Persistence**: High-performance data storage using **ElasticSearch** with custom mappings for nested player objects.
- **Automated Seeding**: Quick-start script to populate the environment with test data.

---

## 🏗️ Architecture & Engineering Standards

The project follows a rigorous **3-Tier Architecture** to ensure separation of concerns, maintainability, and scalability.

### Technical Stack
- **Backend**: Node.js (ES Modules) + Express.js
- **View Engine**: Handlebars (hbs) for Server-Side Rendering (SSR)
- **Frontend**: Bootstrap 5 + Vanilla CSS
- **Database**: ElasticSearch (via Docker)
- **Authentication**: Passport.js (Local Strategy & Bearer Token)
- **Testing**: Mocha
- **Documentation**: OpenAPI 3.0 (Swagger)

### Design Patterns
- ✅ **Dependency Injection (DI)**: All layers (Data, Service, Web) are initialized using factory functions, allowing for easy swapping of implementations (e.g., Mock vs. Real Data).
- ✅ **Repository Pattern**: Data access is abstracted, isolating the business logic from persistence details.
- ✅ **Service Layer**: Centralized business logic and domain validation (e.g., ensuring a player belongs to the correct competition/season).
- ✅ **Centralized Error Handling**: Internal domain errors are systematically mapped to appropriate HTTP status codes.

---

## 📂 Project Structure

```text
foccacia/
├── 📄 foccacia-server.mjs      # Application Entry Point & DI Orchestrator
├── 📁 web/                     # Presentation Layer
│   ├── 📁 api/                 # REST API Controllers (JSON)
│   └── 📁 site/                # Web Interface Controllers & Views (HBS)
├── 📁 services/                # Business Logic Layer (Domain Rules)
├── 📁 data/                    # Data Access Layer
│   ├── 📁 elastic/             # ElasticSearch Implementation
│   ├── 📁 mem/                 # Football API Client
│   └── 📁 mock/                # Mock Data for Development/Testing
├── 📁 commons/                 # Shared Utilities & Error Definitions
├── 📁 test/                    # Automated Test Suite (Mocha)
└── 📁 docs/                    # OpenAPI Specs & Sample Requests
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Node.js** (LTS version)
- **Docker & Docker Compose**

### 2. Installation
```bash
git clone https://github.com/isel-leic-ipw/isel-leic-ipw-pi-2526i-foccacia-leic2526i-ipw33d-g01.git
cd foccacia
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
ELASTIC_URL=http://localhost:9200
API_KEY=your_football_data_api_key
```

### 4. Infrastructure & Data Seeding
Start ElasticSearch and initialize the database:
```bash
docker-compose up -d
# Wait a few seconds for ElasticSearch to be ready, then:
npm run populate
```

### 5. Run the Application
```bash
npm start
```
The application will be available at `http://localhost:3000`.

---

## 📡 API & Documentation

| Resource | URL |
| :--- | :--- |
| **Web Interface** | [http://localhost:3000/site](http://localhost:3000/site) |
| **API Documentation** | [http://localhost:3000/api-doc](http://localhost:3000/api-doc) |
| **REST API Base** | [http://localhost:3000/api](http://localhost:3000/api) |

### Sample API Request (Create Group)
```bash
curl -X POST http://localhost:3000/api/groups \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "EPL Legends",
    "description": "Best players from 2024",
    "competition": "PL",
    "year": 2024
  }'
```

---

## 🧪 Testing

The project includes an extensive suite of automated tests covering all service layers.
```bash
npm test
```
**Test Coverage:**
- User Authentication & Management
- Group CRUD Operations
- Squad Validation (11-player limit, duplicate checks)
- External API Data Mapping

---

## 👥 Authors

- **Yorky Reyes** ([@yorky47](https://github.com/yorky47))
- **Victor Gorincioi** ([@victorgorincioi](https://github.com/victorgorincioi))
- **Martim Monteiro** ([@MartimMonteiroZork](https://github.com/MartimMonteiroZork))

**Institution:** ISEL - Instituto Superior de Engenharia de Lisboa  
**Course:** Introduction to Web Programming (IPW) - 2025/2026

---

## 📄 License

This project is licensed under the **ISC License**. Created for academic purposes.

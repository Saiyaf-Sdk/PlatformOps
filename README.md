# PlatformOps — Internal Developer Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#testing)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

**PlatformOps** is an Internal Developer Platform (IDP) designed to streamline service delivery for engineering teams. It provides a centralized hub to register applications, promote services across environments (Development → Staging → Production), trigger deployment pipelines, triage incidents, and maintain an immutable audit trail.

---

## 1. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS, Lucide Icons, Framer Motion |
| **Backend** | Java 21, Spring Boot 3.4.5, Maven, Spring Security (JWT + BCrypt), Spring Data JPA, Flyway |
| **Database** | PostgreSQL 15+ (Production/Local), H2 In-Memory (Automated Integration Tests) |
| **Containerization** | Docker (Multi-stage builds for API and Frontend) |
| **API Documentation** | OpenAPI 3.0, Swagger UI (`/swagger-ui.html`) |

---

## 2. Architecture Overview

```
                               ┌──────────────────────────────────────────────┐
                               │                 User Browser                 │
                               └──────────────────────┬───────────────────────┘
                                                      │ HTTP / WebSocket (SSE)
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │          Frontend Client (React/Vite)        │
                               │          Port: 5173 (Dev) / 80 (Docker)      │
                               └──────────────────────┬───────────────────────┘
                                                      │ REST API / SSE
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │         Backend API (Spring Boot 3)          │
                               │                   Port: 8081                 │
                               ├──────────────────────┬───────────────────────┤
                               │ • JWT Authentication │ • Simulated Pipelines │
                               │ • RBAC Authorization │ • Event Stream (SSE)  │
                               │ • Service Registry   │ • Audit Logger        │
                               └──────────┬───────────────────────────┬───────┘
                                          │                           │
                                          ▼                           ▼
                        ┌───────────────────────────┐   ┌───────────────────────────┐
                        │   PostgreSQL Database     │   │   In-Memory Event Bus     │
                        │        Port: 5432         │   │   (Live Updates / SSE)    │
                        └───────────────────────────┘   └───────────────────────────┘
```

---

## 3. Prerequisites

Ensure the following tools are installed on your workstation:

- **Java Development Kit (JDK)**: Version 21 (Eclipse Temurin or Oracle JDK)
- **Node.js**: Version 20.x or 22.x LTS (`npm` v10+)
- **PostgreSQL**: Version 15+ (or Docker equivalent)
- **Docker**: Version 24+ (Docker Desktop)
- **Git**: Version 2.40+

---

## 4. Local Setup

### Step 1: PostgreSQL Setup
Create the local PostgreSQL database and user:

```sql
CREATE DATABASE platformops;
CREATE USER platformops WITH ENCRYPTED PASSWORD 'platformops';
GRANT ALL PRIVILEGES ON DATABASE platformops TO platformops;
```

### Step 2: Backend Setup (Spring Boot)
Configure your environment using the provided template:

```bash
cd Backend
# Copy example environment configuration
cp .env.example .env

# Run using the Maven wrapper
./mvnw.cmd spring-boot:run     # Windows
# or: ./mvnw spring-boot:run   # Linux/macOS
```

- **Backend API**: `http://localhost:8081`
- **Swagger Documentation**: `http://localhost:8081/swagger-ui.html`
- **Actuator Health Probe**: `http://localhost:8081/actuator/health`

### Step 3: Frontend Setup (React + Vite)
In a separate terminal window:

```bash
cd Frontend
# Copy example environment configuration
cp .env.example .env

# Install dependencies and start development server
npm install
npm run dev
```

- **Frontend Application**: `http://localhost:5173`

---

## 5. Docker Setup

PlatformOps includes standalone multi-stage Dockerfiles for both services.

### Build Backend Image
```bash
docker build -t platformops-api:latest -f Backend/Dockerfile Backend/
```

### Build Frontend Image
```bash
docker build -t platformops-web:latest -f Frontend/Dockerfile Frontend/
```

### Run Containers Manually
```bash
# Run Backend API
docker run -d --name platformops-api \
  -p 8081:8081 \
  -e DB_URL=jdbc:postgresql://host.docker.internal:5432/platformops \
  -e DB_USERNAME=platformops \
  -e DB_PASSWORD=platformops \
  platformops-api:latest

# Run Frontend Web Server
docker run -d --name platformops-web \
  -p 80:80 \
  platformops-web:latest
```

---

## 6. Environment Variables

The project uses `.env` files for runtime configuration. Default templates are provided at [`.env.example`](.env.example), [`Backend/.env.example`](Backend/.env.example), and [`Frontend/.env.example`](Frontend/.env.example).

| Variable | Target | Default | Description |
|---|---|---|---|
| `DB_URL` | Backend | `jdbc:postgresql://localhost:5432/platformops` | JDBC connection string |
| `DB_USERNAME` | Backend | `platformops` | Database username |
| `DB_PASSWORD` | Backend | `platformops` | Database password |
| `PORT` | Backend | `8081` | Spring Boot HTTP server port |
| `JWT_SECRET` | Backend | *(Base64 string)* | 256-bit HMAC secret key for JWT signing |
| `JWT_ACCESS_TTL` | Backend | `PT15M` | Access token lifespan (15 minutes) |
| `JWT_REFRESH_TTL` | Backend | `P7D` | Refresh token lifespan (7 days) |
| `CORS_ALLOWED_ORIGINS` | Backend | `http://localhost:5173,...` | Allowed CORS origins for frontend clients |
| `SEED_DEMO_DATA` | Backend | `true` | Seeds initial applications, users, and incidents |
| `VITE_API_URL` | Frontend | `http://localhost:8081/api/v1` | Base URL of the backend REST API |
| `VITE_HIDE_DEMO` | Frontend | `false` | When true, hides demo credentials on login screen |

---

## 7. Project Structure

```
PlatformOps/
├── .github/
│   └── pull_request_template.md    # Pull Request checklist and review template
├── .gitignore                      # Root Git ignore rules (Frontend, Backend, IDEs)
├── .env.example                    # Root full-stack environment variables template
├── CONTRIBUTING.md                 # Two-member Git & GitHub development workflow
├── README.md                       # Main project documentation
├── Backend/
│   ├── .dockerignore               # Docker build exclusions for Backend
│   ├── .env.example                # Backend environment template
│   ├── .gitignore                  # Backend-specific ignore rules
│   ├── Dockerfile                  # Multi-stage build for Spring Boot application
│   ├── pom.xml                     # Maven project descriptor and dependencies
│   ├── mvnw / mvnw.cmd             # Maven Wrapper scripts
│   └── src/
│       ├── main/java/com/platformops/
│       │   ├── app/                # Application registry domain and endpoints
│       │   ├── audit/              # Audit event logging service
│       │   ├── auth/               # Authentication and token management
│       │   ├── config/             # Security, OpenAPI, and application config
│       │   ├── dashboard/          # Aggregated dashboard metrics
│       │   ├── deployment/         # Pipeline runner and deployment state engine
│       │   ├── environment/        # Environment configurations (Dev/Staging/Prod)
│       │   ├── event/              # Server-Sent Events (SSE) live stream
│       │   ├── incident/           # Incident tracking and resolution
│       │   ├── security/           # JWT filters and auth providers
│       │   ├── seed/               # Demo data seeder for development
│       │   └── user/               # User entities and management
│       ├── main/resources/
│       │   ├── application.yml      # Base Spring Boot configuration
│       │   ├── application-prod.yml # Production profile configuration
│       │   └── db/migration/       # Flyway schema version migrations (V1, V2)
│       └── test/                   # Comprehensive integration test suite (H2)
└── Frontend/
    ├── .dockerignore               # Docker build exclusions for Frontend
    ├── .env.example                # Frontend environment template
    ├── .gitignore                  # Frontend-specific ignore rules
    ├── Dockerfile                  # Multi-stage build (Node build + Nginx runtime)
    ├── nginx.conf                  # Nginx reverse proxy configuration
    ├── package.json                # Dependencies and build scripts
    ├── vite.config.ts              # Vite bundler configuration
    ├── tsconfig.json               # TypeScript configuration
    └── src/
        ├── components/             # Reusable UI components & animations
        ├── context/                # AuthContext and ThemeContext
        ├── lib/                    # Axios API client, SSE subscriber, types
        └── pages/                  # Dashboard, Applications, Deployments, Incidents, etc.
```

---

## 8. Available Roles & Permissions

PlatformOps enforces strict Role-Based Access Control (RBAC):

| Role | Applications | Deployments | Incidents | User Management | Audit Logs |
|---|---|---|---|---|---|
| **ADMIN** | Full (CRUD) | Full (Trigger/Cancel) | Full (Triage/Resolve) | Manage Users | Full Access |
| **DEVOPS** | Full (CRUD) | Full (Trigger/Cancel) | Full (Triage/Resolve) | View Only | View Only |
| **DEVELOPER** | Read / Create | Trigger Dev/Staging | View / Report | View Only | View Only |
| **VIEWER** | Read Only | Read Only | Read Only | Read Only | Read Only |

### Default Demo Accounts

When starting with an empty database and `SEED_DEMO_DATA=true`, the following accounts are automatically provisioned:

| Email | Password | Role |
|---|---|---|
| `admin@platformops.dev` | `Admin@12345` | **ADMIN** |
| `nimal@platformops.dev` | `Demo@12345` | **DEVOPS** |
| `aisha@platformops.dev` | `Demo@12345` | **DEVELOPER** |
| `ravi@platformops.dev` | `Demo@12345` | **VIEWER** |

---

## 9. Main PlatformOps Features

1. **Service Catalog & Registry**: Register and manage microservice metadata, repositories, and tier levels.
2. **Multi-Environment Promotion**: Promote versions sequentially through Development, Staging, and Production.
3. **Simulated Deployment Engine**: Executes asynchronous multi-stage pipeline stages (Lint → Build → Test → Deploy → Smoke Test) with live progress.
4. **Live Event Stream (SSE)**: Real-time UI updates powered by Server-Sent Events without manual page refresh.
5. **Incident Management**: Incident declaration, severity escalation, and resolution tracking.
6. **Immutable Audit Trail**: Detailed activity logs capturing who initiated deployments, config changes, or user management actions.

---

## 10. Testing

### Backend Automated Test Suite
The backend contains 35 integration tests covering authentication, RBAC, deployment pipelines, audit events, and data seeding. Tests execute against an embedded **H2 in-memory database** and require no running PostgreSQL instance:

```bash
cd Backend
./mvnw.cmd clean test     # Windows
# or: ./mvnw clean test   # Linux/macOS
```

### Frontend Typecheck & Build
```bash
cd Frontend
npm run build
```

---

## 11. Future DevOps Roadmap

The PlatformOps project follows a progressive, multi-stage DevOps implementation:

- [x] **Stage 1 — Git & GitHub Collaboration Workflow** *(Current)*
- [ ] **Stage 2 — Docker Compose Multi-Service Local Stack**
- [ ] **Stage 3 — GitHub Actions Automated CI/CD Pipelines**
- [ ] **Stage 4 — Jenkins Enterprise Pipeline Automation**
- [ ] **Stage 5 — AWS Cloud & Amazon ECR Container Registry**
- [ ] **Stage 6 — Terraform Infrastructure as Code (IaC)**
- [ ] **Stage 7 — Kubernetes Orchestration & Argo CD GitOps**
- [ ] **Stage 8 — Prometheus & Grafana Observability and Monitoring**

---

## 12. Team Workflow

Development is driven by a two-member engineering team following a structured Git workflow:
- **Mohamed Sajath** (`msajath`)
- **Saiyaf Siddeek** (`Saiyaf-Sdk`)

All work originates from `develop` via dedicated `feature/*`, `fix/*`, `devops/*`, or `docs/*` branches and is merged via peer-reviewed Pull Requests. Production releases are promoted from `develop` to `main`.

For complete branch guidelines, commit conventions, and step-by-step Git commands, consult [**CONTRIBUTING.md**](CONTRIBUTING.md).

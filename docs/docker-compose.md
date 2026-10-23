# Docker Compose Environment — PlatformOps IDP

This document provides a comprehensive operational and architectural guide for running **PlatformOps** locally using **Docker Compose**.

---

## 1. Architecture Overview

PlatformOps runs as a multi-container system orchestrated with `compose.yaml`. All services reside within a dedicated bridge network and persist relational state to a Docker named volume.

```
                              ┌──────────────────────────────────────────┐
                              │            Host Web Browser              │
                              └────────────────────┬─────────────────────┘
                                                   │
                          HTTP Requests (Port 80)  │  Actuator / Direct API (Port 8081)
                                                   ▼
┌─ platformops-network ────────────────────────────────────────────────────────────────────────┐
│                                                                                              │
│   ┌──────────────────────────┐                   ┌──────────────────────────┐                │
│   │   platformops-frontend   │                   │   platformops-backend    │                │
│   │   Image: nginx:1.27      │                   │   Image: temurin-21 JRE  │                │
│   │   Port: 80               │                   │   Port: 8081             │                │
│   │   User: nginx (non-root) │                   │   User: app (non-root)   │                │
│   │   Health: /healthz       │                   │   Health: /actuator/health│               │
│   └────────────┬─────────────┘                   └────────────┬─────────────┘                │
│                │                                              │                              │
│                │ Reverse Proxy (/api/ -> http://backend:8081) │                              │
│                └──────────────────────────────────────────────┘                              │
│                                                               │                              │
│                                           JDBC: postgres:5432 │                              │
│                                                               ▼                              │
│                                                  ┌──────────────────────────┐                │
│                                                  │   platformops-postgres   │                │
│                                                  │   Image: postgres:16     │                │
│                                                  │   Port: 5432             │                │
│                                                  │   Health: pg_isready     │                │
│                                                  └────────────┬─────────────┘                │
└───────────────────────────────────────────────────────────────┼──────────────────────────────┘
                                                                │ Mount: /var/lib/postgresql/data
                                                                ▼
                                                   ┌──────────────────────────┐
                                                   │ platformops_postgres_data│
                                                   │   (Docker Named Volume)  │
                                                   └──────────────────────────┘
```

### Request Flow Explained
1. **Frontend**: The user accesses `http://localhost`. Nginx serves the pre-compiled React 19 / Vite single-page application.
2. **Reverse Proxy & Same-Origin API Calls**: In production/container mode, the React app calls `/api/v1/...`. Nginx intercepts all `/api/` and `/actuator/` requests and forwards them across the internal Docker bridge network to `http://backend:8081`. This completely eliminates CORS overhead and avoids exposing backend service names to client browsers.
3. **Backend & Database**: Spring Boot communicates with PostgreSQL via Docker DNS (`jdbc:postgresql://postgres:5432/platformops`).
4. **State Persistence**: PostgreSQL writes all data to the Docker named volume `platformops_postgres_data`.

---

## 2. Docker DNS & Container Networking

Containers reside on an isolated bridge network: `platformops-network`.

### Why Containers Cannot Use `localhost`
- In Docker, each container has its own private network namespace and its own loopback interface (`127.0.0.1` / `localhost`).
- If the backend tries to connect to `localhost:5432`, it queries its *own* container's loopback interface where no PostgreSQL service is running.
- Docker provides an embedded DNS server at `127.0.0.11` that automatically resolves container service names (e.g., `postgres` -> internal container IP `172.18.0.2`, `backend` -> internal container IP `172.18.0.3`).
- Similarly, browser JavaScript executing on your laptop cannot resolve `http://backend:8081` because the browser runs on the host network, not inside the Docker bridge. The Nginx reverse proxy bridges this gap cleanly.

---

## 3. Services and Ports

| Service | Container Name | Image / Base | Internal Port | Host Port | Health Check |
|---|---|---|---|---|---|
| `postgres` | `platformops-postgres` | `postgres:16-alpine` | `5432` | `5432` | `pg_isready -U platformops -d platformops` |
| `backend` | `platformops-backend` | `eclipse-temurin:21-jre-alpine` (multi-stage) | `8081` | `8081` | `curl -f http://localhost:8081/actuator/health` |
| `frontend` | `platformops-frontend` | `nginx:1.27-alpine` (multi-stage) | `80` | `80` | `curl -f http://localhost/healthz` |

---

## 4. Environment Variables

Runtime configuration is externalized via `.env`. A documented template is provided at [`.env.example`](../.env.example).

### Configuration Matrix

| Variable | Default Value | Purpose |
|---|---|---|
| `POSTGRES_DB` | `platformops` | Database name initialized by PostgreSQL |
| `POSTGRES_USER` | `platformops` | Database superuser account |
| `POSTGRES_PASSWORD` | `platformops` | Database password (override in production) |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://postgres:5432/platformops` | Internal JDBC URL used by backend |
| `SPRING_DATASOURCE_USERNAME` | `platformops` | JDBC username |
| `SPRING_DATASOURCE_PASSWORD` | `platformops` | JDBC password |
| `JWT_SECRET` | *(64-char hex)* | 256-bit secret key for HMAC-SHA256 token verification |
| `FRONTEND_PORT` | `80` | Host port exposed for web client |
| `BACKEND_PORT` | `8081` | Host port exposed for backend API & actuator |
| `POSTGRES_PORT` | `5432` | Host port exposed for PostgreSQL inspection |

> [!CAUTION]
> Never commit `.env` or production passwords/secrets to version control. Keep `.env` listed in `.gitignore`.

---

## 5. Operations & Lifecycle Commands

### Starting the Environment
Start all containers in detached mode:
```bash
docker compose up -d
```

### Checking Status and Health
```bash
docker compose ps
```
Output displays health status for every service:
```
NAME                   IMAGE                         COMMAND                  SERVICE    STATUS
platformops-backend    platformops-backend:latest    "sh -c 'exec java $J…"   backend    Up (healthy)
platformops-frontend   platformops-frontend:latest   "/docker-entrypoint.…"   frontend   Up (healthy)
platformops-postgres   postgres:16-alpine            "docker-entrypoint.s…"   postgres   Up (healthy)
```

### Viewing Logs
View combined logs:
```bash
docker compose logs -f
```
Tail specific service logs:
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### Rebuilding Images
When source code changes in `Frontend/` or `Backend/`:
```bash
# Rebuild and restart all services
docker compose up -d --build

# Rebuild only the backend service
docker compose build backend && docker compose up -d backend

# Rebuild only the frontend service
docker compose build frontend && docker compose up -d frontend
```

### Stopping Services
Stop running containers without removing them:
```bash
docker compose stop
```

Restart stopped containers:
```bash
docker compose start
```

### Stopping and Removing Containers
Remove containers and the network:
```bash
docker compose down
```

> [!WARNING]
> Running `docker compose down -v` will **DESTROY the named volume** `platformops_postgres_data` and permanently erase your database data. Do not use the `-v` flag unless you explicitly intend to reset the database to an empty state.

---

## 6. Database Persistence

All PostgreSQL database files, tables, schemas, and demo seed data are stored in the named Docker volume:
```yaml
volumes:
  platformops_postgres_data:
    name: platformops_postgres_data
```
The volume mounts to `/var/lib/postgresql/data` inside `platformops-postgres`.

### Verifying Persistence
You can stop or destroy the PostgreSQL container without losing data:
```bash
# Stop and remove the database container
docker compose stop postgres
docker compose rm -f postgres

# Start it back up
docker compose up -d postgres
```
PostgreSQL will detect existing data in `/var/lib/postgresql/data`, bypass initialization, and retain all existing users, applications, and deployments.

---

## 7. Health Checks and Startup Ordering

To prevent backend startup race conditions, Compose enforces explicit health dependencies:

1. **PostgreSQL Health Check**:
   Executes `pg_isready -U platformops -d platformops` every 5 seconds.
2. **Backend Startup Dependency**:
   The backend service waits for postgres to be healthy before starting:
   ```yaml
   depends_on:
     postgres:
       condition: service_healthy
   ```
3. **Backend Health Check**:
   Executes `curl -f http://localhost:8081/actuator/health` every 10 seconds.
4. **Frontend Startup Dependency**:
   The frontend service waits for backend to be healthy before starting:
   ```yaml
   depends_on:
     backend:
       condition: service_healthy
   ```

---

## 8. Troubleshooting

### Port Conflicts
- **Error**: `bind: address already in use`
- **Cause**: A local service on your host machine (e.g. Apache, local Postgres, or Node) is already occupying port 80, 8081, or 5432.
- **Fix**: Check listening ports:
  ```powershell
  # Windows
  Get-NetTCPConnection -LocalPort 80,8081,5432 | Select-Object LocalPort,OwningProcess
  ```
  Adjust `FRONTEND_PORT`, `BACKEND_PORT`, or `POSTGRES_PORT` in your `.env` file without changing internal container configurations.

### Database Connection Refused
- **Error**: `Connection to postgres:5432 refused`
- **Cause**: Postgres container is still initializing or healthy condition was bypassed.
- **Fix**: Check `docker compose logs postgres`. Ensure `SPRING_DATASOURCE_URL` references `postgres:5432` and NOT `localhost:5432`.

### 502 / 504 Bad Gateway from Frontend
- **Error**: Browser or API calls receive HTTP 502/504 when requesting `/api/v1/...`.
- **Cause**: Backend container is stopped, rebuilding, or crashing.
- **Fix**: Run `docker compose ps backend` and `docker compose logs backend` to inspect application stack traces.

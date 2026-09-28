# PlatformOps

Release control for platform teams. Every release is a train on the line: **commit → Jenkins → Amazon ECR → dev → staging → production**, and PlatformOps shows where each one is, live.

| Layer | Stack |
|---|---|
| Frontend | React 18 + Vite + TypeScript, Tailwind, Framer Motion, TanStack Query, WebGL aurora, Lenis |
| Backend | Java 21 + Spring Boot 3.4 REST API, Spring Security + JWT (rotating refresh tokens), BCrypt, Spring Data JPA, Flyway |
| Database | PostgreSQL 16 |
| Live updates | Server-Sent Events (`/api/v1/events/stream`) |
| DevOps | Docker, Docker Compose, GitHub Actions, Jenkins, AWS (EC2 · ECR · S3 · IAM · VPC) via Terraform, k3s + NGINX Ingress + Argo CD, Prometheus + Grafana |

## Quick start (everything in Docker)

```bash
docker compose up -d --build
```

| What | Where |
|---|---|
| App | http://localhost:8081 |
| API docs (Swagger) | http://localhost:8080/swagger-ui.html |
| Grafana | http://localhost:3001 (admin / admin) |
| Prometheus | http://localhost:9090 |

Demo accounts (created only on an empty database):

| Email | Password | Role |
|---|---|---|
| admin@platformops.dev | `Admin@12345` | Admin |
| nimal@platformops.dev / kavin@platformops.dev | `Demo@12345` | DevOps |
| aisha@platformops.dev / sara@platformops.dev | `Demo@12345` | Developer |
| ravi@platformops.dev | `Demo@12345` | Viewer |

## Local development

```bash
# 1. database
docker compose up -d db

# 2. API (needs JDK 21 + Maven, or open Backend/ in IntelliJ and run PlatformOpsApplication)
cd Backend
mvn spring-boot:run

# 3. UI
cd Frontend
npm install
npm run dev            # http://localhost:5173
```

Run the backend tests: `cd Backend && mvn verify` (uses an in-memory H2 database in PostgreSQL mode — no Docker needed).

## Roles

| | Viewer | Developer | DevOps | Admin |
|---|:-:|:-:|:-:|:-:|
| See everything | ✓ | ✓ | ✓ | ✓ |
| Register applications, report incidents | | ✓ | ✓ | ✓ |
| Deploy to dev & staging | | ✓ | ✓ | ✓ |
| Deploy to production, edit/delete apps, run incidents, audit log | | | ✓ | ✓ |
| Skip the "staging first" rule, manage people | | | | ✓ |

## How a deployment works

1. `POST /api/v1/deployments` → queued (per-app row lock stops duplicate rollouts).
2. The pipeline runner moves it through **BUILD → IMAGE → DEPLOY → VERIFY**, writing logs and progress and streaming them over SSE.
3. Production only accepts a version that already **succeeded in staging**.
4. A failed production rollout marks the app `CRITICAL`, degrades the environment and **opens a SEV2 incident** automatically. One click rolls back to the previous good version.
5. Every action lands in the **audit log** (including failed sign-ins).

The pipeline talks to `BuildServer`, `ImageRegistry` and `ClusterDeployer` interfaces. The included `SimulatedPipeline` behaves like Jenkins/ECR/k3s (timing via `PIPELINE_STAGE_DELAY`, random failures via `PIPELINE_FAILURE_RATE`; versions containing `fail` / `build-fail` fail on purpose). Swap in real adapters without touching the rest.

## API overview (`/api/v1`)

| | |
|---|---|
| `POST /auth/login` · `/auth/refresh` · `/auth/logout` · `GET /auth/me` · `PUT /auth/password` | sign-in, rotating refresh tokens (reuse = all sessions revoked), 5 failed attempts = 15 min lock |
| `GET/POST /applications` · `GET/PATCH/DELETE /applications/{id}` | service catalogue |
| `GET /environments` | dev / staging / production |
| `GET/POST /deployments` · `GET /deployments/{id}` · `/logs` · `POST /{id}/cancel` · `/{id}/rollback` | releases |
| `GET/POST /incidents` · `PATCH /incidents/{id}` | on-call board |
| `GET /audit-events` | who did what, when |
| `GET/POST /users` · `PATCH /users/{id}` · `POST /users/{id}/unlock` | people & access |
| `GET /dashboard/summary` · `GET /events/stream` | overview + live events |

Errors are always RFC 7807 `application/problem+json` with a stable `code` and per-field `errors`.

## Configuration

| Variable | Default | |
|---|---|---|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | local Postgres | |
| `JWT_SECRET` | dev-only key | **Required in production** — `openssl rand -base64 48`. The `prod` profile refuses to start with the dev key. |
| `SEED_DEMO_DATA` | `true` (`false` in `prod`) | demo data on an empty DB |
| `CORS_ALLOWED_ORIGINS` | localhost dev ports | |
| `FORWARD_HEADERS_STRATEGY` | `none` | set `framework` behind nginx/ingress |
| `PIPELINE_STAGE_DELAY`, `PIPELINE_FAILURE_RATE` | `PT2.5S`, `0.05` | simulator behaviour |
| `VITE_API_URL` (frontend) | `http://localhost:8080/api/v1` | `/api/v1` in the Docker image |

## CI/CD

- **GitHub Actions** (`.github/workflows/ci.yml`): backend tests, frontend type-check/build, Docker image builds, and a readable run summary on the `ci-reports` branch.
- **Jenkins** (`Jenkinsfile`): test → build → push to ECR → bump the image tag in `deploy/k8s/overlays/prod`.
- **Argo CD** (`deploy/argocd/application.yaml`) syncs that overlay to k3s.
- **Terraform** (`infra/terraform`): VPC, security group, EC2 with k3s + NGINX Ingress + Argo CD, ECR repos, encrypted S3 bucket, least-privilege IAM role.

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # set your IP + key pair
terraform init && terraform apply
```

## Monitoring

The API exposes Prometheus metrics at `/actuator/prometheus`. Docker Compose provisions Prometheus and a Grafana dashboard (requests/s, p95 latency, 5xx, JVM heap, DB pool, uptime).

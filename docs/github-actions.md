# GitHub Actions CI — PlatformOps IDP

This document provides complete architectural, operational, and configuration documentation for the **PlatformOps Continuous Integration (CI)** pipeline powered by **GitHub Actions**.

---

## 1. Main Objectives & Purpose

The purpose of GitHub Actions in PlatformOps is **pre-merge quality protection**:
- Validate Pull Requests before merging into `develop` or `main`.
- Enforce automated quality gates across both frontend and backend services.
- Execute unit and integration tests against transient dependencies.
- Verify production build reproducibility.
- Validate Docker images and Compose configurations without publishing to external registries.

```
                  ┌──────────────────────────────────────────────┐
                  │       Developer Pull Request or Push         │
                  │         (main, develop, sajath-dev)          │
                  └──────────────────────┬───────────────────────┘
                                         │ triggers
                                         ▼
            ┌──────────────────────────────────────────────────────────┐
            │          PlatformOps CI (.github/workflows/ci.yml)       │
            └────────────┬─────────────────────────────┬───────────────┘
                         │                             │
                         ▼ (Parallel Execution)        ▼ (Parallel Execution)
            ┌──────────────────────────┐  ┌──────────────────────────┐
            │     frontend-checks      │  │      backend-checks      │
            │  - Node 22 LTS           │  │  - Java 21 Temurin       │
            │  - npm ci (reproducible) │  │  - PostgreSQL 16 Service │
            │  - oxlint (static check) │  │  - mvn compile           │
            │  - vite production build │  │  - mvn test (35 tests)   │
            │  - npm security audit    │  │  - mvn package           │
            └────────────┬─────────────┘  │  - Surefire Artifacts    │
                         │                └────────────┬─────────────┘
                         │                             │
                         └──────────────┬──────────────┘
                                        │ both must PASS (needs:)
                                        ▼
                         ┌─────────────────────────────┐
                         │      docker-validation      │
                         │  - docker compose config    │
                         │  - docker build frontend    │
                         │  - docker build backend     │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                           ┌─────────────────────────┐
                           │   PASS (Merge Ready)    │
                           │   FAIL (Blocked Merge)  │
                           └─────────────────────────┘
```

> [!NOTE]
> GitHub Actions is strictly responsible for **Continuous Integration (CI)**. It does NOT push images to Amazon ECR, nor does it deploy to AWS or Kubernetes. Continuous Delivery (CD), image tagging, and deployment pipelines are reserved for future stages (Jenkins / Argo CD).

---

## 2. Workflow Triggers & Concurrency

The workflow file is defined at [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

### Event Triggers
```yaml
on:
  push:
    branches:
      - main
      - develop
      - sajath-dev
  pull_request:
    branches:
      - main
      - develop
      - sajath-dev
```

### Concurrency Control
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```
If a developer pushes additional commits to an active PR or branch while a previous CI run is in flight, the earlier redundant run is automatically cancelled, saving GitHub Actions compute minutes.

---

## 3. Pipeline Jobs & Responsibilities

### Job 1: `frontend-checks` (`Frontend Quality & Build Checks`)
- **Environment**: `ubuntu-latest`
- **Working Directory**: `Frontend`
- **Node Version**: `22.x LTS` via `actions/setup-node@v4` with automated `npm` cache keyed on `Frontend/package-lock.json`.
- **Steps**:
  1. **`npm ci`**: Clean, reproducible installation of exact locked dependency versions.
  2. **`npm run lint`**: Executes `oxlint` static code analysis.
  3. **Frontend Tests**: Inspects test configuration. Since the frontend does not currently define a test framework or script, it explicitly outputs `NOT CONFIGURED` rather than faking passes.
  4. **`npm run build`**: Runs `tsc -b && vite build` to generate the production bundle (`dist/`).
  5. **`npm audit`**: Scans for high/critical vulnerabilities.

### Job 2: `backend-checks` (`Backend Test & Packaging Checks`)
- **Environment**: `ubuntu-latest`
- **Working Directory**: `Backend`
- **Java Version**: `21 LTS` (Eclipse Temurin) via `actions/setup-java@v4` with automated Maven dependency caching.
- **Service Container**: Transient PostgreSQL 16 Alpine instance:
  ```yaml
  services:
    postgres:
      image: postgres:16-alpine
      env:
        POSTGRES_DB: platformops_test
        POSTGRES_USER: platformops_test
        POSTGRES_PASSWORD: test_password_ci_only
      ports:
        - 5432:5432
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
  ```
- **Steps**:
  1. **Maven Wrapper Permissions**: Ensures `chmod +x mvnw`.
  2. **PostgreSQL Service Readiness Probe**: Verifies port 5432 is open and accepting socket connections before running tests.
  3. **`mvn compile`**: Compiles main sources using Java 21 compiler.
  4. **`mvn test`**: Executes all 35 integration and unit tests covering authentication, application registry, deployment pipelines, incidents, and audit trails.
  5. **`mvn package -DskipTests`**: Builds the executable Spring Boot JAR (`target/platformops-api-1.0.0.jar`).
  6. **Surefire Report Artifact**: Preserves test reports (`Backend/target/surefire-reports/`) for 7 days, accessible under workflow run summary.

### Job 3: `docker-validation` (`Docker Build & Compose Validation`)
- **Dependency**: `needs: [frontend-checks, backend-checks]` (only executes if both frontend and backend quality checks pass).
- **Environment**: `ubuntu-latest`
- **Steps**:
  1. **Validate Compose Syntax**: Executes `docker compose config --quiet` to confirm Compose syntax is valid.
  2. **Build Frontend Image**: Builds `platformops-frontend:ci` via `Frontend/Dockerfile`.
  3. **Build Backend Image**: Builds `platformops-backend:ci` via `Backend/Dockerfile`.
  4. **Registry Protection**: Does not push images to any external registry.

---

## 4. Secret & Credential Safety

The CI pipeline complies with strict security standards:
- **Zero Production Credentials**: Workflow files contain no production database credentials, AWS secrets, or private keys.
- **Isolated Test Secrets**: Database tests use non-production dummy values (`platformops_test` / `test_password_ci_only`).
- **Development JWT Secret**: The backend test runner utilizes an ephemeral development signing key.
- **Audit Logging**: Secrets are never echoed into workflow console logs.

---

## 5. Branch Protection Settings

To ensure the CI pipeline protects code quality for both team members, configure the following Branch Protection Rules in GitHub (`Settings` $\rightarrow$ `Branches` $\rightarrow$ `Add branch protection rule`):

### Protection Rule for `main` (Production Branch)
- **Branch name pattern**: `main`
- **Protect matching branches**:
  - [x] **Require a pull request before merging**
    - Require approvals: `1`
    - Dismiss stale pull request approvals when new commits are pushed: `Checked`
    - Require review from Code Owners: `Optional`
  - [x] **Require status checks to pass before merging**
    - Require branches to be up to date before merging: `Checked`
    - **Status checks that are required**:
      1. `Frontend Quality & Build Checks`
      2. `Backend Test & Packaging Checks`
      3. `Docker Build & Compose Validation`
  - [x] **Do not allow bypassing the above settings**
  - [x] **Block force pushes** (prevent history rewriting)
  - [x] **Block branch deletions**

### Protection Rule for `develop` (Integration Branch)
- **Branch name pattern**: `develop`
- **Protect matching branches**:
  - [x] **Require a pull request before merging** (Require `1` approval)
  - [x] **Require status checks to pass before merging** (`Frontend Quality & Build Checks`, `Backend Test & Packaging Checks`, `Docker Build & Compose Validation`)
  - [x] **Block force pushes**

---

## 6. How to Diagnose & Troubleshoot CI Failures

| Symptom / Error | Likely Root Cause | Remediation |
|---|---|---|
| `npm ci can only install when your package.json and package-lock.json are in sync` | Dependencies were installed using `npm i <pkg>` without committing updated `package-lock.json`. | Run `npm install` locally, verify `git status`, and commit the updated `package-lock.json`. |
| `Permission denied: ./mvnw` | The executable permission bit (`+x`) was lost on the Maven wrapper file. | Run `git update-index --chmod=+x Backend/mvnw`, commit, and push. |
| `Connection refused: localhost:5432` | The PostgreSQL service container was not ready or failed health checks. | Check the service container health status in the GitHub Actions runner log. |
| `Tests run: X, Failures: 1` | A backend regression was introduced in application code or test assertions. | Download `surefire-test-reports` from the GitHub Actions run artifacts to inspect the exact assertion failure and stack trace. |
| `docker build` failed on backend | Maven build failed inside Docker or dependency download timed out. | Verify `Backend/Dockerfile` uses `mvn dependency:resolve` instead of `dependency:go-offline`. |
| `compose.yaml is invalid` | A syntax or indentation error was introduced into `compose.yaml`. | Run `docker compose config` locally to validate before pushing. |

### Rerunning Failed Workflows
1. Navigate to the **Actions** tab in GitHub: `https://github.com/<owner>/PlatformOps/actions`.
2. Click on the failed workflow run.
3. In the top-right corner, click **Re-run jobs** $\rightarrow$ select either **Re-run all jobs** or **Re-run failed jobs**.

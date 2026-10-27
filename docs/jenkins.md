# Jenkins CI/CD Orchestration — PlatformOps IDP

This document provides complete architectural, operational, security, and troubleshooting documentation for the **PlatformOps Continuous Integration & Continuous Delivery (CI/CD)** pipeline powered by **Jenkins**.

---

## 1. Objectives & CI/CD Role

In the PlatformOps delivery lifecycle, **GitHub Actions** and **Jenkins** fulfill complementary, decoupled roles:

- **GitHub Actions (Pre-Merge Validation)**: Executes automated PR checks (linting, build verification, transient service tests) to protect `develop` and `main` branches before pull requests are merged.
- **Jenkins (Post-Merge Orchestration & Release Pipeline)**: Triggers automatically upon merges or pushes to integration/release branches (`main`, `develop`), checks out code, runs full test suites, builds reproducible multi-stage Docker images, performs container security scans, generates traceable release tags, and prepares artifacts for downstream registry and GitOps deployments.

```
┌─────────────────┐       ┌─────────────────┐
│   Developer     │       │   Pull Request  │
│  Commit & Push  ├──────►│  GitHub Actions ├──────┐
└─────────────────┘       │   (Quality Gate)│      │
                          └─────────────────┘      ▼ (PR Approved & Merged)
                                          ┌─────────────────┐
                                          │  GitHub Branch  │
                                          │ (main / develop)│
                                          └────────┬────────┘
                                                   │ Webhook Event
                                                   ▼
                                          ┌─────────────────┐
                                          │     Jenkins     │
                                          │   Controller    │
                                          └────────┬────────┘
                                                   │
        ┌──────────────────────────────────────────┴──────────────────────────────────────────┐
        ▼                                          ▼                                          ▼
┌───────────────┐                          ┌───────────────┐                          ┌───────────────┐
│ 1. Checkout   │                          │ 2. Env Info   │                          │ 3. Frontend   │
│ - Git SCM     │                          │ - Java 21     │                          │ - npm ci      │
│ - Commit SHA  │                          │ - Node / NPM  │                          │ - oxlint      │
│ - Short SHA   │                          │ - Docker CLI  │                          │ - Vite build  │
└───────┬───────┘                          └───────┬───────┘                          └───────┬───────┘
        │                                          │                                          │
        └──────────────────────────────────────────┼──────────────────────────────────────────┘
                                                   │
        ┌──────────────────────────────────────────┴──────────────────────────────────────────┐
        ▼                                          ▼                                          ▼
┌───────────────┐                          ┌───────────────┐                          ┌───────────────┐
│ 4. Backend    │                          │ 5. Docker     │                          │ 6. Security   │
│ - mvnw clean  │                          │ - Frontend    │                          │ - Trivy Scan  │
│ - mvnw test   │                          │   Docker Build│                          │ - HIGH &      │
│ - mvn package │                          │ - Backend     │                          │   CRITICAL    │
│ - 35 Tests    │                          │   Docker Build│                          │   Vulnerab.   │
└───────┬───────┘                          └───────┬───────┘                          └───────┬───────┘
        │                                          │                                          │
        └──────────────────────────────────────────┼──────────────────────────────────────────┘
                                                   │
                                                   ▼
                                      ┌────────────────────────┐
                                      │ 7. Image Tagging       │
                                      │ - :<short-sha>         │
                                      │ - :build-<BUILD_NUMBER>│
                                      │ - :latest (on main)    │
                                      └────────────┬───────────┘
                                                   │
                                                   ▼
                                      ┌────────────────────────┐
                                      │ 8. Post Actions        │
                                      │ - JUnit Test Reports   │
                                      │ - Archive JAR & dist   │
                                      │ - Safe Workspace Clean │
                                      └────────────────────────┘
```

---

## 2. Core Jenkins Architectural Concepts

| Concept | Definition & Role in PlatformOps |
|---|---|
| **Jenkins Controller** | The centralized management server that coordinates orchestration, schedules builds, hosts the Web UI/API, securely stores credentials, and monitors pipeline execution. |
| **Jenkins Agent** | An executor node (process, container, or dedicated VM) that connects to the Controller to perform the physical build commands. In our lightweight setup, the Controller runs an executor on the same runtime, keeping educational infrastructure simple without multi-node overhead. |
| **Job (Project)** | A configured task in Jenkins. In PlatformOps, we utilize a Declarative Pipeline job (`PlatformOps-CI-CD`) defined in code via `Jenkinsfile`. |
| **Pipeline** | An automated suite of activities that takes source code from version control through build, test, packaging, and validation to a production-ready artifact. |
| **Stage** | A distinct phase in the pipeline (e.g., `Frontend Build`, `Backend Test`, `Docker Build`). Visualized sequentially in the Jenkins UI Stage View. |
| **Step** | A single atomic task within a stage (e.g., `sh 'npm ci'`, `junit '...'`, `echo '...'`). |
| **Workspace** | The dedicated directory on the agent filesystem where the SCM repository is cloned and where build tools read and write artifacts. |
| **Build Number** | An auto-incrementing integer assigned to each execution of a job (e.g., `#1`, `#2`), used to create traceable artifact and image tags. |
| **Artifact** | A deployable file produced during the build process (e.g., `platformops-api-1.0.0.jar`, `Frontend/dist/` bundle) archived permanently for debugging or downstream deployment. |
| **Credential** | An encrypted secret (API token, SSH key, username/password) stored safely in Jenkins Credentials Store and bound temporarily to steps via `withCredentials()`. |
| **Webhook** | An HTTP POST notification sent by GitHub to Jenkins immediately when an event (push/merge) occurs, triggering instant pipeline execution without slow polling. |

### Controller vs. Agent Architecture
- **Controller Responsibilities**: Rendering UI, parsing Jenkinsfile pipelines, dispatching tasks, storing build records, managing credentials, handling webhook web endpoints.
- **Agent Responsibilities**: Running compilers (`javac`, `vite`), running containers (`docker build`), running test runners (`surefire`).
- In this environment, executing builds via the dedicated Docker container Controller provides the simplest, most reproducible single-node setup for development and demonstration without requiring a complex Kubernetes or multi-VM agent pool.

---

## 3. Dedicated Jenkins Infrastructure & Startup

### Logical Isolation from Application Stack
Jenkins infrastructure is placed in `jenkins/` with its own `compose.yaml` and `Dockerfile`. It is strictly separated from the PlatformOps application stack (`compose.yaml`):
1. PlatformOps application containers (`platformops-frontend`, `platformops-backend`, `platformops-postgres`) are never modified or coupled to Jenkins.
2. Jenkins runs on host port **`8088`** (`8088:8080`), completely avoiding collisions with default port 8080 (which is commonly occupied by system web servers like `httpd`).

### Docker Socket Security Implications
The Jenkins container mounts the host Docker socket:
```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
group_add:
  - "0"
```
> [!WARNING]
> **Docker Socket Security Notice**: Mounting `/var/run/docker.sock` implements the Docker-outside-of-Docker (DooD) pattern. Because the Docker daemon executes with root privileges, any process with read/write access to this socket effectively has administrative control over the Docker host. For an educational/local developer environment, this approach is the simplest, most performant way to build application container images without nested virtualization overhead. In production environments, safer alternatives include:
> - Rootless container builders (Kaniko or Buildah) running inside Kubernetes.
> - Ephemeral cloud VM build agents with dedicated Docker engines.
> - Isolated DinD (Docker-in-Docker) sidecars with mTLS authentication.

### Starting Jenkins
From the project root:
```bash
# Build and start dedicated Jenkins container in the background
docker compose -f jenkins/compose.yaml up -d --build

# Verify Jenkins container health and logs
docker compose -f jenkins/compose.yaml logs -f
```
- **Jenkins URL**: `http://localhost:8088`
- **Initial Setup Wizard**: Disabled via `-Djenkins.install.runSetupWizard=false`
- **Pre-Configured Admin User**: `admin` / `Admin@PlatformOps2026`
- **Pre-Configured Pipeline**: `PlatformOps-CI-CD`

---

## 4. Required Jenkins Plugins

Jenkins is built using a lean plugin footprint to ensure stability, fast startup, and compatibility with Java 21:

| Plugin Name | Identifier | Purpose |
|---|---|---|
| **Pipeline** | `workflow-aggregator` | Provides Declarative Pipeline syntax (`pipeline {}`, `stage {}`, `steps {}`, `post {}`), visual stage view, and parallel execution. |
| **Git Plugin** | `git` | Enables Jenkins to perform SCM checkouts from GitHub repositories, track branches, and read commit SHAs. |
| **GitHub Integration** | `github` | Provides the `/github-webhook/` endpoint, parses webhook push payloads, and triggers automated pipeline builds upon commit merges. |
| **Credentials Binding** | `credentials-binding` | Provides `withCredentials()` step and `credentials()` helper to safely inject secrets without printing them to console logs. |

---

## 5. Security & Authentication Configuration

Jenkins is hardened out of the box through automated Groovy initialization scripts (`jenkins/init.groovy.d/01-security-and-job.groovy`):
- **Authentication**: `HudsonPrivateSecurityRealm` is enabled.
- **Anonymous Access**: Anonymous read and administrative access is strictly disabled (`strategy.setAllowAnonymousRead(false)`).
- **CSRF Protection**: Default crumb issuer (`DefaultCrumbIssuer`) is enabled to guard against Cross-Site Request Forgery attacks.
- **Root URL**: Configured to `http://localhost:8088/`.
- **Zero Committed Secrets**: Secrets and tokens are never committed to Git, hardcoded in `Jenkinsfile`, or echoed in console output.

---

## 6. GitHub Connection & Credentials Setup

To connect Jenkins to GitHub:
1. In Jenkins, navigate to **Manage Jenkins** $\rightarrow$ **Credentials** $\rightarrow$ **System** $\rightarrow$ **Global credentials** $\rightarrow$ **Add Credentials**.
2. Select credential type:
   - **Username with password** (Recommended for GitHub Personal Access Tokens):
     - **Username**: GitHub username (`msajath`)
     - **Password**: GitHub Personal Access Token (`ghp_...` with `repo` read/write permissions)
     - **ID**: `github-access-token`
     - **Description**: `PlatformOps GitHub Access Token`
   - **Secret text**: Alternatively used for Webhook shared HMAC secrets (`github-webhook-secret`).
   - **SSH Username with private key**: Recommended for organizations using SSH deploy keys.

---

## 7. Webhook Configuration

### GitHub Repository Setup
1. In GitHub, navigate to: `https://github.com/msajath/PlatformOps/settings/hooks`.
2. Click **Add webhook**.
3. Fill in configuration:
   - **Payload URL**: `http://<public-ip-or-tunnel-domain>:8088/github-webhook/`
   - **Content type**: `application/json`
   - **Secret**: Optional webhook HMAC secret (matching Jenkins configuration)
   - **Which events would you like to trigger this webhook?**: Select **Just the push event**.
4. Click **Add webhook**.

### Local Development Webhook Testing
In local environments behind NAT/firewalls:
- Use an outbound webhook tunnel:
  ```bash
  npx smee-client --url https://smee.io/<unique-id> --target http://localhost:8088/github-webhook/
  ```
- Or trigger the webhook endpoint programmatically:
  ```bash
  curl -X POST http://localhost:8088/github-webhook/ \
       -H "Content-Type: application/json" \
       -H "X-GitHub-Event: push" \
       -d '{"ref":"refs/heads/main","repository":{"name":"PlatformOps","html_url":"https://github.com/msajath/PlatformOps.git"}}'
  ```

---

## 8. Pipeline Stages & Execution

The root [`Jenkinsfile`](../Jenkinsfile) implements 10 declarative stages:

1. **`Checkout`**: Checks out repository SCM, captures commit SHA and short SHA, logs build metadata.
2. **`Environment Info`**: Safely prints versions of Java, Maven, Node, NPM, and Docker.
3. **`Frontend Install`**: Executes `npm ci` in `Frontend/` for exact, reproducible dependency resolution.
4. **`Frontend Test`**: Accurately logs `Frontend Test Suite: NOT CONFIGURED` (since `package.json` contains no test runner), preventing fake passes.
5. **`Frontend Build`**: Runs `npm run lint` (`oxlint`) and `npm run build` (`tsc -b && vite build`) to generate production assets in `Frontend/dist/`.
6. **`Backend Test`**: Runs `./mvnw clean test -B -ntp` against all 35 Spring Boot integration and unit tests using the in-memory PostgreSQL-compatible H2 database profile.
7. **`Backend Package`**: Packages the Spring Boot executable artifact via `./mvnw package -DskipTests -B -ntp`, producing `target/platformops-api-1.0.0.jar`.
8. **`Docker Build`**: Builds both multi-stage container images using existing project Dockerfiles:
   - Frontend: `platformops-frontend:<short-sha>` and `platformops-frontend:build-<number>`
   - Backend: `platformops-backend:<short-sha>` and `platformops-backend:build-<number>`
9. **`Security Check`**: Scans built container images with **Trivy** reporting `HIGH` and `CRITICAL` CVEs.
10. **`Image Tagging`**: Tags production `latest` pointers on the `main` branch, logs all tagged images, and confirms readiness for future registry distribution.

### Post Actions
- **JUnit Reports**: Publishes `Backend/target/surefire-reports/*.xml` to render test trend graphs in the Jenkins UI.
- **Artifact Archiving**: Archives `Backend/target/*.jar` and `Frontend/dist/**` for artifact retention.
- **Safe Cleanup**: Cleans the ephemeral Jenkins build workspace (`cleanWs()`) to prevent disk bloat.

---

## 9. Image Versioning Strategy

Images are tagged with traceable identifiers to ensure full provenance from production containers back to source code and CI builds:

```
platformops-backend:904bef9          <-- Git Short Commit SHA (primary traceable release tag)
platformops-backend:build-1          <-- Jenkins Build Number (CI tracking)
platformops-backend:latest           <-- Production Pointer (only updated upon main merges)
```

**Why traceable versioning matters:**
- **Auditability**: An engineer inspecting a running container in production can immediately extract its commit SHA and find the exact code that was deployed.
- **Rollback Safety**: Reverting to a known-good release requires simply pointing the deployment to a previous SHA tag without ambiguous `latest` caching bugs.
- **Immutability**: SHA-based tags are immutable; once published, they never change.

---

## 10. Future ECR Readiness (Stage 5 Bridge)

In Stage 4, images are built, tagged, and security-validated locally. In future Stage 5 (AWS Foundation & Amazon ECR), the pipeline will seamlessly extend by inserting an authenticated push step between `Image Tagging` and `Post Actions`:

```groovy
stage('Push to ECR') {
    when { branch 'main' }
    steps {
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-ecr-credentials']]) {
            sh '''
                aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                docker tag ${IMAGE_BACKEND}:${SHORT_SHA} ${ECR_REGISTRY}/${IMAGE_BACKEND}:${SHORT_SHA}
                docker push ${ECR_REGISTRY}/${IMAGE_BACKEND}:${SHORT_SHA}
            '''
        }
    }
}
```

---

## 11. Troubleshooting & Diagnostics Guide

| Problem / Error | Root Cause | Remediation |
|---|---|---|
| **Port 8080 collision** (`address already in use`) | Host process (e.g. Apache `httpd` or another web server) is already listening on port 8080. | The PlatformOps Jenkins compose file maps host port `8088:8080`. Access Jenkins at `http://localhost:8088`. |
| **Docker permission denied** (`Got permission denied while trying to connect to Docker daemon`) | The `jenkins` user in the container lacks access to `/var/run/docker.sock`. | Ensure `group_add: ["0"]` is configured in `jenkins/compose.yaml` or run `usermod -aG root jenkins`. |
| **`docker: command not found`** | The Jenkins container image was started without the Docker client binary installed. | Rebuild the custom image using `docker compose -f jenkins/compose.yaml build` which installs `docker-ce-cli`. |
| **`npm ci` failure** (`lockfileVersion mismatch` or dependency error) | `Frontend/package.json` and `Frontend/package-lock.json` are out of sync. | Run `npm install` inside `Frontend/` on your development machine, verify clean git status, commit the updated `package-lock.json`, and re-trigger. |
| **Backend test failure** (`Connection refused: localhost:5432`) | Tests attempted to connect to an external PostgreSQL instead of using the test profile. | Ensure backend tests use `@ActiveProfiles("test")`, which activates H2 in-memory PostgreSQL compatibility mode (`application-test.yml`). |
| **Git checkout fails** (`Host key verification failed` or `401 Unauthorized`) | Missing credentials or incorrect Git URL. | In `Manage Jenkins` $\rightarrow$ `Credentials`, verify that the GitHub Personal Access Token is valid and has read permissions. |
| **Webhook does not trigger pipeline** | GitHub cannot reach `localhost:8088` from the public internet. | Deploy an outbound tunnel (`smee-client` or `ngrok`) to forward webhook events to `http://localhost:8088/github-webhook/`. |
| **Pipeline stuck waiting for executors** | Executor count set to 0 or job requires a label not matching any available agent. | Verify `Jenkinsfile` specifies `agent any` and that the built-in node has at least 2 executors enabled. |
| **Surefire XML reports missing** | Backend tests were skipped using `-DskipTests`. | Ensure `mvn clean test` is executed before `mvn package -DskipTests`. |

---

## 12. Diagnostic Commands & Log Locations

```bash
# Check Jenkins container status
docker ps -f name=platformops-jenkins

# Inspect live Jenkins Controller logs
docker logs -f platformops-jenkins

# Inspect Jenkins data volume contents
docker run --rm -v platformops_jenkins_data:/data alpine ls -la /data

# Test Docker socket connectivity from inside Jenkins container
docker exec -it platformops-jenkins docker version

# Test Node.js and Maven inside Jenkins container
docker exec -it platformops-jenkins sh -c "node -v; mvn -version"
```

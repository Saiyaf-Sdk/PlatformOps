# Contributing to PlatformOps

Welcome to the **PlatformOps** development team! This guide establishes the Git and GitHub collaboration workflow tailored for our two-member engineering team (**Mohamed Sajath** & **Saiyaf Siddeek**).

---

## 1. Branching Strategy

We follow a lightweight, structured branching model centered around two long-lived branches and task-specific working branches:

```
main (Production / Stable Releases)
  ▲
  │ (Release PR - Peer Reviewed)
develop (Active Integration & Staging)
  ▲
  │ (Feature PR - Peer Reviewed)
feature/*  |  fix/*  |  devops/*  |  docs/*
```

### Branch Responsibilities

| Branch | Purpose | Direct Push Allowed? | Protected? |
|---|---|---|---|
| `main` | Production-ready, stable release code. Only updated via Pull Request from `develop`. | **NO** | **YES** |
| `develop` | Primary integration branch. All completed and tested features land here. | **NO** | **YES** |
| `feature/<name>` | New application features or user stories (e.g., `feature/app-registration`). | Yes (owner) | No |
| `fix/<name>` | Bug fixes and patches (e.g., `fix/jwt-expiration-handling`). | Yes (owner) | No |
| `devops/<name>` | Infrastructure, CI/CD, and containerization tasks (e.g., `devops/docker-compose`). | Yes (owner) | No |
| `docs/<name>` | Documentation guides, README updates, architecture notes (e.g., `docs/api-setup`). | Yes (owner) | No |

---

## 2. Commit Message Convention

We adhere to the **Conventional Commits** specification to ensure automated changelog generation and clean history:

```
<type>: <short, imperative description in present tense>

[optional body explaining context or rationale]
```

### Allowed Types

- `feat:` A new feature for the user or platform
- `fix:` A bug fix for a defect
- `refactor:` Code refactoring that neither adds a feature nor fixes a bug
- `test:` Adding or updating unit/integration tests
- `docs:` Documentation-only changes (README, architecture, comments)
- `chore:` Maintenance, dependency updates, tooling configurations
- `ci:` Continuous Integration scripts and pipeline definitions
- `devops:` Infrastructure, Docker, Kubernetes, Terraform, or runtime configs

### Commit Guidelines

1. **Atomic commits**: One logical change per commit.
2. **Imperative mood**: Write "add service filter" instead of "added service filter" or "adds service filter".
3. **No noise commits**: Avoid vague messages like `update`, `wip`, `fixes`, `final commit`.
4. **No secrets in commits**: Never commit passwords, credentials, `.env` files, or private keys.

---

## 3. Step-by-Step Development Workflow

### Step 1: Sync with `develop`
Before starting any new task, ensure your local `develop` branch is up to date:

```bash
git checkout develop
git pull origin develop
```

### Step 2: Create a Working Branch
Create a descriptive branch adhering to our prefix standard:

```bash
# For a new feature:
git checkout -b feature/application-management

# For a bug fix:
git checkout -b fix/auth-token-refresh

# For a DevOps stage:
git checkout -b devops/stage-2-docker-compose
```

### Step 3: Implement and Test Locally
Make your changes and verify that both frontend and backend pass all builds and tests:

```bash
# Test Backend
cd Backend
./mvnw.cmd clean test          # Windows
# or: ./mvnw clean test        # Linux/macOS

# Build Frontend
cd ../Frontend
npm run build
```

### Step 4: Stage and Commit
Check your status to make sure no unwanted files or generated artifacts are staged:

```bash
git status
git add <specific-files>
git commit -m "feat: implement application health probe display"
```

### Step 5: Push Branch to Remote
Push your working branch to GitHub:

```bash
git push -u origin feature/application-management
```

### Step 6: Open a Pull Request
1. Open GitHub and navigate to `https://github.com/msajath/PlatformOps/pulls`.
2. Click **New pull request**.
3. Set the base branch to **`develop`** (NOT `main`).
4. Set the compare branch to your working branch.
5. Fill out the PR template completely (Description, Changes, Testing performed, Security considerations).
6. Assign your teammate as the reviewer:
   - If Sajath authored the PR $\rightarrow$ request review from Saiyaf (`Saiyaf-Sdk`).
   - If Saiyaf authored the PR $\rightarrow$ request review from Sajath (`msajath`).

### Step 7: Code Review & Discussion
- The reviewer inspects code quality, security, and test verification.
- Any requested changes are committed and pushed to the same working branch.
- Once approved, merge using **Squash and Merge** (preferred for concise history) or **Rebase and Merge**.
- Delete the remote feature branch after merging.

---

## 4. Resolving Merge Conflicts

If `develop` has moved forward while you were working on your branch:

```bash
# Fetch latest develop
git checkout develop
git pull origin develop

# Rebase your working branch onto develop
git checkout feature/application-management
git rebase develop

# If conflicts occur:
# 1. Resolve conflicts in your editor
# 2. Stage the resolved files: git add <resolved-file>
# 3. Continue rebase: git rebase --continue
# 4. Force push with lease to update the PR:
git push --force-with-lease origin feature/application-management
```

---

## 5. Release Promotion (`develop` $\rightarrow$ `main`)

When a milestone or stage is complete, thoroughly tested, and stable on `develop`:

1. Open a PR with **base: `main`** and **compare: `develop`**.
2. Both team members review and approve the release PR.
3. Merge using a standard merge commit to preserve milestone boundary.
4. Tag the release on `main`:
   ```bash
   git checkout main
   git pull origin main
   git tag -a v1.0.0 -m "Release v1.0.0: Stage 1 Git/GitHub Workflow"
   git push origin v1.0.0
   ```

# PlatformOps functional and backend audit

Date: 10 November 2026 (Asia/Colombo)

Audited local branch: `sajath-dev` at `6d267f1f9a83a0b24bb3567bdef6f8fdb2ceb7d7`.

## Verdict

**The core application has working backend APIs, but not every visible feature is implemented.** Infrastructure, monitoring, and infrastructure requests are frontend prototypes. The deployment engine persists real application state and audit events, but simulates external build, image registry, and Kubernetes operations.

Three API behavior/security checks failed. Audit logging works through the API, but the database does not enforce an immutable audit trail. Do not describe the entire project as fully functional or production ready based on the current implementation.

## Validation results

| Validation | Result | Evidence |
|---|---|---|
| Existing backend integration tests | **35 passed**, 0 failures/errors/skipped | [Backend test summary](audit/backend-tests.txt) |
| Additional HTTP functional checks on PostgreSQL | **117 passed / 120 checks; 3 failed** | [Individual assertions and status codes](audit/api-results.json) |
| OpenAPI operation coverage | **33 / 33 documented API operations exercised** | [API results](audit/api-results.json) |
| Current application stack smoke checks through Nginx | **10 / 10 returned HTTP 200** | [Main stack results](audit/main-stack-smoke.json) |
| Frontend production build | Passed | [Frontend validation](audit/frontend-checks.txt) |
| Frontend lint | Passed with 3 warnings | [Frontend validation](audit/frontend-checks.txt) |
| Browser inspection | Authenticated dashboard rendered with live application data | Full browser workflows remain unverified |

The 120 checks are functional assertions, including expected permission and validation rejections. They are not 120 independent user interface workflows. Exercising every documented HTTP operation does not prove every edge case or every UI control works.

The existing integration tests use H2 in PostgreSQL compatibility mode. The additional HTTP checks used the built backend and frontend images with a separate PostgreSQL 16 database and Nginx, so database-backed behavior was also tested on PostgreSQL.

The temporary stack used deterministic simulated pipelines (`PIPELINE_FAILURE_RATE=0`, `PIPELINE_STAGE_DELAY=PT0.4S`). The main app retains its original settings. Synthetic test records were created only in the temporary stack. The main stack smoke check signed in and read data; the sign-in generated its normal audit event.

## Feature-to-backend mapping

| Feature | Backend support | Finding |
|---|---|---|
| Login and current user | `/auth/login`, `/auth/me` | Working; JWT authentication, incorrect-password handling and account lock/unlock tested |
| Public signup | `/auth/signup` | Connected, but password validation has two confirmed failures |
| Refresh and logout | `/auth/refresh`, `/auth/logout`, `/auth/logout-all` | Rotation, reuse detection and refresh-token revocation passed; see access-token limitation below |
| Change password | `PUT /auth/password` | API works; no frontend password-change form found |
| Dashboard | `/dashboard/summary` | API-backed; current stack response passed; dashboard visually rendered |
| Application list, details, search, registration | `/applications`, `/applications/{id}`, `/applications/stats` | Working APIs and frontend query/mutation wiring |
| Application edit/delete | `PATCH/DELETE /applications/{id}` | Backend CRUD passed; no edit/delete frontend mutation or control found |
| Environment list/details | `/environments`, `/environments/{code}` | Read APIs work. Detail page mixes API data with hardcoded capacity, region and node information |
| Start deployment and view logs | `/deployments`, `/deployments/{id}`, `/deployments/{id}/logs` | Working state and logs; external CI/CD execution is simulated |
| Staging-to-production promotion | Deployment service checks previous successful staging version | Passed; developer production deployments and non-admin force attempts rejected |
| Manual production approval | `requiresApproval` displayed as a gate | No approval-request/approve/reject workflow or endpoint found; actual gate is staging success plus role checks |
| Deployment cancellation and rollback | `/deployments/{id}/cancel`, `/deployments/{id}/rollback` | Passed, including terminal state and previous-version restoration |
| Incident report, assignment and resolution | `/incidents`, `/incidents/{id}` | Create/read/update, acknowledge, resolve, reopen, and permission checks passed |
| Failed deployment opens an incident | Deployment state service and incident service | Forced verification failure created a linked incident; rollback succeeded |
| People and access | `/users`, `/users/{id}`, `/users/{id}/unlock` | Creation, role update, enable/disable, unlock and admin guardrails passed; old JWT still works after disable |
| Audit log page | `/audit-events` | Persisted events, pagination/filter queries and Admin/DevOps access work |
| Live updates | `/events/stream` | Authenticated SSE worked through Nginx; `ready` and `application.created` received |
| Infrastructure inventory | None found | Hardcoded resource list and metrics; refresh and resource action buttons have no handlers |
| Infrastructure resource request | None found | Submit only changes React state and shows fixed `REQ-2409`; no record, approval, provisioning or audit event is created |
| Monitoring and alert policies | None found | Hardcoded charts, latency, throughput, uptime and policy values; refresh button has no handler |
| Header global search | None found | Input is rendered without search state, submit handler, results, or API request |
| Header notifications | None found | Bell button has no click handler or notification feed API |
| Remember-me checkbox | No distinct behavior | Value is not passed to login/signup; session storage always uses `localStorage` |
| Theme switch | Local frontend context | Frontend-only preference by design; not a missing backend. Not interactively tested in this audit |

Paths in the table are relative to `/api/v1`.

## Confirmed API failures

### F1 — Signup accepts an inadequately short password

Priority: High. A direct signup request with a one-character password returned **HTTP 200** and issued a session. The expected validation response is HTTP 400. The frontend's six-character rule can be bypassed by calling the API directly; admin-created users and password changes already use a stronger 8–72-character letter-and-number rule.

Source: [Signup DTO](../Backend/src/main/java/com/platformops/auth/AuthDtos.java#L16), [signup service](../Backend/src/main/java/com/platformops/auth/AuthService.java#L104), [frontend signup schema](../Frontend/src/pages/Signup.tsx#L18).

Recommended fix: apply a consistent backend password policy to signup and align the frontend validation with it. Add regression tests for short, blank and nonconforming passwords.

### F2 — Overlong signup password causes a server error

Priority: Medium. An 80-character ASCII password passed DTO validation and returned **HTTP 500**, rather than HTTP 400. The signup DTO permits up to 128 characters while the configured BCrypt encoder rejects inputs over its 72-byte limit.

Source: [Signup DTO](../Backend/src/main/java/com/platformops/auth/AuthDtos.java#L17), [password encoding](../Backend/src/main/java/com/platformops/auth/AuthService.java#L109).

Recommended fix: validate the encoded byte length before BCrypt encoding and return a field-level validation response. Include Unicode cases, whose byte length can exceed their character count.

### F3 — Disabling an account does not invalidate its existing access token

Priority: High. After an administrator disabled a synthetic user, new logins were correctly blocked, but an access token issued before disable still returned **HTTP 200** from the protected application-list API. Expected security behavior for immediate account disable is HTTP 401 or 403.

The update service revokes refresh tokens. JWT verification trusts the role and identity in the signed token without checking current account state, so the old token can remain usable until expiry (default 15 minutes, with configured clock skew). Role changes and logout also do not provide immediate access-token invalidation by this mechanism; those additional scenarios were identified from source, not separately asserted here.

Source: [user changes and refresh revocation](../Backend/src/main/java/com/platformops/user/UserService.java#L71), [JWT authentication](../Backend/src/main/java/com/platformops/security/JwtAuthenticationFilter.java#L47), [JWT parsing](../Backend/src/main/java/com/platformops/security/JwtService.java#L74).

Recommended fix: check active account state/token version during authentication, or implement access-token revocation. Add tests that use a previously issued token after disable, role downgrade, password change and logout.

## Missing and partial features

### F4 — Infrastructure and Monitoring have no backend

Priority: High for feature completeness. These routed pages render constants. Their refresh controls do not refresh data. Infrastructure requests display a success message without persistence, and the request checklist and recent requests are hardcoded.

Source: [Infrastructure constants and page](../Frontend/src/pages/PlatformPages.tsx#L208), [Monitoring constants and page](../Frontend/src/pages/PlatformPages.tsx#L219), [Infrastructure request form](../Frontend/src/pages/DetailPages.tsx#L214).

Recommended fix: implement resource/request/monitoring APIs and wire the controls to them, or clearly label these screens as demonstrations and remove misleading submission confirmations.

### F5 — UI deployments simulate external systems

Priority: High if real deployments are required. `SimulatedPipeline` implements all three external adapters. It generates a commit SHA and emits realistic Jenkins, Docker, registry and kubectl log messages. It does not clone/build the registered repository, push an actual image, deploy a real workload, or collect real service telemetry. Figures such as test counts and latency in those logs are simulated.

Source: [Simulated pipeline](../Backend/src/main/java/com/platformops/deployment/pipeline/SimulatedPipeline.java#L12).

The repository's separate Jenkinsfile is not evidence that clicking Deploy calls Jenkins. The audited application uses the simulator bean. Environment health and pod counts are seeded or updated by the simulator, not read from a live cluster.

Recommended fix: add real `BuildServer`, `ImageRegistry` and `ClusterDeployer` adapters and test them against the intended environment. Until then, label the pipeline as simulated in demonstrations.

### F6 — Incomplete controls and misleading environment details

Priority: Medium. Global search and notifications have no behavior. Remember-me is ignored. Environment details show hardcoded capacity and node inventory, use fallback healthy data without a clear error state, and format available pod count as both running and desired count. The page describes a manual approval gate, but no approval workflow exists.

Source: [header controls](../Frontend/src/components/Layout.tsx#L65), [session persistence](../Frontend/src/lib/session.ts#L26), [environment values](../Frontend/src/pages/DetailPages.tsx#L245), [hardcoded node inventory](../Frontend/src/pages/DetailPages.tsx#L464).

Recommended fix: connect or disable the unused controls, make session persistence follow the checkbox, show loading/error states, and use real running/desired resource data when available.

## Audit logging assessment

**Yes, an actual backend audit log exists.** It uses an `audit_events` database table, repository, transactional service, secured controller, and an API-connected frontend page at `/audit-logs`.

Verified on PostgreSQL:

- Admin and DevOps can read audit events; Developer and Viewer receive HTTP 403.
- Application creation/update/deletion, deployment requests/success/failure/rollback/cancel requests, incidents, user changes, signup/login failures/lockout, password change, refresh-token reuse and logout-all produced expected events.
- Action, actor, entity and text filters returned matching records.
- Event responses contain actor, action, entity and timestamp fields; the schema also supports details and client IP. Background events may lack a client IP.
- No delete API is exposed for audit events.

### F7 — The audit trail is not database-enforced immutable

Priority: High if the project claims an immutable audit trail. An SQL update through the application database role succeeded on a test audit row. The transaction was rolled back, leaving the record unchanged. API read-only access does not prevent database-level changes. No append-only trigger, restricted writer role, hash chain or external immutable store was found.

Evidence: [Rolled-back database probe](audit/audit-immutability-probe.txt). Source: [audit table migration](../Backend/src/main/resources/db/migration/V1__init_schema.sql#L128).

Recommended fix: use a restricted application role and enforce append-only writes for audit data, or send events to a separate protected store. Define retention and backup requirements before claiming immutability.

### F8 — Audit viewing is implemented; audit report export and some coverage are missing

Priority: Medium. There is no audit CSV/PDF export, date-range UI filter, or separate report endpoint. The action dropdown omits existing actions including `SIGNUP`, `USER_UNLOCKED`, `TOKEN_REUSE_DETECTED`, `LOGIN_BLOCKED`, and `LOGOUT_ALL`; text search can still find matching action strings. Normal logout revokes the refresh token but does not record a logout audit event. Final cancellation has no separate completion event, although its request is audited and deployment state is updated.

Source: [audit page action dropdown](../Frontend/src/pages/AuditLog.tsx#L11), [audit controller](../Backend/src/main/java/com/platformops/audit/AuditController.java#L22), [normal logout](../Backend/src/main/java/com/platformops/auth/AuthService.java#L140), [cancellation completion](../Backend/src/main/java/com/platformops/deployment/DeploymentStateService.java#L152).

Recommended fix: decide which events must be audited, add missing events and dropdown values, and implement export/date filters if required for the project submission. The Markdown file you are reading is a project assessment, not an implemented in-app export feature.

## Other observations

- Frontend build emits a large-chunk warning: approximately 1,002 kB of main JavaScript, 289 kB gzip. Route-based splitting is worth considering.
- Lint has three React Fast Refresh warnings and no errors.
- README versions are stale: frontend manifests use React 18 and Vite 8; backend Maven compilation targets Java 17 while containers use Java 21. Use the manifests and Dockerfiles for setup details.
- Existing tests cover many service/API behaviors but have no frontend test suite and do not catch the three API failures found here.

## Recommended order of work

1. Fix signup validation and define immediate account/session revocation behavior, with regression tests.
2. Implement or clearly identify the incomplete Infrastructure, Monitoring and request features.
3. Replace simulated adapters if real CI/CD integration is part of the requirements.
4. Define audit guarantees and close the immutability, event and export gaps.
5. Complete missing UI controls, frontend workflows and browser regression tests.

## Reproduce the checks

From the project root in PowerShell, with Docker Desktop running and the application images already built:

```powershell
# Fresh temporary PostgreSQL database on each clean run.
docker compose -f docs/audit/compose.audit.yaml up -d --wait
python docs/audit/api_audit.py

# Stop only the disposable audit stack after reviewing results.
docker compose -f docs/audit/compose.audit.yaml down
```

The API audit script writes synthetic records, so run it only against this disposable stack. It exits with status 1 when assertions fail. For another run, bring this stack down and up to get a clean tmpfs database. It does not mount or remove the main application's database volume.

Run the existing tests and frontend checks separately:

```powershell
Push-Location Backend
.\mvnw.cmd -B -ntp test
Pop-Location

Push-Location Frontend
npm.cmd run build
npm.cmd run lint
Pop-Location
```

## Scope limits

This is a functional/API and source-wiring audit, with one visual dashboard observation. Full browser click-through testing was not completed because the browser was receiving concurrent user input. Theme persistence, every form interaction, responsive layouts, accessibility, load testing, real external CI/CD/cloud integration and full security assurance are not certified. The application source was not changed to fix the findings. Added files are the report, reproducible audit tooling and sanitized evidence.

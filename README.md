# PlatformOps

Release control for platform teams: register services, deploy them through dev → staging → production, handle incidents, and see who did what.

- **Frontend** (`Frontend/`): React + Vite + TypeScript
- **Backend** (`Backend/`): Java 21 + Spring Boot REST API (Spring Security, JWT, BCrypt, Spring Data JPA, Flyway)
- **Database**: PostgreSQL

## Run it

**1. Database**: PostgreSQL running locally with a database `platformops`, user `platformops`, password `platformops` (defaults can be changed with `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`).

**2. Backend** (JDK 21 + Maven, or open `Backend/` in IntelliJ and run `PlatformOpsApplication`):

```
cd Backend
mvn spring-boot:run
```

API: http://localhost:8080 · docs: http://localhost:8080/swagger-ui.html

**3. Frontend**:

```
cd Frontend
npm install
npm run dev
```

App: http://localhost:5173

## Demo accounts

Created automatically on an empty database:

| Email | Password | Role |
|---|---|---|
| admin@platformops.dev | `Admin@12345` | Admin |
| nimal@platformops.dev | `Demo@12345` | DevOps |
| aisha@platformops.dev | `Demo@12345` | Developer |
| ravi@platformops.dev | `Demo@12345` | Viewer |

## Tests

```
cd Backend
mvn verify
```

Uses an in-memory H2 database, so PostgreSQL isn't needed for tests.

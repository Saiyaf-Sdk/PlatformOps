## Description
<!-- Provide a clear, concise summary of the problem this PR addresses or the feature it introduces. -->

## Changes Made
<!-- Bullet list of specific modifications made in this PR -->
- 

## Type of Change
- [ ] `feat`: A new user-facing feature or API capability
- [ ] `fix`: A bug fix
- [ ] `refactor`: Code change that neither fixes a bug nor adds a feature
- [ ] `test`: Adding missing tests or correcting existing tests
- [ ] `docs`: Documentation updates only
- [ ] `chore`: Tooling, dependency, or config update
- [ ] `devops`: Infrastructure, containerization, or deployment setup

## Testing Performed
<!-- Describe the tests you ran to verify your changes. Include commands and outputs where relevant. -->
- [ ] Backend tests passed (`mvn clean test` in `Backend/`)
- [ ] Frontend build succeeded (`npm run build` in `Frontend/`)
- [ ] Manual verification in browser / Postman

## Screenshots / Evidence (Frontend UI)
<!-- If changes affect the UI, attach before/after screenshots or brief recordings. Otherwise, write N/A. -->
- N/A

## Database Changes
<!-- Are there Flyway migration scripts added or schema modifications? -->
- [ ] No database changes required
- [ ] Flyway migration script added (`V<X>__description.sql`)
- [ ] Backward compatibility verified

## Security Considerations
- [ ] No secrets, credentials, or API keys are committed in code or config
- [ ] Environment variable changes are reflected in `.env.example`
- [ ] Input validation and authorization checks are in place

## Peer Review Checklist (Two-Member Workflow)
- [ ] PR branch branched from `develop` (`feature/*`, `fix/*`, `devops/*`, `docs/*`)
- [ ] Commit messages follow the conventional commit format (`feat:`, `fix:`, etc.)
- [ ] PR title is descriptive and follows the commit convention
- [ ] Code has been self-reviewed by the author
- [ ] Peer review requested (Sajath ↔ Saiyaf)

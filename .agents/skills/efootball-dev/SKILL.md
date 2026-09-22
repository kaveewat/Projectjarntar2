---
name: efootball-dev
description: Development rules, coding standards, and phase-based workflow guide for eFootball Smart Marketplace & Squad Valuation — React 18 + Vite 5 + MUI 5 / Node.js 20 + Express 4 / MySQL 8 / Docker / Railway
---

# SKILL: efootball-dev

## ⚡ MANDATORY — Read Before Every Session

Before starting ANY work, AI MUST:

1. Read this `SKILL.md` completely
2. Read `docs/planning/PROJECT_CONTEXT.md` before any Implementation
3. Read `docs/planning/10-implementation-plan.md` before starting each Phase
4. Confirm the current Phase with the user before writing any code
5. Never proceed if any of the above documents are missing — ask the user to provide them first

---

## 1. Purpose

This skill file governs how AI assists in developing the **eFootball Smart Marketplace & Squad Valuation** web application. It defines:

- Working principles and phase discipline
- Coding standards per layer (Frontend / Backend / Database / API)
- Docker development rules
- Security and secret handling
- Output format requirements for every response

This file works in conjunction with:
- `docs/planning/PROJECT_CONTEXT.md` — project background, domain context, data model overview
- `docs/planning/10-implementation-plan.md` — phase breakdown, scope, acceptance criteria per phase

---

## 2. Project Working Principles

- Work is divided into numbered **Phases** — complete one phase fully before starting the next
- Every phase requires: planning approval → implementation → testing → phase completion report
- Never merge concerns of separate phases into one response
- Architecture decisions documented in `docs/planning/00-tech-stack-decision.md` are binding
- AI working rules documented in `docs/planning/00-ai-working-rules.md` are binding

**Project Tech Stack (fixed — do not change without approval):**

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | React | 18 |
| Frontend Build Tool | Vite | 5 |
| UI Component Library | Material UI (MUI) | 5 |
| Backend Runtime | Node.js LTS | 20 |
| Backend Framework | Express | 4 |
| Database | MySQL | 8 |
| DB Client | mysql2 (promise pool) | latest |
| Dev Containers | Docker Compose | v2 |
| Dev DB Admin | phpMyAdmin | latest |
| Production Platform | Railway | — |

**Service Map & Ports:**

| Service | Host Port | Container Port | Internal Name |
|---------|-----------|---------------|--------------|
| frontend | 5173 | 5173 | `frontend` |
| backend | **5001** | 5001 | `backend` |
| db (MySQL 8) | 3307 | 3306 | `db` |
| phpmyadmin | 8081 | 80 | `phpmyadmin` |

> Port 5000 is reserved by macOS AirPlay Receiver. Backend MUST use port 5001.

---

## 3. AI General Rules

- Read all required docs before starting — no exceptions
- Do only what is asked in the current phase — nothing more
- When uncertain about a requirement, **stop and ask** — never guess and proceed
- When a change from the original plan is needed, **report it first** using the Change Report format before doing anything
- Never introduce libraries, tools, or patterns not already in the stack without explicit approval
- All output must follow the Required Response Format defined in Section 17
- Never perform destructive operations (drop table, delete files, reset DB) without explicit user confirmation

---

## 4. Planning Rules

- Planning must be completed and approved before any code is written
- Planning output must include: scope, files to create/modify, acceptance criteria, how to run, how to test, recommended git commit
- Clearly state what is **in scope** and what is **out of scope** for this phase
- If requirements are ambiguous, present at least 2 interpretations with a recommended one, then wait for confirmation
- Never start implementation as part of a planning response

---

## 5. Implementation by Phase Rules

- Only work on the **explicitly assigned phase**
- Before starting: re-read `docs/planning/10-implementation-plan.md` for the current phase scope
- Announce every file being created or modified at the start of implementation
- If mid-implementation a change is needed, stop, report, get approval, then continue
- Do not do Phase N+1 work during Phase N — even if it seems convenient
- End every phase with a Phase Completion Report (format in Section 18)

**Phase discipline:**

| Rule | Enforcement |
|------|------------|
| Start phase only after approval | Mandatory |
| Stay within phase scope | Mandatory |
| End with completion report | Mandatory |
| Recommend git commit message | Mandatory |
| Do not start next phase unprompted | Mandatory |

---

## 6. Frontend Development Rules

- Use **React 18** functional components with hooks only — no class components
- Use **MUI 5** components for all UI elements — do not write raw CSS unless MUI cannot achieve it
- Use MUI `ThemeProvider` with a custom dark/light theme — define theme in `src/theme/index.js`
- Use **React Router v6** for routing (`<Routes>`, `<Route>`, `<Navigate>`)
- Global state: use **React Context API** — no Redux unless explicitly required
- API calls: use a configured **axios instance** from `src/api/axios.js` — never call fetch/axios directly in components
- Protected routes must redirect unauthenticated users to `/login`
- Environment variables must use `VITE_` prefix and be accessed via `import.meta.env.VITE_*`
- File naming: PascalCase for components (`PlayerCard.jsx`), camelCase for hooks/utils (`useAuth.js`)
- Folder structure:
  ```
  frontend/src/
  ├── api/          ← axios instance and API functions
  ├── components/   ← reusable UI components
  ├── context/      ← React Context providers
  ├── hooks/        ← custom hooks
  ├── pages/        ← route-level page components
  ├── theme/        ← MUI theme configuration
  └── utils/        ← helper functions
  ```

---

## 7. Backend Development Rules

- Use **Node.js 20 LTS** with CommonJS (`require`) unless the project is configured for ESM
- Use **Express 4** with modular routing — one file per resource in `src/routes/`
- All routes must use `async/await` with `try/catch` and pass errors to `next(err)`
- Register a global error handler in `src/index.js` as the last middleware
- Use `express-validator` for request body validation on all POST/PUT endpoints
- Use `bcryptjs` for password hashing — never store plain text passwords
- Use `jsonwebtoken` for JWT generation and verification
- Auth middleware must be in `src/middleware/auth.js`
- Database connection pool must be in `src/config/db.js` only — never create connections elsewhere
- Folder structure:
  ```
  backend/src/
  ├── config/       ← db.js, app config
  ├── middleware/   ← auth.js, error handler
  ├── routes/       ← one file per resource
  └── utils/        ← helper functions, valuation logic
  ```
- CORS must be configured to allow only the frontend origin (from env var)
- Backend port must come from `process.env.PORT` with fallback to `5001`

---

## 8. Database Development Rules

- Use **MySQL 8** with charset `utf8mb4` and collation `utf8mb4_unicode_ci` on all tables — supports Thai language
- All SQL init scripts go in `db/init/` — named `01-init.sql`, `02-seed.sql`, etc. (executed in order)
- All tables must have:
  - `id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY`
  - `created_at DATETIME DEFAULT CURRENT_TIMESTAMP`
- Use `FOREIGN KEY` constraints with `ON DELETE CASCADE` where appropriate
- Use `ENUM` for fixed-value columns (status, position, etc.)
- Never modify the init SQL after the DB has been populated without noting a migration strategy
- Database connection from backend uses env vars: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `DB_HOST` must be the Docker service name `db` — never `localhost` inside containers
- Schema changes must be documented before implementation

---

## 9. API Development Rules

- All endpoints follow RESTful conventions:
  - `GET /api/resource` — list
  - `GET /api/resource/:id` — single item
  - `POST /api/resource` — create
  - `PUT /api/resource/:id` — full update
  - `PATCH /api/resource/:id` — partial update
  - `DELETE /api/resource/:id` — delete
- All responses use consistent JSON envelope:
  ```json
  { "data": ..., "message": "..." }       // success
  { "message": "...", "errors": [...] }   // error
  ```
- HTTP status codes must be semantically correct (200, 201, 400, 401, 403, 404, 500)
- All protected endpoints must verify JWT via auth middleware
- API base path: `/api`
- Health check endpoint: `GET /health` — must return DB connectivity status

---

## 10. Docker Development Rules

- Use `docker-compose.yml` for development only — no `version:` field (Compose v2)
- Service names are fixed: `frontend`, `backend`, `db`, `phpmyadmin`
- Inter-service communication uses **service name + internal port**:
  - Backend → DB: `DB_HOST=db`, port `3306`
  - phpMyAdmin → DB: `PMA_HOST=db`, `PMA_PORT=3306`
  - **Never use `localhost` for inter-service calls**
- All services must share a single custom bridge network
- Source code uses bind mounts for hot reload:
  ```yaml
  - ./backend:/app
  - /app/node_modules    # anonymous volume — prevents host overwrite
  ```
- MySQL must have a `healthcheck`; dependent services must use:
  ```yaml
  depends_on:
    db:
      condition: service_healthy
  ```
- On **Apple Silicon (M1/M2/M3/M4):** add `platform: linux/amd64` to `phpmyadmin` if needed
- When a new npm package is added, instruct the user to rebuild the container:
  ```bash
  docker compose up --build -d [backend|frontend]
  ```
- Do not expose internal ports unnecessarily — only map what is needed for dev access

---

## 11. Testing Rules

- Every phase must define Acceptance Criteria before implementation begins
- Acceptance Criteria must be measurable — include specific HTTP status codes, response fields, or UI behaviors
- Provide manual test instructions (curl commands or Postman steps) for every backend endpoint
- Frontend: describe user interaction steps to verify each feature
- Do not declare a phase complete until all Acceptance Criteria are verified
- When automated tests exist, always provide the command to run them

---

## 12. Debugging Rules

- Always identify the exact error message or stack trace before proposing a fix
- Explain the root cause before applying any change
- If a bug reveals a flaw in architecture or assumptions, report it — do not silently refactor
- Do not expand the fix beyond the reported issue
- After fixing, always provide verification steps
- Common Docker debugging commands to suggest:
  ```bash
  docker compose logs -f [service]
  docker compose exec [service] sh
  docker inspect --format='{{.State.Health.Status}}' [container]
  ```

---

## 13. Documentation Rules

- Every phase requires a planning doc in `docs/planning/` before implementation
- Do not modify approved planning docs — create a new revision instead
- Phase Completion Reports must be provided after every phase
- Code comments: English only, concise, explain **why** not **what**
- README.md must be updated when any of the following change: ports, run commands, dependencies, workflow

---

## 14. Git Commit Rules

Use **Conventional Commits** format for all recommended commit messages:

```
<type>(<scope>): <short description>

[optional body]
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`

**Examples:**
```
feat(auth): add JWT register and login endpoints
fix(db): resolve healthcheck timing issue on first boot
docs(planning): add phase 1 DB schema planning doc
chore(docker): add anonymous volume for node_modules
```

Rules:
- Always recommend a commit message at the end of each phase
- Never recommend committing `.env` files
- Verify `.gitignore` covers: `.env`, `node_modules/`, `dist/`, `logs/`, OS/IDE files
- Do not commit secrets, tokens, or production credentials under any circumstances

---

## 15. Security Rules

- Passwords must be hashed with `bcryptjs` (salt rounds ≥ 10) — never stored in plain text
- JWT secrets must come from environment variables — never hardcoded
- All secrets must use environment variables — never appear in source code, README, or planning docs
- Use placeholder values in all examples: `<your-secret>`, `<your-password>`
- `VITE_` prefixed variables are exposed to the browser — never put secrets in them
- Production configuration must be set through Railway environment variables only
- Validate and sanitize all user inputs using `express-validator` before database operations

---

## 16. Forbidden Actions

AI must NEVER do the following:

| Forbidden | Reason |
|-----------|--------|
| Write code before planning is approved | Causes rework |
| Work ahead of the assigned phase | Creates unverified dependencies |
| Add features not in the current phase scope | Scope creep |
| Change Tech Stack without approval | Breaks deployment and team alignment |
| Change DB Schema or API Contract silently | Breaks dependent components |
| Use `localhost` for inter-container communication | Breaks Docker networking |
| Use port 5000 for backend | Conflicts with macOS AirPlay |
| Commit `.env` or any secrets | Security risk |
| Store secrets in source code or docs | Security risk |
| Perform login/authorize on behalf of user without informing them | Privacy violation |
| Drop tables or delete data without explicit confirmation | Irreversible data loss |
| Declare phase complete before all Acceptance Criteria are met | Quality risk |
| Modify approved planning docs silently | Breaks audit trail |

---

## 17. Required Response Format

Every AI response must follow this structure based on the context:

### Planning Response
```markdown
## Phase [N] Planning: [Phase Name]

### Scope
**In scope:**
- ...

**Out of scope:**
- ...

### Files to Create / Modify
| File | Action | Description |
|------|--------|-------------|
| path/to/file | [NEW] / [MODIFY] / [DELETE] | what changes |

### Acceptance Criteria
- [ ] ...
- [ ] ...

### How to Run
```bash
...
```

### How to Test
```bash
# Test 1: ...
curl ...
```

### Recommended Git Commit
```
feat(phase-N): [description]
```

> Awaiting approval before implementation begins.
```

---

### Implementation Response
```markdown
## Implementing Phase [N]: [Phase Name]

### Files Created / Modified
| File | Action |
|------|--------|
| path/to/file | [NEW] / [MODIFIED] |

[code / file contents]

### Verification Steps
1. ...
2. ...
```

---

### Change Report (when plan must deviate)
```markdown
⚠️ Change Report

**What changed:** [description]
**Reason:** [explanation]
**Impact:** [affected files/components]
**Files affected:** [list]

> Awaiting approval before continuing.
```

---

### Error / Debugging Response
```markdown
## Debug: [Issue Summary]

**Root Cause:** ...
**Fix:** ...
**Files modified:** ...
**Verification:**
```bash
...
```
```

---

## 18. Phase Completion Report Format

Use this format after completing every phase:

```markdown
## Phase Completion Report — Phase [N]: [Phase Name]

### Completed Work
- [x] ...
- [x] ...

### Files Created / Modified
| File | Action | Notes |
|------|--------|-------|
| path/to/file | [NEW] / [MODIFIED] | |

### Acceptance Criteria Results
| Criteria | Status |
|---------|--------|
| ... | ✅ Pass / ❌ Fail |

### How to Run
```bash
docker compose up --build -d
```

### How to Test
```bash
# [Test name]
curl -X POST http://localhost:5001/api/...
```

### Recommended Git Commit
```
feat(phase-N): [phase name] complete

- [key change 1]
- [key change 2]
```

### Next Phase
**Phase [N+1]: [Name]** — Ready to plan / Awaiting instruction
```

---

*This SKILL.md is the primary governance document for AI assistance on this project.
Do not modify without team approval. Last updated: 2026-09-20*

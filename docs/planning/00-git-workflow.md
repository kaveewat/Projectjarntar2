# 00 — Git Workflow & Commit Rules

**Project:** eFootball Smart Marketplace & Squad Valuation
**Document Type:** Git Governance
**Status:** Active
**Last Updated:** 2026-09-20

---

## วัตถุประสงค์

เอกสารนี้กำหนดกติกา Git สำหรับโปรเจกต์ที่พัฒนาร่วมกับ AI
เพื่อให้มีจุดย้อนกลับชัดเจนหลังจบแต่ละ Planning Step และ Implementation Phase
ป้องกันการสูญหายของงาน และรักษา history ที่อ่านเข้าใจได้

---

## 1. Branch Strategy

### Branches หลัก

| Branch | วัตถุประสงค์ | ใครเขียน | Merge ไปที่ |
|--------|-----------|---------|-----------|
| `main` | Production-ready code เท่านั้น | ผ่าน merge request | — |
| `develop` | Integration branch สำหรับ dev | feature branches | `main` |
| `feature/phase-N-name` | งานของแต่ละ Phase | AI + Developer | `develop` |
| `fix/issue-description` | Bug fixes | AI + Developer | `develop` หรือ `main` |
| `docs/document-name` | งาน documentation เท่านั้น | AI + Developer | `develop` |

### กฎ

- `main` ต้องผ่านการทดสอบและ approve เสมอก่อน merge
- ห้าม commit โดยตรงบน `main` โดยไม่มี review
- ทุก Phase ของ implementation ใช้ branch `feature/phase-N-name` แยกกัน
- เมื่อจบ Phase ให้ merge กลับ `develop` แล้วสร้าง branch ใหม่สำหรับ Phase ถัดไป

### ตัวอย่างชื่อ Branch

```
docs/phase-0-governance
feature/phase-1-database-setup
feature/phase-2-backend-auth
feature/phase-3-backend-features
feature/phase-4-frontend-foundation
feature/phase-5-frontend-features
fix/mysql-healthcheck-timing
fix/cors-origin-mismatch
```

---

## 2. Commit Convention

โปรเจกต์นี้ใช้ **Conventional Commits** (https://www.conventionalcommits.org)

### Types ที่ใช้

| Type | ใช้เมื่อ | ตัวอย่าง |
|------|---------|---------|
| `feat` | เพิ่ม feature ใหม่ | `feat(auth): add JWT login endpoint` |
| `fix` | แก้ bug | `fix(db): resolve connection pool timeout` |
| `docs` | แก้หรือเพิ่มเอกสาร | `docs: add system overview planning` |
| `chore` | งาน maintenance, config, deps | `chore(docker): update compose port mapping` |
| `refactor` | refactor โดยไม่เปลี่ยน behavior | `refactor(routes): extract middleware to separate file` |
| `test` | เพิ่มหรือแก้ test | `test(api): add player endpoint test cases` |
| `style` | format, whitespace (ไม่เปลี่ยน logic) | `style: fix indentation in marketplace route` |
| `perf` | ปรับปรุง performance | `perf(query): add index on player rating column` |

---

## 3. Commit Message Format

### โครงสร้าง

```
<type>(<scope>): <short description>

[optional body — อธิบาย what และ why]

[optional footer — breaking changes, issue refs]
```

### กฎ

| กฎ | รายละเอียด |
|----|----------|
| บรรทัดแรก | ≤ 72 ตัวอักษร |
| Short description | imperative mood: "add", "fix", "update" — ไม่ใช่ "added", "fixed" |
| Scope | optional — ระบุ module ที่เปลี่ยน เช่น `auth`, `db`, `frontend`, `docker` |
| Body | อธิบายทำไมเปลี่ยน ไม่ใช่แค่ทำอะไร |
| ภาษา | อังกฤษเท่านั้น |
| Breaking change | ระบุ `BREAKING CHANGE:` ใน footer |

### ตัวอย่างที่ดี

```
feat(auth): add bcrypt password hashing on register

Use bcryptjs with salt rounds 12 instead of plain text
to comply with security requirements in planning doc.
```

```
fix(docker): add healthcheck condition to backend depends_on

Backend was starting before MySQL was ready, causing
connection refused errors on first boot.
```

### ตัวอย่างที่ไม่ดี

```
update stuff                      ← ไม่มี type, ไม่ชัดเจน
feat: fixed the bug               ← type ผิด, tense ผิด
FEAT: ADD LOGIN                   ← uppercase ไม่ถูกต้อง
```

---

## 4. When to Commit

### หลักการ: Commit เล็ก บ่อย มีความหมาย

| Commit เมื่อ | ตัวอย่าง |
|-----------|---------|
| จบ Planning doc หนึ่งไฟล์ | หลังสร้าง `05-database-design.md` |
| จบ Planning Step ทั้งหมดใน Phase | หลังทำ Planning Phase 1 เสร็จ |
| สร้าง/แก้ไขไฟล์ที่เกี่ยวข้องกันกลุ่มหนึ่ง | DB schema + init script ด้วยกัน |
| แก้ bug หนึ่งจุด | แก้แล้ว ทดสอบผ่าน |
| จบ Implementation Phase | ทุก acceptance criteria ผ่าน |

### ห้าม Commit เมื่อ

| ห้าม | เหตุผล |
|-----|-------|
| Code ยัง error / ไม่ compile | ทำให้ history ใช้ไม่ได้ |
| ยังไม่ได้ทดสอบ feature | อาจ break ผู้อื่น |
| Acceptance Criteria ยังไม่ผ่านครบ | Phase ยังไม่จบจริง |
| มีไฟล์ที่ไม่ควร commit ติดมา | เช่น `.env`, `node_modules` |

---

## 5. Commit per Planning Step

ทุก Planning document ที่สร้างหรือ approve ให้ commit ทันที
เพื่อสร้างจุดย้อนกลับก่อนเริ่ม implementation

| Planning Step | Recommended Commit |
|--------------|-------------------|
| สร้าง `00-tech-stack-decision.md` | `docs: add tech stack decision` |
| สร้าง `00-ai-working-rules.md` | `docs: add AI working rules` |
| สร้าง `00-documentation-structure.md` | `docs: add documentation structure` |
| สร้าง `00-git-workflow.md` | `docs: add git workflow and commit rules` |
| สร้าง `01-system-overview.md` | `docs: add system overview` |
| สร้าง `02-requirements.md` | `docs: add functional and non-functional requirements` |
| สร้าง `03-roles-permissions.md` | `docs: add roles and permissions matrix` |
| สร้าง `04-complaint-workflow.md` | `docs: add business workflow and state machine` |
| สร้าง `05-database-design.md` | `docs: add database design and ERD` |
| สร้าง `06-api-contract.md` | `docs: add API contract and endpoint spec` |
| สร้าง `07-frontend-pages.md` | `docs: add frontend pages and routing plan` |
| สร้าง `08-dashboard-report-notification.md` | `docs: add dashboard and notification spec` |
| สร้าง `09-project-docker-architecture.md` | `docs: add docker architecture and service map` |
| สร้าง `PROJECT_CONTEXT.md` | `docs: add project context quick reference` |
| สร้าง `10-implementation-plan.md` | `docs: add implementation plan with phase breakdown` |
| Phase 0 Planning ครบทั้งหมด | `chore: complete phase 0 governance and planning setup` |

---

## 6. Commit per Implementation Phase

ทุก Phase ต้องมี commit อย่างน้อย 2 จุด:
1. **หลัง Planning approve** — commit planning docs
2. **หลัง Implementation เสร็จ** — commit code + completion report

| Phase | Recommended Commit |
|-------|-------------------|
| Phase 0 — Governance | `chore: complete phase 0 project governance setup` |
| Phase 1 — Database | `feat: complete phase 1 database schema and init script` |
| Phase 2 — Backend Auth | `feat: complete phase 2 backend auth and middleware` |
| Phase 3 — Backend Features | `feat: complete phase 3 players squads marketplace api` |
| Phase 4 — Frontend Foundation | `feat: complete phase 4 frontend auth and routing` |
| Phase 5 — Frontend Features | `feat: complete phase 5 frontend pages and marketplace ui` |
| Phase 6 — Integration | `test: complete phase 6 integration and e2e verification` |
| Phase 7 — Deploy | `chore: complete phase 7 railway production deployment` |

### Commit ระหว่าง Phase (mid-phase checkpoints)

สำหรับ Phase ที่ใหญ่ แนะนำให้ commit เป็นกลุ่ม:

```
feat(phase-3): add players API with filter and search
feat(phase-3): add squads API with valuation endpoint
feat(phase-3): add marketplace API with buy/sell flow
feat(phase-3): complete phase 3 backend features
```

---

## 7. Commit after Bug Fix

| กรณี | Recommended Commit |
|-----|-------------------|
| แก้ bug ทั่วไป | `fix(scope): resolve [issue description]` |
| แก้ DB connection | `fix(db): resolve backend database connection` |
| แก้ CORS | `fix(backend): correct cors origin configuration` |
| แก้ Docker port | `chore(docker): fix port mapping in compose file` |
| แก้ healthcheck | `fix(docker): add service_healthy condition to depends_on` |
| แก้ env var | `fix(config): correct db host to use docker service name` |
| แก้ node_modules | `chore(docker): add anonymous volume for node_modules` |
| Hotfix บน main | `fix(hotfix): [description] — urgent production fix` |

### กระบวนการ Bug Fix

```
1. ระบุ bug ชัดเจน
2. สร้าง branch: fix/[description]
3. แก้ไข
4. ทดสอบยืนยัน
5. commit ด้วย fix: ...
6. merge กลับ develop (หรือ main ถ้า hotfix)
```

---

## 8. Rollback Strategy

### ย้อนกลับไป Commit ก่อนหน้า (อ่านเท่านั้น)

```bash
# ดู commit history
git log --oneline -20

# ดูความต่างระหว่าง commit
git diff <commit-hash> HEAD
```

### Rollback ไฟล์เดียว

```bash
git checkout <commit-hash> -- path/to/file
```

### Rollback ทั้ง branch ไป commit ที่ต้องการ (soft — เก็บ changes)

```bash
git reset --soft <commit-hash>
```

### Rollback ทั้ง branch ไป commit ที่ต้องการ (hard — ลบ changes)

```bash
git reset --hard <commit-hash>
```

> [!CAUTION]
> `git reset --hard` จะทำให้ changes หลัง commit นั้นหายถาวร
> ใช้เมื่อแน่ใจเท่านั้น — แนะนำให้ backup branch ก่อน

### สร้าง Revert Commit (safe — ไม่ลบ history)

```bash
# Revert commit เดียว
git revert <commit-hash>

# Revert หลาย commit
git revert <oldest-hash>..<newest-hash>
```

### Strategy ตามสถานการณ์

| สถานการณ์ | วิธี |
|---------|-----|
| เพิ่งแก้ไขแต่ยังไม่ commit | `git checkout -- .` หรือ `git restore .` |
| Commit ผิด ยังไม่ push | `git reset --soft HEAD~1` แก้แล้ว commit ใหม่ |
| Push แล้ว แต่ branch ยังไม่ merge | force push หลัง reset (ระวัง) |
| Merge บน main แล้ว | `git revert` เพื่อสร้าง revert commit |
| ต้องการดู code ณ Phase ใด | `git checkout <tag-or-commit>` |

### การ Tag แต่ละ Phase (แนะนำ)

```bash
git tag phase-0-complete
git tag phase-1-complete
git push origin --tags
```

ทำให้ rollback ไป Phase ใดก็ได้ง่ายขึ้น

---

## 9. Files that Should Be Committed

| ประเภท | ตัวอย่าง |
|-------|---------|
| Source code ทั้งหมด | `backend/src/**`, `frontend/src/**` |
| Configuration files | `package.json`, `vite.config.js`, `docker-compose.yml` |
| Dockerfile | `Dockerfile`, `backend/Dockerfile.dev`, `frontend/Dockerfile.dev` |
| Environment template | `.env.example` (ไม่มีค่าจริง) |
| Git ignore | `.gitignore` |
| Documentation | `docs/**/*.md`, `README.md` |
| DB init scripts | `db/init/*.sql` |
| Skill files | `.agents/skills/**` |
| Planning docs | `docs/planning/*.md` |

---

## 10. Files that Should Not Be Committed

| ไฟล์/โฟลเดอร์ | เหตุผล |
|-------------|-------|
| `.env` | มี secrets จริง |
| `.env.local`, `.env.production` | มี secrets จริง |
| `node_modules/` | ขนาดใหญ่ ติดตั้งใหม่ได้ |
| `dist/`, `build/` | generated files |
| `*.log`, `logs/` | runtime logs |
| `.DS_Store` | macOS metadata |
| `Thumbs.db`, `desktop.ini` | Windows metadata |
| `.vscode/` (บางส่วน) | personal IDE settings |
| `mysql_data/`, `.docker/` | Docker volume data |
| `coverage/`, `.nyc_output/` | test coverage |
| `*.pem`, `*.key`, `*.crt` | certificates / private keys |
| `*.env.production` | production secrets |

---

## 11. Suggested `.gitignore` Rules

> [!NOTE]
> นี่คือ rules ที่แนะนำ — ไม่ใช่การสร้างไฟล์จริง
> ไฟล์ `.gitignore` จริงอยู่ที่ root ของโปรเจกต์

```gitignore
# ─── Environment & Secrets ──────────────────────────────────
.env
.env.*
!.env.example

# ─── Node / npm ─────────────────────────────────────────────
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# ─── Build Output ───────────────────────────────────────────
dist/
build/
.vite/
*.tsbuildinfo

# ─── Logs ───────────────────────────────────────────────────
logs/
*.log

# ─── OS ─────────────────────────────────────────────────────
.DS_Store
Thumbs.db
desktop.ini
ehthumbs.db

# ─── IDE ────────────────────────────────────────────────────
.vscode/
!.vscode/extensions.json
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln

# ─── Docker local data ──────────────────────────────────────
mysql_data/
.docker/

# ─── Test Coverage ──────────────────────────────────────────
coverage/
.nyc_output/

# ─── Certificates / Keys ────────────────────────────────────
*.pem
*.key
*.crt
```

### Verification Commands

```bash
# ตรวจว่า .env ไม่ถูก track
git status
git ls-files --error-unmatch .env  # ควร error ถ้าถูกต้อง

# ดูไฟล์ที่ถูก ignore
git status --ignored

# ลบ .env ออกจาก tracking ถ้าเผลอ add ไปแล้ว
git rm --cached .env
```

---

## 12. Example Commit Messages

### Planning & Documentation

```bash
# Phase 0 — Governance
docs: add tech stack decision
docs: add AI working rules
docs: add documentation structure
docs: add git workflow and commit rules
chore: complete phase 0 governance setup

# Phase 0 — Analysis
docs: add system overview
docs: add functional and non-functional requirements
docs: add roles and permissions matrix
docs: add business workflow and state machine

# Phase 0 — Technical Design
docs: add database design and ERD
docs: add API contract and endpoint spec
docs: add frontend pages and routing plan
docs: add docker architecture and service map
docs: add project context quick reference
docs: add implementation plan with phase breakdown
```

### Implementation

```bash
# Phase 1
feat: complete phase 1 database schema and init script

# Phase 2
feat(auth): add user register with bcrypt hashing
feat(auth): add JWT login and token verification
feat(auth): add auth middleware for protected routes
feat: complete phase 2 backend auth and middleware

# Phase 3
feat(players): add player list and filter endpoint
feat(squads): add squad builder with valuation
feat(marketplace): add listing and buy flow
feat: complete phase 3 backend features

# Phase 4
feat(frontend): add MUI theme and global styles
feat(frontend): add auth context and protected routes
feat(frontend): add login and register pages
feat: complete phase 4 frontend foundation

# Phase 5
feat(frontend): add player grid with filter
feat(frontend): add squad builder page
feat(frontend): add marketplace with buy flow
feat: complete phase 5 frontend features
```

### Bug Fixes

```bash
fix: resolve backend database connection
fix(docker): add service_healthy condition to backend depends_on
fix(config): set DB_HOST to docker service name db
fix(cors): correct allowed origin for frontend dev port
fix(auth): handle expired JWT token gracefully
fix(marketplace): prevent buying own listing
```

### Maintenance

```bash
chore: update docker compose configuration
chore(deps): upgrade mysql2 to latest version
chore(docker): add anonymous volume for node_modules
chore(docker): rebuild backend after adding bcryptjs
refactor(routes): extract auth middleware to separate file
```

### Hotfix

```bash
fix(hotfix): resolve production DB connection timeout
fix(hotfix): patch JWT secret missing in Railway env
```

---

## Quick Reference

```bash
# ─── ดู status ก่อน commit เสมอ ──────────────────────────────
git status
git diff --staged

# ─── Commit ──────────────────────────────────────────────────
git add .
git commit -m "feat(scope): short description"

# ─── ดู history ──────────────────────────────────────────────
git log --oneline -20
git log --oneline --graph --all

# ─── Tag เมื่อจบ Phase ───────────────────────────────────────
git tag phase-N-complete
git push origin --tags

# ─── ตรวจ .env ──────────────────────────────────────────────
git ls-files .env  # ต้องได้ผลว่าง (ไม่ถูก track)
```

---

*เอกสารนี้ใช้ร่วมกับ `00-ai-working-rules.md` และ `SKILL.md`
ทุก commit ที่ AI แนะนำต้องสอดคล้องกับ rules ในเอกสารนี้*

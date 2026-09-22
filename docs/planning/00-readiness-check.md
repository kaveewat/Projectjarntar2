# 00 — Phase 0 Readiness Check

**Project:** eFootball Smart Marketplace & Squad Valuation
**Document Type:** Readiness Assessment
**Status:** ⚠️ Conditionally Ready (Fixes Required)
**Assessed:** 2026-09-20
**Assessed By:** Technical Lead Review

---

## Readiness Summary

Phase 0 governance documents ครบและมีคุณภาพดี แต่พบ **ข้อขัดแย้ง 3 จุดสำคัญ** ระหว่างไฟล์ที่สร้างไว้ก่อนกำหนด governance (`docker-compose.yml`, `mysql/init/`, `.env`) กับ standards ที่กำหนดใน planning docs ภายหลัง

ต้องแก้ไขไฟล์เหล่านี้ให้ตรงกันก่อนเริ่ม Planning Step 1 เพื่อไม่ให้ implementation phase ผิดฐาน

---

## Checklist

### 1. Tech Stack ชัดเจนหรือไม่

| รายการ | สถานะ | หมายเหตุ |
|-------|------|---------|
| Frontend stack ระบุครบ (React 18 + Vite 5 + MUI 5) | ✅ | ครบใน `00-tech-stack-decision.md` |
| Backend stack ระบุครบ (Node.js 20 + Express 4) | ✅ | ครบ |
| Database ระบุชัด (MySQL 8, utf8mb4) | ✅ | ครบ |
| Deploy target ชัดเจน (Railway, multi-stage Dockerfile) | ✅ | ครบ |
| Port mapping ระบุทุก service | ✅ | ครบ |
| Backend port 5001 (ไม่ใช่ 5000) | ✅ | ระบุเหตุผล macOS ด้วย |
| Docker service name `db` ระบุชัด | ✅ | ระบุใน doc แต่ compose ยังใช้ `mysql` ❌ |

**ผล: ✅ เอกสารชัดเจน — แต่มีความขัดแย้งกับไฟล์จริง (ดูหัวข้อ 6)**

---

### 2. AI Working Rules ครบหรือไม่

| รายการ | สถานะ |
|-------|------|
| General Rules | ✅ |
| Planning Rules | ✅ |
| Implementation Rules | ✅ |
| Phase Control Rules (Phase table ครบ) | ✅ |
| Code Generation Rules | ✅ |
| Debugging Rules | ✅ |
| Documentation Rules | ✅ |
| Testing Rules | ✅ |
| Git Commit Rules | ✅ |
| Forbidden Actions (13 ข้อ) | ✅ |
| Required Output Format | ✅ |
| How AI Should Ask Questions | ✅ |
| How AI Should Handle Unclear Requirements | ✅ |
| How AI Should Report Changes | ✅ |
| Docker Development Rules | ✅ |
| Git / GitHub Workflow Rules | ✅ |
| Skill / Project Instruction Rules | ✅ |
| Environment & Secret Handling Rules | ✅ |

**ผล: ✅ ครบทุก 18 หัวข้อ**

---

### 3. SKILL.md ใช้ควบคุม AI ได้จริงหรือไม่

| รายการ | สถานะ | หมายเหตุ |
|-------|------|---------|
| YAML frontmatter มี `name` และ `description` | ✅ | `efootball-dev` |
| MANDATORY read section อยู่ต้นไฟล์ | ✅ | 5 ข้อ mandatory ก่อน session |
| ระบุเอกสารที่ AI ต้องอ่านก่อน | ✅ | SKILL.md + PROJECT_CONTEXT.md + 10-impl-plan |
| Port mapping ตรงกับ tech stack doc | ✅ | ตรงกัน |
| Service name ระบุเป็น `db` | ✅ | ตรงกัน |
| Forbidden Actions ครบ | ✅ | 13 ข้อ |
| Response Format templates ครบ | ✅ | 4 templates |
| Phase Completion Report format | ✅ | พร้อมใช้ |
| อ้างอิง `PROJECT_CONTEXT.md` | ✅ | แต่ไฟล์นั้นยังไม่มี (by design) |
| อ้างอิง `10-implementation-plan.md` | ✅ | แต่ไฟล์นั้นยังไม่มี (by design) |

**ผล: ✅ ใช้ควบคุม AI ได้จริง — ไฟล์ที่อ้างอิงจะสร้างในช่วงต่อไป (by design)**

---

### 4. โครงสร้าง docs พร้อมหรือไม่

| รายการ | สถานะ | หมายเหตุ |
|-------|------|---------|
| `docs/planning/` มีอยู่จริง | ✅ | |
| `docs/testing/` มีอยู่จริง | ❌ | ยังไม่ได้สร้าง — OK สำหรับ Planning phase |
| `docs/deployment/` มีอยู่จริง | ❌ | ยังไม่ได้สร้าง — OK สำหรับ Planning phase |
| Governance docs ครบ (00-*) | ✅ | 4 ไฟล์ |
| `00-readiness-check.md` | ✅ | ไฟล์นี้ |
| File naming convention ถูกต้อง | ✅ | lowercase, `-` separator |
| `00-documentation-structure.md` กำหนดลำดับไฟล์ชัดเจน | ✅ | |

**ผล: ✅ พร้อมสำหรับช่วง Planning — `testing/` และ `deployment/` สร้างในช่วงถัดไป**

---

### 5. Git Workflow ชัดเจนหรือไม่

| รายการ | สถานะ |
|-------|------|
| Branch strategy ครบ (main/develop/feature/fix/docs) | ✅ |
| Commit types ครบ (feat/fix/docs/chore/refactor/test) | ✅ |
| Commit message format ชัดเจน | ✅ |
| When to commit / ห้าม commit | ✅ |
| Commit per Planning Step (ทุกไฟล์มี recommended commit) | ✅ |
| Commit per Phase (Phase 0–7) | ✅ |
| Rollback strategy ครบ (5 วิธี) | ✅ |
| Tag per Phase แนะนำ | ✅ |
| Files to commit / not commit | ✅ |
| `.gitignore` rules ครบ | ✅ |
| 30+ example commit messages | ✅ |

**ผล: ✅ ชัดเจนและครบถ้วน**

---

### 6. มีข้อขัดแย้งระหว่างเอกสารหรือไม่

> [!CAUTION]
> พบข้อขัดแย้ง 3 จุดระหว่างไฟล์ที่สร้างก่อนกำหนด governance กับ standards ที่กำหนดในภายหลัง
> **ต้องแก้ไขก่อนเริ่ม Planning Step 1**

#### ❌ ข้อขัดแย้งที่ 1: Docker Service Name

| | Governance Docs กำหนด | ไฟล์จริง |
|-|----------------------|---------|
| MySQL service name | `db` | `mysql` ❌ |
| `DB_HOST` env var | `db` | ใช้ `DB_HOST` variable (ค่าใน .env ไม่ทราบ) |
| `PMA_HOST` env var | `db` | `PMA_HOST` variable |
| `depends_on` ของ backend | `db:` | `mysql:` ❌ |
| `depends_on` ของ phpmyadmin | `db:` | `mysql:` ❌ |

**ผลกระทบ:** ถ้าใช้ docker-compose.yml ปัจจุบัน backend จะใช้ service name ผิด และ planning docs จะอ้างอิงชื่อที่ไม่ตรงกับ code จริง

---

#### ❌ ข้อขัดแย้งที่ 2: SQL Init Script Path

| | Governance Docs กำหนด | ไฟล์จริง |
|-|----------------------|---------|
| Path ของ init script | `db/init/01-init.sql` | `mysql/init/01_schema.sql` ❌ |
| Naming convention | lowercase, `-` separator | `_` separator ❌ |
| โฟลเดอร์ root | `db/` | `mysql/` ❌ |

**ผลกระทบ:** เมื่อ implement Phase 1 (Database) จะไม่ชัดเจนว่าต้องวางไฟล์ที่ไหน

---

#### ❌ ข้อขัดแย้งที่ 3: MUI 5 ไม่ถูกรวมใน Frontend Setup เดิม

| | Governance Docs กำหนด | ไฟล์จริง |
|-|----------------------|---------|
| UI Library | MUI 5 | ไม่มีใน `frontend/package.json` ❌ |
| Frontend boilerplate | React + MUI 5 | React เปล่า ไม่มี MUI ❌ |

**ผลกระทบ:** Frontend boilerplate code ที่สร้างไว้ไม่ตรงกับ Tech Stack จริง ต้องเพิ่ม MUI

---

### 7. มีสิ่งที่ยังขาดก่อนเริ่ม Planning Step 1 หรือไม่

| รายการ | สถานะ | หมายเหตุ |
|-------|------|---------|
| `PROJECT_CONTEXT.md` | ❌ ยังไม่มี | สร้างหลัง 01–09 เสร็จ — OK |
| `10-implementation-plan.md` | ❌ ยังไม่มี | สร้างสุดท้าย — OK |
| `README.md` | ❌ ยังไม่มี | ควรมีก่อน commit แรก |
| `01-system-overview.md` | ❌ ยังไม่มี | งานของ Planning Step 1 |
| `docker-compose.yml` ที่ align กับ governance | ❌ ต้องแก้ไข | ต้องแก้ก่อน |
| `db/init/` folder structure ที่ถูกต้อง | ❌ ต้องแก้ไข | ต้องแก้ก่อน |
| `.env` `DB_HOST=db` | ⚠️ ต้องตรวจสอบ | ค่าอาจยังเป็น `mysql` |

---

### 8. ความเสี่ยงที่พบ

| # | ความเสี่ยง | ระดับ | ผลกระทบ |
|---|----------|------|--------|
| R1 | Service name ไม่ตรงกัน (`mysql` vs `db`) ทำให้ backend connect DB ไม่ได้เมื่อ run จริง | 🔴 สูง | Docker network error |
| R2 | SQL init path ไม่ตรงกับ governance ทำให้ implement Phase 1 สับสน | 🟡 กลาง | Confusion ระหว่าง AI sessions |
| R3 | Frontend boilerplate ไม่มี MUI ทำให้ Phase 4 ต้อง setup เพิ่ม | 🟡 กลาง | Rework ใน Phase 4 |
| R4 | ไม่มี `README.md` ทำให้ developer ใหม่ไม่รู้วิธีรัน | 🟡 กลาง | Onboarding ยาก |
| R5 | `.env` อาจมี `DB_HOST=mysql` (ไม่ใช่ `db`) | 🟡 กลาง | Backend connect ผิด host |
| R6 | `PROJECT_CONTEXT.md` ยังไม่มี ทำให้ AI อ้างอิงไม่ได้ | 🟢 ต่ำ | สร้างได้หลัง Planning เสร็จ |

---

### 9. สิ่งที่ต้องแก้ไขก่อนเริ่ม Planning Step 1

> [!IMPORTANT]
> ต้องแก้ไขรายการต่อไปนี้ก่อน — ใช้เวลาไม่นาน แต่สำคัญมาก

#### Fix 1 — แก้ `docker-compose.yml` (🔴 สำคัญที่สุด)

เปลี่ยน service name จาก `mysql` → `db` ทุกจุด:
- `services.mysql:` → `services.db:`
- `depends_on.mysql:` → `depends_on.db:` (ใน backend และ phpmyadmin)
- Volume mount path จาก `./mysql/init:` → `./db/init:`

#### Fix 2 — ย้าย SQL init script (🔴 สำคัญ)

- สร้างโฟลเดอร์ `db/init/`
- ย้าย `mysql/init/01_schema.sql` → `db/init/01-init.sql`
- ลบโฟลเดอร์ `mysql/` เก่า

#### Fix 3 — แก้ `.env` (🟡 กลาง)

- ตรวจสอบและแก้ `DB_HOST=db` (ไม่ใช่ `mysql`)
- ตรวจสอบ `PMA_HOST=db`

#### Fix 4 — สร้าง `README.md` (🟡 กลาง)

ควรมีก่อน commit แรก ประกอบด้วย:
- Project name และ description
- Tech Stack
- Docker run commands
- Port mapping
- Folder structure

#### Fix 5 — เพิ่ม MUI ใน Frontend (🟡 ทำได้ใน Phase 4)

- สามารถเพิ่มใน `frontend/package.json` ตอนเริ่ม Phase 4 ก็ได้
- แต่ควร note ไว้ใน `10-implementation-plan.md` ว่า Phase 4 ต้องติดตั้ง MUI

---

### 10. พร้อมเข้าสู่ Planning Only หรือยัง

**สำหรับ Planning (เขียนเอกสาร):** ✅ พร้อมแล้ว
**สำหรับ Implementation (เขียน code):** ❌ ยังไม่พร้อม — ต้องแก้ไข Fix 1–3 ก่อน

---

## Final Decision

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ⚠️  CONDITIONALLY READY                                   │
│                                                             │
│   ✅  เข้าสู่ Planning Step 1 (System Overview) ได้เลย     │
│                                                             │
│   ❌  ห้ามเริ่ม Implementation จนกว่าจะแก้ไข:              │
│       Fix 1: docker-compose.yml service name → db           │
│       Fix 2: ย้าย init script → db/init/01-init.sql         │
│       Fix 3: ตรวจสอบ .env DB_HOST=db                        │
│       Fix 4: สร้าง README.md                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Action Plan ก่อนเริ่ม Implementation

| # | งาน | ทำเมื่อ | ใช้เวลา |
|---|-----|--------|--------|
| 1 | แก้ `docker-compose.yml` — service name `mysql` → `db` | ก่อน Phase 1 implement | ~5 นาที |
| 2 | ย้าย init SQL → `db/init/01-init.sql` | ก่อน Phase 1 implement | ~2 นาที |
| 3 | ตรวจ `.env` → `DB_HOST=db`, `PMA_HOST=db` | ก่อน Phase 1 implement | ~2 นาที |
| 4 | สร้าง `README.md` | ก่อน commit แรก | ~10 นาที |
| 5 | commit Phase 0 ทั้งหมด | หลัง Fix 1–4 เสร็จ | ~2 นาที |

**Recommended commit หลังแก้ไข:**
```
chore: align docker setup with governance standards

- rename mysql service to db per planning docs
- move init script to db/init/01-init.sql
- update DB_HOST and PMA_HOST to use db service name
```

---

## Summary Scores

| หมวด | คะแนน | หมายเหตุ |
|------|------|---------|
| Tech Stack Decision | 5/5 | ครบ ชัดเจน |
| AI Working Rules | 5/5 | 18 หัวข้อ ครบ |
| SKILL.md | 5/5 | ใช้ควบคุม AI ได้จริง |
| Documentation Structure | 5/5 | ครบ มี lifecycle |
| Git Workflow | 5/5 | ครบ มี 30+ examples |
| Docker Consistency | 2/5 | ❌ service name ขัดแย้ง |
| File Structure Consistency | 2/5 | ❌ init path ขัดแย้ง |
| README | 0/5 | ❌ ยังไม่มี |
| **รวม** | **34/40** | **85% — Conditionally Ready** |

---

*หลังแก้ไข Fix 1–4 เสร็จ คาดว่าจะ Ready 100% สำหรับ Planning Step 1*

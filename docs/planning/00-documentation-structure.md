# 00 — Documentation Structure

**Project:** eFootball Smart Marketplace & Squad Valuation
**Document Type:** Documentation Governance
**Status:** Active
**Last Updated:** 2026-09-20

---

## วัตถุประสงค์

เอกสารนี้กำหนดโครงสร้าง วิธีตั้งชื่อ และวิธีใช้งานเอกสารทั้งหมดในโปรเจกต์
เพื่อให้ทีมและ AI ทำงานจากแหล่งข้อมูลเดียวกัน ลดความสับสน และรักษา audit trail ได้

---

## 1. โครงสร้างโฟลเดอร์ `docs/`

```
docs/
├── planning/           ← เอกสารวิเคราะห์และวางแผนทั้งหมด
├── testing/            ← test plans, test cases, test results
└── deployment/         ← deploy checklist, environment config, runbook
```

**กติกาหลัก:**
- เอกสารทุกไฟล์ต้องอยู่ใน subfolder ที่ถูกต้อง ห้ามวางที่ root ของ `docs/`
- ไฟล์ใน `docs/` ทุกไฟล์ commit ได้ — ห้ามเก็บ secrets ในเอกสารใดๆ

---

## 2. โครงสร้าง `docs/planning/`

```
docs/planning/
├── 00-documentation-structure.md     ← ไฟล์นี้
├── 00-tech-stack-decision.md         ← Architecture Decision Record
├── 00-ai-working-rules.md            ← กติกาการทำงานกับ AI
├── 01-system-overview.md             ← ภาพรวมระบบ
├── 02-requirements.md                ← Functional & Non-functional Requirements
├── 03-roles-permissions.md           ← Roles, Permissions, Access Control
├── 04-complaint-workflow.md          ← Business workflow / process flow
├── 05-database-design.md             ← ERD, table definitions, relationships
├── 06-api-contract.md                ← API endpoints, request/response spec
├── 07-frontend-pages.md              ← Pages, routes, UI components
├── 08-dashboard-report-notification.md ← Dashboard, reports, notifications
├── 09-project-docker-architecture.md ← Docker services, network, volumes
├── PROJECT_CONTEXT.md                ← Quick reference สำหรับ AI
└── 10-implementation-plan.md         ← Phase breakdown, acceptance criteria
```

**กติกา:**
- ไฟล์ที่ขึ้นต้นด้วย `00-` คือ **Governance docs** — สร้างก่อนทุกอย่าง ใช้ตลอดโปรเจกต์
- ไฟล์ที่ขึ้นต้นด้วย `01-` ถึง `09-` คือ **Planning docs** — สร้างตามลำดับ
- `PROJECT_CONTEXT.md` และ `10-implementation-plan.md` — สร้างหลังจาก 01–09 เสร็จ

---

## 3. โครงสร้าง `docs/testing/`

```
docs/testing/
├── test-plan.md                      ← overall test strategy
├── backend-test-cases.md             ← API test cases per endpoint
├── frontend-test-cases.md            ← UI test cases per page
└── phase-N-test-results.md           ← test results per phase (สร้างหลังทดสอบ)
```

**วัตถุประสงค์:**
- `test-plan.md` — กำหนดแนวทางการทดสอบ (manual/automated), scope, tools
- `backend-test-cases.md` — curl/Postman test cases พร้อม expected response
- `frontend-test-cases.md` — user interaction steps พร้อม expected behavior
- `phase-N-test-results.md` — บันทึกผลการทดสอบหลังจบแต่ละ Phase

---

## 4. โครงสร้าง `docs/deployment/`

```
docs/deployment/
├── deploy-checklist.md               ← checklist ก่อน production deploy
├── environment-variables.md          ← รายการ env vars ที่ต้องตั้งใน Railway
├── railway-deploy-guide.md           ← ขั้นตอน deploy บน Railway
└── runbook.md                        ← วิธีแก้ปัญหาที่พบบ่อย (Ops runbook)
```

**วัตถุประสงค์:**
- `deploy-checklist.md` — ทำก่อน go-live ทุกครั้ง: env vars, secrets, healthcheck, DB migration
- `environment-variables.md` — รายการ env vars ทั้งหมดที่ต้องตั้งใน Railway (ไม่มีค่าจริง)
- `railway-deploy-guide.md` — step-by-step การ deploy รวมถึง Dockerfile multi-stage
- `runbook.md` — วิธีรับมือปัญหา เช่น DB connection fail, container crash, memory limit

---

## 5. รายชื่อไฟล์ Planning และวัตถุประสงค์

| ไฟล์ | วัตถุประสงค์ | ใช้ใน Phase |
|------|------------|------------|
| `00-documentation-structure.md` | กำหนดโครงสร้างเอกสารและกติกา | ทุก Phase |
| `00-tech-stack-decision.md` | Architecture Decision Record — Tech Stack ที่เลือกและเหตุผล | ทุก Phase |
| `00-ai-working-rules.md` | กติกาการทำงานกับ AI ทุก Phase | ทุก Phase |
| `01-system-overview.md` | ภาพรวมระบบ, actor, module หลัก, system boundary | Planning |
| `02-requirements.md` | Functional requirements (user stories), Non-functional requirements | Planning |
| `03-roles-permissions.md` | Roles (Admin/User), สิทธิ์เข้าถึงแต่ละ feature | Phase 2, 3 |
| `04-complaint-workflow.md` | Business process flow, state machine, decision points | Phase 3 |
| `05-database-design.md` | ERD, table definitions, data types, constraints, indexes | Phase 1 |
| `06-api-contract.md` | API endpoints ทั้งหมด พร้อม request/response/status code | Phase 2, 3 |
| `07-frontend-pages.md` | รายชื่อ pages, routes, components หลัก, UI wireframe notes | Phase 4, 5 |
| `08-dashboard-report-notification.md` | Dashboard widgets, report specs, notification triggers | Phase 5 |
| `09-project-docker-architecture.md` | Docker service map, network rules, volume strategy, commands | Phase 1, Dev |
| `PROJECT_CONTEXT.md` | Quick-reference รวบรัดสำหรับ AI — port, service, stack | ทุก Phase |
| `10-implementation-plan.md` | Phase breakdown พร้อม scope, acceptance criteria, git commit | ทุก Phase |

---

## 6. ลำดับการสร้างไฟล์

### ช่วงที่ 0 — เตรียมกติกาและบริบท

| ลำดับ | ไฟล์ | สถานะ |
|------|------|------|
| 1 | `00-tech-stack-decision.md` | ✅ เสร็จแล้ว |
| 2 | `00-ai-working-rules.md` | ✅ เสร็จแล้ว |
| 3 | `00-documentation-structure.md` | ✅ ไฟล์นี้ |

### ช่วงที่ 1 — System Analysis & Requirements

| ลำดับ | ไฟล์ | หมายเหตุ |
|------|------|---------|
| 4 | `01-system-overview.md` | ก่อน requirements |
| 5 | `02-requirements.md` | หลัง system overview |
| 6 | `03-roles-permissions.md` | หลัง requirements |
| 7 | `04-complaint-workflow.md` | ถ้ามี complaint/workflow ใน scope |

### ช่วงที่ 2 — Technical Design

| ลำดับ | ไฟล์ | หมายเหตุ |
|------|------|---------|
| 8 | `05-database-design.md` | ก่อนเขียน SQL ใดๆ |
| 9 | `06-api-contract.md` | ก่อนเขียน backend routes |
| 10 | `07-frontend-pages.md` | ก่อนเขียน frontend components |
| 11 | `08-dashboard-report-notification.md` | ถ้ามี dashboard/notification ใน scope |
| 12 | `09-project-docker-architecture.md` | ก่อนแก้ docker-compose |

### ช่วงที่ 3 — Implementation Reference

| ลำดับ | ไฟล์ | หมายเหตุ |
|------|------|---------|
| 13 | `PROJECT_CONTEXT.md` | สร้างหลังจาก 01–09 เสร็จ |
| 14 | `10-implementation-plan.md` | สร้างสุดท้าย ก่อนเริ่ม Phase 1 implementation |

---

## 7. วัตถุประสงค์ของแต่ละไฟล์ (รายละเอียด)

### `01-system-overview.md`
- ภาพรวมว่าระบบทำอะไร ใครใช้ มี module อะไรบ้าง
- System boundary diagram (text-based หรือ Mermaid)
- Actors และ primary use cases
- **ไม่ใช่:** รายละเอียด requirements — นั้นอยู่ใน `02-requirements.md`

### `02-requirements.md`
- Functional Requirements ในรูปแบบ User Story: `As a [role], I want to [action], so that [benefit]`
- Non-functional Requirements: performance, security, availability
- Scope boundary — in/out of MVP
- **ไม่ใช่:** technical design — นั้นอยู่ใน 05–09

### `03-roles-permissions.md`
- รายชื่อ roles ทั้งหมดในระบบ
- Permission matrix: role × feature → allow/deny
- Access control rules สำหรับ backend middleware

### `04-complaint-workflow.md`
- Business process / state machine สำหรับ workflow หลัก
- States, transitions, triggers, actors
- Decision points และ edge cases

### `05-database-design.md`
- ERD (Mermaid diagram)
- Table definitions: column name, type, constraint, description
- Relationships และ foreign keys
- Indexes ที่ควรมี
- Charset/collation (utf8mb4)

### `06-api-contract.md`
- ทุก endpoint: method, path, auth required, request body, response, error codes
- ใช้เป็น source of truth สำหรับ backend และ frontend
- Version: v1 ที่ `/api/v1/` หรือ `/api/` ตามที่กำหนด

### `07-frontend-pages.md`
- รายชื่อ pages ทั้งหมด พร้อม route path
- สำหรับแต่ละ page: purpose, key components, API calls, auth required
- Navigation flow

### `08-dashboard-report-notification.md`
- Dashboard: widgets, metrics, data source per widget
- Reports: ชนิด report, filters, output format
- Notifications: trigger conditions, channels, message template

### `09-project-docker-architecture.md`
- Docker service definitions (service name, image, port, env, volume)
- Network diagram
- Volume strategy
- คำสั่ง Docker ที่ใช้บ่อย

### `PROJECT_CONTEXT.md`
- Quick-reference สำหรับ AI อ่านก่อน session ใหม่
- ประกอบด้วย: tech stack summary, service map, port mapping, network rules, folder structure, env vars key list, current phase status
- ต้องกระชับ อ่านได้ภายใน 2 นาที
- อัปเดตทุกครั้งที่ port/service/stack เปลี่ยน

### `10-implementation-plan.md`
- ตาราง Phase ทั้งหมด: Phase number, name, scope summary, status
- สำหรับแต่ละ Phase: scope detail, files to create/modify, acceptance criteria, run/test commands, git commit message
- เป็น living document — อัปเดต status เมื่อ Phase เสร็จ

---

## 8. กติกาการตั้งชื่อไฟล์

| กฎ | ตัวอย่าง |
|----|---------|
| ใช้ lowercase ทั้งหมด | `05-database-design.md` ✅ |
| ใช้ `-` เป็น separator (ไม่ใช้ `_` หรือ space) | `06-api-contract.md` ✅ |
| ขึ้นต้นด้วยหมายเลข 2 หลัก ตามด้วย `-` | `07-frontend-pages.md` ✅ |
| Governance docs ใช้ prefix `00-` | `00-ai-working-rules.md` ✅ |
| ไฟล์พิเศษใช้ UPPERCASE | `PROJECT_CONTEXT.md`, `README.md` ✅ |
| ห้ามใช้ space ในชื่อไฟล์ | `database design.md` ❌ |
| ห้ามใช้ camelCase | `databaseDesign.md` ❌ |
| นามสกุลต้องเป็น `.md` | `05-database-design.md` ✅ |

---

## 9. กติกาการเขียน Markdown

### โครงสร้างพื้นฐาน

ทุกไฟล์ต้องเริ่มด้วย metadata block:

```markdown
# [หมายเลข] — [ชื่อเอกสาร]

**Project:** eFootball Smart Marketplace & Squad Valuation
**Document Type:** [ประเภท]
**Status:** Draft | In Review | Approved | Deprecated
**Last Updated:** YYYY-MM-DD
```

### Heading Hierarchy

| Level | ใช้สำหรับ |
|-------|---------|
| `#` H1 | ชื่อเอกสาร (1 อันต่อไฟล์เท่านั้น) |
| `##` H2 | หัวข้อหลัก |
| `###` H3 | หัวข้อย่อย |
| `####` H4 | รายละเอียดย่อย |

### กฎการใช้ Elements

| Element | กฎ |
|---------|---|
| ตาราง | ใช้เมื่อมีข้อมูล ≥ 3 คอลัมน์ หรือเปรียบเทียบหลายรายการ |
| Bullet list | ใช้สำหรับรายการที่ไม่มีลำดับ |
| Numbered list | ใช้สำหรับขั้นตอนที่ต้องทำตามลำดับ |
| Code block | ใช้สำหรับ command, SQL, config — ระบุ language เสมอ |
| Bold `**text**` | เน้นคำสำคัญ |
| GitHub Alerts | ใช้สำหรับ NOTE, IMPORTANT, WARNING, CAUTION |

### GitHub Alerts

```markdown
> [!NOTE]
> ข้อมูลเพิ่มเติมที่ควรรู้

> [!IMPORTANT]
> ข้อมูลสำคัญที่ต้องปฏิบัติตาม

> [!WARNING]
> ข้อควรระวัง

> [!CAUTION]
> ความเสี่ยงสูง อาจเกิดความเสียหาย
```

### ห้าม

- ห้ามใส่ secrets, passwords หรือ credentials จริงในเอกสารใดๆ
- ห้ามใช้ HTML tag ในเอกสาร (ยกเว้น `<br>` เมื่อจำเป็น)
- ห้าม heading ข้าม level เช่น H1 → H3 โดยไม่มี H2

---

## 10. วิธีใช้เอกสารเหล่านี้กับ AI ในแต่ละ Phase

### ก่อนเริ่ม Session ใหม่

AI ต้องอ่านไฟล์เหล่านี้ก่อนทุกครั้ง:

| ลำดับ | ไฟล์ | เหตุผล |
|------|------|-------|
| 1 | `.agents/skills/efootball-dev/SKILL.md` | กติกาการทำงานหลัก |
| 2 | `docs/planning/PROJECT_CONTEXT.md` | quick-reference สถานะปัจจุบัน |
| 3 | `docs/planning/10-implementation-plan.md` | scope ของ Phase ที่กำลังทำ |

### การใช้เอกสารต่อ Phase

| Phase | เอกสารที่ AI ต้องอ้างอิง |
|-------|----------------------|
| Phase 0 (Governance) | `00-tech-stack-decision.md`, `00-ai-working-rules.md` |
| Phase 1 (Database) | `05-database-design.md`, `09-project-docker-architecture.md` |
| Phase 2 (Backend Auth) | `03-roles-permissions.md`, `06-api-contract.md` |
| Phase 3 (Backend Features) | `02-requirements.md`, `04-complaint-workflow.md`, `06-api-contract.md` |
| Phase 4 (Frontend Foundation) | `07-frontend-pages.md`, `03-roles-permissions.md` |
| Phase 5 (Frontend Features) | `07-frontend-pages.md`, `08-dashboard-report-notification.md`, `06-api-contract.md` |
| Phase 6 (Integration) | ทุกไฟล์ใน `docs/planning/` + `docs/testing/` |
| Phase 7 (Deploy) | `docs/deployment/` ทั้งหมด |

### วิธี Prompt AI อย่างมีประสิทธิภาพ

เมื่อเริ่ม Phase ใหม่ ให้ระบุใน Prompt:
```
เริ่ม Phase [N]: [ชื่อ Phase]
อ้างอิง: docs/planning/10-implementation-plan.md (Phase N)
อ้างอิง: docs/planning/[relevant-doc].md
```

เมื่อต้องการ Planning เท่านั้น:
```
ขอ Planning สำหรับ Phase [N] เท่านั้น — ยังไม่ต้องเขียน Code
```

เมื่อต้องการ Implementation:
```
Planning Phase [N] ได้รับ approve แล้ว — เริ่ม Implementation ได้เลย
```

### Document Lifecycle

```
Draft → In Review → Approved → (ใช้งาน) → Deprecated
```

- **Draft:** กำลังเขียน ยังไม่พร้อมใช้
- **In Review:** รอ approve จากทีม
- **Approved:** ใช้อ้างอิงได้ เปลี่ยนแปลงต้องผ่าน review
- **Deprecated:** มีเวอร์ชั่นใหม่แทน — ห้าม AI อ้างอิง

> [!IMPORTANT]
> เมื่อ Architecture, Port, Service Name หรือ Tech Stack เปลี่ยน
> ต้องอัปเดต `PROJECT_CONTEXT.md` และ `00-tech-stack-decision.md` ก่อนเริ่ม session ถัดไป

---

*เอกสารนี้เป็น living document — อัปเดตได้เมื่อโครงสร้าง docs เปลี่ยน*

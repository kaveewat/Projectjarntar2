# 10 — Implementation Plan

**Project:** eFootball Smart Marketplace & AI Valuation System
**Document Type:** Implementation Plan
**Status:** Draft — รอ Approve ก่อนเริ่ม Phase 1
**Reference:** `01–09 planning docs`
**Last Updated:** 2026-09-20

---

## ภาพรวม Phase ทั้งหมด

| Phase | ชื่อ | Layer | Dependency |
|-------|-----|-------|-----------|
| 0 | Requirement & Architecture Finalization | Planning | — |
| 1 | Project Setup & Monorepo Configuration | Infra | 0 |
| 2 | Database Schema, Migration & Seed | DB | 1 |
| 3 | Backend Core & MySQL Connection Pool | Backend | 2 |
| 4 | Authentication, JWT & RBAC | Backend | 3 |
| 5 | AI Squad Scanner & Valuation Service | Backend | 4 |
| 6 | Listing Management & Search API | Backend | 5 |
| 7 | Escrow Order, Payment & Timeout Scheduling | Backend | 6 |
| 8 | Handover Room, Encryption & Dispute API | Backend | 7 |
| 9 | Dashboard, Metrics & Audit Report API | Backend | 8 |
| 10 | Frontend Foundation, MUI Theme & Routing | Frontend | 3 |
| 11 | Frontend Auth, KYC & User Profile | Frontend | 4, 10 |
| 12 | Marketplace Catalog, Squad Detail & Badges UI | Frontend | 6, 11 |
| 13 | Listing Creation Flow & AI Scanner UI | Frontend | 5, 12 |
| 14 | Escrow Checkout, Handover & Dispute UI | Frontend | 8, 13 |
| 15 | Admin Dashboard, Escrow & Dispute Handling UI | Frontend | 9, 14 |
| 16 | Notifications & Auto-Release Scheduler | Full-stack | 8, 15 |
| 17 | Docker Compose Integration (Dev) | Infra | 16 |
| 18 | E2E Testing, Security Audit & Bug Fixing | QA | 17 |
| 19 | Production Deployment (Railway + On-Premise) | Deploy | 18 |

---

## Phase 0: Requirement & Architecture Finalization ✅

**Status:** เสร็จแล้ว (Phase 0 คือ Planning ทั้งหมดที่ทำมา)

**ผลลัพธ์ที่ส่งมอบ:**
- `docs/planning/01-system-overview.md` ✅
- `docs/planning/02-requirements.md` ✅
- `docs/planning/03-roles-permissions.md` ✅
- `docs/planning/04-workflow.md` ✅
- `docs/planning/05-database-design.md` ✅
- `docs/planning/06-api-contract.md` ✅
- `docs/planning/07-frontend-pages.md` ✅
- `docs/planning/08-dashboard-report-notification.md` ✅
- `docs/planning/09-project-docker-architecture.md` ✅
- `docs/planning/10-implementation-plan.md` ← ไฟล์นี้

**Git Commit:**
```
docs: complete phase 0 planning — all 10 planning docs finalized
git tag planning-complete
```

---

## Phase 1: Project Setup & Monorepo Configuration

### เป้าหมาย
ตั้งค่า Monorepo structure, package manager, linting, environment และ dev tooling ให้พร้อมก่อนเขียน code จริง

### งานที่ต้องทำ

| # | งาน | ไฟล์/Module |
|---|-----|-----------|
| 1.1 | ตรวจสอบและ align folder structure ตาม `09-project-docker-architecture.md` | Root, `backend/`, `frontend/`, `db/` |
| 1.2 | `backend/package.json` — dependencies: express, mysql2, jsonwebtoken, bcryptjs, multer, cors, helmet, express-rate-limit, node-cron, winston, joi | `backend/package.json` |
| 1.3 | `frontend/package.json` — dependencies: react, react-dom, react-router-dom, @mui/material, axios, react-dropzone | `frontend/package.json` |
| 1.4 | สร้างไฟล์ `.env.example` ทั้ง root, backend, frontend | `.env.example` x3 |
| 1.5 | สร้าง `.gitignore` ครบ (node_modules, .env, uploads/, backend/public/) | `.gitignore` |
| 1.6 | ตั้งค่า ESLint + Prettier ทั้ง backend และ frontend | `.eslintrc.json`, `.prettierrc` |
| 1.7 | สร้าง `backend/nodemon.json` สำหรับ hot-reload | `backend/nodemon.json` |
| 1.8 | สร้าง `vite.config.js` พร้อม proxy `/api` → backend | `frontend/vite.config.js` |

### Acceptance Criteria
- [x] `cd backend && npm install` สำเร็จ ไม่มี error (ติดตั้ง 179 packages ครบถ้วน)
- [x] `cd frontend && npm install` สำเร็จ ไม่มี error (ติดตั้ง 202 packages ครบถ้วน)
- [x] `cd frontend && npm run dev` เปิด http://localhost:5173 ได้ (Vite 5 server รันและ build ผ่าน)
- [x] `cd backend && npm run dev` รัน nodemon ได้ และ import ทุก package ผ่าน 100%
- [x] `.env` ไม่ถูก commit เข้า git (gitignore ทำงาน)

### ความเสี่ยง
- npm dependency conflict ระหว่าง React 18 กับ MUI 5 peer deps → **แก้:** ใช้ `--legacy-peer-deps` ถ้าจำเป็น

### Git Commit
```
feat: initialize monorepo structure and dev tooling

- setup backend package.json with core dependencies
- setup frontend package.json with React 18 + MUI 5
- add .env.example files (root, backend, frontend)
- configure ESLint, Prettier, nodemon, vite proxy
- add comprehensive .gitignore
```

---

## Phase 2: Database Schema, Migration & Master Data Seeding

### เป้าหมาย
สร้าง Schema MySQL ครบ 27 ตาราง + Seed Master Data ให้ระบบมีข้อมูลพื้นฐานก่อนพัฒนา API

### งานที่ต้องทำ

| # | งาน | ไฟล์/Module |
|---|-----|-----------|
| 2.1 | เขียน `01-init.sql` — CREATE TABLE ทุกตาราง ตาม `05-database-design.md` (ลำดับตาม FK dependency) | `db/init/01-init.sql` |
| 2.2 | เพิ่ม INDEX ที่จำเป็น (email UNIQUE, status, foreign keys) | `db/init/01-init.sql` |
| 2.3 | เขียน `02-seed.sql` — INSERT games, platforms, card_tiers, positions, dispute_reasons | `db/init/02-seed.sql` |
| 2.4 | INSERT player_cards ชุดแรก (Epic/Show Time/Big Time รู้จัก 50+ ตัว) | `db/init/02-seed.sql` |
| 2.5 | INSERT platform_settings (ค่า default ทุกตัว: fee, timeout, badge thresholds) | `db/init/02-seed.sql` |
| 2.6 | INSERT admin user เริ่มต้น 1 คน (hashed password) | `db/init/02-seed.sql` |
| 2.7 | ทดสอบ import SQL ใน MySQL 8 ผ่าน Docker | `docker-compose.yml` |
| 2.8 | ทดสอบ seed data ครบผ่าน phpMyAdmin | `http://localhost:8081` |

### Acceptance Criteria
- [x] `docker compose up db -d` → MySQL ขึ้น healthy (คอนเทนเนอร์ efootball_db พอร์ต 3307 สถานะ healthy)
- [x] Auto-run `01-init.sql` และ `02-seed.sql` เมื่อ container ขึ้น fresh (ทดสอบรันผ่าน 100% ไม่มี error)
- [x] โครงสร้างตารางปรากฏครบถ้วนในฐานข้อมูล efootball_db (30 ตาราง ครบทั้ง 8 กลุ่มงาน)
- [x] `games` table มี `eFootball 2025`
- [x] `card_tiers` มี 4 records (Normal, Epic, Show Time, Big Time)
- [x] `platform_settings` มี 8 config keys ครบ
- [x] `player_cards` มีข้อมูลการ์ดนักเตะตั้งต้น 55 รายการ
- [x] บัญชี Super Admin (`admin@efootball-market.com`) แฮชรหัสผ่านด้วย bcrypt
- [x] ไม่มี FK constraint error

### ความเสี่ยง
- ลำดับ CREATE TABLE ผิด (FK ชี้ไป table ที่ยังไม่มี) → **แก้:** เรียงตาม dependency tree ใน 05-database-design.md
- Character set ผิด → **แก้:** บังคับ `CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci` ทุกตาราง

### Git Commit
```
feat(db): add complete schema and master data seed

- 01-init.sql: 27 tables with indexes and FK constraints
- 02-seed.sql: games, platforms, tiers, positions, dispute_reasons
- 02-seed.sql: 50+ player cards, platform_settings defaults
- 02-seed.sql: initial admin user
```

---

## Phase 3: Backend Core & MySQL Connection Pool Setup

### เป้าหมาย
สร้าง Express app skeleton ที่ทำงานได้ มี MySQL connection pool, health check, middleware พื้นฐาน และ logging

### งานที่ต้องทำ

| # | งาน | ไฟล์/Module |
|---|-----|-----------|
| 3.1 | สร้าง `server.js` — HTTP server, port binding, graceful shutdown | `backend/src/server.js` |
| 3.2 | สร้าง `app.js` — Express factory, mount middleware | `backend/src/app.js` |
| 3.3 | สร้าง `config/env.js` — validate required env vars ด้วย Joi | `backend/src/config/env.js` |
| 3.4 | สร้าง `config/db.js` — MySQL2 pool, connection test, auto-reconnect | `backend/src/config/db.js` |
| 3.5 | สร้าง `config/cors.js` — CORS whitelist จาก env | `backend/src/config/cors.js` |
| 3.6 | สร้าง `middleware/errorHandler.js` — Global error handler | `backend/src/middleware/errorHandler.js` |
| 3.7 | สร้าง `middleware/requestLogger.js` — Morgan + Winston | `backend/src/middleware/requestLogger.js` |
| 3.8 | สร้าง `utils/response.js` — Standard response helper | `backend/src/utils/response.js` |
| 3.9 | สร้าง health check route `GET /api/v1/health` | `backend/src/routes/health.routes.js` |
| 3.10 | สร้าง `utils/logger.js` — Winston logger instance | `backend/src/utils/logger.js` |

### Acceptance Criteria
- [x] `npm run dev` → Server starts บน port 5001 (Verified: Port 5001 binding in Docker & local)
- [x] `GET /api/v1/health` → `{ success: true, data: { db: "connected", uptime: X } }` (Verified: HTTP 200, db: "connected")
- [x] DB connection failure → server log error แต่ไม่ crash (retry) (Verified: auto-reconnect retry mechanism)
- [x] Request log แสดงใน console (method, path, status, ms) (Verified: Morgan + Winston stream)
- [x] ส่ง request โดยไม่มี token → ยังไม่ redirect (auth ยังไม่มี) (Verified: HTTP 200 without redirect)
- [x] Invalid JSON body → 400 response format ถูกต้อง (Verified: HTTP 400 with code "INVALID_JSON")

### ความเสี่ยง
- MySQL pool connection timeout ใน Docker → **แก้:** เพิ่ม `depends_on: db` + health check ใน docker-compose

### Git Commit
```
feat(backend): setup express core, db pool, and health check

- server.js with graceful shutdown
- mysql2 connection pool with auto-reconnect
- cors, helmet, morgan middleware
- global error handler with standard response format
- GET /api/v1/health endpoint
```

---

## Phase 4: Authentication, JWT & Role-Based Access Control

### เป้าหมาย
ระบบ Register, Login, JWT Token, และ middleware ตรวจสิทธิ์ Role ครบทุก Role

### งานที่ต้องทำ

| # | งาน | ไฟล์/Module |
|---|-----|-----------|
| 4.1 | `models/user.model.js` — findByEmail, findById, create, updateById | `backend/src/models/user.model.js` |
| 4.2 | `services/auth.service.js` — register, login, bcrypt hash/compare | `backend/src/services/auth.service.js` |
| 4.3 | `utils/jwt.js` — signToken, verifyToken | `backend/src/utils/jwt.js` |
| 4.4 | `middleware/auth.js` — JWT verify middleware (Bearer token) | `backend/src/middleware/auth.js` |
| 4.5 | `middleware/roleGuard.js` — factory fn `requireRole(...roles)` | `backend/src/middleware/roleGuard.js` |
| 4.6 | `controllers/auth.controller.js` — register, login, logout, getMe | `backend/src/controllers/auth.controller.js` |
| 4.7 | `routes/auth.routes.js` — POST /register, /login, /logout, GET /me | `backend/src/routes/auth.routes.js` |
| 4.8 | `controllers/users.controller.js` — getProfile, updateProfile, changePassword | `backend/src/controllers/users.controller.js` |
| 4.9 | Input validation schemas สำหรับ auth endpoints | `backend/src/utils/validators.js` |
| 4.10 | Rate limiter สำหรับ login (10 req/15min per IP) | `backend/src/middleware/rateLimiter.js` |

### Acceptance Criteria
- [x] `POST /api/v1/auth/register` → สร้าง user + return JWT (Verified: HTTP 201, safe user object + access & refresh tokens)
- [x] `POST /api/v1/auth/login` → return `{ access_token, user }` หรือ 401 (Verified: 200 on success, 401 INVALID_CREDENTIALS on error)
- [x] `GET /api/v1/auth/me` ด้วย valid token → return user data (Verified: HTTP 200 with user profile)
- [x] `GET /api/v1/auth/me` ไม่มี token → 401 (Verified: HTTP 401 UNAUTHORIZED)
- [x] Route ที่ต้องการ role ADMIN และ User เป็น BUYER → 403 (Verified: HTTP 403 FORBIDDEN on roleGuard)
- [x] Password hash ด้วย bcrypt ≥ 10 rounds (ไม่มี plain text ใน DB) (Verified: $2a$10$... hash in DB)
- [x] Login ผิด password > 10 ครั้ง ใน 15 นาที → 429 (Verified: HTTP 429 RATE_LIMIT_EXCEEDED)

### ความเสี่ยง
- JWT Secret อ่อนหรือหลุดเข้า git → **แก้:** validate length ≥ 32 ใน config/env.js

### Git Commit
```
feat(auth): implement JWT authentication and role-based access control

- register, login endpoints with bcrypt password hashing
- JWT sign/verify with configurable expiry
- auth middleware and role guard factory
- rate limiting on login endpoint
- input validation with Joi
```

---

## Phase 5: AI Squad Scanner & Valuation Service Integration

### เป้าหมาย
รับรูปภาพ Squad จาก Seller → ส่งไป Vision API → สกัดนักเตะ → คำนวณ Fair Price

### งานที่ต้องทำ

| # | งาน | ไฟล์/Module |
|---|-----|-----------|
| 5.1 | `middleware/upload.js` — Multer config (disk, UUID filename, 10MB/file, 10 files max) | `backend/src/middleware/upload.js` |
| 5.2 | `services/ai-vision.service.js` — ส่งรูปไป Gemini Vision / GPT-4o, parse response เป็น JSON | `backend/src/services/ai-vision.service.js` |
| 5.3 | Design Vision Prompt — สกัด: ชื่อนักเตะ, tier, ตำแหน่ง, team_strength | `backend/src/services/ai-vision.service.js` |
| 5.4 | `services/valuation.service.js` — คำนวณ Fair Price จาก team_strength + rare player count + price_history | `backend/src/services/valuation.service.js` |
| 5.5 | `services/valuation.service.js` — คำนวณ Value Badge (GREAT_VALUE/FAIR/OVERPRICED) | `backend/src/services/valuation.service.js` |
| 5.6 | `models/scan.model.js` — createScan, updateScanStatus, getScanById | `backend/src/models/scan.model.js` |
| 5.7 | `models/valuation.model.js` — createValuation, getByScandId | `backend/src/models/valuation.model.js` |
| 5.8 | `controllers/scans.controller.js` — submit, getResult, confirmScan | `backend/src/controllers/scans.controller.js` |
| 5.9 | `routes/scans.routes.js` — POST /scans, GET /scans/:id, PATCH /scans/:id/confirm, GET /scans/:id/valuation | `backend/src/routes/scans.routes.js` |
| 5.10 | Cleanup temp files หลัง AI process (success + error path) | `backend/src/services/ai-vision.service.js` |

### Acceptance Criteria
- [x] `POST /api/v1/scans` + รูป Squad → scan record สร้าง status=PROCESSING (Verified: HTTP 201, scan_id created, status PROCESSING)
- [x] AI ประมวลผลสำเร็จ → scan status=COMPLETED, players ถูกบันทึก (Verified: status COMPLETED, players matched with catalog)
- [x] `GET /api/v1/scans/:id/valuation` → return fair_price_min, fair_price_max, algorithm_version (Verified: HTTP 200 with valuation & badge)
- [x] AI ล้มเหลว (API down / รูปเบลอ) → status=FAILED, error_message ชัดเจน (Verified: status FAILED, error_message recorded)
- [x] temp files ถูกลบหลัง process (ตรวจ `backend/uploads/` ว่าว่าง) (Verified: uploads directory empty in both success and failure)
- [x] รูปที่ไม่ใช่ image type → 400 validation error (Verified: HTTP 400 INVALID_FILE_TYPE)
- [x] ไฟล์ขนาดเกิน 10MB → 400 validation error (Verified: HTTP 400 FILE_TOO_LARGE)

### ความเสี่ยง
- Vision API key ใน env ไม่ถูกต้อง → **แก้:** test env ด้วย simple prompt ก่อน integrate
- AI ตอบผิดรูปแบบ JSON → **แก้:** validate + fallback parse, retry 1 ครั้ง
- Cost overrun จาก Vision API → **แก้:** rate limit 5 scan/hr per user

### Git Commit
```
feat(ai): integrate vision api and valuation engine

- multer upload middleware with UUID rename and size limits
- ai-vision.service with Gemini/GPT-4o integration
- valuation.service with Fair Price calculation
- squad_scans and valuations CRUD
- temp file cleanup on success and error
- POST /scans, GET /scans/:id, PATCH /scans/:id/confirm
```

---

## Phase 6: Listing Management & Search/Filter Catalog API ✅

### เป้าหมาย
Seller สร้าง/แก้ไข/ยกเลิก Listing — Buyer ค้นหาและกรอง Listing พร้อม Badge

### งานที่ต้องทำ

| # | งาน | ไฟล์/Module |
|---|-----|-----------|
| 6.1 | `models/listing.model.js` — create, findById, findAll (with filters), update, softDelete | `backend/src/models/listing.model.js` |
| 6.2 | `models/listing.model.js` — search query: filter by player_name, price range, team_strength, badge, platform | |
| 6.3 | `models/player.model.js` — findAll (with filters), findById | `backend/src/models/player.model.js` |
| 6.4 | `controllers/listings.controller.js` — browse, detail, create, update, cancel, myListings | `backend/src/controllers/listings.controller.js` |
| 6.5 | `routes/listings.routes.js` — GET /listings, GET /listings/:id, POST /listings, PATCH, DELETE, GET /listings/me | `backend/src/routes/listings.routes.js` |
| 6.6 | `routes/players.routes.js` — GET /players, GET /players/:id, GET /players/tiers, GET /players/positions | `backend/src/routes/players.routes.js` |
| 6.7 | `routes/admin/listings.admin.routes.js` — suspend, restore, delete | `backend/src/routes/admin/listings.admin.routes.js` |
| 6.8 | Business rule: ห้ามสร้าง Listing ถ้า scan ยังไม่ COMPLETED | `backend/src/controllers/listings.controller.js` |
| 6.9 | Business rule: Active Listing สูงสุด 3 รายการ (SELLER), 10 (VERIFIED_SELLER) | |
| 6.10 | Pagination: `page`, `limit` ทุก list endpoint | |

### Acceptance Criteria
- [x] `GET /api/v1/listings` → list ที่ status=ACTIVE พร้อม pagination (Verified: HTTP 200 with pagination meta: page, limit, total, totalPages)
- [x] Filter: `?player_name=Messi` → เฉพาะ listing ที่มี Messi (Verified: matched listings with subquery on listing_player_cards)
- [x] Filter: `?min_price=500&max_price=2000` ทำงานถูกต้อง (Verified: returns listings within price range)
- [x] Filter: `?badge=GREAT_VALUE` ทำงานถูกต้อง (Verified: returns only listings flagged as GREAT_VALUE)
- [x] `POST /api/v1/listings` โดยไม่มี COMPLETED scan → 422 (Verified: HTTP 422 SCAN_NOT_FOUND / SCAN_NOT_COMPLETED)
- [x] Seller ที่มี 3 Active Listing สร้างเพิ่มไม่ได้ → 422 (Verified: HTTP 422 ACTIVE_LISTING_LIMIT_REACHED)
- [x] `DELETE /api/v1/listings/:id` เฉพาะ ACTIVE → CANCELLED (Verified: owner transitions status to CANCELLED)
- [x] Admin `PATCH /admin/listings/:id/suspend` → SUSPENDED (Verified: admin sets status to SUSPENDED & hidden from marketplace browse)

### ความเสี่ยง
- Search query ช้าเมื่อมี Listing จำนวนมาก → **แก้:** INDEX บน `status`, `asking_price`, `team_strength` + FULLTEXT ถ้าจำเป็น

### Git Commit
```
feat(listings): implement listing management and marketplace search API

- listing CRUD with soft delete
- search and filter by player, price, strength, badge, platform
- pagination support
- player master data endpoints
- admin listing moderation (suspend/restore)
- business rules: scan validation, active listing limit
```

---

## Phase 7: Escrow Order, Payment Flow & Timeout Scheduling API ✅

### เป้าหมาย
Buyer สร้าง Order → แนบสลิป → Moderator Approve → Escrow Hold → Handover Open (รวม cron jobs timeout)

### งานที่ต้องทำ

| # | งาน | ไฟล์/Module |
|---|-----|-----------|
| 7.1 | `models/order.model.js` — create, findById, updateStatus, findByBuyer, findBySeller | `backend/src/models/order.model.js` |
| 7.2 | `models/escrow.model.js` — create, updateStatus | `backend/src/models/escrow.model.js` |
| 7.3 | `models/order-status-log.model.js` — append-only insert | `backend/src/models/order-status-log.model.js` |
| 7.4 | `models/escrow-status-log.model.js` — append-only insert | `backend/src/models/escrow-status-log.model.js` |
| 7.5 | `services/escrow.service.js` — holdEscrow, releaseEscrow, refundEscrow | `backend/src/services/escrow.service.js` |
| 7.6 | `controllers/orders.controller.js` — createOrder, getOrder, myOrders, cancelOrder | `backend/src/controllers/orders.controller.js` |
| 7.7 | `controllers/orders.controller.js` — submitPayment, getPayment (Buyer) | |
| 7.8 | Admin: approvePayment, rejectPayment → trigger escrow hold + open handover | `backend/src/controllers/admin/orders.admin.controller.js` |
| 7.9 | Business rule: ห้ามซื้อ Listing ตัวเอง + race condition check (Listing ACTIVE) | |
| 7.10 | `jobs/order-payment-timeout.job.js` — cron ทุก 5 นาที: ตรวจ CREATED orders > 2h | `backend/src/jobs/order-payment-timeout.job.js` |
| 7.11 | `jobs/handover-seller-timeout.job.js` — cron ทุก 15 นาที: ตรวจ HANDOVER_OPEN > 72h | `backend/src/jobs/handover-seller-timeout.job.js` |
| 7.12 | `routes/orders.routes.js` + `routes/admin/orders.admin.routes.js` | |

### Acceptance Criteria
- [x] `POST /api/v1/orders` → Order CREATED + Listing RESERVED (Verified: HTTP 201, Order CREATED, Listing status RESERVED)
- [x] `POST /api/v1/orders` ซ้ำบน Listing เดียว → 409 (Verified: HTTP 409 LISTING_ALREADY_RESERVED)
- [x] Buyer ซื้อ Listing ตัวเอง → 422 (Verified: HTTP 422 CANNOT_BUY_OWN_LISTING)
- [x] Order ไม่ชำระใน 2 ชม. → EXPIRED + Listing → ACTIVE (cron) (Verified: Order EXPIRED, Listing relisted to ACTIVE)
- [x] Admin approve payment → Escrow HELD + Order PAYMENT_APPROVED (Verified: Escrow HELD, Order PAYMENT_APPROVED, 72h handover deadline)
- [x] Admin reject payment → Order CANCELLED + Listing ACTIVE (Verified: Order CANCELLED, Listing relisted to ACTIVE)
- [x] Seller ไม่ส่งใน 72 ชม. → Auto-cancel + Refund (cron) (Verified: Order REFUNDED, Escrow REFUNDED, Listing relisted to ACTIVE)
- [x] ทุก status change ถูกบันทึกใน order_status_logs (append-only) (Verified: append-only logs for CREATED -> PAYMENT_SUBMITTED -> PAYMENT_APPROVED -> REFUNDED)
- [x] ทุก escrow action ถูกบันทึกใน escrow_status_logs (append-only) (Verified: append-only logs for HELD -> REFUNDED)

### ความเสี่ยง
- Race condition: 2 Buyer กดซื้อพร้อมกัน → **แก้:** ใช้ DB transaction + SELECT FOR UPDATE บน Listing
- Cron job ทำงานซ้ำซ้อน → **แก้:** ใช้ DB lock หรือ idempotent check ก่อน process

### Git Commit
```
feat(escrow): implement order lifecycle, payment flow, and timeout jobs

- order CRUD with status machine
- escrow hold/release/refund service
- payment proof submission and admin review
- append-only status logs (order + escrow)
- cron jobs: payment timeout (2h), handover seller timeout (72h)
- race condition protection on listing reservation
```

---

## Phase 8: Secure Handover Room, Encryption & Dispute Resolution API

### เป้าหมาย
Handover Room ที่เข้ารหัส AES-256-GCM + ระบบ Dispute พร้อม Auto-release

### งานที่ต้องทำ

| # | งาน | ไฟล์/Module |
|---|-----|-----------|
| 8.1 | `utils/crypto.js` — encrypt(text, key) / decrypt(ciphertext, iv, key) ด้วย AES-256-GCM | `backend/src/utils/crypto.js` |
| 8.2 | `models/handover.model.js` — createRoom, updateRoom, submitInfo, deleteMessages | `backend/src/models/handover.model.js` |
| 8.3 | `services/handover.service.js` — encrypt before save, decrypt before return | `backend/src/services/handover.service.js` |
| 8.4 | `controllers/handover.controller.js` — getRoomStatus, submitAccountInfo (Seller), getAccountInfo (Buyer), confirmReceipt, reportProblem | `backend/src/controllers/handover.controller.js` |
| 8.5 | Hard delete handover_messages หลัง Buyer confirm | `backend/src/services/handover.service.js` |
| 8.6 | Handover access log บันทึกทุก action (who/when/action) | `backend/src/models/handover.model.js` |
| 8.7 | `models/dispute.model.js` — createDispute, findById, updateStatus, assignDispute | `backend/src/models/dispute.model.js` |
| 8.8 | `services/dispute.service.js` — openDispute (freeze escrow), resolveDispute (release/refund) | `backend/src/services/dispute.service.js` |
| 8.9 | `controllers/disputes.controller.js` — openDispute, getDispute, uploadEvidence, myDisputes | `backend/src/controllers/disputes.controller.js` |
| 8.10 | Admin: assignDispute, addComment, resolveForSeller, resolveForBuyer | `backend/src/controllers/admin/disputes.controller.js` |
| 8.11 | `jobs/buyer-auto-release.job.js` — cron ทุก 15 นาที: INFO_PROVIDED > 48h → Auto-release | `backend/src/jobs/buyer-auto-release.job.js` |
| 8.12 | `routes/handover.routes.js` + `routes/disputes.routes.js` | |

### Acceptance Criteria
- [x] Seller submit ข้อมูลบัญชี → เก็บใน DB encrypted (ตรวจ DB ตรงๆ ต้องอ่านไม่ออก) *(Verified: AES-256-GCM ciphertext + random 16-byte IV, plaintext unreadable in raw DB query)*
- [x] Buyer `GET /handover/:id/info` → decrypt + return ชัดเจน *(Verified: 200 OK returns plain konami_email, konami_password, and notes)*
- [x] หลัง Buyer confirm → handover_messages ถูก hard delete (row ไม่มีใน DB) *(Verified: 0 rows in DB, Escrow RELEASED, Order COMPLETED)*
- [x] `POST /handover/:id/problem` → Dispute สร้าง + Escrow FROZEN *(Verified: Order DISPUTED, Escrow FROZEN, Dispute record opened)*
- [x] Admin resolve for Buyer → Escrow REFUNDED + Order REFUNDED *(Verified: Escrow REFUNDED, Order REFUNDED, Listing relisted to ACTIVE)*
- [x] Admin resolve for Seller → Escrow RELEASED + Order COMPLETED *(Verified: Escrow RELEASED, Order COMPLETED, Dispute RESOLVED_SELLER)*
- [x] Auto-release หลัง 48 ชม. → Order COMPLETED + Escrow RELEASED (cron) *(Verified: 15-minute cron releases expired buyer reviews and permanently deletes credentials)*
- [x] Handover access log บันทึก IP + action ทุกครั้ง *(Verified: ROOM_OPENED, INFO_SUBMITTED, INFO_VIEWED, CONFIRMED logged in handover_access_logs)*

### ความเสี่ยง
- Encryption key หาย → ข้อมูลใน Handover อ่านไม่ได้ → **แก้:** backup key ใน secret manager, ไม่เก็บใน code
- AES-256-GCM ใช้ IV ซ้ำ → **แก้:** generate random IV ทุก encrypt, บันทึก IV คู่กับ ciphertext

### Git Commit
```
feat(handover): secure handover room with AES-256 encryption and dispute resolution

- AES-256-GCM encrypt/decrypt utility
- handover room lifecycle with access logging
- hard delete of credentials after confirmation
- dispute open/assign/resolve with escrow freeze/release
- cron job: buyer auto-release after 48h
```

---

## Phase 9: Dashboard, Metrics & Audit Report API

### เป้าหมาย
API สำหรับ Dashboard (Admin/Seller/Buyer), Analytics, Notifications, และ Audit Logs

### งานที่ต้องทำ

| # | งาน | ไฟล์/Module |
|---|-----|-----------|
| 9.1 | `controllers/dashboard.controller.js` — getBuyerDashboard, getSellerDashboard | `backend/src/controllers/dashboard.controller.js` |
| 9.2 | Admin analytics: GMV, Revenue, Escrow breakdown, Dispute stats | `backend/src/controllers/admin/analytics.controller.js` |
| 9.3 | Admin dashboard: pending payments, open disputes, pending KYC counts | |
| 9.4 | `models/notification.model.js` — create, findByUser, markRead, markAllRead | `backend/src/models/notification.model.js` |
| 9.5 | `services/notification.service.js` — createNotification (trigger point ทุก event) | `backend/src/services/notification.service.js` |
| 9.6 | `routes/notifications.routes.js` — GET, PATCH read, PATCH read-all, unread count | `backend/src/routes/notifications.routes.js` |
| 9.7 | `models/audit.model.js` — createLog, findAll (filters) | `backend/src/models/audit.model.js` |
| 9.8 | `routes/admin/audit.admin.routes.js` — GET audit-logs, handover-access-logs, escrow-logs | |
| 9.9 | `routes/admin/settings.admin.routes.js` — GET/PATCH platform_settings | |
| 9.10 | `routes/payouts.routes.js` — GET /payouts/me, /admin/payouts | `backend/src/routes/payouts.routes.js` |
| 9.11 | Public market data: `GET /market/price-history` | |
| 9.12 | Integrate notification.service ทุก critical event จาก Phase 7–8 | |

### Acceptance Criteria
- [x] `GET /api/v1/dashboard/seller` → summary cards ถูกต้อง (active listings, pending payout ฯลฯ) *(Verified: 200 OK returns active listings, total earned, pending payout, dispute count)*
- [x] `GET /api/v1/admin/dashboard` → GMV วันนี้ + pending actions count ถูกต้อง *(Verified: 200 OK returns active listings, pending payments, open disputes, GMV today, revenue today)*
- [x] Notification สร้างอัตโนมัติเมื่อ Order status change (ตรวจจาก DB) *(Verified: ORDER_CREATED, PAYMENT_APPROVED, HANDOVER_OPEN auto-created in notifications table)*
- [x] `GET /api/v1/notifications/unread-count` → count ถูกต้อง *(Verified: returns accurate unread count)*
- [x] `PATCH /api/v1/notifications/read-all` → ทุก notification is_read=1 *(Verified: updates is_read=1 and unread count reaches 0)*
- [x] `GET /api/v1/admin/audit-logs` → เห็น admin actions ย้อนหลัง *(Verified: historical audit trail with actor details returned)*
- [x] `PATCH /api/v1/admin/platform-settings/platform_fee_rate` → อัปเดต + บันทึก audit log *(Verified: setting updated to new value and entry inserted in audit_logs with before/after state)*

### Git Commit
```
feat(analytics): implement dashboard APIs, notifications, and audit logging

- buyer/seller/admin dashboard aggregation queries
- GMV, revenue, escrow analytics endpoints
- notification service with 25 event triggers
- audit log model and admin endpoints
- platform settings management
- public market price history API
```

---

## Phase 10: Frontend Foundation, MUI Theme & Routing

### เป้าหมาย
ตั้งค่า React app skeleton: MUI Theme, React Router, Layouts, Axios instance

### งานที่ต้องทำ

| # | งาน | ไฟล์/Module |
|---|-----|-----------|
| 10.1 | MUI 5 custom theme: colors, typography (Inter font), spacing | `frontend/src/theme/muiTheme.js` |
| 10.2 | React Router DOM v6 setup พร้อม routes skeleton ทุก 37 หน้า | `frontend/src/App.jsx` |
| 10.3 | สร้าง `PublicLayout.jsx` — Navbar + Footer | `frontend/src/layouts/PublicLayout.jsx` |
| 10.4 | สร้าง `UserLayout.jsx` — Topbar + Sidebar (Buyer/Seller sections) | `frontend/src/layouts/UserLayout.jsx` |
| 10.5 | สร้าง `HandoverLayout.jsx` — Fullscreen dark | `frontend/src/layouts/HandoverLayout.jsx` |
| 10.6 | สร้าง `AdminLayout.jsx` — Admin sidebar + Topbar | `frontend/src/layouts/AdminLayout.jsx` |
| 10.7 | `ProtectedRoute.jsx` — redirect ถ้าไม่ได้ login | `frontend/src/components/common/ProtectedRoute.jsx` |
| 10.8 | `AdminRoute.jsx` — redirect ถ้า role ไม่ใช่ ADMIN/MODERATOR | `frontend/src/components/common/AdminRoute.jsx` |
| 10.9 | `services/api.js` — Axios instance, base URL, JWT interceptor, error interceptor | `frontend/src/services/api.js` |
| 10.10 | Common components: `LoadingOverlay`, `StatusChip`, `ConfirmDialog` | `frontend/src/components/common/` |

### Acceptance Criteria
- [x] `npm run dev` → http://localhost:5173 ขึ้น MUI themed app
- [x] Navigate ไป `/marketplace` → Marketplace page (placeholder) โดยไม่ crash
- [x] Navigate ไป `/dashboard` โดยไม่ login → redirect ไป `/login`
- [x] Navigate ไป `/admin` โดยไม่ใช่ Admin → redirect ไป `/`
- [x] MUI theme สีและ font ใช้ได้บน Mobile browser (responsive)
- [x] Axios interceptor ส่ง `Authorization: Bearer <token>` ทุก request อัตโนมัติ

### Git Commit
```
feat(frontend): setup React 18 + MUI 5 theme, routing, and layouts

- MUI custom theme with Inter typography
- React Router DOM v6 with 37 route placeholders
- PublicLayout, UserLayout, HandoverLayout, AdminLayout
- ProtectedRoute and AdminRoute guards
- Axios instance with JWT interceptor
- common components: LoadingOverlay, ConfirmDialog, StatusChip
```

---

## Phase 11: Frontend Authentication, KYC & User Profile

### เป้าหมาย
Login, Register, JWT token management, KYC submit, Profile settings UI

### งานที่ต้องทำ

| # | งาน | ไฟล์/Module |
|---|-----|-----------|
| 11.1 | `AuthContext.jsx` — user state, token (localStorage), login/logout actions | `frontend/src/contexts/AuthContext.jsx` |
| 11.2 | `LoginPage.jsx` — form + API call + redirect | `frontend/src/pages/public/LoginPage.jsx` |
| 11.3 | `RegisterPage.jsx` — form + role selection (BUYER/SELLER) | `frontend/src/pages/public/RegisterPage.jsx` |
| 11.4 | `ForgotPasswordPage.jsx` + `ResetPasswordPage.jsx` | `frontend/src/pages/public/` |
| 11.5 | `ProfilePage.jsx` — display profile + edit form | `frontend/src/pages/shared/ProfilePage.jsx` |
| 11.6 | `KYCPage.jsx` — KYC status + form + dropzone | `frontend/src/pages/seller/KYCPage.jsx` |
| 11.7 | `services/auth.api.js` — register, login, logout, getMe, updateProfile, changePassword | `frontend/src/services/auth.api.js` |
| 11.8 | Persist token ใน localStorage + restore on page refresh | `frontend/src/contexts/AuthContext.jsx` |

### Acceptance Criteria
- [x] Register form → success → redirect ไป login
- [x] Login ด้วย credential ถูก → store token → redirect ไป dashboard
- [x] Login ผิด → แสดง error message
- [x] Refresh page → ยังคง login อยู่ (token ใน localStorage)
- [x] Logout → ลบ token + redirect ไป `/`
- [x] KYC form: upload 2 รูป → submit → แสดงสถานะ PENDING

### Git Commit
```
feat(frontend/auth): implement authentication flows and KYC submission

- login, register, forgot/reset password pages
- AuthContext with localStorage token persistence
- profile settings page with edit form
- KYC submission with file dropzone
```

---

## Phase 12: Marketplace Catalog, Squad Detail & Value-for-Money Badges UI

### เป้าหมาย
หน้า Browse Marketplace + Listing Detail พร้อม Filter/Sort และ Value Badge

### งานที่ต้องทำ

| # | งาน | ไฟล์/Module |
|---|-----|-----------|
| 12.1 | `ListingCard.jsx` — รูป, ราคา, Badge, Team Strength, นักเตะ Rare | `frontend/src/components/listing/ListingCard.jsx` |
| 12.2 | `ValueBadge.jsx` — 🟢🟡🔴 badge component | `frontend/src/components/common/ValueBadge.jsx` |
| 12.3 | `MarketplacePage.jsx` — grid + filter + sort + pagination | `frontend/src/pages/public/MarketplacePage.jsx` |
| 12.4 | `ListingFilterPanel.jsx` — player search, price range, strength, badge, platform | `frontend/src/components/listing/ListingFilterPanel.jsx` |
| 12.5 | `ListingDetailPage.jsx` — image gallery, player table, Fair Price display, Buy button | `frontend/src/pages/public/ListingDetailPage.jsx` |
| 12.6 | `LandingPage.jsx` — hero, featured listings, how it works | `frontend/src/pages/public/LandingPage.jsx` |
| 12.7 | `services/listings.api.js` — getListings, getListingById | `frontend/src/services/listings.api.js` |

### Acceptance Criteria
- [x] Marketplace แสดง Listing cards พร้อม Badge ถูกต้อง (ตามข้อมูล backend)
- [x] Filter: ใส่ชื่อนักเตะ → ผลกรองถูกต้อง
- [x] Filter: ราคา 500–2000 → เห็นเฉพาะ listing ในช่วงนั้น
- [x] Listing Detail: รูป Squad แสดงครบ + fair price range แสดง
- [x] Guest: ปุ่ม "ซื้อ" → redirect ไป login
- [x] Buyer: ปุ่ม "ซื้อ" → ไปที่ checkout
- [x] ใช้งานได้บน mobile (responsive)

### Git Commit
```
feat(frontend/marketplace): implement marketplace catalog and listing detail UI

- listing card with value badge, team strength, rare players
- marketplace page with search, filter, sort, and pagination
- listing detail with image gallery and fair price display
- landing page with featured listings
```

---

## Phase 13: Listing Creation Flow & AI Squad Scanner Upload UI

### เป้าหมาย
Seller สร้าง Listing ด้วย AI Scanner 3-step wizard

### งานที่ต้องทำ

| # | งาน | ไฟล์/Module |
|---|-----|-----------|
| 13.1 | `SquadDropzone.jsx` — react-dropzone, preview grid, validation | `frontend/src/components/scanner/SquadDropzone.jsx` |
| 13.2 | `ScanProgress.jsx` — loading animation + polling `GET /scans/:id` ทุก 3 วิ | `frontend/src/components/scanner/ScanProgress.jsx` |
| 13.3 | `PlayerResultTable.jsx` — editable table: ชื่อ, tier, position, confidence | `frontend/src/components/scanner/PlayerResultTable.jsx` |
| 13.4 | `ValuationDisplay.jsx` — Fair Price Range + Badge preview | `frontend/src/components/scanner/ValuationDisplay.jsx` |
| 13.5 | `CreateListingPage.jsx` — 3-step stepper wizard | `frontend/src/pages/seller/CreateListingPage.jsx` |
| 13.6 | Step 1: Upload + trigger scan | |
| 13.7 | Step 2: Review AI result + edit + confirm | |
| 13.8 | Step 3: กรอกราคา + description + publish (real-time Badge preview) | |
| 13.9 | `MyListingsPage.jsx` — table + tabs by status | `frontend/src/pages/seller/MyListingsPage.jsx` |
| 13.10 | `SellerDashboardPage.jsx` — summary cards + pending handover highlight | `frontend/src/pages/seller/SellerDashboardPage.jsx` |

### Acceptance Criteria
- [x] Seller อัปโหลดรูป → Scan loading animation ขึ้น → poll จนเสร็จ → แสดงผล *(Verified: Dropzone accepts up to 10 screenshots, displays ScanProgress with circular & linear progress, polls GET /api/v1/scans/:id every 3s until COMPLETED)*
- [x] Seller แก้ไข player name ใน editable table ได้ *(Verified: PlayerResultTable allows inline editing of player name, position, card tier, OVR rating, adding missing cards, deleting cards, and confirms via PATCH /api/v1/scans/:id/confirm)*
- [x] ตั้งราคา → Badge 🟢🟡🔴 อัปเดต real-time *(Verified: ValuationDisplay maps asking price against fair price range in real-time to GREAT_VALUE, FAIR_PRICE, or OVERPRICED badges)*
- [x] Publish Listing → ปรากฏบน Marketplace *(Verified: POST /api/v1/listings creates active listing and displays immediately in browse catalog and MyListings)*
- [x] AI ล้มเหลว → error message + ปุ่มลองใหม่ *(Verified: ScanProgress catches FAILED status or network error, renders Alert with retry button)*

### Git Commit
```
feat(frontend/seller): implement AI scanner wizard and listing creation flow

- squad dropzone with drag-and-drop and preview
- AI scan progress with polling
- editable player result table
- real-time value badge preview on price input
- 3-step listing creation wizard
- seller dashboard and my listings pages
```

---

## Phase 14: Escrow Checkout, Handover Vault & Dispute Interaction UI

### เป้าหมาย
Buyer ซื้อ → แนบสลิป → Handover Room → ยืนยัน/Dispute

### งานที่ต้องทำ

| # | งาน | ไฟล์/Module |
|---|-----|-----------|
| 14.1 | `BuyerDashboardPage.jsx` — active orders + priority highlight | `frontend/src/pages/buyer/BuyerDashboardPage.jsx` |
| 14.2 | `MyOrdersPage.jsx` — table + filter tabs | `frontend/src/pages/buyer/MyOrdersPage.jsx` |
| 14.3 | `OrderDetailPage.jsx` — step tracker timeline + payment + escrow status | `frontend/src/pages/buyer/OrderDetailPage.jsx` |
| 14.4 | `OrderTimeline.jsx` — step tracker component | `frontend/src/components/order/OrderTimeline.jsx` |
| 14.5 | `PaymentSubmitPage.jsx` — payment method + dropzone สลิป | `frontend/src/pages/buyer/PaymentSubmitPage.jsx` |
| 14.6 | `HandoverRoomPage.jsx` — shared (Buyer/Seller view ต่างกัน) | `frontend/src/pages/shared/HandoverRoomPage.jsx` |
| 14.7 | `CountdownTimer.jsx` — real-time countdown | `frontend/src/components/handover/CountdownTimer.jsx` |
| 14.8 | `AccountInfoBox.jsx` — decrypt on click + security notice | `frontend/src/components/handover/AccountInfoBox.jsx` |
| 14.9 | Seller view: ฟอร์มส่งข้อมูลบัญชี + confirm modal | |
| 14.10 | Buyer view: ปุ่ม "ยืนยัน" + ปุ่ม "พบปัญหา" + confirm dialog | |
| 14.11 | `OpenDisputePage.jsx` — reason select + description + evidence dropzone | `frontend/src/pages/buyer/OpenDisputePage.jsx` |
| 14.12 | `DisputeDetailPage.jsx` — timeline + evidence + status | `frontend/src/pages/shared/DisputeDetailPage.jsx` |

### Acceptance Criteria
- [x] Buyer กดซื้อ → Order created → redirect ไป Order detail *(Verified: ListingDetailPage opens checkout dialog, calls POST /api/v1/orders, safely unwraps nested envelope and redirects to /orders/:id)*
- [x] Buyer แนบสลิป → status update เป็น PAYMENT_SUBMITTED *(Verified: PaymentSubmitPage uploads slip image via dropzone to POST /api/v1/orders/:id/payment, transitions status to PAYMENT_SUBMITTED)*
- [x] Handover Room แสดง countdown timer ถูกต้อง *(Verified: HandoverRoomPage renders CountdownTimer component calculating real-time difference against expires_at / auto_release_at)*
- [x] Seller ส่งข้อมูล → Buyer เห็น "ดูข้อมูลบัญชี" ปรากฏ *(Verified: Seller submits credentials via POST /api/v1/handover/:id/submit encrypted with AES-256-GCM, transitioning room to INFO_PROVIDED and displaying AccountInfoBox to buyer)*
- [x] Buyer click "ดูข้อมูล" → decrypt + แสดง credentials *(Verified: AccountInfoBox calls GET /api/v1/handover/:id/info, decrypts AES-256-GCM credentials on demand with copy-to-clipboard)*
- [x] Buyer confirm → Order COMPLETED *(Verified: Buyer confirms receipt via POST /api/v1/handover/:id/confirm, releasing escrow to seller balance and marking status COMPLETED)*
- [x] Buyer กด "พบปัญหา" → Dispute form → submit → Dispute created *(Verified: OpenDisputePage submits reason and evidence to POST /api/v1/disputes, freezing escrow and redirecting to DisputeDetailPage)*
- [x] HandoverLayout fullscreen dark theme แสดงถูกต้อง *(Verified: HandoverLayout renders fullscreen zero-trust dark aesthetic at /handover/:order_id)*

### Git Commit
```
feat(frontend/checkout): implement escrow checkout, handover vault, and dispute UI

- buyer dashboard and order management pages
- payment proof upload with dropzone
- handover room with countdown timer and role-based views
- decrypt-on-click credentials display
- dispute filing with evidence upload
```

---

## Phase 15: Admin Dashboard, Escrow Monitoring & Dispute Handling UI

### เป้าหมาย
Admin/Moderator จัดการ Payment, Dispute, KYC, User, Settings

### งานที่ต้องทำ

| # | งาน | ไฟล์/Module |
|---|-----|-----------|
| 15.1 | `AdminDashboardPage.jsx` — stat cards + priority queue | `frontend/src/pages/admin/AdminDashboardPage.jsx` |
| 15.2 | `AdminOrdersPage.jsx` + `AdminOrderDetailPage.jsx` — approve/reject payment | |
| 15.3 | `DisputeManagementPage.jsx` — table + SLA highlight | `frontend/src/pages/admin/DisputeManagementPage.jsx` |
| 15.4 | `DisputeDetailAdminPage.jsx` — split panel (context + dispute case) | `frontend/src/pages/admin/DisputeDetailAdminPage.jsx` |
| 15.5 | `KYCReviewPage.jsx` + `KYCDetailPage.jsx` — view docs + approve/reject | |
| 15.6 | `UserManagementPage.jsx` + `UserDetailPage.jsx` | |
| 15.7 | `PlatformSettingsPage.jsx` — all config key-value form | |
| 15.8 | `EscrowManagementPage.jsx` — summary + table | |
| 15.9 | `PayoutManagementPage.jsx` — pending payouts + mark as paid | |
| 15.10 | `AnalyticsPage.jsx` — charts ด้วย Chart.js หรือ Recharts | |
| 15.11 | `AuditLogsPage.jsx` — log viewer + filter | |

### Acceptance Criteria
- [x] Admin เห็น Pending Payments list → click → ดูสลิป → Approve/Reject *(Verified: AdminOrdersPage + AdminOrderDetailPage with modal slip preview & approve/reject API)*
- [x] Moderator เห็น Dispute list sorted by SLA → click → split panel *(Verified: DisputeManagementPage with SLA badges + DisputeDetailAdminPage with split order/escrow/chat panels)*
- [x] Admin resolve Dispute for Buyer → Order status อัปเดต *(Verified: POST /api/v1/admin/disputes/:id/resolve/buyer triggers refundEscrow, updates order to REFUNDED, and marks dispute RESOLVED_BUYER)*
- [x] Admin Approve KYC → user.is_verified = true *(Verified: KYCReviewPage + KYCDetailPage approve action executes approveKyc model, updates user.is_verified=1 and role=VERIFIED_SELLER)*
- [x] Platform settings: แก้ไข fee rate → บันทึก → แสดงค่าใหม่ *(Verified: PlatformSettingsPage PATCH /api/v1/admin/platform-settings/:key updates platform_fee_rate and reloads settings)*
- [x] Analytics chart แสดง GMV trend ถูกต้อง *(Verified: AnalyticsPage visualizes GMV total volume, platform revenue, and timeline telemetry)*
- [x] ทุกหน้า admin ไม่สามารถเข้าถึงได้โดย BUYER (403) *(Verified: AdminRoute frontend guard redirects non-admins, and backend requireRole('ADMIN', 'MODERATOR') enforces HTTP 403 Forbidden)*

### Git Commit
```
feat(frontend/admin): implement admin dashboard, dispute resolution, and analytics UI

- admin dashboard with priority queue
- payment verification and escrow management
- dispute detail with split panel layout
- KYC review with document viewer
- platform settings management
- analytics charts and audit log viewer
```

---

## Phase 16: Real-time Notifications & Auto-Release Scheduler

### เป้าหมาย
Notification bell ใน UI polling + integrate notification.service กับทุก event + ทดสอบ cron jobs

### งานที่ต้องทำ

| # | งาน | ไฟล์/Module |
|---|-----|-----------|
| 16.1 | `NotificationContext.jsx` — poll `/notifications/unread-count` ทุก 30 วิ | `frontend/src/contexts/NotificationContext.jsx` |
| 16.2 | Notification bell ใน Topbar — badge count + dropdown preview | `frontend/src/components/common/Navbar.jsx` |
| 16.3 | `NotificationsPage.jsx` — full list + mark read | `frontend/src/pages/shared/NotificationsPage.jsx` |
| 16.4 | ทดสอบ notification trigger ทุก 25 events (N01–N25) | `backend/src/services/notification.service.js` |
| 16.5 | `jobs/dispute-sla.job.js` — cron ทุก 1 ชม.: ตรวจ Dispute > 36h → แจ้ง Admin (N25) | `backend/src/jobs/dispute-sla.job.js` |
| 16.6 | `services/scheduler.service.js` — register ทุก cron jobs ใน server.js | `backend/src/services/scheduler.service.js` |
| 16.7 | ทดสอบ auto-release cron: สร้าง Order → simulate 48h → ตรวจว่า COMPLETED | `backend/src/jobs/buyer-auto-release.job.js` |

### Acceptance Criteria
- [x] Bell icon แสดง unread count อัปเดตทุก 30 วิ *(Verified: NotificationContext 30s polling + NotificationBell MUI Badge + GET /api/v1/notifications/unread-count)*
- [x] เมื่อ Order status change → notification ปรากฏใน bell icon ของ user ที่เกี่ยวข้อง *(Verified: Order creation, payment slip submission, payment approval dispatch notifications to seller, admin, and buyer)*
- [x] Click notification → navigate ไป reference page *(Verified: NotificationBell + NotificationsPage reference navigation to Order, Handover, and Dispute views + PATCH /notifications/:id/read and /read-all)*
- [x] Auto-release cron: test ด้วย reduced timeout (ตั้ง config เป็น 1 นาทีสำหรับ test) → COMPLETED *(Verified: checkBuyerAutoRelease executes releaseEscrow, transitions order to COMPLETED, marks room AUTO_RELEASED, purges credentials, and sends N13/N14)*
- [x] Dispute SLA warning: test ด้วย dispute เก่า → Admin ได้รับ notification *(Verified: checkDisputeSlaWarnings checks SLA < 12h / > 36h and dispatches DISPUTE_SLA_WARNING N25 to Admins with deduplication)*

> **QA Verification Summary (Phase 16 Test Suite):**
> - Command: `npm --prefix backend run test:phase16`
> - Total Tests: 12 | **Passed: 12** | **Failed: 0** (100% Pass Rate)
> - Frontend Build: `npm --prefix frontend run build` (0 errors, 5.88s)
> - Verified Date: 2026-09-21

### Git Commit
```
feat(notifications): implement real-time notification polling and scheduler

- notification context with 30s polling
- notification bell with unread count badge
- dispute SLA warning cron job
- scheduler service registering all cron jobs
- full notification event coverage (N01-N25)
```

---

## Phase 17: Docker Compose Integration (Dev)

### เป้าหมาย
รัน Full Stack ครบ 4 services ด้วย `docker compose up` command เดียว

### งานที่ต้องทำ

| # | งาน | ไฟล์/Module |
|---|-----|-----------|
| 17.1 | ตรวจสอบและ align `docker-compose.yml` ทุก service, ports, volumes, network | `docker-compose.yml` |
| 17.2 | `backend/Dockerfile.dev` — Node 20 + nodemon + volume mount | `backend/Dockerfile.dev` |
| 17.3 | `frontend/Dockerfile.dev` — Node 20 + vite --host | `frontend/Dockerfile.dev` |
| 17.4 | ตรวจสอบ `db` service: image mysql:8.0, mount `db/init/`, volume `mysql_data` | `docker-compose.yml` |
| 17.5 | ทดสอบ `docker compose up --build` → ทุก service healthy | |
| 17.6 | ทดสอบ Hot-reload: แก้ไข `backend/src/app.js` → backend restart อัตโนมัติ | |
| 17.7 | ทดสอบ HMR: แก้ไข `frontend/src/App.jsx` → browser อัปเดต | |
| 17.8 | ทดสอบ DB: `docker compose down -v && docker compose up` → SQL init run ใหม่ | |

### Acceptance Criteria
- [x] `docker compose up --build -d` → 4 containers up, healthy *(Verified: efootball_db, efootball_backend, efootball_frontend, efootball_phpmyadmin running on bridge network efootball_net)*
- [x] http://localhost:5173 → Frontend ขึ้น *(Verified: HTTP 200 text/html Vite dev server with proxy)*
- [x] http://localhost:5001/api/v1/health → `{ db: "connected" }` *(Verified: HTTP 200 status: healthy, db: connected, uptime tracking)*
- [x] http://localhost:8081 → phpMyAdmin login ได้ *(Verified: HTTP 200 text/html connected to db:3306)*
- [x] Backend hot-reload ทำงาน (nodemon) *(Verified: nodemon with legacyWatch enabled for Docker Windows bind-mount filesystem events)*
- [x] Frontend HMR ทำงาน (Vite) *(Verified: vite with host 0.0.0.0 and watch.usePolling: true)*
- [x] `docker compose down -v` → MySQL data cleared → `up` ใหม่ → init SQL run ใหม่ *(Verified: 01-init.sql and 02-seed.sql mounted under /docker-entrypoint-initdb.d:ro)*

> **QA Verification Summary (Phase 17 Docker Integration):**
> - Containers: `efootball_db` (3307->3306, healthy), `efootball_backend` (5001->5001), `efootball_frontend` (5173->5173), `efootball_phpmyadmin` (8081->80)
> - Health Check: `GET http://localhost:5001/api/v1/health` ➔ Status 200 `{ status: 'healthy', db: 'connected', version: '1.0.0' }`
> - Dev Tooling: Nodemon `legacyWatch: true` + Vite `watch.usePolling: true` (100% hot-reload on Docker Windows host mount)
> - Verified Date: 2026-09-21

### Git Commit
```
feat(docker): complete docker compose dev environment

- backend Dockerfile.dev with nodemon hot-reload
- frontend Dockerfile.dev with vite HMR support
- docker-compose.yml with all 4 services and network
- verified: up, hot-reload, DB persistence, phpMyAdmin
```

---

## Phase 18: End-to-End Integration Testing, Security Audit & Bug Fixing

### เป้าหมาย
ทดสอบ Full Flow ครบทุก Scenario + Security Audit + Fix bugs ก่อน deploy

### งานที่ต้องทำ

| # | งาน | วิธีทดสอบ |
|---|-----|---------|
| 18.1 | E2E Flow A: Seller ลงขาย (Upload → AI Scan → Create Listing) | Manual / Postman |
| 18.2 | E2E Flow B: Buyer ซื้อ → สลิป → Moderator Approve → Handover → Confirm | Manual |
| 18.3 | E2E Flow C: Dispute → Admin ตัดสิน → Refund | Manual |
| 18.4 | E2E Flow D: Seller timeout 72h → Auto-cancel → Refund | Cron test |
| 18.5 | E2E Flow E: Buyer timeout 48h → Auto-release → Payout | Cron test |
| 18.6 | Security: ตรวจ Handover credentials ใน DB → ต้องเห็น ciphertext เท่านั้น | DB inspection |
| 18.7 | Security: ตรวจ password_hash ใน DB → ต้องเป็น bcrypt hash | DB inspection |
| 18.8 | Security: ส่ง request โดยไม่มี token → ต้องได้ 401 ทุก protected route | Postman |
| 18.9 | Security: BUYER พยายาม approve payment → ต้องได้ 403 | Postman |
| 18.10 | Security: ส่งรูปที่เป็น .exe ที่เปลี่ยน extension เป็น .jpg → ต้องถูก reject | Upload test |
| 18.11 | Performance: ส่ง concurrent requests 50 ตัวไปที่ GET /listings → ต้องตอบ < 500ms | Artillery/k6 |
| 18.12 | Edge case: Race condition — 2 Buyer กดซื้อ Listing เดียวกันพร้อมกัน → 1 คนได้ 1 คน conflict | Concurrent test |
| 18.13 | Bug fixing: แก้ปัญหาที่พบจากการทดสอบทั้งหมด | |

### Acceptance Criteria
- [x] Flow A–E ทุก Flow ทำงานสำเร็จ end-to-end (Flow A, Flow B, Flow C, Flow D, Flow E ผ่าน 100%)
- [x] ไม่มี plain text credentials ใน DB (เข้ารหัสด้วย AES-256-GCM, Purge เมื่อจบ Order และ Auto-release)
- [x] Race condition ป้องกันได้ (1 Buyer ต่อ 1 Listing ด้วย SELECT FOR UPDATE ใน Transaction -> HTTP 201 และ HTTP 409)
- [x] CORS ป้องกัน origin ที่ไม่รู้จัก
- [x] File upload ที่ผิด type ถูก reject (Magic Bytes validation ปฏิเสธ disguised .exe/.elf)
- [x] Performance P95 < 500ms บน non-AI endpoints (50 concurrent requests ใช้เวลาเฉลี่ย ~4ms/req)

### Git Commit
```
fix: e2e testing fixes and security hardening

- fix race condition on listing reservation
- add magic bytes validation for file uploads
- fix escrow status log missing on auto-release
- fix notification not triggered on dispute resolution
- fix CORS blocking valid frontend requests
```

---

## Phase 19: Production Deployment (Railway + On-Premise)

### เป้าหมาย
Multi-stage Dockerfile + Railway config + On-premise compose สำหรับ Production

### งานที่ต้องทำ

| # | งาน | ไฟล์/Module |
|---|-----|-----------|
| 19.1 | เขียน root `Dockerfile` — Stage 1 build frontend, Stage 2 backend + static serve | `Dockerfile` |
| 19.2 | `backend/src/app.js` — production mode: serve `public/index.html` สำหรับ GET /* | `backend/src/app.js` |
| 19.3 | เขียน `railway.toml` — builder, startCommand, healthcheck | `railway.toml` |
| 19.4 | ทดสอบ `docker build -t efootball-app .` → build สำเร็จ | Local |
| 19.5 | ทดสอบ `docker run -p 5001:5001 efootball-app` → serve frontend + API | Local |
| 19.6 | เขียน `docker-compose.prod.yml` — backend + db + nginx | `docker-compose.prod.yml` |
| 19.7 | เขียน `nginx/default.conf` — proxy /api + serve static | `nginx/default.conf` |
| 19.8 | ตั้งค่า Environment Variables บน Railway Dashboard ครบ | Railway Dashboard |
| 19.9 | ตั้งค่า TiDB Cloud: สร้าง DB, สร้าง user, run init SQL, เปิด SSL | TiDB Cloud Console |
| 19.10 | Deploy ไป Railway → ทดสอบ production URL | Railway |
| 19.11 | เพิ่ม env VITE_API_URL ที่ถูกต้องใน Vercel (ถ้า deploy frontend แยก) | Vercel Dashboard |
| 19.12 | สร้าง `docs/deployment/DEPLOYMENT.md` — ขั้นตอน deploy ครบ | `docs/deployment/DEPLOYMENT.md` |

### Acceptance Criteria
- [ ] `docker build` สำเร็จ (multi-stage, ไม่มี error)
- [ ] Container รัน: GET `/` → Frontend HTML, GET `/api/v1/health` → `{ db: "connected" }`
- [ ] Railway deploy: production URL เปิดได้, API ทำงาน, TiDB connected
- [ ] TiDB SSL connection สำเร็จ (`rejectUnauthorized: true`)
- [ ] CORS production origin ถูกต้อง (ไม่ได้ใช้ localhost)
- [ ] Secrets ไม่มีใน git — ทุกอย่างผ่าน Railway env vars

### ความเสี่ยง
- TiDB Cloud connection string ผิดรูปแบบ → **แก้:** ทดสอบ connection ด้วย test script ก่อน deploy
- Frontend build ใน Docker เบิ้ล memory → **แก้:** ใช้ `node:20-alpine` ใน build stage

### Git Commit
```
feat(deploy): production deployment configuration

- multi-stage Dockerfile (frontend build + backend serve)
- railway.toml with health check configuration
- docker-compose.prod.yml for on-premise deployment
- nginx/default.conf as reverse proxy
- deployment documentation

git tag v1.0.0-rc1
```

---

## Dependency Graph

```
Phase 0 (Planning)
  └─► Phase 1 (Setup)
        ├─► Phase 2 (DB Schema)
        │     └─► Phase 3 (Backend Core)
        │           └─► Phase 4 (Auth)
        │                 ├─► Phase 5 (AI Scan)
        │                 │     └─► Phase 6 (Listings)
        │                 │           └─► Phase 7 (Escrow)
        │                 │                 └─► Phase 8 (Handover)
        │                 │                       └─► Phase 9 (Dashboard)
        │                 └─► Phase 10 (Frontend Foundation)
        │                       └─► Phase 11 (Frontend Auth)
        │                             └─► Phase 12 (Marketplace UI)
        │                                   └─► Phase 13 (Listing UI)
        │                                         └─► Phase 14 (Checkout UI)
        │                                               └─► Phase 15 (Admin UI)
        │                                                     └─► Phase 16 (Notifications)
        │                                                           └─► Phase 17 (Docker)
        │                                                                 └─► Phase 18 (Testing)
        │                                                                       └─► Phase 19 (Deploy)
        └─► (Backend Phase 3–9 และ Frontend Phase 10–16 สามารถ parallel ได้บางส่วน)
```

---

## Risk Summary

| Risk | Phase | ความเสี่ยง | แนวทางรับมือ |
|------|-------|-----------|------------|
| Vision API quota/cost | 5 | สูง | Rate limit, mock ในช่วง dev |
| TiDB SSL config | 2, 19 | กลาง | ทดสอบ connection ก่อน deploy |
| AES key management | 8 | สูง | ไม่เก็บใน code, use secret manager |
| Race condition (order) | 7 | กลาง | DB transaction + SELECT FOR UPDATE |
| Docker memory ใน build | 19 | ต่ำ | ใช้ alpine image |
| MUI + React 18 peer dep | 1 | ต่ำ | --legacy-peer-deps |

---

*Planning Phase สมบูรณ์ — รอ Approve เพื่อเริ่ม Phase 1 Implementation*

# 00 — Tech Stack Decision

**Project:** eFootball Smart Marketplace & Squad Valuation
**Document Type:** Architecture Decision Record (ADR)
**Status:** Approved
**Last Updated:** 2026-09-20

---

## 1. Project Name

**eFootball Smart Marketplace & Squad Valuation**

ระบบตลาดซื้อขายนักเตะและประเมินมูลค่าทีมสำหรับเกม eFootball

---

## 2. Purpose of the System

ระบบ Web Application สำหรับผู้เล่น eFootball ที่ต้องการ:

- **ซื้อขายนักเตะ** ผ่าน Marketplace กลาง
- **ประเมินมูลค่าทีม (Squad Valuation)** จากสถิติและ Rating ของนักเตะ
- **บริหารจัดการ Squad** รวมถึงการจัดรูปแบบทีม (Formation)
- **ติดตามราคาตลาด** ของนักเตะแต่ละตำแหน่ง

---

## 3. Selected Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | React | 18 |
| Frontend Build Tool | Vite | 5 |
| UI Component Library | Material UI (MUI) | 5 |
| Backend Runtime | Node.js LTS | 20 |
| Backend Framework | Express | 4 |
| Database | MySQL | 8 |
| ORM / Query Builder | mysql2 (promise pool) | Latest |
| Containerisation (Dev) | Docker Compose | v2 (no version field) |
| DB Admin Tool (Dev) | phpMyAdmin | Latest |
| Production Platform | Railway | — |
| Language | JavaScript (ESM/CJS) | — |

---

## 4. Reason for Each Technology

### React 18
- Ecosystem ขนาดใหญ่ มี community support สูง
- Concurrent features (Suspense, useTransition) รองรับ UX ที่ดี
- ทีมมีความคุ้นเคยอยู่แล้ว

### Vite 5
- Build เร็วกว่า CRA อย่างมีนัยสำคัญ
- HMR (Hot Module Replacement) เกือบ instant
- รองรับ ESM native ไม่ต้อง bundle ตอน dev

### Material UI (MUI) 5
- Component library ที่สมบูรณ์ พร้อม theming system
- รองรับ Dark mode และ responsive layout ในตัว
- ลดเวลาพัฒนา UI ได้มาก

### Node.js 20 LTS
- LTS version มีความเสถียรสูง
- Ecosystem npm ครบครัน
- รองรับ top-level await และ native fetch API

### Express 4
- Framework ที่เรียบง่าย ยืดหยุ่น เหมาะกับ REST API
- Middleware ecosystem กว้าง (cors, helmet, morgan ฯลฯ)

### MySQL 8
- รองรับ JSON column, Window functions, CTE
- Charset `utf8mb4` รองรับภาษาไทยและ emoji ครบถ้วน
- ทำงานร่วมกับ TiDB Cloud ได้ (MySQL-compatible) เผื่อ migration

### Docker Compose (Dev)
- Isolate environment ระหว่าง services
- ทุกคนในทีมได้ environment เดียวกัน
- ง่ายต่อการ onboard developer ใหม่

### Railway (Production)
- Supports Dockerfile multi-stage build โดยตรง
- จัดการ SSL / Custom Domain เอง ไม่ต้องตั้ง Nginx แยก
- มี Railway Volume สำหรับ persistent storage ในอนาคต
- เชื่อมต่อกับ GitHub repository ได้ทันที (CI/CD)

---

## 5. Development Environment

### Port Mapping

| Service | Host Port | Container Port | หมายเหตุ |
|---------|-----------|---------------|---------|
| Frontend (Vite) | 5173 | 5173 | Hot Reload ผ่าน bind mount |
| Backend (Express) | 5001 | 5001 | Hot Reload ด้วย nodemon, **หลีกเลี่ยง 5000** |
| MySQL 8 | 3307 | 3306 | Host port 3307 เพื่อไม่ชนกับ MySQL local |
| phpMyAdmin | 8081 | 80 | DB Admin UI |

> **หมายเหตุ:** Backend ใช้ port **5001** เพื่อหลีกเลี่ยงการชนกับ macOS AirPlay Receiver ที่ใช้ port 5000

### Hot Reload Strategy

- **Frontend:** Vite HMR ผ่าน bind mount `./frontend:/app`
- **Backend:** nodemon watch ผ่าน bind mount `./backend:/app`
- `node_modules` ใช้ **anonymous volume** (`/app/node_modules`) ป้องกัน host overwrite

### Database Connection (Internal)

- Backend และ phpMyAdmin เชื่อมต่อ MySQL **ผ่านชื่อ service `db`** และ internal port `3306`
- ห้ามใช้ `localhost` หรือ `127.0.0.1` สำหรับ DB connection ภายใน Docker network

### Environment Variables

- กำหนดใน `.env` ที่ root directory
- อ้างอิงใน `docker-compose.yml` ด้วยรูปแบบ `${VARIABLE:-default_value}`
- ไฟล์ `.env` ถูก ignore โดย `.gitignore` เสมอ
- มี `.env.example` สำหรับ reference ที่ commit ได้

### MySQL healthcheck

- MySQL ต้องมี `healthcheck` ใน `docker-compose.yml`
- Service ที่พึ่งพา DB (`backend`, `phpmyadmin`) ต้องใช้:
  ```yaml
  depends_on:
    db:
      condition: service_healthy
  ```

### SQL Init Script

- วางไว้ที่ `db/init/01-init.sql`
- MySQL จะ execute อัตโนมัติเมื่อ container เริ่มต้นครั้งแรก (mount ไป `/docker-entrypoint-initdb.d/`)
- ใช้ charset `utf8mb4` และ collation `utf8mb4_unicode_ci` เพื่อรองรับภาษาไทย

### Apple Silicon (M1/M2/M3/M4) — ข้อควรระวัง

phpMyAdmin image อาจทำงานไม่ถูกต้องบน ARM architecture ให้กำหนด:

```yaml
phpmyadmin:
  platform: linux/amd64
```

---

## 6. Production Environment

### Primary Target: Railway

- ใช้ **root `Dockerfile` แบบ multi-stage** สำหรับ single-container deployment
- Railway จัดการ **SSL certificate และ custom domain** เอง ไม่ต้องตั้ง Nginx แยก
- Config ทุกอย่างผ่าน **Railway Environment Variables** (ไม่มี `.env` ใน production)
- Railway จะ build Docker image จาก repository และ deploy อัตโนมัติเมื่อ push ไป branch ที่กำหนด

### Multi-stage Dockerfile (root)

```
Stage 1: frontend-build  →  npm run build  →  ได้ /dist
Stage 2: backend-runner  →  copy /dist ไปเสิร์ฟผ่าน Express static
```

### Alternative Target: On-Premise / Ubuntu VPS

- ใช้ Docker image เดียวกัน ร่วมกับ MySQL container และ Nginx reverse proxy
- Nginx ทำหน้าที่ SSL termination และ proxy ไปยัง container
- **ไม่มีการผูก source code กับ deployment target ใด target หนึ่ง**
- เปลี่ยน target ได้โดยเปลี่ยน environment variables เท่านั้น

### Production Constraints

- **ห้าม** ฝัง secrets หรือ production config ใน source code โดยตรง
- **ต้องใช้** environment variables ทั้งหมดสำหรับ DB credentials, JWT secret, API keys
- **Railway filesystem เป็น ephemeral** — ไฟล์ที่ upload จะหายเมื่อ container restart
  - หากมีฟีเจอร์ upload ไฟล์ในอนาคต ต้องใช้ **Railway Volume** หรือ **Object Storage** (เช่น AWS S3, Cloudflare R2)

---

## 7. Tools Required

### Development Tools

| Tool | Purpose | Required |
|------|---------|---------|
| Docker Desktop | รัน Docker Compose | ✅ |
| Node.js 20 LTS | Local development (นอก Docker) | ✅ |
| Git | Version control | ✅ |
| VS Code | Code editor | แนะนำ |
| Postman / Bruno | ทดสอบ API | แนะนำ |
| TablePlus / DBeaver | MySQL client (เสริม) | Optional |

### VS Code Extensions แนะนำ

- ESLint
- Prettier
- Docker
- MySQL (by cweijan)
- GitLens

---

## 8. Folder Strategy เบื้องต้น

```
ProjectRoot/
├── .env                        ← Environment variables (gitignored)
├── .env.example                ← Template (committed)
├── .gitignore
├── docker-compose.yml          ← Dev orchestration
├── Dockerfile                  ← Production multi-stage build
│
├── docs/
│   └── planning/
│       └── 00-tech-stack-decision.md   ← ไฟล์นี้
│
├── backend/
│   ├── Dockerfile.dev
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── config/
│       ├── middleware/
│       ├── routes/
│       └── utils/
│
├── frontend/
│   ├── Dockerfile.dev
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── theme/
│       ├── context/
│       ├── hooks/
│       ├── api/
│       ├── components/
│       └── pages/
│
└── db/
    └── init/
        └── 01-init.sql         ← Auto-executed on first container start
```

---

## 9. Constraints

| # | Constraint | Impact |
|---|-----------|--------|
| C1 | ห้ามใช้ port 5000 สำหรับ backend | ใช้ 5001 แทน |
| C2 | ห้ามผูก code กับ deployment target | ต้องใช้ env vars ทั้งหมด |
| C3 | ห้ามใส่ secrets ใน source code | บังคับใช้ .env และ platform env vars |
| C4 | Railway filesystem เป็น ephemeral | ห้าม store files บน local filesystem |
| C5 | ไม่ใช้ `version:` ใน docker-compose.yml | ใช้ Docker Compose v2 syntax |
| C6 | phpMyAdmin ใช้ service `db` ไม่ใช่ `localhost` | กำหนดใน PMA_HOST env var |

---

## 10. Assumptions

| # | Assumption |
|---|-----------|
| A1 | Developer ทุกคนมี Docker Desktop ติดตั้งและรันได้ |
| A2 | ใช้ JavaScript (ไม่ใช่ TypeScript) เพื่อลด boilerplate |
| A3 | Authentication ใช้ JWT (stateless) ไม่ใช้ Session |
| A4 | Single-tenant system (ไม่มี multi-organization) |
| A5 | ไม่มี real-time features (WebSocket) ใน scope นี้ |
| A6 | Railway จัดการ database connection pool เอง |

---

## 11. Open Questions

| # | คำถาม | ผู้รับผิดชอบ | กำหนด |
|---|------|------------|------|
| Q1 | จะใช้ Railway MySQL หรือ TiDB Cloud สำหรับ production DB? | Tech Lead | ก่อน deploy |
| Q2 | Password reset flow ต้องการ email service ไหม? | PO | Planning Phase 1 |
| Q3 | มี file upload (รูปนักเตะ) ในขอบเขต MVP ไหม? | PO | Planning Phase 1 |
| Q4 | ต้องการ rate limiting บน API ไหม? | Tech Lead | ก่อน deploy |

---

## 12. Key Decisions

| # | Decision | Rationale | Trade-off |
|---|---------|-----------|----------|
| D1 | ใช้ MUI 5 แทน custom CSS | เร็วกว่า มี component ครบ | Bundle size ใหญ่ขึ้น |
| D2 | Backend port 5001 | หลีกเลี่ยง macOS AirPlay port 5000 | ต้องกำหนด CORS และ proxy ให้ถูก |
| D3 | Single-container Railway deploy | ง่ายกว่า multi-service, ประหยัด cost | Scale แยก service ไม่ได้ |
| D4 | mysql2 แทน Sequelize/Prisma | ควบคุม query ได้เต็มที่ ไม่มี ORM overhead | ต้องเขียน SQL เอง |
| D5 | Anonymous volume สำหรับ node_modules | ป้องกัน architecture mismatch | ต้อง rebuild เมื่อเพิ่ม package |

---

## 13. Docker Service Map & Port Mapping

```
┌──────────────────────────────────────────────────────────┐
│                  Docker Bridge Network                    │
│                  (efootball_network)                      │
│                                                          │
│  ┌─────────────┐    /api/*    ┌─────────────────────┐   │
│  │  frontend   │ ──────────► │      backend         │   │
│  │  Vite:5173  │             │   Express:5001        │   │
│  └─────────────┘             └──────────┬──────────┘   │
│                                          │ mysql2        │
│  ┌─────────────┐             ┌──────────▼──────────┐   │
│  │ phpmyadmin  │ ──────────► │        db            │   │
│  │   :80       │  db:3306    │    MySQL 8:3306       │   │
│  └─────────────┘             └─────────────────────┘   │
└──────────────────────────────────────────────────────────┘

Host ←→ Container Port Map:
  localhost:5173  →  frontend:5173
  localhost:5001  →  backend:5001
  localhost:3307  →  db:3306
  localhost:8081  →  phpmyadmin:80
```

---

## 14. Docker Network Rules

1. **ใช้ custom bridge network เดียว** ชื่อ `efootball_network` ทุก service อยู่ใน network เดียวกัน
2. **Service ติดต่อกันผ่านชื่อ service** ไม่ใช้ IP address หรือ `localhost`
3. **Backend → DB:** ใช้ `DB_HOST=db` และ port `3306` (internal)
4. **phpMyAdmin → DB:** ใช้ `PMA_HOST=db` และ `PMA_PORT=3306`
5. **Frontend → Backend:** ในขั้น Dev ใช้ Vite proxy `/api → http://backend:5001`
6. **Host → Services:** เข้าถึงผ่าน mapped host ports เท่านั้น (5173, 5001, 3307, 8081)

---

## 15. Environment Variable Strategy

### Naming Convention

```
# Database
DB_HOST=db
DB_PORT=3306
DB_NAME=efootball_db
DB_USER=efootball_user
DB_PASSWORD=<secret>
DB_ROOT_PASSWORD=<secret>

# Backend
PORT=5001
NODE_ENV=development|production
JWT_SECRET=<secret>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173

# Frontend (VITE_ prefix บังคับสำหรับ Vite)
VITE_API_BASE_URL=http://localhost:5001/api

# phpMyAdmin
PMA_HOST=db
PMA_PORT=3306
```

### ระดับความลับ

| Level | Variables | Strategy |
|-------|----------|---------|
| 🔴 Secret | `*_PASSWORD`, `JWT_SECRET` | `.env` only, never commit |
| 🟡 Config | `DB_HOST`, `PORT`, `NODE_ENV` | `.env` + platform env vars |
| 🟢 Public | `VITE_API_BASE_URL` | `.env.example` ได้ |

### หมายเหตุ Vite

ตัวแปรที่ต้องการใช้ใน Frontend React ต้องขึ้นต้นด้วย `VITE_` เสมอ เช่น:
- `VITE_API_BASE_URL` — ใช้ใน component ผ่าน `import.meta.env.VITE_API_BASE_URL`

---

## 16. Known Setup Risks / Lessons Learned

### ⚠️ R1 — Port 5000 ชนกับ macOS AirPlay Receiver
**ปัญหา:** macOS Monterey ขึ้นไปใช้ port 5000 สำหรับ AirPlay Receiver ทำให้ Express ไม่สามารถ bind ได้
**แก้ไข:** กำหนด backend port เป็น **5001** เสมอ และระบุให้ชัดเจนใน `.env` และ `Dockerfile`

---

### ⚠️ R2 — phpMyAdmin บน Apple Silicon (M1/M2/M3/M4)
**ปัญหา:** phpMyAdmin official image ไม่มี ARM64 build ทำให้ crash หรือทำงานช้ามากบน Apple Silicon
**แก้ไข:** กำหนด `platform: linux/amd64` ใน `docker-compose.yml` สำหรับ service phpmyadmin

```yaml
phpmyadmin:
  platform: linux/amd64
```

---

### ⚠️ R3 — `version:` ใน Docker Compose เป็น attribute ล้าสมัย
**ปัญหา:** Docker Compose v2 (plugin) ไม่ใช้ field `version:` อีกต่อไป การใส่ไว้จะได้รับ warning
**แก้ไข:** **ไม่ต้องใส่** `version:` ใน `docker-compose.yml` เลย

---

### ⚠️ R4 — `node_modules` ใน Docker ต้องใช้ anonymous volume
**ปัญหา:** หาก bind mount source code ทั้งหมดรวมถึง `node_modules` จาก host จะเกิดปัญหา:
- Platform mismatch (package บางตัว compile สำหรับ macOS ไม่ทำงานใน Linux container)
- Host ไม่มี `node_modules` ทำให้ mount empty directory ทับ
**แก้ไข:**
```yaml
volumes:
  - ./backend:/app          # bind mount source code
  - /app/node_modules       # anonymous volume ครอบ node_modules
```
**สำคัญ:** เมื่อเพิ่ม package ใหม่ใน `package.json` ต้อง rebuild container เสมอ:
```bash
docker compose up --build -d backend
```

---

### ⚠️ R5 — Backend เชื่อมต่อ DB ไม่ได้ถ้าไม่มี healthcheck
**ปัญหา:** MySQL ใช้เวลา init นานกว่า container จะ `running` จริงๆ Backend ที่ start ตาม `depends_on` ปกติจะ crash เพราะ DB ยังไม่พร้อม
**แก้ไข:** ต้องกำหนด healthcheck บน MySQL service และใช้ `condition: service_healthy`:
```yaml
backend:
  depends_on:
    db:
      condition: service_healthy
```

---

*เอกสารนี้จัดทำโดย Technical Lead — ห้ามแก้ไขโดยไม่ผ่าน ADR process*

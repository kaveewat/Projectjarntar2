# 09 — Project Structure & Docker Architecture

**Project:** eFootball Smart Marketplace & AI Valuation System
**Document Type:** Infrastructure & Project Architecture
**Status:** Draft
**Reference:** `05-database-design.md`, `06-api-contract.md`, `07-frontend-pages.md`, `08-dashboard-report-notification.md`
**Last Updated:** 2026-09-20

---

## 1. Project Folder Structure (Monorepo)

```
Projectjarntar2/                        ← Root (Git repo)
│
├── .agents/                            ← AI Skill config (Antigravity IDE)
│   └── skills/
│       └── efootball-dev/
│           └── SKILL.md
│
├── backend/                            ← Node.js 20 + Express 4
│   ├── src/
│   │   ├── server.js                   ← Entry point (listen, graceful shutdown)
│   │   ├── app.js                      ← Express app factory (middleware, routes)
│   │   │
│   │   ├── config/
│   │   │   ├── db.js                   ← MySQL2 connection pool
│   │   │   ├── env.js                  ← Validate & export env vars
│   │   │   └── cors.js                 ← CORS whitelist config
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js                 ← JWT verify middleware
│   │   │   ├── roleGuard.js            ← Role-based access guard
│   │   │   ├── errorHandler.js         ← Global error handler
│   │   │   ├── rateLimiter.js          ← express-rate-limit config
│   │   │   ├── upload.js               ← Multer config (disk/memory)
│   │   │   └── requestLogger.js        ← Morgan request logging
│   │   │
│   │   ├── routes/                     ← Express Router ทุก module
│   │   │   ├── auth.routes.js
│   │   │   ├── users.routes.js
│   │   │   ├── players.routes.js
│   │   │   ├── scans.routes.js
│   │   │   ├── listings.routes.js
│   │   │   ├── orders.routes.js
│   │   │   ├── handover.routes.js
│   │   │   ├── disputes.routes.js
│   │   │   ├── payouts.routes.js
│   │   │   ├── notifications.routes.js
│   │   │   ├── dashboard.routes.js
│   │   │   └── admin/
│   │   │       ├── users.admin.routes.js
│   │   │       ├── listings.admin.routes.js
│   │   │       ├── orders.admin.routes.js
│   │   │       ├── escrow.admin.routes.js
│   │   │       ├── disputes.admin.routes.js
│   │   │       ├── kyc.admin.routes.js
│   │   │       ├── payouts.admin.routes.js
│   │   │       ├── analytics.admin.routes.js
│   │   │       ├── audit.admin.routes.js
│   │   │       └── settings.admin.routes.js
│   │   │
│   │   ├── controllers/                ← Request/Response handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── users.controller.js
│   │   │   ├── players.controller.js
│   │   │   ├── scans.controller.js
│   │   │   ├── listings.controller.js
│   │   │   ├── orders.controller.js
│   │   │   ├── handover.controller.js
│   │   │   ├── disputes.controller.js
│   │   │   ├── payouts.controller.js
│   │   │   ├── notifications.controller.js
│   │   │   ├── dashboard.controller.js
│   │   │   └── admin/                  ← Admin-specific controllers
│   │   │
│   │   ├── services/                   ← Business Logic Layer
│   │   │   ├── auth.service.js         ← bcrypt, JWT sign/verify
│   │   │   ├── ai-vision.service.js    ← Gemini Vision / GPT-4o integration
│   │   │   ├── valuation.service.js    ← Fair Price calculation engine
│   │   │   ├── escrow.service.js       ← Escrow lifecycle (hold/release/refund)
│   │   │   ├── handover.service.js     ← AES-256-GCM encrypt/decrypt
│   │   │   ├── notification.service.js ← Create & deliver notifications
│   │   │   ├── storage.service.js      ← File upload (local dev / S3 prod)
│   │   │   └── scheduler.service.js    ← node-cron job registration
│   │   │
│   │   ├── jobs/                       ← Background cron jobs
│   │   │   ├── order-payment-timeout.job.js    ← 2h payment deadline
│   │   │   ├── handover-seller-timeout.job.js  ← 72h seller deadline
│   │   │   ├── buyer-auto-release.job.js       ← 48h auto-release
│   │   │   └── dispute-sla.job.js              ← 48h dispute SLA alert
│   │   │
│   │   ├── models/                     ← DB query functions (raw SQL / query builder)
│   │   │   ├── user.model.js
│   │   │   ├── listing.model.js
│   │   │   ├── order.model.js
│   │   │   ├── escrow.model.js
│   │   │   ├── handover.model.js
│   │   │   ├── dispute.model.js
│   │   │   ├── notification.model.js
│   │   │   ├── scan.model.js
│   │   │   ├── valuation.model.js
│   │   │   ├── player.model.js
│   │   │   └── audit.model.js
│   │   │
│   │   └── utils/
│   │       ├── response.js             ← Standard { success, data, message } helper
│   │       ├── crypto.js               ← AES-256-GCM encrypt/decrypt
│   │       ├── jwt.js                  ← JWT sign/verify helpers
│   │       ├── validators.js           ← Joi / express-validator schemas
│   │       └── logger.js               ← Winston logger
│   │
│   ├── uploads/                        ← Temp file storage (gitignored)
│   │   ├── squad-images/               ← รูป Squad (ลบหลัง AI scan)
│   │   ├── payment-proofs/             ← สลิปโอนเงิน (ลบหลัง upload to S3)
│   │   └── kyc-documents/             ← เอกสาร KYC (ลบหลัง upload to S3)
│   │
│   ├── public/                         ← [Production Only] Frontend dist จาก build
│   │
│   ├── .env                            ← Backend env (gitignored)
│   ├── .env.example                    ← Template env (committed)
│   ├── .gitignore
│   ├── nodemon.json                    ← Nodemon config (dev hot-reload)
│   └── package.json
│
├── frontend/                           ← React 18 + Vite 5 + MUI 5
│   ├── src/
│   │   ├── main.jsx                    ← React entry
│   │   ├── App.jsx                     ← Router setup
│   │   │
│   │   ├── components/                 ← Reusable UI components
│   │   │   ├── common/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── ValueBadge.jsx      ← 🟢🟡🔴 badge component
│   │   │   │   ├── CountdownTimer.jsx
│   │   │   │   ├── ConfirmDialog.jsx
│   │   │   │   ├── StatusChip.jsx
│   │   │   │   └── LoadingOverlay.jsx
│   │   │   ├── listing/
│   │   │   │   ├── ListingCard.jsx
│   │   │   │   ├── ListingFilterPanel.jsx
│   │   │   │   └── PlayerChip.jsx
│   │   │   ├── scanner/
│   │   │   │   ├── SquadDropzone.jsx   ← Drag & drop รูป
│   │   │   │   ├── ScanProgress.jsx    ← AI loading animation
│   │   │   │   ├── PlayerResultTable.jsx ← Editable scan results
│   │   │   │   └── ValuationDisplay.jsx
│   │   │   ├── order/
│   │   │   │   ├── OrderTimeline.jsx   ← Step tracker
│   │   │   │   ├── EscrowStatusCard.jsx
│   │   │   │   └── PaymentSlipUpload.jsx
│   │   │   ├── handover/
│   │   │   │   ├── HandoverHeader.jsx
│   │   │   │   ├── AccountInfoBox.jsx  ← Decrypt on click
│   │   │   │   └── HandoverActions.jsx
│   │   │   └── admin/
│   │   │       ├── StatCard.jsx
│   │   │       ├── AdminDataTable.jsx
│   │   │       └── PriorityQueue.jsx
│   │   │
│   │   ├── pages/                      ← 37 pages (ตาม 07-frontend-pages.md)
│   │   │   ├── public/
│   │   │   ├── buyer/
│   │   │   ├── seller/
│   │   │   ├── shared/
│   │   │   └── admin/
│   │   │
│   │   ├── layouts/
│   │   │   ├── PublicLayout.jsx
│   │   │   ├── UserLayout.jsx
│   │   │   ├── HandoverLayout.jsx      ← Fullscreen dark
│   │   │   └── AdminLayout.jsx
│   │   │
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx         ← User state, token management
│   │   │   └── NotificationContext.jsx ← Unread count polling
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useNotifications.js
│   │   │   └── useCountdown.js
│   │   │
│   │   ├── services/                   ← Axios API calls
│   │   │   ├── api.js                  ← Axios instance + interceptors
│   │   │   ├── auth.api.js
│   │   │   ├── listings.api.js
│   │   │   ├── orders.api.js
│   │   │   ├── scans.api.js
│   │   │   ├── handover.api.js
│   │   │   ├── disputes.api.js
│   │   │   ├── admin.api.js
│   │   │   └── notifications.api.js
│   │   │
│   │   ├── theme/
│   │   │   └── muiTheme.js             ← MUI 5 custom theme
│   │   │
│   │   └── utils/
│   │       ├── formatCurrency.js
│   │       ├── formatDate.js
│   │       └── badgeCalculator.js
│   │
│   ├── public/                         ← Static assets (favicon, og-image)
│   ├── index.html
│   ├── vite.config.js                  ← Proxy /api → backend:5001
│   ├── .env                            ← Frontend env (gitignored)
│   ├── .env.example
│   └── package.json
│
├── db/
│   └── init/                           ← MySQL init scripts (mount → /docker-entrypoint-initdb.d)
│       ├── 01-init.sql                 ← Schema: CREATE TABLE (27 tables)
│       └── 02-seed.sql                 ← Seed: games, platforms, card_tiers, positions, players
│
├── nginx/
│   └── default.conf                    ← Nginx config (On-premise prod only)
│
├── docs/
│   ├── planning/                       ← Planning docs (01–10)
│   ├── testing/                        ← Test plans
│   └── deployment/                     ← Deployment guides
│
├── .env                                ← Root env สำหรับ docker-compose (gitignored)
├── .env.example                        ← Root env template
├── .gitignore
├── docker-compose.yml                  ← Dev environment
├── docker-compose.prod.yml             ← On-premise production
├── Dockerfile                          ← Multi-stage build (Railway + on-premise)
├── railway.toml                        ← Railway deployment config
└── README.md
```

---

## 2. คำอธิบาย Folder และไฟล์ Config หลัก

| Path | คำอธิบาย |
|------|---------|
| `backend/src/server.js` | Entry point: สร้าง HTTP server, register cron jobs, graceful shutdown |
| `backend/src/app.js` | Express app: mount middleware, routes, error handler |
| `backend/src/config/db.js` | MySQL2 pool config: pool size 10, auto-reconnect, health check |
| `backend/src/config/cors.js` | CORS whitelist จาก `CORS_ORIGIN` env var |
| `backend/src/services/ai-vision.service.js` | Gemini Vision API / GPT-4o integration |
| `backend/src/services/handover.service.js` | AES-256-GCM encrypt/decrypt Konami credentials |
| `backend/src/services/scheduler.service.js` | Register cron jobs (order timeout, auto-release, etc.) |
| `backend/uploads/` | Temp dir สำหรับ Multer (gitignored) — ลบหลัง process |
| `backend/public/` | Frontend dist (prod only, copied จาก `frontend/dist`) |
| `frontend/vite.config.js` | Vite proxy: `/api` → `http://backend:5001` (Docker) หรือ `localhost:5001` (local) |
| `frontend/src/services/api.js` | Axios instance + JWT interceptor + error handling |
| `db/init/01-init.sql` | CREATE TABLE ทั้ง 27 ตาราง + INDEX |
| `db/init/02-seed.sql` | INSERT master data: games, platforms, card_tiers, positions |
| `Dockerfile` | Multi-stage build: Stage 1 (frontend build) + Stage 2 (backend serve) |
| `docker-compose.yml` | Dev services: db, phpmyadmin, backend, frontend |
| `docker-compose.prod.yml` | Prod on-premise: backend (serve static) + db + nginx |
| `railway.toml` | Railway deploy config: build command, start command, health check |
| `nginx/default.conf` | Nginx reverse proxy (on-premise): port 80 → backend:5001 |

---

## 3. Docker Services (Development)

### docker-compose.yml

| Service | Image | Container Name | วัตถุประสงค์ |
|---------|-------|---------------|------------|
| `db` | `mysql:8.0` | `efootball_db` | MySQL 8 database |
| `phpmyadmin` | `phpmyadmin:latest` | `efootball_pma` | DB admin UI (dev only) |
| `backend` | build `./backend` | `efootball_backend` | Node.js API server |
| `frontend` | build `./frontend` | `efootball_frontend` | Vite dev server |

---

## 4. Port Mapping

| Service | Host Port | Container Port | Protocol | หมายเหตุ |
|---------|-----------|--------------|---------|---------|
| `frontend` | `5173` | `5173` | HTTP | Vite HMR (Hot Module Reload) |
| `backend` | `5001` | `5001` | HTTP | Express API |
| `db` | `3307` | `3306` | TCP | 3307 เพื่อหลีกเลี่ยง conflict กับ local MySQL |
| `phpmyadmin` | `8081` | `80` | HTTP | Dev tool เท่านั้น |

**URL Dev:**
```
Frontend:   http://localhost:5173
Backend:    http://localhost:5001/api/v1
phpMyAdmin: http://localhost:8081
```

---

## 5. Docker Network

| Network | Driver | ชื่อ | ใช้กับ Service |
|---------|--------|-----|--------------|
| Custom Bridge | `bridge` | `efootball_network` | ทุก service |

**Internal Service Communication:**
```
frontend  → backend:5001    (Vite proxy /api → backend container)
backend   → db:3306         (DB_HOST=db, internal port 3306)
phpmyadmin→ db:3306         (PMA_HOST=db)
```

> [!IMPORTANT]
> Service ต่อถึงกันผ่าน **ชื่อ service** เสมอ — ห้ามใช้ `localhost` ระหว่าง containers
> - `DB_HOST=db` (ไม่ใช่ `localhost:3307`)
> - Frontend Vite proxy ชี้ไปที่ `http://backend:5001`

---

## 6. Docker Volumes

| Volume | ประเภท | Mount Target | วัตถุประสงค์ |
|--------|--------|-------------|------------|
| `mysql_data` | Named Volume | `/var/lib/mysql` | MySQL data persistence |
| `./db/init` | Bind Mount | `/docker-entrypoint-initdb.d` | Auto-run SQL init scripts ครั้งแรก |
| `./backend` | Bind Mount | `/app` (backend container) | Hot-reload dev code |
| `./frontend` | Bind Mount | `/app` (frontend container) | Hot-reload dev code |
| `./backend/uploads` | Bind Mount | `/app/uploads` | Temp file storage |

**Volume ที่ gitignore:**
```
/backend/uploads/
/backend/public/
mysql_data (named volume, managed by Docker)
```

---

## 7. Environment Variables

### 7.1 Root `.env` (Docker Compose)

```env
# MySQL
MYSQL_ROOT_PASSWORD=rootsecret
MYSQL_DATABASE=efootball_marketplace
MYSQL_USER=efootball_user
MYSQL_PASSWORD=efootball_pass

# phpMyAdmin
PMA_HOST=db
PMA_PORT=3306
```

### 7.2 `backend/.env`

```env
# Server
NODE_ENV=development
PORT=5001

# Database
DB_HOST=db                       ← ชื่อ service ใน Docker (production: TiDB host)
DB_PORT=3306
DB_NAME=efootball_marketplace
DB_USER=efootball_user
DB_PASSWORD=efootball_pass
DB_SSL=false                     ← true ใน production (TiDB Cloud)
DB_POOL_MIN=2
DB_POOL_MAX=10

# JWT
JWT_SECRET=your-super-secret-key-minimum-32-chars
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=another-secret-key
REFRESH_TOKEN_EXPIRES_IN=30d

# AI Vision Service
AI_VISION_PROVIDER=gemini        ← gemini | openai
AI_VISION_API_KEY=AIza...        ← Google AI Studio key หรือ OpenAI key
AI_VISION_MODEL=gemini-2.0-flash
AI_VISION_TIMEOUT_MS=30000

# Security
HANDOVER_ENCRYPTION_KEY=32-byte-hex-key-for-aes-256-gcm

# CORS
CORS_ORIGIN=http://localhost:5173

# File Upload
MAX_FILE_SIZE_MB=10
MAX_FILES_PER_SCAN=10
UPLOAD_TEMP_DIR=./uploads
STORAGE_TYPE=local               ← local | s3

# S3 (Production)
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_S3_BUCKET=
# AWS_S3_REGION=

# Platform Business Rules
PLATFORM_FEE_RATE=0.05
PAYMENT_DEADLINE_HOURS=2
HANDOVER_TIMEOUT_HOURS=72
BUYER_CONFIRM_DEADLINE_HOURS=24
AUTO_RELEASE_HOURS=48
DISPUTE_SLA_HOURS=48
```

### 7.3 `frontend/.env`

```env
VITE_API_URL=http://localhost:5001/api/v1
VITE_APP_NAME=eFootball Smart Marketplace
VITE_APP_ENV=development
```

### 7.4 Environment สำหรับ Production (Railway / Render)

```env
# อัปเดตจาก dev
NODE_ENV=production
DB_HOST=<tidb-cloud-host>        ← TiDB Cloud endpoint
DB_PORT=4000                     ← TiDB default port
DB_SSL=true
CORS_ORIGIN=https://your-frontend.vercel.app
STORAGE_TYPE=s3                  ← ใช้ S3 หรือ Cloudflare R2
```

---

## 8. Development Environment

### 8.1 Local Dev (ไม่ใช้ Docker)

```bash
# Terminal 1: MySQL (Docker เฉพาะ DB)
docker compose up db phpmyadmin -d

# Terminal 2: Backend
cd backend && npm install && npm run dev

# Terminal 3: Frontend
cd frontend && npm install && npm run dev
```

### 8.2 Full Docker Dev

```bash
docker compose up --build -d    ← Build + start ทุก services
docker compose logs -f          ← ดู log
docker compose down             ← หยุดทุก services
docker compose down -v          ← หยุด + ลบ volume (reset DB)
```

### 8.3 Hot-Reload Mechanism

| Service | Hot-reload | วิธี |
|---------|-----------|-----|
| `frontend` | ✅ Vite HMR | Volume mount `./frontend:/app`, Vite detect file change |
| `backend` | ✅ Nodemon | Volume mount `./backend:/app`, nodemon watch `src/` |
| `db` | ❌ — | ต้อง restart container ถ้าเปลี่ยน init SQL |

**nodemon.json:**
```json
{
  "watch": ["src/"],
  "ext": "js,json",
  "ignore": ["src/**/*.test.js", "uploads/"],
  "exec": "node src/server.js"
}
```

### 8.4 Vite Proxy Config (vite.config.js concept)

```
server.proxy:
  /api → target: http://backend:5001 (Docker)
       → target: http://localhost:5001 (Local)
  changeOrigin: true
```

> เลือก target ตาม `VITE_DOCKER=true` env var หรือ แยก vite.config.dev.js

---

## 9. Production Environment

### 9.1 Multi-Stage Dockerfile (Root `Dockerfile`)

**วัตถุประสงค์:** Build image เดียว รองรับทั้ง Railway และ On-premise

```
Stage 1: frontend-build
  ├── Base: node:20-alpine
  ├── WORKDIR /build/frontend
  ├── COPY frontend/package*.json → npm ci
  ├── COPY frontend/src, index.html, vite.config.js
  ├── ARG VITE_API_URL                   ← ส่ง build arg จาก Railway/CI
  └── RUN npm run build → dist/

Stage 2: production
  ├── Base: node:20-alpine
  ├── WORKDIR /app
  ├── COPY backend/package*.json → npm ci --only=production
  ├── COPY backend/src/ → /app/src/
  ├── COPY --from=frontend-build /build/frontend/dist → /app/public/
  ├── EXPOSE 5001
  └── CMD ["node", "src/server.js"]
      (backend serves: GET /api/* → API, GET /* → /app/public/index.html)
```

**Backend serves Static Files (Production concept):**
```javascript
// app.js (production mode)
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../public')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'))
  })
  // ยกเว้น /api/* routes
}
```

---

### 9.2 Target A — Railway Deployment

**ไฟล์ที่ใช้:** `Dockerfile` + `railway.toml`

```toml
# railway.toml (concept)
[build]
  builder = "DOCKERFILE"
  dockerfilePath = "Dockerfile"

[deploy]
  startCommand = "node src/server.js"
  healthcheckPath = "/api/v1/health"
  healthcheckTimeout = 30
  restartPolicyType = "ON_FAILURE"
```

**Railway Environment Variables:** ตั้งใน Railway Dashboard (DB, JWT, AI keys ฯลฯ)

**Request Flow (Railway):**
```
Internet → Railway Load Balancer → Container:5001
           GET /api/* → Express API routes
           GET /*     → Express serve /app/public/index.html
```

---

### 9.3 Target B — On-premise Deployment

**ไฟล์ที่ใช้:** `docker-compose.prod.yml` + `nginx/default.conf`

**Services:**
```
nginx      : port 80/443 (reverse proxy)
backend    : port 5001 (internal only)
db         : port 3306 (internal only)
```

**Request Flow (On-premise):**
```
Internet → Nginx:80
           /api/* → proxy_pass http://backend:5001
           /*      → proxy_pass http://backend:5001  (serve static)
```

**`nginx/default.conf` (concept):**
```nginx
upstream backend {
  server backend:5001;
}

server {
  listen 80;
  client_max_body_size 50M;   ← รองรับ file upload ขนาดใหญ่
  
  location /api/ {
    proxy_pass http://backend;
    proxy_set_header X-Real-IP $remote_addr;
  }
  
  location / {
    proxy_pass http://backend;
  }
}
```

---

### 9.4 Production Database (TiDB Cloud)

| | Dev | Production |
|-|-----|-----------|
| Host | `db` (Docker) | TiDB Cloud endpoint |
| Port | `3306` | `4000` |
| SSL | `false` | `true` (rejectUnauthorized: true) |
| Engine | MySQL 8 | TiDB (MySQL 8 compatible) |
| Init | `db/init/01-init.sql` | Manual migration หรือ CI script |

---

## 10. Engineering Considerations

### 10.1 CORS Configuration

```
Development:
  CORS_ORIGIN = http://localhost:5173
  Methods: GET, POST, PUT, PATCH, DELETE
  Headers: Content-Type, Authorization
  Credentials: true

Production:
  CORS_ORIGIN = https://your-frontend.vercel.app
  ไม่อนุญาต wildcard (*) ในทุกกรณี
```

**Rule:**
- `CORS_ORIGIN` อ่านจาก env var เท่านั้น ห้าม hardcode ใน code
- ถ้า Railway serve ทั้ง frontend + backend → CORS ไม่จำเป็น (same-origin)
- ถ้า Vercel (frontend) + Render (backend) → ต้องตั้ง CORS_ORIGIN ให้ถูก

---

### 10.2 MySQL Connection Pool & Auto-Reconnect

```
Pool Configuration:
  connectionLimit: 10          ← max concurrent connections
  waitForConnections: true
  queueLimit: 0                ← unlimited queue
  connectTimeout: 10000        ← 10 seconds

TiDB Production:
  ssl: { rejectUnauthorized: true }
  connectTimeout: 30000
```

**Auto-reconnect pattern:**
```
- MySQL2 pool จัดการ reconnect อัตโนมัติเมื่อ connection drop
- เพิ่ม error handler บน pool: pool.on('error', ...)
- Health check endpoint: GET /api/v1/health → query 'SELECT 1'
- Graceful shutdown: pool.end() ก่อน process.exit()
```

---

### 10.3 File Upload Management (Squad Images)

**Upload Flow:**

```
1. Multer รับไฟล์ → เก็บใน /app/uploads/squad-images/<uuid>.<ext> (temp)
2. Validate: type (JPG/PNG/WebP), size (≤ 10MB), count (≤ 10 files)
3. ส่งไปยัง AI Vision API (path หรือ base64)
4. AI process เสร็จ → ลบไฟล์ temp ทันที (unlink)
5. URL รูป (ถ้าต้องแสดง) → store ใน S3/Cloudflare R2
```

**Multer Config Rules:**
```
diskStorage destination: /app/uploads/
filename: uuid + timestamp + ext
fileFilter: อนุญาตเฉพาะ image/jpeg, image/png, image/webp
limits: fileSize: 10MB, files: 10
```

**Security Rules:**
```
✅ ตรวจ MIME type จาก magic bytes ไม่ใช่แค่ extension
✅ ลบ temp file ทันทีหลัง AI process (success หรือ error)
✅ temp directory ต้อง gitignore และไม่ expose เป็น public URL
✅ rename ไฟล์เป็น UUID ก่อนเก็บ (ป้องกัน path traversal)
✅ จำกัด upload endpoint ด้วย rate limiter (5 req/hour per user)
```

---

### 10.4 Temp File Cleanup Strategy

```
1. Success path: ลบหลัง upload to S3 / หลัง AI process
2. Error path:   ลบใน catch block (finally clause)
3. Orphan cleanup: Cron job ทุก 1 ชม. ลบไฟล์ temp เก่ากว่า 1 ชม.
```

---

### 10.5 Security Checklist (Architecture Level)

| ด้าน | มาตรการ |
|-----|--------|
| JWT | Secret ≥ 32 chars, expire 7d, อ่านจาก env เท่านั้น |
| Handover Encryption | AES-256-GCM, Key อ่านจาก env, IV random ทุก encrypt |
| SQL | ใช้ parameterized queries ทุก query — ห้าม string concatenation |
| Input Validation | Validate ทุก request body ด้วย Joi หรือ express-validator |
| File Upload | ตรวจ MIME type, จำกัดขนาด, ลบ temp ทันที |
| CORS | Whitelist เฉพาะ frontend domain ที่รู้จัก |
| Rate Limiting | Login: 10/15min, AI Scan: 5/hr, Orders: 10/hr |
| Headers | Helmet.js: X-Content-Type-Options, X-Frame-Options, HSTS |
| Secrets | ไม่มี secret ใน code หรือ git history เด็ดขาด |
| TiDB SSL | `rejectUnauthorized: true` ใน production |

---

## 11. Port & URL Reference Summary

### Development

| Service | URL | ใช้โดย |
|---------|-----|-------|
| Frontend (Vite) | `http://localhost:5173` | Browser |
| Backend API | `http://localhost:5001/api/v1` | Frontend, Postman |
| MySQL | `localhost:3307` | TablePlus, DBeaver (direct) |
| phpMyAdmin | `http://localhost:8081` | Browser (dev tool) |
| Health Check | `http://localhost:5001/api/v1/health` | Monitoring |

### Production (Railway)

| Service | URL |
|---------|-----|
| App (Frontend + API) | `https://<app>.railway.app` |
| API | `https://<app>.railway.app/api/v1` |
| TiDB | TiDB Cloud endpoint:4000 |

### Production (On-premise)

| Service | URL |
|---------|-----|
| App (via Nginx) | `http://your-server.com` |
| API | `http://your-server.com/api/v1` |

---

*Planning Step 9 of 11 — ยังไม่มี Code ใดๆ*

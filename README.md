# ⚡ eFootball Smart Marketplace & Squad Valuation

ระบบตลาดซื้อขายนักเตะและประเมินมูลค่าทีม สำหรับเกม eFootball

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 + MUI 5 |
| Backend | Node.js 20 LTS + Express 4 |
| Database | MySQL 8 (utf8mb4) |
| Dev Infra | Docker Compose + phpMyAdmin |
| Production | Railway (multi-stage Dockerfile) |

---

## Development Status

| Phase | Description | Status | Note |
|---|---|:---:|---|
| **Phase 0** | Requirement & Architecture Finalization | ✅ Done | 10 Planning Docs + PROJECT_CONTEXT.md |
| **Phase 1** | Project Setup & Monorepo Configuration | ✅ Done | Dependencies, configs, env templates, linting |
| **Phase 2** | Database Schema, Migration & Seed | ✅ Done | 30 tables MySQL 8 + 55 player cards seed |
| **Phase 3** | Backend Core & MySQL Connection Pool | ✅ Done | Express factory, MySQL2 pool, /health, error handler |
| **Phase 4** | Authentication, JWT & Role-Based Access Control | ✅ Done | JWT auth, bcryptjs, role guards, register/login |
| **Phase 5** | AI Squad Scanner & Valuation Service Integration | ✅ Done | Gemini Vision API, Squad OCR, Fair Price engine |
| **Phase 6** | Listing Management & Search/Filter Catalog API | ✅ Done | Account listings CRUD, multi-criteria filters, badges |
| **Phase 7** | Escrow Order, Payment Flow & Timeout Scheduling | ✅ Done | Orders, escrow hold, timeout cron, payment flow |
| **Phase 8** | Secure Handover Room, Encryption & Dispute Resolution | ✅ Done | AES-256 room, disputes, auto-release, audit log |
| **Phase 9** | Dashboard, Metrics & Audit Report API | ✅ Done | Aggregated dashboards, analytics, notifications, audit logs |
| **Phase 10** | Frontend Foundation, MUI Theme & Routing | ✅ Done | MUI Dark Theme, App.jsx routing skeleton, User/Public layouts |
| **Phase 11** | Frontend Authentication, KYC & User Profile | ✅ Done | Login, Register, KYC submission, Profile UI, auth.api.js |
| **Phase 12** | Marketplace Catalog, Squad Detail & Valuation Badges | ✅ Done | Browse listings, card preview, filters, value badges, detail UI |
| **Phase 13** | Listing Creation Flow & AI Squad Scanner Upload UI | ✅ Done | Dropzone, 3s scan polling, editable player table, real-time value badges, 3-step wizard, seller dashboard & my listings |
| **Phase 14** | Escrow Checkout, Handover Vault & Dispute Interaction UI | ✅ Done | Buyer order checkout, slip upload, encrypted handover room, disputes & notifications UI |
| **Phase 15** | Admin Dashboard, Escrow & Dispute Handling UI | ✅ Done | Executive dashboard, slip review, dispute resolution, KYC & user moderation, settings, analytics, player catalog master |
| **Phase 16** | Real-time Notifications & Auto-Release Scheduler | ✅ Done | Notification polling (30s), bell badge, dispute SLA (N25) & auto-release cron jobs (N13/N14), Thai localization & timezone offset fix |
| **Phase 17** | Docker Compose Integration (Dev) | ✅ Done | Full stack 4 services with single docker compose up, hot-reload, healthcheck |
| **Phase 18** | End-to-End Integration Testing & Security Audit | ✅ Done | 21 automated E2E & security assertions passed, Magic Bytes validation |
| **Phase 19** | Production Deployment | ⏳ Next | Railway + Production multi-stage Dockerfile |

---

## Port Mapping

| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:5173 |
| Backend (Express) | http://localhost:5001 |
| Backend Health Check | http://localhost:5001/api/v1/health |
| Backend Auth API | http://localhost:5001/api/v1/auth |
| Backend Scans API | http://localhost:5001/api/v1/scans |
| Backend Listings API | http://localhost:5001/api/v1/listings |
| Backend Players API | http://localhost:5001/api/v1/players |
| Backend Admin Players API | http://localhost:5001/api/v1/admin/players |
| Backend Orders API | http://localhost:5001/api/v1/orders |
| Backend Admin Escrow API | http://localhost:5001/api/v1/admin/escrow |
| Backend Handover API | http://localhost:5001/api/v1/handover |
| Backend Disputes API | http://localhost:5001/api/v1/disputes |
| Backend Admin Disputes API | http://localhost:5001/api/v1/admin/disputes |
| Backend Admin KYC API | http://localhost:5001/api/v1/admin/kyc |
| Backend Admin Users API | http://localhost:5001/api/v1/admin/users |
| Backend Notifications API | http://localhost:5001/api/v1/notifications |
| Backend Dashboard API | http://localhost:5001/api/v1/dashboard |
| Backend Admin Analytics API | http://localhost:5001/api/v1/admin/analytics |
| Backend Admin Audit API | http://localhost:5001/api/v1/admin/audit-logs |
| Backend Admin Settings API | http://localhost:5001/api/v1/admin/platform-settings |
| Backend Payouts API | http://localhost:5001/api/v1/payouts |
| Backend Public Market API | http://localhost:5001/api/v1/market |
| phpMyAdmin | http://localhost:8081 |
| MySQL (host) | localhost:3307 |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Git

---

## Getting Started

### 1. Clone and setup environment

```bash
git clone <repo-url>
cd Projectjarntar2

# Copy environment template and fill in secrets
cp .env.example .env
```

### 2. Start all services

```bash
docker compose up --build -d
```

> **First start:** MySQL takes ~30–60 seconds to initialise.
> Backend and frontend wait automatically via `depends_on: service_healthy`.

### 3. Verify everything is running

```bash
# Check all containers
docker compose ps

# Check backend health
curl http://localhost:5001/health

# View logs
docker compose logs -f
```

---

## Docker Commands

```bash
# Start all services (build images if needed)
docker compose up --build -d

# Stop all services (keep data)
docker compose down

# Stop and wipe database
docker compose down -v

# View logs for a specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Open shell inside a container
docker compose exec backend sh
docker compose exec db mysql -u efootball_user -p efootball_db

# Rebuild a single service (after adding npm packages)
docker compose up --build -d backend
docker compose up --build -d frontend
```

---

## Folder Structure

```
Projectjarntar2/
├── .agents/
│   └── skills/
│       └── efootball-dev/
│           └── SKILL.md
├── .env                    ← Environment variables (gitignored)
├── .env.example            ← Template — safe to commit
├── .eslintrc.json          ← ESLint configuration
├── .prettierrc             ← Prettier code style configuration
├── .gitignore              ← Git ignore rules
├── docker-compose.yml      ← Development orchestration
├── Dockerfile              ← Production multi-stage build (Railway)
├── README.md
│
├── db/
│   └── init/
│       └── 01-init.sql     ← Auto-executed on first DB start
│
├── backend/
│   ├── .env.example        ← Backend environment template
│   ├── Dockerfile.dev
│   ├── nodemon.json        ← Nodemon hot-reload configuration
│   ├── package.json        ← Express + MySQL2 + JWT + Security packages
│   └── src/
│       ├── app.js              ← Express factory & middleware mount
│       ├── index.js            ← Entrypoint
│       ├── server.js           ← HTTP server & graceful shutdown
│       ├── config/             ← env, db (MySQL2 pool), cors
│       ├── controllers/        ← auth, users, scans, listings, players, orders, admin (listings, orders)
│       ├── jobs/               ← order-payment-timeout (2h), handover-seller-timeout (72h)
│       ├── middleware/         ← auth (JWT), roleGuard, rateLimiter, upload (Multer), errorHandler, requestLogger
│       ├── models/             ← user, scan, valuation, listing, player, order, escrow, payment, status logs
│       ├── routes/             ← auth, users, scans, listings, players, orders, admin (listings, orders, escrow), health
│       ├── services/           ← auth.service, ai-vision.service, valuation.service, escrow.service
│       └── utils/              ← logger (Winston), response envelope, jwt, validators
│
├── frontend/
│   ├── .env.example        ← Frontend environment template
│   ├── Dockerfile.dev
│   ├── index.html
│   ├── package.json        ← React 18 + Vite 5 + MUI 5 packages
│   ├── vite.config.js      ← Vite build & proxy configuration
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── theme/
│       ├── context/
│       ├── api/
│       ├── components/
│       └── pages/
│
└── docs/
    └── planning/           ← 10 Planning documents + PROJECT_CONTEXT.md
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `MYSQL_ROOT_PASSWORD` | MySQL root password | — (required) |
| `MYSQL_PASSWORD` | App user password | — (required) |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | — (required) |
| `DB_HOST` | DB service name inside Docker | `db` |
| `BACKEND_PORT` | Express port | `5001` |
| `FRONTEND_PORT` | Vite port | `5173` |

> ⚠️ Never commit `.env` — it is gitignored.

---

## Development Notes

- **Hot Reload:** Both frontend and backend support hot reload via bind mounts
- **node_modules:** Uses anonymous Docker volumes — isolated from host
- **New npm package:** After adding a dependency, rebuild the container:
  ```bash
  docker compose up --build -d backend  # or frontend
  ```
- **Apple Silicon (M1/M2/M3/M4):** phpMyAdmin uses `platform: linux/amd64` — this is expected

---

## License

For educational purposes — eFootball Smart Marketplace & Squad Valuation System

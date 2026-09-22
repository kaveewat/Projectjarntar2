# PROJECT CONTEXT — eFootball Smart Marketplace & AI Valuation System

**Project:** eFootball Smart Marketplace & Squad Valuation  
**Repository:** `Projectjarntar2`  
**Last Updated:** 2026-09-20  
**Governance:** `efootball-dev` skill (`.agents/skills/efootball-dev/SKILL.md`)  

---

## 1. Project Background & Purpose

ระบบ **eFootball Smart Marketplace & AI Valuation System** เป็นตลาดกลางสำหรับซื้อขายบัญชีเกม eFootball ที่มุ่งเน้นแก้ปัญหา 3 ด้านหลักของการซื้อขายไอดีเกมในปัจจุบัน:
1. **การฉ้อโกง:** แก้ไขด้วย **Escrow System (ระบบคนกลางถือเงิน)** ที่เงินจะถูกพักไว้ในระบบจนกว่าผู้ซื้อจะได้รับและตรวจสอบบัญชีเรียบร้อย
2. **ราคาไม่มีมาตรฐาน:** แก้ไขด้วย **AI Vision & Valuation Engine** สกัดข้อมูลนักเตะและคำนวณช่วงราคาตลาดแนะนำ (Estimated Fair Price) พร้อมแสดงป้ายความคุ้มค่า (Value-for-Money Badges 🟢🟡🔴)
3. **การส่งมอบและดึงไอดีคืน:** แก้ไขด้วย **Secure Handover Room** ห้องนิรภัยเข้ารหัส (AES-256-GCM) สำหรับส่งมอบ Konami Credentials พร้อมระบบลบข้อมูลลับอัตโนมัติ (Hard Delete) และระบบระงับข้อพิพาท (Dispute Resolution)

---

## 2. Tech Stack & Service Map

| Layer | Technology | Version | Port (Host:Container) | Service Name |
|---|---|---|---|---|
| **Frontend** | React + Vite + MUI 5 | React 18, Vite 5, MUI 5 | `5173:5173` | `frontend` |
| **Backend** | Node.js LTS + Express | Node 20, Express 4 | `5001:5001` | `backend` |
| **Database** | MySQL (InnoDB, utf8mb4) | MySQL 8.0 | `3307:3306` | `db` |
| **DB Admin** | phpMyAdmin | latest | `8081:80` | `phpmyadmin` |
| **Production Target** | Railway / On-premise | Multi-stage Dockerfile | `80 / 443` | — |

> [!IMPORTANT]
> - Backend ใช้ Port **5001** เสมอ (หลีกเลี่ยง Port 5000 ของ macOS AirPlay)
> - Database Service Name ใน Docker Network คือ **`db`** (ห้ามใช้ `localhost` หรือ `mysql`)
> - Database Host Port คือ **3307** เพื่อไม่ให้ชนกับ Local MySQL ของเครื่องผู้พัฒนา

---

## 3. Core Domain Concepts

- **Konami ID & Game Account:** ข้อมูลล็อกอินเกม eFootball ประกอบด้วย Email และ Password ผู้ขายส่งมอบผ่าน Handover Room ซึ่งจะถูกเข้ารหัสระดับแถวข้อมูลและถูกลบทิ้งถาวรเมื่อการซื้อขายสำเร็จ
- **Third-party Account Linkage:** บัญชี eFootball อาจมีการผูกบัญชี Game Center (iOS), Google Play (Android) หรือ eFootball Point ผู้ขายต้องยืนยันว่าได้ปลดการเชื่อมต่อทั้งหมดแล้วก่อนส่งมอบ
- **Card Tiers:** ระดับความหายากของการ์ด eFootball ได้แก่ Normal, Epic, Show Time, Big Time
- **Team Strength:** ค่าพลังรวมของทีม (เช่น 2400–3150+)
- **Value-for-Money Badges:**
  - 🟢 **GREAT_VALUE:** ราคาขาย ≤ 85% ของ Fair Price
  - 🟡 **FAIR:** ราคาขาย 85% – 115% ของ Fair Price
  - 🔴 **OVERPRICED:** ราคาขาย > 115% ของ Fair Price

---

## 4. Data Model Overview (28 ตาราง แบ่งเป็น 8 กลุ่ม)

1. **User & Identity (2 ตาราง):** `users`, `user_kyc`
2. **Master / Reference Data (6 ตาราง):** `games`, `platforms`, `card_tiers`, `positions`, `player_cards`, `dispute_reasons`
3. **Listing & AI Scan (5 ตาราง):** `account_listings`, `listing_player_cards`, `squad_scans`, `scan_player_results`, `valuations`
4. **Order & Commerce (4 ตาราง):** `orders`, `payments`, `escrow_records`, `seller_payouts`
5. **Handover & Security (3 ตาราง):** `handover_rooms`, `handover_messages` (AES-256-GCM), `handover_access_logs`
6. **Dispute Resolution (3 ตาราง):** `disputes`, `dispute_evidence`, `dispute_comments`
7. **Logs & History (4 ตาราง - Append Only):** `order_status_logs`, `listing_status_logs`, `escrow_status_logs`, `audit_logs`
8. **Notification & Analytics (3 ตาราง):** `notifications`, `price_history`, `platform_settings`

---

## 5. State Machines Summary

### 5.1 Listing State Machine
`DRAFT` ➔ `SCANNING` ➔ `PENDING_REVIEW` ➔ `ACTIVE` ➔ `RESERVED` ➔ `SOLD` / `CANCELLED` / `SUSPENDED`

### 5.2 Order & Escrow Lifecycle
`CREATED` ➔ `PENDING_PAYMENT` (2h SLA) ➔ `PAYMENT_SUBMITTED` ➔ `PAYMENT_APPROVED` (Escrow: `HELD`) ➔ `HANDOVER_OPEN` ➔ `HANDOVER_INFO_PROVIDED` (72h SLA) ➔ `BUYER_REVIEWING` (24h-48h SLA) ➔ `COMPLETED` (Escrow: `RELEASED`) หรือ `DISPUTED` (Escrow: `FROZEN`) ➔ `DISPUTE_RESOLVED_BUYER` (Escrow: `REFUNDED`) / `DISPUTE_RESOLVED_SELLER` (`RELEASED`)

---

## 6. Security Architecture Standards

1. **User Passwords:** Hashed ด้วย `bcryptjs` (salt rounds ≥ 10)
2. **JWT Tokens:** เซ็นด้วยความยาว Secret ≥ 32 ตัวอักษร, Expiry 7 วัน (Access Token) และ 30 วัน (Refresh Token)
3. **Konami Credentials:** เข้ารหัสที่ Application Level ด้วย `AES-256-GCM` พร้อม IV แยกทุกระเบียน, Hard Delete ทันทีหลังจบขั้นตอน Handover
4. **KYC Data:** เข้ารหัสเลขบัตรประชาชน, จัดเก็บรูปบัตรใน Private Bucket
5. **Audit Trail:** ทุกการเปลี่ยนแปลงสถานะเงินและคำสั่งซื้อบันทึกลง Append-only Log ห้าม UPDATE หรือ DELETE

---

## 7. Planning & Governance Documentation Index

- `docs/planning/00-ai-working-rules.md` — กฎการทำงานร่วมกับ AI 18 หัวข้อ
- `docs/planning/00-tech-stack-decision.md` — การตัดสินใจเลือก Tech Stack
- `docs/planning/00-git-workflow.md` — Conventional Commits & Branching Strategy
- `docs/planning/01-system-overview.md` — ภาพรวมระบบและขอบเขต MVP
- `docs/planning/02-requirements.md` — Functional & Non-Functional Requirements
- `docs/planning/03-roles-permissions.md` — RBAC Matrix (Super Admin, Moderator, Verified Seller, Seller, Buyer)
- `docs/planning/04-workflow.md` — State Machines & Handover/Dispute Lifecycles
- `docs/planning/05-database-design.md` — MySQL 8 Schema 28 ตาราง
- `docs/planning/06-api-contract.md` — REST API Endpoints 12 Modules
- `docs/planning/07-frontend-pages.md` — สถาปัตยกรรมหน้าจอ 37 หน้าจอ 4 Layouts
- `docs/planning/08-dashboard-report-notification.md` — Metrics, Priority Queue & In-app Notifications
- `docs/planning/09-project-docker-architecture.md` — โครงสร้าง Monorepo & Docker Compose
- `docs/planning/10-implementation-plan.md` — แผนงาน 20 Phases พร้อมเกณฑ์ตรวจรับ

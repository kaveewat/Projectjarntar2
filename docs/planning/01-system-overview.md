# 01 — System Overview

**Project:** eFootball Smart Marketplace & AI Valuation System
**Document Type:** System Analysis
**Status:** Draft
**Last Updated:** 2026-09-20

---

## 1. Project Name

**eFootball Smart Marketplace & AI Valuation System**
*(ตลาดกลางซื้อขายและประเมินราคาไอดี eFootball ด้วย AI)*

---

## 2. Problem Statement

ตลาดซื้อขายบัญชีเกม eFootball ในปัจจุบันมีปัญหาหลัก 3 ด้าน:

| ปัญหา | รายละเอียด |
|-------|-----------|
| **การฉ้อโกง** | ผู้ขายรับเงินแล้วไม่ส่งบัญชี หรือส่งบัญชีที่ไม่ตรงตามที่โฆษณา |
| **ราคาไม่มีมาตรฐาน** | ผู้ขายตั้งราคาตามอำเภอใจ ผู้ซื้อไม่มีข้อมูลเปรียบเทียบ |
| **ขั้นตอนซับซ้อน** | ต้องตรวจนักเตะ, ต่อราคา, โอนเงิน, เปลี่ยน Konami ID เอง โดยไม่มีระบบรองรับ |

---

## 3. System Purpose

สร้างแพลตฟอร์มตลาดกลาง (Marketplace) สำหรับซื้อขายบัญชีเกม eFootball ที่:

- **ปลอดภัย** — ระบบคนกลางถือเงิน (Escrow) ป้องกันการโกง
- **โปร่งใส** — AI ประเมินมูลค่าทีมจากรูปภาพ ช่วยกำหนดราคาอ้างอิง
- **มีมาตรฐาน** — กระบวนการส่งมอบบัญชีที่ชัดเจน ตรวจสอบได้
- **ระงับข้อพิพาทได้** — มีระบบ Dispute สำหรับกรณีที่เกิดปัญหา

---

## 4. Target Users (Actors)

| Actor | บทบาท |
|-------|-------|
| **Buyer (ผู้ซื้อ)** | ค้นหา กรอง และซื้อบัญชีผ่านระบบ Escrow |
| **Seller (ผู้ขาย)** | อัปโหลดรูปทีม รับการประเมิน AI แล้วลงขายบัญชี |
| **Admin** | จัดการ Dispute อนุมัติหรือระงับ Listing ดูแลระบบ |
| **AI System** | สกัดข้อมูลนักเตะจากรูปภาพ และประเมินราคาตลาดแนะนำ |

---

## 5. System Boundary

### ✅ อยู่ใน Scope (MVP)

- ระบบสมัครสมาชิก / เข้าสู่ระบบ (JWT)
- อัปโหลดรูปหน้าจอ Squad → AI Vision สกัดข้อมูลนักเตะ
- แสดง Estimated Fair Price (ราคาตลาดแนะนำ)
- สร้าง Listing ขายบัญชี (ผู้ขายกำหนดราคาจริงได้อิสระ)
- ค้นหาและกรอง Listing ตามนักเตะ, ราคา, Team Strength
- Value-for-Money Badge (ป้ายประเมินความคุ้มค่า)
- Escrow System — ผู้ซื้อจ่ายเงินเข้าระบบ ระบบถือไว้ก่อน
- Handover Room — ห้องส่งมอบ Konami ID อย่างปลอดภัย
- Dispute System — เปิดเคสข้อพิพาท / Admin ตัดสิน
- Dashboard ผู้ซื้อ/ผู้ขาย — สถานะการซื้อขายและประวัติ
- Admin Dashboard — จัดการ Dispute, Listings, Users

### ❌ ไม่อยู่ใน Scope (MVP)

- ระบบเติมเงิน/ถอนเงินจริง (payment gateway) — ใช้ mock/manual transfer ก่อน
- การ chat แบบ real-time ระหว่างผู้ซื้อและผู้ขาย
- Rating/Review ผู้ขาย
- Mobile Application
- Multi-language Support

---

## 6. Core Modules

```
┌─────────────────────────────────────────────────────────┐
│               eFootball Smart Marketplace               │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │   Auth   │  │ AI Vision│  │   Listing Management │  │
│  │ Register │  │  Squad   │  │  Create / Edit /     │  │
│  │  Login   │  │  Parser  │  │  Search / Filter     │  │
│  └──────────┘  └────┬─────┘  └──────────────────────┘  │
│                     │                                   │
│  ┌──────────────────▼──────────────────────────────┐    │
│  │              Valuation Engine                   │    │
│  │  Fair Price Estimation + Value-for-Money Badge  │    │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Escrow   │  │   Handover   │  │    Dispute       │  │
│  │ System   │  │    Room      │  │    System        │  │
│  │ (Payment │  │ (Konami ID   │  │ (Admin resolves) │  │
│  │  Hold)   │  │  Transfer)   │  │                  │  │
│  └──────────┘  └──────────────┘  └──────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Dashboard & Notification            │   │
│  │    Buyer / Seller / Admin Views + Email/In-app   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Key User Flows

### Flow A — ผู้ขาย (Seller) ลงขายบัญชี

```
Register/Login
  → อัปโหลดรูปหน้าจอ Squad
    → AI Vision สกัด: นักเตะ Epic/Show Time/Big Time + Team Strength
      → แสดง Estimated Fair Price (AI แนะนำ)
        → ผู้ขายกำหนดราคาขายจริง (อิสระ)
          → กรอกรายละเอียดบัญชี (Platform, OS, ระดับ)
            → สร้าง Listing (สถานะ: Active)
```

### Flow B — ผู้ซื้อ (Buyer) ค้นหาและซื้อ

```
Register/Login
  → ค้นหา/กรอง Listing (นักเตะ, ราคา, Team Strength, Badge)
    → ดูรายละเอียด Listing + Value-for-Money Badge
      → กดซื้อ → โอนเงินเข้าระบบ Escrow
        → ระบบเปิด Handover Room
          → ผู้ขายส่ง Konami ID + Password ในห้อง
            → ผู้ซื้อยืนยันรับบัญชีสำเร็จ
              → ระบบปล่อยเงินให้ผู้ขาย
                → Transaction Complete ✅
```

### Flow C — เกิดข้อพิพาท (Dispute)

```
ผู้ซื้อกด "มีปัญหา" ในช่วง Handover
  → เปิด Dispute Case (พร้อม evidence)
    → Admin รับเคส → ตรวจสอบ
      → Admin ตัดสิน:
          ✅ คืนเงินให้ผู้ซื้อ (ปฏิเสธการปล่อยเงิน)
          ✅ ปล่อยเงินให้ผู้ขาย (หากการขายสมบูรณ์)
```

### Flow D — AI Vision & Valuation

```
รับรูปภาพ Squad จากผู้ขาย
  → ส่งไปยัง Multimodal LLM / Vision API
    → สกัข้อมูล:
        - รายชื่อนักเตะ (Epic, Show Time, Big Time)
        - ตำแหน่ง
        - Team Strength (ค่าพลังรวม)
    → คำนวณ Estimated Fair Price จาก:
        - ราคา reference จาก DB ของบัญชีที่ขายแล้ว
        - ค่าพลังรวมทีม
        - จำนวนและระดับนักเตะหายาก
    → แสดงผล: Fair Price Range + Value-for-Money Badge
```

---

## 8. Transaction Lifecycle (State Machine)

```
Listing States:
  Draft → Active → Reserved → Sold | Cancelled | Disputed

Order/Escrow States:
  Pending Payment
    → Payment Received (Escrow Held)
      → Handover In Progress
        → Buyer Confirmed ✅ → Released → Completed
        → Dispute Opened ⚠️ → Admin Review → Resolved
        → Timeout ⏱ → Auto Cancelled → Refunded
```

---

## 9. System Modules Summary

| Module | หน้าที่ | Priority |
|--------|---------|---------|
| **Auth** | Register, Login, JWT, Role | P0 |
| **AI Vision** | รับรูป → สกัดนักเตะ → ประเมินราคา | P0 |
| **Listing** | CRUD Listing, Search, Filter | P0 |
| **Valuation** | Fair Price Engine, Value Badge | P0 |
| **Escrow** | รับเงิน, ถือไว้, ปล่อย/คืน | P0 |
| **Handover Room** | ส่งมอบข้อมูลบัญชีปลอดภัย | P0 |
| **Dispute** | เปิดเคส, Admin Review, Resolve | P1 |
| **Dashboard** | Buyer/Seller/Admin views | P1 |
| **Notification** | In-app alerts, Email (future) | P2 |

---

## 10. Tech Stack (ตามที่ตัดสินใจในช่วง 0)

| Layer | Technology | หมายเหตุ |
|-------|-----------|---------|
| Frontend | React 18 + Vite 5 + MUI 5 | ตัดสินใจแล้ว — ไม่ใช้ Tailwind |
| Backend | Node.js 20 LTS + Express 4 | |
| Database | MySQL 8 (utf8mb4) | ตัดสินใจแล้ว — ไม่ใช้ MongoDB |
| AI/Vision | Multimodal LLM API (เช่น Google Gemini Vision หรือ OpenAI GPT-4o) | ตัดสินใจใน Phase 5 |
| Dev Infra | Docker Compose + phpMyAdmin | |
| DB (Production) | TiDB Cloud | MySQL-compatible + SSL |
| Backend Deploy | Render | Node.js service |
| Frontend Deploy | Vercel | Auto-detect Vite |

---

## 11. Assumptions

| # | Assumption |
|---|-----------|
| A1 | ระบบการเงินใน MVP ใช้การโอนเงินแบบ manual (แจ้งสลิป) — ไม่มี payment gateway จริง |
| A2 | AI Vision ใช้ third-party API (Gemini/GPT-4o) — ไม่ได้ train model เอง |
| A3 | ผู้ใช้งานหลักเป็นคนไทย — รองรับภาษาไทยเต็มรูปแบบ (utf8mb4) |
| A4 | Handover ทำผ่าน platform เท่านั้น ห้าม off-platform |
| A5 | Admin มีสิทธิ์สูงสุด สามารถ override ทุกการตัดสิน |
| A6 | ราคาที่ AI แนะนำเป็นเพียง "แนะนำ" — ผู้ขายกำหนดราคาจริงได้อิสระ |

---

## 12. Open Questions

| # | คำถาม | ผลกระทบ |
|---|------|--------|
| Q1 | จะใช้ Vision API ตัวไหน? (Gemini Vision / GPT-4o / อื่น) | กระทบ cost และ accuracy |
| Q2 | ระบบ Escrow รองรับช่องทางการชำระเงินอะไร? (QR Code PromptPay / Bank Transfer) | กระทบ Flow การยืนยันการชำระเงิน |
| Q3 | Handover Room มี timeout กี่ชั่วโมงก่อน auto-cancel? | กระทบ DB schema และ business logic |
| Q4 | ผู้ขายต้องยืนยันตัวตน (KYC) ก่อนลงขายหรือไม่? | กระทบ Trust และ Compliance |
| Q5 | Value-for-Money Badge ใช้เกณฑ์อะไร? (% ต่ำกว่า Fair Price เท่าไหร่?) | กระทบ Valuation algorithm |

---

## 13. Key Decisions

| # | Decision | Rationale |
|---|---------|-----------|
| D1 | ใช้ MySQL 8 ไม่ใช่ MongoDB | Schema มีความสัมพันธ์ชัดเจน (User, Listing, Order, Dispute) เหมาะกับ Relational DB |
| D2 | Escrow เป็น manual ก่อน | ลด complexity ของ MVP ไม่ต้องผูกกับ Payment Gateway |
| D3 | AI Vision เป็น External API | ไม่ต้อง train model เอง เร็วกว่า ใช้ได้เลย |
| D4 | Handover ผ่าน platform เท่านั้น | ลดความเสี่ยง off-platform fraud |
| D5 | Fair Price เป็น "แนะนำ" ไม่ใช่ "บังคับ" | ให้อิสระผู้ขาย ลดข้อโต้แย้ง |

---

## 14. System Quality Attributes

| Attribute | เป้าหมาย |
|-----------|---------|
| **Security** | JWT auth, bcrypt password, HTTPS only, secrets ใน env vars |
| **Reliability** | MySQL healthcheck, graceful error handling |
| **Usability** | MUI 5 design system, รองรับภาษาไทย |
| **Scalability** | Stateless backend (Render), Static frontend (Vercel), TiDB Cloud |
| **Maintainability** | Phase-based development, planning docs ครบ |

---

## 15. Next Planning Steps

| ลำดับ | เอกสาร | วัตถุประสงค์ |
|------|--------|------------|
| ➡️ **ถัดไป** | `02-requirements.md` | วิเคราะห์ Functional & Non-functional Requirements |
| | `03-roles-permissions.md` | ออกแบบ Role และ Permission Matrix |
| | `04-complaint-workflow.md` | State Machine ของ Listing, Order, Dispute |
| | `05-database-design.md` | ERD และ Table Definitions |
| | `06-api-contract.md` | API Endpoints ทั้งหมด |
| | `07-frontend-pages.md` | Pages, Routes, Components |
| | `08-dashboard-report-notification.md` | Dashboard & Notifications |
| | `09-project-docker-architecture.md` | Docker + Deploy Architecture |
| | `PROJECT_CONTEXT.md` | Quick Reference สำหรับ AI |
| | `10-implementation-plan.md` | Phase Breakdown |

---

*Planning Step 1 of 11 — ยังไม่ได้ออกแบบ Database และยังไม่มี Code ใดๆ*

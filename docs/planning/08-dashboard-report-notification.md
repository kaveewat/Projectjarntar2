# 08 — Dashboard, Report & Notification

**Project:** eFootball Smart Marketplace & AI Valuation System
**Document Type:** Dashboard & Analytics Design
**Status:** Draft
**Reference:** `04-workflow.md`, `05-database-design.md`, `06-api-contract.md`, `07-frontend-pages.md`
**Last Updated:** 2026-09-20

---

## 1. Dashboard Overview by Role

| Dashboard | Role | URL | Priority |
|-----------|------|-----|---------|
| Admin Dashboard | ADMIN, MODERATOR | `/admin` | P0 |
| Admin Analytics | ADMIN | `/admin/analytics` | P2 |
| Seller Dashboard | SELLER | `/seller/dashboard` | P0 |
| Buyer Dashboard | BUYER, SELLER | `/dashboard` | P0 |

---

## 2. Admin / Moderator Dashboard

### 2.1 Stat Cards (Top Row)

| Card | ค่าที่แสดง | สูตรคำนวณ | แหล่งข้อมูล | อัปเดต |
|------|---------|---------|----------|-------|
| **GMV วันนี้** | ฿XX,XXX | `SUM(orders.amount) WHERE status='COMPLETED' AND DATE(completed_at)=TODAY` | `orders` | Real-time |
| **GMV เดือนนี้** | ฿XXX,XXX | `SUM(orders.amount) WHERE status='COMPLETED' AND MONTH(completed_at)=THIS_MONTH` | `orders` | Real-time |
| **Escrow Holding** | ฿XX,XXX | `SUM(escrow_records.amount_held) WHERE status='HELD'` | `escrow_records` | Real-time |
| **Platform Revenue (MTD)** | ฿X,XXX | `SUM(orders.platform_fee) WHERE status='COMPLETED' AND MONTH=THIS_MONTH` | `orders` | Real-time |
| **Active Listings** | XXX รายการ | `COUNT(*) WHERE status='ACTIVE'` | `account_listings` | Real-time |
| **Pending Payments** 🔴 | XX รายการ | `COUNT(*) WHERE status='PAYMENT_SUBMITTED'` | `orders` | Real-time |
| **Open Disputes** 🟡 | X เคส | `COUNT(*) WHERE status IN ('OPEN','UNDER_REVIEW')` | `disputes` | Real-time |
| **Pending KYC** 🟢 | X คำขอ | `COUNT(*) WHERE status='PENDING'` | `user_kyc` | Real-time |

> **Rule:** Cards ที่มี 🔴🟡🟢 จะเป็นปุ่มกด navigate ไปยังหน้าจัดการทันที

---

### 2.2 Priority Queue Table (Pending Actions)

**วัตถุประสงค์:** แสดงงานที่รอดำเนินการ เรียงตามความเร่งด่วน (SLA เหลือน้อยขึ้นก่อน)

**Payments รอ Verify:**

| คอลัมน์ | แหล่งข้อมูล |
|--------|------------|
| Order Number | `orders.order_number` |
| Buyer | `users.display_name` |
| จำนวนเงิน | `orders.amount` |
| ช่องทาง | `payments.payment_method` |
| แนบสลิปเมื่อ | `payments.submitted_at` |
| รอมา (ชม.) | `NOW() - submitted_at` |
| Action | ปุ่ม "ตรวจสอบ" |

**Disputes รอตัดสิน:**

| คอลัมน์ | แหล่งข้อมูล |
|--------|------------|
| Dispute ID | `disputes.id` |
| สาเหตุ | `dispute_reasons.description_th` |
| Buyer / Seller | display names |
| เปิดเมื่อ | `disputes.opened_at` |
| SLA เหลือ | `sla_deadline - NOW()` |
| สถานะ | Badge |
| Assigned | moderator name |

> **ไฮไลต์:** SLA เหลือ < 12 ชม. → แถวสีแดง | < 24 ชม. → สีเหลือง

---

### 2.3 Charts (Admin Analytics Page)

#### Chart 1 — GMV & Platform Revenue Trend
- **ประเภท:** Line Chart (dual axis)
- **X-axis:** วัน / สัปดาห์ / เดือน (toggle)
- **Y-axis ซ้าย:** GMV (บาท)
- **Y-axis ขวา:** Platform Revenue (บาท)
- **สูตร:**
  ```
  GMV (period)       = SUM(orders.amount) WHERE status='COMPLETED' AND completed_at IN period
  Revenue (period)   = SUM(orders.platform_fee) WHERE status='COMPLETED' AND completed_at IN period
  ```
- **ตัวอย่างข้อมูล:**

| วัน | GMV | Revenue (5%) |
|-----|-----|-------------|
| 20 ก.ย. | ฿48,500 | ฿2,425 |
| 19 ก.ย. | ฿32,000 | ฿1,600 |
| 18 ก.ย. | ฿61,000 | ฿3,050 |

---

#### Chart 2 — Order Status Distribution
- **ประเภท:** Donut Chart
- **ข้อมูล:** COUNT(orders) GROUP BY status
- **สีสำหรับแต่ละสถานะ:**
  - COMPLETED → 🟢 Green
  - HANDOVER_OPEN / INFO_PROVIDED → 🔵 Blue
  - DISPUTED → 🔴 Red
  - CANCELLED / EXPIRED → ⚫ Gray
  - PAYMENT_SUBMITTED → 🟡 Yellow

---

#### Chart 3 — Escrow Status Breakdown
- **ประเภท:** Stacked Bar Chart (รายวัน)
- **X-axis:** วัน
- **Y-axis:** จำนวนเงิน (บาท)
- **Stack:**
  - HELD (สีฟ้า)
  - RELEASED (สีเขียว)
  - REFUNDED (สีส้ม)
  - FROZEN (สีแดง)
- **สูตร:**
  ```
  HELD     = SUM(escrow_records.amount_held) WHERE status='HELD'
  RELEASED = SUM(escrow_records.seller_payout) WHERE status='RELEASED'
  REFUNDED = SUM(escrow_records.amount_held) WHERE status='REFUNDED'
  ```

---

#### Chart 4 — Dispute Resolution Rate
- **ประเภท:** Pie Chart
- **ข้อมูล:**
  ```
  Seller ชนะ = COUNT(*) WHERE status='RESOLVED_SELLER'
  Buyer ชนะ  = COUNT(*) WHERE status='RESOLVED_BUYER'
  Pending    = COUNT(*) WHERE status IN ('OPEN','UNDER_REVIEW')
  ```
- **ตัวอย่าง:** Seller 45% | Buyer 40% | Pending 15%

---

#### Chart 5 — AI Scan Volume & Success Rate
- **ประเภท:** Bar + Line Chart (dual axis)
- **X-axis:** วัน
- **Bar:** จำนวน Scan ทั้งหมด
- **Line:** Success Rate (%)
- **สูตร:**
  ```
  Success Rate = COUNT(status='COMPLETED') / COUNT(*) * 100
  Avg Processing Time = AVG(processing_time_ms) / 1000  (seconds)
  ```

---

#### Chart 6 — Meta Card Demand (Top 10 Players)
- **ประเภท:** Horizontal Bar Chart
- **ข้อมูล:**
  ```
  SELECT pc.player_name, pc.card_tier,
         COUNT(lpc.id) as listing_count,
         AVG(al.asking_price) as avg_price
  FROM listing_player_cards lpc
  JOIN player_cards pc ON lpc.player_card_id = pc.id
  JOIN account_listings al ON lpc.listing_id = al.id
  WHERE al.status = 'ACTIVE'
  GROUP BY pc.id
  ORDER BY listing_count DESC
  LIMIT 10
  ```
- **แสดง:** ชื่อนักเตะ, Tier badge, จำนวน Listing, ราคาเฉลี่ย

---

#### Chart 7 — Value Badge Distribution
- **ประเภท:** Donut Chart
- **ข้อมูล:**
  ```
  🟢 GREAT_VALUE  = COUNT(*) WHERE value_badge='GREAT_VALUE' AND status='ACTIVE'
  🟡 FAIR         = COUNT(*) WHERE value_badge='FAIR' AND status='ACTIVE'
  🔴 OVERPRICED   = COUNT(*) WHERE value_badge='OVERPRICED' AND status='ACTIVE'
  ```
- **ตัวอย่าง:** คุ้มมาก 28% | พอดี 55% | แพงเกิน 17%

---

#### Chart 8 — Average Handover Time Trend
- **ประเภท:** Line Chart
- **X-axis:** วัน
- **Y-axis:** ชั่วโมง
- **สูตร:**
  ```
  Avg Handover Time = AVG(TIMESTAMPDIFF(HOUR, handover_rooms.opened_at, handover_rooms.seller_submitted_at))
  WHERE handover_rooms.status IN ('CONFIRMED', 'AUTO_RELEASED')
  GROUP BY DATE(opened_at)
  ```
- **ตัวอย่าง:** เฉลี่ย 4.2 ชม. (เป้าหมาย < 24 ชม.)

---

#### Chart 9 — Price Distribution Histogram
- **ประเภท:** Bar Chart (Price Ranges)
- **X-axis:** ช่วงราคา (0–500, 500–1000, 1000–2000, 2000–5000, 5000+)
- **Y-axis:** จำนวน Active Listings
- **ข้อมูล:**
  ```
  SELECT CASE
    WHEN asking_price < 500 THEN '< ฿500'
    WHEN asking_price < 1000 THEN '฿500–1,000'
    WHEN asking_price < 2000 THEN '฿1,000–2,000'
    WHEN asking_price < 5000 THEN '฿2,000–5,000'
    ELSE '฿5,000+'
  END as price_range, COUNT(*) as count
  FROM account_listings WHERE status='ACTIVE'
  GROUP BY price_range
  ```

---

## 3. Seller Dashboard

### 3.1 Seller Stat Cards

| Card | ค่าที่แสดง | สูตรคำนวณ |
|------|---------|---------|
| **Active Listings** | X รายการ | `COUNT(*) WHERE seller_id=ME AND status='ACTIVE'` |
| **Pending Handover** 🔴 | X รายการ | `COUNT(*) WHERE seller_id=ME AND status='HANDOVER_OPEN'` |
| **รอดำเนินการ** | X รายการ | `COUNT(*) WHERE seller_id=ME AND status='PAYMENT_SUBMITTED'` |
| **ยอดขายสะสม** | ฿XX,XXX | `SUM(seller_payout) WHERE seller_id=ME AND escrow.status='RELEASED'` |
| **รอรับเงิน** | ฿X,XXX | `SUM(seller_payout) WHERE seller_id=ME AND escrow.status='HELD' AND order.status='COMPLETED'` |
| **Open Disputes** | X เคส | `COUNT(*) WHERE seller_id=ME AND dispute.status IN ('OPEN','UNDER_REVIEW')` |
| **Avg Days to Sell** | X วัน | `AVG(DATEDIFF(sold_at, created_at)) WHERE seller_id=ME AND status='SOLD'` |
| **Verified Status** | ✅ / ⏳ / ❌ | `user_kyc.status` |

---

### 3.2 Seller Charts

**My Revenue Timeline:**
- Bar Chart: รายได้รายวัน (30 วันล่าสุด)
- `SUM(seller_payout) WHERE seller_id=ME GROUP BY DATE(released_at)`

**My Listing Badge Breakdown:**
- Donut: สัดส่วน Badge ของ Listing ที่ ACTIVE ของตัวเอง

---

### 3.3 Seller Tables

**Pending Handover (Priority):**

| Order | Buyer | ราคา | เปิดห้องเมื่อ | เหลือเวลา | Action |
|-------|-------|-----|------------|---------|-------|
| ORD-001 | buyer123 | ฿1,500 | 2 ชม.ที่แล้ว | 70 ชม. | เข้าห้อง |

**Transaction History:**

| Order | ราคาขาย | Fee | ยอดสุทธิ | สถานะ Payout | วันที่ |
|-------|--------|-----|---------|------------|------|
| ORD-001 | ฿1,500 | ฿75 | ฿1,425 | PAID | 19 ก.ย. |

---

## 4. Buyer Dashboard

### 4.1 Buyer Stat Cards

| Card | ค่าที่แสดง | สูตรคำนวณ |
|------|---------|---------|
| **Active Orders** | X รายการ | `COUNT(*) WHERE buyer_id=ME AND status NOT IN ('COMPLETED','CANCELLED','REFUNDED','EXPIRED')` |
| **Completed Purchases** | X ครั้ง | `COUNT(*) WHERE buyer_id=ME AND status='COMPLETED'` |
| **ประหยัดได้** | ฿X,XXX | `SUM(fair_price_min - asking_price) WHERE buyer_id=ME AND status='COMPLETED' AND value_badge='GREAT_VALUE'` |
| **Open Disputes** | X เคส | `COUNT(*) WHERE opened_by=ME AND status IN ('OPEN','UNDER_REVIEW')` |

---

## 5. Filters (ทุก Dashboard)

| Filter | Type | ค่าที่เลือก | หมายเหตุ |
|--------|------|----------|---------|
| **ช่วงเวลา** | Date Range Picker | Today / This Week / This Month / Custom | Default: This Month |
| **แพลตฟอร์ม** | Multi-select Checkbox | iOS, Android, PlayStation | |
| **สถานะ Order** | Multi-select | All, Pending, Completed, Disputed, Cancelled | |
| **สถานะ Escrow** | Select | HELD, RELEASED, REFUNDED, FROZEN | Admin only |
| **Value Badge** | Toggle Chips | 🟢 คุ้มมาก / 🟡 พอดี / 🔴 แพงเกิน | |
| **ช่วงราคา** | Range Slider | ฿0 – ฿50,000 | |
| **เกม** | Select | eFootball 2025 (+ future games) | |

---

## 6. Metric Formulas & Sample Data

### 6.1 ตัวชี้วัดหลัก (KPIs)

| Metric | สูตรคำนวณ | ตัวอย่าง |
|--------|---------|--------|
| **GMV (Gross Merchandise Value)** | `SUM(orders.amount) WHERE status='COMPLETED'` | ฿1,240,000/เดือน |
| **Platform Revenue** | `SUM(orders.platform_fee) WHERE status='COMPLETED'` | ฿62,000/เดือน (5% ของ GMV) |
| **Escrow Holding Balance** | `SUM(escrow.amount_held) WHERE status='HELD'` | ฿87,500 ณ ปัจจุบัน |
| **Order Completion Rate** | `COUNT(COMPLETED) / COUNT(total orders) * 100` | 78% |
| **Dispute Rate** | `COUNT(disputes) / COUNT(COMPLETED orders) * 100` | 8.5% |
| **AI Scan Success Rate** | `COUNT(COMPLETED scans) / COUNT(total scans) * 100` | 91.3% |
| **Avg Handover Time** | `AVG(seller_submitted_at - opened_at)` | 4.2 ชม. |
| **Avg Time to Sell** | `AVG(DATEDIFF(sold_at, created_at)) WHERE status='SOLD'` | 2.8 วัน |
| **Auto-Release Rate** | `COUNT(AUTO_RELEASED) / COUNT(orders past handover) * 100` | 12% |
| **Badge Distribution** | `COUNT(badge) / COUNT(ACTIVE) * 100 GROUP BY badge` | 🟢28% 🟡55% 🔴17% |

### 6.2 Valuation Accuracy Metric

```
Valuation Accuracy =
  1 - ABS(sold_price - (fair_price_min + fair_price_max) / 2) / sold_price * 100

Example:
  fair_price_min = 800, fair_price_max = 1,200 → midpoint = 1,000
  sold_price = 950
  Accuracy = 1 - |950 - 1000| / 950 = 1 - 0.053 = 94.7%
```

### 6.3 Value Badge Calculation

```
fair_midpoint = (fair_price_min + fair_price_max) / 2

IF asking_price <= fair_midpoint * 0.85  → GREAT_VALUE (🟢)
IF asking_price <= fair_midpoint * 1.15  → FAIR (🟡)
ELSE                                      → OVERPRICED (🔴)

Example:
  fair_price_min = 800, fair_price_max = 1,200
  fair_midpoint = 1,000
  GREAT_VALUE threshold = 850
  OVERPRICED threshold  = 1,150

  asking_price = 750  → 🟢 GREAT_VALUE
  asking_price = 999  → 🟡 FAIR
  asking_price = 1,300→ 🔴 OVERPRICED
```

### 6.4 Seller Payout Calculation

```
seller_payout = asking_price * (1 - fee_rate)

Example:
  asking_price = 1,500
  fee_rate     = 0.05 (5%)
  platform_fee = 75
  seller_payout = 1,425

Snapshot ณ เวลาสั่งซื้อ → บันทึกใน orders.fee_rate (ไม่เปลี่ยนถ้า settings เปลี่ยน)
```

---

## 7. Report Export

### 7.1 รายงานที่รองรับ

| รายงาน | Format | สำหรับ | Trigger |
|--------|--------|-------|--------|
| **Transaction Summary** | CSV, PDF | Admin | ปุ่ม Export |
| **Escrow Status Report** | CSV | Admin | ปุ่ม Export |
| **Fee & Revenue Report** | CSV, PDF | Admin | ปุ่ม Export |
| **Dispute History** | CSV | Admin (Audit) | ปุ่ม Export |
| **AI Performance Report** | CSV | Admin | ปุ่ม Export |
| **Seller Payout Report** | CSV | Admin, Seller | ปุ่ม Export |
| **My Transaction History** | CSV | Seller | ปุ่ม Export (Seller Dashboard) |

---

### 7.2 Transaction Summary Report (Admin)

**Fields:**
```
order_number, created_at, completed_at, buyer_display_name, seller_display_name,
listing_title, platform, asking_price, platform_fee, seller_payout,
order_status, escrow_status, value_badge, team_strength
```

**Filter:** ช่วงวันที่, Platform, Status

---

### 7.3 Dispute History Report (Audit)

**Fields:**
```
dispute_id, order_number, opened_at, resolved_at, dispute_reason,
buyer_display_name, seller_display_name, resolution, resolved_by,
amount_held, outcome (RELEASED/REFUNDED)
```

---

### 7.4 AI Performance Report

**Fields:**
```
scan_id, created_at, user_display_name, status, ai_model,
processing_time_ms, player_count_detected, team_strength,
fair_price_min, fair_price_max, error_message
```

---

## 8. Notification Rules

### 8.1 Notification Trigger Table (ครบทุก Event)

| # | Event Trigger | ผู้รับ | Type Code | ข้อความ | Channel | Priority |
|---|-------------|-------|---------|--------|--------|---------|
| N01 | Listing → ACTIVE | Seller | `LISTING_ACTIVE` | "ประกาศ [Title] เผยแพร่แล้ว" | In-app | Normal |
| N02 | Buyer สร้าง Order | Seller | `ORDER_CREATED` | "มีคนสั่งซื้อ [Listing] รอยืนยันชำระเงิน" | In-app | 🔴 High |
| N03 | Buyer แนบสลิป | Moderator | `PAYMENT_SUBMITTED` | "Order [#] รอตรวจสอบสลิป" | In-app | 🔴 High |
| N04 | Moderator Approve | Buyer | `PAYMENT_APPROVED` | "ชำระเงินสำเร็จ — ห้องส่งมอบถูกเปิดแล้ว" | In-app | 🔴 High |
| N05 | Moderator Approve | Seller | `PAYMENT_APPROVED` | "ยืนยันชำระเงินแล้ว — กรุณาส่งข้อมูลบัญชี" | In-app | 🔴 High |
| N06 | Seller ส่งข้อมูล | Buyer | `SELLER_INFO_SUBMITTED` | "ผู้ขายส่งข้อมูลบัญชีแล้ว — กรุณาตรวจสอบ" | In-app | 🔴 High |
| N07 | ครบ 24 ชม. (Seller timeout) | Seller | `SELLER_TIMEOUT_WARNING_1` | "⚠️ เหลือ 48 ชม. ส่งข้อมูลบัญชี" | In-app | 🔴 High |
| N08 | ครบ 48 ชม. (Seller timeout) | Seller | `SELLER_TIMEOUT_WARNING_2` | "🚨 เหลือ 24 ชม. ก่อน Auto-cancel" | In-app | 🔴 High |
| N09 | ครบ 48 ชม. (Seller timeout) | Admin | `SELLER_TIMEOUT_WARNING_2` | "Seller ใกล้ timeout: Order [#]" | In-app | High |
| N10 | ครบ 24 ชม. หลัง INFO_PROVIDED | Buyer | `BUYER_REVIEW_REMINDER_1` | "⚠️ กรุณายืนยันรับบัญชีภายใน 24 ชม." | In-app | 🔴 High |
| N11 | ครบ 36 ชม. หลัง INFO_PROVIDED | Buyer | `BUYER_REVIEW_REMINDER_2` | "🚨 เหลือ 12 ชม. ก่อน Auto-release" | In-app | 🔴 High |
| N12 | ครบ 47 ชม. หลัง INFO_PROVIDED | Buyer | `BUYER_REVIEW_REMINDER_3` | "🚨 เหลือ 1 ชม. ก่อน Auto-release" | In-app | 🔴 High |
| N13 | Auto-Release triggered | Seller | `AUTO_RELEASE_TRIGGERED` | "เงินถูกปล่อยอัตโนมัติ — Order [#]" | In-app | Normal |
| N14 | Auto-Release triggered | Buyer | `AUTO_RELEASE_TRIGGERED` | "Buyer ไม่ยืนยัน — เงินถูกปล่อยให้ Seller แล้ว" | In-app | Normal |
| N15 | Buyer เปิด Dispute | Moderator + Admin | `DISPUTE_OPENED` | "🚨 Dispute ใหม่: Order [#] — [Reason]" | In-app | 🔴 High |
| N16 | Buyer เปิด Dispute | Seller | `DISPUTE_OPENED` | "ผู้ซื้อเปิดเคสร้องเรียน — Order [#]" | In-app | 🔴 High |
| N17 | Dispute ตัดสินแล้ว | Buyer | `DISPUTE_RESOLVED` | "ผลการตัดสิน: [Outcome]" | In-app | High |
| N18 | Dispute ตัดสินแล้ว | Seller | `DISPUTE_RESOLVED` | "ผลการตัดสิน: [Outcome]" | In-app | High |
| N19 | Escrow Released | Seller | `ESCROW_RELEASED` | "✅ เงิน ฿[Amount] ถูกปล่อยแล้ว" | In-app | High |
| N20 | Escrow Refunded | Buyer | `ESCROW_REFUNDED` | "↩️ เงิน ฿[Amount] ถูกคืนแล้ว" | In-app | High |
| N21 | KYC Approved | Seller | `KYC_APPROVED` | "✅ ยืนยันตัวตนสำเร็จ — ได้รับ Verified Badge" | In-app | Normal |
| N22 | KYC Rejected | Seller | `KYC_REJECTED` | "❌ KYC ถูกปฏิเสธ: [Reason]" | In-app | Normal |
| N23 | Moderator Reject Payment | Buyer | `PAYMENT_REJECTED` | "หลักฐานชำระเงินไม่ผ่าน: [Reason]" | In-app | High |
| N24 | Order Expired (payment timeout) | Buyer + Seller | `ORDER_EXPIRED` | "Order [#] หมดอายุ (ไม่ชำระใน 2 ชม.)" | In-app | Normal |
| N25 | Dispute SLA Warning | Admin | `DISPUTE_SLA_WARNING` | "⚠️ Dispute [#] SLA เหลือ 12 ชม." | In-app | 🔴 High |

---

### 8.2 Notification Delivery Rules

| Rule | รายละเอียด |
|------|-----------|
| **In-app polling** | Frontend poll `GET /notifications/unread-count` ทุก 30 วินาที |
| **Batching** | รวม notification ประเภทเดียวกันใน 1 นาที → แสดงเป็น 1 รายการ |
| **Do Not Disturb** | (Future) ผู้ใช้ตั้งค่าช่วงเวลาไม่รับแจ้งเตือน |
| **Priority High** | แสดง toast popup อัตโนมัติ ค้างไว้ 10 วินาที |
| **Read Auto** | Notification อายุ > 30 วัน → auto mark as read |

---

## 9. SLA & Escrow Timeout Rules

### 9.1 SLA Table (ครบทุกขั้นตอน)

| # | ขั้นตอน | SLA | เมื่อครบ SLA | Actor |
|---|--------|-----|------------|-------|
| T1 | Buyer ชำระเงินหลัง Order | **2 ชั่วโมง** | Order → EXPIRED, Listing → ACTIVE | SYSTEM |
| T2 | Moderator ตรวจสลิป | **4 ชั่วโมง** (business) | Escalate แจ้ง Admin | SYSTEM |
| T3 | Seller ส่งข้อมูลใน Handover | **72 ชั่วโมง** | Auto-cancel + Refund Buyer | SYSTEM |
| T4 | Buyer ยืนยันรับหลัง Seller ส่ง | **48 ชั่วโมง** | Auto-Release → COMPLETED | SYSTEM |
| T5 | Admin ตัดสิน Dispute | **48 ชั่วโมง** | Escalate → SUPER_ADMIN แจ้งเตือน | SYSTEM |

---

### 9.2 Seller Handover Timeout Timeline

```
ชั่วโมงที่ 0   → ห้อง Handover เปิด → แจ้ง Seller
ชั่วโมงที่ 24  → แจ้งเตือน Seller ครั้งที่ 1 (N07)
ชั่วโมงที่ 48  → แจ้งเตือน Seller ครั้งที่ 2 + แจ้ง Admin (N08, N09)
ชั่วโมงที่ 72  → EXPIRED → Auto-cancel → Refund Buyer → Listing → ACTIVE
                 → Seller ถูกบันทึกว่า "ไม่ส่งมอบ 1 ครั้ง"
```

---

### 9.3 Buyer Confirmation Auto-Release Timeline

```
ชั่วโมงที่ 0   → Seller ส่งข้อมูลใน Handover
ชั่วโมงที่ 24  → แจ้งเตือน Buyer ครั้งที่ 1 (N10)
ชั่วโมงที่ 36  → แจ้งเตือน Buyer ครั้งที่ 2 (N11)
ชั่วโมงที่ 47  → แจ้งเตือน Buyer ครั้งที่ 3 (N12)
ชั่วโมงที่ 48  → AUTO_RELEASE → Order COMPLETED → Escrow RELEASED → Seller ได้รับเงิน
                 → บันทึก log: "Auto-released after 48h buyer timeout"
```

---

### 9.4 Dispute SLA Timeline

```
ชั่วโมงที่ 0   → Dispute เปิด → แจ้ง Moderator/Admin
ชั่วโมงที่ 36  → แจ้งเตือน Admin (SLA เหลือ 12 ชม.) (N25)
ชั่วโมงที่ 48  → Escalate → SUPER_ADMIN แจ้งเตือน + แสดงใน Priority Queue สีแดง
```

---

### 9.5 Auto-Timeout Job Requirements

| Job | ความถี่ | งาน |
|-----|--------|-----|
| Order Payment Timeout | ทุก 5 นาที | ตรวจ CREATED orders ที่เกิน 2 ชม. → EXPIRED |
| Handover Seller Warning | ทุก 1 ชม. | ตรวจ HANDOVER_OPEN ที่ครบ 24h, 48h → ส่ง Notification |
| Handover Seller Timeout | ทุก 15 นาที | ตรวจ HANDOVER_OPEN ที่ครบ 72h → Auto-cancel + Refund |
| Buyer Review Warning | ทุก 1 ชม. | ตรวจ INFO_PROVIDED ที่ครบ 24h, 36h, 47h → ส่ง Notification |
| Buyer Auto-Release | ทุก 15 นาที | ตรวจ INFO_PROVIDED ที่ครบ 48h → COMPLETED + Release Escrow |
| Dispute SLA Warning | ทุก 1 ชม. | ตรวจ OPEN disputes ที่ครบ 36h → แจ้ง Admin |

> [!NOTE]
> Auto-timeout jobs จะ implement ด้วย Node.js `node-cron` หรือ background worker
> ทุก job ต้องบันทึก log ใน `order_status_logs` และ `escrow_status_logs` ทุกครั้ง

---

## 10. Dashboard Data Source Summary

| Metric | Query จาก Table | API Endpoint |
|--------|---------------|-------------|
| GMV | `orders` | `GET /admin/analytics/sales` |
| Escrow Holding | `escrow_records` | `GET /admin/escrow` |
| Platform Revenue | `orders.platform_fee` | `GET /admin/analytics/sales` |
| Pending Payments | `orders` | `GET /admin/dashboard/pending-actions` |
| Open Disputes | `disputes` | `GET /admin/dashboard` |
| Pending KYC | `user_kyc` | `GET /admin/dashboard` |
| Scan Success Rate | `squad_scans` | `GET /admin/analytics/ai-accuracy` |
| Meta Card Demand | `listing_player_cards` + `player_cards` | `GET /admin/analytics/prices` |
| Avg Handover Time | `handover_rooms` | `GET /admin/analytics/sales` |
| Badge Distribution | `account_listings` | `GET /admin/analytics/listings` |
| Seller Revenue | `escrow_records` | `GET /payouts/me` |
| Price History | `price_history` | `GET /market/price-history` |

---

*Planning Step 8 of 11 — ยังไม่มี Code ใดๆ*

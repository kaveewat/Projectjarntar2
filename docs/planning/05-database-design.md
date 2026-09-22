# 05 — Database Design

**Project:** eFootball Smart Marketplace & AI Valuation System
**Document Type:** Database Architecture Design
**Status:** Draft
**Reference:** `01-system-overview.md`, `02-requirements.md`, `03-roles-permissions.md`, `04-workflow.md`
**Last Updated:** 2026-09-20

---

## 1. Design Principles

| หลักการ | รายละเอียด |
|--------|-----------|
| **Engine** | InnoDB (ทุกตาราง) — รองรับ Foreign Key + Transaction |
| **Charset** | `utf8mb4` + Collation `utf8mb4_unicode_ci` ทุกตาราง |
| **Naming** | snake_case ทั้ง table name และ column name |
| **Primary Key** | `UNSIGNED INT AUTO_INCREMENT` ทุกตาราง |
| **Timestamps** | ทุกตาราง Transaction มี `created_at`, `updated_at` |
| **Soft Delete** | ตาราง Listing/User ใช้ `deleted_at` แทน DELETE จริง |
| **Expandability** | `game_id` FK เพื่อรองรับหลายเกมในอนาคต |
| **Security** | ข้อมูลลับต้องเข้ารหัสก่อนเก็บ (ระบุในแต่ละตาราง) |

---

## 2. ภาพรวมตารางทั้งหมด (28 ตาราง)

### กลุ่ม A: User & Identity (2 ตาราง)
| ตาราง | วัตถุประสงค์ |
|-------|------------|
| `users` | บัญชีผู้ใช้งานทั้งหมด (Buyer, Seller, Moderator, Admin) |
| `user_kyc` | ข้อมูลยืนยันตัวตน (KYC) ของผู้ขาย |

### กลุ่ม B: Master / Reference Data (6 ตาราง)
| ตาราง | วัตถุประสงค์ |
|-------|------------|
| `games` | รายชื่อเกม (เริ่มด้วย eFootball — รองรับการขยาย) |
| `platforms` | แพลตฟอร์ม (iOS, Android, PlayStation) |
| `card_tiers` | ระดับการ์ดนักเตะ (Normal, Epic, Show Time, Big Time) |
| `positions` | ตำแหน่งนักเตะ (GK, CB, ST ฯลฯ) |
| `player_cards` | ฐานข้อมูลการ์ดนักเตะ (Reference สำหรับ AI Valuation) |
| `dispute_reasons` | สาเหตุ Dispute ที่กำหนดไว้ล่วงหน้า |

### กลุ่ม C: Listing & AI Scan (5 ตาราง)
| ตาราง | วัตถุประสงค์ |
|-------|------------|
| `account_listings` | ประกาศขายบัญชีเกม |
| `listing_player_cards` | (Junction) นักเตะ Rare ที่มีใน Listing |
| `squad_scans` | บันทึกการ Scan รูปภาพ Squad ด้วย AI |
| `scan_player_results` | รายชื่อนักเตะที่ AI สกัดได้จาก Scan |
| `valuations` | ผล Valuation (Fair Price Range) ของแต่ละ Scan |

### กลุ่ม D: Order & Commerce (4 ตาราง)
| ตาราง | วัตถุประสงค์ |
|-------|------------|
| `orders` | คำสั่งซื้อ |
| `payments` | หลักฐานและสถานะการชำระเงิน |
| `escrow_records` | บันทึก Escrow (ถือเงิน/ปล่อย/คืน) |
| `seller_payouts` | ประวัติการโอนเงินสดให้ผู้ขายและหลักฐานการโอน |

### กลุ่ม E: Handover & Security (3 ตาราง)
| ตาราง | วัตถุประสงค์ |
|-------|------------|
| `handover_rooms` | ห้องส่งมอบบัญชี (1 ห้อง ต่อ 1 Order) |
| `handover_messages` | ข้อมูลบัญชีที่เข้ารหัส (ลบหลัง Complete) |
| `handover_access_logs` | บันทึก Audit ว่าใครเข้าห้องเมื่อไหร่ (ไม่เก็บเนื้อหา) |

### กลุ่ม F: Dispute (3 ตาราง)
| ตาราง | วัตถุประสงค์ |
|-------|------------|
| `disputes` | เคสข้อพิพาท |
| `dispute_evidence` | ไฟล์หลักฐานของ Dispute |
| `dispute_comments` | ความเห็นจาก Admin/Moderator ในเคส |

### กลุ่ม G: Logs & History (4 ตาราง)
| ตาราง | วัตถุประสงค์ |
|-------|------------|
| `order_status_logs` | ประวัติการเปลี่ยนสถานะ Order ทุกครั้ง |
| `listing_status_logs` | ประวัติการเปลี่ยนสถานะ Listing ทุกครั้ง |
| `escrow_status_logs` | ประวัติการเปลี่ยนสถานะ Escrow ทุกครั้ง |
| `audit_logs` | บันทึก Admin/Moderator actions ทั้งหมด |

### กลุ่ม H: Notification & Analytics (3 ตาราง)
| ตาราง | วัตถุประสงค์ |
|-------|------------|
| `notifications` | Notification ใน app สำหรับผู้ใช้ |
| `price_history` | ประวัติราคาขายจริง (ใช้ปรับ Valuation model) |
| `platform_settings` | ตั้งค่า Platform (ค่าธรรมเนียม, Timeout, Badge criteria) |

---

## 3. รายละเอียดแต่ละตาราง

---

### กลุ่ม A: User & Identity

#### `users`
**วัตถุประสงค์:** เก็บบัญชีผู้ใช้ทั้งหมด

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK, AUTO_INCREMENT | |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | สำหรับ Login |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt hash (ห้ามเก็บ plain text) |
| `display_name` | VARCHAR(100) | NOT NULL | ชื่อที่แสดงบน Platform |
| `phone` | VARCHAR(20) | NULL | เบอร์โทรศัพท์ (optional) |
| `line_id` | VARCHAR(100) | NULL | สำหรับ contact (optional) |
| `role` | ENUM | NOT NULL | `ADMIN`, `MODERATOR`, `SELLER`, `BUYER` |
| `is_verified` | TINYINT(1) | DEFAULT 0 | ผ่าน KYC แล้วหรือไม่ |
| `is_suspended` | TINYINT(1) | DEFAULT 0 | ถูก suspend หรือไม่ |
| `is_banned` | TINYINT(1) | DEFAULT 0 | ถูก ban ถาวรหรือไม่ |
| `email_verified_at` | DATETIME | NULL | เวลา verify email |
| `last_login_at` | DATETIME | NULL | Login ล่าสุด |
| `created_at` | DATETIME | DEFAULT NOW | |
| `updated_at` | DATETIME | ON UPDATE | |
| `deleted_at` | DATETIME | NULL | Soft delete |

**Indexes:** `email` (UNIQUE), `role`, `is_suspended`

---

#### `user_kyc`
**วัตถุประสงค์:** เก็บข้อมูล KYC — ข้อมูลนี้ sensitive มาก ต้องเข้ารหัส

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `user_id` | INT UNSIGNED | FK → users.id, UNIQUE | 1 User → 1 KYC |
| `real_name` | VARCHAR(255) | NOT NULL | ชื่อจริง (Encrypted at rest) |
| `id_card_number` | VARCHAR(50) | NOT NULL | เลขบัตรประชาชน (Encrypted) |
| `id_card_image_url` | VARCHAR(500) | NOT NULL | URL รูปบัตร (Private storage) |
| `selfie_image_url` | VARCHAR(500) | NULL | URL Selfie กับบัตร |
| `status` | ENUM | NOT NULL | `PENDING`, `APPROVED`, `REJECTED` |
| `reviewed_by` | INT UNSIGNED | FK → users.id, NULL | Admin ที่ review |
| `reviewed_at` | DATETIME | NULL | |
| `reject_reason` | TEXT | NULL | เหตุผลที่ Reject |
| `submitted_at` | DATETIME | NOT NULL | |
| `created_at` | DATETIME | DEFAULT NOW | |

> [!CAUTION]
> `real_name` และ `id_card_number` ต้องเข้ารหัสด้วย AES-256 ก่อนบันทึก
> `id_card_image_url` ต้องชี้ไปยัง Private bucket (ไม่ใช่ Public URL)

---

### กลุ่ม B: Master / Reference Data

#### `games`
**วัตถุประสงค์:** รองรับหลายเกมในอนาคต (MVP มีแค่ eFootball)

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `name` | VARCHAR(100) | NOT NULL | เช่น `eFootball 2025` |
| `slug` | VARCHAR(50) | UNIQUE | เช่น `efootball` |
| `is_active` | TINYINT(1) | DEFAULT 1 | เปิด/ปิดเกม |
| `created_at` | DATETIME | DEFAULT NOW | |

---

#### `platforms`
**วัตถุประสงค์:** แพลตฟอร์มที่รองรับ

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `name` | VARCHAR(50) | NOT NULL | `iOS`, `Android`, `PlayStation` |
| `slug` | VARCHAR(30) | UNIQUE | `ios`, `android`, `ps` |
| `is_active` | TINYINT(1) | DEFAULT 1 | |

---

#### `card_tiers`
**วัตถุประสงค์:** ระดับความหายากของการ์ดนักเตะ

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `name` | VARCHAR(50) | NOT NULL | `Normal`, `Epic`, `Show Time`, `Big Time` |
| `slug` | VARCHAR(30) | UNIQUE | `normal`, `epic`, `show_time`, `big_time` |
| `weight` | INT UNSIGNED | NOT NULL | น้ำหนักในการคำนวณ Valuation (Normal=1, Epic=5, ...) |
| `display_color` | VARCHAR(10) | NULL | Hex color สำหรับ UI badge |

---

#### `positions`
**วัตถุประสงค์:** ตำแหน่งนักเตะ

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `code` | VARCHAR(5) | UNIQUE | `GK`, `CB`, `ST` ฯลฯ |
| `name` | VARCHAR(30) | NOT NULL | `Goalkeeper`, `Centre Back` |
| `group` | ENUM | NOT NULL | `GK`, `DEF`, `MID`, `FWD` |

---

#### `player_cards`
**วัตถุประสงค์:** ฐานข้อมูลการ์ดนักเตะ (Reference สำหรับ AI Valuation)

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `game_id` | INT UNSIGNED | FK → games.id | รองรับหลายเกม |
| `player_name` | VARCHAR(100) | NOT NULL | ชื่อนักเตะ (ตามในเกม) |
| `card_tier_id` | INT UNSIGNED | FK → card_tiers.id | ระดับการ์ด |
| `position_id` | INT UNSIGNED | FK → positions.id | ตำแหน่งหลัก |
| `nationality` | VARCHAR(60) | NULL | สัญชาติ |
| `club` | VARCHAR(100) | NULL | ทีมในเกม |
| `overall_rating` | TINYINT UNSIGNED | NOT NULL | ค่า Overall (1–99) |
| `base_value` | DECIMAL(15,2) | DEFAULT 0 | ราคาอ้างอิงเริ่มต้น (GP) |
| `is_active` | TINYINT(1) | DEFAULT 1 | การ์ดยังใช้งานได้ |
| `season` | VARCHAR(20) | NULL | Season ของการ์ด |
| `created_at` | DATETIME | DEFAULT NOW | |
| `updated_at` | DATETIME | ON UPDATE | |

**Indexes:** `player_name`, `card_tier_id`, `game_id`, `overall_rating`

---

#### `dispute_reasons`
**วัตถุประสงค์:** สาเหตุ Dispute ที่กำหนดไว้ล่วงหน้า

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `code` | VARCHAR(50) | UNIQUE | `WRONG_ACCOUNT`, `LOGIN_FAILED`, `ACCOUNT_RECOVERED`, `OTHER` |
| `description_th` | VARCHAR(255) | NOT NULL | คำอธิบายภาษาไทย |
| `is_active` | TINYINT(1) | DEFAULT 1 | |

---

### กลุ่ม C: Listing & AI Scan

#### `account_listings`
**วัตถุประสงค์:** ประกาศขายบัญชีเกม

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `seller_id` | INT UNSIGNED | FK → users.id | ผู้ขาย |
| `game_id` | INT UNSIGNED | FK → games.id | เกม |
| `platform_id` | INT UNSIGNED | FK → platforms.id | แพลตฟอร์ม |
| `squad_scan_id` | INT UNSIGNED | FK → squad_scans.id, NULL | Scan ที่ใช้สร้าง Listing |
| `valuation_id` | INT UNSIGNED | FK → valuations.id, NULL | Valuation ที่ใช้ |
| `title` | VARCHAR(200) | NOT NULL | ชื่อประกาศ |
| `description` | TEXT | NULL | รายละเอียดเพิ่มเติม |
| `asking_price` | DECIMAL(12,2) | NOT NULL | ราคาขายที่ผู้ขายตั้ง (บาท) |
| `fair_price_min` | DECIMAL(12,2) | NULL | จาก Valuation |
| `fair_price_max` | DECIMAL(12,2) | NULL | จาก Valuation |
| `value_badge` | ENUM | NULL | `GREAT_VALUE`, `FAIR`, `OVERPRICED` |
| `team_strength` | SMALLINT UNSIGNED | NULL | ค่า Team Strength จาก Scan |
| `status` | ENUM | NOT NULL | `DRAFT`, `SCANNING`, `SCAN_FAILED`, `PENDING_REVIEW`, `ACTIVE`, `RESERVED`, `SOLD`, `CANCELLED`, `SUSPENDED` |
| `suspended_reason` | TEXT | NULL | เหตุผล Admin ระงับ |
| `view_count` | INT UNSIGNED | DEFAULT 0 | จำนวนครั้งที่ถูกดู |
| `sold_at` | DATETIME | NULL | เวลาที่ขายสำเร็จ |
| `created_at` | DATETIME | DEFAULT NOW | |
| `updated_at` | DATETIME | ON UPDATE | |
| `deleted_at` | DATETIME | NULL | Soft delete |

**Indexes:** `seller_id`, `status`, `platform_id`, `game_id`, `asking_price`, `team_strength`

---

#### `listing_player_cards`
**วัตถุประสงค์:** (Junction Table) นักเตะ Rare ที่ผู้ขายระบุว่ามีใน Listing นี้

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `listing_id` | INT UNSIGNED | FK → account_listings.id | |
| `player_card_id` | INT UNSIGNED | FK → player_cards.id | |
| `is_ai_detected` | TINYINT(1) | DEFAULT 1 | AI ตรวจพบเอง (0 = ผู้ขายเพิ่มเอง) |

**Indexes:** (`listing_id`, `player_card_id`) UNIQUE, `player_card_id` (สำหรับค้นหาประกาศที่มีนักเตะที่ระบุ)

---

#### `squad_scans`
**วัตถุประสงค์:** บันทึกทุกครั้งที่ Seller อัปโหลดรูปเพื่อ Scan

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `user_id` | INT UNSIGNED | FK → users.id | ผู้อัปโหลด |
| `game_id` | INT UNSIGNED | FK → games.id | |
| `image_urls` | JSON | NOT NULL | Array ของ URL รูปที่อัปโหลด |
| `status` | ENUM | NOT NULL | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` |
| `ai_model` | VARCHAR(100) | NULL | ชื่อ Vision Model ที่ใช้ (เช่น `gemini-2.0-flash`) |
| `ai_raw_response` | JSON | NULL | Raw response จาก Vision API |
| `error_message` | TEXT | NULL | ข้อผิดพลาด (ถ้า FAILED) |
| `processing_time_ms` | INT UNSIGNED | NULL | เวลาที่ใช้ประมวลผล (ms) |
| `created_at` | DATETIME | DEFAULT NOW | |
| `completed_at` | DATETIME | NULL | |

---

#### `scan_player_results`
**วัตถุประสงค์:** รายชื่อนักเตะแต่ละคนที่ AI สกัดจาก Scan

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `scan_id` | INT UNSIGNED | FK → squad_scans.id | |
| `player_card_id` | INT UNSIGNED | FK → player_cards.id, NULL | Match กับ player_cards (NULL ถ้าไม่ match) |
| `detected_name` | VARCHAR(100) | NOT NULL | ชื่อที่ AI ตรวจพบ (raw) |
| `detected_tier` | VARCHAR(50) | NULL | ระดับที่ AI ตรวจพบ |
| `detected_position` | VARCHAR(10) | NULL | ตำแหน่งที่ AI ตรวจพบ |
| `confidence_score` | DECIMAL(5,4) | NULL | ความมั่นใจของ AI (0.0–1.0) |
| `is_confirmed` | TINYINT(1) | DEFAULT 1 | ผู้ขาย confirm ว่าถูกต้อง |
| `is_corrected` | TINYINT(1) | DEFAULT 0 | ผู้ขายแก้ไขจาก AI |

---

#### `valuations`
**วัตถุประสงค์:** ผลการประเมินราคาตลาดแนะนำ

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `scan_id` | INT UNSIGNED | FK → squad_scans.id, UNIQUE | |
| `fair_price_min` | DECIMAL(12,2) | NOT NULL | ราคาต่ำสุดที่แนะนำ (บาท) |
| `fair_price_max` | DECIMAL(12,2) | NOT NULL | ราคาสูงสุดที่แนะนำ (บาท) |
| `algorithm_version` | VARCHAR(20) | NOT NULL | เวอร์ชันของ Valuation Algorithm |
| `factors_used` | JSON | NULL | ปัจจัยที่ใช้คำนวณ (debug) |
| `created_at` | DATETIME | DEFAULT NOW | |

---

### กลุ่ม D: Order & Commerce

#### `orders`
**วัตถุประสงค์:** คำสั่งซื้อ — หัวใจของ Transaction

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `order_number` | VARCHAR(30) | UNIQUE, NOT NULL | Human-readable: `ORD-20250920-001` |
| `listing_id` | INT UNSIGNED | FK → account_listings.id | Listing ที่ซื้อ |
| `buyer_id` | INT UNSIGNED | FK → users.id | ผู้ซื้อ |
| `seller_id` | INT UNSIGNED | FK → users.id | ผู้ขาย |
| `amount` | DECIMAL(12,2) | NOT NULL | ราคาขาย ณ เวลาที่สั่งซื้อ |
| `platform_fee` | DECIMAL(12,2) | NOT NULL | ค่าธรรมเนียม Platform |
| `seller_payout` | DECIMAL(12,2) | NOT NULL | เงินที่ Seller จะได้ (amount - fee) |
| `fee_rate` | DECIMAL(5,4) | NOT NULL | % Fee ณ เวลาสั่งซื้อ (snapshot) |
| `status` | ENUM | NOT NULL | `CREATED`, `PENDING_PAYMENT`, `PAYMENT_SUBMITTED`, `PAYMENT_APPROVED`, `HANDOVER_OPEN`, `HANDOVER_INFO_PROVIDED`, `BUYER_REVIEWING`, `AUTO_RELEASE_PENDING`, `COMPLETED`, `DISPUTED`, `DISPUTE_RESOLVED_SELLER`, `DISPUTE_RESOLVED_BUYER`, `REFUNDED`, `CANCELLED`, `EXPIRED` |
| `payment_deadline` | DATETIME | NULL | Deadline ชำระ (CREATED + 2h) |
| `handover_deadline` | DATETIME | NULL | Deadline Seller ส่งข้อมูล (72h) |
| `auto_release_at` | DATETIME | NULL | เวลา Auto-Release |
| `completed_at` | DATETIME | NULL | |
| `cancelled_at` | DATETIME | NULL | |
| `cancel_reason` | TEXT | NULL | |
| `cancelled_by` | INT UNSIGNED | FK → users.id, NULL | |
| `created_at` | DATETIME | DEFAULT NOW | |
| `updated_at` | DATETIME | ON UPDATE | |

**Indexes:** `listing_id`, `buyer_id`, `seller_id`, `status`, `order_number`

---

#### `payments`
**วัตถุประสงค์:** หลักฐานและสถานะการชำระเงิน

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `order_id` | INT UNSIGNED | FK → orders.id | |
| `amount` | DECIMAL(12,2) | NOT NULL | จำนวนที่ชำระ |
| `payment_method` | ENUM | NOT NULL | `PROMPTPAY`, `BANK_TRANSFER`, `OTHER` |
| `payment_proof_url` | VARCHAR(500) | NOT NULL | URL รูปสลิป (Private storage) |
| `bank_reference` | VARCHAR(100) | NULL | เลขอ้างอิงจากธนาคาร |
| `status` | ENUM | NOT NULL | `SUBMITTED`, `APPROVED`, `REJECTED` |
| `submitted_at` | DATETIME | NOT NULL | |
| `reviewed_by` | INT UNSIGNED | FK → users.id, NULL | Moderator |
| `reviewed_at` | DATETIME | NULL | |
| `reject_reason` | TEXT | NULL | |

---

#### `escrow_records`
**วัตถุประสงค์:** บันทึก Escrow lifecycle — ต้อง Audit ได้ทุก action

| Column | Type | Constraint | คำอธิดาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `order_id` | INT UNSIGNED | FK → orders.id, UNIQUE | |
| `amount_held` | DECIMAL(12,2) | NOT NULL | เงินที่ถือไว้ |
| `platform_fee` | DECIMAL(12,2) | NOT NULL | Fee ที่จะหัก |
| `seller_payout` | DECIMAL(12,2) | NOT NULL | เงินที่ Seller จะได้ |
| `status` | ENUM | NOT NULL | `HELD`, `FROZEN`, `RELEASED`, `REFUNDED` |
| `held_at` | DATETIME | NOT NULL | เวลาที่เริ่มถือเงิน |
| `released_at` | DATETIME | NULL | เวลาปล่อยเงิน |
| `refunded_at` | DATETIME | NULL | เวลาคืนเงิน |
| `action_by` | INT UNSIGNED | FK → users.id | Admin/Moderator/System ที่ดำเนินการ |
| `action_note` | TEXT | NULL | หมายเหตุของ action |

---

#### `seller_payouts`
**วัตถุประสงค์:** บันทึกประวัติการโอนเงินสดให้ผู้ขาย (Payout Lifecycle) เพื่อความโปร่งใสและตรวจสอบทางบัญชี

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK, AUTO_INCREMENT | |
| `escrow_id` | INT UNSIGNED | FK → escrow_records.id | Escrow ที่ปล่อยเงินแล้ว |
| `seller_id` | INT UNSIGNED | FK → users.id | ผู้ขายที่ได้รับเงิน |
| `amount` | DECIMAL(12,2) | NOT NULL | ยอดเงินโอนสุทธิ (หลังหักค่าธรรมเนียม) |
| `bank_name` | VARCHAR(100) | NULL | ชื่อธนาคารของผู้ขาย |
| `bank_account_number` | VARCHAR(50) | NULL | เลขที่บัญชีธนาคาร (Encrypted at rest) |
| `bank_account_name` | VARCHAR(150) | NULL | ชื่อเจ้าของบัญชี |
| `bank_reference` | VARCHAR(100) | NULL | เลขอ้างอิงธุรกรรมธนาคาร |
| `transfer_slip_url` | VARCHAR(500) | NULL | URL สลิปหลักฐานการโอนเงินของบริษัท (Private bucket) |
| `status` | ENUM | NOT NULL DEFAULT 'PENDING' | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` |
| `processed_by` | INT UNSIGNED | FK → users.id, NULL | Super Admin ผู้ดำเนินการโอนเงินจริง |
| `processed_at` | DATETIME | NULL | เวลาที่โอนเงินสำเร็จ |
| `note` | TEXT | NULL | หมายเหตุเพิ่มเติม |
| `created_at` | DATETIME | DEFAULT NOW | |
| `updated_at` | DATETIME | ON UPDATE | |

**Indexes:** `seller_id`, `escrow_id`, `status`, `created_at`

---

### กลุ่ม E: Handover & Security

#### `handover_rooms`
**วัตถุประสงค์:** ห้องส่งมอบบัญชี — 1 Order ต่อ 1 ห้อง

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `order_id` | INT UNSIGNED | FK → orders.id, UNIQUE | |
| `status` | ENUM | NOT NULL | `WAITING_SELLER`, `INFO_PROVIDED`, `BUYER_REVIEWING`, `CONFIRMED`, `DISPUTED`, `EXPIRED_SELLER`, `AUTO_RELEASED` |
| `opened_at` | DATETIME | NOT NULL | เวลาเปิดห้อง |
| `seller_submitted_at` | DATETIME | NULL | เวลา Seller ส่งข้อมูล |
| `buyer_confirmed_at` | DATETIME | NULL | เวลา Buyer ยืนยัน |
| `expires_at` | DATETIME | NOT NULL | Deadline 72 ชม. |
| `auto_release_at` | DATETIME | NULL | Deadline Auto-Release 48 ชม. |
| `data_deleted_at` | DATETIME | NULL | เวลาที่ลบข้อมูลบัญชีใน room |

---

#### `handover_messages`
**วัตถุประสงค์:** ข้อมูลบัญชีที่ Seller ส่ง — เข้ารหัสทั้งหมด — **ลบหลัง Complete**

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `room_id` | INT UNSIGNED | FK → handover_rooms.id | |
| `sender_role` | ENUM | NOT NULL | `SELLER`, `SYSTEM` |
| `content_encrypted` | TEXT | NOT NULL | ข้อมูลบัญชี Encrypted (AES-256-GCM) |
| `encryption_iv` | VARCHAR(100) | NOT NULL | IV สำหรับ Decrypt |
| `created_at` | DATETIME | DEFAULT NOW | |
| `deleted_at` | DATETIME | NULL | Hard delete หลัง Handover Complete |

> [!CAUTION]
> `content_encrypted` เก็บ: `{ konami_email, konami_password, notes }`
> ต้อง Encrypt ด้วย AES-256-GCM และ IV แยก
> **Hard Delete** ทันทีหลัง Buyer Confirmed หรือ Dispute Resolved
> ห้ามเก็บ plain text Konami credentials ในทุกกรณี

---

#### `handover_access_logs`
**วัตถุประสงค์:** บันทึก Audit ว่าใครเข้าห้องเมื่อไหร่ (ไม่เก็บเนื้อหา)

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `room_id` | INT UNSIGNED | FK → handover_rooms.id | |
| `user_id` | INT UNSIGNED | FK → users.id | |
| `action` | ENUM | NOT NULL | `ROOM_OPENED`, `INFO_SUBMITTED`, `INFO_VIEWED`, `CONFIRMED`, `DISPUTE_OPENED`, `ROOM_CLOSED` |
| `ip_address` | VARCHAR(50) | NULL | IP ของ User |
| `user_agent` | VARCHAR(500) | NULL | Browser/Device |
| `created_at` | DATETIME | DEFAULT NOW | |

---

### กลุ่ม F: Dispute

#### `disputes`
**วัตถุประสงค์:** เคสข้อพิพาท

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `order_id` | INT UNSIGNED | FK → orders.id, UNIQUE | |
| `opened_by` | INT UNSIGNED | FK → users.id | Buyer ที่เปิด |
| `dispute_reason_id` | INT UNSIGNED | FK → dispute_reasons.id | |
| `description` | TEXT | NOT NULL | คำอธิบายจาก Buyer |
| `status` | ENUM | NOT NULL | `OPEN`, `UNDER_REVIEW`, `RESOLVED_SELLER`, `RESOLVED_BUYER` |
| `assigned_to` | INT UNSIGNED | FK → users.id, NULL | Moderator/Admin ที่รับเคส |
| `resolution_note` | TEXT | NULL | เหตุผลการตัดสิน |
| `resolved_by` | INT UNSIGNED | FK → users.id, NULL | |
| `opened_at` | DATETIME | NOT NULL | |
| `resolved_at` | DATETIME | NULL | |
| `sla_deadline` | DATETIME | NULL | Deadline ตัดสิน (48 ชม.) |

---

#### `dispute_evidence`
**วัตถุประสงค์:** ไฟล์หลักฐานแนบกับ Dispute

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `dispute_id` | INT UNSIGNED | FK → disputes.id | |
| `uploaded_by` | INT UNSIGNED | FK → users.id | |
| `file_url` | VARCHAR(500) | NOT NULL | URL รูป/ไฟล์ |
| `file_type` | VARCHAR(50) | NULL | `image/jpeg`, `image/png` |
| `description` | TEXT | NULL | คำอธิบายหลักฐาน |
| `created_at` | DATETIME | DEFAULT NOW | |

---

#### `dispute_comments`
**วัตถุประสงค์:** ความเห็น/การสื่อสารในเคส Dispute

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `dispute_id` | INT UNSIGNED | FK → disputes.id | |
| `author_id` | INT UNSIGNED | FK → users.id | |
| `message` | TEXT | NOT NULL | |
| `is_internal` | TINYINT(1) | DEFAULT 0 | Admin note ที่ไม่แสดง Buyer/Seller |
| `created_at` | DATETIME | DEFAULT NOW | |

---

### กลุ่ม G: Logs & History

#### `order_status_logs`
**วัตถุประสงค์:** ประวัติทุกการเปลี่ยนสถานะของ Order

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `order_id` | INT UNSIGNED | FK → orders.id | |
| `from_status` | VARCHAR(50) | NULL | สถานะก่อนหน้า |
| `to_status` | VARCHAR(50) | NOT NULL | สถานะใหม่ |
| `changed_by` | INT UNSIGNED | FK → users.id, NULL | NULL = SYSTEM |
| `note` | TEXT | NULL | |
| `created_at` | DATETIME | DEFAULT NOW | |

---

#### `listing_status_logs`
**วัตถุประสงค์:** ประวัติทุกการเปลี่ยนสถานะของ Listing

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `listing_id` | INT UNSIGNED | FK → account_listings.id | |
| `from_status` | VARCHAR(50) | NULL | |
| `to_status` | VARCHAR(50) | NOT NULL | |
| `changed_by` | INT UNSIGNED | FK → users.id, NULL | NULL = SYSTEM |
| `note` | TEXT | NULL | |
| `created_at` | DATETIME | DEFAULT NOW | |

---

#### `escrow_status_logs`
**วัตถุประสงค์:** ประวัติ Escrow ทุก action — ต้องสมบูรณ์และเปลี่ยนแปลงย้อนหลังไม่ได้

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `escrow_id` | INT UNSIGNED | FK → escrow_records.id | |
| `order_id` | INT UNSIGNED | FK → orders.id | Denormalized เพื่อ query ง่าย |
| `from_status` | VARCHAR(50) | NULL | |
| `to_status` | VARCHAR(50) | NOT NULL | |
| `amount` | DECIMAL(12,2) | NOT NULL | Snapshot จำนวนเงิน |
| `action_by` | INT UNSIGNED | FK → users.id, NULL | NULL = SYSTEM |
| `action_note` | TEXT | NULL | |
| `created_at` | DATETIME | DEFAULT NOW | |

> [!IMPORTANT]
> ห้าม UPDATE หรือ DELETE row ใน `escrow_status_logs`
> ทุก action ต้อง INSERT row ใหม่เท่านั้น — Append-only

---

#### `audit_logs`
**วัตถุประสงค์:** บันทึก Admin/Moderator actions ทุกอย่างที่มีผลต่อระบบ

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `actor_id` | INT UNSIGNED | FK → users.id | Admin/Moderator ที่ทำ |
| `action` | VARCHAR(100) | NOT NULL | เช่น `APPROVE_PAYMENT`, `RESOLVE_DISPUTE`, `BAN_USER` |
| `target_type` | VARCHAR(50) | NOT NULL | `Order`, `Listing`, `User`, `Dispute`, `Escrow` |
| `target_id` | INT UNSIGNED | NOT NULL | ID ของ target |
| `before_data` | JSON | NULL | ข้อมูลก่อน action |
| `after_data` | JSON | NULL | ข้อมูลหลัง action |
| `ip_address` | VARCHAR(50) | NULL | |
| `created_at` | DATETIME | DEFAULT NOW | |

---

### กลุ่ม H: Notification & Analytics

#### `notifications`
**วัตถุประสงค์:** Notification ใน-app

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `user_id` | INT UNSIGNED | FK → users.id | ผู้รับ |
| `type` | VARCHAR(50) | NOT NULL | `ORDER_CREATED`, `PAYMENT_APPROVED`, `HANDOVER_OPEN`, `DISPUTE_RESOLVED` ฯลฯ |
| `title` | VARCHAR(200) | NOT NULL | หัวข้อ |
| `message` | TEXT | NOT NULL | เนื้อหา |
| `reference_type` | VARCHAR(50) | NULL | `Order`, `Listing`, `Dispute` |
| `reference_id` | INT UNSIGNED | NULL | ID อ้างอิง |
| `is_read` | TINYINT(1) | DEFAULT 0 | |
| `read_at` | DATETIME | NULL | |
| `created_at` | DATETIME | DEFAULT NOW | |

**Indexes:** `user_id`, `is_read`, `created_at`

---

#### `price_history`
**วัตถุประสงค์:** ประวัติราคาขายจริงสำหรับปรับปรุง Valuation model

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `listing_id` | INT UNSIGNED | FK → account_listings.id | |
| `order_id` | INT UNSIGNED | FK → orders.id | |
| `game_id` | INT UNSIGNED | FK → games.id | |
| `platform_id` | INT UNSIGNED | FK → platforms.id | |
| `sold_price` | DECIMAL(12,2) | NOT NULL | ราคาขายจริง |
| `fair_price_min` | DECIMAL(12,2) | NULL | Fair Price ที่แสดง ณ เวลานั้น |
| `fair_price_max` | DECIMAL(12,2) | NULL | |
| `team_strength` | SMALLINT UNSIGNED | NULL | |
| `rare_player_count` | TINYINT UNSIGNED | NULL | จำนวนนักเตะ Rare |
| `sold_at` | DATETIME | NOT NULL | |

---

#### `platform_settings`
**วัตถุประสงค์:** ตั้งค่า Platform ที่ Admin ปรับได้

| Column | Type | Constraint | คำอธิบาย |
|--------|------|-----------|---------|
| `id` | INT UNSIGNED | PK | |
| `key` | VARCHAR(100) | UNIQUE, NOT NULL | เช่น `platform_fee_rate`, `handover_timeout_hours` |
| `value` | TEXT | NOT NULL | ค่าปัจจุบัน |
| `description` | TEXT | NULL | คำอธิบาย |
| `updated_by` | INT UNSIGNED | FK → users.id | |
| `updated_at` | DATETIME | ON UPDATE | |

**ค่าเริ่มต้นที่ควรมี:**
```
platform_fee_rate           = 0.05         (5%)
payment_deadline_hours      = 2
handover_timeout_hours      = 72
buyer_confirm_deadline_hours= 24
auto_release_hours          = 48
dispute_sla_hours           = 48
badge_great_value_threshold = 0.85         (≤85% of Fair Price)
badge_overpriced_threshold  = 1.15         (>115% of Fair Price)
```

---

## 4. ER Relationships Summary

```
users ──────────────────────────────────────────────────────────
  │
  ├─(1:N)── account_listings (seller_id)
  ├─(1:N)── orders (buyer_id)
  ├─(1:N)── orders (seller_id)
  ├─(1:1)── user_kyc
  └─(1:N)── notifications

account_listings ───────────────────────────────────────────────
  │
  ├─(N:1)── users (seller_id)
  ├─(N:1)── games
  ├─(N:1)── platforms
  ├─(1:1)── squad_scans
  ├─(1:1)── valuations (via squad_scan)
  ├─(1:N)── listing_player_cards ──(N:1)── player_cards
  ├─(1:N)── orders
  └─(1:N)── listing_status_logs

orders ──────────────────────────────────────────────────────────
  │
  ├─(N:1)── account_listings
  ├─(N:1)── users (buyer_id)
  ├─(N:1)── users (seller_id)
  ├─(1:1)── payments
  ├─(1:1)── escrow_records ──(1:N)── escrow_status_logs
  ├─(1:1)── handover_rooms
  │             └─(1:N)── handover_messages
  │             └─(1:N)── handover_access_logs
  ├─(1:1)── disputes
  │             ├─(1:N)── dispute_evidence
  │             └─(1:N)── dispute_comments
  ├─(1:N)── order_status_logs
  └─(1:1)── price_history

squad_scans ─────────────────────────────────────────────────────
  │
  ├─(1:N)── scan_player_results ──(N:1)── player_cards
  └─(1:1)── valuations

player_cards ────────────────────────────────────────────────────
  ├─(N:1)── games
  ├─(N:1)── card_tiers
  └─(N:1)── positions
```

---

## 5. ข้อควรระวังด้านความปลอดภัยและข้อมูลลับ

### Security-Sensitive Data

| ข้อมูล | ตาราง | วิธีจัดการ |
|-------|-------|---------|
| **Password ผู้ใช้** | `users.password_hash` | bcrypt ≥ 10 rounds เท่านั้น — ห้าม plain text |
| **Konami Email/Password** | `handover_messages.content_encrypted` | AES-256-GCM + IV แยก + Hard Delete หลัง Complete |
| **เลขบัตรประชาชน** | `user_kyc.id_card_number` | AES-256 at rest |
| **ชื่อจริง (KYC)** | `user_kyc.real_name` | AES-256 at rest |
| **รูปบัตรประชาชน** | `user_kyc.id_card_image_url` | Private Storage bucket (ไม่ใช่ Public URL) |
| **สลิปโอนเงิน** | `payments.payment_proof_url` | Private Storage bucket |
| **IP Address** | `handover_access_logs`, `audit_logs` | เก็บเพื่อ Fraud Detection เท่านั้น |

### Hard Delete Policy

| ตาราง | เมื่อไหร่ที่ลบ | วิธี |
|-------|------------|-----|
| `handover_messages` | หลัง Order COMPLETED หรือ REFUNDED | Hard Delete + บันทึก `data_deleted_at` ใน `handover_rooms` |
| `user_kyc` images | เมื่อ User ถูก Ban ถาวร | ลบ file จาก Storage |

### Append-Only Tables (ห้าม UPDATE/DELETE)

- `escrow_status_logs` — ทุก action ต้อง INSERT row ใหม่
- `audit_logs` — Append-only ทั้งหมด
- `order_status_logs` — Append-only
- `handover_access_logs` — Append-only

### Soft Delete Tables (ห้าม DELETE จริง)

- `users` — ใช้ `deleted_at`
- `account_listings` — ใช้ `deleted_at`

---

## 6. Open Questions ก่อน Implement

| # | คำถาม | ผลต่อ Schema |
|---|------|------------|
| Q1 | Encryption Key สำหรับ AES จัดการอย่างไร? (HSM / KMS / ENV var) | กระทบ backend security architecture |
| Q2 | Storage สำหรับ KYC และสลิป ใช้ Service ไหน? (S3 / R2 / Supabase) | กระทบ `_url` columns |
| Q3 | `handover_messages` ต้องการ Append history หรือแค่ 1 row ต่อห้อง? | กระทบ schema design |
| Q4 | ต้องการ Full-text search บน Listing (ค้นชื่อนักเตะ) ไหม? | กระทบ Index strategy |
| Q5 | Price History ต้องการ anonymize ข้อมูลก่อนใช้ train model ไหม? | กระทบ data pipeline |

---

*Planning Step 5 of 11 — ยังไม่มี SQL CREATE TABLE และยังไม่มี Code ใดๆ*

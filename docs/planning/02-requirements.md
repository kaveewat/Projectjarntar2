# 02 — Requirements

**Project:** eFootball Smart Marketplace & AI Valuation System
**Document Type:** Requirements Analysis
**Status:** Draft
**Reference:** `docs/planning/01-system-overview.md`
**Last Updated:** 2026-09-20

---

## 1. วัตถุประสงค์ของระบบ

ระบบ eFootball Smart Marketplace & AI Valuation System มีวัตถุประสงค์หลัก 4 ด้าน:

| # | วัตถุประสงค์ | รายละเอียด |
|---|------------|-----------|
| O1 | **สร้างตลาดกลางที่ปลอดภัย** | เป็นแพลตฟอร์มกลางสำหรับซื้อขายบัญชีเกม eFootball แทนการซื้อขายผ่านโซเชียลมีเดีย |
| O2 | **กำหนดราคาอ้างอิงด้วย AI** | ใช้ Vision AI สกัดข้อมูลนักเตะจากรูปภาพ Squad แล้วคำนวณราคาตลาดแนะนำ (Fair Price) |
| O3 | **ป้องกันการโกงด้วย Escrow** | ระบบคนกลางถือเงินจนกว่าการส่งมอบบัญชีจะสำเร็จ ก่อนปล่อยเงินให้ผู้ขาย |
| O4 | **มาตรฐานการส่งมอบบัญชี** | Handover Room ที่มีขั้นตอนชัดเจน ตรวจสอบได้ และมีระบบ Dispute รองรับ |

---

## 2. ปัญหาของระบบเดิม (การซื้อขายผ่านกลุ่มโซเชียล / ไร้คนกลาง)

### 2.1 ปัญหาหลักที่พบ

| ปัญหา | ผลกระทบ | ความรุนแรง |
|-------|---------|----------|
| **ผู้ขายโกง** — รับเงินแล้วไม่ส่งบัญชี หรือส่งบัญชีที่ไม่ตรงตามที่โฆษณา | ผู้ซื้อเสียเงินโดยไม่ได้บัญชี | 🔴 สูง |
| **การดึงบัญชีคืน (Account Recovery)** — ผู้ขายเปลี่ยน Konami ID กลับหลังรับเงินแล้ว | ผู้ซื้อเสียทั้งเงินและบัญชี | 🔴 สูง |
| **ราคาไม่มีมาตรฐาน** — ผู้ขายตั้งราคาตามอำเภอใจ ผู้ซื้อไม่มีข้อมูลอ้างอิง | เกิดการเอาเปรียบและซื้อแพงเกินจริง | 🟡 กลาง |
| **ตรวจสอบของยาก** — ผู้ซื้อต้องตรวจนักเตะทีละตัวจากรูปที่ผู้ขายส่งมา | เสียเวลา และอาจถูกหลอกด้วยรูปเก่า | 🟡 กลาง |
| **ไม่มีระบบ Dispute** — เมื่อเกิดปัญหาไม่มีกลไกไกล่เกลี่ย | ต้องพึ่งผู้ดูแลกลุ่มซึ่งไม่มีอำนาจจริง | 🟡 กลาง |
| **ไม่มีประวัติการซื้อขาย** — ไม่รู้ว่าผู้ขายคนไหนน่าเชื่อถือ | ความเสี่ยงสูงสำหรับผู้ซื้อใหม่ | 🟢 ต่ำ |

### 2.2 Stakeholder Pain Points

**ผู้ซื้อ:**
- ไม่มีข้อมูลอ้างอิงว่าราคาที่ขอมาเหมาะสมหรือไม่
- ต้องโอนเงินก่อนได้รับบัญชี — เสี่ยงสูง
- ไม่มีทางพิสูจน์ว่าบัญชีที่ได้มาตรงตามที่โฆษณา

**ผู้ขาย:**
- ผู้ซื้อต่อราคาโดยไม่มีข้อมูลสนับสนุน
- กลัวส่งบัญชีก่อนแล้วไม่ได้เงิน
- ไม่มีพื้นที่ลงขายที่น่าเชื่อถือ

---

## 3. เป้าหมายของระบบใหม่

| เป้าหมาย | Metric ที่วัดได้ |
|---------|---------------|
| ลดความเสี่ยงการโกง | ไม่มีกรณีผู้ขายรับเงินแล้วไม่ส่งบัญชี (Escrow บังคับ 100%) |
| มีราคาอ้างอิง AI | ทุก Listing มี Estimated Fair Price จาก AI ก่อน publish |
| กระบวนการส่งมอบมาตรฐาน | ทุก Order มี Handover Room และ Buyer Confirmation |
| ระงับข้อพิพาทได้ | Admin ตอบสนอง Dispute ภายใน 24–48 ชั่วโมง |
| ผู้ขายกำหนดราคาได้อิสระ | ราคา AI เป็น "แนะนำ" เท่านั้น ไม่บังคับ |

---

## 4. Functional Requirements

### FR-AUTH — Authentication & User Management

| ID | Requirement | Priority |
|----|------------|---------|
| FR-AUTH-01 | ผู้ใช้สามารถสมัครสมาชิกด้วย Email + Password | P0 |
| FR-AUTH-02 | ผู้ใช้สามารถเข้าสู่ระบบและได้รับ JWT Token | P0 |
| FR-AUTH-03 | ระบบแบ่ง Role: Buyer, Seller, Admin | P0 |
| FR-AUTH-04 | ผู้ใช้คนเดียวสามารถมีได้ทั้ง Role Buyer และ Seller | P0 |
| FR-AUTH-05 | ระบบ Logout และ Token Expiry | P0 |
| FR-AUTH-06 | แก้ไขข้อมูลโปรไฟล์ (ชื่อ, เบอร์โทร, Line ID) | P1 |

---

### FR-VISION — AI Vision Squad Scanner

| ID | Requirement | Priority |
|----|------------|---------|
| FR-VISION-01 | ผู้ขายอัปโหลดรูปภาพหน้าจอ Squad ได้ (รองรับหลายรูป) | P0 |
| FR-VISION-02 | รองรับรูปจากหลายมุมมอง: หน้า Squad รวม, หน้าสำรอง, หน้าการ์ดรายตัว | P0 |
| FR-VISION-03 | AI สกัดรายชื่อนักเตะระดับ Epic, Show Time, Big Time จากรูป | P0 |
| FR-VISION-04 | AI สกัดค่า Team Strength (ค่าพลังรวมทีม) จากรูป | P0 |
| FR-VISION-05 | AI สกัดตำแหน่งนักเตะ (GK, CB, ST ฯลฯ) จากรูป | P1 |
| FR-VISION-06 | แสดงผลลัพธ์การสกัด และให้ผู้ขายแก้ไขได้ก่อน Submit | P0 |
| FR-VISION-07 | บันทึก raw result จาก Vision API ไว้ใน DB สำหรับ audit | P1 |
| FR-VISION-08 | แสดงสถานะการประมวลผล AI (loading state) | P0 |

---

### FR-VALUATION — AI Price Valuation

| ID | Requirement | Priority |
|----|------------|---------|
| FR-VAL-01 | ระบบคำนวณ Estimated Fair Price หลังสกัดข้อมูลจากรูปสำเร็จ | P0 |
| FR-VAL-02 | แสดง Fair Price เป็น "ช่วงราคา" เช่น 800 – 1,200 บาท | P0 |
| FR-VAL-03 | ผู้ขายกำหนดราคาขายจริงได้อิสระ (ไม่บังคับตาม AI) | P0 |
| FR-VAL-04 | แสดง Value-for-Money Badge บน Listing:  🟢 คุ้มมาก / 🟡 พอดี / 🔴 แพงเกิน | P0 |
| FR-VAL-05 | เกณฑ์ Badge อิงจาก % ของราคาขายเทียบกับ Fair Price | P0 |
| FR-VAL-06 | ประวัติราคาขายจริงของ Listing ที่ขายแล้วถูกนำไปปรับปรุง Model | P2 |

---

### FR-LISTING — Listing Management

| ID | Requirement | Priority |
|----|------------|---------|
| FR-LIST-01 | ผู้ขายสร้าง Listing ใหม่ พร้อมข้อมูล: ราคา, แพลตฟอร์ม (iOS/Android/PS), คำอธิบาย | P0 |
| FR-LIST-02 | Listing ต้องผ่านการ Scan AI ก่อน publish (ไม่สามารถ skip ได้) | P0 |
| FR-LIST-03 | ผู้ขายแก้ไข/ยกเลิก Listing ที่ยังไม่มีคนซื้อได้ | P0 |
| FR-LIST-04 | ระบบเปลี่ยนสถานะ Listing อัตโนมัติ: Active → Reserved → Sold/Cancelled | P0 |
| FR-LIST-05 | Admin สามารถ suspend/remove Listing ที่ผิดกติกา | P0 |
| FR-LIST-06 | Listing แสดงรูป Squad ต้นฉบับที่ scan แล้ว | P0 |
| FR-LIST-07 | แสดงจำนวน Listing ที่ผู้ขายเคยขายสำเร็จ (Trust Score เบื้องต้น) | P1 |

---

### FR-SEARCH — Search & Discovery

| ID | Requirement | Priority |
|----|------------|---------|
| FR-SEARCH-01 | ค้นหา Listing โดยระบุชื่อนักเตะที่ต้องการ | P0 |
| FR-SEARCH-02 | กรองตาม: ช่วงราคา, Team Strength, แพลตฟอร์ม, Value Badge | P0 |
| FR-SEARCH-03 | เรียงลำดับ: ราคาต่ำ-สูง, ใหม่สุด, Team Strength สูงสุด | P0 |
| FR-SEARCH-04 | แสดงผลค้นหาพร้อม Badge และ Fair Price indicator | P0 |
| FR-SEARCH-05 | กรองเฉพาะ Listing ที่มีนักเตะ Epic/Show Time/Big Time | P1 |

---

### FR-ESCROW — Escrow System

| ID | Requirement | Priority |
|----|------------|---------|
| FR-ESC-01 | เมื่อผู้ซื้อกด "ซื้อ" ระบบสร้าง Order และเปลี่ยน Listing เป็น Reserved | P0 |
| FR-ESC-02 | ผู้ซื้อแจ้งการชำระเงิน พร้อมแนบหลักฐาน (สลิปโอนเงิน) | P0 |
| FR-ESC-03 | Admin/ระบบยืนยันการรับเงินก่อนเปิด Handover Room | P0 |
| FR-ESC-04 | เงินถูก "ถือ" ไว้ในระบบจนกว่า Buyer จะยืนยันสำเร็จหรือ Admin ตัดสิน | P0 |
| FR-ESC-05 | หลัง Buyer ยืนยัน → ระบบอนุมัติปล่อยเงินให้ Seller (สถานะ Released) | P0 |
| FR-ESC-06 | กรณี Dispute → Admin เป็นผู้ตัดสินว่าปล่อยหรือคืนเงิน | P0 |
| FR-ESC-07 | กรณี Timeout (ไม่มี action ตาม SLA) → ระบบ Auto-cancel และ Refund | P1 |
| FR-ESC-08 | แสดง timeline สถานะ Escrow ให้ทั้ง Buyer และ Seller เห็น | P0 |

---

### FR-HANDOVER — Handover Room

| ID | Requirement | Priority |
|----|------------|---------|
| FR-HO-01 | เปิด Handover Room หลังยืนยันการชำระเงินแล้ว | P0 |
| FR-HO-02 | Seller ส่งข้อมูลบัญชี (Email/Konami ID/Password) ในห้องที่เข้ารหัส | P0 |
| FR-HO-03 | Buyer ตรวจสอบบัญชีและกด "ยืนยันรับสำเร็จ" หรือ "พบปัญหา" | P0 |
| FR-HO-04 | ข้อมูลบัญชีในห้อง Handover ต้องถูกลบหลังการส่งมอบสำเร็จ (ไม่เก็บถาวร) | P0 |
| FR-HO-05 | มี Countdown Timer แสดงเวลาที่เหลือก่อน Timeout | P1 |
| FR-HO-06 | ทั้ง Buyer และ Seller เห็นสถานะห้องแบบ real-time (polling หรือ SSE) | P1 |
| FR-HO-07 | บันทึก audit log ว่าใครเข้าถึงห้อง Handover เมื่อไหร่ (ไม่บันทึกเนื้อหา) | P1 |
| FR-HO-08 | ผู้ขายต้องยืนยัน Checklist ว่าได้ยกเลิกการผูกบัญชีภายนอก (Game Center / Google Play / eFootball Point) ก่อนกดยืนยันส่งมอบรหัส | P0 |

---

### FR-DISPUTE — Dispute System

| ID | Requirement | Priority |
|----|------------|---------|
| FR-DIS-01 | Buyer กด "มีปัญหา" ในห้อง Handover เพื่อเปิด Dispute | P0 |
| FR-DIS-02 | Buyer ระบุสาเหตุและแนบ evidence (รูปหน้าจอ, คำอธิบาย) | P0 |
| FR-DIS-03 | Admin รับ notification เมื่อมี Dispute ใหม่ | P0 |
| FR-DIS-04 | Admin เข้าถึง Order history, Listing, หลักฐาน Escrow เพื่อตรวจสอบ | P0 |
| FR-DIS-05 | Admin ตัดสิน: ปล่อยเงินให้ Seller / คืนเงินให้ Buyer | P0 |
| FR-DIS-06 | ทั้ง Buyer และ Seller รับ notification ผลการตัดสิน | P0 |
| FR-DIS-07 | สาเหตุ Dispute ที่รองรับ: บัญชีไม่ตรงปก, ถูกดึงคืน, ข้อมูลบัญชีผิด | P0 |

---

### FR-DASHBOARD — Dashboard & Notification

| ID | Requirement | Priority |
|----|------------|---------|
| FR-DASH-01 | **Buyer Dashboard:** ประวัติการซื้อ, สถานะ Order ปัจจุบัน | P0 |
| FR-DASH-02 | **Seller Dashboard:** Listing ที่ Active/Sold, ประวัติรายได้, สถานะ Escrow | P0 |
| FR-DASH-03 | **Admin Dashboard:** จำนวน Active Listing, Pending Dispute, Volume การซื้อขาย | P0 |
| FR-DASH-04 | ระบบ Notification in-app: Order status change, Dispute update, Escrow release | P1 |
| FR-DASH-05 | แสดง Timeline ของแต่ละ Order (สร้าง → ชำระ → Handover → Complete) | P1 |

---

## 5. Non-functional Requirements

### NFR-SEC — Security

| ID | Requirement | เกณฑ์ |
|----|------------|------|
| NFR-SEC-01 | Password ต้อง hash ด้วย bcrypt (salt rounds ≥ 10) | ห้ามเก็บ plain text |
| NFR-SEC-02 | JWT token ต้อง expire ภายใน 7 วัน (refresh token ใน Phase ถัดไป) | |
| NFR-SEC-03 | ข้อมูลบัญชีใน Handover Room ต้องเข้ารหัสที่ server | AES-256 หรือเทียบเท่า |
| NFR-SEC-04 | ห้ามเก็บข้อมูลบัญชีผู้ขาย (Email/Password เกม) หลัง Handover สำเร็จ | Hard delete |
| NFR-SEC-05 | ทุก API endpoint ที่ต้องการ auth ต้องตรวจ JWT ก่อนเสมอ | 401 ถ้าไม่มี token |
| NFR-SEC-06 | Input validation และ sanitization ทุก endpoint | ป้องกัน SQL Injection, XSS |
| NFR-SEC-07 | CORS กำหนด origin เฉพาะ Vercel frontend domain | |
| NFR-SEC-08 | ห้ามเก็บ secret ใน source code | ใช้ env vars เท่านั้น |
| NFR-SEC-09 | TiDB Cloud connection ต้องใช้ SSL/TLS | rejectUnauthorized: true |

---

### NFR-PERF — Performance

| ID | Requirement | เกณฑ์ |
|----|------------|------|
| NFR-PERF-01 | AI Vision processing time | ≤ 30 วินาที ต่อ 1 ชุดรูป |
| NFR-PERF-02 | API response time (non-AI endpoints) | ≤ 500ms (P95) |
| NFR-PERF-03 | Frontend First Contentful Paint | ≤ 2 วินาที |
| NFR-PERF-04 | รองรับผู้ใช้พร้อมกัน (Concurrency) | ≥ 50 concurrent users ใน MVP |
| NFR-PERF-05 | File upload size limit (รูป Squad) | ≤ 10MB ต่อไฟล์ |
| NFR-PERF-06 | รองรับรูปสูงสุดต่อ Listing | 10 รูป |

---

### NFR-AVAIL — Availability & Reliability

| ID | Requirement | เกณฑ์ |
|----|------------|------|
| NFR-AVAIL-01 | Uptime target | ≥ 99% (Render + Vercel SLA) |
| NFR-AVAIL-02 | Database connection retry | MySQL pool retry + healthcheck |
| NFR-AVAIL-03 | AI API failure handling | แสดง error ชัดเจน พร้อม retry option |
| NFR-AVAIL-04 | Graceful degradation | ถ้า AI API down ผู้ขายยังลง Listing ด้วย manual input ได้ |

---

### NFR-USABILITY — Usability

| ID | Requirement |
|----|------------|
| NFR-USE-01 | รองรับภาษาไทยเต็มรูปแบบ (UTF-8 MB4) ทั้ง UI และ DB |
| NFR-USE-02 | UI ต้องใช้งานได้บน Mobile Browser (Responsive Design) |
| NFR-USE-03 | Loading states ทุก async operation |
| NFR-USE-04 | Error messages อธิบายปัญหาชัดเจน ไม่ใช่แค่ "Error 500" |

---

## 6. ข้อมูลที่ระบบต้องจัดเก็บ

| กลุ่มข้อมูล | รายละเอียด |
|-----------|-----------|
| **Users** | id, email, password_hash, role, display_name, phone, line_id, created_at |
| **Players (Reference DB)** | id, name, position, rarity (Epic/Show Time/Big Time), base_value |
| **Squad Scans** | id, user_id, image_urls[], extracted_players[], team_strength, ai_raw_response, scanned_at |
| **Valuations** | id, scan_id, fair_price_min, fair_price_max, algorithm_version, calculated_at |
| **Listings** | id, seller_id, scan_id, title, description, price, platform, status, created_at |
| **Orders** | id, listing_id, buyer_id, seller_id, amount, status, payment_proof_url, created_at |
| **Escrow Records** | id, order_id, amount, status (held/released/refunded), action_at, action_by |
| **Handover Rooms** | id, order_id, status, timeout_at, confirmed_at |
| **Handover Messages** | id, room_id, sender_role, content_encrypted, created_at (ลบหลัง complete) |
| **Disputes** | id, order_id, opened_by, reason, evidence_urls[], status, resolved_by, resolution, created_at |
| **Notifications** | id, user_id, type, message, is_read, created_at |
| **Price History** | id, listing_id, sold_price, sold_at (สำหรับ improve valuation model) |

---

## 7. ข้อมูลที่ระบบต้องแสดงผล

### หน้า Listing Cards (สาธารณะ)
- รูป Squad preview
- ชื่อ Listing, Platform
- ราคาขาย + Estimated Fair Price
- Value-for-Money Badge (🟢/🟡/🔴)
- Team Strength
- รายชื่อนักเตะ Rare หลัก (3–5 คน)
- สถานะ (Active/Reserved/Sold)
- จำนวนยอดขายสำเร็จของ Seller

### หน้า Listing Detail
- รูป Squad ทั้งหมด
- รายชื่อนักเตะครบ (Epic/Show Time/Big Time)
- Team Strength
- Fair Price Range + Badge + อธิบาย Badge
- ราคาขายของ Seller
- ข้อมูล Platform, คำอธิบาย
- ปุ่ม "ซื้อ" (ถ้า Active)

### Buyer Dashboard
- Order ปัจจุบัน + สถานะ
- ประวัติ Order ที่เสร็จสิ้น
- Dispute ที่เปิดอยู่

### Seller Dashboard
- Listing ที่ Active, จำนวน Reserved, ยอดขายรวม
- Escrow ที่รอปล่อย
- ประวัติรายได้

### Admin Dashboard
- จำนวน Listing ทั้งหมด (Active/Pending/Sold)
- Dispute ที่รอตรวจสอบ
- Transaction volume
- User ที่ถูก suspend

---

## 8. เงื่อนไขทางธุรกิจ (Business Rules)

### BR-FEE — ค่าธรรมเนียมคนกลาง

| Rule | รายละเอียด | ค่าเริ่มต้น |
|------|-----------|----------|
| BR-FEE-01 | ระบบหักค่าธรรมเนียมจากราคาขายก่อนปล่อยให้ Seller | MVP: 5% (ปรับได้) |
| BR-FEE-02 | ค่าธรรมเนียมคำนวณจาก "ราคาขายจริง" ไม่ใช่ Fair Price | |
| BR-FEE-03 | แสดงค่าธรรมเนียมให้ Seller เห็นก่อน publish Listing | ต้องชัดเจน ไม่ซ่อน |

> **Open:** ค่าธรรมเนียม 5% ต้องได้รับ confirm จาก stakeholder ก่อน implement

---

### BR-ESCROW — กฎการถือเงินและปล่อยเงิน

| Rule | รายละเอียด |
|------|-----------|
| BR-ESC-01 | เงินถูกถือในระบบทันทีที่ Admin ยืนยันการชำระเงิน |
| BR-ESC-02 | ปล่อยเงินให้ Seller ได้เมื่อ: Buyer กด "ยืนยันรับสำเร็จ" เท่านั้น |
| BR-ESC-03 | ปล่อยเงินได้เมื่อ Admin ตัดสิน Dispute ให้ Seller ชนะ |
| BR-ESC-04 | คืนเงินให้ Buyer เมื่อ: Admin ตัดสิน Dispute ให้ Buyer ชนะ |
| BR-ESC-05 | คืนเงินเมื่อ Handover Room Timeout โดยไม่มี action |
| BR-ESC-06 | ห้าม Seller เข้าถึงเงินโดยตรง — ต้องผ่านการ approve จาก system |

---

### BR-HANDOVER — กฎการส่งมอบ

| Rule | รายละเอียด |
|------|-----------|
| BR-HO-01 | Handover Room เปิดได้เฉพาะหลังยืนยันการชำระเงินแล้ว |
| BR-HO-02 | Timeout ของ Handover Room: **72 ชั่วโมง** นับจากเปิดห้อง (ต้องได้รับ confirm) |
| BR-HO-03 | ถ้า Seller ไม่ส่งข้อมูลภายใน Timeout → Auto-cancel + Refund |
| BR-HO-04 | ถ้า Buyer ไม่ยืนยันภายใน 24 ชั่วโมงหลัง Seller ส่ง → Reminder notification |
| BR-HO-05 | ข้อมูลบัญชีในห้องถูกลบทันทีหลัง Buyer ยืนยันหรือ Dispute resolved |

---

### BR-VALUATION — เกณฑ์การคำนวณ Fair Price และ Badge

| Rule | รายละเอียด |
|------|-----------|
| BR-VAL-01 | Fair Price คำนวณจาก: Team Strength + จำนวนนักเตะ Epic/Show Time + ราคาขายจริงในอดีต |
| BR-VAL-02 | Badge 🟢 คุ้มมาก: ราคาขาย ≤ 85% ของ Fair Price |
| BR-VAL-03 | Badge 🟡 พอดี: ราคาขายอยู่ใน 85%–115% ของ Fair Price |
| BR-VAL-04 | Badge 🔴 แพงเกิน: ราคาขาย > 115% ของ Fair Price |
| BR-VAL-05 | Fair Price เป็น "แนะนำ" — ผู้ขายกำหนดราคาได้อิสระ |
| BR-VAL-06 | Fair Price ต้องระบุว่า "คำนวณ ณ วันที่..." และอาจล้าสมัย |

---

### BR-LISTING — กฎการลงขาย

| Rule | รายละเอียด |
|------|-----------|
| BR-LIST-01 | 1 Order ต่อ 1 Listing — ห้ามขายให้หลายคนพร้อมกัน |
| BR-LIST-02 | Listing ที่ Reserved แล้ว ผู้ขายไม่สามารถยกเลิกได้เอง ต้องผ่าน Admin |
| BR-LIST-03 | ผู้ขายขาย Listing เดิมซ้ำไม่ได้ถ้า Order ยังไม่เสร็จสิ้น |

---

## 9. ข้อจำกัดและข้อควรระวัง

### ⚠️ ความเสี่ยงสูง

| ความเสี่ยง | รายละเอียด | แนวทางรับมือ |
|-----------|-----------|------------|
| **Account Recovery (R1)** | ผู้ขาย request เปลี่ยน Konami ID คืนจาก Konami หลังขาย เนื่องจาก Konami มีช่อง "Recovery" | แนะนำให้ Buyer เปลี่ยน Konami ID ทันทีใน Handover, มี Dispute รองรับ, ไม่มีทาง prevent 100% |
| **ข้อมูลบัญชีรั่วไหล (R2)** | ข้อมูล Email/Password ของเกมถูก intercept ระหว่างส่งมอบ | เข้ารหัสข้อมูลใน Handover Room + ลบหลัง complete |
| **Payment Fraud (R3)** | แนบสลิปปลอมเพื่อหลอกให้ Admin อนุมัติ Escrow | Admin ต้องตรวจสอบกับบัญชีรับเงินจริงก่อน release |

### ⚠️ ข้อจำกัดของ Vision AI

| ข้อจำกัด | รายละเอียด |
|---------|-----------|
| **รูปคุณภาพต่ำ** | AI อาจอ่านชื่อนักเตะผิดหรือพลาดถ้ารูปเบลอหรือมีแสงสะท้อน |
| **รูปเก่า/ไม่ตรงปัจจุบัน** | ผู้ขายอาจอัปโหลดรูปเก่าที่ไม่ตรงกับบัญชีจริง |
| **Update ของเกม** | UI ของ eFootball อาจเปลี่ยนในอัปเดตใหม่ ทำให้ AI อ่านผิด |
| **Rate Limit & Cost** | Vision API มี rate limit และค่าใช้จ่ายต่อ request ต้องวางแผนค่าใช้จ่าย |
| **ไม่รองรับวิดีโอ** | MVP รองรับเฉพาะภาพนิ่ง (screenshot) |

### ⚠️ ข้อจำกัดทางกฎหมาย/ธุรกิจ

| ข้อจำกัด | รายละเอียด |
|---------|-----------|
| **Terms of Service ของ Konami** | การซื้อขายบัญชีเกมอาจขัด ToS ของ Konami — ระบบไม่รับผิดชอบ |
| **ไม่มี Payment Gateway จริง** | MVP ใช้ manual transfer — ต้องใช้ Admin ยืนยันทุก transaction |
| **ไม่ใช่ Financial Institution** | ระบบไม่ใช่ผู้ให้บริการทางการเงินที่ได้รับอนุญาต — ต้องระบุใน ToS |

---

## 10. คำถามที่ควรถามผู้ใช้งานจริงเพิ่มเติม

### ฝั่งผู้ซื้อ (Buyer)

| # | คำถาม | ผลต่อ Design |
|---|------|------------|
| Q-B1 | นักเตะกลุ่มไหนที่ต้องการมากที่สุดในการค้นหา? (ชื่อเฉพาะ / ระดับ / ตำแหน่ง) | กระทบ search & filter |
| Q-B2 | ราคาช่วงไหนที่ซื้อขายกันมากที่สุด? | กระทบ Fair Price model |
| Q-B3 | ปัญหาหลักที่เคยเจอตอนซื้อผ่านกลุ่มโซเชียล? | กระทบ trust features |
| Q-B4 | ยอมรับการรอ Admin ยืนยัน Escrow ได้กี่ชั่วโมง? | กระทบ SLA |
| Q-B5 | ต้องการให้มี Value-for-Money Badge ช่วยตัดสินใจไหม? | validate feature priority |

### ฝั่งผู้ขาย (Seller)

| # | คำถาม | ผลต่อ Design |
|---|------|------------|
| Q-S1 | ปัญหาหลักในการลงขายคืออะไร? (ตรวจนักเตะ / ตั้งราคา / หาคนซื้อ) | กระทบ listing UX |
| Q-S2 | ยอมรับค่าธรรมเนียมคนกลางที่เปอร์เซ็นต์เท่าไหร่? | กระทบ Business Model |
| Q-S3 | ต้องการ Listing หลายรายการพร้อมกันไหม? | กระทบ business rule |
| Q-S4 | กังวลเรื่องอะไรมากที่สุดในการส่งมอบบัญชี? | กระทบ Handover design |
| Q-S5 | รูปแบบการรับเงินที่ต้องการ? (PromptPay / Bank Transfer / อื่น) | กระทบ Escrow flow |

### ฝั่ง Admin / คนกลาง

| # | คำถาม | ผลต่อ Design |
|---|------|------------|
| Q-A1 | Admin จะมีกี่คน? ทำงานกี่ชั่วโมงต่อวัน? | กระทบ SLA และ Timeout |
| Q-A2 | ขั้นตอนการตรวจสอบสลิปจะทำอย่างไร? | กระทบ Escrow flow |
| Q-A3 | มีเกณฑ์ชัดเจนในการตัดสิน Dispute ไหม? | กระทบ Dispute policy |
| Q-A4 | ต้องการ export รายงานการซื้อขายหรือไม่? | กระทบ Admin dashboard |
| Q-A5 | มีกระบวนการ suspend/ban user ที่ชัดเจนไหม? | กระทบ User management |

---

*Planning Step 2 of 11 — ยังไม่ได้ออกแบบ Database และยังไม่มี Code ใดๆ*

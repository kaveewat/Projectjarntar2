# 03 — User Roles & Permissions

**Project:** eFootball Smart Marketplace & AI Valuation System
**Document Type:** Roles & Access Control Design
**Status:** Draft
**Reference:** `01-system-overview.md`, `02-requirements.md`
**Last Updated:** 2026-09-20

---

## 1. สรุป Roles ทั้งหมด

| Role Code | ชื่อ Role | ประเภท |
|-----------|---------|-------|
| `SUPER_ADMIN` | Super Admin | Internal Staff |
| `MODERATOR` | Marketplace Moderator / Escrow Agent | Internal Staff |
| `VERIFIED_SELLER` | Verified Seller | Registered User |
| `SELLER` | General Seller | Registered User |
| `BUYER` | Buyer | Registered User |
| `GUEST` | Guest / Public User | Unauthenticated |
| `AI_SERVICE` | AI System Service *(เพิ่มเติม)* | Internal System |

> **หมายเหตุ:** User 1 คนสามารถมีหลาย Role ได้ เช่น คนเดียวกันเป็นทั้ง SELLER และ BUYER

---

## 2. Role Descriptions

### 2.1 SUPER_ADMIN — Super Admin

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **คำอธิบาย** | ผู้ดูแลระบบสูงสุด มีสิทธิ์เข้าถึงทุกส่วนของระบบ |
| **จำนวนที่ควรมี** | 1–2 คน (จำกัดเพื่อความปลอดภัย) |
| **ความรับผิดชอบ** | ดูแลระบบโดยรวม, จัดการ user, ตั้งค่า platform, override ทุกการตัดสินใจ |

**สิทธิ์ที่ทำได้:**
- จัดการ User ทุกคน (สร้าง, แก้ไข, suspend, ban)
- เลื่อน/ลด Role ของ User
- ยืนยัน KYC เพื่อเปลี่ยน SELLER → VERIFIED_SELLER
- จัดการ Listing ทุกรายการ (edit, suspend, delete, feature)
- ดูแลและตัดสิน Dispute ทุกเคส
- Approve / Reject Escrow payment
- Release / Refund เงิน Escrow
- ดู Audit Log ทั้งหมด
- ตั้งค่า Platform (ค่าธรรมเนียม, Timeout, Badge criteria)
- จัดการ MODERATOR (สร้าง/ลบ)
- ดูรายงานและ Dashboard ทั้งหมด

**หน้าจอที่เข้าถึงได้:**
- Admin Dashboard (ภาพรวมทั้งระบบ)
- User Management
- Listing Management (ทุก listing)
- Order & Escrow Management
- Dispute Management
- System Settings
- Audit Log Viewer
- Analytics & Reports
- ทุกหน้าของ Buyer และ Seller

**ข้อมูลที่มองเห็นได้:**
- ข้อมูล Personal ของ User ทุกคน (email, phone, line_id)
- ข้อมูล Escrow ทุกรายการ (จำนวนเงิน, สถานะ)
- ข้อมูลใน Handover Room (audit log เท่านั้น ไม่เห็นเนื้อหาที่ deleted)
- ประวัติการซื้อขายทั้งระบบ
- Dispute ทุกเคสพร้อม evidence

**ข้อจำกัด:**
- ทุก action ที่มีผลต่อเงิน (release/refund) ต้องถูก log ไว้ใน Audit Trail เสมอ
- ห้าม access ข้อมูลบัญชีเกม (Email/Password) ที่ผู้ขายส่งใน Handover Room หลัง complete

---

### 2.2 MODERATOR — Marketplace Moderator / Escrow Agent

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **คำอธิบาย** | เจ้าหน้าที่คนกลาง ดูแลการยืนยันการชำระเงิน จัดการ Escrow และตรวจสอบ Dispute |
| **จำนวนที่ควรมี** | 2–5 คน ขึ้นกับปริมาณ Transaction |
| **ความรับผิดชอบ** | ยืนยันสลิปโอนเงิน, อนุมัติ Escrow, ตรวจสอบและตัดสิน Dispute |

**สิทธิ์ที่ทำได้:**
- ดู Order ทุกรายการ
- Approve / Reject หลักฐานการชำระเงิน (สลิป)
- Release / Refund เงิน Escrow (ตามผลการตัดสิน)
- ดู Dispute ที่ได้รับมอบหมาย
- ตัดสิน Dispute: ปล่อยเงินหรือคืนเงิน
- Suspend Listing ที่ผิดกติกา (ไม่สามารถ delete ได้)
- ส่งข้อความแจ้ง User เกี่ยวกับเคสของตน
- ดู Handover Room audit log (ไม่เห็นเนื้อหา)

**หน้าจอที่เข้าถึงได้:**
- Moderator Dashboard (เคสที่รอดำเนินการ)
- Order & Escrow Management (เฉพาะที่รับผิดชอบ)
- Dispute Management (เฉพาะที่รับผิดชอบ)
- Listing Management (view + suspend เท่านั้น)
- User Profile (view เท่านั้น)

**ข้อมูลที่มองเห็นได้:**
- ข้อมูล Order และ Escrow ทุกรายการ
- หลักฐานการชำระเงิน (สลิป)
- Dispute evidence
- ข้อมูล User เฉพาะที่จำเป็น (ชื่อ, email — ไม่เห็น password hash)
- Listing detail ทุกรายการ

**ข้อจำกัด:**
- ไม่สามารถ delete User หรือ Listing ได้ (suspend เท่านั้น)
- ไม่สามารถเปลี่ยน Platform settings
- ไม่สามารถจัดการ MODERATOR คนอื่น
- ไม่สามารถทำรายการโอนเงินสดจริง (Manual Payout) ออกจากบัญชีบริษัทได้ (สิทธิ์สงวนไว้เฉพาะ SUPER_ADMIN เพื่อควบคุมความเสี่ยงทางการเงิน — MODERATOR ปรับได้เฉพาะสถานะ Escrow ในระบบ)
- ทุก action ต้องถูก log ไว้ใน Audit Trail

---

### 2.3 VERIFIED_SELLER — Verified Seller

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **คำอธิบาย** | ผู้ขายที่ผ่านการยืนยันตัวตน (KYC) — มีสิทธิ์เหมือน SELLER แต่ได้รับ Trust Badge |
| **เงื่อนไขได้รับ Role** | ยืนยันตัวตนด้วยบัตรประชาชน/พาสปอร์ต + Admin approve |
| **ความต่างจาก SELLER** | แสดง ✅ Verified Badge บน Profile และ Listing |

**สิทธิ์ที่ทำได้:**
- ทุกอย่างที่ SELLER ทำได้
- แสดง ✅ Verified Badge บน Listing (เพิ่มความน่าเชื่อถือ)
- *(MVP)* ยอด Listing สูงสุดต่อวัน: 10 รายการ (vs SELLER: 3 รายการ)
- *(Future)* อาจได้รับ fee ที่ต่ำกว่า SELLER ทั่วไป

**ข้อจำกัด:**
- ถูก revoke Verified status ได้หากมีประวัติ Dispute ที่แพ้ ≥ 3 ครั้ง
- ยังต้องผ่าน Escrow เหมือน SELLER ทั่วไป

---

### 2.4 SELLER — General Seller

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **คำอธิบาย** | ผู้ขายบัญชีเกม eFootball ทั่วไป ที่ลงทะเบียนและยืนยัน email แล้ว |
| **เงื่อนไขได้รับ Role** | Register + Verify Email |

**สิทธิ์ที่ทำได้:**
- อัปโหลดรูป Squad เพื่อ AI Scan
- ดูผลลัพธ์ AI และแก้ไขก่อน Submit
- สร้าง Listing (สูงสุด 3 รายการที่ Active พร้อมกัน)
- แก้ไข Listing ที่ยังไม่มีคน Reserve
- ยกเลิก Listing ที่ยัง Active (ไม่ใช่ Reserved)
- ดูสถานะ Escrow ของ Order ตัวเอง
- เข้า Handover Room (ในฐานะ Seller) เพื่อส่งข้อมูลบัญชี
- ดู Order History ของตัวเอง
- ดู Seller Dashboard

**หน้าจอที่เข้าถึงได้:**
- Seller Dashboard
- AI Squad Scanner
- Create / Edit Listing
- My Listings
- Order History (ฝั่ง Seller)
- Handover Room (ฝั่ง Seller)
- Profile Settings

**ข้อมูลที่มองเห็นได้:**
- Listing ของตัวเองทั้งหมด
- Order ของตัวเองทั้งหมด
- ชื่อ Buyer ของ Order ตัวเอง (display name เท่านั้น)
- สถานะ Escrow ของ Order ตัวเอง
- Fair Price และ Badge ของ Listing ตัวเอง

**ข้อจำกัด:**
- ไม่สามารถเข้าถึง Escrow funds โดยตรง
- ไม่สามารถยกเลิก Listing ที่ Reserved แล้ว
- ไม่สามารถดู Order หรือ Listing ของ User คนอื่น
- ไม่สามารถเปิด Dispute เองในฐานะ Seller (เฉพาะ Buyer เปิดได้)
- จำนวน Active Listing สูงสุด: 3 รายการ

---

### 2.5 BUYER — Buyer

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **คำอธิบาย** | ผู้ซื้อบัญชีเกม eFootball ที่ลงทะเบียนและยืนยัน email แล้ว |
| **เงื่อนไขได้รับ Role** | Register + Verify Email |

**สิทธิ์ที่ทำได้:**
- ค้นหาและกรอง Listing
- ดูรายละเอียด Listing ทั้งหมด
- กด "ซื้อ" เพื่อสร้าง Order (เฉพาะ Active Listing)
- แนบหลักฐานการชำระเงิน
- เข้า Handover Room (ฝั่ง Buyer) เพื่อรับข้อมูลบัญชี
- กด "ยืนยันรับสำเร็จ" หรือ "พบปัญหา"
- เปิด Dispute พร้อมแนบ evidence
- ดู Order History ของตัวเอง
- ดู Buyer Dashboard

**หน้าจอที่เข้าถึงได้:**
- Marketplace (ค้นหา/กรอง)
- Listing Detail
- Checkout / Payment
- Buyer Dashboard
- Order History (ฝั่ง Buyer)
- Handover Room (ฝั่ง Buyer)
- Dispute Filing
- Profile Settings

**ข้อมูลที่มองเห็นได้:**
- Listing ทั้งหมดที่ Active (public info)
- Order ของตัวเองทั้งหมด
- ชื่อ Seller ของ Order ตัวเอง (display name เท่านั้น)
- Fair Price, Badge ของทุก Listing
- ข้อมูลบัญชีเกมใน Handover Room (เฉพาะ Order ของตัวเอง)

**ข้อจำกัด:**
- ไม่สามารถซื้อ Listing ของตัวเอง (ถ้า User เดียวกัน)
- ไม่สามารถเปิด Order ซ้ำใน Listing เดียวกัน
- ไม่สามารถดู Order หรือ Handover Room ของ User คนอื่น
- ไม่สามารถสร้าง Listing (ต้องสลับ Role เป็น Seller ก่อน)

---

### 2.6 GUEST — Guest / Public User

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **คำอธิบาย** | ผู้เข้าชมที่ยังไม่ได้เข้าสู่ระบบ เห็นได้เฉพาะข้อมูลสาธารณะ |

**สิทธิ์ที่ทำได้:**
- ดู Listing ที่ Active (limited info)
- ค้นหาและกรอง Listing
- ดูหน้า Landing Page / About / FAQ

**หน้าจอที่เข้าถึงได้:**
- Landing Page
- Marketplace (ค้นหา/กรอง — ไม่มีปุ่มซื้อ)
- Listing Detail (view only — ไม่มีปุ่มซื้อ)
- Login / Register

**ข้อมูลที่มองเห็นได้:**
- ชื่อ Listing, รูป Squad, Team Strength
- Fair Price Range, Value Badge
- ราคาขาย
- Platform

**ข้อจำกัด:**
- ไม่สามารถซื้อได้ — redirect ไป Login เมื่อกด "ซื้อ"
- ไม่เห็น display name ของ Seller
- ไม่เห็นข้อมูล contact ใดๆ
- ไม่สามารถ scan Squad หรือสร้าง Listing

---

### 2.7 AI_SERVICE — AI System Service *(Role เพิ่มเติมที่แนะนำ)*

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **คำอธิบาย** | Service Account ภายในระบบสำหรับการเรียก Vision API และ Valuation Engine |
| **เหตุผลที่แนะนำ** | แยก auth context ของ AI calls ออกจาก user requests เพื่อ logging และ rate limiting แยกกัน |
| **ประเภท** | ไม่มี user account จริง — เป็น Service Token ที่ backend ใช้ภายใน |

**สิทธิ์ที่ทำได้:**
- เรียก Vision API endpoint ของ backend
- อ่านและเขียน Squad Scan results ใน DB
- เรียก Valuation calculation
- เขียน Price History

**ข้อจำกัด:**
- ไม่มี Login/Logout
- ไม่สามารถ access User data, Orders, Escrow
- Rate limited ตาม Vision API quota

---

## 3. Permission Matrix

### Legend
- ✅ ทำได้เต็มที่
- 🔶 ทำได้บางส่วน (เช่น เฉพาะ record ของตัวเอง)
- ❌ ทำไม่ได้
- 👁️ ดูได้อย่างเดียว

### 3.1 User Management

| Permission | SUPER_ADMIN | MODERATOR | VERIFIED_SELLER | SELLER | BUYER | GUEST |
|-----------|:-----------:|:---------:|:---------------:|:------:|:-----:|:-----:|
| ดู User list | ✅ | 👁️ limited | ❌ | ❌ | ❌ | ❌ |
| สร้าง User | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| แก้ไข User อื่น | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| แก้ไข Profile ตัวเอง | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Suspend / Ban User | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| เปลี่ยน Role | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve KYC | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 3.2 AI Vision & Valuation

| Permission | SUPER_ADMIN | MODERATOR | VERIFIED_SELLER | SELLER | BUYER | GUEST |
|-----------|:-----------:|:---------:|:---------------:|:------:|:-----:|:-----:|
| อัปโหลดรูปเพื่อ Scan | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| ดูผลลัพธ์ AI Scan | ✅ | 👁️ | 🔶 ของตัวเอง | 🔶 ของตัวเอง | ❌ | ❌ |
| แก้ไขผลลัพธ์ AI | ✅ | ❌ | 🔶 ของตัวเอง | 🔶 ของตัวเอง | ❌ | ❌ |
| ดู Fair Price | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ดู Value Badge | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 3.3 Listing Management

| Permission | SUPER_ADMIN | MODERATOR | VERIFIED_SELLER | SELLER | BUYER | GUEST |
|-----------|:-----------:|:---------:|:---------------:|:------:|:-----:|:-----:|
| ดู Active Listing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ดู Listing ทั้งหมด (all status) | ✅ | ✅ | 🔶 ของตัวเอง | 🔶 ของตัวเอง | 🔶 ของตัวเอง | ❌ |
| สร้าง Listing (สูงสุด 3) | ✅ | ❌ | ✅ (สูงสุด 10) | ✅ (สูงสุด 3) | ❌ | ❌ |
| แก้ไข Listing ตัวเอง | ✅ | ❌ | 🔶 Active only | 🔶 Active only | ❌ | ❌ |
| ยกเลิก Listing ตัวเอง | ✅ | ❌ | 🔶 Active only | 🔶 Active only | ❌ | ❌ |
| Suspend Listing อื่น | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete Listing | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 3.4 Order & Escrow

| Permission | SUPER_ADMIN | MODERATOR | VERIFIED_SELLER | SELLER | BUYER | GUEST |
|-----------|:-----------:|:---------:|:---------------:|:------:|:-----:|:-----:|
| ดู Order ทั้งหมด | ✅ | ✅ | 🔶 ของตัวเอง | 🔶 ของตัวเอง | 🔶 ของตัวเอง | ❌ |
| สร้าง Order (ซื้อ) | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| แนบหลักฐานชำระเงิน | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Approve หลักฐาน Escrow | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Release เงินให้ Seller | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Refund เงินให้ Buyer | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| ดูสถานะ Escrow ของตัวเอง | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### 3.5 Handover Room

| Permission | SUPER_ADMIN | MODERATOR | VERIFIED_SELLER | SELLER | BUYER | GUEST |
|-----------|:-----------:|:---------:|:---------------:|:------:|:-----:|:-----:|
| เปิด Handover Room | Auto (ระบบ) | — | — | — | — | ❌ |
| ส่งข้อมูลบัญชีในห้อง | ✅ | ❌ | 🔶 ของตัวเอง | 🔶 ของตัวเอง | ❌ | ❌ |
| ดูข้อมูลบัญชีในห้อง | ✅ (audit log) | 👁️ audit log | ❌ | 🔶 ของตัวเอง | 🔶 ของตัวเอง | ❌ |
| ยืนยันรับสำเร็จ | ✅ | ❌ | ❌ | ❌ | 🔶 ของตัวเอง | ❌ |
| กด "พบปัญหา" | ✅ | ❌ | ❌ | ❌ | 🔶 ของตัวเอง | ❌ |
| ดู Audit Log ห้อง | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### 3.6 Dispute

| Permission | SUPER_ADMIN | MODERATOR | VERIFIED_SELLER | SELLER | BUYER | GUEST |
|-----------|:-----------:|:---------:|:---------------:|:------:|:-----:|:-----:|
| เปิด Dispute | ✅ | ❌ | ❌ | ❌ | 🔶 ของตัวเอง | ❌ |
| ดู Dispute ทั้งหมด | ✅ | ✅ | 🔶 ที่เกี่ยวข้อง | 🔶 ที่เกี่ยวข้อง | 🔶 ที่เกี่ยวข้อง | ❌ |
| ตัดสิน Dispute | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| แนบ Evidence | ✅ | ❌ | ❌ | ❌ | 🔶 ของตัวเอง | ❌ |

### 3.7 Dashboard & Reports

| Permission | SUPER_ADMIN | MODERATOR | VERIFIED_SELLER | SELLER | BUYER | GUEST |
|-----------|:-----------:|:---------:|:---------------:|:------:|:-----:|:-----:|
| Admin Dashboard | ✅ | 👁️ Moderator view | ❌ | ❌ | ❌ | ❌ |
| Seller Dashboard | ✅ | ❌ | 🔶 ของตัวเอง | 🔶 ของตัวเอง | ❌ | ❌ |
| Buyer Dashboard | ✅ | ❌ | 🔶 ของตัวเอง | 🔶 ของตัวเอง | 🔶 ของตัวเอง | ❌ |
| Export Reports | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ดู Audit Log | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Pages Access Map

| Page | SUPER_ADMIN | MODERATOR | V_SELLER | SELLER | BUYER | GUEST |
|------|:-----------:|:---------:|:--------:|:------:|:-----:|:-----:|
| Landing / Home | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Marketplace (Browse) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Listing Detail | ✅ | ✅ | ✅ | ✅ | ✅ | 👁️ ไม่มีปุ่มซื้อ |
| Login / Register | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Profile Settings | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| AI Squad Scanner | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Create Listing | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Seller Dashboard | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| My Listings | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Buyer Dashboard | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Order Detail | ✅ | ✅ | 🔶 | 🔶 | 🔶 | ❌ |
| Handover Room | ✅ | 👁️ audit | 🔶 | 🔶 | 🔶 | ❌ |
| Dispute Filing | ✅ | ❌ | ❌ | ❌ | 🔶 | ❌ |
| Dispute Detail | ✅ | ✅ | 🔶 | 🔶 | 🔶 | ❌ |
| Admin Dashboard | ✅ | 👁️ | ❌ | ❌ | ❌ | ❌ |
| User Management | ✅ | 👁️ | ❌ | ❌ | ❌ | ❌ |
| Listing Moderation | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Escrow Management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Audit Log | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 5. Role Implementation Notes

### 5.1 DB Implementation

```
users table:
  role ENUM('SUPER_ADMIN', 'MODERATOR', 'VERIFIED_SELLER', 'SELLER', 'BUYER')

หมายเหตุ:
- User สามารถมีได้หลาย role → อาจใช้ user_roles table แทน
- GUEST ไม่อยู่ใน DB — เป็นสถานะ "ไม่ได้ authenticate"
- AI_SERVICE ใช้ service token ใน ENV ไม่ใช่ row ใน users table
```

### 5.2 MVP Simplification

> [!IMPORTANT]
> สำหรับ MVP ให้รวม SELLER และ VERIFIED_SELLER เป็น role เดียวก่อน
> โดย `is_verified` เป็น boolean field ใน users table แทนการแยก role
> จะแยกเป็น role จริงในระยะถัดไป

**MVP Role (simplified):**

```
ENUM: 'ADMIN', 'MODERATOR', 'SELLER', 'BUYER'
+ users.is_verified BOOLEAN = false
+ users.is_suspended BOOLEAN = false
```

### 5.3 Auth Middleware Rules (Backend)

| Route Pattern | Required Role |
|---------------|--------------|
| `GET /api/listings` | Public (ไม่ต้อง auth) |
| `POST /api/listings` | SELLER หรือ ADMIN |
| `POST /api/orders` | BUYER หรือ ADMIN |
| `POST /api/orders/:id/approve-payment` | MODERATOR หรือ ADMIN |
| `POST /api/orders/:id/release` | MODERATOR หรือ ADMIN |
| `POST /api/disputes` | BUYER หรือ ADMIN |
| `PUT /api/disputes/:id/resolve` | MODERATOR หรือ ADMIN |
| `GET /api/admin/*` | ADMIN หรือ MODERATOR |
| `DELETE /api/admin/users/:id` | ADMIN เท่านั้น |

---

## 6. Open Questions

| # | คำถาม | ผลต่อ Implementation |
|---|------|-------------------|
| Q1 | KYC ใช้กระบวนการอะไร? (Manual upload บัตร / Third-party API) | กระทบ Verified Seller flow |
| Q2 | User คนเดียวเป็นได้ทั้ง Seller และ Buyer พร้อมกันไหม? (ตอนนี้ assume: ได้) | กระทบ DB schema |
| Q3 | MODERATOR มี account ในระบบเหมือน user ทั่วไปหรือสร้างโดย SUPER_ADMIN เท่านั้น? | กระทบ user management |
| Q4 | ต้องการ role AUDITOR (read-only ทุกอย่าง) สำหรับ financial audit ในอนาคตไหม? | Phase ถัดไป |

---

*Planning Step 3 of 11 — ยังไม่มี Code ใดๆ*

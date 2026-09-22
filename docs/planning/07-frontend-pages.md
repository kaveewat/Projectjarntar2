# 07 — Frontend Pages & UI Structure

**Project:** eFootball Smart Marketplace & AI Valuation System
**Document Type:** Frontend Page Architecture
**Status:** Draft
**Stack:** React 18 + Vite 5 + MUI 5 + React Router DOM v6
**Reference:** `01–06 planning docs`
**Last Updated:** 2026-09-20

---

## 1. Layout Hierarchy

```
App
├── PublicLayout          ← Navbar (logo, search, login/register) + Footer
│   ├── LandingPage
│   ├── MarketplacePage
│   ├── ListingDetailPage
│   └── Auth pages (Login, Register, ...)
│
├── UserLayout            ← Topbar (avatar, notifications bell) + Sidebar
│   ├── Buyer pages
│   ├── Seller pages
│   └── Shared (Profile, Notifications)
│
├── HandoverLayout        ← Fullscreen Secure Room (minimal chrome)
│   └── HandoverRoomPage
│
└── AdminLayout           ← Admin Sidebar + Topbar
    ├── Admin Dashboard
    ├── Admin management pages
    └── Analytics pages
```

---

## 2. Layout Definitions

### 2.1 PublicLayout
- **ใช้กับ:** ทุกหน้าที่ Guest เข้าได้
- **Navbar:** Logo, ปุ่มค้นหา Listing, Menu (Marketplace, ราคาตลาด), Login, Register
- **Footer:** ข้อมูล Platform, ข้อกำหนด ToS, ช่องทางติดต่อ
- **Responsive:** Hamburger menu บน Mobile

### 2.2 UserLayout
- **ใช้กับ:** Buyer/Seller ที่ login แล้ว
- **Topbar:** Logo, Notification Bell (unread count badge), Avatar + Dropdown (Profile, Switch role, Logout)
- **Sidebar:** Navigation menu ตาม Role (แยก Buyer/Seller section)
- **Mobile:** Drawer sidebar แทน fixed sidebar

### 2.3 HandoverLayout
- **ใช้กับ:** หน้า Handover Room เท่านั้น
- **ออกแบบ:** Fullscreen, dark theme, ไม่มี sidebar ปกติ
- **Header:** Order number, Countdown Timer, Status badge
- **Security note:** แสดงข้อความ "ห้องนี้ถูกเข้ารหัส — ข้อมูลจะถูกลบหลัง Confirm"
- **ไม่มี Footer**

### 2.4 AdminLayout
- **ใช้กับ:** Admin และ Moderator
- **Sidebar:** Admin navigation (Dashboard, Users, Listings, Orders, Escrow, Disputes, KYC, Analytics, Settings)
- **Topbar:** ชื่อ Admin, Role badge, Notifications, Logout
- **Pending counters:** Badge บน menu items ที่รอดำเนินการ

---

## 3. Pages: Public & Guest

### P01 — Landing Page
| | |
|--|--|
| **URL** | `/` |
| **Layout** | PublicLayout |
| **Role** | 🔓 All |
| **API** | `GET /market/price-history`, `GET /listings?limit=6&sort=newest` |

**ข้อมูลที่แสดง:**
- Hero section — pitch ระบบ (Secure Marketplace, AI Valuation, Escrow)
- Featured Listings (6 ล่าสุด) พร้อม Value Badge
- ราคาตลาดเฉลี่ยปัจจุบัน (Market Snapshot)
- ขั้นตอนการซื้อขาย 4 ขั้น (How It Works)
- Call to Action: "เริ่มขาย" | "หา ID ที่ใช่"

**Actions:** ปุ่ม "สมัครสมาชิก", ปุ่ม "ดูตลาดทั้งหมด"

---

### P02 — Marketplace (Browse Listings)
| | |
|--|--|
| **URL** | `/marketplace` |
| **Layout** | PublicLayout |
| **Role** | 🔓 All |
| **API** | `GET /listings` |

**ข้อมูลที่แสดง:**
- Grid ของ Listing Cards:
  - รูป Squad preview
  - ชื่อ Listing, Platform icon (iOS/Android/PS)
  - ราคาขาย + Fair Price Range
  - Value-for-Money Badge (🟢🟡🔴)
  - Team Strength bar
  - นักเตะ Epic/Show Time สูงสุด 3 คน
  - สถานะ (Active/Reserved badge)
  - ยอดขายสำเร็จของ Seller

**Filter Sidebar/Panel:**
- ค้นหาชื่อนักเตะ (text search)
- ช่วงราคา (Range Slider)
- Team Strength ขั้นต่ำ (Slider)
- แพลตฟอร์ม (Checkboxes)
- Value Badge (Checkboxes)
- มีนักเตะ Epic/Show Time (Toggle)

**Sort:** ราคาต่ำสุด, ใหม่สุด, Team Strength สูงสุด

**Actions:**
- Guest: ปุ่ม "ซื้อ" → redirect ไป Login
- Buyer: ปุ่ม "ซื้อเลย"
- Pagination หรือ Infinite Scroll

---

### P03 — Listing Detail
| | |
|--|--|
| **URL** | `/marketplace/:id` |
| **Layout** | PublicLayout |
| **Role** | 🔓 All |
| **API** | `GET /listings/:id` |

**ข้อมูลที่แสดง:**
- Image gallery รูป Squad (Lightbox)
- ชื่อ Listing + คำอธิบาย
- Platform + Game
- ราคาขาย (ใหญ่ชัดเจน)
- Fair Price Range + อธิบาย Badge
- Team Strength (ตัวเลข + Bar)
- รายชื่อนักเตะ Rare ครบ (Epic, Show Time, Big Time) พร้อม Tier badge สี
- ข้อมูล Seller (display name, ยอดขายสำเร็จ, Verified badge ถ้ามี)
- สถานะปัจจุบัน (ACTIVE / RESERVED / SOLD)
- วันที่ลงประกาศ

**Actions:**
- ACTIVE + Buyer: ปุ่ม "ซื้อเลย" (Primary CTA)
- RESERVED: แสดง "ถูกจองแล้ว" (disabled)
- SOLD: แสดง "ขายแล้ว" (disabled)
- Guest: ปุ่ม "Login เพื่อซื้อ"
- ปุ่ม "แชร์ Listing"

---

### P04 — Login
| | |
|--|--|
| **URL** | `/login` |
| **Layout** | PublicLayout (centered card) |
| **Role** | 🔓 Guest |
| **API** | `POST /auth/login` |

**Form:** Email, Password, ปุ่ม Login
**Links:** ลืมรหัสผ่าน, ยังไม่มีบัญชี → Register

---

### P05 — Register
| | |
|--|--|
| **URL** | `/register` |
| **Layout** | PublicLayout (centered card) |
| **Role** | 🔓 Guest |
| **API** | `POST /auth/register` |

**Form:** Email, Password, Confirm Password, Display Name, Role (BUYER/SELLER)
**Note:** User สามารถมีได้ทั้ง 2 roles — แนะนำให้ลงทะเบียน SELLER แล้วใช้เป็น BUYER ได้ด้วย

---

### P06 — Forgot / Reset Password
| | |
|--|--|
| **URL** | `/forgot-password`, `/reset-password` |
| **Layout** | PublicLayout (centered card) |
| **Role** | 🔓 Guest |
| **API** | `POST /auth/forgot-password`, `POST /auth/reset-password` |

---

---

## 4. Pages: Buyer (UserLayout)

### B01 — Buyer Dashboard
| | |
|--|--|
| **URL** | `/dashboard` |
| **Layout** | UserLayout |
| **Role** | 🔐 B, S |
| **API** | `GET /dashboard/buyer` |

**ข้อมูลที่แสดง:**
- Summary Cards: Active Orders, Completed Orders, Open Disputes
- Active Orders list (Order number, Listing name, สถานะ, Action ที่ต้องทำ)
- Quick actions: "ดูตลาด", "ดูประวัติการซื้อ"

**Highlights:** Order ที่รอ Buyer ยืนยัน → ไฮไลต์สีเหลือง + ปุ่ม "ดำเนินการ"

---

### B02 — My Orders (Buyer)
| | |
|--|--|
| **URL** | `/orders` |
| **Layout** | UserLayout |
| **Role** | 🔐 B, S |
| **API** | `GET /orders/me?as=buyer` |

**ข้อมูลที่แสดง:**
- Table: Order number, Listing, ราคา, วันที่, สถานะ, Actions
- Filter tabs: ทั้งหมด / รอดำเนินการ / สำเร็จ / Dispute / ยกเลิก

---

### B03 — Order Detail (Buyer)
| | |
|--|--|
| **URL** | `/orders/:id` |
| **Layout** | UserLayout |
| **Role** | 🔐 B (เฉพาะ Order ตัวเอง) |
| **API** | `GET /orders/:id`, `GET /orders/:id/payment` |

**ข้อมูลที่แสดง:**
- Order info: หมายเลข, วันที่, ราคา, ค่า Fee, Listing ที่ซื้อ
- Seller display name
- Payment status + สลิปที่แนบ
- Escrow status timeline (Step tracker)
- สถานะปัจจุบัน + คำอธิบาย

**Step Tracker (Timeline):**
```
✅ สร้าง Order → ✅ ชำระเงิน → ✅ Escrow Hold → 🔄 Handover → ⬜ สำเร็จ
```

**Actions (ตาม status):**
- `CREATED`: ปุ่ม "แนบหลักฐานชำระเงิน" | ปุ่ม "ยกเลิก Order"
- `PAYMENT_SUBMITTED`: แสดง "รอ Moderator ยืนยัน..."
- `HANDOVER_OPEN` / `HANDOVER_INFO_PROVIDED`: ปุ่ม "เข้าห้องรับบัญชี" (highlight)
- `DISPUTED`: แสดง Dispute case link

---

### B04 — Payment Submission
| | |
|--|--|
| **URL** | `/orders/:id/payment` |
| **Layout** | UserLayout |
| **Role** | 🔐 B |
| **API** | `POST /orders/:id/payment` |

**Form:**
- ช่องทางชำระเงิน (Radio: PromptPay, Bank Transfer)
- ข้อมูลบัญชีปลายทาง (แสดง Platform account — static)
- Dropzone: อัปโหลดสลิป (image only, max 5MB)
- เลขอ้างอิงธนาคาร (optional)
- ปุ่ม "ยืนยันชำระแล้ว"

---

### B05 — Handover Room (Buyer View)
| | |
|--|--|
| **URL** | `/handover/:order_id` |
| **Layout** | HandoverLayout |
| **Role** | 🔐 B (เฉพาะ Order ตัวเอง) |
| **API** | `GET /handover/:order_id`, `GET /handover/:order_id/info`, `POST /handover/:order_id/confirm`, `POST /handover/:order_id/problem` |

**ข้อมูลที่แสดง:**
- Header: Order number, Countdown timer (เวลาที่เหลือก่อน auto-release)
- สถานะห้อง: WAITING_SELLER / INFO_PROVIDED / BUYER_REVIEWING
- เมื่อ INFO_PROVIDED: แสดงปุ่ม "ดูข้อมูลบัญชี" (ต้อง click confirm เพื่อ decrypt)
- ข้อมูลบัญชีที่ได้รับ (หลัง decrypt):
  - Konami Email
  - Konami Password
  - คำแนะนำการเปลี่ยน Password
- Security notice: "เปลี่ยน Email และ Password ทันทีหลังรับบัญชี"

**Actions:**
- ปุ่ม "✅ ยืนยันรับบัญชีสำเร็จ" (Primary — confirm modal ก่อน)
- ปุ่ม "❌ พบปัญหา / เปิด Dispute" (Secondary — dialog ยืนยัน)

**Layout Details:**
- Dark theme, full screen
- แสดง Listing thumbnail ด้านบน
- Countdown timer สีแดงถ้าเหลือน้อยกว่า 6 ชั่วโมง

---

### B06 — Open Dispute
| | |
|--|--|
| **URL** | `/disputes/new?order_id=:id` |
| **Layout** | UserLayout |
| **Role** | 🔐 B |
| **API** | `POST /disputes`, `POST /disputes/:id/evidence`, `GET /disputes/reasons` |

**Form:**
- สาเหตุ Dispute (Select จาก dispute_reasons)
- คำอธิบายรายละเอียด (Textarea, required)
- Dropzone หลักฐาน (รูป, สูงสุด 5 ไฟล์)
- ปุ่ม "ส่งเรื่องร้องเรียน"

---

### B07 — Dispute Detail (Buyer)
| | |
|--|--|
| **URL** | `/disputes/:id` |
| **Layout** | UserLayout |
| **Role** | 🔐 B, S (เฉพาะที่เกี่ยวข้อง) |
| **API** | `GET /disputes/:id` |

**ข้อมูลที่แสดง:**
- Dispute status (OPEN / UNDER_REVIEW / RESOLVED)
- Order ที่เกี่ยวข้อง
- สาเหตุ + คำอธิบายของ Buyer
- หลักฐานที่แนบ
- ผลการตัดสิน (ถ้า Resolved)
- SLA deadline

---

---

## 5. Pages: Seller (UserLayout)

### S01 — Seller Dashboard
| | |
|--|--|
| **URL** | `/seller/dashboard` |
| **Layout** | UserLayout |
| **Role** | 🔐 S |
| **API** | `GET /dashboard/seller` |

**ข้อมูลที่แสดง:**
- Summary Cards: Active Listings, Pending Orders (รอส่งมอบ), ยอดขายสะสม, รอ Payout
- Active Listings list + สถานะ
- Pending Escrow: Order ที่รอ Seller ส่งข้อมูลในห้อง Handover
- KYC status banner (ถ้ายังไม่ verified)

**Actions:** "สร้าง Listing ใหม่", "เข้าห้อง Handover"

---

### S02 — My Listings (Seller)
| | |
|--|--|
| **URL** | `/seller/listings` |
| **Layout** | UserLayout |
| **Role** | 🔐 S |
| **API** | `GET /listings/me` |

**ข้อมูลที่แสดง:**
- Table: ชื่อ Listing, ราคา, สถานะ, Team Strength, วันที่, Actions
- Filter tabs: ทั้งหมด / Active / Reserved / Sold / Cancelled / Suspended

**Actions per row:**
- ACTIVE: Edit, Cancel
- RESERVED: เข้าห้อง Handover
- SUSPENDED: แสดงเหตุผล, ติดต่อ Admin

---

### S03 — Create Listing (with AI Scanner)
| | |
|--|--|
| **URL** | `/seller/listings/new` |
| **Layout** | UserLayout |
| **Role** | 🔐 S |
| **API** | `POST /scans`, `GET /scans/:id`, `GET /scans/:id/valuation`, `POST /listings` |

**Step-by-step Wizard (3 ขั้นตอน):**

**ขั้นตอน 1 — อัปโหลดรูป Squad:**
- Dropzone ขนาดใหญ่ (drag & drop หรือ browse)
- รองรับ: JPG, PNG, WebP, สูงสุด 10 รูป, 10MB/รูป
- Preview รูปที่เลือก (Grid with remove button)
- ปุ่ม "เริ่มสแกน AI" → POST /scans → polling

**ขั้นตอน 2 — ตรวจสอบผล AI + Valuation:**
- Loading animation ระหว่าง Scan
- แสดงผล:
  - Team Strength (ตัวเลขใหญ่ + progress bar)
  - รายชื่อนักเตะที่ AI ตรวจพบ (Table: ชื่อ, Tier, ตำแหน่ง, Confidence %)
  - Fair Price Range: ฿X,XXX – ฿X,XXX
- Editable table (แก้ไขชื่อ/ลบนักเตะที่ AI อ่านผิด)
- ปุ่ม "ยืนยันผลสแกน"

**ขั้นตอน 3 — กรอกรายละเอียดและตั้งราคา:**
- ชื่อประกาศ (pre-filled จาก AI)
- แพลตฟอร์ม (iOS / Android / PlayStation)
- ราคาขาย (Number input พร้อม Fair Price hint)
  - แสดง Badge ที่จะได้รับ แบบ real-time (🟢🟡🔴)
- คำอธิบายเพิ่มเติม (Textarea)
- ค่าธรรมเนียม Platform (แสดงให้เห็น)
- ปุ่ม "เผยแพร่ประกาศ"

---

### S04 — Edit Listing
| | |
|--|--|
| **URL** | `/seller/listings/:id/edit` |
| **Layout** | UserLayout |
| **Role** | 🔐 S (เฉพาะ ACTIVE listings) |
| **API** | `PATCH /listings/:id` |

**Form:** ชื่อประกาศ, ราคาขาย (พร้อม Badge preview), คำอธิบาย
**หมายเหตุ:** ไม่สามารถเปลี่ยน Platform หรือ Scan หลัง publish

---

### S05 — Seller Orders
| | |
|--|--|
| **URL** | `/seller/orders` |
| **Layout** | UserLayout |
| **Role** | 🔐 S |
| **API** | `GET /orders/me?as=seller` |

**Table:** Order number, Buyer (display name), ราคา, สถานะ, วันที่, Actions
**Priority:** Order ที่รอ Seller ส่งข้อมูลใน Handover จะอยู่บนสุด + สีเหลือง

---

### S06 — Handover Room (Seller View)
| | |
|--|--|
| **URL** | `/handover/:order_id` |
| **Layout** | HandoverLayout |
| **Role** | 🔐 S (เฉพาะ Order ตัวเอง) |
| **API** | `GET /handover/:order_id`, `POST /handover/:order_id/submit` |

**ข้อมูลที่แสดง:**
- Header: Order number, Countdown timer, สถานะห้อง
- Listing ที่ขาย (thumbnail + ราคา)
- Buyer display name

**Actions:**
- ถ้า WAITING_SELLER: แสดงฟอร์มส่งข้อมูล:
  - Konami Email (required)
  - Konami Password (required, toggle show/hide)
  - คำแนะนำเพิ่มเติม (Textarea)
  - ปุ่ม "ส่งข้อมูลบัญชี" (Modal ยืนยัน)
- ถ้า INFO_PROVIDED: แสดง "รอ Buyer ตรวจสอบ..." + countdown
- ถ้า CONFIRMED: แสดง "✅ สำเร็จ! เงินถูกปล่อยแล้ว"

**Security notice:** "ข้อมูลที่ส่งจะถูกเข้ารหัส และลบโดยอัตโนมัติหลัง Buyer ยืนยัน"

---

### S07 — KYC Submission
| | |
|--|--|
| **URL** | `/seller/kyc` |
| **Layout** | UserLayout |
| **Role** | 🔐 S |
| **API** | `POST /users/me/kyc`, `GET /users/me/kyc` |

**ข้อมูลที่แสดง (ถ้ายังไม่ submit):**
- อธิบายประโยชน์ KYC (Verified Badge, ยอด Listing สูงขึ้น)
- Form:
  - ชื่อจริง-นามสกุล
  - เลขบัตรประชาชน (masked input)
  - Dropzone: รูปบัตรประชาชน
  - Dropzone: รูป Selfie กับบัตร

**ถ้า submit แล้ว:** แสดงสถานะ (PENDING / APPROVED / REJECTED + เหตุผล)

---

### S08 — Payout History (Seller)
| | |
|--|--|
| **URL** | `/seller/payouts` |
| **Layout** | UserLayout |
| **Role** | 🔐 S |
| **API** | `GET /payouts/me`, `GET /users/me/wallet` |

**ข้อมูลที่แสดง:**
- Wallet Summary: ยอดรอรับ, ยอดรับแล้วทั้งหมด
- Table: Order, จำนวน, ค่า Fee, ยอดสุทธิ, วันที่, สถานะ (PENDING/PAID)

---

---

## 6. Pages: Shared (Buyer & Seller)

### U01 — Profile Settings
| | |
|--|--|
| **URL** | `/profile` |
| **Layout** | UserLayout |
| **Role** | 🔐 * |
| **API** | `GET /users/me`, `PATCH /users/me`, `PATCH /users/me/password` |

**Tabs:** โปรไฟล์, เปลี่ยนรหัสผ่าน
**Form:** display_name, phone, line_id

---

### U02 — Notifications
| | |
|--|--|
| **URL** | `/notifications` |
| **Layout** | UserLayout |
| **Role** | 🔐 * |
| **API** | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` |

**ข้อมูลที่แสดง:**
- List Notifications (icon ตาม type, message, วันที่, is_read)
- ปุ่ม "อ่านทั้งหมด"
- Click notification → navigate ไป reference page

---

---

## 7. Pages: Admin & Moderator (AdminLayout)

### A01 — Admin Dashboard
| | |
|--|--|
| **URL** | `/admin` |
| **Layout** | AdminLayout |
| **Role** | 🔐 A, M |
| **API** | `GET /admin/dashboard`, `GET /admin/dashboard/pending-actions` |

**ข้อมูลที่แสดง:**
- Stat Cards: Active Listings, Pending Payments, Open Disputes, Pending KYC, Revenue Today, Revenue MTD
- Priority Queue:
  - 🔴 Payments รอ verify (sorted by submitted_at ASC)
  - 🟡 Disputes รอตัดสิน (sorted by sla_deadline ASC)
  - 🟢 KYC รอ review

---

### A02 — User Management
| | |
|--|--|
| **URL** | `/admin/users` |
| **Layout** | AdminLayout |
| **Role** | 🔐 A |
| **API** | `GET /admin/users` |

**Table:** ID, Email, Display name, Role, Verified, Suspended, วันที่สมัคร, Actions
**Filter:** Role, Status, Search by email/name

**Actions:** ดูรายละเอียด, Suspend, Unsuspend, Ban, เปลี่ยน Role

---

### A03 — User Detail (Admin)
| | |
|--|--|
| **URL** | `/admin/users/:id` |
| **Layout** | AdminLayout |
| **Role** | 🔐 A, M |
| **API** | `GET /admin/users/:id` |

**ข้อมูลที่แสดง:** Profile, KYC status, Listing history, Order history, Dispute history, Suspend/Ban log

---

### A04 — KYC Review
| | |
|--|--|
| **URL** | `/admin/kyc` |
| **Layout** | AdminLayout |
| **Role** | 🔐 A |
| **API** | `GET /admin/kyc?status=PENDING` |

**Table:** User, ชื่อ, ประเภทเอกสาร, วันที่ submit, สถานะ, Actions
**Action:** "Review" → A05

---

### A05 — KYC Detail Review
| | |
|--|--|
| **URL** | `/admin/kyc/:id` |
| **Layout** | AdminLayout |
| **Role** | 🔐 A |
| **API** | `GET /admin/kyc/:id`, `POST /admin/kyc/:id/approve`, `POST /admin/kyc/:id/reject` |

**ข้อมูลที่แสดง:**
- ข้อมูล User (email, display_name)
- ชื่อจริง (Decrypted)
- เลขบัตรประชาชน (Decrypted)
- รูปบัตรประชาชน (Signed URL, opens in modal)
- รูป Selfie กับบัตร

**Actions:** ปุ่ม "Approve KYC", ปุ่ม "Reject" (กรอกเหตุผล)

---

### A06 — Listing Management (Admin)
| | |
|--|--|
| **URL** | `/admin/listings` |
| **Layout** | AdminLayout |
| **Role** | 🔐 A, M |
| **API** | `GET /admin/listings` |

**Table:** Listing ID, ชื่อ, Seller, ราคา, สถานะ, วันที่, Actions (Suspend/Restore/Delete)
**Filter:** Status, Seller ID, Platform

---

### A07 — Order Management (Admin)
| | |
|--|--|
| **URL** | `/admin/orders` |
| **Layout** | AdminLayout |
| **Role** | 🔐 A, M |
| **API** | `GET /admin/orders` |

**Table:** Order number, Buyer, Seller, ราคา, สถานะ, วันที่, Actions
**Highlight:** Row สีเหลือง = PAYMENT_SUBMITTED รอ verify
**Filter tabs:** ทั้งหมด / รอ verify Payment / Handover active / Disputed

---

### A08 — Order Detail (Admin)
| | |
|--|--|
| **URL** | `/admin/orders/:id` |
| **Layout** | AdminLayout |
| **Role** | 🔐 A, M |
| **API** | `GET /admin/orders/:id` |

**ข้อมูลที่แสดง:**
- Order info + Listing + Buyer + Seller
- Payment: สลิปโอนเงิน (รูปใหญ่), ช่องทาง, เลขอ้างอิง
- Escrow: สถานะ, จำนวน, Fee breakdown
- Timeline: Order status log
- Handover status (ถ้า open)
- Dispute (ถ้ามี)

**Actions (Moderator):**
- PAYMENT_SUBMITTED: ปุ่ม "✅ Approve Payment" | "❌ Reject" (กรอกเหตุผล)
- DISPUTED: ลิงก์ไป Dispute Detail

---

### A09 — Escrow Management
| | |
|--|--|
| **URL** | `/admin/escrow` |
| **Layout** | AdminLayout |
| **Role** | 🔐 A, M |
| **API** | `GET /admin/escrow` |

**ข้อมูลที่แสดง:**
- Summary: ยอด HELD, RELEASED, REFUNDED รวม
- Table: Order, Buyer, Seller, Amount, Fee, Status, Action date

---

### A10 — Dispute Management
| | |
|--|--|
| **URL** | `/admin/disputes` |
| **Layout** | AdminLayout |
| **Role** | 🔐 A, M |
| **API** | `GET /admin/disputes` |

**Table:** Dispute ID, Order, Buyer, Seller, สาเหตุ, สถานะ, SLA deadline, Assigned to
**Highlight:** Row สีแดง = SLA เหลือ < 12 ชม.
**Filter:** OPEN / UNDER_REVIEW / RESOLVED + Assigned to me

---

### A11 — Dispute Detail (Admin)
| | |
|--|--|
| **URL** | `/admin/disputes/:id` |
| **Layout** | AdminLayout |
| **Role** | 🔐 A, M |
| **API** | `GET /admin/disputes/:id`, `POST /admin/disputes/:id/resolve/seller`, `POST /admin/disputes/:id/resolve/buyer` |

**Layout สองคอลัมน์:**

**คอลัมน์ซ้าย (Context):**
- Order summary (Listing, ราคา, วันที่)
- Escrow summary
- สลิปโอนเงิน
- Handover access logs

**คอลัมน์ขวา (Dispute Case):**
- สาเหตุ + คำอธิบาย Buyer
- หลักฐาน (รูปภาพ gallery)
- Comments timeline (internal + public)
- ฟอร์มเพิ่ม Comment

**Actions:**
- "📋 รับเคสนี้" (Assign to self)
- "✅ ตัดสิน: Seller ชนะ" (modal ยืนยัน + resolution note)
- "↩️ ตัดสิน: Buyer ชนะ — คืนเงิน" (modal ยืนยัน)

---

### A12 — Analytics
| | |
|--|--|
| **URL** | `/admin/analytics` |
| **Layout** | AdminLayout |
| **Role** | 🔐 A |
| **API** | `GET /admin/analytics/sales`, `GET /admin/analytics/prices`, `GET /admin/analytics/disputes` |

**Charts:**
- Line chart: ยอดขายรายวัน/สัปดาห์/เดือน
- Bar chart: Platform breakdown
- Line chart: แนวโน้มราคาเฉลี่ย vs Fair Price
- Pie chart: Dispute resolution (Seller win / Buyer win)
- Table: Top 10 Listings ที่ขายเร็วที่สุด

---

### A13 — Audit Logs
| | |
|--|--|
| **URL** | `/admin/audit-logs` |
| **Layout** | AdminLayout |
| **Role** | 🔐 A |
| **API** | `GET /admin/audit-logs` |

**Table:** วันที่, Actor (Admin), Action, Target, IP
**Filter:** Action type, Actor, วันที่
**Click row:** แสดง before/after JSON diff

---

### A14 — Platform Settings
| | |
|--|--|
| **URL** | `/admin/settings` |
| **Layout** | AdminLayout |
| **Role** | 🔐 A |
| **API** | `GET /admin/platform-settings`, `PATCH /admin/platform-settings/:key` |

**Form fields:**
- ค่าธรรมเนียม Platform (%) — slider + input
- Payment deadline (ชม.)
- Handover timeout (ชม.)
- Buyer confirm deadline (ชม.)
- Auto-release (ชม.)
- Dispute SLA (ชม.)
- Badge thresholds (% สำหรับ 🟢🟡🔴)

**หมายเหตุ:** ทุกการแก้ไขถูก log ใน audit_logs

---

### A15 — Player Card Management (Admin)
| | |
|--|--|
| **URL** | `/admin/players` |
| **Layout** | AdminLayout |
| **Role** | 🔐 A |
| **API** | `GET /players`, `POST /admin/players`, `PATCH /admin/players/:id` |

**Table + Form:** ค้นหา, เพิ่ม/แก้ไข Card, Import CSV

---

### A16 — Payout Management (Admin)
| | |
|--|--|
| **URL** | `/admin/payouts` |
| **Layout** | AdminLayout |
| **Role** | 🔐 A, M |
| **API** | `GET /admin/payouts`, `POST /admin/payouts/:id/process` |

**Table:** Seller, Order, ยอด, Fee, ยอดสุทธิ, สถานะ, วันที่ Request
**Action:** ปุ่ม "บันทึกการโอน" → กรอก bank reference + แนบสลิปการโอน

---

---

## 8. React Router Structure

```jsx
<Routes>
  {/* Public Routes */}
  <Route element={<PublicLayout />}>
    <Route path="/" element={<LandingPage />} />
    <Route path="/marketplace" element={<MarketplacePage />} />
    <Route path="/marketplace/:id" element={<ListingDetailPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/verify-email" element={<VerifyEmailPage />} />
  </Route>

  {/* User Routes (Buyer + Seller) */}
  <Route element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
    <Route path="/dashboard" element={<BuyerDashboardPage />} />
    <Route path="/orders" element={<MyOrdersPage />} />
    <Route path="/orders/:id" element={<OrderDetailPage />} />
    <Route path="/orders/:id/payment" element={<PaymentSubmitPage />} />
    <Route path="/disputes/new" element={<OpenDisputePage />} />
    <Route path="/disputes/:id" element={<DisputeDetailPage />} />
    <Route path="/notifications" element={<NotificationsPage />} />
    <Route path="/profile" element={<ProfilePage />} />

    {/* Seller Routes */}
    <Route path="/seller/dashboard" element={<SellerDashboardPage />} />
    <Route path="/seller/listings" element={<MyListingsPage />} />
    <Route path="/seller/listings/new" element={<CreateListingPage />} />
    <Route path="/seller/listings/:id/edit" element={<EditListingPage />} />
    <Route path="/seller/orders" element={<SellerOrdersPage />} />
    <Route path="/seller/kyc" element={<KYCPage />} />
    <Route path="/seller/payouts" element={<PayoutsPage />} />
  </Route>

  {/* Handover Room (Special Layout) */}
  <Route element={<ProtectedRoute><HandoverLayout /></ProtectedRoute>}>
    <Route path="/handover/:order_id" element={<HandoverRoomPage />} />
  </Route>

  {/* Admin Routes */}
  <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
    <Route path="/admin" element={<AdminDashboardPage />} />
    <Route path="/admin/users" element={<UserManagementPage />} />
    <Route path="/admin/users/:id" element={<UserDetailPage />} />
    <Route path="/admin/kyc" element={<KYCReviewPage />} />
    <Route path="/admin/kyc/:id" element={<KYCDetailPage />} />
    <Route path="/admin/listings" element={<AdminListingsPage />} />
    <Route path="/admin/orders" element={<AdminOrdersPage />} />
    <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
    <Route path="/admin/escrow" element={<EscrowManagementPage />} />
    <Route path="/admin/disputes" element={<DisputeManagementPage />} />
    <Route path="/admin/disputes/:id" element={<DisputeDetailAdminPage />} />
    <Route path="/admin/payouts" element={<PayoutManagementPage />} />
    <Route path="/admin/players" element={<PlayerManagementPage />} />
    <Route path="/admin/analytics" element={<AnalyticsPage />} />
    <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
    <Route path="/admin/settings" element={<PlatformSettingsPage />} />
  </Route>

  {/* 404 */}
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

---

## 9. Page Summary Table

| # | Page | URL | Role | Priority |
|---|------|-----|------|---------|
| P01 | Landing Page | `/` | All | P0 |
| P02 | Marketplace | `/marketplace` | All | P0 |
| P03 | Listing Detail | `/marketplace/:id` | All | P0 |
| P04 | Login | `/login` | Guest | P0 |
| P05 | Register | `/register` | Guest | P0 |
| P06 | Forgot/Reset Password | `/forgot-password`, `/reset-password` | Guest | P1 |
| B01 | Buyer Dashboard | `/dashboard` | B,S | P0 |
| B02 | My Orders | `/orders` | B,S | P0 |
| B03 | Order Detail | `/orders/:id` | B | P0 |
| B04 | Payment Submit | `/orders/:id/payment` | B | P0 |
| B05 | Handover Room (Buyer) | `/handover/:order_id` | B | P0 |
| B06 | Open Dispute | `/disputes/new` | B | P0 |
| B07 | Dispute Detail | `/disputes/:id` | B,S | P1 |
| S01 | Seller Dashboard | `/seller/dashboard` | S | P0 |
| S02 | My Listings | `/seller/listings` | S | P0 |
| S03 | Create Listing + AI Scanner | `/seller/listings/new` | S | P0 |
| S04 | Edit Listing | `/seller/listings/:id/edit` | S | P1 |
| S05 | Seller Orders | `/seller/orders` | S | P0 |
| S06 | Handover Room (Seller) | `/handover/:order_id` | S | P0 |
| S07 | KYC Submission | `/seller/kyc` | S | P1 |
| S08 | Payout History | `/seller/payouts` | S | P1 |
| U01 | Profile Settings | `/profile` | * | P1 |
| U02 | Notifications | `/notifications` | * | P1 |
| A01 | Admin Dashboard | `/admin` | A,M | P0 |
| A02 | User Management | `/admin/users` | A | P1 |
| A03 | User Detail | `/admin/users/:id` | A,M | P1 |
| A04 | KYC Review List | `/admin/kyc` | A | P1 |
| A05 | KYC Detail | `/admin/kyc/:id` | A | P1 |
| A06 | Listing Management | `/admin/listings` | A,M | P1 |
| A07 | Order Management | `/admin/orders` | A,M | P0 |
| A08 | Order Detail (Admin) | `/admin/orders/:id` | A,M | P0 |
| A09 | Escrow Management | `/admin/escrow` | A,M | P1 |
| A10 | Dispute Management | `/admin/disputes` | A,M | P0 |
| A11 | Dispute Detail (Admin) | `/admin/disputes/:id` | A,M | P0 |
| A12 | Analytics | `/admin/analytics` | A | P2 |
| A13 | Audit Logs | `/admin/audit-logs` | A | P2 |
| A14 | Platform Settings | `/admin/settings` | A | P1 |
| A15 | Player Management | `/admin/players` | A | P2 |
| A16 | Payout Management | `/admin/payouts` | A,M | P1 |

**Total: 37 Pages**

---

*Planning Step 7 of 11 — ยังไม่มี Code ใดๆ*

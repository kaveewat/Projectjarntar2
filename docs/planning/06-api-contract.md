# 06 — API Contract

**Project:** eFootball Smart Marketplace & AI Valuation System
**Document Type:** REST API Design
**Status:** Draft
**Reference:** `01–05 planning docs`
**Last Updated:** 2026-09-20

---

## 1. API Conventions

### Base URL
```
Development:  http://localhost:5001/api/v1
Production:   https://api.efootball-market.com/api/v1
```

### Standard Response Envelope

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "OK",
  "meta": { "page": 1, "limit": 20, "total": 150 }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "ข้อมูลไม่ถูกต้อง",
    "details": [{ "field": "email", "message": "รูปแบบ email ไม่ถูกต้อง" }]
  }
}
```

### HTTP Status Codes

| Status | ใช้เมื่อ |
|--------|--------|
| `200` | สำเร็จ (GET, PATCH, PUT) |
| `201` | สร้างสำเร็จ (POST) |
| `204` | สำเร็จไม่มี body (DELETE) |
| `400` | ข้อมูล request ผิด / Validation error |
| `401` | ไม่ได้ authenticate |
| `403` | ไม่มีสิทธิ์ |
| `404` | ไม่พบ resource |
| `409` | ข้อมูล conflict (เช่น email ซ้ำ) |
| `422` | Business logic error (เช่น Listing ถูก Reserved แล้ว) |
| `429` | Rate limit exceeded |
| `500` | Server error |

### Authentication

| Symbol | ความหมาย |
|--------|---------|
| 🔓 | Public — ไม่ต้อง token |
| 🔐 | Required — ต้อง JWT Bearer token ใน Header |

```
Authorization: Bearer <token>
```

### Roles

| Code | Role |
|------|------|
| `A` | ADMIN |
| `M` | MODERATOR |
| `S` | SELLER |
| `B` | BUYER |
| `*` | ทุก Role ที่ Authenticated |

---

## Module 1: Auth

**Base path:** `/api/v1/auth`

| Method | Endpoint | Description | Auth | Role | Request Body | Response | หมายเหตุ |
|--------|---------|------------|:----:|------|------------|---------|---------|
| `POST` | `/register` | สมัครสมาชิก | 🔓 | — | `{ email, password, display_name, role }` | `{ user, token }` | role รับได้แค่ `SELLER` หรือ `BUYER` |
| `POST` | `/login` | เข้าสู่ระบบ | 🔓 | — | `{ email, password }` | `{ access_token, refresh_token, user }` | JWT expire 7d |
| `POST` | `/logout` | ออกจากระบบ | 🔐 | `*` | — | `{ message }` | Blacklist token (ถ้ามี) |
| `POST` | `/refresh` | ขอ Access Token ใหม่ | 🔓 | — | `{ refresh_token }` | `{ access_token }` | |
| `GET` | `/verify-email/:token` | Verify email หลังสมัคร | 🔓 | — | — | `{ message }` | Token จาก email |
| `POST` | `/forgot-password` | ขอ reset password | 🔓 | — | `{ email }` | `{ message }` | ส่ง email |
| `POST` | `/reset-password` | Reset password | 🔓 | — | `{ token, new_password }` | `{ message }` | |
| `GET` | `/me` | ดูข้อมูลตัวเองจาก token | 🔐 | `*` | — | `{ user }` | Shortcut ดู profile |

---

## Module 2: Users & KYC

**Base path:** `/api/v1/users`, `/api/v1/admin/users`

### User Profile

| Method | Endpoint | Description | Auth | Role | Request Body | Response | หมายเหตุ |
|--------|---------|------------|:----:|------|------------|---------|---------|
| `GET` | `/users/me` | ดูโปรไฟล์ตัวเอง | 🔐 | `*` | — | `{ user }` | |
| `PATCH` | `/users/me` | แก้ไขโปรไฟล์ | 🔐 | `*` | `{ display_name, phone, line_id }` | `{ user }` | ห้ามเปลี่ยน email, role |
| `PATCH` | `/users/me/password` | เปลี่ยน password | 🔐 | `*` | `{ current_password, new_password }` | `{ message }` | |

### KYC (Seller Verification)

| Method | Endpoint | Description | Auth | Role | Request Body | Response | หมายเหตุ |
|--------|---------|------------|:----:|------|------------|---------|---------|
| `POST` | `/users/me/kyc` | ส่งเอกสาร KYC | 🔐 | `S` | `{ real_name, id_card_number, id_card_image (file), selfie_image (file) }` | `{ kyc }` | Multipart form |
| `GET` | `/users/me/kyc` | ดูสถานะ KYC ตัวเอง | 🔐 | `S` | — | `{ kyc }` | |

### Admin: User Management

| Method | Endpoint | Description | Auth | Role | Request Body | Response | หมายเหตุ |
|--------|---------|------------|:----:|------|------------|---------|---------|
| `GET` | `/admin/users` | List all users | 🔐 | `A` | — | `{ users[], meta }` | Query: `?role=&is_suspended=&search=` |
| `GET` | `/admin/users/:id` | ดู User detail | 🔐 | `A,M` | — | `{ user }` | |
| `PATCH` | `/admin/users/:id/suspend` | Suspend user | 🔐 | `A` | `{ reason }` | `{ user }` | |
| `PATCH` | `/admin/users/:id/unsuspend` | Unsuspend user | 🔐 | `A` | — | `{ user }` | |
| `PATCH` | `/admin/users/:id/ban` | Ban user ถาวร | 🔐 | `A` | `{ reason }` | `{ user }` | |
| `PATCH` | `/admin/users/:id/role` | เปลี่ยน Role | 🔐 | `A` | `{ role }` | `{ user }` | เฉพาะ ADMIN เท่านั้น |

### Admin: KYC Management

| Method | Endpoint | Description | Auth | Role | Request Body | Response | หมายเหตุ |
|--------|---------|------------|:----:|------|------------|---------|---------|
| `GET` | `/admin/kyc` | List KYC pending | 🔐 | `A` | — | `{ kyc_list[], meta }` | Query: `?status=PENDING` |
| `GET` | `/admin/kyc/:id` | KYC detail | 🔐 | `A` | — | `{ kyc }` | รวม signed URL รูปบัตร |
| `POST` | `/admin/kyc/:id/approve` | Approve KYC | 🔐 | `A` | — | `{ kyc }` | เปลี่ยน user.is_verified = true |
| `POST` | `/admin/kyc/:id/reject` | Reject KYC | 🔐 | `A` | `{ reason }` | `{ kyc }` | |

---

## Module 3: Player Master Data

**Base path:** `/api/v1/players`

| Method | Endpoint | Description | Auth | Role | Request Body | Response | หมายเหตุ |
|--------|---------|------------|:----:|------|------------|---------|---------|
| `GET` | `/players` | List player cards | 🔓 | — | — | `{ players[], meta }` | Query: `?name=&tier=&position=&game_id=&page=&limit=` |
| `GET` | `/players/:id` | Player card detail | 🔓 | — | — | `{ player }` | |
| `GET` | `/players/tiers` | List card tiers | 🔓 | — | — | `{ tiers[] }` | |
| `GET` | `/players/positions` | List positions | 🔓 | — | — | `{ positions[] }` | |
| `GET` | `/players/games` | List games | 🔓 | — | — | `{ games[] }` | |
| `POST` | `/admin/players` | สร้าง Player card | 🔐 | `A` | `{ player_name, card_tier_id, position_id, nationality, club, overall_rating, base_value, game_id, season }` | `{ player }` | |
| `PATCH` | `/admin/players/:id` | แก้ไข Player card | 🔐 | `A` | (any field) | `{ player }` | |
| `PATCH` | `/admin/players/:id/deactivate` | ปิดการ์ด | 🔐 | `A` | — | `{ player }` | is_active = false |
| `POST` | `/admin/players/import` | Import หลายการ์ดพร้อมกัน | 🔐 | `A` | `{ players[] }` หรือ CSV file | `{ imported_count, errors[] }` | Bulk import |

---

## Module 4: AI Squad Scanner & Valuation

**Base path:** `/api/v1/scans`

| Method | Endpoint | Description | Auth | Role | Request Body | Response | หมายเหตุ |
|--------|---------|------------|:----:|------|------------|---------|---------|
| `POST` | `/scans` | ส่งรูปเพื่อ AI Scan | 🔐 | `S` | `images[] (files), game_id` | `{ scan_id, status: "PROCESSING" }` | Multipart, สูงสุด 10 รูป, 10MB/รูป |
| `GET` | `/scans/:id` | ดูผล Scan | 🔐 | `S` | — | `{ scan, players[], team_strength }` | Poll จนกว่า status = COMPLETED |
| `PATCH` | `/scans/:id/confirm` | Seller ยืนยัน/แก้ไข Scan result | 🔐 | `S` | `{ confirmed_players[], team_strength }` | `{ scan }` | ก่อน publish listing |
| `GET` | `/scans/:id/valuation` | ดูผล Valuation | 🔐 | `S` | — | `{ valuation: { fair_price_min, fair_price_max, badge, algorithm_version } }` | |
| `GET` | `/scans/me` | ดูประวัติ Scan ตัวเอง | 🔐 | `S` | — | `{ scans[], meta }` | |

> [!NOTE]
> Scan เป็น async operation — client ต้อง poll `GET /scans/:id` ทุก 3 วินาที
> หรือใช้ Server-Sent Events (ถ้า implement ใน Phase ถัดไป)

---

## Module 5: Listings

**Base path:** `/api/v1/listings`

### Public Marketplace

| Method | Endpoint | Description | Auth | Role | Request Body | Response | หมายเหตุ |
|--------|---------|------------|:----:|------|------------|---------|---------|
| `GET` | `/listings` | Browse marketplace | 🔓 | — | — | `{ listings[], meta }` | Query: `?player_name=&min_price=&max_price=&min_strength=&badge=&platform_id=&game_id=&sort=price_asc&page=&limit=` |
| `GET` | `/listings/:id` | Listing detail | 🔓 | — | — | `{ listing, players[], valuation, seller_stats }` | แสดง display_name ของ Seller |

### Seller: Listing Management

| Method | Endpoint | Description | Auth | Role | Request Body | Response | หมายเหตุ |
|--------|---------|------------|:----:|------|------------|---------|---------|
| `POST` | `/listings` | สร้าง Listing | 🔐 | `S` | `{ squad_scan_id, platform_id, title, description, asking_price, game_id }` | `{ listing }` | ต้องมี scan ที่ COMPLETED แล้ว |
| `GET` | `/listings/me` | My listings | 🔐 | `S` | — | `{ listings[], meta }` | Query: `?status=` |
| `PATCH` | `/listings/:id` | แก้ไข Listing | 🔐 | `S` | `{ title, description, asking_price }` | `{ listing }` | เฉพาะ ACTIVE status |
| `DELETE` | `/listings/:id` | ยกเลิก Listing | 🔐 | `S` | — | `{ listing }` | เฉพาะ ACTIVE status → CANCELLED |

### Admin: Listing Moderation

| Method | Endpoint | Description | Auth | Role | Request Body | Response | หมายเหตุ |
|--------|---------|------------|:----:|------|------------|---------|---------|
| `GET` | `/admin/listings` | All listings | 🔐 | `A,M` | — | `{ listings[], meta }` | Query: `?status=&seller_id=` |
| `PATCH` | `/admin/listings/:id/suspend` | Suspend Listing | 🔐 | `A,M` | `{ reason }` | `{ listing }` | |
| `PATCH` | `/admin/listings/:id/restore` | Restore Listing | 🔐 | `A` | — | `{ listing }` | SUSPENDED → ACTIVE |
| `DELETE` | `/admin/listings/:id` | Delete Listing | 🔐 | `A` | `{ reason }` | `{ message }` | Soft delete |

---

## Module 6: Escrow Orders & Payments

**Base path:** `/api/v1/orders`

### Buyer: Order Management

| Method | Endpoint | Description | Auth | Role | Request Body | Response | หมายเหตุ |
|--------|---------|------------|:----:|------|------------|---------|---------|
| `POST` | `/orders` | สร้าง Order (ซื้อ) | 🔐 | `B,S` | `{ listing_id }` | `{ order }` | ห้ามซื้อ listing ตัวเอง |
| `GET` | `/orders/me` | My orders | 🔐 | `*` | — | `{ orders[], meta }` | Query: `?as=buyer&as=seller&status=` |
| `GET` | `/orders/:id` | Order detail | 🔐 | `*` | — | `{ order, escrow, payment }` | เฉพาะ Buyer หรือ Seller ของ order |
| `POST` | `/orders/:id/cancel` | ยกเลิก Order | 🔐 | `B` | — | `{ order }` | เฉพาะ CREATED/PENDING_PAYMENT |

### Buyer: Payment Submission

| Method | Endpoint | Description | Auth | Role | Request Body | Response | หมายเหตุ |
|--------|---------|------------|:----:|------|------------|---------|---------|
| `POST` | `/orders/:id/payment` | แนบสลิปโอนเงิน | 🔐 | `B,S` | `{ payment_proof (file), payment_method, bank_reference? }` | `{ payment }` | Multipart |
| `GET` | `/orders/:id/payment` | ดูสถานะ Payment | 🔐 | `*` | — | `{ payment }` | |

### Moderator: Payment Verification & Escrow

| Method | Endpoint | Description | Auth | Role | Request Body | Response | หมายเหตุ |
|--------|---------|------------|:----:|------|------------|---------|---------|
| `GET` | `/admin/orders` | All orders | 🔐 | `A,M` | — | `{ orders[], meta }` | Query: `?status=PAYMENT_SUBMITTED` |
| `GET` | `/admin/orders/:id` | Order detail (Admin) | 🔐 | `A,M` | — | `{ order, payment, escrow, listing }` | รวม payment proof URL |
| `POST` | `/admin/orders/:id/payment/approve` | Approve Payment | 🔐 | `A,M` | `{ note? }` | `{ order, escrow }` | Escrow → HELD, เปิด Handover |
| `POST` | `/admin/orders/:id/payment/reject` | Reject Payment | 🔐 | `A,M` | `{ reason }` | `{ order }` | Order → CANCELLED |
| `POST` | `/admin/orders/:id/cancel` | Admin cancel order | 🔐 | `A` | `{ reason }` | `{ order }` | Override cancel |
| `GET` | `/admin/escrow` | Escrow overview | 🔐 | `A,M` | — | `{ total_held, total_released, total_refunded, records[] }` | |

---

## Module 7: Secure Handover Room

**Base path:** `/api/v1/handover`

> [!IMPORTANT]
> ข้อมูลในห้อง Handover ถูก Decrypt เฉพาะเมื่อ BUYER หรือ SELLER ที่เป็นเจ้าของ Order request มา
> Admin เห็นเฉพาะ Audit Log ไม่เห็นเนื้อหาที่เข้ารหัส

| Method | Endpoint | Description | Auth | Role | Request Body | Response | หมายเหตุ |
|--------|---------|------------|:----:|------|------------|---------|---------|
| `GET` | `/handover/:order_id` | ดูสถานะห้อง Handover | 🔐 | `S,B,A,M` | — | `{ room: { status, expires_at, auto_release_at } }` | |
| `POST` | `/handover/:order_id/submit` | Seller ส่งข้อมูลบัญชี | 🔐 | `S` | `{ konami_email, konami_password, notes? }` | `{ room }` | Encrypt ก่อน store |
| `GET` | `/handover/:order_id/info` | Buyer ดูข้อมูลบัญชี | 🔐 | `B` | — | `{ konami_email, konami_password, notes }` | Decrypt ณ request + บันทึก access log |
| `POST` | `/handover/:order_id/confirm` | Buyer ยืนยันรับสำเร็จ | 🔐 | `B` | — | `{ order, escrow }` | Escrow → RELEASED |
| `POST` | `/handover/:order_id/problem` | Buyer แจ้งปัญหา | 🔐 | `B` | `{ dispute_reason_id, description }` | `{ dispute }` | Redirect ไป Dispute module |
| `GET` | `/admin/handover/:order_id/logs` | ดู Access Log (Admin) | 🔐 | `A,M` | — | `{ access_logs[] }` | ไม่เห็นเนื้อหา — เห็นแค่ who/when |

---

## Module 8: Dispute Resolution

**Base path:** `/api/v1/disputes`

### Buyer: Dispute Management

| Method | Endpoint | Description | Auth | Role | Request Body | Response | หมายเหตุ |
|--------|---------|------------|:----:|------|------------|---------|---------|
| `POST` | `/disputes` | เปิด Dispute | 🔐 | `B` | `{ order_id, dispute_reason_id, description }` | `{ dispute }` | Escrow → FROZEN |
| `GET` | `/disputes/me` | My disputes | 🔐 | `*` | — | `{ disputes[], meta }` | Buyer/Seller เห็นของตัวเอง |
| `GET` | `/disputes/:id` | Dispute detail | 🔐 | `*` | — | `{ dispute, evidence[], comments[] }` | เฉพาะที่เกี่ยวข้อง |
| `POST` | `/disputes/:id/evidence` | แนบหลักฐาน | 🔐 | `B` | `{ files[], description? }` | `{ evidence[] }` | Multipart, สูงสุด 5 ไฟล์ |
| `GET` | `/disputes/reasons` | รายการสาเหตุ Dispute | 🔓 | — | — | `{ reasons[] }` | |

### Admin/Moderator: Dispute Management

| Method | Endpoint | Description | Auth | Role | Request Body | Response | หมายเหตุ |
|--------|---------|------------|:----:|------|------------|---------|---------|
| `GET` | `/admin/disputes` | All disputes | 🔐 | `A,M` | — | `{ disputes[], meta }` | Query: `?status=OPEN&assigned_to=me` |
| `GET` | `/admin/disputes/:id` | Dispute detail (Admin) | 🔐 | `A,M` | — | `{ dispute, order, listing, payment, evidence[], comments[] }` | Full context |
| `POST` | `/admin/disputes/:id/assign` | รับเคส | 🔐 | `A,M` | `{ moderator_id? }` | `{ dispute }` | Assign ให้ตัวเองหรือคนอื่น |
| `POST` | `/admin/disputes/:id/comments` | เพิ่ม Comment | 🔐 | `A,M` | `{ message, is_internal }` | `{ comment }` | `is_internal` = Admin-only note |
| `POST` | `/admin/disputes/:id/resolve/seller` | ตัดสิน: Seller ชนะ | 🔐 | `A,M` | `{ resolution_note }` | `{ dispute, order, escrow }` | Escrow → RELEASED |
| `POST` | `/admin/disputes/:id/resolve/buyer` | ตัดสิน: Buyer ชนะ | 🔐 | `A,M` | `{ resolution_note }` | `{ dispute, order, escrow }` | Escrow → REFUNDED |

---

## Module 9: Payouts & Wallet

**Base path:** `/api/v1/payouts`

> [!NOTE]
> MVP: Payout เป็น Manual (Admin โอนเงินจริง แล้วมาบันทึกใน system)
> Future: เชื่อม Payment Gateway (PromptPay API, bank API)

| Method | Endpoint | Description | Auth | Role | Request Body | Response | หมายเหตุ |
|--------|---------|------------|:----:|------|------------|---------|---------|
| `GET` | `/payouts/me` | ประวัติ Payout ตัวเอง | 🔐 | `S` | — | `{ payouts[], summary: { pending, paid } }` | |
| `GET` | `/payouts/:id` | Payout detail | 🔐 | `S,A` | — | `{ payout }` | |
| `GET` | `/admin/payouts` | All payouts | 🔐 | `A,M` | — | `{ payouts[], meta }` | Query: `?status=PENDING` |
| `GET` | `/admin/payouts/summary` | สรุป Payout รวม | 🔐 | `A` | — | `{ total_pending, total_paid, platform_revenue }` | |
| `POST` | `/admin/payouts/:id/process` | บันทึกการโอนเงิน | 🔐 | `A` | `{ bank_reference, transfer_slip_url (file)?, note? }` | `{ payout }` | Mark as PAID |
| `GET` | `/users/me/wallet` | ดูยอดคงเหลือและสถานะ | 🔐 | `S` | — | `{ pending_amount, total_earned }` | Aggregated จาก escrow_records |

---

## Module 10: Notifications

**Base path:** `/api/v1/notifications`

| Method | Endpoint | Description | Auth | Role | Request Body | Response | หมายเหตุ |
|--------|---------|------------|:----:|------|------------|---------|---------|
| `GET` | `/notifications` | ดู Notifications | 🔐 | `*` | — | `{ notifications[], meta }` | Query: `?is_read=false&page=&limit=` |
| `GET` | `/notifications/unread-count` | จำนวน Unread | 🔐 | `*` | — | `{ count }` | Polling ทุก 30 วิ |
| `PATCH` | `/notifications/:id/read` | Mark as read | 🔐 | `*` | — | `{ notification }` | |
| `PATCH` | `/notifications/read-all` | Mark all as read | 🔐 | `*` | — | `{ updated_count }` | |
| `DELETE` | `/notifications/:id` | ลบ Notification | 🔐 | `*` | — | `{ message }` | |

### Notification Types Reference

| type | ผู้รับ | Trigger |
|------|-------|--------|
| `LISTING_ACTIVE` | Seller | Listing → ACTIVE |
| `ORDER_CREATED` | Seller | Buyer สร้าง Order |
| `PAYMENT_SUBMITTED` | Moderator | Buyer แนบสลิป |
| `PAYMENT_APPROVED` | Buyer + Seller | Moderator Approve |
| `HANDOVER_OPEN` | Seller + Buyer | ระบบเปิดห้อง |
| `SELLER_INFO_SUBMITTED` | Buyer | Seller ส่งข้อมูล |
| `SELLER_TIMEOUT_WARNING` | Seller | 24h, 48h ก่อน timeout |
| `BUYER_REVIEW_REMINDER` | Buyer | 24h, 36h, 47h ก่อน auto-release |
| `AUTO_RELEASE_TRIGGERED` | Seller + Buyer | Auto-release |
| `DISPUTE_OPENED` | Moderator + Seller | Buyer เปิด Dispute |
| `DISPUTE_RESOLVED` | Buyer + Seller | Admin ตัดสิน |
| `ESCROW_RELEASED` | Seller | เงินถูกปล่อย |
| `ESCROW_REFUNDED` | Buyer | เงินถูกคืน |
| `KYC_APPROVED` | Seller | Admin approve KYC |
| `KYC_REJECTED` | Seller | Admin reject KYC |

---

## Module 11: Dashboard & Market Analytics

**Base path:** `/api/v1/dashboard`, `/api/v1/admin/analytics`

### User Dashboards

| Method | Endpoint | Description | Auth | Role | Response | หมายเหตุ |
|--------|---------|------------|:----:|------|---------|---------|
| `GET` | `/dashboard/buyer` | Buyer Dashboard | 🔐 | `B,S` | `{ active_orders[], completed_orders_count, pending_disputes_count }` | |
| `GET` | `/dashboard/seller` | Seller Dashboard | 🔐 | `S` | `{ active_listings[], pending_orders[], total_earned, pending_payout, dispute_count }` | |

### Admin Dashboard

| Method | Endpoint | Description | Auth | Role | Response | หมายเหตุ |
|--------|---------|------------|:----:|------|---------|---------|
| `GET` | `/admin/dashboard` | Admin Overview | 🔐 | `A,M` | `{ total_active_listings, pending_payments, open_disputes, pending_kyc, revenue_today, revenue_mtd }` | |
| `GET` | `/admin/dashboard/pending-actions` | งานที่รอ Admin | 🔐 | `A,M` | `{ payments_pending[], disputes_open[], kyc_pending[] }` | Priority list |

### Market Analytics

| Method | Endpoint | Description | Auth | Role | Response | หมายเหตุ |
|--------|---------|------------|:----:|------|---------|---------|
| `GET` | `/admin/analytics/sales` | สรุปยอดขาย | 🔐 | `A` | `{ period, total_orders, total_volume, platform_revenue, avg_order_value }` | Query: `?from=&to=&group_by=day` |
| `GET` | `/admin/analytics/listings` | สถิติ Listing | 🔐 | `A,M` | `{ active, sold, cancelled, avg_time_to_sell }` | |
| `GET` | `/admin/analytics/disputes` | สถิติ Dispute | 🔐 | `A` | `{ total, open, resolved_seller, resolved_buyer, avg_resolution_hours }` | |
| `GET` | `/admin/analytics/prices` | แนวโน้มราคา | 🔐 | `A,M` | `{ price_trend[], avg_fair_price, avg_sold_price }` | Query: `?game_id=&platform_id=&from=&to=` |
| `GET` | `/market/price-history` | ประวัติราคาสาธารณะ | 🔓 | — | `{ avg_price_by_strength[], recent_sales[] }` | ไม่เปิดเผยข้อมูล User |
| `GET` | `/admin/analytics/ai-accuracy` | ประสิทธิภาพ AI | 🔐 | `A` | `{ scan_success_rate, avg_processing_time, valuation_accuracy }` | |

---

## Module 12: Audit & Security Logs

**Base path:** `/api/v1/admin`

> [!IMPORTANT]
> ทุก endpoint ใน module นี้เข้าถึงได้เฉพาะ ADMIN เท่านั้น
> Response ต้องไม่เปิดเผยเนื้อหาข้อมูลบัญชีเกม (encrypted content)

| Method | Endpoint | Description | Auth | Role | Response | หมายเหตุ |
|--------|---------|------------|:----:|------|---------|---------|
| `GET` | `/admin/audit-logs` | ดู Audit Log | 🔐 | `A` | `{ logs[], meta }` | Query: `?actor_id=&action=&target_type=&from=&to=` |
| `GET` | `/admin/audit-logs/:id` | Audit Log detail | 🔐 | `A` | `{ log }` | รวม before/after data |
| `GET` | `/admin/handover-access-logs` | Handover Access Log | 🔐 | `A` | `{ logs[], meta }` | Query: `?order_id=&user_id=&from=&to=` |
| `GET` | `/admin/order-status-logs` | Order status history | 🔐 | `A,M` | `{ logs[] }` | Query: `?order_id=` |
| `GET` | `/admin/escrow-status-logs` | Escrow history | 🔐 | `A` | `{ logs[] }` | Query: `?order_id=&escrow_id=` |
| `GET` | `/admin/platform-settings` | ดู Platform settings | 🔐 | `A` | `{ settings[] }` | |
| `PATCH` | `/admin/platform-settings/:key` | แก้ไข setting | 🔐 | `A` | `{ value }` | บันทึก audit log |

---

## 13. Error Codes Reference

| Code | HTTP | คำอธิบาย |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | ข้อมูล input ไม่ถูกต้อง |
| `UNAUTHORIZED` | 401 | ไม่ได้ login หรือ token หมดอายุ |
| `FORBIDDEN` | 403 | ไม่มีสิทธิ์ทำ action นี้ |
| `NOT_FOUND` | 404 | ไม่พบ resource |
| `LISTING_ALREADY_RESERVED` | 409 | Listing ถูกจองแล้ว |
| `EMAIL_ALREADY_EXISTS` | 409 | Email ซ้ำ |
| `CANNOT_BUY_OWN_LISTING` | 422 | ห้ามซื้อ Listing ตัวเอง |
| `LISTING_NOT_ACTIVE` | 422 | Listing ไม่ได้อยู่ในสถานะ Active |
| `ORDER_WRONG_STATUS` | 422 | Order อยู่ในสถานะที่ไม่อนุญาตให้ทำ action นี้ |
| `SCAN_NOT_COMPLETED` | 422 | Scan ยังไม่เสร็จ ไม่สามารถสร้าง Listing |
| `AI_SERVICE_UNAVAILABLE` | 503 | Vision API ไม่ตอบสนอง |
| `RATE_LIMIT_EXCEEDED` | 429 | เรียก API บ่อยเกินไป |

---

## 14. Rate Limiting

| Endpoint Group | Limit |
|---------------|-------|
| `POST /auth/login` | 10 req / 15 min per IP |
| `POST /scans` | 5 req / hour per user |
| `POST /orders` | 10 req / hour per user |
| `GET /listings` | 60 req / min per IP |
| Admin endpoints | 120 req / min per user |

---

*Planning Step 6 of 11 — ยังไม่มี Code ใดๆ*

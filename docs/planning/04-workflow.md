# 04 — Workflow & State Machine

**Project:** eFootball Smart Marketplace & AI Valuation System
**Document Type:** Workflow & Business Process Design
**Status:** Draft
**Reference:** `01-system-overview.md`, `02-requirements.md`, `03-roles-permissions.md`
**Last Updated:** 2026-09-20

---

## 1. ภาพรวม Workflow ทั้งระบบ

```
[SELLER]                        [SYSTEM / AI]                    [BUYER]
   │                                  │                              │
   ├─ 1. สร้าง Listing                │                              │
   ├─ 2. อัปโหลดรูป Squad ───────────►├─ 3. AI Vision Scan           │
   │                                  ├─ 4. Valuation Engine         │
   ├─ 5. Review & ตั้งราคา ◄──────────┤                              │
   ├─ 6. Publish Listing ────────────►├─ Active บน Marketplace ─────►│
   │                                  │                              ├─ 7. ค้นหา/กรอง
   │                                  │                              ├─ 8. กดซื้อ (Order)
   │◄── แจ้ง Reserved ───────────────◄├─ Listing → RESERVED ────────►│
   │                                  │                              ├─ 9. โอนเงิน + แนบสลิป
   │                         [MODERATOR]                             │
   │                                  ├─ 10. ตรวจสลิป               │
   │                                  ├─ 11. Approve Escrow          │
   │◄── แจ้งเปิดห้อง ────────────────◄├─ เปิด Handover Room ─────────►│
   ├─ 12. ส่งข้อมูลบัญชีในห้อง       │                              │
   │                                  │                              ├─ 13. ตรวจสอบบัญชี
   │                                  │                              ├─ 14a. ✅ ยืนยันรับ
   │◄── ปล่อยเงิน ──────────────────◄─┤─ COMPLETED ─────────────────►│
   │                                  │           OR                 │
   │                                  │                              ├─ 14b. ❌ พบปัญหา → Dispute
   │                         [MODERATOR]                             │
   │                                  ├─ 15. Admin ตรวจสอบ          │
   │                                  ├─ 16. ตัดสิน                 │
   │◄── ปล่อยเงิน / คืนเงิน ────────◄─┤─ Resolved ──────────────────►│
```

---

## 2. Listing State Machine

### States ทั้งหมด

| State | ชื่อ (TH) | คำอธิบาย |
|-------|---------|---------|
| `DRAFT` | ร่าง | เริ่มสร้างแต่ยังไม่ส่งรูปสแกน |
| `SCANNING` | กำลังสแกน | ส่งรูปให้ AI แล้ว รอผล |
| `SCAN_FAILED` | สแกนล้มเหลว | AI อ่านรูปไม่ได้ — ให้ผู้ขายอัปโหลดใหม่ |
| `PENDING_REVIEW` | รอผู้ขาย review | AI สแกนสำเร็จ — รอผู้ขาย review + ตั้งราคา |
| `ACTIVE` | เผยแพร่แล้ว | มองเห็นบน Marketplace ผู้ซื้อสามารถซื้อได้ |
| `RESERVED` | จองแล้ว | มีผู้ซื้อสร้าง Order แล้ว ล็อกรอการชำระ |
| `SOLD` | ขายแล้ว | Transaction สำเร็จ เงินถึงผู้ขาย |
| `CANCELLED` | ยกเลิก | ยกเลิกโดยผู้ขาย, ระบบ (timeout), หรือ Admin |
| `SUSPENDED` | ระงับ | Admin ระงับ — ผู้ขายต้องติดต่อ Admin |

### Listing State Diagram

```
                              ┌──────────────────────────────┐
                              │         LISTING STATES        │
                              └──────────────────────────────┘

[สร้าง Listing]
      │
      ▼
   DRAFT ──── อัปโหลดรูป ────► SCANNING
      │                            │
      │                     ┌──────┴───────┐
      │                  สำเร็จ         ล้มเหลว
      │                     │               │
      │                     ▼               ▼
      │             PENDING_REVIEW    SCAN_FAILED ──► [อัปโหลดใหม่] ──► SCANNING
      │                     │
      │              ผู้ขาย Review
      │              + ตั้งราคา
      │              + Publish
      │                     │
      │                     ▼
      │                  ACTIVE ◄──────────────────── [Admin un-suspend]
      │                  /  │  \
      │           Buyer ซื้อ  │  Admin suspend
      │                /    │    \
      │               ▼     │     ▼
      │          RESERVED   │  SUSPENDED
      │               │     │
      │        Payment ├─ Seller ยกเลิก (ก่อน payment approved)
      │        Approved │
      │               │
      │        Handover Complete
      │        + Buyer Confirmed
      │               │
      │               ▼
      │            SOLD
      │
      └── Seller ยกเลิก (ขณะ DRAFT/PENDING_REVIEW/ACTIVE) ──► CANCELLED
```

### Listing State Transitions

| From | Trigger | To | Actor |
|------|---------|---|-------|
| `DRAFT` | อัปโหลดรูปและ submit scan | `SCANNING` | SELLER |
| `SCANNING` | AI ประมวลผลสำเร็จ | `PENDING_REVIEW` | AI_SERVICE |
| `SCANNING` | AI ประมวลผลล้มเหลว | `SCAN_FAILED` | AI_SERVICE |
| `SCAN_FAILED` | อัปโหลดรูปใหม่ | `SCANNING` | SELLER |
| `PENDING_REVIEW` | ผู้ขาย confirm + Publish | `ACTIVE` | SELLER |
| `PENDING_REVIEW` | ผู้ขายยกเลิก | `CANCELLED` | SELLER |
| `ACTIVE` | Buyer สร้าง Order | `RESERVED` | SYSTEM |
| `ACTIVE` | Seller ยกเลิก | `CANCELLED` | SELLER |
| `ACTIVE` | Admin suspend | `SUSPENDED` | ADMIN/MODERATOR |
| `RESERVED` | Payment approved → ดำเนินต่อ | *(ไม่เปลี่ยน — รอ Order complete)* | — |
| `RESERVED` | Order cancelled (timeout/admin) | `ACTIVE` | SYSTEM/ADMIN |
| `RESERVED` | Transaction complete | `SOLD` | SYSTEM |
| `SUSPENDED` | Admin un-suspend | `ACTIVE` | ADMIN |
| `SUSPENDED` | Admin delete | `CANCELLED` | ADMIN |

---

## 3. Order & Transaction State Machine

### States ทั้งหมด

| State | ชื่อ (TH) | คำอธิบาย |
|-------|---------|---------|
| `CREATED` | สร้าง Order แล้ว | Buyer กดซื้อ ระบบสร้าง Order และ Lock Listing |
| `PENDING_PAYMENT` | รอชำระเงิน | รอ Buyer โอนเงินและแนบสลิป |
| `PAYMENT_SUBMITTED` | แนบสลิปแล้ว | รอ Moderator ตรวจสอบ |
| `PAYMENT_APPROVED` | อนุมัติการชำระ | Moderator ยืนยันรับเงิน — เงินอยู่ใน Escrow |
| `HANDOVER_OPEN` | ห้องส่งมอบเปิดแล้ว | ระบบเปิด Handover Room อัตโนมัติ |
| `HANDOVER_INFO_PROVIDED` | ส่งข้อมูลแล้ว | Seller ส่งข้อมูลบัญชีในห้อง — รอ Buyer ตรวจ |
| `BUYER_REVIEWING` | Buyer กำลังตรวจ | Buyer รับรู้ว่ามีข้อมูลแล้ว กำลังตรวจสอบ |
| `COMPLETED` | เสร็จสมบูรณ์ | Buyer ยืนยัน — เงินปล่อยให้ Seller |
| `AUTO_RELEASE_PENDING` | รอ Auto-Release | Buyer ไม่ยืนยันใน 24 ชม. — ระบบแจ้งเตือนก่อน auto |
| `DISPUTED` | มีข้อพิพาท | Buyer เปิด Dispute — เงินถูก Freeze |
| `DISPUTE_RESOLVED_SELLER` | Dispute: Seller ชนะ | Admin ตัดสินให้ Seller → เงินถูกปล่อย |
| `DISPUTE_RESOLVED_BUYER` | Dispute: Buyer ชนะ | Admin ตัดสินให้ Buyer → เงินถูกคืน |
| `REFUNDED` | คืนเงินแล้ว | Buyer ได้รับเงินคืน |
| `CANCELLED` | ยกเลิก | ยกเลิกก่อน payment approved |
| `EXPIRED` | หมดเวลา | ไม่มี action ตาม SLA |

### Order State Diagram

```
[Buyer กดซื้อ]
      │
      ▼
   CREATED
      │
      ├─ Buyer ไม่ชำระภายใน 2 ชม. ──────────────────────────────► EXPIRED
      │                                                               │
      ▼                                                         (Listing → ACTIVE)
 PENDING_PAYMENT
      │
      ├─ Buyer แนบสลิป
      │
      ▼
 PAYMENT_SUBMITTED
      │
      ├─ Moderator reject ──────────────────────────────────────► CANCELLED
      │                                                         (Listing → ACTIVE)
      ▼
 PAYMENT_APPROVED ─────── [เงินอยู่ใน Escrow] ──────────────────────────────┐
      │                                                                       │
      ▼                                                                       │
 HANDOVER_OPEN                                                                │
      │                                                                       │
      ├─ Seller ไม่ส่งข้อมูลภายใน 72 ชม. ──────────────────────► EXPIRED    │
      │                                                           (Refund)    │
      ▼                                                                       │
 HANDOVER_INFO_PROVIDED                                                       │
      │                                                                       │
      ├─ Buyer ตรวจสอบ                                                        │
      ▼                                                                       │
 BUYER_REVIEWING                                                               │
      │                                                                       │
      ├─ Buyer ยืนยันสำเร็จ ──────────────────────────────────► COMPLETED ◄──┘
      │                                                       (ปล่อยเงิน)
      ├─ Buyer ไม่กดใน 24 ชม. ──────► AUTO_RELEASE_PENDING
      │                                        │
      │                               แจ้งเตือน 3 ครั้ง
      │                               ครบ 48 ชม. ──────────────► COMPLETED
      │                                                        (Auto-Release)
      └─ Buyer กด "พบปัญหา" ─────────────────────────────────► DISPUTED
                                                                   │
                                                            Admin ตรวจสอบ
                                                                   │
                                              ┌────────────────────┤
                                          Seller ชนะ           Buyer ชนะ
                                              │                    │
                                              ▼                    ▼
                                 DISPUTE_RESOLVED_SELLER  DISPUTE_RESOLVED_BUYER
                                              │                    │
                                              ▼                    ▼
                                          COMPLETED            REFUNDED
                                       (ปล่อยเงิน)          (คืนเงิน)
```

### Order State Transitions

| From | Trigger | To | Actor | SLA |
|------|---------|---|-------|-----|
| `CREATED` | Buyer แนบสลิป | `PAYMENT_SUBMITTED` | BUYER | ภายใน 2 ชม. |
| `CREATED` | หมดเวลา 2 ชม. | `EXPIRED` | SYSTEM | Auto |
| `PAYMENT_SUBMITTED` | Moderator approve | `PAYMENT_APPROVED` | MODERATOR | ภายใน 4 ชม. |
| `PAYMENT_SUBMITTED` | Moderator reject | `CANCELLED` | MODERATOR | — |
| `PAYMENT_APPROVED` | ระบบเปิดห้องอัตโนมัติ | `HANDOVER_OPEN` | SYSTEM | ทันที |
| `HANDOVER_OPEN` | Seller ส่งข้อมูลในห้อง | `HANDOVER_INFO_PROVIDED` | SELLER | ภายใน 72 ชม. |
| `HANDOVER_OPEN` | หมดเวลา 72 ชม. | `EXPIRED` → Refund | SYSTEM | Auto |
| `HANDOVER_INFO_PROVIDED` | Buyer รับรู้ข้อมูล | `BUYER_REVIEWING` | BUYER | — |
| `BUYER_REVIEWING` | Buyer กด "ยืนยัน" | `COMPLETED` | BUYER | ภายใน 24 ชม. |
| `BUYER_REVIEWING` | Buyer กด "พบปัญหา" | `DISPUTED` | BUYER | — |
| `BUYER_REVIEWING` | ครบ 24 ชม. ไม่มี action | `AUTO_RELEASE_PENDING` | SYSTEM | Auto |
| `AUTO_RELEASE_PENDING` | ครบ 48 ชม. รวม | `COMPLETED` | SYSTEM | Auto |
| `DISPUTED` | Admin ตัดสินให้ Seller | `DISPUTE_RESOLVED_SELLER` → `COMPLETED` | ADMIN | ภายใน 48 ชม. |
| `DISPUTED` | Admin ตัดสินให้ Buyer | `DISPUTE_RESOLVED_BUYER` → `REFUNDED` | ADMIN | ภายใน 48 ชม. |

---

## 4. Step-by-Step Lifecycle (รายละเอียดทุกขั้นตอน)

### Phase A: Listing Creation

#### Step 1 — สร้าง Listing

```
Actor: SELLER
Action: กรอกข้อมูลเบื้องต้น (แพลตฟอร์ม, คำอธิบาย, เปิดหน้า Scanner)
Output: Listing ถูกสร้างในสถานะ DRAFT
```

#### Step 2 — อัปโหลดรูปภาพ Squad

```
Actor: SELLER
Action: อัปโหลดรูปหน้าจอ Squad (1–10 รูป)
       รองรับมุมมอง: Squad รวม, สำรอง, การ์ดรายตัว Epic/Show Time
Input: ไฟล์รูป JPG/PNG ขนาดสูงสุด 10MB ต่อรูป
Output: รูปถูก upload ไปที่ Storage, Listing → SCANNING
```

#### Step 3 — AI Vision Processing

```
Actor: AI_SERVICE (Backend เรียก Vision API)
Action:
  → ส่งรูปทั้งหมดไปยัง Multimodal LLM (Gemini Vision / GPT-4o)
  → Prompt: สกัดรายชื่อนักเตะระดับ Epic, Show Time, Big Time
            สกัดตำแหน่ง
            สกัดค่า Team Strength
  → รับ response เป็น JSON
  → บันทึก raw response ใน DB
Output: Scan Result: { players: [...], team_strength: 2450, raw_response: "..." }
SLA: ≤ 30 วินาที
```

**กรณีผิดปกติ (Step 3):**

| กรณี | การจัดการ |
|-----|---------|
| AI timeout (>30s) | Retry 1 ครั้ง → ถ้ายังล้มเหลว → `SCAN_FAILED` |
| รูปเบลอ/ไม่ชัด | AI ตอบกลับ confidence ต่ำ → `SCAN_FAILED` พร้อม message |
| AI ตอบผิดรูปแบบ | Parse error → `SCAN_FAILED` |
| Vision API Down | `SCAN_FAILED` + แจ้ง Seller ลองใหม่ภายหลัง |

#### Step 4 — AI Valuation

```
Actor: SYSTEM (Valuation Engine)
Action:
  → รับ Scan Result
  → Query ราคาขายจริงใน Price History จาก DB
  → คำนวณ: Fair Price = f(team_strength, rare_players_count, historical_prices)
  → กำหนด Fair Price Range: [min, max]
  → กำหนด Algorithm Version
Output: Valuation Record { fair_price_min, fair_price_max, algorithm_version }
```

#### Step 5 — Seller Review & Price Setting

```
Actor: SELLER
Action:
  → ดูผลลัพธ์ AI: รายชื่อนักเตะ, Team Strength, Fair Price Range
  → แก้ไขข้อมูลนักเตะ (ถ้า AI อ่านผิด)
  → กำหนดราคาขายจริง (อิสระ — ไม่บังคับตาม Fair Price)
  → กรอกคำอธิบายเพิ่มเติม
  → กด "เผยแพร่"
Output: Listing → PENDING_REVIEW → ACTIVE
```

#### Step 6 — Publish & Badge Calculation

```
Actor: SYSTEM
Action:
  → คำนวณ Value-for-Money Badge:
      ราคาขาย ≤ 85% ของ Fair Price → 🟢 คุ้มมาก
      85%–115% → 🟡 พอดี
      > 115% → 🔴 แพงเกิน
  → เผยแพร่ Listing บน Marketplace
Output: Listing ACTIVE พร้อม Badge + Fair Price Range
```

---

### Phase B: Purchase & Escrow

#### Step 7 — ค้นหาและดู Listing

```
Actor: BUYER
Action: ค้นหา/กรอง Listing ตามนักเตะ, ราคา, Badge, Platform
        ดูรายละเอียด: รูป Squad, นักเตะ Rare, Fair Price, Badge, ราคา
Output: Buyer ตัดสินใจซื้อ
```

#### Step 8 — สร้าง Order (กดซื้อ)

```
Actor: BUYER
Action: กด "ซื้อเลย" บน Listing
System:
  → ตรวจสอบ Listing ยัง ACTIVE หรือไม่ (อาจถูก Reserve โดยคนอื่น)
  → สร้าง Order ใหม่
  → เปลี่ยน Listing → RESERVED
  → แจ้ง Seller ว่ามีคนสั่งซื้อ
Output: Order ในสถานะ CREATED, Listing → RESERVED
SLA: Buyer ต้องชำระภายใน 2 ชั่วโมง
```

#### Step 9 — ชำระเงินและแนบสลิป

```
Actor: BUYER
Action:
  → โอนเงินตามจำนวน (ราคาขาย) ไปยังบัญชีรับเงินของ Platform
  → แนบรูปสลิปโอนเงิน
  → กด "ยืนยันชำระแล้ว"
Output: Order → PAYMENT_SUBMITTED
        แจ้ง Moderator ให้ตรวจสอบ
```

#### Step 10 — Moderator ตรวจสอบสลิป

```
Actor: MODERATOR
Action:
  → ตรวจสลิปเทียบกับบัญชีรับเงินจริง
  → ยืนยันว่าจำนวนเงินถูกต้อง
  → กด "Approve" หรือ "Reject"
SLA: ภายใน 4 ชั่วโมง (Business hours)
```

**กรณีผิดปกติ (Step 10):**

| กรณี | การจัดการ |
|-----|---------|
| สลิปปลอม/แก้ไข | Reject → Order `CANCELLED` → Listing → `ACTIVE` |
| จำนวนเงินไม่ตรง | Reject พร้อมระบุสาเหตุ |
| สลิปไม่ชัด | Request ให้ Buyer แนบใหม่ |
| ไม่มี Moderator (นอก Business Hours) | SLA extend อัตโนมัติ + แจ้ง Buyer |

#### Step 11 — Approve Escrow

```
Actor: MODERATOR
Action: กด Approve
System:
  → บันทึก Escrow Record (status: HELD)
  → เงิน "ถือ" ในระบบ
  → Order → PAYMENT_APPROVED
  → เปิด Handover Room อัตโนมัติ
  → แจ้งทั้ง Buyer และ Seller ว่าห้องเปิดแล้ว
Output: Order → HANDOVER_OPEN
```

---

### Phase C: Handover Room

#### Step 12 — Seller ส่งข้อมูลบัญชี

```
Actor: SELLER
Action:
  → เข้า Handover Room
  → กรอกข้อมูลบัญชี:
      - Email ของ Konami Account
      - Password ของ Konami Account
      - Platform (iOS / Android / PS)
      - คำแนะนำการเปลี่ยน Password
  → ติ๊กยืนยัน Checklist ความปลอดภัย:
      [x] ปลดการเชื่อมต่อ Game Center / Google Play จากไอดีเกมนี้แล้ว
      [x] ปลดการผูกบัญชี eFootball Point หรือยอมรับการส่งมอบบัญชีทั้งหมด
  → ข้อมูลถูก Encrypt (AES-256-GCM) ก่อนบันทึก
  → กด "ส่งข้อมูล"
Output: Order → HANDOVER_INFO_PROVIDED
        แจ้ง Buyer ว่าข้อมูลพร้อมแล้ว
SLA: ภายใน 72 ชั่วโมงหลังห้องเปิด
```

**กรณีผิดปกติ (Step 12):**

| กรณี | การจัดการ |
|-----|---------|
| Seller ไม่ส่งใน 24 ชม. | แจ้งเตือน Seller ครั้งที่ 1 |
| Seller ไม่ส่งใน 48 ชม. | แจ้งเตือน Seller ครั้งที่ 2 + แจ้ง Admin |
| Seller ไม่ส่งใน 72 ชม. | Auto-cancel → Refund → Listing → `ACTIVE` |

#### Step 13 — Konami ID Transfer & Verification

```
Actor: BUYER
Action:
  → เข้า Handover Room
  → ดูข้อมูลบัญชีที่ Seller ส่งมา (Decrypt ณ เวลาแสดง)
  → Login เข้า Konami Account ด้วย Email/Password ที่ได้รับ
  → ตรวจสอบ:
      ✅ นักเตะตรงตามที่ Listing ระบุ
      ✅ Team Strength ตรงกัน
      ✅ บัญชียังใช้งานได้
  → เปลี่ยน Password ทันที (สำคัญมาก)
  → เปลี่ยน Email เชื่อมต่อ Konami Account เป็นของตัวเอง
Output: Order → BUYER_REVIEWING
SLA: ควรทำภายใน 24 ชั่วโมง
```

#### Step 14a — ยืนยันรับสำเร็จ

```
Actor: BUYER
Action: กด "ยืนยันรับบัญชีสำเร็จ"
System:
  → Order → COMPLETED
  → Escrow Released → Seller ได้รับเงิน (หัก Fee)
  → ลบข้อมูลบัญชีใน Handover Room (Hard Delete)
  → Listing → SOLD
  → บันทึก Price History
  → แจ้ง Seller ว่าได้รับเงินแล้ว
Output: Transaction สำเร็จ
```

#### Step 14b — Buyer ไม่ยืนยันใน 24 ชั่วโมง (Auto-Release)

```
Actor: SYSTEM
Trigger: ครบ 24 ชั่วโมงหลัง HANDOVER_INFO_PROVIDED
Action:
  → ส่ง Notification แจ้ง Buyer 3 ครั้ง (24h, 36h, 47h)
  → ครบ 48 ชั่วโมง → Auto-Release
  → Order → COMPLETED (Auto)
  → เงินปล่อยให้ Seller
  → บันทึก log: "Auto-released after 48h timeout"
Rationale: ป้องกัน Buyer ไม่ยืนยัน เพื่อถือเงินไว้นาน
```

---

### Phase D: Dispute Resolution

#### Step 15 — Buyer เปิด Dispute

```
Actor: BUYER
Action:
  → กด "พบปัญหา / แจ้ง Dispute"
  → เลือกสาเหตุ:
      [ ] บัญชีไม่ตรงกับ Listing (นักเตะขาด/Team Strength ต่างกัน)
      [ ] ข้อมูลบัญชีไม่ถูกต้อง (Login ไม่ได้)
      [ ] บัญชีถูกดึงคืนหลังรับมอบ (Account Recovery)
      [ ] อื่นๆ (ระบุเอง)
  → แนบ Evidence: รูปหน้าจอ, คำอธิบาย
  → กด "ส่งเรื่อง"
System:
  → Order → DISPUTED
  → Escrow Freeze (ระงับการปล่อยเงิน)
  → แจ้ง Admin/Moderator
Output: Dispute Case สร้างแล้ว
```

#### Step 16 — Admin/Moderator ตรวจสอบเคส

```
Actor: ADMIN / MODERATOR
Action:
  → ดู Order History ทั้งหมด
  → ดูหลักฐาน: Listing detail, Squad scan, Escrow record
  → ดู Evidence ที่ Buyer แนบ
  → อาจขอ Evidence เพิ่มจาก Seller
  → ตัดสิน:
      Option A: ปล่อยเงินให้ Seller (Buyer แพ้)
      Option B: คืนเงินให้ Buyer (Seller แพ้)
      Option C: ปล่อยบางส่วน (กรณี partial — ถ้า implement)
SLA: ภายใน 48 ชั่วโมงหลังรับเคส
```

#### Step 17 — Dispute Resolution

**กรณี Seller ชนะ:**
```
System:
  → Order → DISPUTE_RESOLVED_SELLER → COMPLETED
  → Escrow Released → Seller ได้รับเงิน
  → แจ้ง Buyer ผลการตัดสิน
  → บันทึก Dispute log
```

**กรณี Buyer ชนะ:**
```
System:
  → Order → DISPUTE_RESOLVED_BUYER → REFUNDED
  → Escrow Refunded → Buyer ได้รับเงินคืน
  → Listing → ACTIVE (ถ้ายังขายได้) หรือ SUSPENDED (ถ้า Seller โกง)
  → แจ้ง Seller ผลการตัดสิน
  → บันทึก Dispute log
```

---

### Phase E: การยุติรายการและการลงโทษ

#### การยกเลิก Order (Cancellation)

| ใครยกเลิก | เงื่อนไข | ผลลัพธ์ |
|----------|--------|--------|
| BUYER | ก่อนแนบสลิป | Order `CANCELLED`, Listing → `ACTIVE` |
| BUYER | หลัง Payment Approved | ไม่สามารถยกเลิกเอง — ต้องเปิด Dispute |
| SELLER | ขณะ Listing `ACTIVE` | Listing → `CANCELLED` |
| SELLER | ขณะ `RESERVED` (ก่อน payment approved) | ต้องผ่าน Admin |
| SYSTEM | Timeout ต่างๆ | ตามเงื่อนไข SLA แต่ละขั้นตอน |
| ADMIN | ทุกกรณี | Admin override — ระบุเหตุผลและ log |

#### การ Refund เงิน

| กรณี | ผู้รับเงินคืน | เงื่อนไข |
|-----|------------|--------|
| Payment Rejected | BUYER | Moderator reject สลิป |
| Seller ไม่ส่งข้อมูลใน 72 ชม. | BUYER | Auto-cancel |
| Buyer กดยกเลิก (ก่อน payment approved) | BUYER | Manual cancel |
| Admin ตัดสิน Dispute ให้ Buyer | BUYER | Dispute resolution |

#### การ Suspend / Ban User

| กรณี | Action | Actor |
|-----|--------|-------|
| Seller ส่งข้อมูลบัญชีผิดซ้ำ ≥ 2 ครั้ง | Suspend Seller | ADMIN |
| Seller โกง (ตรวจสอบแล้วพิสูจน์ได้) | Ban + รายงาน | ADMIN |
| Buyer แนบสลิปปลอม | Suspend Buyer | ADMIN |
| Seller ดึงบัญชีคืน (Account Recovery) พิสูจน์ได้ | Ban Seller | ADMIN |
| Dispute แพ้ ≥ 3 ครั้ง (Seller) | Revoke Verified Badge | ADMIN |

---

## 5. Escrow State Machine

| State | คำอธิบาย | Trigger |
|-------|---------|--------|
| `NOT_CREATED` | ยังไม่มี Escrow | ก่อน Payment Approved |
| `HELD` | เงินถูกถือในระบบ | Moderator Approve Payment |
| `FROZEN` | Freeze ระหว่าง Dispute | Buyer เปิด Dispute |
| `RELEASED` | ปล่อยให้ Seller (หัก Fee) | Buyer ยืนยัน / Auto-Release / Dispute Seller Win |
| `REFUNDED` | คืนให้ Buyer | Timeout / Dispute Buyer Win / Cancel |

---

## 6. Handover Room State Machine

| State | คำอธิบาย |
|-------|---------|
| `WAITING_SELLER` | รอ Seller ส่งข้อมูล (หลัง Payment Approved) |
| `INFO_PROVIDED` | Seller ส่งข้อมูลแล้ว รอ Buyer |
| `BUYER_REVIEWING` | Buyer กำลังตรวจสอบ |
| `CONFIRMED` | Buyer ยืนยัน — ห้องปิด ข้อมูลถูกลบ |
| `DISPUTED` | Buyer เปิด Dispute |
| `EXPIRED_SELLER` | Seller ไม่ส่งใน 72 ชม. |
| `AUTO_RELEASED` | ระบบ Auto-Release หลัง 48 ชม. |

---

## 7. Edge Cases & Failure Handling Summary

| # | สถานการณ์ | การจัดการ |
|---|---------|---------|
| E1 | AI สแกนรูปไม่ชัด | `SCAN_FAILED` + แนะนำให้อัปโหลดรูปใหม่ที่ชัดกว่า |
| E2 | AI อ่านชื่อนักเตะผิด | ผู้ขายแก้ไขผล AI ได้ก่อน publish |
| E3 | Vision API Down | Retry 1 ครั้ง → `SCAN_FAILED` + Graceful message |
| E4 | Buyer กด "ซื้อ" พร้อมกัน 2 คน | Race condition — First request wins, คนที่ 2 ได้ error "ถูกจองแล้ว" |
| E5 | Buyer แนบสลิปปลอม | Moderator Reject → `CANCELLED` + Suspend Buyer (ถ้าทำซ้ำ) |
| E6 | Seller ไม่ส่งข้อมูลใน 72 ชม. | Auto-cancel → Refund → Listing → ACTIVE → แจ้ง Admin |
| E7 | ข้อมูลบัญชีที่ Seller ส่งผิด (Login ไม่ได้) | Buyer เปิด Dispute → Moderator ตัดสิน |
| E8 | บัญชีถูก Account Recovery | Buyer เปิด Dispute ประเภท "Account Recovery" → Admin พิจารณา → อาจ Ban Seller |
| E9 | Buyer ไม่ยืนยันใน 24 ชม. | แจ้งเตือน 3 ครั้ง → Auto-Release ที่ 48 ชม. |
| E10 | Admin ไม่ตัดสิน Dispute ใน 48 ชม. | Escalate ไปยัง SUPER_ADMIN + แจ้ง Buyer/Seller |
| E11 | Seller ยกเลิก Listing ที่ Reserved | ต้องผ่าน Admin — Admin ตัดสินว่าจะ Refund หรือ Force Complete |
| E12 | ระบบ Payment Manual ล่าช้า (Admin ยุ่ง) | Buyer แจ้งใน Dashboard, SLA extend พร้อม notification |
| E13 | Network error ระหว่าง Handover | ข้อมูลยังอยู่ใน DB (Encrypt) — Buyer/Seller เข้าห้องใหม่ได้ |

---

## 8. Notification Triggers

| Event | แจ้ง | Channel |
|-------|-----|--------|
| Listing → ACTIVE | Seller | In-app |
| Order สร้างแล้ว (Buyer ซื้อ) | Seller + Buyer | In-app |
| Payment Submitted | Moderator | In-app + Email |
| Payment Approved | Seller + Buyer | In-app |
| Handover Room เปิด | Seller + Buyer | In-app |
| Seller ส่งข้อมูลแล้ว | Buyer | In-app |
| ใกล้ครบ Seller Timeout (24h, 48h) | Seller | In-app |
| ใกล้ครบ Buyer Timeout (24h, 36h, 47h) | Buyer | In-app |
| Auto-Release triggered | Seller + Buyer | In-app |
| Dispute เปิดแล้ว | Moderator + Seller | In-app |
| Dispute ตัดสินแล้ว | Buyer + Seller | In-app |
| เงินถูกปล่อย / คืน | Seller / Buyer | In-app |

---

*Planning Step 4 of 11 — ยังไม่มี Code ใดๆ*

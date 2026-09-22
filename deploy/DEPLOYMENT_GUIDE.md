# คู่มือการ Deploy ระบบ: TiDB (Database) + Render (Backend) + Vercel (Frontend)

สถาปัตยกรรมระบบสำหรับ Production:
- **Database**: TiDB Cloud (Serverless Tier — รองรับ MySQL Protocol 100% ฟรี & Auto-scaling)
- **Backend API**: Render (Web Service — Node.js + Express)
- **Frontend**: Vercel (React 18 + Vite 5 SPA)

---

## ขั้นตอนที่ 1: เตรียม Database บน TiDB Cloud (Serverless)

TiDB Cloud Serverless เป็น MySQL-compatible cloud database ฟรี 5GB และรองรับ high availability อัตโนมัติ

### 1.1 สร้าง TiDB Cluster
1. ไปที่ [TiDB Cloud Console](https://tidbcloud.com/) แล้วเข้าสู่ระบบ (หรือ Sign up ฟรี)
2. คลิก **Create Cluster** เลือก **Serverless** (Free Tier)
3. เลือก Region ใกล้ไทยที่สุด เช่น `ap-southeast-1` (Singapore)
4. ตั้งชื่อ Cluster (เช่น `efootball-cluster`) แล้วกด **Create**

### 1.2 ดึงข้อมูลการเชื่อมต่อ (Connection Details)
1. ในหน้า Cluster คลิกปุ่ม **Connect**
2. เลือก Connection type: **General** หรือ **Node.js**
3. จดข้อมูลเหล่านี้ไว้สำหรับตั้งค่า Backend:
   - **Host**: เช่น `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`
   - **Port**: `4000`
   - **User**: เช่น `xxxx.root`
   - **Password**: รหัสผ่านที่สร้างขึ้น
   - **Database Name**: `efootball_db` (หรือสร้างชื่อตามต้องการ)

### 1.3 นำเข้าฐานข้อมูล (Import Data)
ทางเราได้ export ข้อมูล schema และนักเตะ 844 ใบตัวจริงพร้อมภาพไว้ให้แล้วที่:
📁 `deploy/efootball_tidb_init.sql`

**วิธีนำเข้า (เลือกวิธีใดวิธีหนึ่ง):**
- **วิธีที่ 1: ผ่าน TiDB Cloud SQL Editor (ในเบราว์เซอร์)**:
  1. ในหน้า TiDB Console คลิกแท็บ **SQL Editor**
  2. รันคำสั่งสร้างฐานข้อมูล:
     ```sql
     CREATE DATABASE IF NOT EXISTS efootball_db;
     USE efootball_db;
     ```
  3. ก๊อปปี้เนื้อหาในไฟล์ `deploy/efootball_tidb_init.sql` หรืออัปโหลดไฟล์เข้ามาแล้วกด **Run**
- **วิธีที่ 2: ผ่าน MySQL CLI จากเครื่องของคุณ**:
  ```bash
  mysql -u <TIDB_USER> -h <TIDB_HOST> -P 4000 -p --ssl-mode=VERIFY_IDENTITY < deploy/efootball_tidb_init.sql
  ```

---

## ขั้นตอนที่ 2: Deploy Backend บน Render

### 2.1 สร้าง Web Service บน Render
1. ไปที่ [Render Dashboard](https://dashboard.render.com/)
2. คลิก **New +** > **Web Service**
3. เลือก Git Repository ของโปรเจกต์นี้
4. ตั้งค่าในหน้า Configuration ดังนี้:
   - **Name**: `efootball-api` (หรือชื่อตามต้องการ)
   - **Region**: Singapore (Southeast Asia) เพื่อให้ใกล้กับ TiDB
   - **Branch**: `main` (หรือ branch ล่าสุดของคุณ)
   - **Root Directory**: `backend` *(สำคัญมาก)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
   - **Instance Type**: `Free` (หรือ Starter)

### 2.2 ตั้งค่า Environment Variables ใน Render
ในแท็บ **Environment** ของ Render ให้เพิ่มตัวแปรดังนี้:

| Key | Value | คำอธิบาย |
|---|---|---|
| `NODE_ENV` | `production` | โหมดรันระบบ |
| `PORT` | `10000` | Port ของ Render (Render จะ inject ให้อัตโนมัติด้วย) |
| `DB_HOST` | `<TIDB_HOST>` | เช่น `gateway01.ap-southeast-1.prod.aws.tidbcloud.com` |
| `DB_PORT` | `4000` | Port ของ TiDB |
| `DB_NAME` | `efootball_db` | ชื่อฐานข้อมูล |
| `DB_USER` | `<TIDB_USER>` | User จาก TiDB |
| `DB_PASSWORD` | `<TIDB_PASSWORD>` | Password จาก TiDB |
| `DB_SSL` | `true` | *(สำคัญมาก)* บังคับต่อ SSL เข้า TiDB |
| `JWT_SECRET` | `สร้างข้อความสุ่ม_ขั้นต่ำ_32_ตัวอักษร_เช่น_efootball_super_jwt_secret_key_prod_2026` | รหัส JWT |
| `REFRESH_TOKEN_SECRET` | `สร้างข้อความสุ่ม_ขั้นต่ำ_32_ตัวอักษร_เช่น_efootball_super_refresh_token_secret_2026` | รหัส Refresh Token |
| `CORS_ORIGIN` | `https://your-frontend-app.vercel.app` | URL โดเมนของ Vercel (ใส่หลัง deploy Vercel หรือใส่ `*` ชั่วคราว) |

5. กด **Deploy Web Service**
6. เมื่อ Deploy สำเร็จจะได้ URL เช่น: `https://efootball-api.onrender.com`
7. ทดสอบเรียกดู: `https://efootball-api.onrender.com/api/v1/health` ต้องได้ status `OK`

---

## ขั้นตอนที่ 3: Deploy Frontend บน Vercel

### 3.1 ตั้งค่าโปรเจกต์ใน Vercel
1. ไปที่ [Vercel Dashboard](https://vercel.com/)
2. คลิก **Add New...** > **Project**
3. เลือก Git Repository เดียวกัน
4. ในหน้า Configure Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: คลิก Edit แล้วเลือกโฟลเดอร์ `frontend` *(สำคัญมาก)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. ทางเราได้สร้างไฟล์ `frontend/vercel.json` ไว้ให้แล้ว เพื่อให้ระบบทำ SPA routing ทุกหน้า (เช่น `/marketplace`, `/seller/listings/new`) ได้อย่างถูกต้อง ไม่เจอ 404 เมื่อกด Refresh

### 3.2 ตั้งค่า Environment Variables ใน Vercel
ในหัวข้อ **Environment Variables** ให้เพิ่ม:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://efootball-api.onrender.com/api/v1` *(URL ของ Render ที่ได้จากขั้นตอนที่ 2)* |

6. คลิก **Deploy**
7. รอประมาณ 1-2 นาที เมื่อเสร็จจะได้ URL ใช้งาน เช่น: `https://efootball-marketplace.vercel.app`

---

## ขั้นตอนที่ 4: เชื่อมโยง CORS ให้สมบูรณ์

1. เมื่อได้ URL โดเมนจาก Vercel (เช่น `https://efootball-marketplace.vercel.app`)
2. กลับไปที่ **Render Dashboard** > Service `efootball-api` > แท็บ **Environment**
3. อัปเดตตัวแปร `CORS_ORIGIN`:
   ```text
   CORS_ORIGIN=https://efootball-marketplace.vercel.app
   ```
4. Render จะ Restart ให้อัตโนมัติ เพื่อให้ Frontend ส่ง request ข้ามโดเมนได้อย่างปลอดภัย 100%

---

## ข้อควรจำเพิ่มเติม (Production Notes)
- **Render Free Tier Spin-down**: บน Render Free Tier หากไม่มีทราฟฟิกเข้ามาเป็นเวลา 15 นาที ระบบจะ Sleep (Cold start) เมื่อมี request ใหม่จะใช้เวลาตื่นประมาณ 30-50 วินาที
- **รูปภาพที่อัปโหลดบน Render**: Free tier ของ Render จะเป็น Ephemeral storage (หาก service restart รูปที่เพิ่งอัปโหลดจะรีเซ็ต) หากต้องการเก็บถาวรในระยะยาว สามารถต่อ AWS S3, Cloudinary หรือ Supabase Storage ได้ง่ายๆ

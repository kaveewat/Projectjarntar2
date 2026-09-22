# docs/deployment/

โฟลเดอร์นี้เก็บเอกสารที่เกี่ยวกับการ Deploy ระบบขึ้น Production สร้างในช่วงที่ 3: Testing & Deployment

## Deployment Stack

| Layer | Platform |
|-------|---------|
| Database | TiDB Cloud (MySQL-compatible + SSL) |
| Backend | Render (Node.js service) |
| Frontend | Vercel (React + Vite) |

## ไฟล์ที่จะสร้างในช่วงที่ 3

| ไฟล์ | วัตถุประสงค์ |
|------|------------|
| `DEPLOYMENT.md` | ขั้นตอน deploy ขึ้น Render + Vercel + TiDB |
| `environment-variables.md` | รายการ env vars ที่ต้องตั้งใน Render และ Vercel |
| `BACKUP_RESTORE.md` | วิธี backup และ restore TiDB |
| `MONITORING_MAINTENANCE.md` | การ monitor Render logs และ Vercel analytics |
| `POST_DEPLOYMENT_CHECKLIST.md` | Checklist ก่อน go-live |

# 00 — AI Working Rules

**Project:** eFootball Smart Marketplace & Squad Valuation
**Document Type:** AI Workflow Governance
**Status:** Active
**Last Updated:** 2026-09-20

---

## วัตถุประสงค์

เอกสารนี้กำหนดกติกาและวิธีการทำงานของ AI ในทุก Phase ของโปรเจกต์
เพื่อให้การพัฒนาเป็นระบบ ไม่ข้าม Phase ไม่เพิ่ม Feature นอกแผน และไม่เปลี่ยน Architecture โดยไม่ได้รับอนุญาต

---

## 1. General AI Rules

- AI ต้องทำงานตาม Prompt และ Planning docs เท่านั้น ห้ามสมมติ requirement เพิ่มเอง
- AI ต้องอ่านเอกสาร planning ที่เกี่ยวข้องก่อนเริ่มทุก Phase
- AI ต้องแจ้งให้ชัดเจนว่ากำลังทำงานใน Phase ไหน และงานอยู่ในขอบเขตหรือไม่
- เมื่อไม่แน่ใจใน requirement ต้องถามก่อน ห้ามเดาและลงมือทำ
- ห้ามเสนอ "alternative approach" ที่เปลี่ยน Tech Stack หรือ Architecture โดยไม่ถูกถาม
- AI ต้องทบทวนงานของตัวเองก่อนส่งผล — ตรวจ logic, typo, missing fields

---

## 2. Planning Rules

- ต้องทำ Planning ให้เสร็จก่อนเขียน Code ทุกครั้ง
- Planning ต้องประกอบด้วย: วัตถุประสงค์, Scope, API/DB/UI ที่จะสร้าง, Acceptance Criteria
- ต้องเสนอ Planning doc ให้ผู้ใช้ approve ก่อน ห้ามเริ่ม Implementation เอง
- Planning doc ต้องระบุขอบเขตชัดเจนว่า "ทำอะไร" และ "ไม่ทำอะไร" ใน Phase นี้
- ถ้าพบว่า requirement ขัดแย้งกัน หรือ ambiguous ต้องหยุดและถามก่อน

---

## 3. Implementation Rules

- ห้ามเริ่ม Implementation ก่อนได้รับ approve จากผู้ใช้ในขั้น Planning
- Implementation ต้องทำตาม Planning doc ที่ approved แล้วเท่านั้น
- ถ้าระหว่างทำพบว่าต้องเปลี่ยนแผน ต้องหยุดและแจ้งผู้ใช้ก่อน ห้ามเปลี่ยนเอง
- ต้องแจ้งให้ชัดเจนว่าไฟล์ไหนถูกสร้างใหม่ ไฟล์ไหนถูกแก้ไข ไฟล์ไหนถูกลบ
- เมื่อ Implementation เสร็จต้องทำ Phase Completion Report ทุกครั้ง

---

## 4. Phase Control Rules

- AI ต้องทำงานทีละ Phase เท่านั้น ห้ามข้าม Phase
- แต่ละ Phase ต้องมี: วิธีรัน, วิธีทดสอบ, Acceptance Criteria, Recommended Git Commit
- ห้ามเริ่ม Phase ถัดไปก่อนที่ Phase ปัจจุบันจะผ่าน Acceptance Criteria
- ถ้าผู้ใช้สั่งให้ข้าม Phase ต้องแจ้งความเสี่ยงก่อน แล้วจึงทำตาม
- Phase Completion Report ต้องออกหลังจบทุก Phase

**Phase ของโปรเจกต์:**

| Phase | ชื่อ | สถานะ |
|-------|-----|------|
| 0 | Tech Stack & AI Rules | กำลังดำเนินการ |
| 1 | Database Schema & Init Script | รอดำเนินการ |
| 2 | Backend Foundation (Auth, Config, Middleware) | รอดำเนินการ |
| 3 | Backend Features (Players, Squads, Marketplace) | รอดำเนินการ |
| 4 | Frontend Foundation (Theme, Auth, Routing) | รอดำเนินการ |
| 5 | Frontend Features (Players, Squads, Marketplace) | รอดำเนินการ |
| 6 | Integration & End-to-End Testing | รอดำเนินการ |
| 7 | Production Build & Railway Deploy | รอดำเนินการ |

---

## 5. Code Generation Rules

- **ห้ามเขียน Code ก่อน Planning เสร็จและได้รับ approve**
- ห้ามเพิ่ม Feature ที่ไม่อยู่ใน scope ของ Phase นั้น
- ห้ามเปลี่ยน Tech Stack โดยไม่ได้รับอนุญาต
- ห้ามเปลี่ยน Database Schema, API Contract หรือ Project Structure โดยไม่มีเหตุผล
- Code ต้องสอดคล้องกับ Tech Stack ที่กำหนด:
  - Frontend: React 18 + Vite 5 + MUI 5
  - Backend: Node.js 20 LTS + Express 4
  - Database: MySQL 8 + mysql2
- ตัวแปรและฟังก์ชันต้องมีชื่อที่สื่อความหมาย ภาษาอังกฤษ
- ทุกไฟล์ที่สร้างหรือแก้ไขต้องแจ้งใน output ด้วย

---

## 6. Debugging Rules

- ต้องระบุ error message หรือ stack trace ที่แน่ชัดก่อนเสนอ solution
- ต้องอธิบายสาเหตุของ bug ก่อนแก้ไข ห้าม guess แล้ว trial-and-error
- ถ้า bug เกิดจากการที่ architecture หรือ assumption เดิมผิด ต้องแจ้งผู้ใช้ก่อน ไม่ใช่แก้เงียบ
- ห้ามเปลี่ยน scope ของ Phase เพื่อแก้ bug — ให้แก้เฉพาะจุดที่เป็นปัญหา
- หลังแก้ bug ต้องบอกวิธีทดสอบว่าแก้ได้จริง

---

## 7. Documentation Rules

- ทุก Phase ต้องมี planning doc ใน `docs/planning/` ก่อนเริ่ม implementation
- หลังจบ Phase ต้องมี Phase Completion Report สรุปสิ่งที่ทำ, ผลการทดสอบ, และ commit ที่แนะนำ
- ห้ามลบหรือแก้ไข planning doc ที่ approved แล้ว โดยไม่แจ้งผู้ใช้
- README.md ต้องอัปเดตเมื่อ port, command, dependency หรือ workflow เปลี่ยน
- comment ใน code ต้องเขียนเป็นภาษาอังกฤษ กระชับ และอธิบาย "ทำไม" ไม่ใช่แค่ "ทำอะไร"

---

## 8. Testing Rules

- ทุก Phase ต้องมี Acceptance Criteria ที่วัดได้ชัดเจน
- Acceptance Criteria ต้องครอบคลุม: happy path, edge case สำคัญ, และ error handling
- ต้องระบุวิธีทดสอบ — ไม่ว่าจะเป็น manual (curl/Postman) หรือ automated
- ห้ามประกาศว่า Phase ผ่านถ้า Acceptance Criteria ยังไม่ครบ
- หากยังไม่มี automated test ต้องระบุ test command แบบ manual ให้ชัดเจน

---

## 9. Git Commit Rules

- ใช้ **Conventional Commits** เสมอ:
  - `feat:` — เพิ่ม feature ใหม่
  - `fix:` — แก้ bug
  - `docs:` — แก้เอกสาร
  - `chore:` — งาน maintenance (deps, config)
  - `refactor:` — refactor โดยไม่เปลี่ยน behavior
  - `test:` — เพิ่มหรือแก้ test
  - `style:` — แก้ formatting, whitespace
- ทุก Phase ต้องเสนอ commit message ที่ชัดเจนและสอดคล้องกับงาน
- commit message ต้องสั้น กระชับ อธิบายสิ่งที่เปลี่ยนได้ใน 1 บรรทัด
- ถ้ามีรายละเอียดเพิ่มเติม ให้ใส่ใน commit body (บรรทัดที่ 3 เป็นต้นไป)

**ตัวอย่าง:**
```
feat(auth): add JWT register and login endpoints

- POST /api/auth/register with bcrypt password hashing
- POST /api/auth/login returning signed JWT
- auth middleware for protected routes
```

---

## 10. Forbidden Actions

AI **ห้าม**ทำสิ่งต่อไปนี้โดยเด็ดขาด:

| ห้าม | เหตุผล |
|-----|-------|
| เขียน Code ก่อน Planning เสร็จ | ทำให้เสียเวลา rework |
| ทำเกิน Phase ที่กำหนด | เพิ่มความซับซ้อนก่อนเวลา |
| เพิ่ม Feature นอกแผน | scope creep |
| เปลี่ยน Tech Stack โดยไม่ได้รับอนุญาต | กระทบ deployment และ team |
| เปลี่ยน DB Schema / API Contract เงียบๆ | ทำให้ระบบอื่นพัง |
| Commit `.env` หรือ secrets | ความเสี่ยงด้าน security |
| ใส่ production credentials ใน code | ความเสี่ยงด้าน security |
| Login/Authorize GitHub/Railway แทนผู้ใช้โดยไม่แจ้ง | privacy และ security |
| ลบหรือแก้ planning doc ที่ approved โดยไม่แจ้ง | เสียหาย audit trail |
| ประกาศ Phase ผ่านก่อน Acceptance Criteria ครบ | คุณภาพต่ำลง |

---

## 11. Required Output Format

ทุก output ของ AI ต้องมีโครงสร้างดังนี้:

### สำหรับ Planning Output
```
## Phase X Planning: [ชื่อ Phase]

### Scope
- ทำ: ...
- ไม่ทำ: ...

### Acceptance Criteria
- [ ] ...

### Files ที่จะสร้าง/แก้ไข
- [NEW] path/to/file
- [MODIFY] path/to/file

### วิธีรัน
...

### วิธีทดสอบ
...

### Recommended Git Commit
feat(...): ...
```

### สำหรับ Implementation Output
```
## ดำเนินการ Phase X: [ชื่อ Phase]

### ไฟล์ที่สร้าง/แก้ไข
- [NEW] path/to/file — อธิบาย
- [MODIFY] path/to/file — อธิบาย

### วิธีทดสอบ
...

### Phase Completion Report
...
```

---

## 12. How AI Should Ask Questions

- ถามเฉพาะสิ่งที่จำเป็นต่อการตัดสินใจ — ห้ามถามสิ่งที่ไม่เกี่ยวกับ Phase ปัจจุบัน
- รวมคำถามหลายข้อไว้ในครั้งเดียว ห้ามถามทีละข้อแยก session
- ระบุผลกระทบของแต่ละตัวเลือกเพื่อช่วยผู้ใช้ตัดสินใจ
- เมื่อถามให้เสนอ default / recommended option เสมอ

**รูปแบบการถาม:**
```
ก่อนเริ่ม Phase X ขอ confirm สิ่งต่อไปนี้:

1. [คำถาม] — (Recommended: [ตัวเลือกแนะนำ])
   ผลกระทบ: ...

2. [คำถาม] — (Recommended: [ตัวเลือกแนะนำ])
   ผลกระทบ: ...
```

---

## 13. How AI Should Handle Unclear Requirements

- **ขั้นที่ 1:** ระบุให้ชัดว่า requirement ส่วนไหนที่ไม่ชัดเจน
- **ขั้นที่ 2:** เสนอ interpretation ที่เป็นไปได้ (อย่างน้อย 2 แบบ)
- **ขั้นที่ 3:** เสนอ recommended interpretation พร้อมเหตุผล
- **ขั้นที่ 4:** รอผู้ใช้ confirm ก่อนดำเนินการ
- ห้ามเดาและลงมือทำโดยไม่ถาม

---

## 14. How AI Should Report Changes

เมื่อมีการเปลี่ยนแปลงจากแผนเดิม AI ต้องแจ้งในรูปแบบนี้:

```
⚠️ แจ้งการเปลี่ยนแปลงจากแผน

**สิ่งที่เปลี่ยน:** [อธิบาย]
**เหตุผล:** [อธิบาย]
**ผลกระทบ:** [อธิบาย]
**ไฟล์ที่ได้รับผล:** [ระบุ]

ต้องการ approve การเปลี่ยนแปลงนี้ก่อนดำเนินการต่อ
```

---

## 15. Docker Development Rules

- ใช้ `docker-compose.yml` สำหรับ development environment เท่านั้น
- **ไม่ใส่** field `version:` ใน `docker-compose.yml` (deprecated ใน Compose v2)
- Port mapping ที่กำหนดตายตัว:

| Service | Host Port | Container Port |
|---------|-----------|---------------|
| frontend (Vite) | 5173 | 5173 |
| backend (Express) | **5001** | 5001 |
| db (MySQL 8) | 3307 | 3306 |
| phpmyadmin | 8081 | 80 |

- **ห้ามใช้ port 5000** สำหรับ backend เพราะ macOS AirPlay Receiver อาจใช้อยู่
- Service ภายใน Docker ต้องคุยกันผ่าน **service name** และ **internal port** เท่านั้น:
  - Backend → DB: `DB_HOST=db`, port `3306`
  - phpMyAdmin → DB: `PMA_HOST=db`, `PMA_PORT=3306`
  - ห้ามใช้ `localhost` หรือ `127.0.0.1` สำหรับ inter-service communication
- ทุก service ต้องอยู่ใน custom bridge network เดียวกัน
- ใช้ bind mounts สำหรับ source code เพื่อรองรับ Hot Reload:
  ```
  ./backend:/app
  ./frontend:/app
  ```
- ใช้ **anonymous volume** สำหรับ `node_modules` เสมอ:
  ```
  /app/node_modules
  ```
- MySQL ต้องมี `healthcheck` และ service ที่พึ่งพา DB ต้องใช้:
  ```yaml
  depends_on:
    db:
      condition: service_healthy
  ```
- บน **Apple Silicon (M1/M2/M3/M4):** หาก image ไม่รองรับ ARM ให้กำหนด `platform: linux/amd64` เฉพาะ service ที่จำเป็น (เช่น phpmyadmin)
- SQL init script วางไว้ที่ `db/init/01-init.sql` — MySQL จะ execute อัตโนมัติเมื่อ container เริ่มต้นครั้งแรก
- **เมื่อเพิ่ม dependency ใหม่** ต้องแจ้งผู้ใช้ว่าต้อง rebuild container:
  ```bash
  docker compose up --build -d [service-name]
  ```

---

## 16. Git / GitHub Workflow Rules

- ก่อน commit ทุกครั้ง ต้องตรวจสอบ:
  - `git status` — ดูไฟล์ที่เปลี่ยน
  - ตรวจว่า `.env` **ไม่ถูก track**
- `.gitignore` ต้องครอบคลุมอย่างน้อย:
  - `.env`, `.env.*` (ยกเว้น `.env.example`)
  - `node_modules/`
  - `dist/`, `build/`
  - `*.log`, `logs/`
  - OS files (`.DS_Store`, `Thumbs.db`)
  - IDE files (`.vscode/`, `.idea/`)
- ใช้ **Conventional Commits** เป็นหลัก (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`)
- ทุก Phase ต้องมี recommended commit message ที่สอดคล้องกับงาน
- **README.md ต้องอัปเดต** เมื่อสิ่งต่อไปนี้เปลี่ยน: คำสั่งรัน, dependency, port, workflow
- README.md ควรมีหัวข้อ: project name, description, tech stack, install/run, port mapping, Docker commands, folder structure, license/owner
- หากต้อง push GitHub ใช้ GitHub CLI (`gh`) ได้ แต่ **ต้องแจ้งผู้ใช้ก่อน** ห้ามทำขั้นตอน login/authorize แทนโดยไม่ได้รับอนุญาต
- **ห้าม commit:** secrets, production credentials, tokens, ข้อมูลส่วนบุคคลจริงทุกกรณี

---

## 17. Skill / Project Instruction Rules

- AI ต้องอ่าน project instruction หรือ skill ที่เกี่ยวข้องก่อนเริ่มทำงานกับโปรเจกต์
- หากมี `.agents/skills/[skill-name]/SKILL.md` ให้ใช้เป็นแหล่งกติกาหลักร่วมกับเอกสาร planning
- ชื่อ skill ต้องเป็น **lowercase** และใช้ `-` คั่น เช่น `efootball-dev`
- `SKILL.md` ต้องมี YAML frontmatter ที่ประกอบด้วย `name` และ `description` ที่ชัดเจนและ match กับโปรเจกต์:
  ```yaml
  ---
  name: efootball-dev
  description: Development rules and architecture guide for eFootball Smart Marketplace & Squad Valuation
  ---
  ```
- `SKILL.md` ควรระบุหัวข้อต่อไปนี้:
  - When to Use / When NOT to Use
  - Project Architecture
  - Service Map & Ports
  - Docker Network Rules
  - Environment Variables
  - Commands (dev, build, test)
  - Coding Guidelines
  - Output Format & Examples
- ข้อมูลที่ยาว เช่น API spec หรือ DB schema ให้ **อ้างอิงจาก `docs/planning/`** แทนการคัดลอกทั้งหมดลง skill
- เมื่อ architecture, ports, services หรือ conventions เปลี่ยน ต้อง **อัปเดต skill และ planning docs ให้สอดคล้องกัน**

---

## 18. Environment & Secret Handling Rules

- ใช้ `.env` สำหรับ local development เท่านั้น — **ห้าม commit**
- ใช้ `.env.example` สำหรับตัวอย่างค่า — commit ได้ แต่ต้องใช้ placeholder เท่านั้น
- **ห้ามใส่ secret จริง** ใน source code, prompt, README, planning docs หรือ comment
- Production environment ตั้งค่าผ่าน **platform environment variables** (Railway Variables) เท่านั้น
- เมื่อแสดงตัวอย่าง config ต้องใช้ placeholder เสมอ:
  ```
  DB_PASSWORD=<your-database-password>
  JWT_SECRET=<your-jwt-secret-min-32-chars>
  ```
- ตัวแปร Vite ที่ต้องใช้ใน frontend ต้องขึ้นต้นด้วย `VITE_` เสมอ:
  ```
  VITE_API_BASE_URL=http://localhost:5001/api
  ```
- ห้ามแสดง token, credential หรือ key จริงใน output ของ AI ไม่ว่ากรณีใด

---

## Phase Completion Report Template

ใช้ template นี้หลังจบทุก Phase:

```markdown
## Phase Completion Report — Phase X: [ชื่อ Phase]

### สิ่งที่ทำเสร็จ
- [ ] ...

### ไฟล์ที่สร้าง/แก้ไข
| ไฟล์ | การเปลี่ยนแปลง |
|-----|--------------|
| path/to/file | [NEW] / [MODIFIED] / [DELETED] |

### ผลการทดสอบ Acceptance Criteria
| Criteria | ผลลัพธ์ |
|---------|--------|
| ... | ✅ / ❌ |

### Recommended Git Commit
\`\`\`
feat(phase-x): [ชื่อ Phase] implementation complete
\`\`\`

### Phase ถัดไป
Phase X+1: [ชื่อ] — [รอ approve / พร้อมเริ่ม]
```

---

*เอกสารนี้มีผลบังคับใช้กับทุก Phase ของโปรเจกต์ — ห้ามแก้ไขโดยไม่ผ่านการ approve*

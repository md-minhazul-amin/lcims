# LCIMS — End of Project Deliverables Report

## Systems Implementation and Integration Plan

### Team: The IT Crowd | CPRO306 | Kent Institute Australia | Week 11

> **How to use this document:** Copy each section into your Assessment 5 Word submission. Replace placeholder text in *[square brackets]* with your final prose, screenshots, and measured word counts. Keep Harvard references in Section 12 as written unless your lecturer specifies a different style guide.

---

## Cover Page Details

Include on the Word cover page (centred, professional formatting):

- **Report title:** LCIMS — End of Project Deliverables Report: Systems Implementation and Integration Plan
- **Subtitle (optional):** Local Cafe Inventory Management System
- **Team name:** The IT Crowd
- **Unit code:** CPRO306 — Capstone Project
- **Institution:** Kent Institute Australia
- **Submission date:** *[e.g. 25 May 2026 — confirm with timetable]*
- **Week / assessment:** Week 11 — Assessment 5
- **Team members (full names):**
  - Md Minhazul Amin
  - Ayush Sudedi
  - Aayush Khadgi
- **GitHub repository:** https://github.com/md-minhazul-amin/lcims
- **Optional:** Kent logo, page number footer, table of contents (auto-generated in Word)

---

## 1. Introduction (~200 words)

Write one short academic introduction covering:

- **Purpose of this report**
  - Document the completed implementation, integration, security, testing, and deployment of LCIMS for Assessment 5
  - Demonstrate that design decisions from earlier assessments (systems design, implementation plan) were executed and verified
- **Overview of LCIMS and what was built**
  - Full-stack web application for a single café (“The Daily Grind” in seed data)
  - Users log in with role-based access; managers maintain inventory and suppliers; staff adjust stock; all roles view dashboard, reports, alerts, and AI reorder suggestions
  - **Delivered modules:** authentication, inventory CRUD + stock logs, suppliers, dashboard KPIs, usage reports (Recharts), low-stock alerts (list + resolve), AI insights (OpenAI `gpt-3.5-turbo` or server-side demo mode)
  - **Repository layout:** `database/` (PostgreSQL schema + seed), `server/` (Express API), `client/` (React SPA)
- **Summary of technologies used**
  - **Frontend:** React 19, React Router 7, Axios, Recharts, Create React App
  - **Backend:** Node.js 18+, Express 5, `pg` connection pool, JWT (`jsonwebtoken`), `bcryptjs`, CORS, OpenAI Node SDK
  - **Database:** PostgreSQL 16+ (`lcims` database, six tables, eight indexes, transactional seed script)
- **Structure of this report**
  - Brief sentence listing Sections 2–12 (project management → installation → connectivity → CRUD evidence → security → code quality → testing → teamwork → deployment → conclusion → references)

---

## 2. Project Management Plan (~300 words)

### 2.1 Implementation Checklist

Insert a **table** in Word with columns: **Component | Status | Team Member | Notes**

| Component | Status | Team Member | Notes |
|-----------|--------|-------------|-------|
| PostgreSQL database (`database/lcims_schema.sql`) | Complete | *[assign]* | 6 tables: `cafes`, `users`, `suppliers`, `inventory_items`, `stock_logs`, `alerts`; seed data sanity check: 1 café, 3 users, 4 suppliers, 10 items, 8 stock logs, 2 active alerts |
| Authentication API (`server/routes/auth.js`) | Complete | *[assign]* | Register + login; bcrypt cost 12; JWT 8h; roles Manager / Staff / Admin |
| Auth middleware (`server/middleware/auth.js`) | Complete | *[assign]* | `verifyToken`, `requireManager` on protected routes |
| Inventory API (`server/routes/inventory.js`) | Complete | *[assign]* | CRUD, stock PATCH with transaction (log + optional alert), movement history |
| Suppliers API (`server/routes/suppliers.js`) | Complete | *[assign]* | CRUD; `item_count` on list; ON DELETE SET NULL for linked items |
| Reports API (`server/routes/reports.js`) | Complete | *[assign]* | Dashboard KPIs + recent activity; usage by date range |
| AI API (`server/routes/ai.js`) | Complete | *[assign]* | `POST /api/ai/reorder-suggestions`; demo mode when no valid OpenAI key |
| Alerts API (`server/routes/alerts.js`) | Complete | *[assign]* | List active alerts; PATCH resolve; café-scoped via inventory join |
| React frontend — core (`App.js`, `AuthContext`, `Layout`, `axios`) | Complete | *[assign]* | Protected routes; JWT in `localStorage` (`lcims_token`); sidebar navigation |
| React pages (8 routes) | Complete | *[assign]* | Login, Dashboard, Inventory, ItemDetail, Suppliers, Reports, Alerts, AIInsights |
| Manual testing (`TEST_PLAN.md`, 28 cases) | Complete | *[assign]* | Document pass/fail and screenshots in Section 8 |
| Project documentation | Complete | *[assign]* | `README.md`, `USER_GUIDE.md`, `DEPLOYMENT_GUIDE.md`, `TEST_PLAN.md`, file-level headers in source |

**Narrative bullets for this subsection:**

- State that all core components reached **Complete** for submission
- Mention any stretch goals deferred (e.g. production hosting, automated Jest/E2E suite) if applicable
- Cross-reference GitHub commit history as evidence of incremental delivery

### 2.2 Hardware and Software Used

Insert a **table:** **Tool | Version | Purpose**

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18.x LTS (or newer) | Runtime for Express API and React dev server |
| npm | 9+ (bundled with Node) | Dependency install (`npm install`) in `server/` and `client/` |
| Express | 5.2.x (`server/package.json`) | REST API, routing, middleware (CORS, JSON body) |
| PostgreSQL | 16+ (tested on 16 and 18) | Persistent data store for LCIMS |
| `pg` (node-postgres) | 8.x | Connection pool in `server/db.js` |
| React | 19.2.x | Single-page application UI |
| React Router | 7.x | Client-side routing (`/login`, `/inventory`, etc.) |
| Axios | 1.16.x | HTTP client; base URL `http://localhost:5000/api` |
| Recharts | 3.x | Bar chart on Reports page (Used vs Restocked) |
| bcryptjs | 3.x | Password hashing (cost factor 12) |
| jsonwebtoken | 9.x | Sign and verify JWT auth tokens |
| OpenAI Node SDK | 6.x | AI reorder suggestions (`gpt-3.5-turbo`) |
| Cursor AI | *[current]* | Assisted development, documentation, debugging |
| Visual Studio Code | *[version]* | Primary code editor |
| pgAdmin | 4+ (with PostgreSQL install) | GUI for viewing tables and running SQL |
| Git / GitHub | *[version]* | Version control; remote: `md-minhazul-amin/lcims` |
| Windows 10/11 | *[your build]* | Primary development OS (adjust if team used macOS/Linux) |

**Narrative bullets:**

- Minimum hardware: 4 GB RAM (8 GB recommended), 10 GB disk (`DEPLOYMENT_GUIDE.md`)
- Three-terminal workflow: PostgreSQL, backend port 5000, frontend port 3000

### 2.3 Team Resource Management

**Who did what** — describe in prose and align with Section 9.1 table:

- **Md Minhazul Amin:** *[e.g. backend routes, database schema, GitHub repo lead, deployment docs]*
- **Ayush Sudedi:** *[e.g. React pages, dashboard/reports UI, testing execution]*
- **Aayush Khadgi:** *[e.g. suppliers/inventory UI, AI insights page, user guide]*

*Adjust the above to match your actual division of work.*

**Communication method:**

- WhatsApp group for daily stand-ups and blockers
- In-person / on-campus sessions for integration testing and demo rehearsal
- Shared Google Drive or OneDrive for draft Word sections and screenshot folders (if used)

**Version control:**

- Git repository on GitHub; main branch for stable submission
- Feature work on branches *(name branches used, e.g. `feature/alerts`, `docs/test-plan`)*
- GitHub Desktop used where CLI Git was not on PATH
- `.gitignore` excludes `node_modules`, `.env`, assessment zip archives, Word lock files (`~$*`)

---

## 3. Server Installation and Configuration (~300 words)

### 3.1 Backend Server (Node.js + Express)

**Content to write:**

- Clone or extract project; `cd server`
- Copy `server/.env.example` → `server/.env`; set `DB_PASSWORD`, `JWT_SECRET`, optional `OPENAI_API_KEY`
- Run `npm install` then `npm run dev` (nodemon) or `npm start`
- Confirm console output:
  - `LCIMS Server running on port 5000 (http://localhost:5000)`
  - `Connected to PostgreSQL "lcims" at localhost:5432`
- Describe `server/index.js`: loads `dotenv`, mounts routes under `/api/auth`, `/api/inventory`, `/api/suppliers`, `/api/reports`, `/api/ai`, `/api/alerts`; applies CORS and `verifyToken` on protected paths

**Screenshot reference:**

- *[Figure 3.1]* Terminal showing server started on port 5000 and successful DB connection (PowerShell or VS Code integrated terminal)

### 3.2 Database Server (PostgreSQL)

**Content to write:**

- Install PostgreSQL 16+; note superuser password for `postgres`
- Create database: `CREATE DATABASE lcims;`
- Load schema: `psql -U postgres -d lcims -f database/lcims_schema.sql`
- Sanity query from README (counts: cafes 1, users 3, suppliers 4, inventory_items 10, stock_logs 8, alerts 2)
- Mention six tables, foreign keys, `set_updated_at()` trigger on `inventory_items`, indexes for performance

**Screenshot reference:**

- *[Figure 3.2]* pgAdmin Object Explorer showing `lcims` → Schemas → public → Tables (all six tables visible)
- *[Optional Figure 3.3]* Query tool showing seed row counts

### 3.3 Frontend Server (React Development Server)

**Content to write:**

- `cd client`; `npm install`; `npm start`
- CRA compiles to `http://localhost:3000`; proxy not required because Axios points to port 5000
- Login with seed credentials (`password123`): `manager@dailygrind.com`, `staff@dailygrind.com`, `admin@lcims.com`

**Screenshot reference:**

- *[Figure 3.4]* Browser at `http://localhost:3000/login` — LCIMS login form before authentication
- *[Optional]* Browser showing Dashboard after successful manager login

---

## 4. Front-End and Back-End Connectivity (~300 words)

### 4.1 How They Connect

**Explain in prose:**

- **Axios instance** (`client/src/api/axios.js`): `baseURL` = `http://localhost:5000/api`
- **Request interceptor:** reads `lcims_token` from `localStorage`; attaches `Authorization: Bearer <token>` on every API call
- **Response interceptor:** on 401, clears token and redirects to `/login`
- **Express CORS** (`server/index.js`): allows browser origin `http://localhost:3000` during development
- **Auth routes** (`/api/auth/*`) are public; all other `/api/*` routes use `verifyToken` middleware
- **React Router** maps pages to API calls (e.g. Inventory → `GET /api/inventory`)

**Optional diagram in Word:** Browser (React :3000) → HTTP JSON → Express (:5000) → `pg` pool → PostgreSQL

### 4.2 Authentication Flow Diagram (describe the flow in text)

Write a numbered flow suitable for converting to a diagram in Word:

1. User submits email/password on **Login** page (`client/src/pages/Login.js`)
2. `POST /api/auth/login` with JSON body `{ email, password }`
3. Server loads user by email; `bcrypt.compare` against `password_hash`
4. On success, server signs JWT (`user_id`, `email`, `role`, `cafe_id`, `expiresIn: '8h'`)
5. Response returns `{ token, user }`; `AuthContext.login` stores token in `localStorage` as `lcims_token`
6. User redirected to Dashboard (`/`)
7. Subsequent requests: Axios adds `Authorization: Bearer <token>`
8. `verifyToken` decodes JWT, attaches `req.user`; invalid/missing token → 401/403
9. **Logout:** clears `lcims_token`; `Navigate` to `/login`
10. **Protected routes:** `App.js` wraps authenticated layout; unauthenticated access redirects to `/login`

**Screenshot reference (optional):** Network tab showing login 200 and a follow-up request with Bearer header

### 4.3 API Endpoint Table

Insert full table in Word (copy from README; include **Alerts** routes added after initial README):

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/register` | — | Create user account (bcrypt-hashed password) |
| POST | `/api/auth/login` | — | Validate credentials; issue JWT (8 hours) |
| GET | `/api/inventory` | any authenticated | List inventory items for user's café |
| GET | `/api/inventory/:id` | any | Single item details |
| POST | `/api/inventory` | Manager / Admin | Create new inventory item |
| PUT | `/api/inventory/:id` | Manager / Admin | Update item fields |
| PATCH | `/api/inventory/:id/stock` | any | Adjust quantity; write `stock_logs`; create alert if below threshold |
| DELETE | `/api/inventory/:id` | Manager / Admin | Delete item |
| GET | `/api/inventory/:id/logs` | any | Stock change history for item |
| GET | `/api/suppliers` | any | List suppliers with `item_count` |
| POST | `/api/suppliers` | Manager / Admin | Create supplier |
| PUT | `/api/suppliers/:id` | Manager / Admin | Update supplier |
| DELETE | `/api/suppliers/:id` | Manager / Admin | Delete supplier (linked items: supplier set NULL) |
| GET | `/api/reports/dashboard` | any | KPIs + low-stock summary + recent activity |
| GET | `/api/reports/usage?from=&to=` | any | Per-item usage/restock totals for date range |
| POST | `/api/ai/reorder-suggestions` | any | AI reorder cards (OpenAI or demo mode) |
| GET | `/api/alerts` | any | List active low-stock alerts for café |
| PATCH | `/api/alerts/:alert_id/resolve` | any | Mark alert resolved |

**Note for report:** All `/api/*` except `/api/auth/*` require `Authorization: Bearer <token>`.

---

## 5. Database Operations — CRUD Evidence (~300 words)

Tie each operation to **UI action**, **API endpoint**, **SQL operation**, and **screenshot**.

### 5.1 Create (INSERT)

- **UI:** Inventory → **+ Add Item** (Manager); Suppliers → **+ Add Supplier**
- **API:** `POST /api/inventory`, `POST /api/suppliers`
- **SQL:** `INSERT INTO inventory_items ...` / `INSERT INTO suppliers ...`
- **Evidence:** New row visible in UI and optionally in pgAdmin table view

**Screenshot reference:**

- *[Figure 5.1]* Add Item form filled and saved; new row in inventory table
- *[Optional]* pgAdmin showing new row in `inventory_items`

### 5.2 Read (SELECT)

- **UI:** Inventory list, Item Detail, Dashboard, Reports, Alerts, Suppliers grid
- **API:** `GET /api/inventory`, `GET /api/inventory/:id`, `GET /api/reports/dashboard`, etc.
- **SQL:** `SELECT` with `WHERE cafe_id = $1` (parameterised)

**Screenshot reference:**

- *[Figure 5.2]* Inventory page loaded with seed items and OK / Low Stock badges

### 5.3 Update (UPDATE)

- **UI:** Item Detail → **Save Changes**; stock adjustment form; Supplier **Edit**
- **API:** `PUT /api/inventory/:id`, `PATCH /api/inventory/:id/stock`, `PUT /api/suppliers/:id`
- **SQL:** `UPDATE inventory_items SET ...`; stock PATCH also `INSERT INTO stock_logs`

**Screenshot reference:**

- *[Figure 5.3]* Item Detail after editing threshold or name; success message shown
- *[Optional]* Stock Change History panel after PATCH stock

### 5.4 Delete (DELETE)

- **UI:** Item Detail → **Delete** with confirmation dialog; Supplier delete with confirm
- **API:** `DELETE /api/inventory/:id`, `DELETE /api/suppliers/:id`
- **SQL:** `DELETE FROM inventory_items WHERE item_id = $1`; supplier delete may leave items with NULL `supplier_id`

**Screenshot reference:**

- *[Figure 5.4]* Confirmation dialog before delete; item removed from list after confirm

**Closing paragraph for Section 5:** Emphasise that all CRUD paths use **parameterised queries** (`$1`, `$2`, …) via the `pg` driver — never string-concatenated SQL.

---

## 6. Security Implementation (~250 words)

### 6.1 Password Hashing — bcrypt (cost 12)

- `bcryptjs` in `server/routes/auth.js`
- `SALT_ROUNDS = 12` (OWASP-recommended minimum)
- Register: `bcrypt.hash(password, 12)` stored in `users.password_hash`
- Login: `bcrypt.compare`; plaintext password never stored
- Seed users in `lcims_schema.sql` use pre-generated bcrypt hashes (`password123`)

### 6.2 JWT Authentication (8h tokens)

- `jwt.sign` with `expiresIn: '8h'` and `JWT_SECRET` from `.env`
- Payload includes `user_id`, `email`, `role`, `cafe_id` — no password in token
- `verifyToken` in `server/middleware/auth.js` validates signature and expiry
- Client storage: `localStorage` key `lcims_token`

### 6.3 Role-Based Access Control (Manager / Staff / Admin)

- **Manager / Admin:** full CRUD on inventory and suppliers (`requireManager`)
- **Staff:** read inventory, PATCH stock only; UI hides add/edit/delete controls (TC-010)
- **403** when Staff calls Manager-only endpoints (TC-028)
- **Admin:** same API privileges as Manager in current implementation

### 6.4 SQL Injection Prevention (parameterised queries $1, $2)

- All dynamic values passed as query parameters to `pool.query(sql, [param1, param2])`
- Example paths: login email lookup, inventory by `cafe_id`, stock PATCH, alert resolve
- Contrast with unsafe string concatenation (state why it was avoided)

### 6.5 Data Privacy — What is sent to OpenAI (anonymised data only)

- `server/routes/ai.js` builds prompt from **non-PII inventory fields** only (e.g. item name, category, quantity, threshold, unit) — no user emails, passwords, or café owner personal data
- If `OPENAI_API_KEY` missing or placeholder → **demo mode** computes suggestions locally from same inventory dataset (no external API call)
- Document team choice to use demo mode for assessment demos without exposing API keys in zip submissions
- `.env` and secrets excluded from Git via `.gitignore`

---

## 7. Code Quality and Standards (~200 words)

Cover evidence across the codebase:

- **File-level header comments**
  - JSDoc blocks on all React pages (`client/src/pages/*.js`)
  - Matching headers on `server/db.js`, `server/index.js`, `server/middleware/auth.js`, all route files
  - Core client files: `App.js`, `AuthContext.js`, `Layout.js`, `axios.js`
- **JSDoc-style route documentation**
  - `@route`, `@desc`, `@access` comments above handlers in `auth.js`, `inventory.js`, etc.
- **Consistent naming conventions**
  - camelCase in JavaScript; snake_case in PostgreSQL columns; REST plural nouns (`/inventory`, `/suppliers`)
- **No global variables**
  - Module exports only; React hooks for component state; `pool` singleton in `db.js`
- **Modular file structure**
  - `server/routes/` per domain; `client/src/pages/` one page per feature; shared `middleware/auth.js`
- **Inline styles policy**
  - Pages use inline style objects (no separate CSS per page) — state as intentional capstone convention
- **Supporting docs**
  - `TEST_PLAN.md`, `USER_GUIDE.md`, `DEPLOYMENT_GUIDE.md` for maintainability

---

## 8. Testing Results (~300 words)

- **Reference:** `TEST_PLAN.md` in repository root (28 manual test cases TC-001–TC-028)
- **Test environment:** Frontend `http://localhost:3000`, API `http://localhost:5000`, DB `lcims`, seed password `password123`

### Summary table of all 28 test cases

Insert in Word (abbreviated descriptions; full steps in `TEST_PLAN.md`):

| Test ID | Area | Brief description |
|---------|------|-------------------|
| TC-001 | Auth | Manager login success → Dashboard |
| TC-002 | Auth | Staff login success |
| TC-003 | Auth | Wrong password → error, stay on login |
| TC-004 | Auth | Protected URL without token → redirect login |
| TC-005 | Auth | Logout clears session |
| TC-006 | Inventory | View inventory list |
| TC-007 | Inventory | Manager add item |
| TC-008 | Inventory | Manager edit item |
| TC-009 | Inventory | Manager delete item |
| TC-010 | Inventory | Staff restricted from CRUD |
| TC-011 | Inventory | Stock increase (restock) |
| TC-012 | Inventory | Stock decrease + log entry |
| TC-013 | Suppliers | View suppliers with item counts |
| TC-014 | Suppliers | Manager add supplier |
| TC-015 | Suppliers | Manager edit supplier |
| TC-016 | Suppliers | Delete supplier; items unlink |
| TC-017 | Dashboard | KPI cards load |
| TC-018 | Dashboard | Recent activity panel |
| TC-019 | Reports | Valid date range → chart + table |
| TC-020 | Reports | Invalid date range → error |
| TC-021 | Alerts | Stock below threshold creates alert |
| TC-022 | Alerts | Alerts page lists active alerts |
| TC-023 | Alerts | Mark resolved removes from list |
| TC-024 | AI | Demo mode suggestions generate |
| TC-025 | AI | Urgency badges display |
| TC-026 | Security | No JWT → 401 |
| TC-027 | Security | Invalid JWT → 403 |
| TC-028 | Security | Staff POST inventory → 403 |

### Execution results table

Copy from `TEST_PLAN.md` **Test execution summary** — fill **Pass/Fail**, **Notes**, **Screenshot** for each TC-001–TC-028.

### Screenshot references by test area

| Area | Suggested figures |
|------|-------------------|
| Authentication | Login success, login error, redirect to login |
| Inventory CRUD | List, add form, edit detail, delete confirm |
| Stock | Item Detail stock form + history panel |
| Suppliers | Grid with badges, add/edit, after delete |
| Dashboard & Reports | KPI cards, activity feed, Recharts bar chart |
| Alerts | Active alert cards, after resolve |
| AI Insights | Suggestion cards with urgency colours |
| Security | Postman/curl 401/403 responses (optional) |

### Failed tests and resolution

- *[If none failed:]* “All 28 test cases passed on *[date]* in the documented environment.”
- *[If any failed:]* For each failure: symptom → root cause → fix (code change or test data) → retest result
- Examples to mention if applicable: wrong `DB_PASSWORD`, missing schema re-run, OpenAI key error handled by demo mode

---

## 9. Teamwork and Feedback Response (~200 words)

### 9.1 Team Contributions Table

| Member | Tasks completed | % contribution |
|--------|-----------------|--------------|
| Md Minhazul Amin | *[e.g. DB schema, Express server, auth/inventory routes, README, GitHub, TEST_PLAN, deployment guide]* | *[e.g. 35%]* |
| Ayush Sudedi | *[e.g. Dashboard, Reports, Recharts, frontend integration testing]* | *[e.g. 33%]* |
| Aayush Khadgi | *[e.g. Suppliers UI, AI Insights page, USER_GUIDE, screenshots]* | *[e.g. 32%]* |

**Total must equal 100%.** Adjust tasks and percentages to reflect actual work.

**Narrative bullets:**

- Fair division of backend vs frontend vs documentation
- Peer review before submission (each member tested another’s module)
- Challenges resolved collaboratively (CORS, bcrypt seed, alert feature integration)

### 9.2 Response to Lecturer Feedback

*[Replace with your actual Assessment 4 feedback. Suggested themes if feedback aligned with typical capstone comments:]*

- **Feedback received:** *[Quote or paraphrase lecturer comments from Assessment 4 — e.g. need more testing evidence, security discussion, user documentation, or feature completeness]*
- **Actions taken for Assessment 5:**
  - Added `TEST_PLAN.md` with 28 structured manual tests and screenshot columns
  - Added `USER_GUIDE.md` and `DEPLOYMENT_GUIDE.md`
  - Implemented **Alerts** module (`server/routes/alerts.js`, `Alerts.js` page, nav link)
  - Expanded inline and file-level documentation across server and client
  - Documented security (bcrypt, JWT, RBAC, parameterised SQL, OpenAI data minimisation)
  - Cleaned repository (removed Word lock file; updated `.gitignore` for zips and `~$*` files)
- **Evidence:** GitHub commit history and this report’s Sections 5–8

---

## 10. Deployment Documentation (~150 words)

- **Primary reference:** `DEPLOYMENT_GUIDE.md` in repository root
- **Brief summary for Word (do not duplicate entire guide):**
  1. Install Node.js 18+ and PostgreSQL 16+
  2. Create DB and run `database/lcims_schema.sql`
  3. Configure `server/.env` from `.env.example`
  4. `npm install` + `npm run dev` in `server/`
  5. `npm install` + `npm start` in `client/`
  6. Log in with seed credentials; optional OpenAI key for live AI mode
- **Production build note:** `client/build/` must be served via static server (`npx serve -s build`), not `file://` — backend must still run on port 5000
- **Cross-reference:** `USER_GUIDE.md` for end-user operations after install
- **Troubleshooting:** Point to README troubleshooting table (DB connection, 401 login, AI demo mode)

---

## 11. Conclusion (~150 words)

Summarise:

- **What was achieved**
  - Working LCIMS full-stack application meeting capstone scope: auth, inventory, suppliers, reporting, alerts, AI insights
  - Integrated React + Express + PostgreSQL with documented install and test artefacts
- **Requirements met**
  - CRUD on inventory and suppliers; role-based security; dashboard and reports; low-stock alerts; AI feature with fallback; manual test plan; deployment and user documentation
- **Reflection on challenges**
  - *[Examples:]* coordinating three developers; CORS and JWT flow debugging; PostgreSQL seed hashes; stock PATCH transactions; choosing demo mode for reliable AI demos during marking; time management across documentation and coding
- **Future improvements (optional one sentence)**
  - Hosted deployment (e.g. Render/Railway), automated tests, email notifications for alerts, multi-café admin portal

---

## 12. References (minimum 5 Harvard style)

Use Harvard referencing consistently. Include at least these sources (add page numbers only where you directly cited print content):

Duckett, J 2014, *HTML & CSS: Design and Build Websites*, 1st edn, John Wiley & Sons, Indianapolis.

Pressman, R S and Maxim, B R 2020, *Software Engineering: A Practitioner's Approach*, 9th edn, McGraw-Hill Education, New York.

Meta Open Source 2024, *React Documentation*, viewed 25 May 2026, <https://react.dev/>.

PostgreSQL Global Development Group 2024, *PostgreSQL Documentation*, viewed 25 May 2026, <https://www.postgresql.org/docs/>.

OpenJS Foundation 2024, *Express.js Guide*, viewed 25 May 2026, <https://expressjs.com/>.

OpenAI 2024, *OpenAI API Documentation — Chat Completions*, viewed 25 May 2026, <https://platform.openai.com/docs/>.

npm, Inc. 2024, *bcryptjs*, viewed 25 May 2026, <https://www.npmjs.com/package/bcryptjs>.

Kent Institute Australia 2026, *CPRO306 Capstone Project — Assessment Brief*, viewed 25 May 2026, *[insert Kent LMS URL if required]*.

The IT Crowd 2026, *LCIMS — Local Cafe Inventory Management System* (source code), GitHub repository, viewed 25 May 2026, <https://github.com/md-minhazul-amin/lcims>.

---

## Appendices (optional — add if Word count or rubric requires)

- **Appendix A:** Full `TEST_PLAN.md` execution sheet (completed Pass/Fail)
- **Appendix B:** Selected API request/response JSON samples (login, stock PATCH)
- **Appendix C:** Entity-relationship diagram or simplified schema diagram (six tables)
- **Appendix D:** GitHub commit log screenshot

---

## Screenshot checklist (master list for Word figures)

| Figure ID | Description |
|-----------|-------------|
| 3.1 | Backend terminal — server on port 5000 |
| 3.2 | pgAdmin — six LCIMS tables |
| 3.4 | Browser — login page |
| 5.1 | Create — new inventory item |
| 5.2 | Read — inventory list |
| 5.3 | Update — item detail saved |
| 5.4 | Delete — confirmation and result |
| 8.x | One screenshot per major test area (auth, CRUD, dashboard, reports, alerts, AI, security) |

---

*Document version: May 2026 | The IT Crowd | LCIMS Assessment 5 outline*

# LCIMS Deployment & Installation Guide

## Local Cafe Inventory Management System

### The IT Crowd | Kent Institute Australia | CPRO306

---

This guide explains how to install and run LCIMS on a development machine. For day-to-day use after installation, see **USER_GUIDE.md**. For manual testing, see **TEST_PLAN.md**.

---

## System Requirements

### Hardware

| Requirement | Minimum |
|-------------|---------|
| RAM | 4 GB (8 GB recommended if running browser + IDE + PostgreSQL together) |
| Disk space | 10 GB free (Node modules, PostgreSQL data, and project files) |

### Operating system

- Windows 10 or 11 (64-bit)
- macOS 12 (Monterey) or later
- Ubuntu 20.04 LTS or later (other modern Linux distros usually work)

### Software

| Software | Version | Purpose |
|----------|---------|---------|
| [Node.js](https://nodejs.org/) | 18.x or newer (LTS recommended) | Runs backend and frontend |
| npm | 9+ (bundled with Node.js) | Installs dependencies |
| [PostgreSQL](https://www.postgresql.org/) | 16+ (14+ may work; tested on 16 and 18) | Database for inventory and users |

---

## Prerequisites Installation

### 1. Installing Node.js

1. Go to [https://nodejs.org/](https://nodejs.org/).
2. Download the **LTS** installer for your operating system.
3. Run the installer and accept defaults (include **npm** and option to add Node to PATH).
4. Open a new terminal and verify:

```powershell
node --version
npm --version
```

You should see `v18.x.x` or higher for Node and `9.x.x` or higher for npm.

### 2. Installing PostgreSQL 16

1. Go to [https://www.postgresql.org/download/](https://www.postgresql.org/download/).
2. Choose your OS and download **PostgreSQL 16** (or newer).
3. Run the installer:
   - Remember the **superuser password** you set for the `postgres` account — you need it for `DB_PASSWORD` in `.env`.
   - Keep the default port **5432** unless you have a conflict.
   - Install **pgAdmin** and **Command Line Tools** if offered (includes `psql`).
4. Confirm the PostgreSQL service is running:
   - **Windows:** Services app → look for `postgresql-x64-16` or similar → Status **Running**.
   - **macOS/Linux:** `sudo systemctl status postgresql` (Linux) or check Postgres.app (macOS).

### 3. Cloning or extracting the project folder

**Option A — Git clone (if you have the repository URL):**

```powershell
git clone <repository-url> lcims
cd lcims
```

**Option B — ZIP extract (assessment submission):**

1. Extract `LCIMS_Assessment4_TheITCrowd.zip` (or your project archive) to a folder, e.g.  
   `C:\Users\<you>\Documents\KENT T1 -2026\Capstone Project\lcims`
2. Open that folder in your terminal — this path is referred to as `<repo>` below.

Expected top-level contents:

```
lcims/
├── client/
├── server/
├── database/
│   └── lcims_schema.sql
├── README.md
├── USER_GUIDE.md
├── TEST_PLAN.md
└── DEPLOYMENT_GUIDE.md
```

---

## Database Setup (Step-by-Step)

### Step 1 — Open a terminal

- **Windows:** PowerShell or Windows Terminal.
- **macOS:** Terminal.app.
- **Linux:** Your distribution’s terminal.

### Step 2 — Make `psql` available (Windows)

If `psql` is not recognized, add PostgreSQL’s `bin` folder to the session path (adjust `18` to your installed version):

```powershell
$env:Path = "C:\Program Files\PostgreSQL\18\bin;$env:Path"
```

On macOS/Linux, `psql` is often already on PATH after installation.

### Step 3 — Create the `lcims` database

```powershell
psql -U postgres -c "CREATE DATABASE lcims;"
```

Enter the `postgres` password when prompted.

If the database already exists from a previous attempt, you can skip this step or drop it first (development only):

```powershell
psql -U postgres -c "DROP DATABASE IF EXISTS lcims;"
psql -U postgres -c "CREATE DATABASE lcims;"
```

### Step 4 — Run the schema and seed file

Replace `<repo>` with your actual project path. Use forward slashes or escaped backslashes as needed.

**Windows (PowerShell):**

```powershell
psql -U postgres -d lcims -f "<repo>\database\lcims_schema.sql"
```

**macOS / Linux:**

```bash
psql -U postgres -d lcims -f "<repo>/database/lcims_schema.sql"
```

This script:

- Creates all **6 tables**: `cafes`, `users`, `suppliers`, `inventory_items`, `stock_logs`, `alerts`
- Creates **8 indexes** and the `updated_at` trigger
- Inserts seed data for The Daily Grind Café

### Step 5 — Verify the data (sanity check)

```powershell
psql -U postgres -d lcims -c "SELECT 'cafes', COUNT(*) FROM cafes UNION ALL SELECT 'users', COUNT(*) FROM users UNION ALL SELECT 'suppliers', COUNT(*) FROM suppliers UNION ALL SELECT 'inventory_items', COUNT(*) FROM inventory_items UNION ALL SELECT 'stock_logs', COUNT(*) FROM stock_logs UNION ALL SELECT 'alerts', COUNT(*) FROM alerts;"
```

### Step 6 — Expected output

You should see one row per table with these counts:

| table_name | count |
|------------|-------|
| cafes | **1** |
| users | **3** |
| suppliers | **4** |
| inventory_items | **10** |
| stock_logs | **8** |
| alerts | **2** |

If any count differs, re-run `lcims_schema.sql` or check for error messages during the import.

---

## Backend Server Setup

### Step 1 — Navigate to the `server/` folder

```powershell
cd <repo>\server
```

### Step 2 — Copy `.env.example` to `.env`

**Windows (PowerShell):**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

```bash
cp .env.example .env
```

### Step 3 — Edit `.env`

Open `server/.env` in a text editor and set each variable:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | TCP port the Express API listens on | `5000` |
| `DB_HOST` | PostgreSQL server hostname | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name created above | `lcims` |
| `DB_USER` | PostgreSQL role with access to `lcims` | `postgres` |
| `DB_PASSWORD` | Password for `DB_USER` — **required** | Your PostgreSQL password |
| `JWT_SECRET` | Secret used to sign login tokens; use a long random string in production | Change from example |
| `OPENAI_API_KEY` | Real OpenAI key (`sk-...`) for live AI Insights; leave placeholder for **demo mode** | `your_openai_api_key_here` or `sk-...` |

**Notes:**

- If `DB_PASSWORD` is wrong, the server will log a PostgreSQL connection error and API calls will fail.
- If `OPENAI_API_KEY` is missing or still `your_openai_api_key_here`, AI Insights uses deterministic **demo mode** (no OpenAI billing).

### Step 4 — Install dependencies

```powershell
npm install
```

Wait until `node_modules` is created with no errors.

### Step 5 — Start the server

**Development** (auto-restarts on file changes — requires `nodemon` from devDependencies):

```powershell
npm run dev
```

**Production-style** (single process, no auto-reload):

```powershell
npm start
```

### Step 6 — Expected success message

You should see output similar to:

```
LCIMS Server running on port 5000 (http://localhost:5000)
Connected to PostgreSQL "lcims" at localhost:5432 as "postgres"
```

Optional check: open [http://localhost:5000](http://localhost:5000) in a browser — you should see JSON like `{"message":"LCIMS API running","version":"1.0.0"}`.

Leave this terminal **open** while using the app.

---

## Frontend Setup

### Step 1 — Open a second terminal

The backend must keep running in the first terminal.

### Step 2 — Navigate to the `client/` folder

```powershell
cd <repo>\client
```

### Step 3 — Install dependencies

```powershell
npm install
```

This may take several minutes on first run.

### Step 4 — Start the React development server

```powershell
npm start
```

If the browser does not open automatically, go to [http://localhost:3000](http://localhost:3000) manually.

### Step 5 — Expected behaviour

- Terminal shows `Compiled successfully!`
- App loads the **login** page at `http://localhost:3000`
- The frontend calls the API at `http://localhost:5000/api` (see `client/src/api/axios.js`)

To stop the frontend, press `Ctrl+C` in its terminal.

### Production build (optional)

For a static production bundle:

```powershell
npm run build
```

Serve the `client/build` folder with a static server (and keep the backend running). See **README.md** for `npx serve -s build` details.

---

## Verification Checklist

Complete this list after installation:

- [ ] PostgreSQL service is running
- [ ] `lcims` database exists with all 6 tables
- [ ] Backend responds at [http://localhost:5000](http://localhost:5000)
- [ ] Frontend loads at [http://localhost:3000](http://localhost:3000)
- [ ] Login works with `manager@dailygrind.com` / `password123`
- [ ] Inventory page shows 10 items
- [ ] Suppliers page shows 4 suppliers
- [ ] Dashboard KPIs load correctly

**Optional extra checks:**

- [ ] Alerts page shows 2 active seed alerts
- [ ] AI Insights generates suggestions (demo or live mode)
- [ ] Staff login (`staff@dailygrind.com`) hides Add Item button

---

## Default Login Credentials (Development Only)

All seed users share the password: **`password123`**

| Email | Password | Role | Access level |
|-------|----------|------|----------------|
| manager@dailygrind.com | password123 | Manager | Full access: inventory/supplier CRUD, stock, reports, alerts, AI |
| staff@dailygrind.com | password123 | Staff | View data, adjust stock only; no add/edit/delete |
| admin@lcims.com | password123 | Admin | Same as Manager for API operations in this build |

> **Warning:** These accounts exist only for development and assessment. **Change all passwords before deploying to production.** Do not expose this database or these credentials on the public internet.

---

## Troubleshooting

| Problem | Likely cause | Solution |
|---------|--------------|----------|
| Server won't start | `DB_PASSWORD` wrong in `.env` | Set `DB_PASSWORD` to your actual PostgreSQL `postgres` password; restart server |
| Server won't start | PostgreSQL not running | Start the PostgreSQL service; verify with `psql -U postgres -c "\l"` |
| Login returns 401 | Schema/seed not loaded or wrong password hashes | Re-run `database/lcims_schema.sql`; use exact seed password `password123` |
| Login returns 401 | Backend not connected to DB | Fix connection error in server terminal first |
| Port 5000 in use | Another app using port 5000 | Stop the other process, or set `PORT=5001` in `.env` and update `baseURL` in `client/src/api/axios.js` |
| Port 3000 in use | Another React app running | Stop it or set `PORT=3001` when prompted by Create React App |
| `npm install` fails | Node version too old | Upgrade to Node.js 18 LTS; delete `node_modules` and `package-lock.json`, run `npm install` again |
| `psql` not found | PostgreSQL bin not on PATH | Add PostgreSQL `bin` to PATH (see Database Setup Step 2) |
| Blank page on startup | Frontend cannot reach API | Ensure backend is running; check `baseURL` in `client/src/api/axios.js` is `http://localhost:5000/api` |
| Blank page after login | API errors / CORS | Check browser DevTools → Network; fix backend errors first |
| AI Insights error (red) | Invalid OpenAI key | Replace `OPENAI_API_KEY` with valid `sk-...` key, or leave placeholder for demo mode |
| `CREATE DATABASE` fails | Database already exists | Use existing `lcims` DB or `DROP DATABASE` (dev only) then recreate |

---

## Security Notes for Production

Before exposing LCIMS to real users or the internet:

1. **Change all seed passwords immediately** — replace bcrypt hashes in the database or register new users; never use `password123` in production.
2. **Use a strong random `JWT_SECRET`** — at least 32 random characters; never commit `.env` to Git.
3. **Enable HTTPS** — terminate TLS with a reverse proxy (nginx, IIS, cloud load balancer) so tokens and passwords are not sent in plain text.
4. **Restrict PostgreSQL** — bind to `localhost` or a private network; use a dedicated DB user with least privilege (not necessarily `postgres` superuser).
5. **Use environment variables** — inject secrets via hosting platform secrets manager; never hardcode credentials in source code.
6. **Remove or protect demo data** — replace seed café data with production data; audit who has Manager role.
7. **Keep dependencies updated** — run `npm audit` periodically on `server/` and `client/`.
8. **Firewall** — expose only ports 443 (HTTPS) publicly; do not expose PostgreSQL port 5432 to the internet.
9. **OpenAI API key** — store securely; rotate if leaked; monitor usage/billing on [platform.openai.com](https://platform.openai.com/).
10. **Backups** — schedule regular PostgreSQL backups of the `lcims` database.

---

## Quick reference — three terminals

| Terminal | Directory | Command |
|----------|-------------|---------|
| 1 (optional) | — | PostgreSQL service (background) |
| 2 | `<repo>/server` | `npm run dev` |
| 3 | `<repo>/client` | `npm start` |

Browser: **http://localhost:3000** · API: **http://localhost:5000**

---

*LCIMS Deployment Guide — Version 1.0 — May 2026 — The IT Crowd*

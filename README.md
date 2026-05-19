# LCIMS — Local Cafe Inventory Management System

Full-stack inventory management app for a local cafe.

- **client/**   – React 19 frontend (Create React App)
- **server/**   – Node.js + Express backend API
- **database/** – PostgreSQL 16+ schema and seed data

## Features

- JWT-based authentication with role-based access control (Manager / Staff / Admin)
- Inventory CRUD with per-item stock change history and automatic low-stock alerts
- Supplier directory with item-count badges
- Dashboard KPIs and date-ranged usage reports (Recharts bar chart)
- AI reorder suggestions powered by OpenAI's `gpt-3.5-turbo`, with a built-in
  offline demo mode that returns deterministic suggestions computed from real
  data when no API key is configured

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (tested on 16 and 18)
- *(Optional)* An OpenAI API key — without one, AI Insights runs in demo mode

## Quick Start (Windows / PowerShell)

Open three terminals. Replace `<repo>` with the path to this folder.

### 1. Database

```powershell
# Make psql visible in this shell (adjust version number if needed)
$env:Path = "C:\Program Files\PostgreSQL\18\bin;$env:Path"

# Create the database and load schema + seed in one shot
psql -U postgres -c "CREATE DATABASE lcims;"
psql -U postgres -d lcims -f "<repo>\database\lcims_schema.sql"

# Sanity check (should print 1, 3, 4, 10, 8, 2)
psql -U postgres -d lcims -c "SELECT 'cafes', COUNT(*) FROM cafes UNION ALL SELECT 'users', COUNT(*) FROM users UNION ALL SELECT 'suppliers', COUNT(*) FROM suppliers UNION ALL SELECT 'inventory_items', COUNT(*) FROM inventory_items UNION ALL SELECT 'stock_logs', COUNT(*) FROM stock_logs UNION ALL SELECT 'alerts', COUNT(*) FROM alerts;"
```

### 2. Backend (Terminal 1)

```powershell
cd <repo>\server

# Edit .env -> set DB_PASSWORD to your local postgres password
# Optionally set OPENAI_API_KEY=sk-...; otherwise AI runs in demo mode

npm install
npm run dev
```

Expected output:

```
LCIMS Server running on port 5000 (http://localhost:5000)
Connected to PostgreSQL "lcims" at localhost:5432 as "postgres"
```

### 3. Frontend (Terminal 2)

```powershell
cd <repo>\client
npm install
npm start
```

Expected output: `Compiled successfully` and a browser window opens at
http://localhost:3000.

### 4. Log in

Seed credentials (all use the password `password123`):

| Email | Role |
| --- | --- |
| `manager@dailygrind.com` | Manager (full access, can create/edit/delete) |
| `staff@dailygrind.com`   | Staff (read + stock updates only) |
| `admin@lcims.com`        | Admin |

## Environment Variables (`server/.env`)

| Key              | Description |
| ---------------- | --- |
| `PORT`           | Express port (default 5000) |
| `DB_HOST`        | PostgreSQL host (default `localhost`) |
| `DB_PORT`        | PostgreSQL port (default 5432) |
| `DB_NAME`        | Database name (default `lcims`) |
| `DB_USER`        | Database user (default `postgres`) |
| `DB_PASSWORD`    | Database password (set this) |
| `JWT_SECRET`     | Secret used to sign JWT auth tokens |
| `OPENAI_API_KEY` | Real `sk-...` OpenAI key. If absent/placeholder, AI Insights falls back to deterministic demo mode |

A template is provided at `server/.env.example`.

## API Endpoints

All `/api/*` routes (except `/api/auth/*`) require `Authorization: Bearer <token>`.

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| POST   | `/api/auth/register`        | -       | Create user |
| POST   | `/api/auth/login`           | -       | Issue JWT (8h) |
| GET    | `/api/inventory`            | any     | List items |
| GET    | `/api/inventory/:id`        | any     | Single item |
| POST   | `/api/inventory`            | Manager | Create |
| PUT    | `/api/inventory/:id`        | Manager | Update |
| PATCH  | `/api/inventory/:id/stock`  | any     | Adjust stock + log + alert |
| DELETE | `/api/inventory/:id`        | Manager | Delete |
| GET    | `/api/inventory/:id/logs`   | any     | Stock change history |
| GET    | `/api/suppliers`            | any     | List w/ item counts |
| POST   | `/api/suppliers`            | Manager | Create |
| PUT    | `/api/suppliers/:id`        | Manager | Update |
| DELETE | `/api/suppliers/:id`        | Manager | Delete |
| GET    | `/api/reports/dashboard`    | any     | KPIs + recent activity |
| GET    | `/api/reports/usage`        | any     | Per-item usage in date range |
| POST   | `/api/ai/reorder-suggestions` | any   | Reorder suggestions (OpenAI or demo) |

## Viewing the production build

`client/build/` contains the compiled production bundle (assets reference
absolute paths like `/static/js/main.xxx.js`). It **cannot be opened directly
from disk** — opening `build/index.html` via `file://` will show a blank page
because the browser cannot resolve those absolute asset paths and React Router
does not work under the `file://` scheme.

To preview the production build, serve it with a static web server:

```powershell
cd <repo>\client
npx serve -s build -l 3001   # then open http://localhost:3001
```

The backend on port 5000 must also be running for any data to load.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Server crashes with `PostgreSQL connection error` | `DB_PASSWORD` in `.env` is wrong, or service isn't running. Check `Get-Service postgresql-x64-18`. |
| Login returns 401 | Re-run `lcims_schema.sql` to restore the seeded bcrypt hashes. |
| AI Insights shows red error | Either OpenAI rejected the key (replace it in `.env`), or the network is blocked. With no key, demo mode kicks in instead and the page works. |
| Frontend shows blank page when opening `build/index.html` directly | Expected — see "Viewing the production build" above. |
| `npm start` doesn't open a browser | Set `BROWSER=none` in the env, or open http://localhost:3000 manually. |

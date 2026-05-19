# LCIMS Database

PostgreSQL 16 scripts for the Local Cafe Inventory Management System.

## Authoritative schema

- **`lcims_schema.sql`** - Full schema (6 tables, 8 indexes, `updated_at` trigger)
  bundled with seed data (1 cafe, 3 users, 4 suppliers, 10 items, 8 stock logs,
  2 alerts). Run this one file and you're ready to develop.

## Legacy / superseded

- `schema.sql` - Earlier minimal schema. Kept only for reference; do not use.
- `seed.sql`   - Earlier seed data. Kept only for reference; do not use.

## Setup

```bash
# 1. Create the database (one-time)
psql -U postgres -c "CREATE DATABASE lcims;"

# 2. Apply schema + seed in one go
psql -U postgres -d lcims -f lcims_schema.sql

# 3. Verify
psql -U postgres -d lcims -c "
  SELECT 'cafes' AS table_name, COUNT(*) FROM cafes
  UNION ALL SELECT 'users',           COUNT(*) FROM users
  UNION ALL SELECT 'suppliers',       COUNT(*) FROM suppliers
  UNION ALL SELECT 'inventory_items', COUNT(*) FROM inventory_items
  UNION ALL SELECT 'stock_logs',      COUNT(*) FROM stock_logs
  UNION ALL SELECT 'alerts',          COUNT(*) FROM alerts;
"
```

Expected counts: **1, 3, 4, 10, 8, 2**.

## ER overview

```
cafes (1) ─┬── (N) users
           ├── (N) suppliers
           └── (N) inventory_items ─┬── (N) stock_logs ── (N) users
                                    └── (N) alerts
```

## ON DELETE behaviour

| Child table       | FK column   | Parent      | Behaviour  |
| ----------------- | ----------- | ----------- | ---------- |
| users             | cafe_id     | cafes       | CASCADE    |
| suppliers         | cafe_id     | cafes       | CASCADE    |
| inventory_items   | cafe_id     | cafes       | CASCADE    |
| inventory_items   | supplier_id | suppliers   | SET NULL   |
| stock_logs        | item_id     | inventory_items | CASCADE |
| stock_logs        | user_id     | users       | SET NULL   |
| alerts            | item_id     | inventory_items | CASCADE |

## Seed credentials

All three seeded users share the password **`password123`** (real bcrypt-cost-10
hashes are baked into the schema). These are dev-only — rotate before deploying.

| Email                     | Password      | Role    | Cafe         |
| ------------------------- | ------------- | ------- | ------------ |
| `manager@dailygrind.com`  | `password123` | Manager | Daily Grind  |
| `staff@dailygrind.com`    | `password123` | Staff   | Daily Grind  |
| `admin@lcims.com`         | `password123` | Admin   | (none)       |

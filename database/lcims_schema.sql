-- ============================================================================
-- LCIMS - Local Cafe Inventory Management System
-- Schema and seed data for PostgreSQL 16
-- ============================================================================
-- Usage:
--   psql -U postgres -c "CREATE DATABASE lcims;"
--   psql -U postgres -d lcims -f lcims_schema.sql
--
-- Re-runnable: drops and recreates all six tables inside a transaction.
-- ============================================================================

BEGIN;

-- Drop in reverse dependency order so re-runs are clean.
DROP TABLE IF EXISTS alerts           CASCADE;
DROP TABLE IF EXISTS stock_logs       CASCADE;
DROP TABLE IF EXISTS inventory_items  CASCADE;
DROP TABLE IF EXISTS suppliers        CASCADE;
DROP TABLE IF EXISTS users            CASCADE;
DROP TABLE IF EXISTS cafes            CASCADE;

DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

-- ----------------------------------------------------------------------------
-- 1. cafes
-- ----------------------------------------------------------------------------
-- owner_id is intentionally a plain INTEGER (not a FK) because cafes and users
-- reference each other; pick whichever direction you prefer to enforce in app
-- code, or add an ALTER TABLE ... ADD CONSTRAINT here later.
CREATE TABLE cafes (
    cafe_id     SERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    address     VARCHAR(255),
    owner_id    INTEGER,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. users
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    user_id        SERIAL PRIMARY KEY,
    email          VARCHAR(255) UNIQUE NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    role           VARCHAR(20)  NOT NULL
                   CHECK (role IN ('Manager', 'Staff', 'Admin')),
    cafe_id        INTEGER REFERENCES cafes(cafe_id) ON DELETE CASCADE,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. suppliers
-- ----------------------------------------------------------------------------
CREATE TABLE suppliers (
    supplier_id  SERIAL PRIMARY KEY,
    name         VARCHAR(150) NOT NULL,
    contact      VARCHAR(100),
    phone        VARCHAR(30),
    email        VARCHAR(255),
    cafe_id      INTEGER NOT NULL REFERENCES cafes(cafe_id) ON DELETE CASCADE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. inventory_items
-- ----------------------------------------------------------------------------
-- supplier_id uses SET NULL so deleting a supplier does not lose the item.
-- cafe_id uses CASCADE because items belong to a single tenant cafe.
CREATE TABLE inventory_items (
    item_id      SERIAL PRIMARY KEY,
    name         VARCHAR(100)  NOT NULL,
    category     VARCHAR(50)   NOT NULL,
    unit         VARCHAR(20)   NOT NULL,
    quantity     DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    threshold    DECIMAL(10,2) NOT NULL DEFAULT 0,
    supplier_id  INTEGER REFERENCES suppliers(supplier_id) ON DELETE SET NULL,
    cafe_id      INTEGER NOT NULL REFERENCES cafes(cafe_id) ON DELETE CASCADE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. stock_logs
-- ----------------------------------------------------------------------------
-- user_id uses SET NULL so audit history survives user deletion.
CREATE TABLE stock_logs (
    log_id      SERIAL PRIMARY KEY,
    item_id     INTEGER NOT NULL REFERENCES inventory_items(item_id) ON DELETE CASCADE,
    user_id     INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    change_qty  DECIMAL(10,2) NOT NULL,
    reason      VARCHAR(255),
    timestamp   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. alerts
-- ----------------------------------------------------------------------------
CREATE TABLE alerts (
    alert_id      SERIAL PRIMARY KEY,
    item_id       INTEGER NOT NULL REFERENCES inventory_items(item_id) ON DELETE CASCADE,
    triggered_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    status        VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'resolved'))
);

-- ----------------------------------------------------------------------------
-- Indexes (8 total)
--   3 on cafe_id      (users, suppliers, inventory_items)
--   1 on supplier_id  (inventory_items)
--   2 on item_id      (stock_logs, alerts)
--   1 on user_id      (stock_logs)
--   1 on status       (alerts)
-- ----------------------------------------------------------------------------
CREATE INDEX idx_users_cafe_id              ON users(cafe_id);
CREATE INDEX idx_suppliers_cafe_id          ON suppliers(cafe_id);
CREATE INDEX idx_inventory_items_cafe_id    ON inventory_items(cafe_id);
CREATE INDEX idx_inventory_items_supplier   ON inventory_items(supplier_id);
CREATE INDEX idx_stock_logs_item_id         ON stock_logs(item_id);
CREATE INDEX idx_stock_logs_user_id         ON stock_logs(user_id);
CREATE INDEX idx_alerts_item_id             ON alerts(item_id);
CREATE INDEX idx_alerts_status              ON alerts(status);

-- ----------------------------------------------------------------------------
-- Trigger: keep inventory_items.updated_at in sync on UPDATE
-- ----------------------------------------------------------------------------
CREATE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- Seed data
-- ============================================================================

-- 1 cafe (owner_id assigned after users are inserted) ------------------------
INSERT INTO cafes (name, address) VALUES
    ('The Daily Grind Café', '123 Collins Street, Melbourne, VIC 3000');

-- 3 users --------------------------------------------------------------------
-- Real bcrypt(cost 10) hashes for the password "password123".
-- These are DEV credentials only - rotate before deploying anywhere real.
INSERT INTO users (email, password_hash, role, cafe_id) VALUES
    ('manager@dailygrind.com',
     '$2b$10$4rUD8tsuiOB/wMrRK0KMAelmIdG6FHOSiMdM17eQ1N5U6rjNwsFgy',
     'Manager', 1),
    ('staff@dailygrind.com',
     '$2b$10$aBFgsH1np3k685KmLGuvK.DkgKkU5EMbVCnzNRHQoWOvnaoj8paLe',
     'Staff', 1),
    ('admin@lcims.com',
     '$2b$10$OXIdS4YCebhTvqCih7U/eONz/KBvoTnK/Ne7jDczv/V9aCfqVihXa',
     'Admin', NULL);

-- Link the manager (user_id = 1) as the cafe owner
UPDATE cafes SET owner_id = 1 WHERE cafe_id = 1;

-- 4 suppliers ----------------------------------------------------------------
INSERT INTO suppliers (name, contact, phone, email, cafe_id) VALUES
    ('Metro Coffee Supplies',  'Daniel Hughes',  '+61 3 9123 4567', 'orders@metrocoffee.com.au',        1),
    ('Fresh Dairy Co',         'Emma Thompson',  '+61 3 9234 5678', 'sales@freshdairy.com.au',          1),
    ('City Bakery Wholesale',  'Marcus Bianchi', '+61 3 9345 6789', 'wholesale@citybakery.com.au',      1),
    ('Aussie Fruits & Veg',    'Priya Sharma',   '+61 3 9456 7890', 'orders@aussiefreshproduce.com.au', 1);

-- 10 inventory items (2 per category) ----------------------------------------
-- item_ids 3 (Full Cream Milk) and 5 (Butter Croissants) are deliberately
-- below threshold to drive the seed alerts further down.
INSERT INTO inventory_items (name, category, unit, quantity, threshold, supplier_id, cafe_id) VALUES
    ('Arabica Coffee Beans',  'Beverages', 'kg',    18.50,   5.00, 1, 1),  -- item_id 1
    ('Loose Leaf Earl Grey',  'Beverages', 'kg',     2.30,   1.00, 1, 1),  -- item_id 2
    ('Full Cream Milk 2L',    'Dairy',     'L',     24.00,  30.00, 2, 1),  -- item_id 3 (BELOW)
    ('Soy Milk 1L',           'Dairy',     'L',      8.00,   4.00, 2, 1),  -- item_id 4
    ('Butter Croissants',     'Bakery',    'unit',  18.00,  25.00, 3, 1),  -- item_id 5 (BELOW)
    ('Sourdough Loaf',        'Bakery',    'unit',  12.00,   5.00, 3, 1),  -- item_id 6
    ('Hass Avocados',         'Produce',   'unit',  22.00,  10.00, 4, 1),  -- item_id 7
    ('Roma Tomatoes',         'Produce',   'kg',     6.50,   3.00, 4, 1),  -- item_id 8
    ('12oz Takeaway Cups',    'Supplies',  'unit', 480.00, 200.00, 3, 1),  -- item_id 9
    ('Paper Napkins (pack)',  'Supplies',  'pack',  35.00,  15.00, 3, 1);  -- item_id 10

-- 8 stock_logs entries (mix of usage and restocking) -------------------------
INSERT INTO stock_logs (item_id, user_id, change_qty, reason, timestamp) VALUES
    (1, 2,  -1.50, 'Morning service usage',           NOW() - INTERVAL '6 hours'),
    (3, 2,  -8.00, 'Latte / flat white service',      NOW() - INTERVAL '5 hours'),
    (5, 2,  -7.00, 'Pastry case top-up to display',   NOW() - INTERVAL '4 hours'),
    (9, 2, -45.00, 'Takeaway service',                NOW() - INTERVAL '3 hours'),
    (1, 1,   5.00, 'Restock - Metro Coffee delivery', NOW() - INTERVAL '2 days'),
    (4, 1,   6.00, 'Restock - Fresh Dairy delivery',  NOW() - INTERVAL '2 days'),
    (7, 1,  24.00, 'Restock - Aussie Fruits delivery',NOW() - INTERVAL '1 day'),
    (3, 2,  -2.00, 'Spillage adjustment',             NOW() - INTERVAL '30 minutes');

-- 2 active alerts (one per below-threshold item) -----------------------------
INSERT INTO alerts (item_id, status) VALUES
    (3, 'active'),   -- Full Cream Milk 2L  (24.00 < 30.00)
    (5, 'active');   -- Butter Croissants   (18.00 < 25.00)

COMMIT;

-- ============================================================================
-- Quick sanity check (run separately after the script finishes):
--
--   SELECT 'cafes'           AS table_name, COUNT(*) FROM cafes
--   UNION ALL SELECT 'users',           COUNT(*) FROM users
--   UNION ALL SELECT 'suppliers',       COUNT(*) FROM suppliers
--   UNION ALL SELECT 'inventory_items', COUNT(*) FROM inventory_items
--   UNION ALL SELECT 'stock_logs',      COUNT(*) FROM stock_logs
--   UNION ALL SELECT 'alerts',          COUNT(*) FROM alerts;
--
-- Expected: 1, 3, 4, 10, 8, 2
-- ============================================================================

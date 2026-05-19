-- LCIMS (Local Cafe Inventory Management System)
-- PostgreSQL schema starter
-- Run:  psql -U postgres -d lcims -f schema.sql

CREATE TABLE IF NOT EXISTS users (
    id           SERIAL PRIMARY KEY,
    username     VARCHAR(50)  UNIQUE NOT NULL,
    email        VARCHAR(120) UNIQUE NOT NULL,
    password     VARCHAR(255) NOT NULL,
    role         VARCHAR(20)  NOT NULL DEFAULT 'staff',
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(80) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_items (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(120) NOT NULL,
    category_id   INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    quantity      NUMERIC(10,2) NOT NULL DEFAULT 0,
    unit          VARCHAR(20)   NOT NULL DEFAULT 'unit',
    reorder_level NUMERIC(10,2) NOT NULL DEFAULT 0,
    unit_price    NUMERIC(10,2) NOT NULL DEFAULT 0,
    supplier      VARCHAR(120),
    updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id            SERIAL PRIMARY KEY,
    item_id       INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('IN','OUT','ADJUST')),
    quantity      NUMERIC(10,2) NOT NULL,
    note          VARCHAR(255),
    user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_movements_item     ON stock_movements(item_id);

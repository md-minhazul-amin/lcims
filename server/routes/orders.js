// File: routes/orders.js
// Purpose: Supplier order request endpoints — allows Managers to place and
//          view product reorder requests linked to a supplier and inventory item.
// Author: The IT Crowd
// Date: May 2026 (added per professor feedback — Assessment 6)
// Project: LCIMS - Local Cafe Inventory Management System

const express = require('express');

const pool = require('../db');
const { verifyToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// All order routes require a valid JWT (populates req.user.cafe_id, role).
router.use(verifyToken);

// parseId: order_id in the URL must be a positive integer (SERIAL PK).
// Rejecting invalid values early returns 404 without hitting the database.
function parseId(value) {
    const n = Number.parseInt(value, 10);
    return Number.isInteger(n) && n > 0 ? n : null;
}

// ---------------------------------------------------------------------------
// DATABASE TABLE: order_requests
// ---------------------------------------------------------------------------
// LCIMS needs a dedicated table to persist supplier reorder requests placed
// by Managers from the café UI. Each row links a café, supplier, and inventory
// item with a requested quantity and workflow status (pending → sent → fulfilled).
//
// Columns:
//   order_id           — primary key
//   cafe_id            — tenant scope (matches JWT cafe_id)
//   supplier_id        — FK to suppliers
//   item_id            — FK to inventory_items
//   item_name          — snapshot of item name at order time
//   quantity_requested — how much to reorder
//   unit               — unit of measure (kg, L, unit, etc.)
//   note               — optional message to the supplier
//   status             — pending | sent | fulfilled
//   created_at / updated_at — audit timestamps
//
// Run POST /api/orders/init-table once (Manager) to create the table in dev,
// or add the same DDL to database/lcims_schema.sql for production installs.
// ---------------------------------------------------------------------------

const CREATE_ORDER_REQUESTS_TABLE = `
CREATE TABLE IF NOT EXISTS order_requests (
    order_id     SERIAL PRIMARY KEY,
    cafe_id      INTEGER NOT NULL REFERENCES cafes(cafe_id) ON DELETE CASCADE,
    supplier_id  INTEGER NOT NULL REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
    item_id      INTEGER NOT NULL REFERENCES inventory_items(item_id) ON DELETE CASCADE,
    item_name    TEXT NOT NULL,
    quantity_requested NUMERIC(10,2) NOT NULL,
    unit         TEXT NOT NULL,
    note         TEXT,
    status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','fulfilled')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const ALLOWED_STATUSES = ['pending', 'sent', 'fulfilled'];

/**
 * @route  POST /api/orders/init-table
 * @desc   Create the order_requests table if it does not exist (dev bootstrap)
 * @access Manager, Admin
 */
router.post('/init-table', requireManager, async (req, res) => {
    try {
        // CREATE TABLE IF NOT EXISTS — safe to run multiple times during setup.
        await pool.query(CREATE_ORDER_REQUESTS_TABLE);
        res.json({ message: 'order_requests table ready' });
    } catch (err) {
        console.error('[orders] POST /init-table', err.message || err.code);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route  POST /api/orders
 * @desc   Place a new order request to a supplier for a specific item
 * @access Manager, Admin
 */
router.post('/', requireManager, async (req, res) => {
    try {
        const {
            supplier_id,
            item_id,
            item_name,
            quantity_requested,
            unit,
            note,
        } = req.body || {};

        // Step 1: parse numeric IDs and quantity from JSON (may arrive as strings).
        const supplierId = Number.parseInt(supplier_id, 10);
        const itemId = Number.parseInt(item_id, 10);
        const qty = Number.parseFloat(quantity_requested);

        // Step 2: required fields — supplier, item, and positive quantity.
        if (!Number.isInteger(supplierId) || supplierId <= 0) {
            return res.status(400).json({ error: 'supplier_id is required and must be a positive integer' });
        }
        if (!Number.isInteger(itemId) || itemId <= 0) {
            return res.status(400).json({ error: 'item_id is required and must be a positive integer' });
        }
        if (!Number.isFinite(qty) || qty <= 0) {
            return res.status(400).json({ error: 'quantity_requested is required and must be a positive number' });
        }
        if (!item_name || typeof item_name !== 'string' || !item_name.trim()) {
            return res.status(400).json({ error: 'item_name is required' });
        }
        if (!unit || typeof unit !== 'string' || !unit.trim()) {
            return res.status(400).json({ error: 'unit is required' });
        }

        const cafeId = req.user.cafe_id;

        // Step 3: INSERT — scope row to the Manager's café from the JWT.
        const result = await pool.query(
            `INSERT INTO order_requests (
                cafe_id, supplier_id, item_id, item_name,
                quantity_requested, unit, note, status
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
             RETURNING *`,
            [
                cafeId,
                supplierId,
                itemId,
                item_name.trim(),
                qty,
                unit.trim(),
                note != null && String(note).trim() !== '' ? String(note).trim() : null,
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        // FK violations (unknown supplier/item) surface as 23503.
        if (err.code === '23503') {
            return res.status(400).json({ error: 'Invalid supplier_id or item_id for this café' });
        }
        console.error('[orders] POST /', err.message || err.code);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route  GET /api/orders
 * @desc   List all order requests for this cafe, joined with supplier name
 * @access Private (any authenticated role: Manager, Staff, Admin)
 */
router.get('/', async (req, res) => {
    try {
        const cafeId = req.user.cafe_id;

        // JOIN suppliers for supplier_name; filter by café; newest orders first.
        const result = await pool.query(
            `SELECT o.order_id,
                    o.cafe_id,
                    o.supplier_id,
                    s.name AS supplier_name,
                    o.item_id,
                    o.item_name,
                    o.quantity_requested,
                    o.unit,
                    o.note,
                    o.status,
                    o.created_at,
                    o.updated_at
             FROM order_requests o
             INNER JOIN suppliers s ON s.supplier_id = o.supplier_id
             WHERE o.cafe_id = $1
             ORDER BY o.created_at DESC`,
            [cafeId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('[orders] GET /', err.message || err.code);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route  PATCH /api/orders/:order_id/status
 * @desc   Update order status (pending → sent → fulfilled)
 * @access Manager, Admin
 */
router.patch('/:order_id/status', requireManager, async (req, res) => {
    const orderId = parseId(req.params.order_id);
    if (orderId === null) {
        return res.status(404).json({ error: 'Order not found' });
    }

    try {
        const { status } = req.body || {};

        // Validate status against the CHECK constraint allowed values.
        if (!status || !ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({
                error: "status must be one of: 'pending', 'sent', 'fulfilled'",
            });
        }

        const cafeId = req.user.cafe_id;

        // UPDATE scoped by order_id AND cafe_id so one tenant cannot change another's order.
        const result = await pool.query(
            `UPDATE order_requests
             SET status = $1,
                 updated_at = NOW()
             WHERE order_id = $2
               AND cafe_id = $3
             RETURNING *`,
            [status, orderId, cafeId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('[orders] PATCH /:order_id/status', err.message || err.code);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

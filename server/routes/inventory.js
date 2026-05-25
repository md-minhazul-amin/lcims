// ============================================================================
// File:    routes/inventory.js
// Purpose: Inventory CRUD endpoints with stock movement logging and automatic
//          low-stock alerts. All reads and writes are scoped to the caller's
//          cafe_id from the JWT. Stock adjustments run in a single transaction
//          so quantity, stock_logs, and alerts stay consistent.
// Author:  The IT Crowd
// Date:    May 2026
// Project: LCIMS - Local Cafe Inventory Management System
// ============================================================================

const express = require('express');

const pool = require('../db');
const { verifyToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// Every route below requires a valid JWT (populates req.user).
router.use(verifyToken);

// parseId: URL params arrive as strings (e.g. "5" or "abc"). We only accept
// positive integers because item_id is a SERIAL primary key — rejecting NaN,
// zero, negatives, and non-numeric input early avoids useless DB round-trips
// and returns a clean 404 instead of a Postgres cast error.
function parseId(value) {
    const n = Number.parseInt(value, 10);
    return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * @route  GET /api/inventory
 * @desc   List all inventory items for the caller's cafe (with supplier name)
 * @access Private (any authenticated role: Manager, Staff, Admin)
 */
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT i.item_id, i.name, i.category, i.unit, i.quantity, i.threshold,
                    i.supplier_id, i.cafe_id, i.created_at, i.updated_at,
                    s.name AS supplier_name
             FROM inventory_items i
             LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
             WHERE i.cafe_id = $1
             ORDER BY i.name ASC`,
            [req.user.cafe_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[inventory] GET /', err.message || err.code);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route  GET /api/inventory/:id
 * @desc   Fetch one inventory item by id (404 if not in caller's cafe)
 * @access Private (any authenticated role)
 */
router.get('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(404).json({ error: 'Item not found' });
    }

    try {
        const result = await pool.query(
            `SELECT i.item_id, i.name, i.category, i.unit, i.quantity, i.threshold,
                    i.supplier_id, i.cafe_id, i.created_at, i.updated_at,
                    s.name AS supplier_name
             FROM inventory_items i
             LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
             WHERE i.item_id = $1 AND i.cafe_id = $2`,
            [id, req.user.cafe_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('[inventory] GET /:id', err.message || err.code);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route  POST /api/inventory
 * @desc   Create a new inventory item for the caller's cafe
 * @access Manager, Admin
 */
router.post('/', requireManager, async (req, res) => {
    try {
        const { name, category, unit, quantity, threshold, supplier_id } = req.body || {};

        if (!name || !category || !unit) {
            return res.status(400).json({ error: 'name, category, and unit are required' });
        }

        const result = await pool.query(
            `INSERT INTO inventory_items
                 (name, category, unit, quantity, threshold, supplier_id, cafe_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                name,
                category,
                unit,
                quantity ?? 0,
                threshold ?? 0,
                supplier_id ?? null,
                req.user.cafe_id,
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('[inventory] POST /', err.message || err.code);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route  PUT /api/inventory/:id
 * @desc   Replace all editable fields on an inventory item
 * @access Manager, Admin
 */
router.put('/:id', requireManager, async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(404).json({ error: 'Item not found' });
    }

    try {
        const { name, category, unit, quantity, threshold, supplier_id } = req.body || {};

        if (!name || !category || !unit) {
            return res.status(400).json({ error: 'name, category, and unit are required' });
        }

        const result = await pool.query(
            `UPDATE inventory_items
             SET name        = $1,
                 category    = $2,
                 unit        = $3,
                 quantity    = $4,
                 threshold   = $5,
                 supplier_id = $6,
                 updated_at  = NOW()
             WHERE item_id = $7 AND cafe_id = $8
             RETURNING *`,
            [
                name,
                category,
                unit,
                quantity ?? 0,
                threshold ?? 0,
                supplier_id ?? null,
                id,
                req.user.cafe_id,
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('[inventory] PUT /:id', err.message || err.code);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route  PATCH /api/inventory/:id/stock
 * @desc   Adjust stock quantity, write stock_logs row, create alert if below threshold
 * @access Private (any authenticated role — Staff may record usage/restock)
 */
router.patch('/:id/stock', async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(404).json({ error: 'Item not found' });
    }

    const { change_qty, reason } = req.body || {};
    if (
        change_qty === undefined ||
        change_qty === null ||
        !Number.isFinite(Number(change_qty))
    ) {
        return res
            .status(400)
            .json({ error: 'change_qty is required and must be a number' });
    }

    // pool.connect() instead of pool.query(): transactions (BEGIN/COMMIT/ROLLBACK)
    // must run on one dedicated connection. pool.query() may use a different
    // connection per call, so a transaction started on client A would not wrap
    // queries executed on client B — leading to partial updates.
    const client = await pool.connect();
    try {
        // BEGIN: start an explicit transaction; nothing is visible to other
        // sessions until COMMIT (or fully undone on ROLLBACK).
        await client.query('BEGIN');

        // Atomic UPDATE: apply change_qty to quantity in one statement
        // (quantity = quantity + $1). RETURNING * gives the post-update row
        // for logging and threshold checks. cafe_id in WHERE enforces tenancy.
        const updated = await client.query(
            `UPDATE inventory_items
             SET quantity   = quantity + $1,
                 updated_at = NOW()
             WHERE item_id = $2 AND cafe_id = $3
             RETURNING *`,
            [change_qty, id, req.user.cafe_id]
        );

        if (updated.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Item not found' });
        }

        const item = updated.rows[0];

        // stock_logs INSERT: audit trail — who changed stock, by how much, why.
        await client.query(
            `INSERT INTO stock_logs (item_id, user_id, change_qty, reason)
             VALUES ($1, $2, $3, $4)`,
            [item.item_id, req.user.user_id, change_qty, reason ?? null]
        );

        // alerts INSERT + threshold comparison: after the update, if on-hand
        // quantity is strictly below the item's reorder threshold, insert an
        // active alert so the dashboard and reports can surface low stock.
        if (Number(item.quantity) < Number(item.threshold)) {
            await client.query(
                `INSERT INTO alerts (item_id, status) VALUES ($1, 'active')`,
                [item.item_id]
            );
        }

        // COMMIT: persist all three writes together (quantity, log, alert).
        await client.query('COMMIT');
        res.json(item);
    } catch (err) {
        // ROLLBACK in catch: undo every statement in this transaction so we
        // never leave a half-applied stock change if logging or alerting fails.
        await client.query('ROLLBACK').catch(() => {});

        // err.code === '23514': PostgreSQL CHECK constraint violation — the
        // schema enforces quantity >= 0; a large negative change_qty triggers
        // this instead of storing invalid stock. Map to a clear 400 for the UI.
        if (err.code === '23514') {
            return res
                .status(400)
                .json({ error: 'Resulting quantity cannot be negative' });
        }
        console.error('[inventory] PATCH /:id/stock', err.message || err.code);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        // client.release() in finally: return the borrowed connection to the
        // pool whether we succeeded or failed — prevents connection leaks.
        client.release();
    }
});

/**
 * @route  DELETE /api/inventory/:id
 * @desc   Delete an inventory item (cascades to stock_logs and alerts)
 * @access Manager, Admin
 */
router.delete('/:id', requireManager, async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(404).json({ error: 'Item not found' });
    }

    try {
        const result = await pool.query(
            `DELETE FROM inventory_items
             WHERE item_id = $1 AND cafe_id = $2
             RETURNING item_id`,
            [id, req.user.cafe_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json({ message: 'Item deleted', item_id: result.rows[0].item_id });
    } catch (err) {
        console.error('[inventory] DELETE /:id', err.message || err.code);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route  GET /api/inventory/:id/logs
 * @desc   Stock movement history for one item (newest first, with user email)
 * @access Private (any authenticated role)
 */
router.get('/:id/logs', async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.json([]);
    }

    try {
        const result = await pool.query(
            `SELECT sl.log_id, sl.item_id, sl.user_id, sl.change_qty,
                    sl.reason, sl.timestamp,
                    u.email AS user_email
             FROM stock_logs sl
             INNER JOIN inventory_items ii
                 ON sl.item_id = ii.item_id AND ii.cafe_id = $2
             LEFT JOIN users u ON sl.user_id = u.user_id
             WHERE sl.item_id = $1
             ORDER BY sl.timestamp DESC`,
            [id, req.user.cafe_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[inventory] GET /:id/logs', err.message || err.code);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export the router for mounting in index.js: app.use('/api/inventory', inventoryRoutes).
module.exports = router;

const express = require('express');

const pool = require('../db');
const { verifyToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// All inventory routes require a valid JWT.
router.use(verifyToken);

// Parse and validate a positive integer URL param. Returns null if invalid.
function parseId(value) {
    const n = Number.parseInt(value, 10);
    return Number.isInteger(n) && n > 0 ? n : null;
}

// ---------------------------------------------------------------------------
// GET /api/inventory
// All items for the logged-in user's cafe, joined with supplier name.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// GET /api/inventory/:id
// Single item joined with supplier name. 404 if not found in user's cafe.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// POST /api/inventory   (Manager / Admin)
// Body: { name, category, unit, quantity?, threshold?, supplier_id? }
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// PUT /api/inventory/:id   (Manager / Admin)
// Replace all editable fields and refresh updated_at.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// PATCH /api/inventory/:id/stock   (any authenticated user)
// Body: { change_qty, reason? }
// Atomically: update quantity, log the change, raise an alert if below threshold.
// ---------------------------------------------------------------------------
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

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

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

        await client.query(
            `INSERT INTO stock_logs (item_id, user_id, change_qty, reason)
             VALUES ($1, $2, $3, $4)`,
            [item.item_id, req.user.user_id, change_qty, reason ?? null]
        );

        if (Number(item.quantity) < Number(item.threshold)) {
            await client.query(
                `INSERT INTO alerts (item_id, status) VALUES ($1, 'active')`,
                [item.item_id]
            );
        }

        await client.query('COMMIT');
        res.json(item);
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});

        // CHECK constraint violation -> would have pushed quantity negative.
        if (err.code === '23514') {
            return res
                .status(400)
                .json({ error: 'Resulting quantity cannot be negative' });
        }
        console.error('[inventory] PATCH /:id/stock', err.message || err.code);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// ---------------------------------------------------------------------------
// DELETE /api/inventory/:id   (Manager / Admin)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// GET /api/inventory/:id/logs   (any authenticated user)
// Stock-movement history for one item, joined with the acting user's email.
// INNER JOIN on inventory_items enforces cafe scoping.
// ---------------------------------------------------------------------------
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

module.exports = router;

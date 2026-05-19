const express = require('express');

const pool = require('../db');
const { verifyToken, requireManager } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

function parseId(value) {
    const n = Number.parseInt(value, 10);
    return Number.isInteger(n) && n > 0 ? n : null;
}

// ---------------------------------------------------------------------------
// GET /api/suppliers
// All suppliers for the caller's cafe, with a count of linked inventory items.
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.supplier_id, s.name, s.contact, s.phone, s.email,
                    s.cafe_id, s.created_at,
                    COUNT(i.item_id)::int AS item_count
             FROM suppliers s
             LEFT JOIN inventory_items i
                 ON i.supplier_id = s.supplier_id AND i.cafe_id = s.cafe_id
             WHERE s.cafe_id = $1
             GROUP BY s.supplier_id
             ORDER BY s.name ASC`,
            [req.user.cafe_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[suppliers] GET /', err.message || err.code);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---------------------------------------------------------------------------
// POST /api/suppliers   (Manager / Admin)
// Body: { name, contact?, phone?, email? }
// ---------------------------------------------------------------------------
router.post('/', requireManager, async (req, res) => {
    try {
        const { name, contact, phone, email } = req.body || {};
        if (!name) {
            return res.status(400).json({ error: 'name is required' });
        }

        const result = await pool.query(
            `INSERT INTO suppliers (name, contact, phone, email, cafe_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [name, contact ?? null, phone ?? null, email ?? null, req.user.cafe_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('[suppliers] POST /', err.message || err.code);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---------------------------------------------------------------------------
// PUT /api/suppliers/:id   (Manager / Admin)
// Body: { name, contact?, phone?, email? }
// ---------------------------------------------------------------------------
router.put('/:id', requireManager, async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(404).json({ error: 'Supplier not found' });
    }

    try {
        const { name, contact, phone, email } = req.body || {};
        if (!name) {
            return res.status(400).json({ error: 'name is required' });
        }

        const result = await pool.query(
            `UPDATE suppliers
             SET name    = $1,
                 contact = $2,
                 phone   = $3,
                 email   = $4
             WHERE supplier_id = $5 AND cafe_id = $6
             RETURNING *`,
            [name, contact ?? null, phone ?? null, email ?? null, id, req.user.cafe_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('[suppliers] PUT /:id', err.message || err.code);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---------------------------------------------------------------------------
// DELETE /api/suppliers/:id   (Manager / Admin)
// Linked inventory_items.supplier_id is set to NULL by the FK ON DELETE rule.
// ---------------------------------------------------------------------------
router.delete('/:id', requireManager, async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(404).json({ error: 'Supplier not found' });
    }

    try {
        const result = await pool.query(
            `DELETE FROM suppliers
             WHERE supplier_id = $1 AND cafe_id = $2
             RETURNING supplier_id`,
            [id, req.user.cafe_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        res.json({ message: 'Supplier deleted', supplier_id: result.rows[0].supplier_id });
    } catch (err) {
        console.error('[suppliers] DELETE /:id', err.message || err.code);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

// ============================================================================
// File:    routes/suppliers.js
// Purpose: Supplier directory CRUD endpoints for the LCIMS API. Lists
//          suppliers with per-supplier inventory counts, and lets Managers
//          create, update, and delete supplier records scoped to the caller's
//          cafe_id from the JWT.
// Author:  The IT Crowd
// Date:    May 2026
// Project: LCIMS - Local Cafe Inventory Management System
// ============================================================================

const express = require('express');

const pool = require('../db');
const { verifyToken, requireManager } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

// parseId: supplier_id in the URL must be a positive integer (SERIAL PK).
// Rejecting invalid values early returns 404 without hitting the database.
function parseId(value) {
    const n = Number.parseInt(value, 10);
    return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * @route  GET /api/suppliers
 * @desc   List all suppliers for the caller's cafe with item_count per supplier
 * @access Private (any authenticated role: Manager, Staff, Admin)
 */
router.get('/', async (req, res) => {
    try {
        // LEFT JOIN inventory_items: include every supplier even if it has zero
        // linked products (an INNER JOIN would drop suppliers with no items).
        // COUNT(i.item_id) counts only non-null item rows per supplier group, so
        // suppliers with no matches get item_count = 0 (COUNT(*) would wrongly
        // return 1 because GROUP BY still produces one row). The join also matches
        // cafe_id so we only count items belonging to this café, not another tenant.
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

/**
 * @route  POST /api/suppliers
 * @desc   Create a new supplier for the caller's cafe
 * @access Manager, Admin
 */
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

/**
 * @route  PUT /api/suppliers/:id
 * @desc   Update supplier contact details and name
 * @access Manager, Admin
 */
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

/**
 * @route  DELETE /api/suppliers/:id
 * @desc   Remove a supplier from the directory
 * @access Manager, Admin
 */
router.delete('/:id', requireManager, async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(404).json({ error: 'Supplier not found' });
    }

    try {
        // ON DELETE SET NULL (defined in lcims_schema.sql on
        // inventory_items.supplier_id): deleting a supplier does NOT delete
        // inventory items that referenced it. PostgreSQL automatically sets
        // supplier_id to NULL on those rows so stock records remain intact and
        // can be re-linked to a different supplier later.
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

// Export the router for mounting in index.js: app.use('/api/suppliers', suppliersRoutes).
module.exports = router;

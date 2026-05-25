// ============================================================================
// File:    routes/alerts.js
// Purpose: Low-stock alert management endpoints. Lists active alerts for the
//          caller's café (joined with inventory item details) and lets any
//          authenticated user mark an alert as resolved after restocking.
// Author:  The IT Crowd
// Date:    May 2026
// Project: LCIMS - Local Cafe Inventory Management System
// ============================================================================

const express = require('express');

const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Every alert route requires a valid JWT (populates req.user.cafe_id).
router.use(verifyToken);

// parseId: alert_id in the URL must be a positive integer (SERIAL PK).
// Rejecting invalid values early returns 404 without hitting the database.
function parseId(value) {
    const n = Number.parseInt(value, 10);
    return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * @route  GET /api/alerts
 * @desc   List all active low-stock alerts for the caller's cafe with item details
 * @access Private (any authenticated role: Manager, Staff, Admin)
 */
router.get('/', async (req, res) => {
    try {
        // INNER JOIN inventory_items: attach item_name, category, unit, quantity,
        // threshold for the Alerts page cards. Filter status = 'active' and
        // i.cafe_id so tenants only see their own café's alerts.
        const result = await pool.query(
            `SELECT a.alert_id,
                    a.item_id,
                    a.triggered_at,
                    a.status,
                    i.name     AS item_name,
                    i.category,
                    i.unit,
                    i.quantity,
                    i.threshold
             FROM alerts a
             INNER JOIN inventory_items i ON i.item_id = a.item_id
             WHERE a.status = 'active'
               AND i.cafe_id = $1
             ORDER BY a.triggered_at DESC`,
            [req.user.cafe_id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('[alerts] GET /', err.message || err.code);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route  PATCH /api/alerts/:alert_id/resolve
 * @desc   Mark one alert as resolved (status = 'resolved')
 * @access Private (any authenticated role)
 */
router.patch('/:alert_id/resolve', async (req, res) => {
    const alertId = parseId(req.params.alert_id);
    if (alertId === null) {
        return res.status(404).json({ error: 'Alert not found' });
    }

    try {
        // UPDATE via JOIN: only succeed if the alert's item belongs to this café.
        // Prevents resolving another tenant's alert by guessing alert_id.
        const result = await pool.query(
            `UPDATE alerts a
             SET status = 'resolved'
             FROM inventory_items i
             WHERE a.alert_id = $1
               AND a.item_id = i.item_id
               AND i.cafe_id = $2
             RETURNING a.alert_id, a.item_id, a.triggered_at, a.status`,
            [alertId, req.user.cafe_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('[alerts] PATCH /:alert_id/resolve', err.message || err.code);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export the router for mounting in index.js: app.use('/api/alerts', alertsRoutes).
module.exports = router;

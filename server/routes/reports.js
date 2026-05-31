// ============================================================================
// File:    routes/reports.js
// Purpose: Dashboard KPI metrics and date-ranged usage reports for the LCIMS
//          API. GET /dashboard aggregates six café-scoped queries into one
//          payload for the home page. GET /usage returns per-item consumption
//          vs restock totals over a user-selected date window for the Reports
//          bar chart.
// Author:  The IT Crowd
// Date:    May 2026
// Project: LCIMS - Local Cafe Inventory Management System
// ============================================================================

const express = require('express');

const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

// ISO_DATE: lightweight shape check for YYYY-MM-DD query params. We validate
// in Node before PostgreSQL so invalid input returns a clear 400 JSON message
// instead of a database error (SQLSTATE 22007/22008), avoids pointless query
// planning, and blocks malformed strings that could confuse date casting.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @route  GET /api/reports/dashboard
 * @desc   Return headline KPIs, recent stock activity, and low-stock item list
 * @access Private (any authenticated role: Manager, Staff, Admin)
 */
router.get('/dashboard', async (req, res) => {
    const cafeId = req.user.cafe_id;

    try {
        // Promise.all(): run 6 independent queries in parallel. Each pool.query
        // may use a different connection, so total latency is ~one round-trip
        // instead of six sequential waits — important for a snappy dashboard load.
        const [
            totalItemsQ,
            lowStockQ,
            suppliersQ,
            weekChangesQ,
            recentActivityQ,
            lowStockItemsQ,
        ] = await Promise.all([
            // totalItems: COUNT of all inventory_items rows for this café.
            pool.query(
                `SELECT COUNT(*)::int AS n
                 FROM inventory_items
                 WHERE cafe_id = $1`,
                [cafeId]
            ),
            // lowStock: COUNT of items where quantity < threshold (KPI badge).
            pool.query(
                `SELECT COUNT(*)::int AS n
                 FROM inventory_items
                 WHERE cafe_id = $1 AND quantity < threshold`,
                [cafeId]
            ),
            // suppliers: COUNT of supplier directory entries for this café.
            pool.query(
                `SELECT COUNT(*)::int AS n
                 FROM suppliers
                 WHERE cafe_id = $1`,
                [cafeId]
            ),
            // weekChanges: COUNT of stock_logs in the last 7 days (scoped via
            // JOIN to inventory_items so only this café's movements count).
            pool.query(
                `SELECT COUNT(*)::int AS n
                 FROM stock_logs sl
                 INNER JOIN inventory_items i ON i.item_id = sl.item_id
                 WHERE i.cafe_id = $1
                   AND sl.timestamp >= NOW() - INTERVAL '7 days'`,
                [cafeId]
            ),
            // recentActivity: up to 10 newest stock_logs with item name and
            // user email for the dashboard activity feed.
            pool.query(
                `SELECT sl.log_id, sl.item_id, sl.change_qty, sl.reason, sl.timestamp,
                        sl.user_id,
                        i.name  AS item_name,
                        u.email AS user_email
                 FROM stock_logs sl
                 INNER JOIN inventory_items i ON i.item_id = sl.item_id
                 LEFT  JOIN users u           ON u.user_id = sl.user_id
                 WHERE i.cafe_id = $1
                 ORDER BY sl.timestamp DESC
                 LIMIT 10`,
                [cafeId]
            ),
            // lowStockItems: full rows (not just a count) for items below
            // threshold so the dashboard can list names, qty, and units.
            pool.query(
                `SELECT item_id, name, category, quantity, threshold, unit
                 FROM inventory_items
                 WHERE cafe_id = $1 AND quantity < threshold
                 ORDER BY name ASC`,
                [cafeId]
            ),
        ]);

        res.json({
            total_items:     totalItemsQ.rows[0].n,
            low_stock:       lowStockQ.rows[0].n,
            suppliers:       suppliersQ.rows[0].n,
            week_changes:    weekChangesQ.rows[0].n,
            recent_activity: recentActivityQ.rows,
            low_stock_items: lowStockItemsQ.rows,
        });
    } catch (err) {
        console.error('[reports] GET /dashboard', err.message || err.code);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route  GET /api/reports/usage
 * @desc   Per-item usage and restock totals between from and to (inclusive)
 * @access Private (any authenticated role)
 */
router.get('/usage', async (req, res) => {
    const { from, to } = req.query;

    // from/to validation: both query params required before any DB work.
    if (!from || !to) {
        return res
            .status(400)
            .json({ error: 'from and to query parameters are required (YYYY-MM-DD)' });
    }
    // Must match ISO_DATE shape (YYYY-MM-DD); catches typos and wrong formats
    // without relying on PostgreSQL to reject them.
    if (!ISO_DATE.test(from) || !ISO_DATE.test(to)) {
        return res
            .status(400)
            .json({ error: 'from and to must be YYYY-MM-DD dates' });
    }
    // ISO date strings compare lexicographically in calendar order.
    if (from > to) {
        return res.status(400).json({ error: 'from must be on or before to' });
    }

    try {
        // COALESCE + SUM + CASE: one grouped query splits stock_logs by sign of
        // change_qty:
        //   total_used  — negative change_qty = usage/consumption; SUM(ABS(...))
        //   total_added — positive change_qty = restocking/deliveries; SUM as-is
        // COALESCE(..., 0) turns NULL (no matching logs in the CASE branch) into 0.
        //
        // Inclusive date range: timestamp >= from::date starts at midnight on
        // "from"; timestamp < (to::date + 1 day) includes every moment through
        // the end of "to" without using <= timestamp at 23:59:59 (timezone-safe).
        const result = await pool.query(
            `SELECT i.item_id,
                    i.name,
                    i.category,
                    i.unit,
                    COALESCE(SUM(CASE WHEN sl.change_qty < 0
                                      THEN ABS(sl.change_qty) END), 0)::numeric AS total_used,
                    COALESCE(SUM(CASE WHEN sl.change_qty > 0
                                      THEN sl.change_qty END), 0)::numeric AS total_added
             FROM inventory_items i
             INNER JOIN stock_logs sl
                 ON sl.item_id = i.item_id
                AND sl.timestamp >= $2::date
                AND sl.timestamp <  ($3::date + INTERVAL '1 day')
             WHERE i.cafe_id = $1
             GROUP BY i.item_id, i.name, i.category, i.unit
             ORDER BY total_used DESC, i.name ASC`,
            [req.user.cafe_id, from, to]
        );

        res.json(result.rows);
    } catch (err) {
        if (err.code === '22007' || err.code === '22008') {
            return res
                .status(400)
                .json({ error: 'Invalid date value' });
        }
        console.error('[reports] GET /usage', err.message || err.code);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route  GET /api/reports/notifications
 * @desc   Returns all active low-stock alerts for the manager's cafe
 *         to display as popup notifications on the Dashboard on login.
 * @access Private (any authenticated role)
 */
router.get('/notifications', async (req, res) => {
    // café scope from JWT — same tenant isolation as /dashboard and /usage.
    const cafeId = req.user.cafe_id;

    try {
        // Step 1: JOIN alerts → inventory_items so each row includes live stock
        // fields (name, category, unit, quantity, threshold) for popup text.
        // Step 2: WHERE status = 'active' — only unresolved low-stock events.
        // Step 3: AND i.cafe_id = $1 — caller cannot see another café's alerts.
        // Step 4: ORDER BY triggered_at DESC — newest notifications first.
        const result = await pool.query(
            `SELECT a.alert_id,
                    a.item_id,
                    i.name     AS item_name,
                    i.category,
                    i.unit,
                    i.quantity,
                    i.threshold,
                    a.triggered_at
             FROM alerts a
             INNER JOIN inventory_items i ON i.item_id = a.item_id
             WHERE a.status = 'active'
               AND i.cafe_id = $1
             ORDER BY a.triggered_at DESC`,
            [cafeId]
        );

        // JSON array — empty when no active alerts (Dashboard shows no popups).
        res.json(result.rows);
    } catch (err) {
        console.error('[reports] GET /notifications', err.message || err.code);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export the router for mounting in index.js: app.use('/api/reports', reportsRoutes).
module.exports = router;

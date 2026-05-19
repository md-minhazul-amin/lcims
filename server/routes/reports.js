const express = require('express');

const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

// Simple YYYY-MM-DD check so we can reject bad params before hitting Postgres.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// GET /api/reports/dashboard
// One JSON object with the headline metrics for the caller's cafe.
// ---------------------------------------------------------------------------
router.get('/dashboard', async (req, res) => {
    const cafeId = req.user.cafe_id;

    try {
        const [
            totalItemsQ,
            lowStockQ,
            suppliersQ,
            weekChangesQ,
            recentActivityQ,
            lowStockItemsQ,
        ] = await Promise.all([
            pool.query(
                `SELECT COUNT(*)::int AS n
                 FROM inventory_items
                 WHERE cafe_id = $1`,
                [cafeId]
            ),
            pool.query(
                `SELECT COUNT(*)::int AS n
                 FROM inventory_items
                 WHERE cafe_id = $1 AND quantity < threshold`,
                [cafeId]
            ),
            pool.query(
                `SELECT COUNT(*)::int AS n
                 FROM suppliers
                 WHERE cafe_id = $1`,
                [cafeId]
            ),
            pool.query(
                `SELECT COUNT(*)::int AS n
                 FROM stock_logs sl
                 INNER JOIN inventory_items i ON i.item_id = sl.item_id
                 WHERE i.cafe_id = $1
                   AND sl.timestamp >= NOW() - INTERVAL '7 days'`,
                [cafeId]
            ),
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

// ---------------------------------------------------------------------------
// GET /api/reports/usage?from=YYYY-MM-DD&to=YYYY-MM-DD
// Per-item usage and restock totals over the date window.
// Window is inclusive on both ends (covers the full "to" day).
// Only items with at least one stock_log in the window are returned.
// ---------------------------------------------------------------------------
router.get('/usage', async (req, res) => {
    const { from, to } = req.query;

    if (!from || !to) {
        return res
            .status(400)
            .json({ error: 'from and to query parameters are required (YYYY-MM-DD)' });
    }
    if (!ISO_DATE.test(from) || !ISO_DATE.test(to)) {
        return res
            .status(400)
            .json({ error: 'from and to must be YYYY-MM-DD dates' });
    }
    if (from > to) {
        return res.status(400).json({ error: 'from must be on or before to' });
    }

    try {
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

module.exports = router;

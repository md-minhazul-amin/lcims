// ============================================================================
// File:    routes/ai.js
// Purpose: AI-powered reorder suggestions using OpenAI gpt-3.5-turbo with an
//          offline demo fallback. When OPENAI_API_KEY is missing or a placeholder,
//          buildDemoSuggestions returns deterministic advice from real inventory
//          data so the AI Insights page works without billing an API call.
// Author:  The IT Crowd
// Date:    May 2026
// Project: LCIMS - Local Cafe Inventory Management System
// ============================================================================

const express = require('express');
const OpenAI = require('openai');

const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

// isPlaceholderKey: detect fake or unset keys BEFORE calling OpenAI. The
// .env.example ships with "your_openai_api_key_here"; students may leave that
// or paste invalid values. Catching them here switches to demo mode (or avoids
// a paid 401 round-trip) instead of surfacing a cryptic SDK error to the UI.
function isPlaceholderKey(key) {
    if (!key || typeof key !== 'string') return true;
    const trimmed = key.trim();
    if (!trimmed) return true;
    if (trimmed === 'your_openai_api_key_here') return true;
    return !trimmed.startsWith('sk-');
}

// getOpenAIClient: lazy-init pattern — the OpenAI client is NOT created at
// module load time. That way importing this file never throws when the key is
// missing; only POST /reorder-suggestions needs AI. cachedClient + cachedKey
// reuse one client instance per process until OPENAI_API_KEY changes.
let cachedClient = null;
let cachedKey = null;
function getOpenAIClient() {
    const key = process.env.OPENAI_API_KEY;
    if (isPlaceholderKey(key)) return null;
    if (cachedClient && cachedKey === key) return cachedClient;
    cachedClient = new OpenAI({ apiKey: key });
    cachedKey = key;
    return cachedClient;
}

// ---------------------------------------------------------------------------
// Demo mode (offline fallback)
// ---------------------------------------------------------------------------
function addDays(isoDate, days) {
    const d = new Date(isoDate + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

function buildDemoSuggestions(items, today) {
    return items.map((it) => {
        const current = Number(it.current_qty) || 0;
        const threshold = Number(it.threshold) || 0;
        const used7d = Number(it.used_last_7_days) || 0;

        // Weekly usage: used_last_7_days is already summed over 7 days from
        // stock_logs (negative change_qty only), so we treat it as units/week.
        const weeklyUse = used7d;

        // weeksLeft: how many weeks current stock lasts at the recent pace.
        // current / weeklyUse; if weeklyUse is 0, Infinity (no burn rate → not urgent
        // from usage alone, threshold check may still apply).
        const weeksLeft = weeklyUse > 0 ? current / weeklyUse : Infinity;
        const supplier = it.supplier_name || 'preferred supplier';

        // Urgent: below reorder threshold OR fewer than ~3.5 days of cover
        // (weeksLeft < 0.5). reorder_by = today, non-zero reorder_qty.
        if (current < threshold || weeksLeft < 0.5) {
            const refillTarget = Math.max(threshold * 2, weeklyUse * 2);
            const reorderQty = Math.max(1, Math.ceil(refillTarget - current));
            const daysLeftStr =
                weeklyUse > 0
                    ? `roughly ${Math.max(1, Math.round(weeksLeft * 7))} day(s) of stock left at the current pace`
                    : 'no recent usage data but stock is below the reorder threshold';
            return {
                item_name: it.name,
                reorder_qty: reorderQty,
                reorder_unit: it.unit,
                reorder_by: today,
                reason:
                    `Below reorder threshold (${current} / ${threshold} ${it.unit}); ` +
                    `${daysLeftStr}. Place an order with ${supplier} today.`,
            };
        }

        // Soon: stock within ~2.2× threshold OR under 2 weeks of cover.
        // reorder_by = today + 3 days, meaningful reorder_qty.
        if (current < threshold * 2.2 || weeksLeft < 2) {
            const refillTarget = threshold * 2 + weeklyUse;
            const reorderQty = Math.max(
                Math.ceil(threshold),
                Math.ceil(refillTarget - current)
            );
            return {
                item_name: it.name,
                reorder_qty: reorderQty,
                reorder_unit: it.unit,
                reorder_by: addDays(today, 3),
                reason:
                    `Approaching the ${threshold} ${it.unit} threshold ` +
                    `(currently ${current} ${it.unit}, usage ~${weeklyUse.toFixed(1)} ${it.unit}/week). ` +
                    `Plan a top-up with ${supplier} in the next 2-3 days.`,
            };
        }

        // Normal: comfortably above threshold with adequate weeks of cover.
        // reorder_qty = 0; reorder_by = today + 7 for a future review date.
        return {
            item_name: it.name,
            reorder_qty: 0,
            reorder_unit: it.unit,
            reorder_by: addDays(today, 7),
            reason:
                weeklyUse > 0
                    ? `Stock comfortably above threshold (${current} / ${threshold} ${it.unit}) ` +
                      `given recent usage of ~${weeklyUse.toFixed(1)} ${it.unit}/week.`
                    : `Plenty of stock (${current} / ${threshold} ${it.unit}) and no usage recorded in the last 7 days.`,
        };
    });
}

// stripJsonFences: models sometimes wrap JSON in ``` fences; remove before parse.
function stripJsonFences(text) {
    if (typeof text !== 'string') return text;
    return text
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim();
}

/**
 * @route  POST /api/ai/reorder-suggestions
 * @desc   Return per-item reorder suggestions (OpenAI or offline demo mode)
 * @access Private (any authenticated role)
 */
router.post('/reorder-suggestions', async (req, res) => {
    try {
        const client = getOpenAIClient();

        // Step 1 — Fetch inventory: all items for this café plus supplier name
        // and used_last_7_days (sum of ABS(negative change_qty) in last 7 days).
        const { rows: items } = await pool.query(
            `SELECT i.item_id,
                    i.name,
                    i.category,
                    i.unit,
                    i.quantity  AS current_qty,
                    i.threshold,
                    s.name      AS supplier_name,
                    COALESCE(
                        SUM(ABS(sl.change_qty)) FILTER (
                            WHERE sl.change_qty < 0
                              AND sl.timestamp > NOW() - INTERVAL '7 days'
                        ),
                        0
                    ) AS used_last_7_days
             FROM inventory_items i
             LEFT JOIN suppliers  s  ON i.supplier_id = s.supplier_id
             LEFT JOIN stock_logs sl ON sl.item_id     = i.item_id
             WHERE i.cafe_id = $1
             GROUP BY i.item_id, s.name
             ORDER BY i.name ASC`,
            [req.user.cafe_id]
        );

        if (items.length === 0) {
            return res.json({ suggestions: [], items_analysed: 0 });
        }

        const today = new Date().toISOString().slice(0, 10);

        // Step 2 — Demo mode check: no real API key → buildDemoSuggestions from
        // the same rows we would send to OpenAI; response includes demo: true.
        if (!client) {
            console.log(
                `[ai/reorder] DEMO MODE (no OPENAI_API_KEY set) - returning ` +
                `${items.length} computed suggestions`
            );
            const demoSuggestions = buildDemoSuggestions(items, today);
            return res.json({
                suggestions: demoSuggestions,
                items_analysed: items.length,
                demo: true,
            });
        }

        // Step 3 — Build prompt: bullet list of inventory + strict JSON schema
        // so the model returns parseable reorder_qty / reorder_by / reason fields.
        const inventoryLines = items
            .map((it) => {
                const supplier = it.supplier_name || 'no supplier';
                return (
                    `- ${it.name} (${it.category}): ` +
                    `current ${it.current_qty} ${it.unit}, ` +
                    `threshold ${it.threshold} ${it.unit}, ` +
                    `used ${it.used_last_7_days} ${it.unit} in last 7 days, ` +
                    `supplier: ${supplier}`
                );
            })
            .join('\n');

        const userPrompt =
            `Today is ${today}.\n\n` +
            `Current inventory for a café:\n${inventoryLines}\n\n` +
            `For EACH item above, suggest a reorder. Consider current stock vs ` +
            `threshold, projected usage from the last 7 days, and typical supplier ` +
            `lead times. If an item has plenty of stock, set reorder_qty to 0 and ` +
            `explain why in the reason field. Use the item's existing unit.\n\n` +
            `Respond with valid JSON only, as an array in this exact shape ` +
            `(one entry per item, in the same order as above):\n` +
            `[\n` +
            `  {\n` +
            `    "item_name": "<exact item name from the list>",\n` +
            `    "reorder_qty": <number>,\n` +
            `    "reorder_unit": "<unit>",\n` +
            `    "reorder_by": "<YYYY-MM-DD>",\n` +
            `    "reason": "<short justification>"\n` +
            `  }\n` +
            `]`;

        // Step 4 — Call OpenAI: gpt-3.5-turbo chat completion, low temperature.
        const completion = await client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            temperature: 0.3,
            messages: [
                {
                    role: 'system',
                    content:
                        'You are a smart inventory assistant for a café. ' +
                        'Always respond with valid JSON only.',
                },
                { role: 'user', content: userPrompt },
            ],
        });

        const rawContent = completion.choices?.[0]?.message?.content ?? '';
        const cleaned = stripJsonFences(rawContent);

        // Step 5 — Parse response: JSON.parse after fence strip; accept bare
        // array or { suggestions: [...] }; then return suggestions + items_analysed.
        let parsed;
        try {
            parsed = JSON.parse(cleaned);
        } catch (parseErr) {
            console.error('[ai/reorder] JSON parse failed:', parseErr.message);
            console.error('[ai/reorder] Raw model output:', rawContent);
            return res.status(500).json({ error: 'AI response was not valid JSON' });
        }

        let suggestions;
        if (Array.isArray(parsed)) {
            suggestions = parsed;
        } else if (parsed && Array.isArray(parsed.suggestions)) {
            suggestions = parsed.suggestions;
        } else {
            console.error('[ai/reorder] Unexpected response shape:', parsed);
            return res.status(500).json({ error: 'AI response shape was unexpected' });
        }

        return res.json({
            suggestions,
            items_analysed: items.length,
        });
    } catch (err) {
        console.error('[ai/reorder]', err.status || '', err.message || err.code || err);

        const status = err.status || err.response?.status;

        // OpenAI error handling — map HTTP status to actionable UI messages:
        // 401 = bad or revoked API key (wrong OPENAI_API_KEY in .env).
        if (status === 401) {
            return res.status(503).json({
                error:
                    'OpenAI rejected the API key (401). Check OPENAI_API_KEY in ' +
                    'lcims/server/.env -- it must be a real key from ' +
                    'https://platform.openai.com/api-keys.',
            });
        }
        // 429 = rate limit or billing quota exceeded.
        if (status === 429) {
            return res.status(503).json({
                error:
                    'OpenAI rate limit or quota exceeded (429). Check your ' +
                    'billing/usage at https://platform.openai.com/usage, then ' +
                    'try again shortly.',
            });
        }
        // 404 (model in message) = key valid but gpt-3.5-turbo not available to this account.
        if (status === 404 && /model/i.test(err.message || '')) {
            return res.status(503).json({
                error:
                    'OpenAI says the model is not available to this key (404). ' +
                    'Try a different model in routes/ai.js.',
            });
        }
        // 5xx = OpenAI server error; upstream is down, retry later.
        if (status && status >= 500) {
            return res.status(502).json({
                error: 'OpenAI service is unavailable right now. Try again shortly.',
            });
        }
        if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
            return res.status(502).json({
                error: 'Could not reach OpenAI (network error). Check your internet connection.',
            });
        }
        return res.status(500).json({
            error: err.message ? `AI request failed: ${err.message}` : 'Internal server error',
        });
    }
});

// Export the router for mounting in index.js: app.use('/api/ai', aiRoutes).
module.exports = router;

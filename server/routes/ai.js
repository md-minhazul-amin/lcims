const express = require('express');
const OpenAI = require('openai');

const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

// Treat blank, the .env placeholder, or anything obviously-not-an-OpenAI-key
// as "not configured" so we can return a clear error instead of letting OpenAI
// reject the call with a generic 401.
function isPlaceholderKey(key) {
    if (!key || typeof key !== 'string') return true;
    const trimmed = key.trim();
    if (!trimmed) return true;
    if (trimmed === 'your_openai_api_key_here') return true;
    return !trimmed.startsWith('sk-');
}

// Lazily construct the OpenAI client so a missing key only fails the AI route,
// not every other endpoint that requires this module to load. Cache by the key
// value so editing .env (nodemon restart not strictly needed) is picked up.
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
// Demo-mode fallback: when no real OPENAI_API_KEY is configured we still
// return realistic, deterministic suggestions computed from the actual
// inventory + last-7-days usage. This lets reviewers exercise the AI Insights
// page (and capture screenshots) without paying for an OpenAI call.
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
        const weeklyUse = used7d; // already a 7-day window
        const weeksLeft = weeklyUse > 0 ? current / weeklyUse : Infinity;
        const supplier = it.supplier_name || 'preferred supplier';

        // Urgent: below threshold, or fewer than ~3 days of stock at current pace.
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

        // Soon: within ~2x threshold or under two weeks of cover.
        if (current < threshold * 2.2 || weeksLeft < 2) {
            // Refill to ~2x threshold plus a week of usage cover; always order at
            // least one full threshold's worth so the card shows a meaningful qty.
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

        // Later / not needed.
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

// Strip ```json ... ``` (or plain ``` ... ```) fences that some LLMs wrap JSON in.
function stripJsonFences(text) {
    if (typeof text !== 'string') return text;
    return text
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim();
}

// ---------------------------------------------------------------------------
// POST /api/ai/reorder-suggestions
// 1. Pulls inventory items for the caller's cafe with 7-day usage.
// 2. Asks gpt-3.5-turbo for a per-item reorder suggestion.
// 3. Parses the JSON response (tolerating Markdown fences).
// 4. Returns { suggestions, items_analysed }.
// ---------------------------------------------------------------------------
router.post('/reorder-suggestions', async (req, res) => {
    try {
        const client = getOpenAIClient();

        // --- 1. Inventory + 7-day usage -------------------------------------
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

        // --- 1b. Demo-mode short-circuit ------------------------------------
        // No real OpenAI key configured -> serve deterministic demo suggestions
        // computed from the same data the real prompt would use. Logged on the
        // server so reviewers know it's running in demo mode.
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

        // --- 2. Build prompt ------------------------------------------------

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

        // --- 3. Call OpenAI -------------------------------------------------
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

        // --- 4. Parse + normalise -------------------------------------------
        let parsed;
        try {
            parsed = JSON.parse(cleaned);
        } catch (parseErr) {
            console.error('[ai/reorder] JSON parse failed:', parseErr.message);
            console.error('[ai/reorder] Raw model output:', rawContent);
            return res.status(500).json({ error: 'AI response was not valid JSON' });
        }

        // Tolerate either a bare array or { suggestions: [...] }
        let suggestions;
        if (Array.isArray(parsed)) {
            suggestions = parsed;
        } else if (parsed && Array.isArray(parsed.suggestions)) {
            suggestions = parsed.suggestions;
        } else {
            console.error('[ai/reorder] Unexpected response shape:', parsed);
            return res.status(500).json({ error: 'AI response shape was unexpected' });
        }

        // --- 5. Respond -----------------------------------------------------
        return res.json({
            suggestions,
            items_analysed: items.length,
        });
    } catch (err) {
        console.error('[ai/reorder]', err.status || '', err.message || err.code || err);

        // OpenAI SDK errors expose `status` and `code`. Map the common ones to
        // friendlier messages so the UI can show something actionable.
        const status = err.status || err.response?.status;
        if (status === 401) {
            return res.status(503).json({
                error:
                    'OpenAI rejected the API key (401). Check OPENAI_API_KEY in ' +
                    'lcims/server/.env -- it must be a real key from ' +
                    'https://platform.openai.com/api-keys.',
            });
        }
        if (status === 429) {
            return res.status(503).json({
                error:
                    'OpenAI rate limit or quota exceeded (429). Check your ' +
                    'billing/usage at https://platform.openai.com/usage, then ' +
                    'try again shortly.',
            });
        }
        if (status === 404 && /model/i.test(err.message || '')) {
            return res.status(503).json({
                error:
                    'OpenAI says the model is not available to this key (404). ' +
                    'Try a different model in routes/ai.js.',
            });
        }
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

module.exports = router;

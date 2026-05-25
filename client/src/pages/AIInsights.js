/**
 * @file AIInsights.js
 * @description AI-powered reorder suggestions page using OpenAI gpt-3.5-turbo
 * @author The IT Crowd
 * @date May 2026
 * @project LCIMS - Local Cafe Inventory Management System
 * @course CPRO306 - Capstone Project, Kent Institute Australia
 */

// ============================================================================
// File:    pages/AIInsights.js
// Purpose: AI reorder suggestions UI — POST /api/ai/reorder-suggestions
//          (OpenAI gpt-3.5-turbo or server demo mode). Cards show urgency,
//          reorder qty, and reason per inventory item.
// Author:  The IT Crowd
// Date:    May 2026
// Project: LCIMS - Local Cafe Inventory Management System
// ============================================================================

import { useState } from 'react';
import api from '../api/axios';

// --- styles (all inline; no CSS file) --------------------------------------

const C = {
    blue:    '#3d6acb',
    blueDk:  '#1e3a5f',
    ink:     '#1e3a5f',
    sub:     '#5d6a78',
    grey:    '#7b8794',
    line:    '#eef0f2',
    border:  '#cbd2d9',
    bgPanel: '#ffffff',
    bgQty:   '#eaf1ff',
    fgQty:   '#1e3a5f',
    okBg:    '#dff5e6',
    okFg:    '#1d703f',
    okLine:  '#b6e3c8',
    lowBg:   '#fce8e6',
    lowFg:   '#a8262b',
    warnBg:  '#fff3df',
    warnFg:  '#8a5300',
    info:    '#eaf1ff',
    infoFg:  '#2745a4',
};

const styles = {
    title: {
        margin: '0 0 0.3rem',
        fontSize: '1.6rem',
        color: C.ink,
    },
    subtitle: {
        margin: '0 0 1.25rem',
        color: C.sub,
        fontSize: '0.95rem',
    },
    generateCard: {
        background: '#ffffff',
        borderRadius: 12,
        padding: '2rem 2.25rem',
        boxShadow: '0 1px 3px rgba(15,30,60,0.06)',
        marginBottom: '1.25rem',
        textAlign: 'center',
        maxWidth: 720,
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    brain: {
        fontSize: '3rem',
        lineHeight: 1,
        marginBottom: '0.5rem',
    },
    genHeading: {
        margin: '0 0 0.5rem',
        fontSize: '1.25rem',
        fontWeight: 600,
        color: C.ink,
    },
    genExplain: {
        margin: '0 auto 1.25rem',
        maxWidth: 540,
        color: C.sub,
        fontSize: '0.92rem',
        lineHeight: 1.55,
    },
    genBtn: {
        background: `linear-gradient(135deg, ${C.blueDk} 0%, ${C.blue} 100%)`,
        color: '#ffffff',
        border: 'none',
        padding: '0.75rem 1.6rem',
        borderRadius: 8,
        fontWeight: 600,
        fontSize: '0.95rem',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(30, 58, 95, 0.25)',
    },
    genBtnDisabled: {
        background: '#9aa5b1',
        cursor: 'wait',
        boxShadow: 'none',
    },
    successMsg: {
        marginTop: '1rem',
        background: C.okBg,
        color: C.okFg,
        border: `1px solid ${C.okLine}`,
        padding: '0.55rem 0.85rem',
        borderRadius: 6,
        fontSize: '0.88rem',
        display: 'inline-block',
    },
    errorBox: {
        background: C.lowBg,
        color: C.lowFg,
        border: `1px solid #f4b1ad`,
        padding: '0.75rem 1rem',
        borderRadius: 6,
        marginBottom: '1.25rem',
        maxWidth: 720,
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '1rem',
        marginBottom: '1.25rem',
    },
    card: {
        background: C.bgPanel,
        borderRadius: 8,
        padding: '1.15rem 1.3rem 1.1rem',
        boxShadow: '0 1px 3px rgba(15,30,60,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
    },
    cardHead: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '0.75rem',
    },
    cardName: {
        margin: 0,
        fontSize: '1.05rem',
        fontWeight: 700,
        color: C.ink,
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    urgency: (tone) => ({
        background: tone.bg,
        color: tone.fg,
        padding: '0.22rem 0.7rem',
        borderRadius: 999,
        fontSize: '0.78rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        flexShrink: 0,
    }),
    qtyBox: {
        background: C.bgQty,
        borderRadius: 8,
        padding: '0.7rem 0.95rem',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: '0.75rem',
    },
    qtyLabel: {
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: C.fgQty,
        opacity: 0.75,
    },
    qtyValue: {
        fontSize: '1.4rem',
        fontWeight: 700,
        color: C.fgQty,
        fontVariantNumeric: 'tabular-nums',
    },
    reason: {
        margin: 0,
        color: '#3e4c59',
        fontSize: '0.88rem',
        lineHeight: 1.55,
        display: 'flex',
        gap: '0.55rem',
        alignItems: 'flex-start',
    },
    reasonIcon: { flexShrink: 0 },
    infoBox: {
        background: C.info,
        color: C.infoFg,
        border: `1px solid #c8d6f3`,
        padding: '0.85rem 1.1rem',
        borderRadius: 8,
        fontSize: '0.85rem',
        lineHeight: 1.5,
        display: 'flex',
        gap: '0.65rem',
        alignItems: 'flex-start',
    },
    emptyState: {
        textAlign: 'center',
        color: C.grey,
        padding: '2rem',
    },
};

// --- urgency helper: map reorder_qty + reorder_by to UI badge colours --------

const URGENT = { bg: C.lowBg,  fg: C.lowFg,  label: '⚠' };       // red
const SOON   = { bg: C.warnBg, fg: C.warnFg, label: '⏰' };       // orange
const LATER  = { bg: C.okBg,   fg: C.okFg,   label: '✓' };       // green

// computeUrgency: qty <= 0 => "Not needed"; else days until reorder_by drives tier.
function computeUrgency(suggestion) {
    const qty = parseFloat(suggestion.reorder_qty);
    if (!Number.isFinite(qty) || qty <= 0) {
        return { ...LATER, text: 'Not needed' };
    }

    const reorderBy = suggestion.reorder_by;
    if (!reorderBy) {
        return { ...LATER, text: 'Soon' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(reorderBy + 'T00:00:00');

    if (Number.isNaN(target.getTime())) {
        return { ...LATER, text: reorderBy };
    }

    const days = Math.round((target - today) / (1000 * 60 * 60 * 24));

    if (days < 0)   return { ...URGENT, text: `Overdue (${reorderBy})` };
    if (days === 0) return { ...URGENT, text: 'Today' };
    if (days === 1) return { ...URGENT, text: 'Tomorrow' };
    if (days <= 3)  return { ...SOON,   text: `In ${days} days` };
    return            { ...LATER,  text: `In ${days} days` };
}

// --- page ------------------------------------------------------------------

export default function AIInsights() {
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');
    const [suggestions, setSuggestions] = useState(null);
    const [itemsAnalysed, setItemsAnalysed] = useState(0);

    // handleGenerate: one-shot analysis; server may return demo: true without OpenAI.
    async function handleGenerate() {
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/ai/reorder-suggestions');
            setSuggestions(res.data?.suggestions || []);
            setItemsAnalysed(res.data?.items_analysed ?? 0);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate AI suggestions');
            setSuggestions(null);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <h1 style={styles.title}>🤖 AI Reorder Insights</h1>
            <p style={styles.subtitle}>
                Uses OpenAI to analyse your current stock levels, weekly usage trends,
                and reorder thresholds — then suggests how much of each item to reorder
                and by when.
            </p>

            {/* Central generate card -------------------------------- */}
            <div style={styles.generateCard}>
                <div style={styles.brain}>🧠</div>
                <h2 style={styles.genHeading}>Smart Reorder Analysis</h2>
                <p style={styles.genExplain}>
                    The AI considers each item's current quantity, its reorder threshold,
                    how much was used in the last 7 days, and typical supplier lead
                    times. Click below to generate a fresh round of suggestions for the
                    whole inventory.
                </p>

                <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={loading}
                    style={loading ? { ...styles.genBtn, ...styles.genBtnDisabled } : styles.genBtn}
                >
                    {loading ? '⏳ Analysing inventory...' : '✨ Generate AI Suggestions'}
                </button>

                {!loading && suggestions !== null && !error && (
                    <div style={styles.successMsg}>
                        ✅ Analysed {itemsAnalysed} inventory item
                        {itemsAnalysed === 1 ? '' : 's'}
                    </div>
                )}
            </div>

            {/* Error box -------------------------------------------- */}
            {error && <div style={styles.errorBox}>⚠ {error}</div>}

            {/* Suggestions grid ------------------------------------- */}
            {suggestions !== null && suggestions.length === 0 && !error && (
                <div style={styles.emptyState}>
                    The AI didn't return any suggestions for this inventory.
                </div>
            )}

            {suggestions && suggestions.length > 0 && (
                <div style={styles.grid}>
                    {suggestions.map((s, idx) => {
                        const tone = computeUrgency(s);
                        const qty = parseFloat(s.reorder_qty);
                        const qtyDisplay = Number.isFinite(qty) ? qty : 0;
                        return (
                            <div
                                key={`${s.item_name || 'item'}-${idx}`}
                                style={styles.card}
                            >
                                <div style={styles.cardHead}>
                                    <h3 style={styles.cardName} title={s.item_name}>
                                        {s.item_name || 'Unknown item'}
                                    </h3>
                                    <span style={styles.urgency(tone)}>
                                        {tone.label} {tone.text}
                                    </span>
                                </div>

                                <div style={styles.qtyBox}>
                                    <span style={styles.qtyLabel}>Reorder Qty</span>
                                    <span style={styles.qtyValue}>
                                        {qtyDisplay} {s.reorder_unit || ''}
                                    </span>
                                </div>

                                {s.reason && (
                                    <p style={styles.reason}>
                                        <span style={styles.reasonIcon}>💡</span>
                                        <span>{s.reason}</span>
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Privacy info box ------------------------------------- */}
            <div style={styles.infoBox}>
                <span>🔒</span>
                <span>
                    <strong>Data privacy:</strong> only anonymised inventory data
                    (item names, categories, quantities, thresholds, supplier names and
                    7-day usage totals) is sent to OpenAI for analysis. No customer
                    details, staff personal information, or financial records leave
                    your café.
                </span>
            </div>
        </div>
    );
}

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
    okBg:    '#dff5e6',
    okFg:    '#1d703f',
    okLine:  '#b6e3c8',
    lowBg:   '#fce8e6',
    lowFg:   '#a8262b',
    warnBg:  '#fff4e6',
    warnFg:  '#b45309',
    info:    '#eaf1ff',
    infoFg:  '#2745a4',
};

const ACCENT_GRADIENTS = {
    urgent: 'linear-gradient(90deg, #d64545, #f08080)',
    soon:   'linear-gradient(90deg, #e8830c, #f5a623)',
    normal: 'linear-gradient(90deg, #2c9f64, #52d68a)',
};

const METER_COLORS = {
    urgent: '#d64545',
    soon:   '#e8830c',
    normal: '#2c9f64',
};

const BADGE_STYLES = {
    urgent: { bg: '#fce8e6', fg: '#a8262b', text: 'URGENT' },
    soon:   { bg: '#fff4e6', fg: '#b45309', text: 'ORDER SOON' },
    normal: { bg: '#dff5e6', fg: '#1d703f', text: 'STOCKED' },
};

const METER_FALLBACK_PCT = { urgent: 18, soon: 48, normal: 88 };

const styles = {
    header: {
        marginBottom: '1.25rem',
    },
    title: {
        margin: 0,
        fontSize: '1.6rem',
        color: C.ink,
    },
    subtitle: {
        fontSize: '0.88rem',
        color: '#5d6a78',
        maxWidth: 520,
        marginTop: '0.3rem',
        marginBottom: 0,
        lineHeight: 1.5,
    },
    heroBanner: {
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5898 50%, #3d6acb 100%)',
        borderRadius: 16,
        padding: '1.75rem 2rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 20px rgba(15,30,60,0.20)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem',
        flexWrap: 'wrap',
    },
    heroLeft: {
        flex: '1 1 240px',
        minWidth: 0,
    },
    heroHeading: {
        margin: '0 0 0.35rem',
        fontSize: '1.1rem',
        fontWeight: 600,
        color: '#ffffff',
    },
    heroSubtext: {
        margin: 0,
        fontSize: '0.83rem',
        color: 'rgba(255,255,255,0.75)',
        lineHeight: 1.45,
    },
    genBtn: (hovered) => ({
        background: hovered ? '#f0f4f8' : '#ffffff',
        color: '#1e3a5f',
        border: 'none',
        borderRadius: 10,
        padding: '0.75rem 1.75rem',
        fontWeight: 700,
        cursor: 'pointer',
        fontSize: '0.95rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'background 0.18s, transform 0.18s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        whiteSpace: 'nowrap',
        flexShrink: 0,
    }),
    genBtnDisabled: {
        opacity: 0.85,
        cursor: 'wait',
        transform: 'none',
    },
    spinner: {
        display: 'inline-block',
        animation: 'spin 0.9s linear infinite',
        fontSize: '1.1rem',
        lineHeight: 1,
    },
    successMsg: {
        marginTop: '1rem',
        background: C.okBg,
        color: C.okFg,
        border: `1px solid ${C.okLine}`,
        padding: '0.55rem 0.85rem',
        borderRadius: 8,
        fontSize: '0.88rem',
        display: 'inline-block',
    },
    errorBox: {
        background: C.lowBg,
        color: C.lowFg,
        border: '1px solid #f4b1ad',
        padding: '0.75rem 1rem',
        borderRadius: 10,
        marginBottom: '1.25rem',
        fontSize: '0.88rem',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem',
        marginBottom: '1.25rem',
    },
    card: (hovered) => ({
        background: '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: hovered
            ? '0 8px 28px rgba(15,30,60,0.13)'
            : '0 2px 10px rgba(15,30,60,0.08)',
        border: '1px solid #eef0f2',
        transition: 'box-shadow 0.18s, transform 0.18s',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        display: 'flex',
        flexDirection: 'column',
    }),
    accentBar: (tier) => ({
        height: 5,
        background: ACCENT_GRADIENTS[tier],
        flexShrink: 0,
    }),
    cardHeader: {
        padding: '1rem 1.25rem 0.75rem',
    },
    cardNameRow: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '0.5rem',
    },
    cardName: {
        margin: 0,
        fontSize: '1rem',
        fontWeight: 700,
        color: '#1e3a5f',
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    urgencyBadge: (tier) => ({
        background: BADGE_STYLES[tier].bg,
        color: BADGE_STYLES[tier].fg,
        padding: '0.15rem 0.65rem',
        borderRadius: 999,
        fontSize: '0.68rem',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        flexShrink: 0,
    }),
    meterTrack: {
        height: 6,
        background: '#eef0f2',
        borderRadius: 999,
        margin: '0.6rem 0',
        overflow: 'hidden',
    },
    meterFill: (pct, tier) => ({
        height: '100%',
        width: `${pct}%`,
        borderRadius: 999,
        background: METER_COLORS[tier],
        transition: 'width 0.6s ease',
    }),
    stockDetailsRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.82rem',
        color: '#5d6a78',
        marginBottom: '0.65rem',
        gap: '0.5rem',
    },
    divider: {
        height: 1,
        background: '#f0f2f5',
        margin: '0 1.25rem',
    },
    cardFooter: {
        padding: '0.85rem 1.25rem',
    },
    suggestionText: {
        margin: 0,
        fontSize: '0.88rem',
        color: '#3e4c59',
        lineHeight: 1.5,
        fontStyle: 'italic',
        display: 'flex',
        gap: '0.4rem',
        alignItems: 'flex-start',
    },
    suggestionIcon: {
        flexShrink: 0,
        fontStyle: 'normal',
    },
    preGenerateEmpty: {
        background: 'linear-gradient(135deg, #f7f9ff, #eaf1ff)',
        borderRadius: 20,
        padding: '3.5rem 2rem',
        textAlign: 'center',
        border: '1.5px dashed #3d6acb',
        marginBottom: '1.25rem',
    },
    preGenerateEmoji: {
        fontSize: '3rem',
        display: 'block',
        marginBottom: '0.75rem',
    },
    preGenerateTitle: {
        margin: '0 0 0.4rem',
        fontSize: '1.15rem',
        fontWeight: 600,
        color: C.ink,
    },
    preGenerateSub: {
        margin: '0 0 1rem',
        fontSize: '0.88rem',
        color: C.grey,
    },
    arrowUp: {
        fontSize: '1.75rem',
        color: C.blue,
        lineHeight: 1,
        animation: 'fadeInUp 0.6s ease both',
    },
    emptyResults: {
        textAlign: 'center',
        padding: '2.5rem',
        background: '#f7f9ff',
        border: '1.5px dashed #cbd2d9',
        borderRadius: 14,
        color: C.grey,
        marginBottom: '1.25rem',
    },
    skeleton: {
        background: '#f0f4f8',
        borderRadius: 16,
        height: 180,
        animation: 'pulse 1.5s ease infinite',
    },
    infoBox: {
        background: C.info,
        color: C.infoFg,
        border: '1px solid #c8d6f3',
        padding: '0.85rem 1.1rem',
        borderRadius: 12,
        fontSize: '0.85rem',
        lineHeight: 1.5,
        display: 'flex',
        gap: '0.65rem',
        alignItems: 'flex-start',
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

// Display-only: map computeUrgency tone colours to card accent tier (logic unchanged).
function urgencyTier(tone) {
    if (tone.bg === C.lowBg) return 'urgent';
    if (tone.bg === C.warnBg) return 'soon';
    return 'normal';
}

// Display-only: parse current/threshold from AI reason text when present.
function parseStockFromReason(reason) {
    if (!reason || typeof reason !== 'string') return null;

    const slash = reason.match(
        /(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*([a-zA-Z][\w\s]*?)(?=[,;.)]|$)/i
    );
    if (slash) {
        return {
            quantity: parseFloat(slash[1]),
            threshold: parseFloat(slash[2]),
            unit: slash[3].trim(),
        };
    }

    const current = reason.match(/currently\s+(\d+(?:\.\d+)?)\s+(\S+)/i);
    const thresh = reason.match(/(\d+(?:\.\d+)?)\s+(\S+)\s+threshold/i);
    if (current && thresh) {
        return {
            quantity: parseFloat(current[1]),
            threshold: parseFloat(thresh[1]),
            unit: current[2] || thresh[2],
        };
    }

    return null;
}

function stockMeterDisplay(suggestion, tier) {
    const parsed = parseStockFromReason(suggestion.reason);
    const unit = parsed?.unit || suggestion.reorder_unit || '';

    if (
        parsed &&
        Number.isFinite(parsed.quantity) &&
        Number.isFinite(parsed.threshold) &&
        parsed.threshold > 0
    ) {
        return {
            quantity: parsed.quantity,
            threshold: parsed.threshold,
            unit,
            fillPct: Math.min((parsed.quantity / parsed.threshold) * 100, 100),
        };
    }

    return {
        quantity: null,
        threshold: null,
        unit,
        fillPct: METER_FALLBACK_PCT[tier],
    };
}

function formatStockValue(value, unit) {
    if (value == null || !Number.isFinite(value)) return '—';
    return `${value} ${unit}`.trim();
}

// --- page ------------------------------------------------------------------

export default function AIInsights() {
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');
    const [suggestions, setSuggestions] = useState(null);
    const [itemsAnalysed, setItemsAnalysed] = useState(0);

    const [genBtnHovered, setGenBtnHovered] = useState(false);
    const [hoveredCardKey, setHoveredCardKey] = useState(null);

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

    const showPreGenerateEmpty = suggestions === null && !loading && !error;

    return (
        <div>
            <div style={styles.header}>
                <h1 style={styles.title}>🤖 AI Reorder Insights</h1>
                <p style={styles.subtitle}>
                    Smart reorder suggestions based on your current stock levels and usage
                    patterns
                </p>
            </div>

            {/* Hero generate banner --------------------------------- */}
            <div style={styles.heroBanner}>
                <div style={styles.heroLeft}>
                    <h2 style={styles.heroHeading}>Generate Suggestions</h2>
                    <p style={styles.heroSubtext}>
                        Analyzes all current stock levels and recent usage
                    </p>
                    {!loading && suggestions !== null && !error && (
                        <div style={styles.successMsg}>
                            ✅ Analysed {itemsAnalysed} inventory item
                            {itemsAnalysed === 1 ? '' : 's'}
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={loading}
                    style={
                        loading
                            ? { ...styles.genBtn(false), ...styles.genBtnDisabled }
                            : styles.genBtn(genBtnHovered)
                    }
                    onMouseEnter={() => !loading && setGenBtnHovered(true)}
                    onMouseLeave={() => setGenBtnHovered(false)}
                >
                    {loading ? (
                        <>
                            <span style={styles.spinner} aria-hidden="true">
                                ⟳
                            </span>
                            Analysing inventory...
                        </>
                    ) : (
                        '✨ Generate AI Suggestions'
                    )}
                </button>
            </div>

            {error && <div style={styles.errorBox}>⚠ {error}</div>}

            {loading && (
                <div style={styles.grid}>
                    {[0, 1, 2].map((i) => (
                        <div key={`skel-${i}`} style={styles.skeleton} aria-hidden="true" />
                    ))}
                </div>
            )}

            {showPreGenerateEmpty && (
                <div style={styles.preGenerateEmpty}>
                    <span style={styles.preGenerateEmoji}>🤖</span>
                    <p style={styles.preGenerateTitle}>Ready to analyse your inventory</p>
                    <p style={styles.preGenerateSub}>
                        Click Generate AI Suggestions to get smart reorder recommendations
                    </p>
                    <div style={styles.arrowUp} aria-hidden="true">
                        ↑
                    </div>
                </div>
            )}

            {suggestions !== null && suggestions.length === 0 && !error && !loading && (
                <div style={styles.emptyResults}>
                    The AI didn&apos;t return any suggestions for this inventory.
                </div>
            )}

            {suggestions && suggestions.length > 0 && !loading && (
                <div style={styles.grid}>
                    {suggestions.map((s, idx) => {
                        const tone = computeUrgency(s);
                        const tier = urgencyTier(tone);
                        const stock = stockMeterDisplay(s, tier);
                        const cardKey = `${s.item_name || 'item'}-${idx}`;
                        const isHovered = hoveredCardKey === cardKey;

                        return (
                            <div
                                key={cardKey}
                                style={styles.card(isHovered)}
                                onMouseEnter={() => setHoveredCardKey(cardKey)}
                                onMouseLeave={() => setHoveredCardKey(null)}
                            >
                                <div style={styles.accentBar(tier)} />

                                <div style={styles.cardHeader}>
                                    <div style={styles.cardNameRow}>
                                        <h3 style={styles.cardName} title={s.item_name}>
                                            {s.item_name || 'Unknown item'}
                                        </h3>
                                        <span style={styles.urgencyBadge(tier)}>
                                            {BADGE_STYLES[tier].text}
                                        </span>
                                    </div>

                                    <div style={styles.meterTrack}>
                                        <div
                                            style={styles.meterFill(
                                                stock.fillPct,
                                                tier
                                            )}
                                        />
                                    </div>

                                    <div style={styles.stockDetailsRow}>
                                        <span>
                                            Current:{' '}
                                            {formatStockValue(stock.quantity, stock.unit)}
                                        </span>
                                        <span>
                                            Threshold:{' '}
                                            {formatStockValue(stock.threshold, stock.unit)}
                                        </span>
                                    </div>
                                </div>

                                <div style={styles.divider} />

                                <div style={styles.cardFooter}>
                                    {s.reason && (
                                        <p style={styles.suggestionText}>
                                            <span style={styles.suggestionIcon}>💡</span>
                                            <span>{s.reason}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

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

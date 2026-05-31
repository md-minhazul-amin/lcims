/**
 * @file Alerts.js
 * @description Low stock alerts management page with resolve functionality
 * @author The IT Crowd
 * @date May 2026
 * @project LCIMS - Local Cafe Inventory Management System
 * @course CPRO306 - Capstone Project, Kent Institute Australia
 */

// ============================================================================
// File:    pages/Alerts.js
// Purpose: Active low-stock alerts — lists items below threshold from
//          GET /api/alerts and lets staff mark alerts resolved via
//          PATCH /api/alerts/:alert_id/resolve without a full page reload.
// Author:  The IT Crowd
// Date:    May 2026
// Project: LCIMS - Local Cafe Inventory Management System
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';

// --- colour palette (matches Inventory.js / Dashboard.js) --------------------

const C = {
    blue:    '#3d6acb',
    ink:     '#1e3a5f',
    sub:     '#5d6a78',
    grey:    '#7b8794',
    line:    '#eef0f2',
    border:  '#cbd2d9',
    bgPanel: '#ffffff',
    okBg:    '#dff5e6',
    okFg:    '#1d703f',
    lowBg:   '#fce8e6',
    lowFg:   '#a8262b',
    catBg:   '#eaf1ff',
    catFg:   '#2745a4',
};

// --- inline styles -----------------------------------------------------------

const styles = {
    header: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '1.25rem',
    },
    titleBlock: {
        flex: 1,
        minWidth: 0,
    },
    title: {
        margin: '0 0 0.35rem',
        fontSize: '1.6rem',
        color: C.ink,
    },
    subtitle: {
        margin: 0,
        fontSize: '0.85rem',
        color: '#5d6a78',
        lineHeight: 1.5,
        maxWidth: 560,
    },
    refreshBtn: (hovered) => ({
        background: hovered ? '#eaf1ff' : 'transparent',
        color: '#3d6acb',
        border: '1.5px solid #3d6acb',
        padding: '0.45rem 1rem',
        borderRadius: 8,
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '0.9rem',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        transition: 'background 0.15s',
    }),
    refreshBtnDisabled: {
        opacity: 0.55,
        cursor: 'not-allowed',
    },
    summaryBar: (healthy) => ({
        background: healthy
            ? '#dff5e6'
            : 'linear-gradient(90deg, #fff4e6, #fce8e6)',
        color: healthy ? '#1d703f' : '#a8262b',
        border: `1px solid ${healthy ? '#6fcf97' : '#f4b1ad'}`,
        borderRadius: 10,
        padding: '0.75rem 1.1rem',
        fontWeight: 600,
        fontSize: '0.92rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    }),
    loading: {
        padding: '2rem',
        color: C.sub,
        fontSize: '0.95rem',
    },
    error: {
        background: C.lowBg,
        color: C.lowFg,
        border: '1px solid #f4b1ad',
        padding: '0.75rem 1rem',
        borderRadius: 10,
        marginBottom: '1rem',
    },
    emptyState: {
        textAlign: 'center',
        padding: '3rem',
        background: '#f7f9ff',
        border: '1.5px dashed #cbd2d9',
        borderRadius: 14,
    },
    emptyEmoji: {
        fontSize: '2.75rem',
        display: 'block',
        marginBottom: '0.75rem',
    },
    emptyTitle: {
        margin: '0 0 0.35rem',
        fontSize: '1.05rem',
        fontWeight: 600,
        color: C.ink,
    },
    emptySub: {
        margin: 0,
        fontSize: '0.85rem',
        color: C.grey,
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem',
    },
    card: {
        background: '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(15,30,60,0.08)',
        border: '1px solid #eef0f2',
        display: 'flex',
        flexDirection: 'column',
    },
    accentBar: {
        height: 5,
        background: 'linear-gradient(90deg, #d64545, #f08080)',
        flexShrink: 0,
    },
    cardBody: {
        padding: '1rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
    },
    cardHead: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '0.5rem',
    },
    itemName: {
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
    badgeLow: {
        background: '#fce8e6',
        color: '#a8262b',
        padding: '0.18rem 0.7rem',
        borderRadius: 999,
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap',
        flexShrink: 0,
    },
    badgeCategory: {
        background: '#eaf1ff',
        color: '#2745a4',
        padding: '0.18rem 0.65rem',
        borderRadius: 999,
        fontSize: '0.75rem',
        fontWeight: 600,
        display: 'inline-block',
        margin: '0.4rem 0',
        alignSelf: 'flex-start',
    },
    meterTrack: {
        height: 6,
        background: '#eef0f2',
        borderRadius: 999,
        margin: '0.55rem 0',
        overflow: 'hidden',
    },
    meterFill: (pct) => ({
        height: '100%',
        width: `${pct}%`,
        borderRadius: 999,
        background: '#d64545',
        transition: 'width 0.6s ease',
    }),
    stockText: {
        margin: '0 0 0.35rem',
        fontSize: '0.85rem',
        color: '#a8262b',
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
    },
    triggered: {
        margin: '0 0 0.85rem',
        fontSize: '0.78rem',
        color: '#7b8794',
    },
    resolveBtn: (hovered) => ({
        background: 'linear-gradient(90deg, #2c9f64, #40b974)',
        color: '#ffffff',
        border: 'none',
        borderRadius: 9,
        padding: '0.65rem',
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '0.88rem',
        width: '100%',
        boxShadow: hovered
            ? '0 4px 14px rgba(44,159,100,0.38)'
            : '0 2px 8px rgba(44,159,100,0.25)',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'transform 0.18s, box-shadow 0.18s',
    }),
    resolveBtnDisabled: {
        opacity: 0.55,
        cursor: 'not-allowed',
        transform: 'none',
    },
    cardError: {
        fontSize: '0.82rem',
        color: C.lowFg,
        margin: '0 0 0.5rem',
    },
};

// --- helpers -----------------------------------------------------------------

function formatTriggeredAt(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
        year:   'numeric',
        month:  'short',
        day:    'numeric',
        hour:   '2-digit',
        minute: '2-digit',
    });
}

function formatStockRemaining(quantity, threshold, unit) {
    const q = parseFloat(quantity);
    const t = parseFloat(threshold);
    const qStr = Number.isFinite(q) ? q.toFixed(2) : String(quantity ?? '—');
    const tStr = Number.isFinite(t) ? t.toFixed(2) : String(threshold ?? '—');
    const u = unit || '';
    return `${qStr} ${u} remaining / threshold: ${tStr} ${u}`.trim();
}

function stockFillPct(quantity, threshold) {
    const q = parseFloat(quantity);
    const t = parseFloat(threshold);
    if (!Number.isFinite(q) || !Number.isFinite(t) || t <= 0) return 100;
    return Math.min((q / t) * 100, 100);
}

// --- page --------------------------------------------------------------------

export default function Alerts() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [resolvingId, setResolvingId] = useState(null);
    const [resolveErrors, setResolveErrors] = useState({});

    const [refreshHovered, setRefreshHovered] = useState(false);
    const [resolveHoveredId, setResolveHoveredId] = useState(null);

    // fetchAlerts: GET /api/alerts — expects array of alert rows with item fields.
    const fetchAlerts = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError('');

        try {
            const res = await api.get('/alerts');
            setAlerts(Array.isArray(res.data) ? res.data : []);
            setResolveErrors({});
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load alerts');
            if (!isRefresh) {
                setAlerts([]);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Initial load on mount.
    useEffect(() => {
        fetchAlerts(false);
    }, [fetchAlerts]);

    // handleRefresh: top-right button re-runs GET /api/alerts.
    function handleRefresh() {
        if (loading || refreshing) return;
        fetchAlerts(true);
    }

    // handleResolve: PATCH then remove card from local state (no full reload).
    async function handleResolve(alertId) {
        setResolvingId(alertId);
        setResolveErrors((prev) => {
            const next = { ...prev };
            delete next[alertId];
            return next;
        });

        try {
            await api.patch(`/alerts/${alertId}/resolve`);
            setAlerts((prev) => prev.filter((a) => a.alert_id !== alertId));
        } catch (err) {
            setResolveErrors((prev) => ({
                ...prev,
                [alertId]: err.response?.data?.error || 'Failed to resolve alert',
            }));
        } finally {
            setResolvingId(null);
        }
    }

    const busy = loading || refreshing;
    const count = alerts.length;
    const showSummary = !loading && !error;

    return (
        <div>
            {/* Page header + Refresh ---------------------------------------- */}
            <div style={styles.header}>
                <div style={styles.titleBlock}>
                    <h1 style={styles.title}>🔔 Low Stock Alerts</h1>
                    <p style={styles.subtitle}>
                        Items that have dropped below their reorder threshold
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={busy}
                    style={
                        busy
                            ? { ...styles.refreshBtn(false), ...styles.refreshBtnDisabled }
                            : styles.refreshBtn(refreshHovered)
                    }
                    onMouseEnter={() => !busy && setRefreshHovered(true)}
                    onMouseLeave={() => setRefreshHovered(false)}
                >
                    {refreshing ? 'Refreshing...' : '↻ Refresh'}
                </button>
            </div>

            {/* Loading ------------------------------------------------------ */}
            {loading && !refreshing && (
                <div style={styles.loading}>Loading alerts...</div>
            )}

            {/* Fetch error -------------------------------------------------- */}
            {!loading && error && (
                <div style={styles.error}>{error}</div>
            )}

            {/* Alert count summary ------------------------------------------ */}
            {showSummary && (
                <div style={styles.summaryBar(count === 0)}>
                    {count === 0 ? (
                        <>
                            <span>✅</span>
                            <span>
                                All stock levels are healthy — no alerts at this time
                            </span>
                        </>
                    ) : (
                        <>
                            <span>⚠️</span>
                            <span>
                                {count} active alert{count !== 1 ? 's' : ''} require attention
                            </span>
                        </>
                    )}
                </div>
            )}

            {/* Empty (healthy stock) ---------------------------------------- */}
            {!loading && !error && alerts.length === 0 && (
                <div style={styles.emptyState}>
                    <span style={styles.emptyEmoji}>✅</span>
                    <p style={styles.emptyTitle}>All clear — no low stock alerts</p>
                    <p style={styles.emptySub}>
                        Items will appear here when quantity drops below the reorder
                        threshold
                    </p>
                </div>
            )}

            {/* Alert cards -------------------------------------------------- */}
            {!loading && !error && alerts.length > 0 && (
                <div style={styles.grid}>
                    {alerts.map((alert) => {
                        const isResolving = resolvingId === alert.alert_id;
                        const cardErr = resolveErrors[alert.alert_id];
                        const fillPct = stockFillPct(alert.quantity, alert.threshold);
                        const resolveHover = resolveHoveredId === alert.alert_id;

                        return (
                            <article key={alert.alert_id} style={styles.card}>
                                <div style={styles.accentBar} />

                                <div style={styles.cardBody}>
                                    <div style={styles.cardHead}>
                                        <h2 style={styles.itemName} title={alert.item_name}>
                                            {alert.item_name || 'Unknown item'}
                                        </h2>
                                        <span style={styles.badgeLow}>LOW STOCK</span>
                                    </div>

                                    {alert.category && (
                                        <span style={styles.badgeCategory}>
                                            {alert.category}
                                        </span>
                                    )}

                                    <div style={styles.meterTrack}>
                                        <div style={styles.meterFill(fillPct)} />
                                    </div>

                                    <p style={styles.stockText}>
                                        {formatStockRemaining(
                                            alert.quantity,
                                            alert.threshold,
                                            alert.unit
                                        )}
                                    </p>

                                    <p style={styles.triggered}>
                                        Alert triggered:{' '}
                                        {formatTriggeredAt(alert.triggered_at)}
                                    </p>

                                    {cardErr && (
                                        <p style={styles.cardError}>{cardErr}</p>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => handleResolve(alert.alert_id)}
                                        disabled={isResolving}
                                        style={
                                            isResolving
                                                ? {
                                                      ...styles.resolveBtn(false),
                                                      ...styles.resolveBtnDisabled,
                                                  }
                                                : styles.resolveBtn(resolveHover)
                                        }
                                        onMouseEnter={() =>
                                            !isResolving &&
                                            setResolveHoveredId(alert.alert_id)
                                        }
                                        onMouseLeave={() => setResolveHoveredId(null)}
                                    >
                                        {isResolving ? 'Resolving...' : 'Mark Resolved'}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

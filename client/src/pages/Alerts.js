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
        fontSize: '0.95rem',
        color: C.sub,
        lineHeight: 1.5,
        maxWidth: 560,
    },
    refreshBtn: {
        background: C.blue,
        color: '#ffffff',
        border: 'none',
        padding: '0.55rem 1rem',
        borderRadius: 6,
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '0.9rem',
        whiteSpace: 'nowrap',
        flexShrink: 0,
    },
    refreshBtnDisabled: {
        background: '#9aa5b1',
        cursor: 'not-allowed',
    },
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
        borderRadius: 6,
        marginBottom: '1rem',
    },
    emptyState: {
        textAlign: 'center',
        padding: '2.5rem 1.5rem',
        background: C.bgPanel,
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(15,30,60,0.06)',
        color: C.okFg,
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.6,
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem',
    },
    card: {
        background: C.bgPanel,
        borderRadius: 8,
        padding: '1.15rem 1.25rem',
        boxShadow: '0 1px 3px rgba(15,30,60,0.06)',
        borderLeft: `4px solid ${C.lowFg}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
    },
    cardHead: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '0.65rem',
    },
    itemName: {
        margin: 0,
        fontSize: '1.1rem',
        fontWeight: 700,
        color: C.ink,
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    badgeLow: {
        background: C.lowBg,
        color: C.lowFg,
        padding: '0.22rem 0.6rem',
        borderRadius: 999,
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        flexShrink: 0,
    },
    badgeCategory: {
        alignSelf: 'flex-start',
        background: C.catBg,
        color: C.catFg,
        padding: '0.2rem 0.65rem',
        borderRadius: 999,
        fontSize: '0.78rem',
        fontWeight: 600,
    },
    qtyLine: {
        margin: 0,
        fontSize: '0.92rem',
        color: '#3e4c59',
        fontVariantNumeric: 'tabular-nums',
    },
    qtyHighlight: {
        color: C.lowFg,
        fontWeight: 600,
    },
    triggered: {
        margin: 0,
        fontSize: '0.82rem',
        color: C.grey,
    },
    resolveBtn: {
        alignSelf: 'flex-start',
        background: '#ffffff',
        color: C.blue,
        border: `1px solid ${C.blue}`,
        padding: '0.45rem 0.95rem',
        borderRadius: 6,
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '0.85rem',
    },
    resolveBtnDisabled: {
        opacity: 0.55,
        cursor: 'not-allowed',
    },
    cardError: {
        fontSize: '0.82rem',
        color: C.lowFg,
        margin: 0,
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

function formatQtyPair(quantity, threshold, unit) {
    const q = parseFloat(quantity);
    const t = parseFloat(threshold);
    const qStr = Number.isFinite(q) ? q.toFixed(2) : String(quantity ?? '—');
    const tStr = Number.isFinite(t) ? t.toFixed(2) : String(threshold ?? '—');
    const u = unit ? ` ${unit}` : '';
    return `${qStr}${u} / threshold: ${tStr}${u}`;
}

// --- page --------------------------------------------------------------------

export default function Alerts() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [resolvingId, setResolvingId] = useState(null);
    const [resolveErrors, setResolveErrors] = useState({});

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

    return (
        <div>
            {/* Page header + Refresh ---------------------------------------- */}
            <div style={styles.header}>
                <div style={styles.titleBlock}>
                    <h1 style={styles.title}>🔔 Low Stock Alerts</h1>
                    <p style={styles.subtitle}>
                        Items that have dropped below their reorder threshold.
                        Resolve an alert once stock has been restocked.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={busy}
                    style={
                        busy
                            ? { ...styles.refreshBtn, ...styles.refreshBtnDisabled }
                            : styles.refreshBtn
                    }
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

            {/* Empty (healthy stock) ---------------------------------------- */}
            {!loading && !error && alerts.length === 0 && (
                <div style={styles.emptyState}>
                    No active alerts — all stock levels are healthy ✅
                </div>
            )}

            {/* Alert cards -------------------------------------------------- */}
            {!loading && !error && alerts.length > 0 && (
                <div style={styles.grid}>
                    {alerts.map((alert) => {
                        const isResolving = resolvingId === alert.alert_id;
                        const cardErr = resolveErrors[alert.alert_id];

                        return (
                            <article key={alert.alert_id} style={styles.card}>
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

                                <p style={styles.qtyLine}>
                                    <span style={styles.qtyHighlight}>
                                        {formatQtyPair(
                                            alert.quantity,
                                            alert.threshold,
                                            alert.unit
                                        )}
                                    </span>
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
                                                  ...styles.resolveBtn,
                                                  ...styles.resolveBtnDisabled,
                                              }
                                            : styles.resolveBtn
                                    }
                                >
                                    {isResolving ? 'Resolving...' : 'Mark Resolved'}
                                </button>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

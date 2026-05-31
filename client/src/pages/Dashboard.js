/**
 * @file Dashboard.js
 * @description Main dashboard showing KPI cards, low stock alerts, recent activity feed,
 *              and Manager low-stock popup notifications (GET /api/reports/notifications)
 *              added May 2026 per professor feedback.
 * @author The IT Crowd
 * @date May 2026
 * @project LCIMS - Local Cafe Inventory Management System
 * @course CPRO306 - Capstone Project, Kent Institute Australia
 */

// ============================================================================
// File:    pages/Dashboard.js
// Purpose: Home dashboard — KPI cards, low-stock list, and recent stock activity.
//          Fetches GET /api/reports/dashboard on mount. Managers also receive an
//          auto-opening notification panel from GET /api/reports/notifications.
//          Uses inline styles only.
// Author:  The IT Crowd
// Date:    May 2026
// Project: LCIMS - Local Cafe Inventory Management System
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// --- styles (all inline per spec; no CSS file) -----------------------------

const COLOURS = {
    blue:   '#3d6acb',
    red:    '#d64545',
    green:  '#2c9f64',
    orange: '#e8830c',
    ink:    '#1e3a5f',
    sub:    '#5d6a78',
    grey:   '#7b8794',
    line:   '#eef0f2',
    bgBadge:'#fce8e6',
    fgBadge:'#a8262b',
};

const styles = {
    dashboardPageHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '1.5rem',
        gap: '1rem',
    },
    pageTitle: {
        fontSize: '1.6rem',
        margin: 0,
        color: COLOURS.ink,
    },
    pageDate: {
        fontSize: '0.85rem',
        color: COLOURS.sub,
        margin: '0.2rem 0 0',
    },
    refreshBtn: {
        background: '#f0f4f8',
        color: COLOURS.ink,
        border: '1px solid #cbd2d9',
        borderRadius: 8,
        padding: '0.45rem 1rem',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: 500,
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
    },
    kpiGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '1rem',
        marginBottom: '1.25rem',
    },
    kpiCardBase: {
        background: '#ffffff',
        borderRadius: 14,
        padding: '1.25rem 1.4rem',
        boxShadow: '0 2px 8px rgba(15,30,60,0.08)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.18s, transform 0.18s',
        cursor: 'default',
        minHeight: 110,
    },
    kpiAccentBar: (accent) => ({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
        borderRadius: '14px 14px 0 0',
    }),
    kpiIcon: {
        position: 'absolute',
        bottom: '0.75rem',
        right: '1rem',
        fontSize: '2.2rem',
        opacity: 0.1,
    },
    kpiLabel: {
        fontSize: '0.78rem',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: COLOURS.sub,
        marginBottom: '0.4rem',
        marginTop: '0.3rem',
    },
    kpiNumber: {
        fontSize: '2.4rem',
        fontWeight: 700,
        color: COLOURS.ink,
        lineHeight: 1,
    },
    twoCol: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
    },
    panel: {
        background: '#ffffff',
        borderRadius: 14,
        padding: '1.1rem 1.25rem',
        boxShadow: '0 2px 8px rgba(15,30,60,0.08)',
        border: '1px solid #eef0f2',
        overflow: 'hidden',
    },
    panelHeadingRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.75rem',
    },
    panelHeading: (accent) => ({
        fontSize: '1rem',
        fontWeight: 600,
        color: accent,
        margin: 0,
        borderLeft: `3px solid ${accent}`,
        paddingLeft: '0.75rem',
    }),
    lowStockCountBadge: {
        background: COLOURS.bgBadge,
        color: COLOURS.fgBadge,
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: '0.75rem',
        fontWeight: 700,
    },
    lowStockRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        borderRadius: 8,
        padding: '0.65rem 0.75rem',
        transition: 'background 0.15s',
    },
    lowStockRowHover: {
        background: '#fff8f8',
    },
    lowStockNameBlock: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.15rem',
        minWidth: 0,
    },
    lowStockName: {
        color: COLOURS.ink,
        fontWeight: 600,
    },
    lowStockCategory: {
        fontSize: '0.75rem',
        color: COLOURS.grey,
    },
    lowStockBadge: {
        background: COLOURS.bgBadge,
        color: COLOURS.fgBadge,
        padding: '0.25rem 0.7rem',
        borderRadius: 999,
        fontSize: '0.82rem',
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
    },
    allStockedOk: {
        background: '#dff5e6',
        color: '#1d703f',
        borderRadius: 10,
        padding: '1rem',
        textAlign: 'center',
        fontSize: '0.95rem',
        fontWeight: 500,
    },
    activityRow: {
        padding: '0.65rem 0.75rem',
        borderRadius: 8,
        transition: 'background 0.15s',
    },
    activityRowHover: {
        background: '#f7f9ff',
    },
    activityMain: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
    },
    activityNameRow: {
        display: 'flex',
        alignItems: 'center',
        minWidth: 0,
        flex: 1,
    },
    activityDot: (positive) => ({
        width: 8,
        height: 8,
        borderRadius: '50%',
        display: 'inline-block',
        background: positive ? '#2c9f64' : '#d64545',
        marginRight: 8,
        flexShrink: 0,
    }),
    activityItemName: {
        color: COLOURS.ink,
        fontWeight: 500,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    activityChange: (positive) => ({
        color: positive ? COLOURS.green : COLOURS.red,
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
    }),
    activityMeta: {
        marginTop: '0.2rem',
        fontSize: '0.78rem',
        color: COLOURS.grey,
    },
    emptyMuted: {
        background: '#f5f7fa',
        color: '#7b8794',
        borderRadius: 10,
        padding: '1rem',
        textAlign: 'center',
        fontSize: '0.95rem',
    },
    loading: {
        padding: '2rem',
        color: COLOURS.sub,
    },
    error: {
        background: COLOURS.bgBadge,
        color: COLOURS.fgBadge,
        border: `1px solid ${COLOURS.fgBadge}`,
        padding: '0.75rem 1rem',
        borderRadius: 6,
    },
    // --- low-stock notification bell + dropdown (Manager auto-popup) ----------
    notifBellWrap: {
        position: 'relative',
    },
    notifBellBtn: {
        background: '#ffffff',
        border: `1px solid ${COLOURS.line}`,
        borderRadius: 8,
        width: 44,
        height: 44,
        fontSize: '1.35rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 3px rgba(15, 30, 60, 0.06)',
    },
    notifCountBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 20,
        height: 20,
        padding: '0 6px',
        borderRadius: 999,
        background: COLOURS.red,
        color: '#ffffff',
        fontSize: '0.72rem',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid #ffffff',
    },
    notifPanel: {
        position: 'absolute',
        top: 40,
        right: 0,
        width: 360,
        background: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        zIndex: 1000,
        border: `1.5px solid ${COLOURS.bgBadge}`,
    },
    notifPanelHeader: {
        fontSize: '1rem',
        fontWeight: 700,
        color: COLOURS.ink,
        padding: '14px 18px',
        borderBottom: `1px solid ${COLOURS.line}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    notifCloseBtn: {
        background: 'none',
        border: 'none',
        fontSize: '1.25rem',
        color: COLOURS.grey,
        cursor: 'pointer',
        lineHeight: 1,
        padding: '0 4px',
    },
    notifItem: (isLast) => ({
        padding: '12px 18px',
        borderBottom: isLast ? 'none' : `1px solid ${COLOURS.line}`,
    }),
    notifItemName: {
        fontWeight: 700,
        color: COLOURS.ink,
        marginBottom: 6,
    },
    notifCategoryPill: {
        display: 'inline-block',
        background: '#eaf1ff',
        color: '#2745a4',
        borderRadius: 20,
        fontSize: '0.72rem',
        padding: '2px 10px',
        marginBottom: 6,
    },
    notifStockLine: {
        color: COLOURS.fgBadge,
        fontSize: '0.85rem',
    },
    notifEmptyHealthy: {
        color: COLOURS.green,
        textAlign: 'center',
        padding: '24px 18px',
        fontWeight: 500,
    },
    notifFooter: {
        padding: '12px 18px 16px',
    },
    notifViewAllBtn: {
        background: COLOURS.blue,
        color: '#ffffff',
        borderRadius: 8,
        width: '100%',
        padding: 10,
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.9rem',
        marginTop: 8,
    },
    notifOverlay: {
        position: 'fixed',
        inset: 0,
        zIndex: 999,
    },
};

// --- helpers: format stock-log timestamps and signed quantity changes -------

function formatTimestamp(iso) {
    if (!iso) return '';
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

function formatChange(value) {
    const n = parseFloat(value);
    if (!Number.isFinite(n)) return String(value);
    const sign = n > 0 ? '+' : '';
    return `${sign}${n.toFixed(2)}`;
}

// --- KpiCard: metric tile with top accent bar, hover lift, staggered fade-in ---

function KpiCard({ icon, value, label, accent, idx }) {
    const [hovered, setHovered] = useState(false);

    const cardStyle = {
        ...styles.kpiCardBase,
        boxShadow: hovered
            ? '0 6px 24px rgba(15,30,60,0.14)'
            : '0 2px 8px rgba(15,30,60,0.08)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        animation: 'fadeInUp 0.3s ease both',
        animationDelay: `${idx * 0.07}s`,
    };

    return (
        <div
            style={cardStyle}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div style={styles.kpiAccentBar(accent)} />
            <div style={styles.kpiIcon}>{icon}</div>
            <div style={styles.kpiLabel}>{label}</div>
            <div style={styles.kpiNumber}>{value ?? 0}</div>
        </div>
    );
}

// --- page: load dashboard aggregate once on mount --------------------------

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Active low-stock rows for the bell dropdown (GET /api/reports/notifications).
    const [notifications, setNotifications] = useState([]);
    // Controls whether the notification dropdown panel is visible.
    const [showNotifications, setShowNotifications] = useState(false);
    const [hoveredLowStock, setHoveredLowStock] = useState(null);
    const [hoveredActivity, setHoveredActivity] = useState(null);

    // Fetch notification payload on mount (parallel to dashboard KPI load).
    useEffect(() => {
        let cancelled = false;

        api.get('/reports/notifications')
            .then((res) => {
                if (!cancelled) {
                    setNotifications(Array.isArray(res.data) ? res.data : []);
                }
            })
            .catch(() => {
                // Non-fatal: dashboard still works if notifications fail.
                if (!cancelled) setNotifications([]);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    // Auto-popup for Managers: after dashboard mount, wait 600ms then open panel
    // if there is at least one active alert (lets KPI data paint first).
    useEffect(() => {
        if (notifications.length === 0 || user?.role !== 'Manager') {
            return undefined;
        }

        const timerId = setTimeout(() => {
            setShowNotifications(true);
        }, 600);

        return () => clearTimeout(timerId);
    }, [notifications, user?.role]);

    // loadData: same GET /reports/dashboard fetch used on mount and Refresh.
    const loadData = useCallback(() => {
        setLoading(true);
        setError('');

        return api
            .get('/reports/dashboard')
            .then((res) => {
                setData(res.data);
            })
            .catch((err) => {
                setError(err.response?.data?.error || 'Failed to load dashboard');
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) {
        return <div style={styles.loading}>Loading dashboard...</div>;
    }
    if (error) {
        return <div style={styles.error}>{error}</div>;
    }
    if (!data) {
        return <div style={styles.loading}>No data.</div>;
    }

    const lowStockItems  = data.low_stock_items  || [];
    const recentActivity = data.recent_activity || [];

    const todayLabel = new Date().toLocaleDateString('en-AU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div>
            {/* Page header: title, date, refresh, notification bell ------------ */}
            <div style={styles.dashboardPageHeader}>
                <div>
                    <h1 style={styles.pageTitle}>Dashboard</h1>
                    <p style={styles.pageDate}>{todayLabel}</p>
                </div>

                <div style={styles.headerActions}>
                    <button
                        type="button"
                        style={styles.refreshBtn}
                        onClick={() => loadData()}
                        disabled={loading}
                    >
                        <span
                            style={{
                                display: 'inline-block',
                                marginRight: 6,
                                transform: loading ? 'rotate(360deg)' : 'none',
                                transition: loading ? 'transform 0.6s linear' : 'none',
                            }}
                        >
                            ↻
                        </span>
                        Refresh
                    </button>

                <div style={styles.notifBellWrap}>
                    {/* Bell toggles dropdown; badge shows active alert count. */}
                    <button
                        type="button"
                        style={styles.notifBellBtn}
                        aria-label="Low stock notifications"
                        onClick={() => setShowNotifications((open) => !open)}
                    >
                        🔔
                    </button>
                    {notifications.length > 0 && (
                        <span style={styles.notifCountBadge}>
                            {notifications.length}
                        </span>
                    )}

                    {/* Dropdown panel — rendered when showNotifications is true */}
                    {showNotifications && (
                        <div style={styles.notifPanel}>
                            <div style={styles.notifPanelHeader}>
                                <span>⚠️ Low Stock Alerts</span>
                                <button
                                    type="button"
                                    style={styles.notifCloseBtn}
                                    aria-label="Close notifications"
                                    onClick={() => setShowNotifications(false)}
                                >
                                    ×
                                </button>
                            </div>

                            {notifications.length === 0 ? (
                                <div style={styles.notifEmptyHealthy}>
                                    ✅ All stock levels are healthy
                                </div>
                            ) : (
                                notifications.map((alert, idx) => (
                                    <div
                                        key={alert.alert_id}
                                        style={styles.notifItem(
                                            idx === notifications.length - 1
                                        )}
                                    >
                                        <div style={styles.notifItemName}>
                                            {alert.item_name}
                                        </div>
                                        <span style={styles.notifCategoryPill}>
                                            {alert.category}
                                        </span>
                                        <div style={styles.notifStockLine}>
                                            {parseFloat(alert.quantity).toFixed(2)}{' '}
                                            {alert.unit} remaining — threshold:{' '}
                                            {parseFloat(alert.threshold).toFixed(2)}{' '}
                                            {alert.unit}
                                        </div>
                                    </div>
                                ))
                            )}

                            <div style={styles.notifFooter}>
                                <button
                                    type="button"
                                    style={styles.notifViewAllBtn}
                                    onClick={() => {
                                        setShowNotifications(false);
                                        navigate('/alerts');
                                    }}
                                >
                                    View All Alerts →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                </div>
            </div>

            {/* Full-screen overlay: click outside panel to dismiss -------------- */}
            {showNotifications && (
                <div
                    style={styles.notifOverlay}
                    aria-hidden="true"
                    onClick={() => setShowNotifications(false)}
                />
            )}

            {/* KPI row ----------------------------------------------------- */}
            <div style={styles.kpiGrid}>
                <KpiCard
                    idx={0}
                    icon="📦"
                    value={data.total_items}
                    label="Total Items"
                    accent={COLOURS.blue}
                />
                <KpiCard
                    idx={1}
                    icon="⚠️"
                    value={data.low_stock}
                    label="Low Stock Alerts"
                    accent={COLOURS.red}
                />
                <KpiCard
                    idx={2}
                    icon="🏪"
                    value={data.suppliers}
                    label="Suppliers"
                    accent={COLOURS.green}
                />
                <KpiCard
                    idx={3}
                    icon="🔄"
                    value={data.week_changes}
                    label="Changes This Week"
                    accent={COLOURS.orange}
                />
            </div>

            {/* Two-column section ----------------------------------------- */}
            <div style={styles.twoCol}>
                {/* LEFT - Low stock --------------------------------------- */}
                <div style={styles.panel}>
                    <div style={styles.panelHeadingRow}>
                        <h2 style={styles.panelHeading(COLOURS.red)}>
                            ⚠️ Low Stock Items
                        </h2>
                        {lowStockItems.length > 0 && (
                            <span style={styles.lowStockCountBadge}>
                                {lowStockItems.length}
                            </span>
                        )}
                    </div>

                    {lowStockItems.length === 0 ? (
                        <div style={styles.allStockedOk}>
                            ✅ All items are well stocked!
                        </div>
                    ) : (
                        lowStockItems.map((item, idx) => (
                            <div
                                key={item.item_id}
                                style={{
                                    ...styles.lowStockRow,
                                    ...(hoveredLowStock === idx
                                        ? styles.lowStockRowHover
                                        : {}),
                                }}
                                onMouseEnter={() => setHoveredLowStock(idx)}
                                onMouseLeave={() => setHoveredLowStock(null)}
                            >
                                <div style={styles.lowStockNameBlock}>
                                    <span style={styles.lowStockName}>{item.name}</span>
                                    {item.category && (
                                        <span style={styles.lowStockCategory}>
                                            {item.category}
                                        </span>
                                    )}
                                </div>
                                <span style={styles.lowStockBadge}>
                                    {parseFloat(item.quantity).toFixed(2)}
                                    {' / '}
                                    {parseFloat(item.threshold).toFixed(2)}
                                    {' '}
                                    {item.unit}
                                </span>
                            </div>
                        ))
                    )}
                </div>

                {/* RIGHT - Recent activity -------------------------------- */}
                <div style={styles.panel}>
                    <h2 style={styles.panelHeading(COLOURS.blue)}>
                        🕐 Recent Activity
                    </h2>

                    {recentActivity.length === 0 ? (
                        <div style={styles.emptyMuted}>No recent activity.</div>
                    ) : (
                        recentActivity.map((log, idx) => {
                            const isPositive = parseFloat(log.change_qty) > 0;
                            return (
                                <div
                                    key={log.log_id}
                                    style={{
                                        ...styles.activityRow,
                                        ...(hoveredActivity === idx
                                            ? styles.activityRowHover
                                            : {}),
                                    }}
                                    onMouseEnter={() => setHoveredActivity(idx)}
                                    onMouseLeave={() => setHoveredActivity(null)}
                                >
                                    <div style={styles.activityMain}>
                                        <div style={styles.activityNameRow}>
                                            <span style={styles.activityDot(isPositive)} />
                                            <span style={styles.activityItemName}>
                                                {log.item_name}
                                            </span>
                                        </div>
                                        <span style={styles.activityChange(isPositive)}>
                                            {formatChange(log.change_qty)}
                                        </span>
                                    </div>
                                    <div style={styles.activityMeta}>
                                        {log.user_email || 'system'}
                                        {' · '}
                                        {formatTimestamp(log.timestamp)}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

import { useEffect, useState } from 'react';
import api from '../api/axios';

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
    pageTitle: {
        fontSize: '1.6rem',
        margin: '0 0 1.25rem',
        color: COLOURS.ink,
    },
    kpiGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '1rem',
        marginBottom: '1.25rem',
    },
    kpiCard: (accent) => ({
        background: '#ffffff',
        borderRadius: 8,
        borderLeft: `4px solid ${accent}`,
        padding: '1rem 1.25rem',
        boxShadow: '0 1px 3px rgba(15, 30, 60, 0.06)',
        position: 'relative',
        minHeight: 96,
    }),
    kpiIcon: {
        position: 'absolute',
        top: '0.75rem',
        right: '0.9rem',
        fontSize: '1.5rem',
        opacity: 0.55,
    },
    kpiLabel: {
        fontSize: '0.82rem',
        color: COLOURS.sub,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        marginBottom: '0.3rem',
    },
    kpiNumber: {
        fontSize: '2.1rem',
        fontWeight: 700,
        color: COLOURS.ink,
        lineHeight: 1.1,
    },
    twoCol: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
    },
    panel: {
        background: '#ffffff',
        borderRadius: 8,
        padding: '1.1rem 1.25rem',
        boxShadow: '0 1px 3px rgba(15, 30, 60, 0.06)',
    },
    panelHeading: (accent) => ({
        fontSize: '1.05rem',
        fontWeight: 600,
        color: accent,
        margin: '0 0 0.75rem',
    }),
    lowStockRow: (isLast) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.55rem 0',
        borderBottom: isLast ? 'none' : `1px solid ${COLOURS.line}`,
    }),
    lowStockName: {
        color: COLOURS.ink,
        fontWeight: 500,
    },
    lowStockBadge: {
        background: COLOURS.bgBadge,
        color: COLOURS.fgBadge,
        padding: '0.2rem 0.65rem',
        borderRadius: 999,
        fontSize: '0.82rem',
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
    },
    allStockedOk: {
        color: COLOURS.green,
        padding: '0.75rem 0',
        fontWeight: 500,
    },
    activityRow: (isLast) => ({
        padding: '0.6rem 0',
        borderBottom: isLast ? 'none' : `1px solid ${COLOURS.line}`,
    }),
    activityMain: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
    },
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
        color: COLOURS.grey,
        padding: '0.75rem 0',
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
};

// --- helpers ---------------------------------------------------------------

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

// --- small presentational pieces -------------------------------------------

function KpiCard({ icon, value, label, accent }) {
    return (
        <div style={styles.kpiCard(accent)}>
            <div style={styles.kpiIcon}>{icon}</div>
            <div style={styles.kpiLabel}>{label}</div>
            <div style={styles.kpiNumber}>{value ?? 0}</div>
        </div>
    );
}

// --- page ------------------------------------------------------------------

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');

        api.get('/reports/dashboard')
            .then((res) => {
                if (!cancelled) setData(res.data);
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err.response?.data?.error || 'Failed to load dashboard');
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

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

    return (
        <div>
            <h1 style={styles.pageTitle}>Dashboard</h1>

            {/* KPI row ----------------------------------------------------- */}
            <div style={styles.kpiGrid}>
                <KpiCard
                    icon="📦"
                    value={data.total_items}
                    label="Total Items"
                    accent={COLOURS.blue}
                />
                <KpiCard
                    icon="⚠️"
                    value={data.low_stock}
                    label="Low Stock Alerts"
                    accent={COLOURS.red}
                />
                <KpiCard
                    icon="🏪"
                    value={data.suppliers}
                    label="Suppliers"
                    accent={COLOURS.green}
                />
                <KpiCard
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
                    <h2 style={styles.panelHeading(COLOURS.red)}>
                        ⚠️ Low Stock Items
                    </h2>

                    {lowStockItems.length === 0 ? (
                        <div style={styles.allStockedOk}>
                            ✅ All items are well stocked!
                        </div>
                    ) : (
                        lowStockItems.map((item, idx) => (
                            <div
                                key={item.item_id}
                                style={styles.lowStockRow(idx === lowStockItems.length - 1)}
                            >
                                <span style={styles.lowStockName}>{item.name}</span>
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
                                    style={styles.activityRow(idx === recentActivity.length - 1)}
                                >
                                    <div style={styles.activityMain}>
                                        <span style={styles.activityItemName}>
                                            {log.item_name}
                                        </span>
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

import { useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import api from '../api/axios';

// --- styles (all inline; no CSS file) --------------------------------------

const C = {
    blue:    '#3d6acb',
    ink:     '#1e3a5f',
    sub:     '#5d6a78',
    grey:    '#7b8794',
    line:    '#eef0f2',
    border:  '#cbd2d9',
    bgPanel: '#ffffff',
    bgHead:  '#f5f7fa',
    used:    '#c0392b',   // red  -- chart + table
    restock: '#27ae60',   // green -- chart + table
    lowBg:   '#fce8e6',
    lowFg:   '#a8262b',
};

const styles = {
    title: {
        margin: '0 0 1rem',
        fontSize: '1.6rem',
        color: C.ink,
    },
    formPanel: {
        background: C.bgPanel,
        padding: '1.1rem 1.25rem',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(15,30,60,0.06)',
        marginBottom: '1.25rem',
    },
    formRow: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: '1rem',
        flexWrap: 'wrap',
    },
    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3rem',
        fontSize: '0.82rem',
        color: '#3e4c59',
    },
    input: {
        padding: '0.5rem 0.7rem',
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        fontSize: '0.95rem',
        fontFamily: 'inherit',
        background: '#fafbfc',
    },
    submitBtn: {
        background: C.blue,
        color: '#ffffff',
        border: 'none',
        padding: '0.55rem 1.2rem',
        borderRadius: 6,
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '0.9rem',
    },
    submitBtnDisabled: {
        background: '#9aa5b1',
        cursor: 'not-allowed',
    },
    formError: {
        background: C.lowBg,
        color: C.lowFg,
        border: `1px solid #f4b1ad`,
        padding: '0.5rem 0.75rem',
        borderRadius: 6,
        marginTop: '0.75rem',
        fontSize: '0.85rem',
    },
    kpiGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '1rem',
        marginBottom: '1.25rem',
    },
    kpiCard: (accent) => ({
        background: C.bgPanel,
        borderRadius: 8,
        borderLeft: `4px solid ${accent}`,
        padding: '1rem 1.25rem',
        boxShadow: '0 1px 3px rgba(15,30,60,0.06)',
        minHeight: 96,
    }),
    kpiLabel: {
        fontSize: '0.78rem',
        color: C.sub,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        marginBottom: '0.3rem',
    },
    kpiNumber: {
        fontSize: '1.9rem',
        fontWeight: 700,
        color: C.ink,
        lineHeight: 1.1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    kpiNumberSmall: {
        fontSize: '1.2rem',
        fontWeight: 700,
        color: C.ink,
        lineHeight: 1.2,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        marginTop: '0.4rem',
    },
    chartCard: {
        background: C.bgPanel,
        padding: '1.1rem 1.25rem',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(15,30,60,0.06)',
        marginBottom: '1.25rem',
    },
    chartHeading: {
        margin: '0 0 0.75rem',
        fontSize: '1.05rem',
        fontWeight: 600,
        color: C.ink,
    },
    tableWrap: {
        background: C.bgPanel,
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(15,30,60,0.06)',
        overflow: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: (alignRight) => ({
        textAlign: alignRight ? 'right' : 'left',
        padding: '0.7rem 0.95rem',
        fontSize: '0.74rem',
        color: C.sub,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: `1px solid #e4e7eb`,
        background: C.bgHead,
        fontWeight: 600,
        whiteSpace: 'nowrap',
    }),
    td: (alignRight, color) => ({
        padding: '0.7rem 0.95rem',
        color: color || '#1f2933',
        fontSize: '0.9rem',
        textAlign: alignRight ? 'right' : 'left',
        fontVariantNumeric: 'tabular-nums',
        fontWeight: alignRight ? 600 : 400,
        whiteSpace: 'nowrap',
    }),
    rowBorder: (isLast) => ({
        borderBottom: isLast ? 'none' : `1px solid ${C.line}`,
    }),
    emptyState: {
        textAlign: 'center',
        padding: '2.5rem 1rem',
        color: C.grey,
    },
    loading: { padding: '2rem', color: C.sub },
};

// --- helpers ---------------------------------------------------------------

function todayIso() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function isoDaysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function num(v) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
}

// --- page ------------------------------------------------------------------

export default function Reports() {
    const [from, setFrom] = useState(isoDaysAgo(7));
    const [to,   setTo]   = useState(todayIso());

    const [data, setData]       = useState(null); // null until first submit
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');

    async function handleSubmit(event) {
        event.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.get('/reports/usage', { params: { from, to } });
            setData(res.data || []);
        } catch (err) {
            setData(null);
            setError(err.response?.data?.error || 'Failed to load report');
        } finally {
            setLoading(false);
        }
    }

    // Derived values once data is present ---------------------------------
    const hasData = Array.isArray(data);

    const totalUsed     = hasData ? data.reduce((s, r) => s + num(r.total_used),  0) : 0;
    const totalRestocked = hasData ? data.reduce((s, r) => s + num(r.total_added), 0) : 0;
    const mostUsedItem  = hasData && data.length > 0 ? data[0].name : '—';

    // Chart-friendly shape
    const chartData = hasData
        ? data.map((r) => ({
              name:      r.name,
              used:      num(r.total_used),
              restocked: num(r.total_added),
          }))
        : [];

    return (
        <div>
            <h1 style={styles.title}>📈 Reports</h1>

            {/* Date range form ---------------------------------------- */}
            <form onSubmit={handleSubmit} style={styles.formPanel}>
                <div style={styles.formRow}>
                    <label style={styles.field}>
                        <span>From Date</span>
                        <input
                            type="date"
                            style={styles.input}
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            max={to || undefined}
                            required
                        />
                    </label>

                    <label style={styles.field}>
                        <span>To Date</span>
                        <input
                            type="date"
                            style={styles.input}
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            min={from || undefined}
                            required
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={loading}
                        style={
                            loading
                                ? { ...styles.submitBtn, ...styles.submitBtnDisabled }
                                : styles.submitBtn
                        }
                    >
                        {loading ? 'Generating...' : '📊 Generate Report'}
                    </button>
                </div>

                {error && <div style={styles.formError}>{error}</div>}
            </form>

            {/* Results - rendered only after first successful submit -- */}
            {hasData && data.length === 0 && (
                <div style={{ ...styles.chartCard, ...styles.emptyState }}>
                    No movement recorded between <strong>{from}</strong> and{' '}
                    <strong>{to}</strong>.
                </div>
            )}

            {hasData && data.length > 0 && (
                <>
                    {/* Summary cards ---------------------------------- */}
                    <div style={styles.kpiGrid}>
                        <div style={styles.kpiCard(C.blue)}>
                            <div style={styles.kpiLabel}>Items Tracked</div>
                            <div style={styles.kpiNumber}>{data.length}</div>
                        </div>

                        <div style={styles.kpiCard(C.used)}>
                            <div style={styles.kpiLabel}>Total Used</div>
                            <div style={styles.kpiNumber}>{totalUsed.toFixed(2)}</div>
                        </div>

                        <div style={styles.kpiCard(C.restock)}>
                            <div style={styles.kpiLabel}>Total Restocked</div>
                            <div style={styles.kpiNumber}>{totalRestocked.toFixed(2)}</div>
                        </div>

                        <div style={styles.kpiCard('#e8830c')}>
                            <div style={styles.kpiLabel}>Most Used Item</div>
                            <div
                                style={styles.kpiNumberSmall}
                                title={mostUsedItem}
                            >
                                {mostUsedItem}
                            </div>
                        </div>
                    </div>

                    {/* Bar chart -------------------------------------- */}
                    <div style={styles.chartCard}>
                        <h2 style={styles.chartHeading}>
                            Usage vs Restock per Item
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={chartData}
                                margin={{ top: 10, right: 20, left: 0, bottom: 60 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e4e7eb" />
                                <XAxis
                                    dataKey="name"
                                    angle={-35}
                                    textAnchor="end"
                                    interval={0}
                                    height={80}
                                    tick={{ fontSize: 12, fill: C.sub }}
                                />
                                <YAxis tick={{ fontSize: 12, fill: C.sub }} />
                                <Tooltip
                                    contentStyle={{
                                        background: '#ffffff',
                                        border: `1px solid ${C.line}`,
                                        borderRadius: 6,
                                        fontSize: '0.85rem',
                                    }}
                                    cursor={{ fill: 'rgba(61, 106, 203, 0.08)' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
                                <Bar dataKey="used"      name="Used"      fill={C.used} />
                                <Bar dataKey="restocked" name="Restocked" fill={C.restock} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Data table ------------------------------------- */}
                    <div style={styles.tableWrap}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th(false)}>Item</th>
                                    <th style={styles.th(false)}>Category</th>
                                    <th style={styles.th(false)}>Unit</th>
                                    <th style={styles.th(true)}>Total Used</th>
                                    <th style={styles.th(true)}>Total Restocked</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((r, idx) => {
                                    const isLast = idx === data.length - 1;
                                    return (
                                        <tr key={r.item_id} style={styles.rowBorder(isLast)}>
                                            <td style={styles.td(false)}>{r.name}</td>
                                            <td style={styles.td(false)}>{r.category}</td>
                                            <td style={styles.td(false)}>{r.unit}</td>
                                            <td style={styles.td(true, C.used)}>
                                                {num(r.total_used).toFixed(2)}
                                            </td>
                                            <td style={styles.td(true, C.restock)}>
                                                {num(r.total_added).toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

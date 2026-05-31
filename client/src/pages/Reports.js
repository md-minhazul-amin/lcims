/**
 * @file Reports.js
 * @description Usage reports page with date range selection and Recharts bar chart
 * @author The IT Crowd
 * @date May 2026
 * @project LCIMS - Local Cafe Inventory Management System
 * @course CPRO306 - Capstone Project, Kent Institute Australia
 */

// ============================================================================
// File:    pages/Reports.js
// Purpose: Date-ranged usage report — GET /api/reports/usage with from/to,
//          summary KPIs, Recharts bar chart (used vs restocked), and data table.
// Author:  The IT Crowd
// Date:    May 2026
// Project: LCIMS - Local Cafe Inventory Management System
// ============================================================================

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
    used:    '#e05c5c',
    restock: '#40b974',
    usedTd:  '#d64545',
    restockTd: '#2c9f64',
    lowBg:   '#fce8e6',
    lowFg:   '#a8262b',
};

const styles = {
    header: {
        marginBottom: '1rem',
    },
    title: {
        margin: 0,
        fontSize: '1.6rem',
        color: C.ink,
    },
    subtitle: {
        fontSize: '0.85rem',
        color: '#5d6a78',
        margin: '0.2rem 0 0',
    },
    controlBar: {
        background: '#ffffff',
        borderRadius: 12,
        padding: '1rem 1.25rem',
        boxShadow: '0 2px 8px rgba(15,30,60,0.08)',
        border: '1px solid #eef0f2',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '1rem',
        flexWrap: 'wrap',
        marginBottom: '1.25rem',
    },
    formRow: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: '1rem',
        flexWrap: 'wrap',
        flex: 1,
    },
    field: {
        display: 'flex',
        flexDirection: 'column',
    },
    fieldLabel: {
        fontSize: '0.78rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: '#5d6a78',
        fontWeight: 600,
        marginBottom: '0.35rem',
    },
    input: (focused) => ({
        padding: '0.55rem 0.85rem',
        border: focused ? '1.5px solid #3d6acb' : '1.5px solid #e2e8f0',
        borderRadius: 8,
        fontSize: '0.92rem',
        fontFamily: 'inherit',
        background: '#fafbfc',
        cursor: 'pointer',
        boxShadow: focused ? '0 0 0 3px rgba(61,106,203,0.12)' : 'none',
        transition: 'all 0.18s',
        outline: 'none',
    }),
    submitBtn: (hovered) => ({
        background: 'linear-gradient(90deg, #2f55a5, #3d6acb)',
        color: '#ffffff',
        border: 'none',
        padding: '0.6rem 1.4rem',
        borderRadius: 8,
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '0.9rem',
        boxShadow: hovered
            ? '0 4px 14px rgba(61,106,203,0.38)'
            : '0 2px 8px rgba(61,106,203,0.25)',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'transform 0.18s, box-shadow 0.18s',
        whiteSpace: 'nowrap',
    }),
    submitBtnDisabled: {
        background: '#9aa5b1',
        boxShadow: 'none',
        transform: 'none',
        cursor: 'not-allowed',
    },
    formError: {
        background: C.lowBg,
        color: C.lowFg,
        border: '1px solid #f4b1ad',
        padding: '0.5rem 0.75rem',
        borderRadius: 8,
        marginTop: '0.75rem',
        fontSize: '0.85rem',
        flexBasis: '100%',
    },
    statRow: {
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
    },
    miniCard: (accent) => ({
        background: '#ffffff',
        borderRadius: 10,
        padding: '0.85rem 1.1rem',
        borderLeft: `3px solid ${accent}`,
        boxShadow: '0 1px 4px rgba(15,30,60,0.07)',
        flex: '1 1 160px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.2rem',
    }),
    miniLabel: {
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: '#7b8794',
    },
    miniValue: {
        fontSize: '1.6rem',
        fontWeight: 700,
        color: '#1e3a5f',
        lineHeight: 1.1,
    },
    chartCard: {
        background: '#ffffff',
        borderRadius: 14,
        padding: '1.25rem 1rem 0.75rem',
        boxShadow: '0 2px 8px rgba(15,30,60,0.08)',
        border: '1px solid #eef0f2',
        marginBottom: '1rem',
    },
    chartTitle: {
        fontSize: '0.9rem',
        fontWeight: 600,
        color: '#5d6a78',
        margin: '0 0 0.5rem',
    },
    tableWrap: {
        background: '#ffffff',
        borderRadius: 14,
        boxShadow: '0 2px 8px rgba(15,30,60,0.08)',
        overflow: 'auto',
        border: '1px solid #eef0f2',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    theadRow: {
        background: 'linear-gradient(90deg, #f5f8ff, #f0f4f8)',
    },
    th: (alignRight) => ({
        textAlign: alignRight ? 'right' : 'left',
        padding: '0.85rem 1rem',
        fontSize: '0.78rem',
        color: '#5d6a78',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        borderBottom: '2px solid #e2e8f0',
        background: 'transparent',
        fontWeight: 600,
        whiteSpace: 'nowrap',
    }),
    row: (hovered, isEven, isLast) => ({
        background: hovered ? '#f7f9ff' : isEven ? '#f9fafc' : '#ffffff',
        transition: 'background 0.12s',
    }),
    td: (alignRight, isLast, color, bold) => ({
        padding: '0.85rem 1rem',
        color: color || '#1f2933',
        fontSize: '0.9rem',
        textAlign: alignRight ? 'right' : 'left',
        fontVariantNumeric: 'tabular-nums',
        fontWeight: bold ? 600 : 400,
        borderBottom: isLast ? 'none' : '1px solid #f0f2f5',
        whiteSpace: 'nowrap',
    }),
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
    loading: { padding: '2rem', color: C.sub },
};

// --- helpers ---------------------------------------------------------------

// Default date range: last 7 days through today (YYYY-MM-DD for API params).
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

    // data stays null until user clicks Generate Report (no fetch on mount).
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');

    const [submitHovered, setSubmitHovered] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [hoveredRowId, setHoveredRowId] = useState(null);

    // handleSubmit: fetch usage aggregates; server splits negative change_qty
    // (used) vs positive (total_added / restocked) per item in the window.
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

    // Client-side totals from API rows (ordered by total_used DESC on server).
    const hasData = Array.isArray(data);

    const totalUsed     = hasData ? data.reduce((s, r) => s + num(r.total_used),  0) : 0;
    const totalRestocked = hasData ? data.reduce((s, r) => s + num(r.total_added), 0) : 0;

    // Map API fields to Recharts keys: used / restocked.
    const chartData = hasData
        ? data.map((r) => ({
              name:      r.name,
              used:      num(r.total_used),
              restocked: num(r.total_added),
          }))
        : [];

    return (
        <div>
            <div style={styles.header}>
                <h1 style={styles.title}>📈 Reports</h1>
                <p style={styles.subtitle}>View stock usage and restock activity over time</p>
            </div>

            {/* Date range form ---------------------------------------- */}
            <form onSubmit={handleSubmit} style={styles.controlBar}>
                <div style={styles.formRow}>
                    <label style={styles.field}>
                        <span style={styles.fieldLabel}>From Date</span>
                        <input
                            type="date"
                            style={styles.input(focusedField === 'from')}
                            value={from}
                            onFocus={() => setFocusedField('from')}
                            onBlur={() => setFocusedField(null)}
                            onChange={(e) => setFrom(e.target.value)}
                            max={to || undefined}
                            required
                        />
                    </label>

                    <label style={styles.field}>
                        <span style={styles.fieldLabel}>To Date</span>
                        <input
                            type="date"
                            style={styles.input(focusedField === 'to')}
                            value={to}
                            onFocus={() => setFocusedField('to')}
                            onBlur={() => setFocusedField(null)}
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
                                ? { ...styles.submitBtn(false), ...styles.submitBtnDisabled }
                                : styles.submitBtn(submitHovered)
                        }
                        onMouseEnter={() => !loading && setSubmitHovered(true)}
                        onMouseLeave={() => setSubmitHovered(false)}
                    >
                        {loading ? 'Generating...' : '📊 Generate Report'}
                    </button>
                </div>

                {error && <div style={styles.formError}>{error}</div>}
            </form>

            {/* Results - rendered only after first successful submit -- */}
            {hasData && data.length === 0 && (
                <div style={styles.emptyState}>
                    <span style={styles.emptyEmoji}>📊</span>
                    <p style={styles.emptyTitle}>No movement in this period</p>
                    <p style={styles.emptySub}>
                        No movement recorded between <strong>{from}</strong> and{' '}
                        <strong>{to}</strong>
                    </p>
                </div>
            )}

            {hasData && data.length > 0 && (
                <>
                    {/* Summary mini-cards -------------------------------- */}
                    <div style={styles.statRow}>
                        <div style={styles.miniCard(C.usedTd)}>
                            <span style={styles.miniLabel}>Total Used</span>
                            <span style={styles.miniValue}>{totalUsed.toFixed(2)}</span>
                        </div>
                        <div style={styles.miniCard(C.restockTd)}>
                            <span style={styles.miniLabel}>Total Restocked</span>
                            <span style={styles.miniValue}>{totalRestocked.toFixed(2)}</span>
                        </div>
                        <div style={styles.miniCard(C.blue)}>
                            <span style={styles.miniLabel}>Items Tracked</span>
                            <span style={styles.miniValue}>{data.length}</span>
                        </div>
                    </div>

                    {/* Bar chart -------------------------------------- */}
                    <div style={styles.chartCard}>
                        <p style={styles.chartTitle}>Stock Movement by Item</p>
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
                                <Bar
                                    dataKey="used"
                                    name="Used"
                                    fill={C.used}
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="restocked"
                                    name="Restocked"
                                    fill={C.restock}
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Data table ------------------------------------- */}
                    <div style={styles.tableWrap}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.theadRow}>
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
                                    const isEven = idx % 2 === 1;
                                    const isHover = hoveredRowId === r.item_id;

                                    return (
                                        <tr
                                            key={r.item_id}
                                            style={styles.row(isHover, isEven, isLast)}
                                            onMouseEnter={() => setHoveredRowId(r.item_id)}
                                            onMouseLeave={() => setHoveredRowId(null)}
                                        >
                                            <td style={styles.td(false, isLast)}>{r.name}</td>
                                            <td style={styles.td(false, isLast)}>{r.category}</td>
                                            <td style={styles.td(false, isLast)}>{r.unit}</td>
                                            <td
                                                style={styles.td(
                                                    true,
                                                    isLast,
                                                    C.usedTd,
                                                    true
                                                )}
                                            >
                                                {num(r.total_used).toFixed(2)}
                                            </td>
                                            <td
                                                style={styles.td(
                                                    true,
                                                    isLast,
                                                    C.restockTd,
                                                    true
                                                )}
                                            >
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

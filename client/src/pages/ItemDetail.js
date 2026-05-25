/**
 * @file ItemDetail.js
 * @description Individual inventory item detail page with stock adjustment and movement history
 * @author The IT Crowd
 * @date May 2026
 * @project LCIMS - Local Cafe Inventory Management System
 * @course CPRO306 - Capstone Project, Kent Institute Australia
 */

// ============================================================================
// File:    pages/ItemDetail.js
// Purpose: Single inventory item — edit fields (Manager/Admin), PATCH stock
//          with reason, view stock_logs history. Route param :id from React Router.
// Author:  The IT Crowd
// Date:    May 2026
// Project: LCIMS - Local Cafe Inventory Management System
// ============================================================================

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// --- styles (all inline; no CSS file) --------------------------------------

const C = {
    blue:    '#3d6acb',
    blueDk:  '#2f55a5',
    red:     '#d64545',
    redDk:   '#b13434',
    green:   '#2c9f64',
    ink:     '#1e3a5f',
    sub:     '#5d6a78',
    grey:    '#7b8794',
    line:    '#eef0f2',
    border:  '#cbd2d9',
    bg:      '#ffffff',
    bgRow:   '#fafbfc',
    okBg:    '#dff5e6',
    okFg:    '#1d703f',
    lowBg:   '#fce8e6',
    lowFg:   '#a8262b',
};

const styles = {
    topBar: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1rem',
    },
    backLink: {
        color: C.sub,
        textDecoration: 'none',
        padding: '0.4rem 0.7rem',
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        background: '#ffffff',
        fontSize: '0.85rem',
    },
    title: {
        margin: 0,
        fontSize: '1.5rem',
        color: C.ink,
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    badgeOk: {
        background: C.okBg,
        color: C.okFg,
        padding: '0.22rem 0.65rem',
        borderRadius: 999,
        fontSize: '0.78rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        display: 'inline-block',
    },
    badgeLow: {
        background: C.lowBg,
        color: C.lowFg,
        padding: '0.22rem 0.65rem',
        borderRadius: 999,
        fontSize: '0.78rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        display: 'inline-block',
    },
    twoCol: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)',
        gap: '1rem',
        alignItems: 'start',
    },
    card: {
        background: C.bg,
        borderRadius: 8,
        padding: '1.25rem 1.4rem',
        boxShadow: '0 1px 3px rgba(15,30,60,0.06)',
    },
    cardHeading: {
        margin: '0 0 1rem',
        fontSize: '1.05rem',
        fontWeight: 600,
        color: C.ink,
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '0.85rem 1rem',
        marginBottom: '1rem',
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
        width: '100%',
        boxSizing: 'border-box',
    },
    inputDisabled: {
        background: '#f5f7fa',
        color: '#5d6a78',
        cursor: 'not-allowed',
    },
    actionsRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: '0.25rem',
    },
    saveBtn: {
        background: C.blue,
        color: '#ffffff',
        border: 'none',
        padding: '0.6rem 1.3rem',
        borderRadius: 6,
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '0.9rem',
    },
    saveBtnDisabled: {
        background: '#9aa5b1',
        cursor: 'not-allowed',
    },
    deleteBtn: {
        background: '#ffffff',
        color: C.red,
        border: `1px solid ${C.red}`,
        padding: '0.6rem 1.1rem',
        borderRadius: 6,
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '0.9rem',
    },
    deleteBtnHover: {
        background: C.red,
        color: '#ffffff',
    },
    divider: {
        border: 'none',
        borderTop: `1px solid ${C.line}`,
        margin: '1.25rem 0',
    },
    sectionHeading: {
        margin: '0 0 0.75rem',
        fontSize: '1rem',
        fontWeight: 600,
        color: C.ink,
    },
    stockGrid: {
        display: 'grid',
        gridTemplateColumns: '160px 1fr',
        gap: '0.85rem 1rem',
        marginBottom: '0.9rem',
    },
    stockBtnRow: {
        display: 'flex',
        justifyContent: 'flex-end',
    },
    updateStockBtn: {
        background: C.green,
        color: '#ffffff',
        border: 'none',
        padding: '0.55rem 1.2rem',
        borderRadius: 6,
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '0.9rem',
    },
    formError: {
        background: C.lowBg,
        color: C.lowFg,
        border: `1px solid #f4b1ad`,
        padding: '0.5rem 0.75rem',
        borderRadius: 6,
        marginBottom: '0.75rem',
        fontSize: '0.85rem',
    },
    formSuccess: {
        background: C.okBg,
        color: C.okFg,
        border: `1px solid #b6e3c8`,
        padding: '0.5rem 0.75rem',
        borderRadius: 6,
        marginBottom: '0.75rem',
        fontSize: '0.85rem',
    },
    historyScroll: {
        maxHeight: 480,
        overflowY: 'auto',
        paddingRight: '0.25rem',
    },
    logRow: (isLast) => ({
        padding: '0.65rem 0',
        borderBottom: isLast ? 'none' : `1px solid ${C.line}`,
    }),
    logMain: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
    },
    logReason: {
        color: C.ink,
        fontWeight: 500,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    logChange: (positive) => ({
        color: positive ? C.green : C.red,
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
    }),
    logMeta: {
        marginTop: '0.2rem',
        fontSize: '0.78rem',
        color: C.grey,
    },
    historyEmpty: {
        color: C.grey,
        padding: '1rem 0',
        textAlign: 'center',
        fontSize: '0.9rem',
    },
    loading: { padding: '2rem', color: C.sub },
    error: {
        background: C.lowBg,
        color: C.lowFg,
        border: `1px solid #f4b1ad`,
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

const emptyForm = {
    name: '',
    category: '',
    unit: '',
    quantity: '',
    threshold: '',
    supplier_id: '',
};

// --- page ------------------------------------------------------------------

export default function ItemDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    // Staff: read-only item fields but may PATCH /inventory/:id/stock.
    const canManage = user?.role === 'Manager' || user?.role === 'Admin';

    const [item, setItem] = useState(null);
    const [logs, setLogs] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveOk, setSaveOk] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [deleteHover, setDeleteHover] = useState(false);

    const [stockForm, setStockForm] = useState({ change_qty: '', reason: '' });
    const [stockSaving, setStockSaving] = useState(false);
    const [stockError, setStockError] = useState('');
    const [stockOk, setStockOk] = useState('');

    // loadAll: parallel fetch item, logs, and suppliers; sync form state from item.
    async function loadAll() {
        const [itemRes, logsRes, supRes] = await Promise.all([
            api.get(`/inventory/${id}`),
            api.get(`/inventory/${id}/logs`),
            api.get('/suppliers'),
        ]);
        setItem(itemRes.data);
        setLogs(logsRes.data || []);
        setSuppliers(supRes.data || []);
        setForm({
            name:        itemRes.data.name        ?? '',
            category:    itemRes.data.category    ?? '',
            unit:        itemRes.data.unit        ?? '',
            quantity:    itemRes.data.quantity    ?? '',
            threshold:   itemRes.data.threshold   ?? '',
            supplier_id: itemRes.data.supplier_id != null ? String(itemRes.data.supplier_id) : '',
        });
    }

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');

        (async () => {
            try {
                await loadAll();
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.error ||
                        (err.response?.status === 404
                            ? 'Item not found.'
                            : 'Failed to load item.')
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // handleSave: PUT /inventory/:id — Manager/Admin only.
    async function handleSave(event) {
        event.preventDefault();
        if (!canManage) return;
        setSaveError('');
        setSaveOk('');
        setSaving(true);
        try {
            await api.put(`/inventory/${id}`, {
                name:        form.name.trim(),
                category:    form.category.trim(),
                unit:        form.unit.trim(),
                quantity:    parseFloat(form.quantity) || 0,
                threshold:   parseFloat(form.threshold) || 0,
                supplier_id: form.supplier_id ? parseInt(form.supplier_id, 10) : null,
            });
            await loadAll();
            setSaveOk('Item saved.');
        } catch (err) {
            setSaveError(err.response?.data?.error || 'Failed to save item');
        } finally {
            setSaving(false);
        }
    }

    // handleDelete: DELETE /inventory/:id then redirect to list.
    async function handleDelete() {
        if (!canManage) return;
        const confirmed = window.confirm(
            `Delete "${item?.name}"? This cannot be undone.`
        );
        if (!confirmed) return;

        setDeleting(true);
        try {
            await api.delete(`/inventory/${id}`);
            navigate('/inventory', { replace: true });
        } catch (err) {
            setSaveError(err.response?.data?.error || 'Failed to delete item');
            setDeleting(false);
        }
    }

    // handleStockUpdate: PATCH /inventory/:id/stock (negative = usage, positive = restock).
    async function handleStockUpdate(event) {
        event.preventDefault();
        setStockError('');
        setStockOk('');

        const n = parseFloat(stockForm.change_qty);
        if (!Number.isFinite(n) || n === 0) {
            setStockError('Enter a non-zero number for change.');
            return;
        }

        setStockSaving(true);
        try {
            await api.patch(`/inventory/${id}/stock`, {
                change_qty: n,
                reason:     stockForm.reason.trim() || null,
            });
            setStockForm({ change_qty: '', reason: '' });
            setStockOk('Stock updated.');
            await loadAll();
        } catch (err) {
            setStockError(err.response?.data?.error || 'Failed to update stock');
        } finally {
            setStockSaving(false);
        }
    }

    // -- render ------------------------------------------------------------
    if (loading) {
        return <div style={styles.loading}>Loading item...</div>;
    }
    if (error) {
        return (
            <div>
                <div style={styles.topBar}>
                    <Link to="/inventory" style={styles.backLink}>← Back to inventory</Link>
                </div>
                <div style={styles.error}>{error}</div>
            </div>
        );
    }
    if (!item) return null;

    const qty = parseFloat(item.quantity);
    const thr = parseFloat(item.threshold);
    const isLow = Number.isFinite(qty) && Number.isFinite(thr) && qty < thr;

    return (
        <div>
            {/* Top bar -------------------------------------------------- */}
            <div style={styles.topBar}>
                <Link to="/inventory" style={styles.backLink}>← Back</Link>
                <h1 style={styles.title}>{item.name}</h1>
                <span style={isLow ? styles.badgeLow : styles.badgeOk}>
                    {isLow ? '⚠ Low Stock' : '✓ OK'}
                </span>
            </div>

            <div style={styles.twoCol}>
                {/* LEFT: Item Details ---------------------------------- */}
                <div style={styles.card}>
                    <h2 style={styles.cardHeading}>Item Details</h2>

                    {saveError && <div style={styles.formError}>{saveError}</div>}
                    {saveOk    && <div style={styles.formSuccess}>{saveOk}</div>}

                    <form onSubmit={handleSave}>
                        <div style={styles.formGrid}>
                            <label style={styles.field}>
                                <span>Name</span>
                                <input
                                    type="text"
                                    style={{
                                        ...styles.input,
                                        ...(canManage ? null : styles.inputDisabled),
                                    }}
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    disabled={!canManage}
                                    required
                                />
                            </label>

                            <label style={styles.field}>
                                <span>Category</span>
                                <input
                                    type="text"
                                    style={{
                                        ...styles.input,
                                        ...(canManage ? null : styles.inputDisabled),
                                    }}
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    disabled={!canManage}
                                    required
                                />
                            </label>

                            <label style={styles.field}>
                                <span>Unit</span>
                                <input
                                    type="text"
                                    style={{
                                        ...styles.input,
                                        ...(canManage ? null : styles.inputDisabled),
                                    }}
                                    value={form.unit}
                                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                    disabled={!canManage}
                                    required
                                />
                            </label>

                            <label style={styles.field}>
                                <span>Supplier</span>
                                <select
                                    style={{
                                        ...styles.input,
                                        ...(canManage ? null : styles.inputDisabled),
                                    }}
                                    value={form.supplier_id}
                                    onChange={(e) =>
                                        setForm({ ...form, supplier_id: e.target.value })
                                    }
                                    disabled={!canManage}
                                >
                                    <option value="">(none)</option>
                                    {suppliers.map((s) => (
                                        <option key={s.supplier_id} value={s.supplier_id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label style={styles.field}>
                                <span>Quantity</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    style={{
                                        ...styles.input,
                                        ...(canManage ? null : styles.inputDisabled),
                                    }}
                                    value={form.quantity}
                                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                    disabled={!canManage}
                                />
                            </label>

                            <label style={styles.field}>
                                <span>Threshold</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    style={{
                                        ...styles.input,
                                        ...(canManage ? null : styles.inputDisabled),
                                    }}
                                    value={form.threshold}
                                    onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                                    disabled={!canManage}
                                />
                            </label>
                        </div>

                        {canManage && (
                            <div style={styles.actionsRow}>
                                <button
                                    type="button"
                                    onMouseEnter={() => setDeleteHover(true)}
                                    onMouseLeave={() => setDeleteHover(false)}
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    style={
                                        deleteHover
                                            ? { ...styles.deleteBtn, ...styles.deleteBtnHover }
                                            : styles.deleteBtn
                                    }
                                >
                                    {deleting ? 'Deleting...' : '🗑 Delete'}
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={
                                        saving
                                            ? { ...styles.saveBtn, ...styles.saveBtnDisabled }
                                            : styles.saveBtn
                                    }
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </form>

                    <hr style={styles.divider} />

                    {/* Update Stock subsection ---------------------- */}
                    <h3 style={styles.sectionHeading}>Update Stock Quantity</h3>

                    {stockError && <div style={styles.formError}>{stockError}</div>}
                    {stockOk    && <div style={styles.formSuccess}>{stockOk}</div>}

                    <form onSubmit={handleStockUpdate}>
                        <div style={styles.stockGrid}>
                            <label style={styles.field}>
                                <span>Change (qty)</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    style={styles.input}
                                    placeholder="e.g. -2 (used) or +10 (restocked)"
                                    value={stockForm.change_qty}
                                    onChange={(e) =>
                                        setStockForm({
                                            ...stockForm,
                                            change_qty: e.target.value,
                                        })
                                    }
                                />
                            </label>

                            <label style={styles.field}>
                                <span>Reason</span>
                                <input
                                    type="text"
                                    style={styles.input}
                                    placeholder="e.g. Morning service usage"
                                    value={stockForm.reason}
                                    onChange={(e) =>
                                        setStockForm({
                                            ...stockForm,
                                            reason: e.target.value,
                                        })
                                    }
                                />
                            </label>
                        </div>

                        <div style={styles.stockBtnRow}>
                            <button
                                type="submit"
                                disabled={stockSaving || !stockForm.change_qty}
                                style={
                                    stockSaving || !stockForm.change_qty
                                        ? { ...styles.updateStockBtn, ...styles.saveBtnDisabled }
                                        : styles.updateStockBtn
                                }
                            >
                                {stockSaving ? 'Updating...' : 'Update Stock'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* RIGHT: Stock Change History --------------------------- */}
                <div style={styles.card}>
                    <h2 style={styles.cardHeading}>Stock Change History</h2>

                    {logs.length === 0 ? (
                        <div style={styles.historyEmpty}>No changes recorded yet.</div>
                    ) : (
                        <div style={styles.historyScroll}>
                            {logs.map((log, idx) => {
                                const positive = parseFloat(log.change_qty) > 0;
                                return (
                                    <div
                                        key={log.log_id}
                                        style={styles.logRow(idx === logs.length - 1)}
                                    >
                                        <div style={styles.logMain}>
                                            <span style={styles.logReason}>
                                                {log.reason || '(no reason given)'}
                                            </span>
                                            <span style={styles.logChange(positive)}>
                                                {formatChange(log.change_qty)}
                                            </span>
                                        </div>
                                        <div style={styles.logMeta}>
                                            {log.user_email || 'system'}
                                            {' · '}
                                            {formatTimestamp(log.timestamp)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

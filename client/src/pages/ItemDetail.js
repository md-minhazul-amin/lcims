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
    red:     '#d64545',
    green:   '#2c9f64',
    ink:     '#1e3a5f',
    sub:     '#5d6a78',
    grey:    '#7b8794',
    line:    '#eef0f2',
    border:  '#cbd2d9',
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
        marginBottom: '1.25rem',
    },
    backLink: (hovered) => ({
        color: '#1e3a5f',
        textDecoration: 'none',
        background: hovered ? '#e2e8f0' : '#f0f4f8',
        border: '1px solid #cbd2d9',
        borderRadius: 8,
        padding: '0.45rem 0.9rem',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: 500,
        transition: 'background 0.15s',
        flexShrink: 0,
    }),
    title: {
        margin: 0,
        fontSize: '1.6rem',
        fontWeight: 700,
        color: '#1e3a5f',
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    badgeOk: {
        background: C.okBg,
        color: C.okFg,
        padding: '0.28rem 0.85rem',
        borderRadius: 999,
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        display: 'inline-block',
    },
    badgeLow: {
        background: 'linear-gradient(90deg, #d64545, #f08080)',
        color: '#ffffff',
        padding: '0.32rem 0.95rem',
        borderRadius: 999,
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        display: 'inline-block',
        boxShadow: '0 2px 10px rgba(214,69,69,0.28)',
    },
    twoCol: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)',
        gap: '1rem',
        alignItems: 'start',
    },
    panel: {
        background: '#ffffff',
        borderRadius: 14,
        boxShadow: '0 2px 8px rgba(15,30,60,0.08)',
        padding: '1.5rem',
        border: '1px solid #eef0f2',
    },
    sectionHeading: {
        margin: '0 0 1rem',
        fontSize: '1rem',
        fontWeight: 600,
        color: '#1e3a5f',
        borderBottom: '1px solid #eef0f2',
        paddingBottom: '0.6rem',
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
    input: (focused) => ({
        padding: '0.6rem 0.85rem',
        border: focused ? '1.5px solid #3d6acb' : '1.5px solid #e2e8f0',
        borderRadius: 8,
        fontSize: '0.92rem',
        fontFamily: 'inherit',
        background: '#fafbfc',
        width: '100%',
        boxSizing: 'border-box',
        boxShadow: focused ? '0 0 0 3px rgba(61,106,203,0.12)' : 'none',
        transition: 'all 0.18s',
        outline: 'none',
    }),
    inputDisabled: {
        background: '#f5f7fa',
        color: '#5d6a78',
        cursor: 'not-allowed',
    },
    fieldHint: {
        fontSize: '0.75rem',
        color: '#7b8794',
        marginTop: '0.15rem',
        lineHeight: 1.4,
    },
    actionsRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: '0.25rem',
    },
    saveBtn: (hovered) => ({
        background: 'linear-gradient(90deg, #2f55a5, #3d6acb)',
        color: '#ffffff',
        border: 'none',
        padding: '0.6rem 1.3rem',
        borderRadius: 8,
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '0.9rem',
        boxShadow: hovered
            ? '0 4px 14px rgba(61,106,203,0.38)'
            : '0 2px 8px rgba(61,106,203,0.25)',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'transform 0.18s, box-shadow 0.18s',
    }),
    saveBtnDisabled: {
        background: '#9aa5b1',
        boxShadow: 'none',
        transform: 'none',
        cursor: 'not-allowed',
    },
    deleteBtn: (hovered) => ({
        background: hovered ? '#fce8e6' : '#fff0f0',
        color: '#a8262b',
        border: '1px solid #f4b1ad',
        borderRadius: 8,
        padding: '0.55rem 1rem',
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '0.9rem',
        transition: 'background 0.15s',
    }),
    divider: {
        border: 'none',
        borderTop: '1px solid #eef0f2',
        margin: '1.25rem 0',
    },
    stockGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '0.85rem',
        marginBottom: '0.9rem',
    },
    formError: {
        background: C.lowBg,
        color: C.lowFg,
        border: '1px solid #f4b1ad',
        padding: '0.75rem 1rem',
        borderRadius: 10,
        marginBottom: '0.75rem',
        fontSize: '0.85rem',
        animation: 'fadeInDown 0.2s ease both',
    },
    formSuccess: {
        background: C.okBg,
        color: C.okFg,
        border: '1px solid #b6e3c8',
        padding: '0.75rem 1rem',
        borderRadius: 10,
        marginBottom: '0.75rem',
        fontSize: '0.85rem',
        animation: 'fadeInDown 0.2s ease both',
    },
    updateStockBtn: (hovered) => ({
        width: '100%',
        background: 'linear-gradient(90deg, #2f55a5, #3d6acb)',
        color: '#ffffff',
        border: 'none',
        padding: '0.65rem 1rem',
        borderRadius: 8,
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '0.9rem',
        boxShadow: hovered
            ? '0 4px 14px rgba(61,106,203,0.38)'
            : '0 2px 8px rgba(61,106,203,0.25)',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'transform 0.18s, box-shadow 0.18s',
    }),
    historyScroll: {
        maxHeight: 480,
        overflowY: 'auto',
        paddingRight: '0.25rem',
    },
    logRow: (isEven, hovered) => ({
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0.7rem 0.85rem',
        borderRadius: 8,
        marginBottom: '0.25rem',
        background: hovered ? '#f0f4ff' : isEven ? '#f9fafc' : '#ffffff',
        transition: 'background 0.12s',
    }),
    logMain: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
    },
    logReason: {
        color: '#1e3a5f',
        fontWeight: 600,
        fontSize: '0.88rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        flex: 1,
        minWidth: 0,
    },
    logChange: (positive) => ({
        color: positive ? '#2c9f64' : '#d64545',
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        fontSize: '0.9rem',
    }),
    logMeta: {
        marginTop: '0.25rem',
        fontSize: '0.75rem',
        color: '#7b8794',
    },
    historyEmpty: {
        color: C.grey,
        padding: '1.5rem 0',
        textAlign: 'center',
        fontSize: '0.9rem',
    },
    loading: { padding: '2rem', color: C.sub },
    error: {
        background: C.lowBg,
        color: C.lowFg,
        border: '1px solid #f4b1ad',
        padding: '0.75rem 1rem',
        borderRadius: 10,
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

function formatChangeWithArrow(value) {
    const n = parseFloat(value);
    const positive = Number.isFinite(n) && n > 0;
    const arrow = positive ? '▲ ' : '▼ ';
    return arrow + formatChange(value);
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

    const [stockForm, setStockForm] = useState({ change_qty: '', reason: '' });
    const [stockSaving, setStockSaving] = useState(false);
    const [stockError, setStockError] = useState('');
    const [stockOk, setStockOk] = useState('');

    const [backHover, setBackHover] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [saveBtnHovered, setSaveBtnHovered] = useState(false);
    const [deleteHovered, setDeleteHovered] = useState(false);
    const [updateStockHovered, setUpdateStockHovered] = useState(false);
    const [hoveredLogId, setHoveredLogId] = useState(null);

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

    const inputStyle = (fieldKey, enabled = true) => ({
        ...styles.input(focusedField === fieldKey),
        ...(enabled ? null : styles.inputDisabled),
    });

    // -- render ------------------------------------------------------------
    if (loading) {
        return <div style={styles.loading}>Loading item...</div>;
    }
    if (error) {
        return (
            <div>
                <div style={styles.topBar}>
                    <Link
                        to="/inventory"
                        style={styles.backLink(backHover)}
                        onMouseEnter={() => setBackHover(true)}
                        onMouseLeave={() => setBackHover(false)}
                    >
                        ← Back to inventory
                    </Link>
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
                <Link
                    to="/inventory"
                    style={styles.backLink(backHover)}
                    onMouseEnter={() => setBackHover(true)}
                    onMouseLeave={() => setBackHover(false)}
                >
                    ← Back
                </Link>
                <h1 style={styles.title}>{item.name}</h1>
                <span style={isLow ? styles.badgeLow : styles.badgeOk}>
                    {isLow ? 'LOW STOCK' : '✓ OK'}
                </span>
            </div>

            <div style={styles.twoCol}>
                {/* LEFT: Item Details ---------------------------------- */}
                <div style={styles.panel}>
                    <h2 style={styles.sectionHeading}>Item Details</h2>

                    {saveError && <div style={styles.formError}>{saveError}</div>}
                    {saveOk    && <div style={styles.formSuccess}>{saveOk}</div>}

                    <form onSubmit={handleSave}>
                        <div style={styles.formGrid}>
                            <label style={styles.field}>
                                <span>Name</span>
                                <input
                                    type="text"
                                    style={inputStyle('name', canManage)}
                                    value={form.name}
                                    onFocus={() => setFocusedField('name')}
                                    onBlur={() => setFocusedField(null)}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    disabled={!canManage}
                                    required
                                />
                            </label>

                            <label style={styles.field}>
                                <span>Category</span>
                                <input
                                    type="text"
                                    style={inputStyle('category', canManage)}
                                    value={form.category}
                                    onFocus={() => setFocusedField('category')}
                                    onBlur={() => setFocusedField(null)}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    disabled={!canManage}
                                    required
                                />
                            </label>

                            <label style={styles.field}>
                                <span>Unit</span>
                                <input
                                    type="text"
                                    style={inputStyle('unit', canManage)}
                                    value={form.unit}
                                    onFocus={() => setFocusedField('unit')}
                                    onBlur={() => setFocusedField(null)}
                                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                    disabled={!canManage}
                                    required
                                />
                            </label>

                            <label style={styles.field}>
                                <span>Supplier</span>
                                <select
                                    style={inputStyle('supplier', canManage)}
                                    value={form.supplier_id}
                                    onFocus={() => setFocusedField('supplier')}
                                    onBlur={() => setFocusedField(null)}
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
                                    style={inputStyle('quantity', canManage)}
                                    value={form.quantity}
                                    onFocus={() => setFocusedField('quantity')}
                                    onBlur={() => setFocusedField(null)}
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
                                    style={inputStyle('threshold', canManage)}
                                    value={form.threshold}
                                    onFocus={() => setFocusedField('threshold')}
                                    onBlur={() => setFocusedField(null)}
                                    onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                                    disabled={!canManage}
                                />
                            </label>
                        </div>

                        {canManage && (
                            <div style={styles.actionsRow}>
                                <button
                                    type="button"
                                    onMouseEnter={() => setDeleteHovered(true)}
                                    onMouseLeave={() => setDeleteHovered(false)}
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    style={styles.deleteBtn(deleteHovered)}
                                >
                                    {deleting ? 'Deleting...' : '🗑 Delete'}
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={
                                        saving
                                            ? { ...styles.saveBtn(false), ...styles.saveBtnDisabled }
                                            : styles.saveBtn(saveBtnHovered)
                                    }
                                    onMouseEnter={() => !saving && setSaveBtnHovered(true)}
                                    onMouseLeave={() => setSaveBtnHovered(false)}
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
                    {stockOk && (
                        <div style={styles.formSuccess}>✅ {stockOk}</div>
                    )}

                    <form onSubmit={handleStockUpdate}>
                        <div style={styles.stockGrid}>
                            <label style={styles.field}>
                                <span>Change (qty)</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    style={inputStyle('change_qty')}
                                    placeholder="e.g. -2 (used) or +10 (restocked)"
                                    value={stockForm.change_qty}
                                    onFocus={() => setFocusedField('change_qty')}
                                    onBlur={() => setFocusedField(null)}
                                    onChange={(e) =>
                                        setStockForm({
                                            ...stockForm,
                                            change_qty: e.target.value,
                                        })
                                    }
                                />
                                <span style={styles.fieldHint}>
                                    Positive = restock (+10), Negative = usage (-5)
                                </span>
                            </label>

                            <label style={styles.field}>
                                <span>Reason</span>
                                <input
                                    type="text"
                                    style={inputStyle('reason')}
                                    placeholder="e.g. Morning service usage"
                                    value={stockForm.reason}
                                    onFocus={() => setFocusedField('reason')}
                                    onBlur={() => setFocusedField(null)}
                                    onChange={(e) =>
                                        setStockForm({
                                            ...stockForm,
                                            reason: e.target.value,
                                        })
                                    }
                                />
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={stockSaving || !stockForm.change_qty}
                            style={
                                stockSaving || !stockForm.change_qty
                                    ? { ...styles.updateStockBtn(false), ...styles.saveBtnDisabled }
                                    : styles.updateStockBtn(updateStockHovered)
                            }
                            onMouseEnter={() =>
                                !stockSaving &&
                                stockForm.change_qty &&
                                setUpdateStockHovered(true)
                            }
                            onMouseLeave={() => setUpdateStockHovered(false)}
                        >
                            {stockSaving ? 'Updating...' : 'Update Stock'}
                        </button>
                    </form>
                </div>

                {/* RIGHT: Stock Change History --------------------------- */}
                <div style={styles.panel}>
                    <h2 style={styles.sectionHeading}>Stock Change History</h2>

                    {logs.length === 0 ? (
                        <div style={styles.historyEmpty}>No changes recorded yet.</div>
                    ) : (
                        <div style={styles.historyScroll}>
                            {logs.map((log, idx) => {
                                const positive = parseFloat(log.change_qty) > 0;
                                const isEven = idx % 2 === 1;
                                const isHover = hoveredLogId === log.log_id;

                                return (
                                    <div
                                        key={log.log_id}
                                        style={styles.logRow(isEven, isHover)}
                                        onMouseEnter={() => setHoveredLogId(log.log_id)}
                                        onMouseLeave={() => setHoveredLogId(null)}
                                    >
                                        <div style={styles.logMain}>
                                            <span style={styles.logReason}>
                                                {log.reason || '(no reason given)'}
                                            </span>
                                            <span style={styles.logChange(positive)}>
                                                {formatChangeWithArrow(log.change_qty)}
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

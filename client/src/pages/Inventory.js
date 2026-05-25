/**
 * @file Inventory.js
 * @description Inventory list page with CRUD operations and stock level indicators
 * @author The IT Crowd
 * @date May 2026
 * @project LCIMS - Local Cafe Inventory Management System
 * @course CPRO306 - Capstone Project, Kent Institute Australia
 */

// ============================================================================
// File:    pages/Inventory.js
// Purpose: Inventory list with search, low-stock badges, and add-item form.
//          Managers/Admins can POST new items; all roles can open item detail.
//          Loads GET /inventory and GET /suppliers in parallel.
// Author:  The IT Crowd
// Date:    May 2026
// Project: LCIMS - Local Cafe Inventory Management System
// ============================================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// --- styles (all inline per spec; no CSS file) -----------------------------

const C = {
    blue:    '#3d6acb',
    blueDk:  '#2f55a5',
    ink:     '#1e3a5f',
    sub:     '#5d6a78',
    grey:    '#7b8794',
    line:    '#eef0f2',
    border:  '#cbd2d9',
    bgPanel: '#ffffff',
    bgPage:  '#f0f4f8',
    bgRow:   '#ffffff',
    bgHover: '#f5f7fa',
    bgHead:  '#f5f7fa',
    okBg:    '#dff5e6',
    okFg:    '#1d703f',
    lowBg:   '#fce8e6',
    lowFg:   '#a8262b',
};

const styles = {
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
    },
    title: {
        margin: 0,
        fontSize: '1.6rem',
        color: C.ink,
    },
    addBtn: {
        background: C.blue,
        color: '#ffffff',
        border: 'none',
        padding: '0.55rem 1rem',
        borderRadius: 6,
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '0.9rem',
    },
    search: {
        display: 'block',
        width: '100%',
        padding: '0.65rem 0.95rem',
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        fontSize: '0.95rem',
        marginBottom: '1rem',
        boxSizing: 'border-box',
        background: '#ffffff',
    },
    formPanel: {
        background: C.bgPanel,
        padding: '1.25rem 1.5rem 1.1rem',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(15,30,60,0.06)',
        marginBottom: '1rem',
    },
    formHeading: {
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
    formActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '0.5rem',
    },
    saveBtn: {
        background: C.blue,
        color: '#ffffff',
        border: 'none',
        padding: '0.55rem 1.2rem',
        borderRadius: 6,
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '0.9rem',
    },
    saveBtnDisabled: {
        background: '#9aa5b1',
        cursor: 'not-allowed',
    },
    cancelBtn: {
        background: '#ffffff',
        color: '#3e4c59',
        border: `1px solid ${C.border}`,
        padding: '0.55rem 1.2rem',
        borderRadius: 6,
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
    row: (hovered, isLast) => ({
        background: hovered ? C.bgHover : C.bgRow,
        cursor: 'pointer',
        transition: 'background 0.1s',
        borderBottom: isLast ? 'none' : `1px solid ${C.line}`,
    }),
    td: (alignRight) => ({
        padding: '0.7rem 0.95rem',
        color: '#1f2933',
        fontSize: '0.9rem',
        textAlign: alignRight ? 'right' : 'left',
        fontVariantNumeric: 'tabular-nums',
    }),
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
    emptyState: {
        textAlign: 'center',
        padding: '2rem',
        color: C.grey,
        fontSize: '0.92rem',
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

const emptyForm = {
    name: '',
    category: '',
    unit: '',
    quantity: '',
    threshold: '',
    supplier_id: '',
};

function num(v) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
}

// --- page ------------------------------------------------------------------

export default function Inventory() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Role gate: only Manager and Admin see Add Item and can POST /inventory.
    const canManage = user?.role === 'Manager' || user?.role === 'Admin';

    const [items, setItems] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [hoveredId, setHoveredId] = useState(null);

    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    // --- initial load ------------------------------------------------------
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');

        Promise.all([
            api.get('/inventory'),
            api.get('/suppliers'),
        ])
            .then(([invRes, supRes]) => {
                if (cancelled) return;
                setItems(invRes.data || []);
                setSuppliers(supRes.data || []);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err.response?.data?.error || 'Failed to load inventory');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    async function refreshItems() {
        try {
            const res = await api.get('/inventory');
            setItems(res.data || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to refresh inventory');
        }
    }

    function openForm() {
        setShowAddForm(true);
        setSaveError('');
    }

    function cancelForm() {
        setShowAddForm(false);
        setForm(emptyForm);
        setSaveError('');
    }

    // handleSave: POST /inventory — Manager/Admin only (requireManager on server).
    async function handleSave(event) {
        event.preventDefault();
        setSaveError('');
        setSaving(true);
        try {
            await api.post('/inventory', {
                name:        form.name.trim(),
                category:    form.category.trim(),
                unit:        form.unit.trim(),
                quantity:    num(form.quantity),
                threshold:   num(form.threshold),
                supplier_id: form.supplier_id ? parseInt(form.supplier_id, 10) : null,
            });
            setForm(emptyForm);
            setShowAddForm(false);
            await refreshItems();
        } catch (err) {
            setSaveError(err.response?.data?.error || 'Failed to save item');
        } finally {
            setSaving(false);
        }
    }

    // Client-side filter by name or category (no extra API call).
    const q = searchQuery.trim().toLowerCase();
    const visibleItems = q
        ? items.filter(
              (it) =>
                  (it.name && it.name.toLowerCase().includes(q)) ||
                  (it.category && it.category.toLowerCase().includes(q))
          )
        : items;

    // --- render ------------------------------------------------------------
    if (loading) {
        return <div style={styles.loading}>Loading inventory...</div>;
    }
    if (error) {
        return <div style={styles.error}>{error}</div>;
    }

    return (
        <div>
            {/* Header --------------------------------------------------- */}
            <div style={styles.header}>
                <h1 style={styles.title}>📦 Inventory</h1>
                {canManage && (
                    <button
                        type="button"
                        style={styles.addBtn}
                        onClick={showAddForm ? cancelForm : openForm}
                    >
                        + Add Item
                    </button>
                )}
            </div>

            {/* Search --------------------------------------------------- */}
            <input
                type="search"
                placeholder="Search by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.search}
            />

            {/* Add form (collapsible) ----------------------------------- */}
            {showAddForm && (
                <form onSubmit={handleSave} style={styles.formPanel}>
                    <h2 style={styles.formHeading}>Add Item</h2>
                    {saveError && <div style={styles.formError}>{saveError}</div>}

                    <div style={styles.formGrid}>
                        <label style={styles.field}>
                            <span>Item Name</span>
                            <input
                                type="text"
                                style={styles.input}
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </label>

                        <label style={styles.field}>
                            <span>Category</span>
                            <input
                                type="text"
                                style={styles.input}
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                required
                            />
                        </label>

                        <label style={styles.field}>
                            <span>Unit</span>
                            <input
                                type="text"
                                style={styles.input}
                                placeholder="kg, L, unit, pack..."
                                value={form.unit}
                                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                required
                            />
                        </label>

                        <label style={styles.field}>
                            <span>Supplier</span>
                            <select
                                style={styles.input}
                                value={form.supplier_id}
                                onChange={(e) =>
                                    setForm({ ...form, supplier_id: e.target.value })
                                }
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
                            <span>Current Quantity</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                style={styles.input}
                                value={form.quantity}
                                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                            />
                        </label>

                        <label style={styles.field}>
                            <span>Reorder Threshold</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                style={styles.input}
                                value={form.threshold}
                                onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                            />
                        </label>
                    </div>

                    <div style={styles.formActions}>
                        <button type="button" style={styles.cancelBtn} onClick={cancelForm}>
                            Cancel
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
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            )}

            {/* Table ---------------------------------------------------- */}
            <div style={styles.tableWrap}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th(false)}>Item Name</th>
                            <th style={styles.th(false)}>Category</th>
                            <th style={styles.th(true)}>Qty</th>
                            <th style={styles.th(false)}>Unit</th>
                            <th style={styles.th(true)}>Threshold</th>
                            <th style={styles.th(false)}>Supplier</th>
                            <th style={styles.th(false)}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleItems.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={styles.emptyState}>
                                    {q
                                        ? `No items match "${searchQuery}".`
                                        : 'No items yet.'}
                                </td>
                            </tr>
                        ) : (
                            visibleItems.map((item, idx) => {
                                const qty = parseFloat(item.quantity);
                                const thr = parseFloat(item.threshold);
                                const isLow = Number.isFinite(qty) && Number.isFinite(thr) && qty < thr;
                                const isHover = hoveredId === item.item_id;
                                const isLast = idx === visibleItems.length - 1;

                                return (
                                    <tr
                                        key={item.item_id}
                                        onClick={() => navigate(`/inventory/${item.item_id}`)}
                                        onMouseEnter={() => setHoveredId(item.item_id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        style={styles.row(isHover, isLast)}
                                    >
                                        <td style={styles.td(false)}>{item.name}</td>
                                        <td style={styles.td(false)}>{item.category}</td>
                                        <td style={styles.td(true)}>{qty.toFixed(2)}</td>
                                        <td style={styles.td(false)}>{item.unit}</td>
                                        <td style={styles.td(true)}>{thr.toFixed(2)}</td>
                                        <td style={styles.td(false)}>
                                            {item.supplier_name || '—'}
                                        </td>
                                        <td style={styles.td(false)}>
                                            <span style={isLow ? styles.badgeLow : styles.badgeOk}>
                                                {isLow ? '⚠ Low Stock' : '✓ OK'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

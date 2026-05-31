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
    bgHover: '#f7f9ff',
    okBg:    '#dff5e6',
    okFg:    '#1d703f',
    lowBg:   '#fce8e6',
    lowFg:   '#a8262b',
};

const styles = {
    header: {
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        gap: '1rem',
    },
    titleBlock: {
        flex: 1,
        minWidth: 0,
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
    addBtn: (hovered) => ({
        background: 'linear-gradient(90deg, #2f55a5, #3d6acb)',
        color: '#ffffff',
        border: 'none',
        padding: '0.6rem 1.2rem',
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
    searchWrap: {
        position: 'relative',
        marginBottom: '1rem',
    },
    searchIcon: {
        position: 'absolute',
        left: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '0.9rem',
        color: '#7b8794',
        pointerEvents: 'none',
    },
    search: (focused) => ({
        display: 'block',
        width: '100%',
        padding: '0.65rem 0.95rem',
        paddingLeft: '2.2rem',
        border: focused ? '1.5px solid #3d6acb' : '1.5px solid #e2e8f0',
        borderRadius: 10,
        fontSize: '0.95rem',
        boxSizing: 'border-box',
        background: '#ffffff',
        boxShadow: focused ? '0 0 0 3px rgba(61,106,203,0.12)' : 'none',
        transition: 'all 0.18s',
        outline: 'none',
    }),
    formPanel: {
        background: '#ffffff',
        padding: '1.5rem',
        borderRadius: 14,
        boxShadow: '0 4px 20px rgba(15,30,60,0.10)',
        border: '1px solid #e2e8f0',
        marginBottom: '1rem',
        animation: 'fadeInDown 0.22s ease both',
    },
    formHeading: {
        margin: '0 0 1rem',
        fontSize: '1.1rem',
        fontWeight: 600,
        color: '#1e3a5f',
        borderBottom: '1px solid #eef0f2',
        paddingBottom: '0.75rem',
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
    formActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '0.5rem',
    },
    saveBtn: (hovered) => ({
        background: 'linear-gradient(90deg, #2f55a5, #3d6acb)',
        color: '#ffffff',
        border: 'none',
        padding: '0.6rem 1.2rem',
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
    cancelBtn: {
        background: '#f5f7fa',
        color: '#1e3a5f',
        border: '1px solid #cbd2d9',
        padding: '0.55rem 1.2rem',
        borderRadius: 8,
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
    row: (hovered, isLast) => ({
        background: hovered ? C.bgHover : C.bgRow,
        cursor: 'pointer',
        transition: 'background 0.12s',
    }),
    td: (alignRight, isLast) => ({
        padding: '0.85rem 1rem',
        color: '#1f2933',
        fontSize: '0.9rem',
        textAlign: alignRight ? 'right' : 'left',
        fontVariantNumeric: 'tabular-nums',
        borderBottom: isLast ? 'none' : '1px solid #f0f2f5',
    }),
    categoryPill: {
        background: '#eaf1ff',
        color: '#2745a4',
        padding: '0.18rem 0.65rem',
        borderRadius: 999,
        fontSize: '0.75rem',
        fontWeight: 600,
        display: 'inline-block',
    },
    badgeOk: {
        background: '#dff5e6',
        color: '#1d703f',
        padding: '0.2rem 0.75rem',
        borderRadius: 999,
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
        display: 'inline-block',
    },
    badgeLow: {
        background: '#fce8e6',
        color: '#a8262b',
        padding: '0.2rem 0.75rem',
        borderRadius: 999,
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
        display: 'inline-block',
    },
    emptyStateBox: {
        background: '#f7f9ff',
        border: '1.5px dashed #cbd2d9',
        borderRadius: 12,
        padding: '2.5rem',
        textAlign: 'center',
    },
    emptyEmoji: {
        fontSize: '2.5rem',
        marginBottom: '0.75rem',
        display: 'block',
    },
    emptyTitle: {
        margin: '0 0 0.35rem',
        fontSize: '1rem',
        fontWeight: 600,
        color: C.ink,
    },
    emptySub: {
        margin: 0,
        fontSize: '0.85rem',
        color: C.grey,
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
    const [addBtnHovered, setAddBtnHovered] = useState(false);
    const [saveBtnHovered, setSaveBtnHovered] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

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
                <div style={styles.titleBlock}>
                    <h1 style={styles.title}>📦 Inventory</h1>
                    <p style={styles.subtitle}>Manage your cafe stock levels and items</p>
                </div>
                {canManage && (
                    <button
                        type="button"
                        style={styles.addBtn(addBtnHovered)}
                        onClick={showAddForm ? cancelForm : openForm}
                        onMouseEnter={() => setAddBtnHovered(true)}
                        onMouseLeave={() => setAddBtnHovered(false)}
                    >
                        + Add Item
                    </button>
                )}
            </div>

            {/* Search --------------------------------------------------- */}
            <div style={styles.searchWrap}>
                <span style={styles.searchIcon} aria-hidden="true">
                    🔍
                </span>
                <input
                    type="search"
                    placeholder="Search by name or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    style={styles.search(searchFocused)}
                />
            </div>

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
                                style={styles.input(focusedField === 'name')}
                                value={form.name}
                                onFocus={() => setFocusedField('name')}
                                onBlur={() => setFocusedField(null)}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </label>

                        <label style={styles.field}>
                            <span>Category</span>
                            <input
                                type="text"
                                style={styles.input(focusedField === 'category')}
                                value={form.category}
                                onFocus={() => setFocusedField('category')}
                                onBlur={() => setFocusedField(null)}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                required
                            />
                        </label>

                        <label style={styles.field}>
                            <span>Unit</span>
                            <input
                                type="text"
                                style={styles.input(focusedField === 'unit')}
                                placeholder="kg, L, unit, pack..."
                                value={form.unit}
                                onFocus={() => setFocusedField('unit')}
                                onBlur={() => setFocusedField(null)}
                                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                required
                            />
                        </label>

                        <label style={styles.field}>
                            <span>Supplier</span>
                            <select
                                style={styles.input(focusedField === 'supplier')}
                                value={form.supplier_id}
                                onFocus={() => setFocusedField('supplier')}
                                onBlur={() => setFocusedField(null)}
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
                                style={styles.input(focusedField === 'quantity')}
                                value={form.quantity}
                                onFocus={() => setFocusedField('quantity')}
                                onBlur={() => setFocusedField(null)}
                                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                            />
                        </label>

                        <label style={styles.field}>
                            <span>Reorder Threshold</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                style={styles.input(focusedField === 'threshold')}
                                value={form.threshold}
                                onFocus={() => setFocusedField('threshold')}
                                onBlur={() => setFocusedField(null)}
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
                                    ? { ...styles.saveBtn(false), ...styles.saveBtnDisabled }
                                    : styles.saveBtn(saveBtnHovered)
                            }
                            onMouseEnter={() => !saving && setSaveBtnHovered(true)}
                            onMouseLeave={() => setSaveBtnHovered(false)}
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
                        <tr style={styles.theadRow}>
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
                                <td colSpan={7} style={{ padding: '1rem', border: 'none' }}>
                                    <div style={styles.emptyStateBox}>
                                        <span style={styles.emptyEmoji}>📦</span>
                                        <p style={styles.emptyTitle}>
                                            {q
                                                ? `No items match "${searchQuery}"`
                                                : 'No inventory items found'}
                                        </p>
                                        <p style={styles.emptySub}>
                                            {q
                                                ? 'Try adjusting your search or add a new item'
                                                : 'Try adjusting your search or add a new item'}
                                        </p>
                                    </div>
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
                                        <td style={styles.td(false, isLast)}>{item.name}</td>
                                        <td style={styles.td(false, isLast)}>
                                            <span style={styles.categoryPill}>
                                                {item.category}
                                            </span>
                                        </td>
                                        <td style={styles.td(true, isLast)}>{qty.toFixed(2)}</td>
                                        <td style={styles.td(false, isLast)}>{item.unit}</td>
                                        <td style={styles.td(true, isLast)}>{thr.toFixed(2)}</td>
                                        <td style={styles.td(false, isLast)}>
                                            {item.supplier_name || '—'}
                                        </td>
                                        <td style={styles.td(false, isLast)}>
                                            <span style={isLow ? styles.badgeLow : styles.badgeOk}>
                                                {isLow ? '• Low Stock' : '✓ OK'}
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

/**
 * @file Suppliers.js
 * @description Supplier directory page with CRUD operations and item count badges
 * @author The IT Crowd
 * @date May 2026
 * @project LCIMS - Local Cafe Inventory Management System
 * @course CPRO306 - Capstone Project, Kent Institute Australia
 */

// ============================================================================
// File:    pages/Suppliers.js
// Purpose: Supplier directory — card grid with item_count, add/edit form,
//          delete with confirmation. Manager/Admin for mutations; all roles read.
// Author:  The IT Crowd
// Date:    May 2026
// Project: LCIMS - Local Cafe Inventory Management System
// ============================================================================

import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// --- styles (all inline; no CSS file) --------------------------------------

const C = {
    blue:    '#3d6acb',
    red:     '#d64545',
    ink:     '#1e3a5f',
    sub:     '#5d6a78',
    grey:    '#7b8794',
    line:    '#eef0f2',
    border:  '#cbd2d9',
    bgCard:  '#ffffff',
    bgPill:  '#eaf1ff',
    fgPill:  '#2745a4',
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
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem',
    },
    card: (hovered) => ({
        background: '#ffffff',
        borderRadius: 16,
        boxShadow: hovered
            ? '0 8px 28px rgba(15,30,60,0.13)'
            : '0 2px 10px rgba(15,30,60,0.08)',
        border: '1px solid #eef0f2',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.18s, transform 0.18s',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
    }),
    cardAccentBar: (index) => ({
        height: 5,
        background: CARD_ACCENTS[index % CARD_ACCENTS.length],
        flexShrink: 0,
    }),
    cardBody: {
        padding: '1.1rem 1.25rem 1rem',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
    },
    cardNameRow: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '0.5rem',
        marginBottom: '0.35rem',
    },
    cardName: {
        margin: 0,
        fontSize: '1.05rem',
        fontWeight: 700,
        color: '#1e3a5f',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        flex: 1,
        minWidth: 0,
    },
    itemCountBadge: (hasItems) => ({
        background: hasItems ? '#eaf1ff' : '#f0f2f5',
        color: hasItems ? '#2745a4' : '#7b8794',
        padding: '0.22rem 0.8rem',
        borderRadius: 999,
        fontSize: '0.78rem',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        flexShrink: 0,
    }),
    contactRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem',
        fontSize: '0.85rem',
        color: '#5d6a78',
        marginBottom: '0.3rem',
        minWidth: 0,
    },
    contactIcon: {
        flexShrink: 0,
        fontSize: '0.9rem',
        width: '1.1rem',
        textAlign: 'center',
    },
    contactText: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: 180,
    },
    contactTextWrap: {
        flex: 1,
        minWidth: 0,
    },
    placeholder: { color: C.grey },
    cardFooter: {
        borderTop: '1px solid #f0f2f5',
        padding: '0.75rem 1.25rem 0.9rem',
        display: 'flex',
        gap: '0.5rem',
        justifyContent: 'flex-end',
    },
    editBtn: (hovered) => ({
        background: hovered ? '#d5e8f0' : '#eaf1ff',
        color: '#2745a4',
        border: 'none',
        padding: '0.45rem 0.9rem',
        borderRadius: 7,
        fontSize: '0.83rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 0.15s',
    }),
    deleteBtn: (hovered) => ({
        background: hovered ? '#fce8e6' : '#fff0f0',
        color: '#a8262b',
        border: 'none',
        padding: '0.45rem 0.9rem',
        borderRadius: 7,
        fontSize: '0.83rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 0.15s',
    }),
    btnDisabled: {
        opacity: 0.6,
        cursor: 'not-allowed',
    },
    emptyState: {
        textAlign: 'center',
        padding: '3rem',
        background: '#f7f9ff',
        border: '1.5px dashed #cbd2d9',
        borderRadius: 14,
        gridColumn: '1 / -1',
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
    pageError: {
        background: C.lowBg,
        color: C.lowFg,
        border: `1px solid #f4b1ad`,
        padding: '0.75rem 1rem',
        borderRadius: 6,
    },
    // --- supplier order request modal (Assessment 6) -------------------------
    placeOrderBtn: {
        background: C.blue,
        color: '#ffffff',
        border: 'none',
        borderRadius: 8,
        padding: '7px 16px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        marginTop: 8,
        alignSelf: 'flex-start',
        fontWeight: 600,
    },
    orderOverlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    orderModalBox: {
        position: 'relative',
        background: '#ffffff',
        borderRadius: 14,
        padding: 28,
        width: 460,
        maxWidth: '92vw',
        zIndex: 1001,
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
    },
    orderModalClose: {
        position: 'absolute',
        top: 16,
        right: 16,
        background: 'none',
        border: 'none',
        fontSize: '1.35rem',
        color: C.grey,
        cursor: 'pointer',
        lineHeight: 1,
    },
    orderModalTitle: {
        margin: 0,
        fontSize: '1.2rem',
        fontWeight: 700,
        color: C.ink,
        paddingRight: 32,
    },
    orderModalSubtitle: {
        margin: '4px 0 0',
        fontSize: '0.88rem',
        color: C.sub,
    },
    orderField: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        marginTop: '0.85rem',
        fontSize: '0.82rem',
        color: '#3e4c59',
    },
    orderSelect: {
        padding: '0.5rem 0.7rem',
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        fontSize: '0.95rem',
        fontFamily: 'inherit',
        background: '#fafbfc',
    },
    orderTextarea: {
        padding: '0.5rem 0.7rem',
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        fontSize: '0.95rem',
        fontFamily: 'inherit',
        background: '#fafbfc',
        resize: 'vertical',
        width: '100%',
        boxSizing: 'border-box',
    },
    orderBtnRow: {
        display: 'flex',
        gap: 12,
        marginTop: 18,
    },
    orderCancelBtn: {
        background: '#f0f2f5',
        color: C.ink,
        border: 'none',
        borderRadius: 8,
        padding: '10px 20px',
        cursor: 'pointer',
        fontSize: '0.9rem',
    },
    orderSubmitBtn: {
        background: C.blue,
        color: '#ffffff',
        border: 'none',
        borderRadius: 8,
        padding: '10px 24px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: 600,
    },
    orderSubmitDisabled: {
        background: '#9aa5b1',
        cursor: 'not-allowed',
    },
    orderSuccessBox: {
        background: C.okBg,
        color: C.okFg,
        borderRadius: 8,
        padding: '10px 14px',
        marginTop: 12,
        fontSize: '0.9rem',
    },
    orderErrorBox: {
        background: C.lowBg,
        color: C.lowFg,
        borderRadius: 8,
        padding: '10px 14px',
        marginTop: 12,
        fontSize: '0.9rem',
    },
};

// --- helpers ---------------------------------------------------------------

const emptyForm = { name: '', contact: '', phone: '', email: '' };

const emptyOrderForm = {
    item_id: '',
    item_name: '',
    quantity_requested: '',
    unit: '',
    note: '',
};

// Top accent bar gradients — cycle by card index for visual variety.
const CARD_ACCENTS = [
    'linear-gradient(90deg, #3d6acb, #5b9dff)',
    'linear-gradient(90deg, #2c9f64, #52d68a)',
    'linear-gradient(90deg, #e8830c, #f5a623)',
    'linear-gradient(90deg, #8b5cf6, #a78bfa)',
];

// --- page ------------------------------------------------------------------

export default function Suppliers() {
    const { user } = useAuth();
    const canManage = user?.role === 'Manager' || user?.role === 'Admin';

    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState('');

    const [showForm, setShowForm] = useState(false);
    // editingId: null = creating; number = PUT /suppliers/:id for that row.
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const [deletingId, setDeletingId] = useState(null);

    // Order request modal — null when closed, { supplier } when open for that card.
    const [orderModal, setOrderModal] = useState(null);
    const [supplierItems, setSupplierItems] = useState([]);
    const [orderForm, setOrderForm] = useState(emptyOrderForm);
    const [orderLoading, setOrderLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState('');
    const [orderError, setOrderError] = useState('');

    const isManager = user?.role === 'Manager';

    const [addBtnHovered, setAddBtnHovered] = useState(false);
    const [saveBtnHovered, setSaveBtnHovered] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [hoveredCardId, setHoveredCardId] = useState(null);
    const [hoveredEditId, setHoveredEditId] = useState(null);
    const [hoveredDeleteId, setHoveredDeleteId] = useState(null);

    // fetchSuppliers: GET /suppliers — includes item_count per card from server.
    async function fetchSuppliers() {
        const res = await api.get('/suppliers');
        setSuppliers(res.data || []);
    }

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setPageError('');

        fetchSuppliers()
            .catch((err) => {
                if (!cancelled) {
                    setPageError(
                        err.response?.data?.error || 'Failed to load suppliers'
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    // -- open form (new or edit) ------------------------------------------
    function openNew() {
        if (!canManage) return;
        setEditingId(null);
        setForm(emptyForm);
        setSaveError('');
        setShowForm(true);
    }

    function openEdit(supplier) {
        if (!canManage) return;
        setEditingId(supplier.supplier_id);
        setForm({
            name:    supplier.name    ?? '',
            contact: supplier.contact ?? '',
            phone:   supplier.phone   ?? '',
            email:   supplier.email   ?? '',
        });
        setSaveError('');
        setShowForm(true);
    }

    function cancelForm() {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        setSaveError('');
    }

    // handleSave: POST for new supplier, PUT when editingId is set.
    async function handleSave(event) {
        event.preventDefault();
        if (!canManage) return;
        setSaveError('');
        setSaving(true);

        const payload = {
            name:    form.name.trim(),
            contact: form.contact.trim() || null,
            phone:   form.phone.trim()   || null,
            email:   form.email.trim()   || null,
        };

        try {
            if (editingId === null) {
                await api.post('/suppliers', payload);
            } else {
                await api.put(`/suppliers/${editingId}`, payload);
            }
            cancelForm();
            await fetchSuppliers();
        } catch (err) {
            setSaveError(err.response?.data?.error || 'Failed to save supplier');
        } finally {
            setSaving(false);
        }
    }

    // openOrderModal: open popup for one supplier and load their inventory items.
    async function openOrderModal(supplier) {
        setOrderModal({ supplier });
        setOrderForm(emptyOrderForm);
        setOrderSuccess('');
        setOrderError('');
        setSupplierItems([]);

        try {
            const res = await api.get('/inventory');
            const allItems = Array.isArray(res.data) ? res.data : [];
            // Keep only products linked to this supplier_id.
            const linked = allItems.filter(
                (item) => item.supplier_id === supplier.supplier_id
            );
            setSupplierItems(linked);

            // Pre-fill the form with the first linked item when available.
            if (linked.length > 0) {
                const first = linked[0];
                setOrderForm({
                    item_id: first.item_id,
                    item_name: first.name,
                    quantity_requested: '',
                    unit: first.unit ?? '',
                    note: '',
                });
            }
        } catch {
            setOrderError('Failed to load items for this supplier.');
            setSupplierItems([]);
        }
    }

    // handleOrderItemChange: sync item_id, item_name, and unit when dropdown changes.
    function handleOrderItemChange(event) {
        const selectedId = Number.parseInt(event.target.value, 10);
        const item = supplierItems.find((row) => row.item_id === selectedId);
        if (!item) return;

        setOrderForm((prev) => ({
            ...prev,
            item_id: item.item_id,
            item_name: item.name,
            unit: item.unit ?? '',
        }));
    }

    // handleOrderSubmit: POST /api/orders — Manager places a reorder request.
    async function handleOrderSubmit() {
        if (!orderModal?.supplier) return;

        setOrderError('');
        setOrderSuccess('');

        const qty = Number.parseFloat(orderForm.quantity_requested);
        if (!Number.isFinite(qty) || qty <= 0) {
            setOrderError('Quantity must be greater than zero.');
            return;
        }
        if (!orderForm.item_id) {
            setOrderError('Please select an item to order.');
            return;
        }

        setOrderLoading(true);
        try {
            await api.post('/orders', {
                supplier_id: orderModal.supplier.supplier_id,
                item_id: orderForm.item_id,
                item_name: orderForm.item_name,
                quantity_requested: qty,
                unit: orderForm.unit,
                note: orderForm.note,
            });

            setOrderSuccess('✅ Order request sent successfully!');
            setOrderForm((prev) => ({
                ...prev,
                quantity_requested: '',
                note: '',
            }));
        } catch {
            setOrderError('Failed to place order. Please try again.');
        } finally {
            setOrderLoading(false);
        }
    }

    // handleDelete: DELETE /suppliers/:id — server sets inventory supplier_id to NULL.
    async function handleDelete(supplier) {
        if (!canManage) return;
        const confirmed = window.confirm(
            `Delete supplier "${supplier.name}"?\n\n` +
            `Items currently linked to this supplier will keep existing — ` +
            `their supplier reference will be cleared.`
        );
        if (!confirmed) return;

        setDeletingId(supplier.supplier_id);
        try {
            await api.delete(`/suppliers/${supplier.supplier_id}`);
            if (editingId === supplier.supplier_id) {
                cancelForm();
            }
            await fetchSuppliers();
        } catch (err) {
            setPageError(err.response?.data?.error || 'Failed to delete supplier');
        } finally {
            setDeletingId(null);
        }
    }

    // -- render -----------------------------------------------------------
    if (loading) {
        return <div style={styles.loading}>Loading suppliers...</div>;
    }

    const editingName =
        editingId !== null
            ? suppliers.find((s) => s.supplier_id === editingId)?.name
            : null;

    return (
        <div>
            {/* Header --------------------------------------------------- */}
            <div style={styles.header}>
                <div style={styles.titleBlock}>
                    <h1 style={styles.title}>🏪 Suppliers</h1>
                    <p style={styles.subtitle}>Manage your cafe&apos;s supplier relationships</p>
                </div>
                {canManage && !showForm && (
                    <button
                        type="button"
                        style={styles.addBtn(addBtnHovered)}
                        onClick={openNew}
                        onMouseEnter={() => setAddBtnHovered(true)}
                        onMouseLeave={() => setAddBtnHovered(false)}
                    >
                        + Add Supplier
                    </button>
                )}
            </div>

            {pageError && <div style={styles.pageError}>{pageError}</div>}

            {/* Form panel (collapsible) -------------------------------- */}
            {showForm && (
                <form onSubmit={handleSave} style={styles.formPanel}>
                    <h2 style={styles.formHeading}>
                        {editingId === null
                            ? 'Add Supplier'
                            : `Edit Supplier${editingName ? ` — ${editingName}` : ''}`}
                    </h2>

                    {saveError && <div style={styles.formError}>{saveError}</div>}

                    <div style={styles.formGrid}>
                        <label style={styles.field}>
                            <span>Company Name *</span>
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
                            <span>Contact Person</span>
                            <input
                                type="text"
                                style={styles.input(focusedField === 'contact')}
                                value={form.contact}
                                onFocus={() => setFocusedField('contact')}
                                onBlur={() => setFocusedField(null)}
                                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                            />
                        </label>

                        <label style={styles.field}>
                            <span>Phone</span>
                            <input
                                type="tel"
                                style={styles.input(focusedField === 'phone')}
                                placeholder="+61 3 9123 4567"
                                value={form.phone}
                                onFocus={() => setFocusedField('phone')}
                                onBlur={() => setFocusedField(null)}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            />
                        </label>

                        <label style={styles.field}>
                            <span>Email</span>
                            <input
                                type="email"
                                style={styles.input(focusedField === 'email')}
                                placeholder="orders@supplier.com"
                                value={form.email}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
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

            {/* Card grid ----------------------------------------------- */}
            <div style={styles.grid}>
                {suppliers.length === 0 ? (
                    <div style={styles.emptyState}>
                        <span style={styles.emptyEmoji}>🏪</span>
                        <p style={styles.emptyTitle}>No suppliers yet</p>
                        <p style={styles.emptySub}>Add your first supplier to get started</p>
                    </div>
                ) : (
                    suppliers.map((s, index) => {
                        const isDeleting = deletingId === s.supplier_id;
                        const itemCount = s.item_count ?? 0;
                        const isCardHovered = hoveredCardId === s.supplier_id;

                        return (
                            <div
                                key={s.supplier_id}
                                style={styles.card(isCardHovered)}
                                onMouseEnter={() => setHoveredCardId(s.supplier_id)}
                                onMouseLeave={() => setHoveredCardId(null)}
                            >
                                <div style={styles.cardAccentBar(index)} />

                                <div style={styles.cardBody}>
                                    <div style={styles.cardNameRow}>
                                        <h3 style={styles.cardName} title={s.name}>
                                            {s.name}
                                        </h3>
                                        <span style={styles.itemCountBadge(itemCount > 0)}>
                                            {itemCount} item{itemCount === 1 ? '' : 's'}
                                        </span>
                                    </div>

                                    <div style={styles.contactRow}>
                                        <span style={styles.contactIcon}>🏢</span>
                                        <span
                                            style={{
                                                ...styles.contactTextWrap,
                                                ...(s.contact ? null : styles.placeholder),
                                            }}
                                        >
                                            <span style={styles.contactText}>
                                                {s.contact || '—'}
                                            </span>
                                        </span>
                                    </div>

                                    <div style={styles.contactRow}>
                                        <span style={styles.contactIcon}>📞</span>
                                        <span style={s.phone ? null : styles.placeholder}>
                                            {s.phone || '—'}
                                        </span>
                                    </div>

                                    <div style={styles.contactRow}>
                                        <span style={styles.contactIcon}>📧</span>
                                        <span style={styles.contactTextWrap}>
                                            <span
                                                style={{
                                                    ...styles.contactText,
                                                    ...(s.email ? null : styles.placeholder),
                                                }}
                                                title={s.email || undefined}
                                            >
                                                {s.email || '—'}
                                            </span>
                                        </span>
                                    </div>

                                    {/* Place Order — Managers only (Assessment 6) */}
                                    {isManager && (
                                        <button
                                            type="button"
                                            style={styles.placeOrderBtn}
                                            onClick={() => openOrderModal(s)}
                                        >
                                            📦 Place Order
                                        </button>
                                    )}
                                </div>

                                {canManage && (
                                    <div style={styles.cardFooter}>
                                        <button
                                            type="button"
                                            style={styles.editBtn(
                                                hoveredEditId === s.supplier_id
                                            )}
                                            onClick={() => openEdit(s)}
                                            onMouseEnter={() => setHoveredEditId(s.supplier_id)}
                                            onMouseLeave={() => setHoveredEditId(null)}
                                            disabled={isDeleting}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            style={{
                                                ...(isDeleting
                                                    ? {
                                                          ...styles.deleteBtn(false),
                                                          ...styles.btnDisabled,
                                                      }
                                                    : styles.deleteBtn(
                                                          hoveredDeleteId === s.supplier_id
                                                      )),
                                            }}
                                            onClick={() => handleDelete(s)}
                                            onMouseEnter={() =>
                                                setHoveredDeleteId(s.supplier_id)
                                            }
                                            onMouseLeave={() => setHoveredDeleteId(null)}
                                            disabled={isDeleting}
                                        >
                                            {isDeleting ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Order request modal (overlay + form) — outside supplier grid */}
            {orderModal && (
                <div
                    style={styles.orderOverlay}
                    onClick={() => setOrderModal(null)}
                    role="presentation"
                >
                    <div
                        style={styles.orderModalBox}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-labelledby="order-modal-title"
                    >
                        <button
                            type="button"
                            style={styles.orderModalClose}
                            aria-label="Close order modal"
                            onClick={() => setOrderModal(null)}
                        >
                            ×
                        </button>

                        <h2 id="order-modal-title" style={styles.orderModalTitle}>
                            📦 Order from {orderModal.supplier.name}
                        </h2>
                        <p style={styles.orderModalSubtitle}>
                            Place a reorder request for one of this supplier&apos;s products
                        </p>

                        {/* Item dropdown — options from GET /inventory filtered by supplier */}
                        <label style={styles.orderField}>
                            <span>Select Item</span>
                            <select
                                style={styles.orderSelect}
                                value={orderForm.item_id || ''}
                                disabled={supplierItems.length === 0}
                                onChange={handleOrderItemChange}
                            >
                                {supplierItems.length === 0 ? (
                                    <option value="">
                                        No items linked to this supplier
                                    </option>
                                ) : (
                                    supplierItems.map((item) => (
                                        <option key={item.item_id} value={item.item_id}>
                                            {item.name}
                                        </option>
                                    ))
                                )}
                            </select>
                        </label>

                        <label style={styles.orderField}>
                            <span>Quantity to Order</span>
                            <input
                                type="number"
                                min={0.01}
                                step={0.01}
                                placeholder="e.g. 10"
                                style={styles.input}
                                value={orderForm.quantity_requested}
                                onChange={(e) =>
                                    setOrderForm({
                                        ...orderForm,
                                        quantity_requested: e.target.value,
                                    })
                                }
                            />
                        </label>

                        <label style={styles.orderField}>
                            <span>Unit</span>
                            <input
                                type="text"
                                style={styles.input}
                                value={orderForm.unit}
                                onChange={(e) =>
                                    setOrderForm({ ...orderForm, unit: e.target.value })
                                }
                            />
                        </label>

                        <label style={styles.orderField}>
                            <span>Note (optional)</span>
                            <textarea
                                rows={2}
                                placeholder="e.g. Urgent — running low"
                                style={styles.orderTextarea}
                                value={orderForm.note}
                                onChange={(e) =>
                                    setOrderForm({ ...orderForm, note: e.target.value })
                                }
                            />
                        </label>

                        <div style={styles.orderBtnRow}>
                            <button
                                type="button"
                                style={styles.orderCancelBtn}
                                onClick={() => setOrderModal(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                style={
                                    orderLoading
                                        ? {
                                              ...styles.orderSubmitBtn,
                                              ...styles.orderSubmitDisabled,
                                          }
                                        : styles.orderSubmitBtn
                                }
                                disabled={orderLoading || supplierItems.length === 0}
                                onClick={handleOrderSubmit}
                            >
                                {orderLoading ? 'Sending...' : 'Send Order Request'}
                            </button>
                        </div>

                        {orderSuccess && (
                            <div style={styles.orderSuccessBox}>{orderSuccess}</div>
                        )}
                        {orderError && (
                            <div style={styles.orderErrorBox}>{orderError}</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

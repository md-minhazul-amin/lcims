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
    formPanel: {
        background: '#ffffff',
        padding: '1.25rem 1.4rem',
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
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '1rem',
    },
    card: {
        background: C.bgCard,
        borderRadius: 8,
        padding: '1.15rem 1.25rem 1rem',
        boxShadow: '0 1px 3px rgba(15,30,60,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        minHeight: 200,
    },
    cardName: {
        margin: 0,
        fontSize: '1.1rem',
        fontWeight: 700,
        color: C.ink,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    itemPill: {
        alignSelf: 'flex-start',
        background: C.bgPill,
        color: C.fgPill,
        padding: '0.22rem 0.65rem',
        borderRadius: 999,
        fontSize: '0.78rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
    },
    contactRow: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.55rem',
        fontSize: '0.88rem',
        color: '#3e4c59',
        wordBreak: 'break-word',
    },
    contactIcon: { flexShrink: 0, fontSize: '0.95rem' },
    placeholder: { color: C.grey },
    cardActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '0.4rem',
        paddingTop: '0.75rem',
        marginTop: 'auto',
        borderTop: `1px solid ${C.line}`,
    },
    editBtn: {
        background: '#ffffff',
        color: C.blue,
        border: `1px solid ${C.blue}`,
        padding: '0.4rem 0.85rem',
        borderRadius: 6,
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '0.82rem',
    },
    deleteBtn: {
        background: '#ffffff',
        color: C.red,
        border: `1px solid ${C.red}`,
        padding: '0.4rem 0.85rem',
        borderRadius: 6,
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '0.82rem',
    },
    btnDisabled: {
        opacity: 0.6,
        cursor: 'not-allowed',
    },
    emptyState: {
        textAlign: 'center',
        padding: '2.5rem 1rem',
        background: '#ffffff',
        borderRadius: 8,
        color: C.grey,
        boxShadow: '0 1px 3px rgba(15,30,60,0.06)',
        gridColumn: '1 / -1',
    },
    loading: { padding: '2rem', color: C.sub },
    pageError: {
        background: C.lowBg,
        color: C.lowFg,
        border: `1px solid #f4b1ad`,
        padding: '0.75rem 1rem',
        borderRadius: 6,
    },
};

// --- helpers ---------------------------------------------------------------

const emptyForm = { name: '', contact: '', phone: '', email: '' };

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
                <h1 style={styles.title}>🏪 Suppliers</h1>
                {canManage && !showForm && (
                    <button type="button" style={styles.addBtn} onClick={openNew}>
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
                                style={styles.input}
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </label>

                        <label style={styles.field}>
                            <span>Contact Person</span>
                            <input
                                type="text"
                                style={styles.input}
                                value={form.contact}
                                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                            />
                        </label>

                        <label style={styles.field}>
                            <span>Phone</span>
                            <input
                                type="tel"
                                style={styles.input}
                                placeholder="+61 3 9123 4567"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            />
                        </label>

                        <label style={styles.field}>
                            <span>Email</span>
                            <input
                                type="email"
                                style={styles.input}
                                placeholder="orders@supplier.com"
                                value={form.email}
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
                                    ? { ...styles.saveBtn, ...styles.saveBtnDisabled }
                                    : styles.saveBtn
                            }
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
                        No suppliers yet.
                        {canManage && ' Click "+ Add Supplier" to add the first one.'}
                    </div>
                ) : (
                    suppliers.map((s) => {
                        const isDeleting = deletingId === s.supplier_id;
                        return (
                            <div key={s.supplier_id} style={styles.card}>
                                <h3 style={styles.cardName} title={s.name}>{s.name}</h3>

                                <span style={styles.itemPill}>
                                    📦 {s.item_count ?? 0} item{s.item_count === 1 ? '' : 's'}
                                </span>

                                <div style={styles.contactRow}>
                                    <span style={styles.contactIcon}>👤</span>
                                    <span style={s.contact ? null : styles.placeholder}>
                                        {s.contact || '—'}
                                    </span>
                                </div>

                                <div style={styles.contactRow}>
                                    <span style={styles.contactIcon}>📞</span>
                                    <span style={s.phone ? null : styles.placeholder}>
                                        {s.phone || '—'}
                                    </span>
                                </div>

                                <div style={styles.contactRow}>
                                    <span style={styles.contactIcon}>✉️</span>
                                    <span style={s.email ? null : styles.placeholder}>
                                        {s.email || '—'}
                                    </span>
                                </div>

                                {canManage && (
                                    <div style={styles.cardActions}>
                                        <button
                                            type="button"
                                            style={styles.editBtn}
                                            onClick={() => openEdit(s)}
                                            disabled={isDeleting}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            style={
                                                isDeleting
                                                    ? { ...styles.deleteBtn, ...styles.btnDisabled }
                                                    : styles.deleteBtn
                                            }
                                            onClick={() => handleDelete(s)}
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
        </div>
    );
}

// ============================================================================
// File:    App.js
// Purpose: Root React component with routing and auth protection. Wraps the
//          app in AuthProvider and BrowserRouter; public /login vs protected
//          shell routes behind ProtectedRoute.
// Author:  The IT Crowd
// Date:    May 2026
// Project: LCIMS - Local Cafe Inventory Management System
// ============================================================================

import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import ItemDetail from './pages/ItemDetail';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import AIInsights from './pages/AIInsights';
import Alerts from './pages/Alerts';

import './App.css';

// ProtectedRoute: layout route guard. If there is no token in AuthContext,
// redirect to /login with replace (user cannot access dashboard, inventory, etc.).
// If authenticated, render <Outlet /> so nested routes (Layout + pages) mount.
function ProtectedRoute() {
    const { token } = useAuth();
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return <Outlet />;
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* /login — public sign-in page (no sidebar). */}
                    <Route path="/login" element={<Login />} />

                    <Route element={<ProtectedRoute />}>
                        {/* Layout shell: sidebar + <Outlet /> for child pages. */}
                        <Route path="/" element={<Layout />}>
                            {/* index / — Dashboard KPIs and activity. */}
                            <Route index element={<Dashboard />} />
                            {/* /inventory — inventory list and management. */}
                            <Route path="inventory" element={<Inventory />} />
                            {/* /inventory/:id — single item detail, stock adjust, logs. */}
                            <Route path="inventory/:id" element={<ItemDetail />} />
                            {/* /suppliers — supplier directory CRUD. */}
                            <Route path="suppliers" element={<Suppliers />} />
                            {/* /reports — usage report chart and date range. */}
                            <Route path="reports" element={<Reports />} />
                            {/* /ai-insights — OpenAI / demo reorder suggestions. */}
                            <Route path="ai-insights" element={<AIInsights />} />
                            {/* /alerts — active low-stock alerts and resolve. */}
                            <Route path="alerts" element={<Alerts />} />
                        </Route>
                    </Route>

                    {/* Unknown paths — send authenticated flow to home (ProtectedRoute still applies). */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

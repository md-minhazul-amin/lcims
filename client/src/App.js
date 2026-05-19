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

import './App.css';

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
                    <Route path="/login" element={<Login />} />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<Layout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="inventory" element={<Inventory />} />
                            <Route path="inventory/:id" element={<ItemDetail />} />
                            <Route path="suppliers" element={<Suppliers />} />
                            <Route path="reports" element={<Reports />} />
                            <Route path="ai-insights" element={<AIInsights />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

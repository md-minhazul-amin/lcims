// ============================================================================
// File:    components/Layout.js
// Purpose: Main shell layout with sidebar navigation and logout. Wraps every
//          authenticated page: sidebar links use React Router NavLink; child
//          routes render in <Outlet /> on the right.
// Author:  The IT Crowd
// Date:    May 2026
// Project: LCIMS - Local Cafe Inventory Management System
// ============================================================================

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// navItems: sidebar links (path, label, icon). `end: true` on Dashboard so "/"
// is active only on the index route, not on every nested path.
const navItems = [
    { to: '/',            label: 'Dashboard',   icon: '📊', end: true },
    { to: '/inventory',   label: 'Inventory',   icon: '📦' },
    { to: '/suppliers',   label: 'Suppliers',   icon: '🏪' },
    { to: '/reports',     label: 'Reports',     icon: '📈' },
    { to: '/alerts',      label: 'Alerts',      icon: '🔔' },
    { to: '/ai-insights', label: 'AI Insights', icon: '🤖' },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // handleLogout: clear auth state via context, then navigate to /login with
    // replace so the user cannot "Back" into protected pages while logged out.
    function handleLogout() {
        logout();
        navigate('/login', { replace: true });
    }

    return (
        <div className="lcims-shell">
            <aside className="lcims-sidebar">
                <div className="lcims-brand-area">
                    <div className="lcims-brand">☕ LCIMS</div>
                    {user && (
                        <div className="lcims-user-info">
                            <div className="lcims-user-email" title={user.email}>
                                {user.email}
                            </div>
                            <span className="lcims-role-badge">{user.role}</span>
                        </div>
                    )}
                </div>

                <nav className="lcims-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                'lcims-nav-link' + (isActive ? ' active' : '')
                            }
                        >
                            <span className="lcims-nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <button
                    type="button"
                    className="lcims-logout"
                    onClick={handleLogout}
                >
                    ⎋ Log out
                </button>
            </aside>

            <main className="lcims-main">
                <Outlet />
            </main>
        </div>
    );
}

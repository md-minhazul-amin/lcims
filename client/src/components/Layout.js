import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { to: '/',            label: 'Dashboard',   icon: '📊', end: true },
    { to: '/inventory',   label: 'Inventory',   icon: '📦' },
    { to: '/suppliers',   label: 'Suppliers',   icon: '🏪' },
    { to: '/reports',     label: 'Reports',     icon: '📈' },
    { to: '/ai-insights', label: 'AI Insights', icon: '🤖' },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

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

/**
 * @file Login.js
 * @description Login form page with JWT authentication
 * @author The IT Crowd
 * @date May 2026
 * @project LCIMS - Local Cafe Inventory Management System
 * @course CPRO306 - Capstone Project, Kent Institute Australia
 */

// ============================================================================
// File:    pages/Login.js
// Purpose: Public sign-in page. Posts credentials to POST /api/auth/login,
//          stores the returned JWT via AuthContext.login, and redirects to
//          the dashboard. Already-authenticated users are sent to /.
// Author:  The IT Crowd
// Date:    May 2026
// Project: LCIMS - Local Cafe Inventory Management System
// ============================================================================

import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { token, login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // If a token already exists (e.g. refreshed session), skip the form.
    if (token) {
        return <Navigate to="/" replace />;
    }

    // handleSubmit: call login API, persist token, navigate home.
    async function handleSubmit(event) {
        event.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', {
                email: email.trim(),
                password,
            });
            if (!data?.token) {
                setError('Invalid email or password. Please try again.');
                return;
            }
            login(data.token);
            navigate('/', { replace: true });
        } catch (err) {
            // Show a single user-facing message for failed sign-in (no dev/API details).
            if (!err.response || err.response.status === 401) {
                setError('Invalid email or password. Please try again.');
            } else {
                setError('Unable to sign in right now. Please try again in a moment.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="lcims-login">
            <div className="lcims-login-shape lcims-login-shape-1" aria-hidden="true" />
            <div className="lcims-login-shape lcims-login-shape-2" aria-hidden="true" />
            <div className="lcims-login-shape lcims-login-shape-3" aria-hidden="true" />

            <form className="lcims-login-card" onSubmit={handleSubmit}>
                <div className="lcims-login-icon-ring">
                    <div className="lcims-login-icon">☕</div>
                </div>
                <h1 className="lcims-login-title">LCIMS</h1>
                <p className="lcims-login-sub">Local Café Inventory Management System</p>

                {error && <div className="lcims-error">{error}</div>}

                <label className="lcims-login-field">
                    <span>Email</span>
                    <input
                        type="email"
                        value={email}
                        autoComplete="username"
                        placeholder="you@cafe.com"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </label>

                <label className="lcims-login-field">
                    <span>Password</span>
                    <input
                        type="password"
                        value={password}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </label>

                <button type="submit" className="lcims-login-submit" disabled={loading}>
                    {loading ? (
                        <>
                            <span className="lcims-login-spinner" aria-hidden="true">
                                ⟳
                            </span>
                            Signing in...
                        </>
                    ) : (
                        'Sign in'
                    )}
                </button>

                <p className="lcims-login-footer">
                    New café manager? Contact your system administrator.
                </p>
            </form>
        </div>
    );
}

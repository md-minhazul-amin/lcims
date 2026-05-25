// ============================================================================
// File:    context/AuthContext.js
// Purpose: JWT auth state management using React Context. Stores the access
//          token and decoded user payload, restores session from localStorage on
//          refresh, and exposes login/logout for the rest of the app.
// Author:  The IT Crowd
// Date:    May 2026
// Project: LCIMS - Local Cafe Inventory Management System
// ============================================================================

import { createContext, useContext, useEffect, useState } from 'react';

// TOKEN_KEY: localStorage key where the JWT string is persisted between page
// reloads. Must match the key read in api/axios.js so the interceptor finds it.
const TOKEN_KEY = 'lcims_token';
const AuthContext = createContext(null);

// decodeJwtPayload: reads the middle segment of a JWT and parses it as JSON
// for display only (email, role, cafe_id in the sidebar). It does NOT verify
// the signature — anyone could forge a payload. The Express server re-verifies
// the full token on every API request via middleware/auth.js.
function decodeJwtPayload(token) {
    if (typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;

    try {
        // Step 1 — base64url to standard base64: JWT uses - and _ instead of + and /.
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        // Step 2 — add padding (=) so atob() accepts the string (length % 4).
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        // Step 3 — atob() decodes base64 to a binary string.
        const binary = atob(padded);

        // Step 4 — convert binary to UTF-8 JSON text, then parse (handles non-ASCII).
        const utf8 = decodeURIComponent(
            Array.from(binary)
                .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
                .join('')
        );
        return JSON.parse(utf8);
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);

    // useEffect (mount): restore auth state after a full page refresh. Read the
    // saved token from localStorage, decode it, and reject if malformed or past
    // exp (payload.exp is Unix seconds; compare to Date.now() in milliseconds).
    useEffect(() => {
        const stored = localStorage.getItem(TOKEN_KEY);
        if (!stored) return;

        const payload = decodeJwtPayload(stored);
        if (!payload) {
            localStorage.removeItem(TOKEN_KEY);
            return;
        }
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            localStorage.removeItem(TOKEN_KEY);
            return;
        }
        setToken(stored);
        setUser(payload);
    }, []);

    // login: called after POST /api/auth/login succeeds. Persist token, update
    // React state so ProtectedRoute and Layout see an authenticated session.
    function login(newToken) {
        const payload = decodeJwtPayload(newToken);
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
        setUser(payload);
    }

    // logout: clear localStorage and React state so the user is treated as
    // signed out (ProtectedRoute will redirect to /login on next navigation).
    function logout() {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used inside an <AuthProvider>');
    }
    return ctx;
}

import { createContext, useContext, useEffect, useState } from 'react';

const TOKEN_KEY = 'lcims_token';
const AuthContext = createContext(null);

// Decode the payload (middle segment) of a JWT without verifying the signature.
// Returns null on any failure - we never trust this for authorisation, only to
// show a name / role in the UI. The server re-verifies on every request.
function decodeJwtPayload(token) {
    if (typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;

    try {
        // base64url -> base64 with padding
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const binary = atob(padded);

        // Re-decode as UTF-8 in case the payload contains non-ASCII.
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

    function login(newToken) {
        const payload = decodeJwtPayload(newToken);
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
        setUser(payload);
    }

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

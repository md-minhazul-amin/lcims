// ============================================================================
// File:    api/axios.js
// Purpose: Pre-configured Axios instance with base URL and JWT auth interceptor.
//          All feature pages import this `api` object instead of raw axios so
//          every request hits localhost:5000/api and carries Authorization: Bearer.
// Author:  The IT Crowd
// Date:    May 2026
// Project: LCIMS - Local Cafe Inventory Management System
// ============================================================================

import axios from 'axios';

const TOKEN_KEY = 'lcims_token';

const api = axios.create({
    // baseURL: prefix for all relative paths (e.g. api.get('/inventory') ->
    // http://localhost:5000/api/inventory). Matches the Express mount in server/index.js.
    baseURL: 'http://localhost:5000/api',
});

// Request interceptor: runs before each outgoing call. Reads the JWT from
// localStorage (same TOKEN_KEY as AuthContext) and attaches
// Authorization: Bearer <token> so protected routes receive credentials automatically.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

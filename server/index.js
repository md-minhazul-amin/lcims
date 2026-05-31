// ============================================================================
// File:    index.js
// Purpose: Main entry point for the LCIMS Express API server. Boots up the
//          HTTP server, wires global middleware (CORS, JSON body parsing),
//          mounts every feature router under /api/*, registers 404 and global
//          error handlers, and starts listening on the configured port.
// Author:  The IT Crowd
// Date:    May 2026
// Project: LCIMS - Local Cafe Inventory Management System
// ============================================================================

// Load .env values into process.env BEFORE any other module is required.
// This guarantees that db.js sees DB_PASSWORD, JWT_SECRET, etc. when it runs.
require('dotenv').config();

// Express is the HTTP framework used for routing and middleware.
const express = require('express');
// CORS middleware - allows the React dev server on localhost:3000 to call
// this API on localhost:5000 without being blocked by the browser's
// same-origin policy.
const cors = require('cors');

// Require db.js purely for its side effect: it constructs the shared
// PostgreSQL pool and runs the startup connection smoke test. We do not
// need its export here because individual route files require it directly.
require('./db');

// Pull in each feature router. Splitting routes into separate files keeps
// this entry point thin and makes the codebase easier to navigate.
const authRoutes      = require('./routes/auth');       // /api/auth/*       (register, login)
const inventoryRoutes = require('./routes/inventory');  // /api/inventory/*  (CRUD + stock + logs)
const suppliersRoutes = require('./routes/suppliers');  // /api/suppliers/*  (CRUD)
const reportsRoutes   = require('./routes/reports');    // /api/reports/*    (dashboard, usage)
const aiRoutes        = require('./routes/ai');         // /api/ai/*         (OpenAI reorder)
const alertsRoutes    = require('./routes/alerts');
const ordersRoutes    = require('./routes/orders');  // /api/orders/* (supplier order requests)

// Create the Express application instance.
const app = express();

// Enable CORS for all routes with default permissive settings (any origin).
// Acceptable for a dev / capstone build; tighten in production.
app.use(cors());
// Parse incoming JSON request bodies and expose them on req.body.
app.use(express.json());

// Health-check / root endpoint. Useful for confirming the API is reachable
// (e.g. browsing to http://localhost:5000 in the browser).
app.get('/', (req, res) => {
    res.json({ message: 'LCIMS API running', version: '1.0.0' });
});

// Mount each feature router under its URL prefix. Express delegates any
// request whose path starts with the prefix to that router.
app.use('/api/auth',      authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/reports',   reportsRoutes);
app.use('/api/ai',        aiRoutes);
// Alert management routes
app.use('/api/alerts',    alertsRoutes);
// Supplier order request routes (added per professor feedback — Assessment 6)
app.use('/api/orders',    ordersRoutes);

// Catch-all 404 handler. Reached only if no route above matched the URL.
// Returns a clean JSON error rather than Express's default HTML page.
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// Global error handler. Express recognises a middleware with 4 args as the
// error handler and passes any error thrown by a route here. We log the full
// stack server-side for debugging and return a sanitised JSON response.
app.use((err, req, res, _next) => {
    console.error('[error]', err.stack || err.message || err);
    const status = err.status || 500;
    res.status(status).json({
        error: err.message || 'Internal Server Error',
    });
});

// Use PORT from .env if set, otherwise fall back to 5000 (the frontend
// proxy is configured to expect 5000).
const PORT = parseInt(process.env.PORT, 10) || 5000;
// Start the HTTP server. The callback fires once the server is listening,
// confirming a successful startup in the terminal.
app.listen(PORT, () => {
    console.log(`LCIMS Server running on port ${PORT} (http://localhost:${PORT})`);
});

// Export the app instance so it can be imported by test frameworks (e.g.
// supertest) without actually opening a network socket.
module.exports = app;

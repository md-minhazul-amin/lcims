// ============================================================================
// File:    db.js
// Purpose: Creates and exports the shared PostgreSQL connection pool used by
//          every backend route. Loads database credentials from .env, runs a
//          one-off connection test on startup so misconfiguration is caught
//          early, and logs any unexpected errors raised by idle clients.
// Author:  The IT Crowd
// Date:    May 2026
// Project: LCIMS - Local Cafe Inventory Management System
// ============================================================================

// Load environment variables from the .env file into process.env before any
// other code reads them (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD).
require('dotenv').config();

// Pool is the connection-pool class from the `pg` (node-postgres) driver.
// A pool keeps a set of reusable PostgreSQL connections open in the background
// so each API request does NOT pay the cost of opening a brand-new TCP +
// authentication handshake. Routes simply borrow a client from the pool,
// run their query, and return it - this is what lets the server handle many
// concurrent requests efficiently.
const { Pool } = require('pg');

// Create the single shared pool instance for the whole server process.
// All values are read from environment variables so the same code works
// against local dev, staging, and production databases without changes.
const pool = new Pool({
    // Hostname / IP of the PostgreSQL server (e.g. "localhost" in dev).
    host:     process.env.DB_HOST,
    // TCP port the database listens on - 5432 is the PostgreSQL default.
    // parseInt is required because everything in process.env is a string.
    port:     parseInt(process.env.DB_PORT, 10),
    // Name of the database to connect to (the LCIMS schema lives in "lcims").
    database: process.env.DB_NAME,
    // PostgreSQL role/username used to authenticate (e.g. "postgres").
    user:     process.env.DB_USER,
    // Password for the user above - kept in .env and excluded from git.
    password: process.env.DB_PASSWORD,
});

// Pull a client from the pool once at startup purely as a connection smoke
// test. If credentials, host, or port are wrong we want to fail loudly in
// the terminal immediately instead of waiting until the first API request
// arrives from the browser.
pool.connect()
    .then((client) => {
        // Connection succeeded - log the target DB so the developer can see
        // which database the server is actually talking to.
        console.log(
            `Connected to PostgreSQL "${process.env.DB_NAME}" at ` +
            `${process.env.DB_HOST}:${process.env.DB_PORT} as "${process.env.DB_USER}"`
        );
        // Return the client to the pool so it can be reused by real queries.
        // Without release() the pool would slowly leak connections.
        client.release();
    })
    .catch((err) => {
        // Connection failed - print a clear message rather than crashing the
        // process, so the developer can fix .env and restart.
        console.error(
            'PostgreSQL connection error:',
            err.message || err.code || err
        );
    });

// Pool clients that are sitting idle (e.g. waiting in the pool for the next
// query) can still emit asynchronous errors - for example, if the database
// server restarts or the network drops. Node would crash the whole process
// on an unhandled "error" event, so we attach a listener to log it instead
// and let the pool transparently replace the broken client on the next use.
pool.on('error', (err) => {
    console.error('[db] Unexpected error on idle client:', err.message);
});

// Export the single pool instance so every route file (auth, inventory,
// suppliers, reports, ai) can `require('../db')` and share the same pool
// rather than each creating their own.
module.exports = pool;

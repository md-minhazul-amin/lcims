// ============================================================================
// File:    routes/auth.js
// Purpose: User registration and login endpoints for the LCIMS API.
//          POST /register creates accounts with bcrypt-hashed passwords;
//          POST /login validates credentials and returns a signed JWT used
//          by all protected routes via middleware/auth.js.
// Author:  The IT Crowd
// Date:    May 2026
// Project: LCIMS - Local Cafe Inventory Management System
// ============================================================================

// Express Router groups these handlers under /api/auth (see index.js).
const express = require('express');
// bcryptjs hashes passwords on register and compares them on login.
const bcrypt = require('bcryptjs');
// jsonwebtoken signs the access token returned after a successful login.
const jwt = require('jsonwebtoken');

// Shared PostgreSQL connection pool (see server/db.js).
const pool = require('../db');

// Isolated router mounted at /api/auth in index.js.
const router = express.Router();

// bcrypt work factor (cost). 12 is the OWASP-recommended minimum for 2024+:
// each increment doubles hashing time, making brute-force attacks expensive
// while keeping register/login responsive (~250 ms per hash on typical hardware).
const SALT_ROUNDS = 12;

// JWT expiry. 8 hours matches a typical café shift so staff are not forced to
// re-login mid-service; after expiry, verifyToken returns 403 and the client
// must call POST /login again.
const TOKEN_TTL = '8h';

/**
 * @route  POST /api/auth/register
 * @desc   Creates a new user account with hashed password
 * @access Public
 * @body   { email, password, role, cafe_id }
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, role, cafe_id } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Duplicate email check: query before hashing so we fail fast and do
        // not waste bcrypt work on an address that already exists.
        const existing = await pool.query(
            'SELECT user_id FROM users WHERE email = $1',
            [email]
        );
        if (existing.rowCount > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // bcrypt.hash: one-way transform of the plaintext password using
        // SALT_ROUNDS; only password_hash is stored in the database.
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

        // INSERT query: persist the new user; RETURNING exposes safe fields
        // (never password_hash) for the 201 response body.
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, role, cafe_id)
             VALUES ($1, $2, $3, $4)
             RETURNING user_id, email, role, cafe_id`,
            [email, password_hash, role, cafe_id ?? null]
        );

        // 201 Created: standard HTTP status for a successful resource creation.
        return res.status(201).json({
            message: 'User registered successfully',
            user: result.rows[0],
        });
    } catch (err) {
        console.error('[auth/register]', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route  POST /api/auth/login
 * @desc   Validates credentials and returns a signed JWT token
 * @access Public
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // User lookup: fetch the row for this email including password_hash
        // (needed for bcrypt.compare; hash is never sent to the client).
        const result = await pool.query(
            `SELECT user_id, email, password_hash, role, cafe_id
             FROM users
             WHERE email = $1`,
            [email]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const row = result.rows[0];

        // bcrypt.compare: timing-safe check of plaintext password against the
        // stored hash; returns false if the password does not match.
        const passwordOk = await bcrypt.compare(password, row.password_hash);
        if (!passwordOk) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // JWT payload construction: only non-sensitive fields embedded in the
        // token so verifyToken can populate req.user on later requests.
        const payload = {
            user_id: row.user_id,
            email:   row.email,
            role:    row.role,
            cafe_id: row.cafe_id,
        };

        // jwt.sign: HMAC-sign the payload with JWT_SECRET and TOKEN_TTL expiry.
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: TOKEN_TTL,
        });

        // Response: token for Authorization: Bearer on protected routes;
        // user object lets the React app show role/email without decoding JWT.
        return res.json({
            message: 'Login successful',
            token,
            user: payload,
        });
    } catch (err) {
        console.error('[auth/login]', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Export the router so index.js can mount it: app.use('/api/auth', authRoutes).
module.exports = router;

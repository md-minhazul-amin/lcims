const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = require('../db');

const router = express.Router();

const SALT_ROUNDS = 12;
const TOKEN_TTL = '8h';

// ---------------------------------------------------------------------------
// POST /api/auth/register
// Body: { email, password, role, cafe_id }
// ---------------------------------------------------------------------------
router.post('/register', async (req, res) => {
    try {
        const { email, password, role, cafe_id } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existing = await pool.query(
            'SELECT user_id FROM users WHERE email = $1',
            [email]
        );
        if (existing.rowCount > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

        const result = await pool.query(
            `INSERT INTO users (email, password_hash, role, cafe_id)
             VALUES ($1, $2, $3, $4)
             RETURNING user_id, email, role, cafe_id`,
            [email, password_hash, role, cafe_id ?? null]
        );

        return res.status(201).json({
            message: 'User registered successfully',
            user: result.rows[0],
        });
    } catch (err) {
        console.error('[auth/register]', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// Body: { email, password }
// ---------------------------------------------------------------------------
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

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
        const passwordOk = await bcrypt.compare(password, row.password_hash);
        if (!passwordOk) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const payload = {
            user_id: row.user_id,
            email:   row.email,
            role:    row.role,
            cafe_id: row.cafe_id,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: TOKEN_TTL,
        });

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

module.exports = router;

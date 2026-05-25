// ============================================================================
// File:    middleware/auth.js
// Purpose: JWT token verification and role-based access control middleware
//          for the LCIMS API. Provides two Express middleware functions that
//          protect routes: one that authenticates the caller from the JWT in
//          the Authorization header, and one that further restricts access
//          to Manager and Admin users only.
// Author:  The IT Crowd
// Date:    May 2026
// Project: LCIMS - Local Cafe Inventory Management System
// ============================================================================

// jsonwebtoken handles signing (in routes/auth.js) and verifying (here) JWTs.
const jwt = require('jsonwebtoken');

// ---------------------------------------------------------------------------
// verifyToken
// ---------------------------------------------------------------------------
// What:    Express middleware that authenticates the caller from the JWT
//          carried in the request's Authorization header. Every protected
//          /api/* route mounts this so handlers can trust req.user.
// Header:  Reads the "Authorization" HTTP header in the form
//             Authorization: Bearer <jwt>
//          (accepts either casing of the header name).
// Success: Verifies the JWT against process.env.JWT_SECRET, attaches the
//          decoded payload (user_id, email, role, cafe_id) to req.user, and
//          calls next() to pass control to the next handler.
// Failure: 401 Authorization token missing   - header absent or malformed.
//          403 Invalid or expired token      - signature bad / token expired.
// ---------------------------------------------------------------------------
function verifyToken(req, res, next) {
    // Step 1: read the Authorization header. HTTP header names are
    // case-insensitive, so accept both "authorization" and "Authorization".
    const authHeader = req.headers.authorization || req.headers.Authorization;

    // Step 2: confirm the "Bearer " prefix is present. Reject anything else
    // (missing header, wrong scheme like "Basic ...", etc.) with 401.
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token missing' });
    }

    // Step 3: extract the token by slicing off the 7-character "Bearer "
    // prefix and trimming any surrounding whitespace.
    const token = authHeader.slice('Bearer '.length).trim();
    // Step 3b: reject the edge case where the header was literally "Bearer "
    // with no token after it.
    if (!token) {
        return res.status(401).json({ error: 'Authorization token missing' });
    }

    try {
        // Step 4: verify the JWT. jwt.verify checks the HMAC signature
        // against JWT_SECRET AND that the token has not expired. It throws
        // if either check fails (tampered, wrong secret, or past expiry).
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Step 5: attach the decoded payload to req.user so downstream
        // route handlers can read user_id, email, role, and cafe_id without
        // having to decode the token themselves.
        req.user = decoded;
        // Step 6: success - hand control to the next middleware / handler.
        return next();
    } catch (err) {
        // Verification failed. 403 (not 401) is used here to distinguish
        // "you sent a token but it's invalid or expired" from "you sent no
        // token at all" (which 401 above covers).
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

// ---------------------------------------------------------------------------
// requireManager
// ---------------------------------------------------------------------------
// What:    Express middleware that adds a role check on top of verifyToken.
//          Mounted on routes that modify catalogue data (creating / editing
//          / deleting inventory items and suppliers).
// Allows:  Users whose JWT role is "Manager" or "Admin".
// Rejects: "Staff" users (read-only + stock adjustments) -> 403 Forbidden.
//          Unauthenticated callers (verifyToken did not run) -> 401.
// Note:    MUST be mounted AFTER verifyToken in the route chain, otherwise
//          req.user will not exist and every call falls through to the 401.
// ---------------------------------------------------------------------------
function requireManager(req, res, next) {
    // Check 1: defensive guard - if verifyToken did not run first there is
    // no authenticated user to check the role of, so refuse with 401.
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    // Check 2: only Manager and Admin are allowed past this point. Staff
    // can read inventory and adjust stock but cannot manage the catalogue.
    if (req.user.role !== 'Manager' && req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Manager or Admin role required' });
    }
    // Check 3: both checks passed - continue to the actual route handler.
    return next();
}

// Export both middleware functions:
//   verifyToken    - authenticates the caller from the JWT (used router-wide).
//   requireManager - restricts a route to Manager/Admin (used per-route).
// Consumers import with:  const { verifyToken, requireManager } = require('../middleware/auth');
module.exports = { verifyToken, requireManager };

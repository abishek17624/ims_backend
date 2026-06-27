// routes/auth/me.router.js
// Returns the currently authenticated user's profile.
// The users table has: id, email, password, role, created_at
// (no 'name', 'email_verified', or 'mobile_verified' columns)
const express = require('express');
const router  = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const db = require('../../config/db');

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Only query columns that actually exist in the users table
    const [rows] = await db.execute(
      'SELECT id, email, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];

    // Build name from related role-specific table, fall back to email prefix
    let name = user.email.split('@')[0];
    try {
      if (user.role === 'admin') {
        const [adminRows] = await db.execute('SELECT name FROM admin WHERE user_id = ?', [userId]);
        if (adminRows.length) name = adminRows[0].name;
      } else if (user.role === 'salesperson') {
        const [spRows] = await db.execute('SELECT name FROM salesperson WHERE user_id = ?', [userId]);
        if (spRows.length) name = spRows[0].name;
      } else if (user.role === 'supplier') {
        const [supRows] = await db.execute('SELECT name FROM supplier WHERE user_id = ?', [userId]);
        if (supRows.length) name = supRows[0].name;
      }
    } catch (_) {
      // Name lookup failed — use fallback silently
    }

    res.json({
      id:    user.id,
      name,
      email: user.email,
      role:  user.role,
      // These don't exist in the DB — hardcoded defaults for frontend compatibility
      email_verified:  false,
      mobile_verified: false,
    });

  } catch (error) {
    console.error('Error in /auth/me:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
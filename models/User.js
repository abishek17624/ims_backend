/**
 * models/User.js
 * ORM-style model for the `users` table.
 * Columns: id, email, password, role, created_at
 */

const db = require('../config/db');

const User = {
  // ── Queries ──────────────────────────────────────────────────────────────

  /** Return all users (passwords excluded). */
  async findAll() {
    const [rows] = await db.execute(
      'SELECT id, email, role, created_at FROM users ORDER BY id'
    );
    return rows;
  },

  /** Find a single user by primary key (excludes password). */
  async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, email, role, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  /** Find a user by email — includes hashed password for auth comparison. */
  async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  },

  /** Find all users with a specific role. */
  async findByRole(role) {
    const [rows] = await db.execute(
      'SELECT id, email, role, created_at FROM users WHERE role = ?',
      [role]
    );
    return rows;
  },

  // ── Mutations ────────────────────────────────────────────────────────────

  /**
   * Create a new user.
   * @param {{ email: string, password: string, role: 'admin'|'salesperson'|'supplier' }} data
   * @returns {{ insertId: number }}
   */
  async create({ email, password, role }) {
    const [result] = await db.execute(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email, password, role]
    );
    return { insertId: result.insertId };
  },

  /**
   * Update a user's password (pass in already-hashed value).
   * @param {number} id
   * @param {string} hashedPassword
   */
  async updatePassword(id, hashedPassword) {
    await db.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
  },

  /** Delete a user by id. */
  async delete(id) {
    const [result] = await db.execute(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  },
};

module.exports = User;

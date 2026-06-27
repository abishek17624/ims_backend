/**
 * models/Admin.js
 * ORM-style model for the `admin` table.
 * Columns: id, name, email, password (nullable), user_id, created_at
 */

const db = require('../config/db');

const Admin = {
  // ── Queries ──────────────────────────────────────────────────────────────

  /** Return all admin records. */
  async findAll() {
    const [rows] = await db.execute(
      'SELECT id, name, email, user_id, created_at FROM admin ORDER BY id'
    );
    return rows;
  },

  /** Find an admin by primary key. */
  async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, name, email, user_id, created_at FROM admin WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  /** Find an admin by email. */
  async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT id, name, email, user_id, created_at FROM admin WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  },

  /** Find admin by linked user_id. */
  async findByUserId(userId) {
    const [rows] = await db.execute(
      'SELECT id, name, email, user_id, created_at FROM admin WHERE user_id = ?',
      [userId]
    );
    return rows[0] || null;
  },

  // ── Mutations ────────────────────────────────────────────────────────────

  /**
   * Create a new admin profile (user row must already exist).
   * @param {{ name: string, email: string, user_id: number, password?: string }} data
   */
  async create({ name, email, user_id, password = null }) {
    const [result] = await db.execute(
      'INSERT INTO admin (name, email, user_id, password) VALUES (?, ?, ?, ?)',
      [name, email, user_id, password]
    );
    return { insertId: result.insertId };
  },

  /**
   * Update admin details.
   * @param {number} id
   * @param {{ name?: string, email?: string }} data
   */
  async update(id, { name, email }) {
    const fields = [];
    const values = [];
    if (name  !== undefined) { fields.push('name = ?');  values.push(name);  }
    if (email !== undefined) { fields.push('email = ?'); values.push(email); }
    if (!fields.length) return 0;
    values.push(id);
    const [result] = await db.execute(
      `UPDATE admin SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows;
  },

  /** Delete an admin by id. */
  async delete(id) {
    const [result] = await db.execute('DELETE FROM admin WHERE id = ?', [id]);
    return result.affectedRows;
  },
};

module.exports = Admin;

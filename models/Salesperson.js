/**
 * models/Salesperson.js
 * ORM-style model for the `salesperson` table.
 * Columns: id, name, contact, email, password, date_added,
 *          sales_target, current_sales, performance_rating, user_id
 */

const db = require('../config/db');

const Salesperson = {
  // ── Queries ──────────────────────────────────────────────────────────────

  /** Return all salesperson records (no passwords). */
  async findAll() {
    const [rows] = await db.execute(
      `SELECT id, name, contact, email, date_added,
              sales_target, current_sales, performance_rating, user_id
       FROM salesperson ORDER BY id`
    );
    return rows;
  },

  /** Find by primary key. */
  async findById(id) {
    const [rows] = await db.execute(
      `SELECT id, name, contact, email, date_added,
              sales_target, current_sales, performance_rating, user_id
       FROM salesperson WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /** Find by email (includes hashed password for auth). */
  async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM salesperson WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  },

  /** Find by linked user_id. */
  async findByUserId(userId) {
    const [rows] = await db.execute(
      `SELECT id, name, contact, email, date_added,
              sales_target, current_sales, performance_rating, user_id
       FROM salesperson WHERE user_id = ?`,
      [userId]
    );
    return rows[0] || null;
  },

  // ── Mutations ────────────────────────────────────────────────────────────

  /**
   * Create a new salesperson profile.
   * @param {{ name, contact, email, password, sales_target?, current_sales?, performance_rating?, user_id? }} data
   */
  async create({ name, contact, email, password, sales_target = null, current_sales = null, performance_rating = null, user_id = null }) {
    const [result] = await db.execute(
      `INSERT INTO salesperson
         (name, contact, email, password, sales_target, current_sales, performance_rating, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, contact, email, password, sales_target, current_sales, performance_rating, user_id]
    );
    return { insertId: result.insertId };
  },

  /**
   * Update salesperson profile fields.
   * @param {number} id
   * @param {Partial<{name, contact, email, sales_target, current_sales, performance_rating}>} data
   */
  async update(id, data) {
    const allowed = ['name','contact','email','sales_target','current_sales','performance_rating'];
    const fields  = [];
    const values  = [];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (!fields.length) return 0;
    values.push(id);
    const [result] = await db.execute(
      `UPDATE salesperson SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows;
  },

  /** Delete a salesperson by id. */
  async delete(id) {
    const [result] = await db.execute(
      'DELETE FROM salesperson WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  },
};

module.exports = Salesperson;

/**
 * models/Supplier.js
 * ORM-style model for the `supplier` table.
 * Columns: id, name, product, category, price, contact, email,
 *          returnPolicy, dateAdded, password, status, comments, user_id
 */

const db = require('../config/db');

const Supplier = {
  // ── Queries ──────────────────────────────────────────────────────────────

  /** Return all suppliers (no passwords). */
  async findAll() {
    const [rows] = await db.execute(
      `SELECT id, name, product, category, price, contact, email,
              returnPolicy, dateAdded, status, comments, user_id
       FROM supplier ORDER BY id`
    );
    return rows;
  },

  /** Find supplier by primary key. */
  async findById(id) {
    const [rows] = await db.execute(
      `SELECT id, name, product, category, price, contact, email,
              returnPolicy, dateAdded, status, comments, user_id
       FROM supplier WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /** Find by email (includes hashed password for auth). */
  async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM supplier WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  },

  /** Find by linked user_id. */
  async findByUserId(userId) {
    const [rows] = await db.execute(
      `SELECT id, name, product, category, price, contact, email,
              returnPolicy, dateAdded, status, comments, user_id
       FROM supplier WHERE user_id = ?`,
      [userId]
    );
    return rows[0] || null;
  },

  /** Find all suppliers with active status. */
  async findActive() {
    const [rows] = await db.execute(
      `SELECT id, name, product, category, price, contact, email,
              returnPolicy, dateAdded, status, comments, user_id
       FROM supplier WHERE status = 'active' ORDER BY name`
    );
    return rows;
  },

  // ── Mutations ────────────────────────────────────────────────────────────

  /**
   * Create a new supplier.
   * @param {{ name, product?, category?, price?, contact?, email, returnPolicy?, password?, status?, comments?, user_id? }} data
   */
  async create({ name, product = null, category = null, price = null, contact = null, email, returnPolicy = 'no', password = null, status = 'active', comments = null, user_id = null }) {
    const [result] = await db.execute(
      `INSERT INTO supplier
         (name, product, category, price, contact, email, returnPolicy, password, status, comments, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, product, category, price, contact, email, returnPolicy, password, status, comments, user_id]
    );
    return { insertId: result.insertId };
  },

  /**
   * Update supplier fields.
   * @param {number} id
   * @param {Partial<{name, product, category, price, contact, email, returnPolicy, status, comments}>} data
   */
  async update(id, data) {
    const allowed = ['name','product','category','price','contact','email','returnPolicy','status','comments'];
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
      `UPDATE supplier SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows;
  },

  /** Delete a supplier by id. */
  async delete(id) {
    const [result] = await db.execute(
      'DELETE FROM supplier WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  },
};

module.exports = Supplier;

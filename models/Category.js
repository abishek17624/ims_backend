/**
 * models/Category.js
 * ORM-style model for the `category` table.
 * Columns: id, name, action, created_at, updated_at
 */

const db = require('../config/db');

const Category = {
  // ── Queries ──────────────────────────────────────────────────────────────

  /** Return all categories. */
  async findAll() {
    const [rows] = await db.execute(
      'SELECT * FROM category ORDER BY name'
    );
    return rows;
  },

  /** Return only active categories. */
  async findActive() {
    const [rows] = await db.execute(
      "SELECT * FROM category WHERE action = 'active' ORDER BY name"
    );
    return rows;
  },

  /** Find category by primary key. */
  async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM category WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  /** Find category by name. */
  async findByName(name) {
    const [rows] = await db.execute(
      'SELECT * FROM category WHERE name = ?',
      [name]
    );
    return rows[0] || null;
  },

  // ── Mutations ────────────────────────────────────────────────────────────

  /**
   * Create a new category.
   * @param {{ name: string, action?: 'active'|'inactive' }} data
   */
  async create({ name, action = 'active' }) {
    const [result] = await db.execute(
      'INSERT INTO category (name, action) VALUES (?, ?)',
      [name, action]
    );
    return { insertId: result.insertId };
  },

  /**
   * Update category.
   * @param {number} id
   * @param {{ name?: string, action?: string }} data
   */
  async update(id, { name, action }) {
    const fields = [];
    const values = [];
    if (name   !== undefined) { fields.push('name = ?');   values.push(name);   }
    if (action !== undefined) { fields.push('action = ?'); values.push(action); }
    if (!fields.length) return 0;
    values.push(id);
    const [result] = await db.execute(
      `UPDATE category SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows;
  },

  /** Delete a category. */
  async delete(id) {
    const [result] = await db.execute(
      'DELETE FROM category WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  },
};

module.exports = Category;

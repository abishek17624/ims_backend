/**
 * models/Billing.js
 * ORM-style model for the `billing` table.
 * Columns: id, customer_name, customer_phone, created_date, product_id,
 *          product_name, category, quantity, price, discount, total,
 *          total_qty_bill, total_amount_bill, updated_at
 */

const db = require('../config/db');

const Billing = {
  // ── Queries ──────────────────────────────────────────────────────────────

  /** Return all billing records. */
  async findAll() {
    const [rows] = await db.execute(
      'SELECT * FROM billing ORDER BY created_date DESC, id DESC'
    );
    return rows;
  },

  /** Find billing record by id. */
  async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM billing WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  /** Find billing records by product_id. */
  async findByProductId(productId) {
    const [rows] = await db.execute(
      'SELECT * FROM billing WHERE product_id = ? ORDER BY created_date DESC',
      [productId]
    );
    return rows;
  },

  /** Find billing records by customer_name (partial match). */
  async findByCustomer(name) {
    const [rows] = await db.execute(
      'SELECT * FROM billing WHERE customer_name LIKE ? ORDER BY created_date DESC',
      [`%${name}%`]
    );
    return rows;
  },

  /** Get billing records for a date range. */
  async findByDateRange(from, to) {
    const [rows] = await db.execute(
      'SELECT * FROM billing WHERE created_date BETWEEN ? AND ? ORDER BY created_date DESC',
      [from, to]
    );
    return rows;
  },

  // ── Mutations ────────────────────────────────────────────────────────────

  /**
   * Create a new billing record.
   * @param {{ customer_name, customer_phone?, created_date, product_id, product_name, category, quantity, price, discount, total, total_qty_bill, total_amount_bill }} data
   */
  async create({ customer_name, customer_phone = null, created_date, product_id, product_name, category, quantity, price, discount, total, total_qty_bill, total_amount_bill }) {
    const [result] = await db.execute(
      `INSERT INTO billing
         (customer_name, customer_phone, created_date, product_id, product_name,
          category, quantity, price, discount, total, total_qty_bill, total_amount_bill)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [customer_name, customer_phone, created_date, product_id, product_name,
       category, quantity, price, discount, total, total_qty_bill, total_amount_bill]
    );
    return { insertId: result.insertId };
  },

  /** Delete a billing record. */
  async delete(id) {
    const [result] = await db.execute(
      'DELETE FROM billing WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  },

  /** Revenue stats for dashboard. */
  async getStats() {
    const [[stats]] = await db.execute(
      `SELECT
         COUNT(DISTINCT customer_name) AS total_customers,
         SUM(total_amount_bill) AS total_revenue,
         SUM(total_qty_bill)    AS total_items_sold
       FROM billing`
    );
    return stats;
  },
};

module.exports = Billing;

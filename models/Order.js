/**
 * models/Order.js
 * ORM-style model for the `orders` table.
 * Columns: order_id (varchar36), order_date, product_id, product_name, product_code,
 *          quantity, unit, supplier_id, supplier, supplier_phone, category,
 *          delivery_date, delivery_status, status, admin_notes, supplier_notes,
 *          last_updated, value
 */

const db = require('../config/db');

const Order = {
  // ── Queries ──────────────────────────────────────────────────────────────

  /** Return all orders with joined supplier & product name. */
  async findAll() {
    const [rows] = await db.execute(
      'SELECT * FROM orders ORDER BY order_date DESC'
    );
    return rows;
  },

  /** Find order by primary key. */
  async findById(orderId) {
    const [rows] = await db.execute(
      'SELECT * FROM orders WHERE order_id = ?',
      [orderId]
    );
    return rows[0] || null;
  },

  /** Find all orders for a specific supplier. */
  async findBySupplierId(supplierId) {
    const [rows] = await db.execute(
      'SELECT * FROM orders WHERE supplier_id = ? ORDER BY order_date DESC',
      [supplierId]
    );
    return rows;
  },

  /** Find all orders for a specific product. */
  async findByProductId(productId) {
    const [rows] = await db.execute(
      'SELECT * FROM orders WHERE product_id = ? ORDER BY order_date DESC',
      [productId]
    );
    return rows;
  },

  /** Find orders by status. */
  async findByStatus(status) {
    const [rows] = await db.execute(
      'SELECT * FROM orders WHERE status = ? ORDER BY order_date DESC',
      [status]
    );
    return rows;
  },

  // ── Mutations ────────────────────────────────────────────────────────────

  /**
   * Create a new order.
   * @param {{ order_id, product_id, product_name?, product_code?, quantity, unit, supplier_id, supplier?, supplier_phone?, category?, delivery_date, delivery_status, status, admin_notes?, supplier_notes?, value? }} data
   */
  async create({ order_id, product_id, product_name = null, product_code = null, quantity, unit, supplier_id, supplier = null, supplier_phone = null, category = null, delivery_date, delivery_status, status, admin_notes = null, supplier_notes = null, value = null }) {
    const [result] = await db.execute(
      `INSERT INTO orders
         (order_id, product_id, product_name, product_code, quantity, unit,
          supplier_id, supplier, supplier_phone, category, delivery_date,
          delivery_status, status, admin_notes, supplier_notes, value)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order_id, product_id, product_name, product_code, quantity, unit,
       supplier_id, supplier, supplier_phone, category, delivery_date,
       delivery_status, status, admin_notes, supplier_notes, value]
    );
    return { insertId: result.insertId };
  },

  /**
   * Update order status / notes.
   * @param {string} orderId
   * @param {Partial<{status, delivery_status, admin_notes, supplier_notes, delivery_date, value}>} data
   */
  async update(orderId, data) {
    const allowed = ['status','delivery_status','admin_notes','supplier_notes','delivery_date','value','quantity','unit'];
    const fields  = [];
    const values  = [];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (!fields.length) return 0;
    values.push(orderId);
    const [result] = await db.execute(
      `UPDATE orders SET ${fields.join(', ')} WHERE order_id = ?`,
      values
    );
    return result.affectedRows;
  },

  /** Delete an order. */
  async delete(orderId) {
    const [result] = await db.execute(
      'DELETE FROM orders WHERE order_id = ?',
      [orderId]
    );
    return result.affectedRows;
  },

  /** Summary stats for dashboard. */
  async getStats() {
    const [[stats]] = await db.execute(
      `SELECT
         COUNT(*) AS total_orders,
         SUM(CASE WHEN status = 'Pending'   THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN status = 'Confirmed' THEN 1 ELSE 0 END) AS confirmed,
         SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) AS delivered,
         SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled,
         COALESCE(SUM(value), 0) AS total_value
       FROM orders`
    );
    return stats;
  },
};

module.exports = Order;

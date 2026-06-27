/**
 * models/Invoice.js
 * ORM-style model for the `invoice` table.
 * Columns: invoice_id, order_id, supplier_id, invoice_date, due_date,
 *          amount, status, created_at, updated_at
 */

const db = require('../config/db');

const Invoice = {
  // ── Queries ──────────────────────────────────────────────────────────────

  /** Return all invoices. */
  async findAll() {
    const [rows] = await db.execute(
      'SELECT * FROM invoice ORDER BY invoice_date DESC'
    );
    return rows;
  },

  /** Find invoice by primary key. */
  async findById(invoiceId) {
    const [rows] = await db.execute(
      'SELECT * FROM invoice WHERE invoice_id = ?',
      [invoiceId]
    );
    return rows[0] || null;
  },

  /** Find invoice by order_id. */
  async findByOrderId(orderId) {
    const [rows] = await db.execute(
      'SELECT * FROM invoice WHERE order_id = ?',
      [orderId]
    );
    return rows[0] || null;
  },

  /** Find all invoices for a specific supplier. */
  async findBySupplierId(supplierId) {
    const [rows] = await db.execute(
      'SELECT * FROM invoice WHERE supplier_id = ? ORDER BY invoice_date DESC',
      [supplierId]
    );
    return rows;
  },

  /** Find invoices by payment status. */
  async findByStatus(status) {
    const [rows] = await db.execute(
      'SELECT * FROM invoice WHERE status = ? ORDER BY due_date ASC',
      [status]
    );
    return rows;
  },

  /** Find overdue invoices (status = pending and due_date < today). */
  async findOverdue() {
    const [rows] = await db.execute(
      `SELECT * FROM invoice
       WHERE status = 'pending' AND due_date < CURDATE()
       ORDER BY due_date ASC`
    );
    return rows;
  },

  // ── Mutations ────────────────────────────────────────────────────────────

  /**
   * Create a new invoice.
   * @param {{ order_id, supplier_id, invoice_date, due_date, amount, status? }} data
   */
  async create({ order_id, supplier_id, invoice_date, due_date, amount, status = 'pending' }) {
    const [result] = await db.execute(
      `INSERT INTO invoice (order_id, supplier_id, invoice_date, due_date, amount, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [order_id, supplier_id, invoice_date, due_date, amount, status]
    );
    return { insertId: result.insertId };
  },

  /**
   * Update invoice status.
   * @param {number} invoiceId
   * @param {'paid'|'pending'|'overdue'|'cancelled'} status
   */
  async updateStatus(invoiceId, status) {
    const [result] = await db.execute(
      'UPDATE invoice SET status = ? WHERE invoice_id = ?',
      [status, invoiceId]
    );
    return result.affectedRows;
  },

  /**
   * Update invoice fields.
   * @param {number} invoiceId
   * @param {Partial<{invoice_date, due_date, amount, status}>} data
   */
  async update(invoiceId, data) {
    const allowed = ['invoice_date','due_date','amount','status'];
    const fields  = [];
    const values  = [];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (!fields.length) return 0;
    values.push(invoiceId);
    const [result] = await db.execute(
      `UPDATE invoice SET ${fields.join(', ')} WHERE invoice_id = ?`,
      values
    );
    return result.affectedRows;
  },

  /** Delete an invoice. */
  async delete(invoiceId) {
    const [result] = await db.execute(
      'DELETE FROM invoice WHERE invoice_id = ?',
      [invoiceId]
    );
    return result.affectedRows;
  },

  /** Invoice stats for dashboard. */
  async getStats() {
    const [[stats]] = await db.execute(
      `SELECT
         COUNT(*) AS total_invoices,
         SUM(CASE WHEN status = 'paid'     THEN amount ELSE 0 END) AS paid_amount,
         SUM(CASE WHEN status = 'pending'  THEN amount ELSE 0 END) AS pending_amount,
         SUM(CASE WHEN status = 'overdue'  THEN amount ELSE 0 END) AS overdue_amount
       FROM invoice`
    );
    return stats;
  },
};

module.exports = Invoice;

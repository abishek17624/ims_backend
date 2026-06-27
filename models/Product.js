/**
 * models/Product.js
 * ORM-style model for the `products` table.
 * Columns: id (varchar), name, category, subcategory, buying_price, selling_price,
 *          quantity, threshold, expiry, supplier, contact, status, action,
 *          created_at, updated_at, supplier_id
 */

const db = require('../config/db');

const Product = {
  // ── Queries ──────────────────────────────────────────────────────────────

  /** Return all products. */
  async findAll() {
    const [rows] = await db.execute(
      'SELECT * FROM products ORDER BY created_at DESC'
    );
    return rows;
  },

  /** Find a product by its id (varchar). */
  async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  /** Find products by category name. */
  async findByCategory(category) {
    const [rows] = await db.execute(
      'SELECT * FROM products WHERE category = ? ORDER BY name',
      [category]
    );
    return rows;
  },

  /** Find products by supplier_id. */
  async findBySupplierId(supplierId) {
    const [rows] = await db.execute(
      'SELECT * FROM products WHERE supplier_id = ? ORDER BY name',
      [supplierId]
    );
    return rows;
  },

  /** Find products that are low on stock (quantity <= threshold). */
  async findLowStock() {
    const [rows] = await db.execute(
      `SELECT * FROM products WHERE quantity <= threshold AND action = 'active' ORDER BY quantity ASC`
    );
    return rows;
  },

  // ── Mutations ────────────────────────────────────────────────────────────

  /**
   * Create a new product.
   * @param {{ id, name, category, subcategory?, buying_price, selling_price, quantity, threshold, expiry?, supplier?, contact?, status?, action?, supplier_id? }} data
   */
  async create({ id, name, category, subcategory = null, buying_price, selling_price, quantity, threshold, expiry = null, supplier = null, contact = null, status = 'in_stock', action = 'active', supplier_id = null }) {
    const [result] = await db.execute(
      `INSERT INTO products
         (id, name, category, subcategory, buying_price, selling_price, quantity, threshold, expiry, supplier, contact, status, action, supplier_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, category, subcategory, buying_price, selling_price, quantity, threshold, expiry, supplier, contact, status, action, supplier_id]
    );
    return { insertId: result.insertId };
  },

  /**
   * Update product fields.
   * @param {string} id
   * @param {Partial<Product>} data
   */
  async update(id, data) {
    const allowed = ['name','category','subcategory','buying_price','selling_price','quantity','threshold','expiry','supplier','contact','status','action','supplier_id'];
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
      `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows;
  },

  /** Update product stock status based on quantity vs threshold. */
  async recalculateStatus(id) {
    await db.execute(
      `UPDATE products
       SET status = CASE
         WHEN quantity = 0 THEN 'out_of_stock'
         WHEN quantity <= threshold THEN 'low_stock'
         ELSE 'in_stock'
       END
       WHERE id = ?`,
      [id]
    );
  },

  /** Delete a product. */
  async delete(id) {
    const [result] = await db.execute(
      'DELETE FROM products WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  },

  /** Return aggregated stats: total products, total value, low stock count. */
  async getStats() {
    const [[stats]] = await db.execute(
      `SELECT
         COUNT(*) AS total_products,
         SUM(quantity * selling_price) AS total_value,
         SUM(CASE WHEN quantity <= threshold AND quantity > 0 THEN 1 ELSE 0 END) AS low_stock_count,
         SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) AS out_of_stock_count
       FROM products WHERE action = 'active'`
    );
    return stats;
  },
};

module.exports = Product;

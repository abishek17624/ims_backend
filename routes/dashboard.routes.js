/**
 * routes/dashboard.routes.js
 * Provides aggregated stats for the admin dashboard.
 * Route base: /api/dashboard
 */

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

/**
 * GET /api/dashboard/stats
 * Returns key metrics: products, orders, suppliers, salespersons, revenue
 * Protected: admin only
 */
router.get('/stats', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    // Products summary
    const [[productStats]] = await db.execute(
      `SELECT
         COUNT(*) AS total_products,
         SUM(CASE WHEN quantity <= threshold AND quantity > 0 THEN 1 ELSE 0 END) AS low_stock,
         SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) AS out_of_stock,
         COALESCE(SUM(quantity * selling_price), 0) AS inventory_value
       FROM products WHERE action = 'active'`
    );

    // Orders summary
    const [[orderStats]] = await db.execute(
      `SELECT
         COUNT(*) AS total_orders,
         SUM(CASE WHEN status = 'Pending'   THEN 1 ELSE 0 END) AS pending_orders,
         SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) AS delivered_orders,
         COALESCE(SUM(value), 0) AS total_order_value
       FROM orders`
    );

    // Supplier count
    const [[supplierStats]] = await db.execute(
      `SELECT
         COUNT(*) AS total_suppliers,
         SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_suppliers
       FROM supplier`
    );

    // Salesperson count
    const [[spStats]] = await db.execute(
      'SELECT COUNT(*) AS total_salespersons FROM salesperson'
    );

    // Invoice / Revenue stats
    const [[invoiceStats]] = await db.execute(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'paid'    THEN amount ELSE 0 END), 0) AS paid_revenue,
         COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending_revenue,
         COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END), 0) AS overdue_revenue
       FROM invoice`
    );

    res.json({
      success: true,
      data: {
        products:    productStats,
        orders:      orderStats,
        suppliers:   supplierStats,
        salespersons: { total_salespersons: spStats.total_salespersons },
        invoices:    invoiceStats,
      }
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * GET /api/dashboard/recent-orders
 * Returns the 5 most recent orders
 */
router.get('/recent-orders', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT order_id, product_name, supplier, quantity, status, order_date
       FROM orders ORDER BY order_date DESC LIMIT 5`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Recent orders error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

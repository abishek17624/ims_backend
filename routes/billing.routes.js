// backend/routes/billing.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Your database connection
const authMiddleware = require('../middleware/auth.middleware'); //
const authorizeRoles = require('../middleware/role.middleware'); //

// Helper to generate unique transaction ID
function generateTransactionId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TXN-${timestamp}-${random}`;
}

// Helper to format dates from DB for frontend (YYYY-MM-DD)
function formatDateForFrontend(date) {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // YYYY-MM-DD for Angular date input
}


// POST /billing/create - Create a new bill (Protected: Salesperson only)
// POST /billing/create - Create a new bill (Salesperson only)
router.post('/create', authMiddleware, authorizeRoles('salesperson'), async (req, res) => {
  const {
    customer_name, customer_phone, products_sold,
    total_qty_bill, total_amount_bill
  } = req.body;

  const transaction_id = generateTransactionId();
  const created_date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  if (!customer_name || !products_sold || !Array.isArray(products_sold) || products_sold.length === 0 ||
      total_qty_bill == null || total_amount_bill == null) {
    return res.status(400).json({ message: 'Missing required bill details or products array.' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    for (const productItem of products_sold) {
      const { product_id, quantity, unit, price, discount, total } = productItem;

      if (!product_id || !quantity || !unit || price == null || discount == null || total == null) {
        throw new Error(`Missing required fields for product ${product_id}.`);
      }

      const [productRows] = await connection.execute(
        'SELECT id, name, category, selling_price, quantity, threshold, unit FROM products WHERE id = ? AND action = "active"',
        [product_id]
      );

      if (productRows.length === 0) {
        throw new Error(`Product with ID ${product_id} not found or inactive.`);
      }

      const product = productRows[0];

      if (product.quantity < quantity) {
        throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.quantity}, Requested: ${quantity}`);
      }

      // const { product_id, quantity, price, discount, total } = productItem;

      await connection.execute(
        `INSERT INTO billing (
          customer_name, customer_phone, created_date,
          product_id, product_name, category, quantity, price, discount, total,
          total_qty_bill, total_amount_bill
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customer_name, customer_phone || null, created_date,
          product_id, product.name, product.category, quantity, price, discount, total,
          total_qty_bill, total_amount_bill
        ]
      );

      const newQuantity = product.quantity - quantity;
      await connection.execute('UPDATE products SET quantity = ? WHERE id = ?', [newQuantity, product_id]);

      let newStatus = 'in_stock';
      if (newQuantity === 0) newStatus = 'out_of_stock';
      else if (newQuantity <= product.threshold) newStatus = 'low_stock';

      await connection.execute('UPDATE products SET status = ? WHERE id = ?', [newStatus, product_id]);
    }

    await connection.commit();
    res.status(201).json({ message: 'Bill created successfully', transactionId: transaction_id });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Create Bill Error:', err);
    res.status(500).json({ message: err.message || 'Failed to create bill' });
  } finally {
    if (connection) connection.release();
  }
});

// GET /billing - Fetch all line items (for Admin/Salesperson to see all entries, or for internal processing)
// This endpoint might be too granular for a "bill history" display as it shows each item.
// Frontend will likely use /billing/transactions.
router.get('/', authMiddleware, async (req, res) => {
  const userRole = req.user.role; //
  // const userId = req.user.id; // (Unused for this specific route)

  let query = 'SELECT * FROM billing'; // Fetch all line items
  let queryParams = [];

  // Implement filtering by salesperson_id if you add it to billing table and link to req.user.id
  // if (userRole === 'salesperson') {
  //   query += ' WHERE salesperson_id = ?';
  //   queryParams.push(userId);
  // } else if (userRole !== 'admin') {
  //   return res.status(403).json({ message: 'Access denied to view all billing items.' });
  // }

  query += ' ORDER BY created_date DESC, transaction_id DESC, id ASC'; // Order for consistency

  try {
    const [rows] = await db.execute(query, queryParams);

    // Format dates and parse numbers for frontend
    const formattedRows = rows.map(item => ({
      ...item,
      created_date: formatDateForFrontend(item.created_date),
      price: parseFloat(item.price),
      discount: parseFloat(item.discount),
      total: parseFloat(item.total),
      total_amount_bill: parseFloat(item.total_amount_bill)
    }));

    res.status(200).json(formattedRows);
  } catch (err) {
    console.error('Fetch All Billing Items Error:', err);
    res.status(500).json({ message: 'Failed to fetch billing items', error: err.message });
  }
});

// GET /billing/transactions - Fetch unique bill transactions (Protected: Salesperson, Admin)
// This is used for the main "Bill History" list
router.get('/transactions', authMiddleware, async (req, res) => {
    const userRole = req.user.role;
    // const userId = req.user.id; //

    let query = `
        SELECT customer_name, customer_phone, created_date, order_no,
               total_qty_bill, total_amount_bill
        FROM billing
        GROUP BY customer_name, customer_phone, created_date, order_no,
                 total_qty_bill, total_amount_bill
        ORDER BY created_date DESC
    `;
    let queryParams = [];

    // Add filtering for salesperson role if you implement salesperson_id in billing table
    // For example:
    // if (userRole === 'salesperson') {
    //     query = `
    //         SELECT transaction_id, customer_name, customer_phone, created_date, order_no,
    //                total_qty_bill, total_amount_bill
    //         FROM billing
    //         WHERE salesperson_id = ?
    //         GROUP BY transaction_id, customer_name, customer_phone, created_date, order_no,
    //                  total_qty_bill, total_amount_bill
    //         ORDER BY created_date DESC
    //     `;
    //     queryParams.push(userId);
    // } else if (userRole !== 'admin') {
    //   return res.status(403).json({ message: 'Access denied to view billing transactions.' });
    // }


    try {
        const [rows] = await db.execute(query, queryParams); // Pass queryParams
        const formattedRows = rows.map(bill => ({
            ...bill,
            created_date: formatDateForFrontend(bill.created_date),
            total_amount_bill: parseFloat(bill.total_amount_bill) // Ensure total_amount_bill is a number
        }));
        res.status(200).json(formattedRows);
    } catch (err) {
        console.error('Fetch Unique Bills Error:', err);
        res.status(500).json({ message: 'Failed to fetch unique bills', error: err.message });
    }
});


// GET /billing/transaction/:transaction_id - Get details of a single transaction (all its line items)
// (Protected: Salesperson, Admin)
router.get('/transaction/:transaction_id', authMiddleware, async (req, res) => {
    const { transaction_id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    let query = 'SELECT * FROM billing WHERE transaction_id = ?';
    let queryParams = [transaction_id];

    // If salesperson, ensure they can only see their own transactions
    // if (userRole === 'salesperson') {
    //     query += ' AND salesperson_id = ?';
    //     queryParams.push(userId);
    // } else if (userRole !== 'admin') {
    //   return res.status(403).json({ message: 'Access denied to view this transaction.' });
    // }

    try {
        const [rows] = await db.execute(query, queryParams);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Transaction not found or unauthorized.' });
        }
        const formattedRows = rows.map(item => ({
            ...item,
            created_date: formatDateForFrontend(item.created_date),
            price: parseFloat(item.price),
            discount: parseFloat(item.discount),
            total: parseFloat(item.total)
        }));
        res.status(200).json(formattedRows);
    } catch (err) {
        console.error('Fetch Single Transaction Error:', err);
        res.status(500).json({ message: 'Failed to fetch transaction details', error: err.message });
    }
});

module.exports = router;
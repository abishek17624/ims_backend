// backend/routes/products.routes.js
const express = require('express');
// const router = express = require('express');
const router = express.Router();
const db = require('../config/db'); // Your database connection
const authMiddleware = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/role.middleware');

// Add a new product - PROTECTED (ADMIN only)
router.post('/add', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    console.log('Add product request received:', req.body); // Debug log

    const {
      // id, // REMOVED: Do NOT destructure 'id' for auto-increment inserts
      name,
      category,
      subcategory,
      buying_price,
      selling_price,
      quantity,
      threshold,
      expiry,
      supplier, // Supplier Name
      contact, // Supplier Contact
      supplier_id, // Supplier ID
      status // This status is for product stock status (in_stock, low_stock, out_of_stock)
    } = req.body;

    // Basic validation with specific error messages
    if (!name) {
      console.log('Validation failed - product name is missing');
      return res.status(400).json({ message: 'Product name is required' });
    }
    
    if (!category) {
      console.log('Validation failed - product category is missing');
      return res.status(400).json({ message: 'Product category is required' });
    }
    
    if (buying_price == null || buying_price <= 0) {
      console.log('Validation failed - buying price is invalid:', buying_price);
      return res.status(400).json({ message: 'Buying price must be greater than 0' });
    }
    
    if (selling_price == null || selling_price <= 0) {
      console.log('Validation failed - selling price is invalid:', selling_price);
      return res.status(400).json({ message: 'Selling price must be greater than 0' });
    }
    
    if (quantity == null || quantity < 0) {
      console.log('Validation failed - quantity is invalid:', quantity);
      return res.status(400).json({ message: 'Quantity cannot be negative' });
    }
    
    if (threshold == null || threshold < 0) {
      console.log('Validation failed - threshold is invalid:', threshold);
      return res.status(400).json({ message: 'Threshold cannot be negative' });
    }
    
    if (supplier_id == null) {
      console.log('Validation failed - supplier_id is missing or null:', supplier_id);
      return res.status(400).json({ message: 'Supplier selection is required. Please select a supplier from the dropdown.' });
    }

    console.log('Validation passed, proceeding with insert'); // Debug log

    // Generate the next available ID automatically with race condition protection
    let connection;
    let nextId;
    try {
      // Get a connection from the pool for transaction management
      connection = await db.getConnection();
      
      // Start transaction using the connection
      await connection.beginTransaction();
      
      const [maxIdResult] = await connection.execute('SELECT MAX(CAST(id AS UNSIGNED)) as maxId FROM products FOR UPDATE');
      const currentMaxId = maxIdResult[0].maxId || 0;
      nextId = currentMaxId + 1;
      console.log('Generated new product ID:', nextId); // Debug log
      
      // Insert the product within the same transaction
      const [result] = await connection.execute(
        `INSERT INTO products (
          id, name, category, subcategory, buying_price, selling_price, quantity,
          threshold, expiry, supplier, contact, supplier_id, status, action
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, // Include id placeholder
        [
          nextId, // Use the generated ID
          name,
          category,
          subcategory || null,
          buying_price,
          selling_price,
          quantity,
          threshold,
          expiry || null, // Ensure expiry is in YYYY-MM-DD format if date type in DB
          supplier || null,
          contact || null,
          supplier_id,
          status || 'in_stock', // Default status
          'active' // Default action
        ]
      );
      
      // Commit the transaction
      await connection.commit();
      
      console.log('Product inserted successfully with ID:', nextId); // Debug log
      res.status(201).json({ message: 'Product added successfully', productId: nextId });
      
    } catch (err) {
      // Rollback the transaction in case of error
      if (connection) {
        await connection.rollback();
      }
      console.error('Error during product insertion:', err);
      res.status(500).json({ message: 'Failed to add product', error: err.message });
    } finally {
      // Always release the connection back to the pool
      if (connection) {
        connection.release();
      }
    }
  } catch (err) {
    console.error('Add Product Error (outer catch):', err);
    res.status(500).json({ message: 'Failed to add product', error: err.message });
  }
});

// Update existing product - PROTECTED (ADMIN only)
router.put('/:id', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params; // ID from URL parameter (the product to update)
  const {
    name,
    category,
    subcategory,
    buying_price,
    selling_price,
    quantity,
    threshold,
    expiry,
    supplier,
    contact,
    supplier_id, // Supplier ID
    status
  } = req.body; // Data to update

  // Basic validation with specific error messages
  if (!name) {
    return res.status(400).json({ message: 'Product name is required' });
  }
  
  if (!category) {
    return res.status(400).json({ message: 'Product category is required' });
  }
  
  if (buying_price == null || buying_price <= 0) {
    return res.status(400).json({ message: 'Buying price must be greater than 0' });
  }
  
  if (selling_price == null || selling_price <= 0) {
    return res.status(400).json({ message: 'Selling price must be greater than 0' });
  }
  
  if (quantity == null || quantity < 0) {
    return res.status(400).json({ message: 'Quantity cannot be negative' });
  }
  
  if (threshold == null || threshold < 0) {
    return res.status(400).json({ message: 'Threshold cannot be negative' });
  }
  
  if (supplier_id == null) {
    return res.status(400).json({ message: 'Supplier selection is required. Please select a supplier from the dropdown.' });
  }

  try {
    const [result] = await db.execute(
      `UPDATE products SET
        name = ?, category = ?, subcategory = ?, buying_price = ?, selling_price = ?,
        quantity = ?, threshold = ?, expiry = ?, supplier = ?, contact = ?, supplier_id = ?, status = ?
        WHERE id = ? AND action = 'active'`, // Only update active products
      [
        name,
        category,
        subcategory || null,
        buying_price,
        selling_price,
        quantity,
        threshold,
        expiry || null, // Ensure expiry is in YYYY-MM-DD format if date type in DB
        supplier || null,
        contact || null,
        supplier_id, // Update supplier_id in the query
        status || 'in_stock',
        id // Use the ID from req.params to identify the product to update
      ]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Product not found or not active.' });
    }

    res.status(200).json({ message: 'Product updated successfully' });
  } catch (err) {
    console.error('Update Product Error:', err);
    res.status(500).json({ message: 'Failed to update product', error: err.message });
  }
});

// Soft delete (set action to inactive) - PROTECTED (ADMIN only)
router.delete('/:id', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.execute(`UPDATE products SET action = 'inactive' WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Product not found or already inactive.' });
    }

    res.status(200).json({ message: 'Product deactivated successfully' });
  } catch (err) {
    console.error('Soft Delete Product Error:', err);
    res.status(500).json({ message: 'Failed to deactivate product', error: err.message });
  }
});

// Activate product (set action to active) - PROTECTED (ADMIN only)
router.put('/activate/:id', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.execute(`UPDATE products SET action = 'active' WHERE id = ? AND action = 'inactive'`, [id]);

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Product not found or already active.' });
    }

    res.status(200).json({ message: 'Product activated successfully' });
  } catch (err) {
    console.error('Activate Product Error:', err);
    res.status(500).json({ message: 'Failed to activate product', error: err.message });
  }
});

// Get all products (active and inactive) for Admin management - PROTECTED (ADMIN only)
router.get('/all', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    // Select all fields including supplier_id
    const [rows] = await db.execute(`SELECT * FROM products ORDER BY name ASC`);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Fetch All Products Error:', err);
    res.status(500).json({ message: 'Failed to fetch all products', error: err.message });
  }
});

// Get all active products (for general use, e.g., sales, customer views) - Can be public or protected
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT * FROM products WHERE action = 'active' ORDER BY name ASC`);
    
    // Transform database field names to match frontend interface
    const transformedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      subcategory: row.subcategory,
      buyingPrice: parseFloat(row.buying_price) || 0,
      sellingPrice: parseFloat(row.selling_price) || 0,
      quantity: parseInt(row.quantity) || 0,
      unit: row.unit || 'Units',
      threshold: parseInt(row.threshold) || 0,
      expiry: row.expiry,
      supplier: row.supplier,
      contact: row.contact,
      supplier_id: row.supplier_id,
      status: row.status,
      action: row.action,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    
    res.status(200).json(transformedRows);
  } catch (err) {
    console.error('Fetch Active Products Error:', err);
    res.status(500).json({ message: 'Failed to fetch active products', error: err.message });
    }
});

// Get all categories - PROTECTED
router.get('/category', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching categories from database...');
    // Get unique categories from products table where action is active
    const [rows] = await db.execute(`SELECT DISTINCT category as name FROM products WHERE action = 'active' AND category IS NOT NULL ORDER BY category ASC`);
    console.log('Categories fetched:', rows);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Fetch Categories Error:', err);
    res.status(500).json({ message: 'Failed to fetch categories', error: err.message });
  }
});

// Get products by category - PROTECTED
router.get('/category/:category', authMiddleware, async (req, res) => {
  try {
    const { category } = req.params;
    console.log('Fetching products for category:', category);
    
    const [rows] = await db.execute(
      `SELECT * FROM products WHERE category = ? AND action = 'active' ORDER BY name ASC`,
      [category]
    );
    
    // Transform database field names to match frontend interface
    const transformedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      subcategory: row.subcategory,
      buyingPrice: parseFloat(row.buying_price) || 0,
      sellingPrice: parseFloat(row.selling_price) || 0,
      quantity: parseInt(row.quantity) || 0,
      unit: row.unit || 'Units',
      threshold: parseInt(row.threshold) || 0,
      expiry: row.expiry,
      supplier: row.supplier,
      contact: row.contact,
      supplier_id: row.supplier_id,
      status: row.status,
      action: row.action,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    
    console.log(`Found ${transformedRows.length} products for category ${category}`);
    res.status(200).json(transformedRows);
  } catch (err) {
    console.error('Fetch Products by Category Error:', err);
    res.status(500).json({ message: 'Failed to fetch products by category', error: err.message });
  }
});

module.exports = router;
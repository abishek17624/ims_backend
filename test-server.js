const express = require('express');
const cors = require('cors');
const db = require('./config/db');

// Simple test server to check if everything is working
const app = express();

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));

app.use(express.json());

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is running!', 
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5000
  });
});

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    const [tables] = await db.execute('SHOW TABLES');
    const [invoiceCount] = await db.execute('SELECT COUNT(*) as count FROM invoice');
    const [supplierCount] = await db.execute('SELECT COUNT(*) as count FROM supplier');
    
    res.json({
      message: 'Database connection successful',
      tables: tables.length,
      invoices: invoiceCount[0].count,
      suppliers: supplierCount[0].count
    });
  } catch (err) {
    res.status(500).json({
      message: 'Database connection failed',
      error: err.message
    });
  }
});

// Test invoice endpoint without authentication
app.get('/test-invoices', async (req, res) => {
  try {
    const [invoices] = await db.execute(`
      SELECT i.invoice_id, i.order_id, i.supplier_id, i.amount, i.status,
             s.user_id, s.name as supplier_name, s.email as supplier_email
      FROM invoice i
      JOIN supplier s ON i.supplier_id = s.id
      LIMIT 10
    `);
    
    res.json({
      message: 'Invoices fetched successfully',
      count: invoices.length,
      invoices: invoices
    });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch invoices',
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`🔍 Test endpoints:`);
  console.log(`   http://localhost:${PORT}/test`);
  console.log(`   http://localhost:${PORT}/test-db`);
  console.log(`   http://localhost:${PORT}/test-invoices`);
});

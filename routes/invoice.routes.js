// backend/routes/invoice.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Your database connection
// const { v4: uuidv4 } = require('uuid'); // For generating UUIDs for invoice_id
const authMiddleware = require('../middleware/auth.middleware'); //
const authorizeRoles = require('../middleware/role.middleware'); //

// Helper to format dates for frontend (YYYY-MM-DD)
function formatDateForFrontend(date) {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// POST /invoice/generate - Generate an invoice for a confirmed order (Protected: Admin only)
router.post('/generate', authMiddleware, authorizeRoles('supplier'), async (req, res) => {
    const { order_id } = req.body;

    if (!order_id) {
        return res.status(400).json({ message: 'Order ID is required to generate an invoice.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Check if order exists and is 'Confirmed'
        const [orderRows] = await connection.execute(
            `SELECT o.order_id, o.value, o.supplier_id, o.delivery_date,
                    p.name AS product_name, p.category, o.quantity, p.selling_price AS unit_price, p.id AS product_code
             FROM orders o
             JOIN products p ON o.product_id = p.id
             WHERE o.order_id = ? AND o.status IN ('Confirmed', 'Shipped', 'Delivered')`,
            [order_id]
        );

        if (orderRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Order not found or not in "Confirmed" status to generate invoice.' });
        }

        const order = orderRows[0];

        // 2. Check if invoice already exists
        const [existingInvoiceRows] = await connection.execute(
            'SELECT invoice_id FROM invoice WHERE order_id = ?',
            [order_id]
        );
        if (existingInvoiceRows.length > 0) {
            await connection.rollback();
            return res.status(409).json({ message: 'Invoice already exists for this order.' });
        }

        // 3. Prepare invoice details
        const invoice_date = new Date().toISOString().split('T')[0];
        const due_date = new Date(order.delivery_date);
        due_date.setDate(due_date.getDate() + 15);

        const amount = order.value;

        // 4. Insert invoice (invoice_id will be auto-generated)
        const [result] = await connection.execute(
            `INSERT INTO invoice (
                order_id, supplier_id, invoice_date, due_date, amount, status
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [order_id, order.supplier_id, invoice_date, formatDateForFrontend(due_date), amount, 'pending']
        );

        await connection.commit();

        const insertedInvoiceId = result.insertId; // Get the auto-incremented invoice_id
        res.status(201).json({ message: 'Invoice generated successfully', invoiceId: insertedInvoiceId });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Generate Invoice Error:', err);
        res.status(500).json({ message: 'Failed to generate invoice', error: err.message });
    } finally {
        if (connection) connection.release();
    }
});


// GET /invoice - Fetch invoices (Protected: Admin gets all, Supplier gets their own)
// router.get('/', authMiddleware, async (req, res) => {
//     const userRole = req.user.role; //
//     const userId = req.user.id; //

//     let query = `
//         SELECT i.invoice_id, i.order_id, i.supplier_id, i.invoice_date, i.due_date, i.amount, i.status AS invoice_status,
//                o.product_id, o.product_name, o.quantity, o.unit, o.value AS order_value, o.category AS product_category,
//                o.order_date, o.delivery_date, o.delivery_status, o.status AS order_status,
//                s.name AS supplier_name, s.email AS supplier_email, s.contact AS supplier_phone
//         FROM invoice i
//         JOIN orders o ON i.order_id = o.order_id
//         JOIN supplier s ON i.supplier_id = s.id
//     `;
//     let queryParams = [];

//     if (userRole === 'supplier') {
//         query += ' WHERE i.supplier_id = ?';
//         queryParams.push(userId);
//     } else if (userRole !== 'admin') {
//         return res.status(403).json({ message: 'Access denied: Only Admins or Suppliers can view invoices.' });
//     }

//     query += ' ORDER BY i.invoice_date DESC, i.invoice_id DESC';

//     try {
//         const [rows] = await db.execute(query, queryParams);

//         const formattedInvoices = rows.map(inv => ({
//             invoice_id: inv.invoice_id,
//             order_id: inv.order_id,
//             supplier_id: inv.supplier_id,
//             invoiceDate: formatDateForFrontend(inv.invoice_date),
//             dueDate: formatDateForFrontend(inv.due_date),
//             amount: parseFloat(inv.amount),
//             invoiceStatus: inv.invoice_status,
//             createdAt: inv.created_at, // Use as ISO string
//             updatedAt: inv.updated_at, // Use as ISO string

//             // Order Details (from join)
//             product_id: inv.product_id, // Product ID from orders table
//             productName: inv.product_name,
//             quantity: inv.quantity,
//             unit: inv.unit,
//             orderValue: parseFloat(inv.order_value), // Value from orders table
//             productCategory: inv.product_category,
//             orderDate: formatDateForFrontend(inv.order_date),
//             deliveryDate: formatDateForFrontend(inv.delivery_date),
//             deliveryStatus: inv.delivery_status,
//             orderStatus: inv.order_status,

//             // Supplier Details (from join)
//             supplierName: inv.supplier_name,
//             supplierEmail: inv.supplier_email,
//             supplierPhone: inv.supplier_phone,
//         }));

//         res.status(200).json(formattedInvoices);
//     } catch (err) {
//         console.error('Fetch Invoices Error:', err);
//         res.status(500).json({ message: 'Failed to fetch invoices', error: err.message });
//     }
// });


router.get('/', authMiddleware, async (req, res) => {
    const userRole = req.user.role;
    const userId = req.user.id; // Use actual user ID from JWT token

    console.log("Invoice Request - User Role:", userRole, "User ID:", userId);

    let query = `
        SELECT i.invoice_id, i.order_id, i.supplier_id, i.invoice_date, i.due_date, i.amount, i.status AS invoice_status,
               o.product_id, o.product_name, o.quantity, o.unit, o.value AS order_value, o.category AS product_category,
               o.order_date, o.delivery_date, o.delivery_status, o.status AS order_status,
               s.name AS supplier_name, s.email AS supplier_email, s.contact AS supplier_phone
        FROM invoice i
        JOIN orders o ON i.order_id = o.order_id
        JOIN supplier s ON i.supplier_id = s.id
    `;
    let queryParams = [];

    if (userRole === 'supplier') {
        // Filter by supplier's user_id (not supplier.id, but supplier.user_id)
        query += ' WHERE s.user_id = ?';
        queryParams.push(userId);
        console.log("Supplier user - filtering invoices by user_id:", userId);
    } else if (userRole !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Only Admins or Suppliers can view invoices.' });
    }

    query += ' ORDER BY i.invoice_date DESC, i.invoice_id DESC';

    console.log("Executing query:", query);
    console.log("Query parameters:", queryParams);

    try {
        const [rows] = await db.execute(query, queryParams);
        console.log("Query result - Number of invoices found:", rows.length);

        const formattedInvoices = rows.map(inv => ({
            invoice_id: inv.invoice_id,
            order_id: inv.order_id,
            supplier_id: inv.supplier_id,
            invoiceDate: formatDateForFrontend(inv.invoice_date),
            dueDate: formatDateForFrontend(inv.due_date),
            amount: parseFloat(inv.amount),
            invoiceStatus: inv.invoice_status,
            createdAt: inv.created_at,
            updatedAt: inv.updated_at,

            product_id: inv.product_id,
            productName: inv.product_name,
            quantity: inv.quantity,
            unit: inv.unit,
            orderValue: parseFloat(inv.order_value),
            productCategory: inv.product_category,
            orderDate: formatDateForFrontend(inv.order_date),
            deliveryDate: formatDateForFrontend(inv.delivery_date),
            deliveryStatus: inv.delivery_status,
            orderStatus: inv.order_status,

            supplierName: inv.supplier_name,
            supplierEmail: inv.supplier_email,
            supplierPhone: inv.supplier_phone,
        }));

        console.log("Formatted invoices to send:", formattedInvoices.length);
        res.status(200).json(formattedInvoices);
    } catch (err) {
        console.error('Fetch Invoices Error:', err);
        res.status(500).json({ message: 'Failed to fetch invoices', error: err.message });
    }
});

// PUT /invoice/:id - Update invoice status (Protected: Supplier/Admin only)
router.put('/:id', authMiddleware, async (req, res) => {
    const invoiceId = req.params.id;
    const { status } = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;

    console.log(`Invoice Update Request - Invoice ID: ${invoiceId}, New Status: ${status}, User Role: ${userRole}, User ID: ${userId}`);

    if (!status) {
        return res.status(400).json({ message: 'Status is required to update invoice.' });
    }

    // Validate status
    const validStatuses = ['pending', 'paid', 'overdue', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Valid statuses are: ' + validStatuses.join(', ') });
    }

    try {
        // First, check if the invoice exists and if the user has permission to update it
        let checkQuery = `
            SELECT i.invoice_id, i.supplier_id, i.status AS current_status,
                   s.user_id, s.name AS supplier_name
            FROM invoice i
            JOIN supplier s ON i.supplier_id = s.id
            WHERE i.invoice_id = ?
        `;
        
        const [invoiceRows] = await db.execute(checkQuery, [invoiceId]);

        if (invoiceRows.length === 0) {
            return res.status(404).json({ message: 'Invoice not found.' });
        }

        const invoice = invoiceRows[0];

        // Check permissions
        if (userRole === 'supplier') {
            // Supplier can only update their own invoices
            if (invoice.user_id !== userId) {
                return res.status(403).json({ 
                    message: 'Access denied: You can only update your own invoices.',
                    debug: {
                        invoiceUserId: invoice.user_id,
                        currentUserId: userId,
                        supplierName: invoice.supplier_name
                    }
                });
            }
        } else if (userRole !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Only Admins or Suppliers can update invoices.' });
        }

        // Update the invoice status
        const updateQuery = `
            UPDATE invoice 
            SET status = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE invoice_id = ?
        `;

        const [updateResult] = await db.execute(updateQuery, [status, invoiceId]);

        if (updateResult.affectedRows === 0) {
            return res.status(500).json({ message: 'Failed to update invoice status.' });
        }

        console.log(`Invoice ${invoiceId} status updated from '${invoice.current_status}' to '${status}' by user ${userId} (${userRole})`);

        // Return success response
        res.status(200).json({
            message: 'Invoice status updated successfully',
            invoice_id: invoiceId,
            old_status: invoice.current_status,
            new_status: status,
            updated_by: userId,
            updated_at: new Date().toISOString()
        });

    } catch (err) {
        console.error('Update Invoice Status Error:', err);
        res.status(500).json({ 
            message: 'Failed to update invoice status', 
            error: err.message,
            debug: {
                invoiceId: invoiceId,
                status: status,
                userId: userId,
                userRole: userRole
            }
        });
    }
});

module.exports = router;
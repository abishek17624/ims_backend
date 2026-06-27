/**
 * controllers/supplier.controller.js
 * Handles CRUD operations for supplier profiles.
 * Routes: /api/supplier/...
 */

const Supplier = require('../models/Supplier');
const User     = require('../models/User');
const bcrypt   = require('bcrypt');

// ── GET /api/supplier/all ────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const list = await Supplier.findAll();
    res.json({ success: true, data: list });
  } catch (err) {
    console.error('getAll supplier error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET /api/supplier/active ─────────────────────────────────────────────────
exports.getActive = async (req, res) => {
  try {
    const list = await Supplier.findActive();
    res.json({ success: true, data: list });
  } catch (err) {
    console.error('getActive supplier error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET /api/supplier/:id ────────────────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, data: supplier });
  } catch (err) {
    console.error('getById supplier error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET /api/supplier/me ─────────────────────────────────────────────────────
// Returns the supplier profile for the currently authenticated user
exports.getMe = async (req, res) => {
  try {
    const supplier = await Supplier.findByUserId(req.user.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier profile not found' });
    res.json({ success: true, data: supplier });
  } catch (err) {
    console.error('getMe supplier error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── POST /api/supplier/create ────────────────────────────────────────────────
exports.create = async (req, res) => {
  const { name, product, category, price, contact, email, returnPolicy, password, status, comments } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'name, email and password are required' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create user account first
    const { insertId: userId } = await User.create({ email, password: hashedPassword, role: 'supplier' });
    // Create supplier profile
    const { insertId: supplierId } = await Supplier.create({
      name,
      product: product || null,
      category: category || null,
      price: price || null,
      contact: contact || null,
      email,
      returnPolicy: returnPolicy || 'no',
      password: hashedPassword,
      status: status || 'active',
      comments: comments || null,
      user_id: userId,
    });
    res.status(201).json({ success: true, message: 'Supplier created', supplier_id: supplierId, user_id: userId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    console.error('create supplier error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── PUT /api/supplier/:id ────────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const affected = await Supplier.update(req.params.id, req.body);
    if (!affected) return res.status(404).json({ success: false, message: 'Supplier not found or nothing to update' });
    res.json({ success: true, message: 'Supplier updated' });
  } catch (err) {
    console.error('update supplier error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── PATCH /api/supplier/:id/status ──────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be active or inactive' });
  }
  try {
    const affected = await Supplier.update(req.params.id, { status });
    if (!affected) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, message: `Supplier status set to ${status}` });
  } catch (err) {
    console.error('updateStatus supplier error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── DELETE /api/supplier/:id ─────────────────────────────────────────────────
exports.delete = async (req, res) => {
  try {
    const affected = await Supplier.delete(req.params.id);
    if (!affected) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (err) {
    console.error('delete supplier error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

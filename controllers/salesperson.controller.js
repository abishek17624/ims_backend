/**
 * controllers/salesperson.controller.js
 * Handles CRUD operations for salesperson profiles.
 * Routes: /api/salesperson/...
 */

const Salesperson = require('../models/Salesperson');
const User        = require('../models/User');
const bcrypt      = require('bcrypt');

// ── GET /api/salesperson/all ─────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const list = await Salesperson.findAll();
    res.json({ success: true, data: list });
  } catch (err) {
    console.error('getAll salesperson error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET /api/salesperson/:id ─────────────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const sp = await Salesperson.findById(req.params.id);
    if (!sp) return res.status(404).json({ success: false, message: 'Salesperson not found' });
    res.json({ success: true, data: sp });
  } catch (err) {
    console.error('getById salesperson error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET /api/salesperson/me ──────────────────────────────────────────────────
// Returns the salesperson profile for the currently authenticated user
exports.getMe = async (req, res) => {
  try {
    const sp = await Salesperson.findByUserId(req.user.id);
    if (!sp) return res.status(404).json({ success: false, message: 'Salesperson profile not found' });
    res.json({ success: true, data: sp });
  } catch (err) {
    console.error('getMe salesperson error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── POST /api/salesperson/create ─────────────────────────────────────────────
exports.create = async (req, res) => {
  const { name, contact, email, password, sales_target } = req.body;
  if (!name || !contact || !email || !password) {
    return res.status(400).json({ success: false, message: 'name, contact, email and password are required' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create user account first
    const { insertId: userId } = await User.create({ email, password: hashedPassword, role: 'salesperson' });
    // Create salesperson profile
    const { insertId: spId } = await Salesperson.create({
      name,
      contact,
      email,
      password: hashedPassword,
      sales_target: sales_target || null,
      current_sales: 0,
      performance_rating: 0,
      user_id: userId,
    });
    res.status(201).json({ success: true, message: 'Salesperson created', salesperson_id: spId, user_id: userId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    console.error('create salesperson error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── PUT /api/salesperson/:id ─────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const affected = await Salesperson.update(req.params.id, req.body);
    if (!affected) return res.status(404).json({ success: false, message: 'Salesperson not found or nothing to update' });
    res.json({ success: true, message: 'Salesperson updated' });
  } catch (err) {
    console.error('update salesperson error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── DELETE /api/salesperson/:id ──────────────────────────────────────────────
exports.delete = async (req, res) => {
  try {
    const affected = await Salesperson.delete(req.params.id);
    if (!affected) return res.status(404).json({ success: false, message: 'Salesperson not found' });
    res.json({ success: true, message: 'Salesperson deleted' });
  } catch (err) {
    console.error('delete salesperson error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── PUT /api/salesperson/:id/performance ─────────────────────────────────────
// Update sales performance metrics
exports.updatePerformance = async (req, res) => {
  const { current_sales, performance_rating } = req.body;
  try {
    const affected = await Salesperson.update(req.params.id, { current_sales, performance_rating });
    if (!affected) return res.status(404).json({ success: false, message: 'Salesperson not found' });
    res.json({ success: true, message: 'Performance updated' });
  } catch (err) {
    console.error('updatePerformance salesperson error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

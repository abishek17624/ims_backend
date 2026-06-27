/**
 * controllers/admin.controller.js
 * Handles CRUD operations for the admin profile.
 * Routes: /api/admin/...
 */

const Admin  = require('../models/Admin');
const User   = require('../models/User');
const bcrypt = require('bcrypt');

// ── GET /api/admin/all ───────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const admins = await Admin.findAll();
    res.json({ success: true, data: admins });
  } catch (err) {
    console.error('getAll admins error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET /api/admin/:id ───────────────────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, data: admin });
  } catch (err) {
    console.error('getById admin error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET /api/admin/me ────────────────────────────────────────────────────────
// Returns the admin profile for the currently authenticated user
exports.getMe = async (req, res) => {
  try {
    const admin = await Admin.findByUserId(req.user.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin profile not found' });
    res.json({ success: true, data: admin });
  } catch (err) {
    console.error('getMe admin error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── POST /api/admin/create ───────────────────────────────────────────────────
// NOTE: also handled inline in admin.routes.js — this is the controller version
exports.create = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'name, email and password are required' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { insertId: userId } = await User.create({ email, password: hashedPassword, role: 'admin' });
    const { insertId: adminId } = await Admin.create({ name, email, user_id: userId });
    res.status(201).json({ success: true, message: 'Admin created', admin_id: adminId, user_id: userId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    console.error('create admin error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── PUT /api/admin/:id ───────────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const affected = await Admin.update(req.params.id, req.body);
    if (!affected) return res.status(404).json({ success: false, message: 'Admin not found or nothing to update' });
    res.json({ success: true, message: 'Admin updated' });
  } catch (err) {
    console.error('update admin error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── DELETE /api/admin/:id ────────────────────────────────────────────────────
exports.delete = async (req, res) => {
  try {
    const affected = await Admin.delete(req.params.id);
    if (!affected) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, message: 'Admin deleted' });
  } catch (err) {
    console.error('delete admin error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

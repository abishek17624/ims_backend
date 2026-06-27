// routes/contentfea.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // promise-based pool

// POST route to insert/update content features
router.post('/content-features', async (req, res) => {
  const { title, subtitle } = req.body;

  const sql = `
    INSERT INTO content_features (id, title, subtitle) 
    VALUES (1, ?, ?)
    ON DUPLICATE KEY UPDATE
      title = VALUES(title),
      subtitle = VALUES(subtitle)
  `;

  try {
    const [result] = await db.query(sql, [title, subtitle]);
    res.status(200).json({ message: 'Content features saved successfully.', insertId: result.insertId });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ message: 'Database error', error: err });
  }
});

// GET route to fetch content features by id = 1
router.get('/content-features', async (req, res) => {
  const sql = `SELECT * FROM content_features WHERE id = 1`;

  try {
    const [rows] = await db.query(sql);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No content found' });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ message: 'Database error', error: err });
  }
});

module.exports = router;

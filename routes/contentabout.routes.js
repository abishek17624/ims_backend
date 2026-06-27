const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db'); // Assuming promise-based mysql2

// Ensure uploads/ directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Setup multer for image upload
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

/* ─────────── POST /api/content-about ─────────── */
router.post('/content-about', upload.single('image'), async (req, res, next) => {
  try {
    const { title, description } = req.body;

    const [existingRows] = await db.query('SELECT * FROM content_about WHERE id = 1');
    const hasExisting = existingRows.length > 0;
    const existing = hasExisting ? existingRows[0] : {};

    // Delete old image if new one is uploaded
    if (req.file && existing.image) {
      const oldPath = path.join(uploadDir, existing.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Use fallback values if fields are not sent
    const updatedFields = {
      title: title ?? existing.title,
      description: description ?? existing.description,
      image: req.file ? req.file.filename : existing.image
    };

    const sql = `
      INSERT INTO content_about (id, title, description, image)
      VALUES (1, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        description = VALUES(description),
        image = VALUES(image)
    `;
    const params = [
      updatedFields.title,
      updatedFields.description,
      updatedFields.image
    ];

    await db.query(sql, params);

    console.log('✅ Content about updated:', updatedFields);
    return res.status(200).json({ message: 'Content about saved successfully.' });
  } catch (err) {
    console.error('❌ Error saving content_about:', err);
    next(err);
  }
});

/* ─────────── GET /api/content-about ─────────── */
router.get('/content-about', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM content_about WHERE id = 1');

    if (!rows.length) {
      return res.status(404).json({ message: 'No about content found.' });
    }

    const about = rows[0];
    if (about.image) {
      about.image_url = `http://localhost:3000/uploads/${about.image}`;
    }

    return res.status(200).json(about);
  } catch (err) {
    console.error('❌ Error fetching content_about:', err);
    next(err);
  }
});

module.exports = router;

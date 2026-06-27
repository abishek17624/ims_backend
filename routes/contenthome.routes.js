const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db'); // promise-based DB pool

// ───── Ensure uploads/ dir exists ─────
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ───── Multer config ─────
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

/* ------------------- POST /api/content-home ------------------- */
router.post('/content-home', upload.single('bg_image'), async (req, res, next) => {
  try {
    const { title, subtitle, btn1_text, btn2_text } = req.body;

    const [existingRows] = await db.query('SELECT * FROM content_home WHERE id = 1');
    const hasExisting = existingRows.length > 0;
    const existing = hasExisting ? existingRows[0] : {};

    // 🧹 Delete old image if new one uploaded
    if (req.file && existing.bg_image) {
      const oldPath = path.join(uploadDir, existing.bg_image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // 🤖 Preserve old fields if not sent
    const updatedFields = {
      title: title ?? existing.title,
      subtitle: subtitle ?? existing.subtitle,
      btn1_text: btn1_text ?? existing.btn1_text,
      btn2_text: btn2_text ?? existing.btn2_text,
      bg_image: req.file ? req.file.filename : existing.bg_image
    };

    const sql = `
      INSERT INTO content_home (id, title, subtitle, btn1_text, btn2_text, bg_image)
      VALUES (1, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        subtitle = VALUES(subtitle),
        btn1_text = VALUES(btn1_text),
        btn2_text = VALUES(btn2_text),
        bg_image = VALUES(bg_image)
    `;
    const params = [
      updatedFields.title,
      updatedFields.subtitle,
      updatedFields.btn1_text,
      updatedFields.btn2_text,
      updatedFields.bg_image
    ];

    await db.query(sql, params);

    console.log('✅ Content home updated:', updatedFields);
    return res.status(200).json({ message: 'Content home saved successfully.' });
  } catch (err) {
    console.error('❌ Error saving content_home:', err);
    return next(err);
  }
});

/* ------------------- GET /api/content-home ------------------- */
router.get('/content-home', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM content_home WHERE id = 1');
    if (!rows.length) return res.status(404).json({ message: 'No content found.' });

    const content = rows[0];
    if (content.bg_image) {
      content.bg_image_url = `http://localhost:3000/uploads/${content.bg_image}`;
    }
    return res.status(200).json(content);
  } catch (err) {
    console.error('Fetch error:', err);
    return next(err);
  }
});

module.exports = router;

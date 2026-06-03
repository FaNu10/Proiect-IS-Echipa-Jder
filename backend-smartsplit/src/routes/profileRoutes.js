const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const { protect } = require('../middleware/authMiddleware');
const pool    = require('../db');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
    filename:    (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        cb(null, /jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase()));
    },
});

// GET own profile
router.get('/', protect, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, bio, "avatarUrl", role, "createdAt" FROM "User" WHERE id = $1`,
            [req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found.' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
});

// PUT update profile
router.put('/', protect, upload.single('avatar'), async (req, res) => {
    try {
        const { name, bio } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'BAD_REQUEST', message: 'Display name is required.' });
        }
        if (bio && bio.length > 500) {
            return res.status(400).json({ error: 'BAD_REQUEST', message: 'Bio must be 500 characters or less.' });
        }

        const avatarUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

        const query = avatarUrl
            ? `UPDATE "User" SET name = $1, bio = $2, "avatarUrl" = $3 WHERE id = $4
               RETURNING id, name, email, bio, "avatarUrl"`
            : `UPDATE "User" SET name = $1, bio = $2 WHERE id = $3
               RETURNING id, name, email, bio, "avatarUrl"`;

        const params = avatarUrl
            ? [name.trim(), bio || null, avatarUrl, req.user.id]
            : [name.trim(), bio || null, req.user.id];

        const result = await pool.query(query, params);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
});

// DELETE own account
router.delete('/', protect, async (req, res) => {
    try {
        await pool.query(`DELETE FROM "User" WHERE id = $1`, [req.user.id]);
        res.json({ message: 'Account deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
});

module.exports = router;

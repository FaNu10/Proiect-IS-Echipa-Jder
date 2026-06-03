const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const pool = require('../db');
const { notifyAdmins } = require('../utils/notifyAdmins');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const valid = allowed.test(path.extname(file.originalname).toLowerCase());
        cb(null, valid);
    },
});

// GET all products, optionally filtered by ?seller=userId (public)
router.get('/', async (req, res) => {
    try {
        const { seller } = req.query;
        const result = seller
            // Seller page: show ALL products (including sold), available first then sold
            ? await pool.query(
                `SELECT p.*, u.name as "sellerName"
                 FROM "Product" p
                 JOIN "User" u ON p."sellerId" = u.id
                 WHERE p."sellerId" = $1
                 ORDER BY p.sold ASC, p."createdAt" DESC`,
                [seller]
              )
            // Home page: only show available (not sold) products
            : await pool.query(
                `SELECT p.*, u.name as "sellerName"
                 FROM "Product" p
                 JOIN "User" u ON p."sellerId" = u.id
                 WHERE p.sold = false
                 ORDER BY p."createdAt" DESC`
              );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
});

// GET single product by id (public)
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.*, u.name as "sellerName", u.bio as "sellerBio", u."avatarUrl" as "sellerAvatarUrl"
             FROM "Product" p
             JOIN "User" u ON p."sellerId" = u.id
             WHERE p.id = $1`,
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found.' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
});

// POST create product (auth required)
router.post('/', protect, upload.array('images', 10), async (req, res) => {
    try {
        const { title, category, brand, price, size, condition, location, description } = req.body;
        const isDonation = req.body.isDonation === 'true';

        if (!title || !category || !brand || !size || !condition || !location || !description) {
            return res.status(400).json({ error: 'BAD_REQUEST', message: 'All fields are required.' });
        }
        if (!isDonation && !price) {
            return res.status(400).json({ error: 'BAD_REQUEST', message: 'Price is required for sale items.' });
        }

        const imageUrls  = (req.files || []).map(f => `/uploads/${f.filename}`);
        const imageUrl   = imageUrls[0] || null;
        const finalPrice = isDonation ? 0 : parseFloat(price);

        const result = await pool.query(
            `INSERT INTO "Product" (id, title, category, brand, price, size, condition, location, description, "imageUrl", images, "sellerId", "isDonation", "createdAt")
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
             RETURNING *`,
            [title, category, brand, finalPrice, size, condition, location, description, imageUrl, JSON.stringify(imageUrls), req.user.id, isDonation]
        );

        const newProduct = result.rows[0];
        // Notify all admins about the new listing (fire-and-forget)
        notifyAdmins('NEW_PRODUCT', req.user.id, newProduct.id);

        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
});

// PUT update product (auth required, only owner)
router.put('/:id', protect, upload.array('images', 10), async (req, res) => {
    try {
        const { title, category, brand, price, size, condition, location, description } = req.body;
        const isDonation = req.body.isDonation === 'true';

        if (!title || !category || !brand || !size || !condition || !location || !description) {
            return res.status(400).json({ error: 'BAD_REQUEST', message: 'All fields are required.' });
        }
        if (!isDonation && !price) {
            return res.status(400).json({ error: 'BAD_REQUEST', message: 'Price is required for sale items.' });
        }

        // Check ownership
        const check = await pool.query(`SELECT "sellerId" FROM "Product" WHERE id = $1`, [req.params.id]);
        if (check.rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found.' });
        if (check.rows[0].sellerId !== req.user.id) return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your product.' });

        const newFiles   = (req.files || []).map(f => `/uploads/${f.filename}`);
        const keepImages = req.body.keepImages ? JSON.parse(req.body.keepImages) : null;
        const allImages  = keepImages !== null ? [...keepImages, ...newFiles] : newFiles;
        const hasChanges = keepImages !== null || newFiles.length > 0;
        const finalPrice = isDonation ? 0 : parseFloat(price);

        const query = hasChanges
            ? `UPDATE "Product" SET title=$1, category=$2, brand=$3, price=$4, size=$5, condition=$6, location=$7, description=$8, "imageUrl"=$9, images=$10, "isDonation"=$11 WHERE id=$12 RETURNING *`
            : `UPDATE "Product" SET title=$1, category=$2, brand=$3, price=$4, size=$5, condition=$6, location=$7, description=$8, "isDonation"=$9 WHERE id=$10 RETURNING *`;

        const params = hasChanges
            ? [title, category, brand, finalPrice, size, condition, location, description, allImages[0] || null, JSON.stringify(allImages), isDonation, req.params.id]
            : [title, category, brand, finalPrice, size, condition, location, description, isDonation, req.params.id];

        const result = await pool.query(query, params);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
});

// DELETE product (auth required, only owner)
router.delete('/:id', protect, async (req, res) => {
    try {
        const check = await pool.query(`SELECT "sellerId" FROM "Product" WHERE id = $1`, [req.params.id]);
        if (check.rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found.' });
        if (check.rows[0].sellerId !== req.user.id) return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your product.' });

        await pool.query(`DELETE FROM "Product" WHERE id = $1`, [req.params.id]);
        res.json({ message: 'Product deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
});

module.exports = router;

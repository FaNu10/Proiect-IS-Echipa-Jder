const express  = require('express');
const router   = express.Router();
const pool     = require('../db');
const { protect }  = require('../middleware/authMiddleware');
const { isAdmin }  = require('../middleware/adminMiddleware');

// All admin routes require auth + admin role
router.use(protect, isAdmin);

// ── GET all users ─────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, "createdAt" FROM "User" ORDER BY "createdAt" DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// ── DELETE a user ─────────────────────────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'You cannot delete your own account from the admin panel.' });
  }
  try {
    const result = await pool.query(
      `DELETE FROM "User" WHERE id = $1 RETURNING id`, [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found.' });
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// ── PUT toggle user role ──────────────────────────────────────────────────────
router.put('/users/:id/role', async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'You cannot change your own role.' });
  }
  try {
    const current = await pool.query(`SELECT role FROM "User" WHERE id = $1`, [req.params.id]);
    if (current.rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found.' });

    const newRole = current.rows[0].role === 'admin' ? 'member' : 'admin';
    const result  = await pool.query(
      `UPDATE "User" SET role = $1 WHERE id = $2 RETURNING id, name, email, role`,
      [newRole, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// ── GET all products ──────────────────────────────────────────────────────────
router.get('/products', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.title, p.price, p.sold, p."createdAt",
              u.name AS "sellerName", u.id AS "sellerId"
       FROM "Product" p
       LEFT JOIN "User" u ON u.id = p."sellerId"
       ORDER BY p."createdAt" DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// ── DELETE a product ──────────────────────────────────────────────────────────
router.delete('/products/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM "Product" WHERE id = $1 RETURNING id`, [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found.' });
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

module.exports = router;

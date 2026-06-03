const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET all users (public) — returns safe fields only, no passwords
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, bio, "avatarUrl", "createdAt" FROM "User" ORDER BY "createdAt"`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
});

// GET admins (public) — returns name + email of all admins
// NOTE: must be declared BEFORE '/:id' so "admins" isn't captured as an id param
router.get('/admins', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT name, email FROM "User" WHERE role = 'admin' ORDER BY name`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
});

// GET single user by id (public)
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, bio, "avatarUrl", "createdAt" FROM "User" WHERE id = $1`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found.' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
});

module.exports = router;

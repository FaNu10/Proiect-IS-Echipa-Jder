const express  = require('express');
const router   = express.Router();
const pool     = require('../db');
const { protect } = require('../middleware/authMiddleware');

// ── GET my notifications ──────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT n.id, n.type, n.read, n."actionTaken", n."createdAt",
              u.name  AS "fromName",
              p.title AS "productTitle",
              p.id    AS "productId"
       FROM "Notification" n
       LEFT JOIN "User"    u ON u.id = n."fromUserId"
       LEFT JOIN "Product" p ON p.id = n."productId"
       WHERE n."userId" = $1
       ORDER BY n."createdAt" DESC
       LIMIT 50`,
      [req.user.id]
    );
    // Ensure createdAt is always a UTC ISO string so the frontend parses it correctly
    const rows = result.rows.map(r => ({
      ...r,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    }));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// ── GET unread count ──────────────────────────────────────────────────────────
router.get('/unread-count', protect, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS count FROM "Notification" WHERE "userId" = $1 AND read = false`,
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// ── POST donation request (claimer → donor) ──────────────────────────────────
router.post('/donation-request', protect, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'BAD_REQUEST', message: 'productId required.' });

    const prod = await pool.query(
      `SELECT id, title, "sellerId", "isDonation" FROM "Product" WHERE id = $1`, [productId]
    );
    if (prod.rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found.' });
    if (!prod.rows[0].isDonation) return res.status(400).json({ error: 'BAD_REQUEST', message: 'This product is not a donation.' });

    const { sellerId } = prod.rows[0];
    if (sellerId === req.user.id) return res.status(400).json({ error: 'BAD_REQUEST', message: "You can't claim your own donation." });

    const existing = await pool.query(
      `SELECT id FROM "Notification"
       WHERE "userId" = $1 AND "fromUserId" = $2 AND "productId" = $3
         AND type = 'DONATION_REQUEST' AND "actionTaken" = false`,
      [sellerId, req.user.id, productId]
    );
    if (existing.rows.length > 0) return res.status(400).json({ error: 'ALREADY_REQUESTED', message: 'You already sent a claim request for this item.' });

    await pool.query(
      `INSERT INTO "Notification" ("userId", "fromUserId", "productId", type)
       VALUES ($1, $2, $3, 'DONATION_REQUEST')`,
      [sellerId, req.user.id, productId]
    );
    res.json({ message: 'Claim request sent.' });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// ── POST buy request (buyer → seller) ────────────────────────────────────────
router.post('/buy-request', protect, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'BAD_REQUEST', message: 'productId required.' });

    // Get product & seller
    const prod = await pool.query(
      `SELECT id, title, "sellerId" FROM "Product" WHERE id = $1`, [productId]
    );
    if (prod.rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found.' });

    const { sellerId } = prod.rows[0];
    if (sellerId === req.user.id) return res.status(400).json({ error: 'BAD_REQUEST', message: "You can't buy your own product." });

    // Check if buyer already sent a pending request for this product
    const existing = await pool.query(
      `SELECT id FROM "Notification"
       WHERE "userId" = $1 AND "fromUserId" = $2 AND "productId" = $3
         AND type = 'BUY_REQUEST' AND "actionTaken" = false`,
      [sellerId, req.user.id, productId]
    );
    if (existing.rows.length > 0) return res.status(400).json({ error: 'ALREADY_REQUESTED', message: 'You already sent a buy request for this product.' });

    // Create notification for seller
    await pool.query(
      `INSERT INTO "Notification" ("userId", "fromUserId", "productId", type)
       VALUES ($1, $2, $3, 'BUY_REQUEST')`,
      [sellerId, req.user.id, productId]
    );

    res.json({ message: 'Buy request sent.' });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// ── POST admin-request (user → all admins) ───────────────────────────────────
router.post('/admin-request', protect, async (req, res) => {
  try {
    // Block if already admin
    const userRow = await pool.query(`SELECT role FROM "User" WHERE id = $1`, [req.user.id]);
    if (userRow.rows[0]?.role === 'admin') {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'You are already an admin.' });
    }

    // Block if a pending request already exists (to any admin, not actioned yet)
    const existing = await pool.query(
      `SELECT id FROM "Notification" WHERE "fromUserId" = $1 AND type = 'ADMIN_REQUEST' AND "actionTaken" = false`,
      [req.user.id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'ALREADY_REQUESTED', message: 'You already have a pending admin request.' });
    }

    // Get all admin users
    const admins = await pool.query(`SELECT id FROM "User" WHERE role = 'admin'`);
    if (admins.rows.length === 0) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'No admins found to send request to.' });
    }

    // Create one notification per admin
    for (const admin of admins.rows) {
      await pool.query(
        `INSERT INTO "Notification" ("userId", "fromUserId", type) VALUES ($1, $2, 'ADMIN_REQUEST')`,
        [admin.id, req.user.id]
      );
    }

    res.json({ message: 'Admin request sent.' });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// ── POST respond to buy request or admin request ──────────────────────────────
router.post('/:id/respond', protect, async (req, res) => {
  try {
    const { action } = req.body; // 'accept' | 'decline'
    if (!['accept', 'decline'].includes(action)) return res.status(400).json({ error: 'BAD_REQUEST', message: 'action must be accept or decline.' });

    // Get the notification (BUY_REQUEST or ADMIN_REQUEST)
    const notifResult = await pool.query(
      `SELECT n.*, p.title AS "productTitle"
       FROM "Notification" n
       LEFT JOIN "Product" p ON p.id = n."productId"
       WHERE n.id = $1 AND n."userId" = $2 AND n.type IN ('BUY_REQUEST', 'DONATION_REQUEST', 'ADMIN_REQUEST')`,
      [req.params.id, req.user.id]
    );
    if (notifResult.rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND', message: 'Notification not found.' });

    const notif = notifResult.rows[0];
    if (notif.actionTaken) return res.status(400).json({ error: 'ALREADY_ACTIONED', message: 'Already responded to this request.' });

    // Mark request as actioned + read
    await pool.query(
      `UPDATE "Notification" SET "actionTaken" = true, read = true WHERE id = $1`,
      [req.params.id]
    );

    if (notif.type === 'BUY_REQUEST' || notif.type === 'DONATION_REQUEST') {
      const isAccept = action === 'accept';
      if (isAccept && notif.productId) {
        await pool.query(`UPDATE "Product" SET sold = true WHERE id = $1`, [notif.productId]);
      }
      const type = notif.type === 'DONATION_REQUEST'
        ? (isAccept ? 'DONATION_ACCEPTED' : 'DONATION_DECLINED')
        : (isAccept ? 'BUY_ACCEPTED' : 'BUY_DECLINED');
      await pool.query(
        `INSERT INTO "Notification" ("userId", "fromUserId", "productId", type) VALUES ($1, $2, $3, $4)`,
        [notif.fromUserId, req.user.id, notif.productId, type]
      );
    } else if (notif.type === 'ADMIN_REQUEST') {
      if (action === 'accept') {
        // Promote the requester
        await pool.query(`UPDATE "User" SET role = 'admin' WHERE id = $1`, [notif.fromUserId]);
      }
      // Either way (accept or decline), cancel ALL pending ADMIN_REQUEST notifications
      // for this user so no other admin can respond and the user gets a clean slate
      await pool.query(
        `UPDATE "Notification" SET "actionTaken" = true, read = true
         WHERE "fromUserId" = $1 AND type = 'ADMIN_REQUEST' AND "actionTaken" = false`,
        [notif.fromUserId]
      );
      // Notify the requester
      const type = action === 'accept' ? 'ADMIN_REQUEST_ACCEPTED' : 'ADMIN_REQUEST_DECLINED';
      await pool.query(
        `INSERT INTO "Notification" ("userId", "fromUserId", type) VALUES ($1, $2, $3)`,
        [notif.fromUserId, req.user.id, type]
      );
    }

    res.json({ message: `Request ${action}ed.` });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// ── DELETE single notification ────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM "Notification" WHERE id = $1 AND "userId" = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND', message: 'Notification not found.' });
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// ── DELETE all notifications ──────────────────────────────────────────────────
router.delete('/', protect, async (req, res) => {
  try {
    await pool.query(`DELETE FROM "Notification" WHERE "userId" = $1`, [req.user.id]);
    res.json({ message: 'All deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// ── PUT mark all as read ──────────────────────────────────────────────────────
router.put('/mark-read', protect, async (req, res) => {
  try {
    await pool.query(
      `UPDATE "Notification" SET read = true WHERE "userId" = $1`, [req.user.id]
    );
    res.json({ message: 'All marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

module.exports = router;

const pool = require('../db');

/**
 * Creates a notification of the given type for every admin user.
 * @param {string} type         - Notification type string
 * @param {string} fromUserId   - The user who triggered the event
 * @param {string|null} productId - Optional product id
 */
async function notifyAdmins(type, fromUserId, productId = null) {
  try {
    const admins = await pool.query(`SELECT id FROM "User" WHERE role = 'admin'`);
    for (const admin of admins.rows) {
      if (admin.id === fromUserId) continue; // don't notify an admin about their own actions
      await pool.query(
        `INSERT INTO "Notification" ("userId", "fromUserId", "productId", type)
         VALUES ($1, $2, $3, $4)`,
        [admin.id, fromUserId, productId, type]
      );
    }
  } catch (err) {
    console.error('notifyAdmins error:', err.message);
  }
}

module.exports = { notifyAdmins };

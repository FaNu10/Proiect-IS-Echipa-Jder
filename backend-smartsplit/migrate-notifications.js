require("dotenv").config();
const pool = require("./src/db");

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Notification" (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId"      TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      "fromUserId"  TEXT REFERENCES "User"(id) ON DELETE SET NULL,
      "productId"   TEXT REFERENCES "Product"(id) ON DELETE CASCADE,
      type          VARCHAR(50) NOT NULL,
      read          BOOLEAN NOT NULL DEFAULT false,
      "actionTaken" BOOLEAN NOT NULL DEFAULT false,
      "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log("Notification table ready.");
  await pool.end();
}

migrate().catch(e => { console.error(e); process.exit(1); });

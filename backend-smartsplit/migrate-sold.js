require("dotenv").config();
const pool = require("./src/db");

async function migrate() {
  await pool.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS sold BOOLEAN NOT NULL DEFAULT false;`);
  console.log("sold column added.");
  await pool.end();
}

migrate().catch(e => { console.error(e); process.exit(1); });

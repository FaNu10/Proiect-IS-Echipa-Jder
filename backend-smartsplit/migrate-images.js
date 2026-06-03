require("dotenv").config();
const pool = require("./src/db");

async function migrate() {
  await pool.query(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]';`);
  // Backfill existing products: put their imageUrl into the images array
  await pool.query(`
    UPDATE "Product"
    SET images = to_jsonb(ARRAY["imageUrl"])
    WHERE "imageUrl" IS NOT NULL AND images = '[]'::jsonb;
  `);
  console.log("images column added and backfilled.");
  await pool.end();
}

migrate().catch(e => { console.error(e); process.exit(1); });

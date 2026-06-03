const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

const pool = new Pool({ host: 'localhost', port: 5433, user: 'littleloop', password: 'littleloop123', database: 'littleloop' });

const src  = path.join(__dirname, '../images/Safety 1st Corner & Edge Guards Set.jpeg');
const dest = path.join(__dirname, 'uploads/safety-1st-corner-edge-guards-set.jpeg');

fs.copyFileSync(src, dest);
console.log('Image copied.');

pool.query(
  `UPDATE "Product" SET "imageUrl" = $1 WHERE title = $2 RETURNING title`,
  ['/uploads/safety-1st-corner-edge-guards-set.jpeg', 'Safety 1st Corner & Edge Guards Set (20 pcs)']
).then(r => {
  console.log('Updated:', r.rows[0]?.title || 'no match');
  pool.end();
}).catch(e => { console.error(e.message); pool.end(); });

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ host: 'localhost', port: 5433, user: 'littleloop', password: 'littleloop123', database: 'littleloop' });

const srcDir  = path.join(__dirname, '../images');
const destDir = path.join(__dirname, 'uploads');

// Map: product title → clean filename slug
const images = [
  "Braun No Touch Thermometer + NoseFrida Kit",
  "Bugaboo Fox 3 Complete Stroller",
  "Chicco Baby Hug Air 4-in-1 Sleeper",
  "Chicco Pressure-Fit Safety Gate",
  "Crayola Ultimate Art Supply Kit",
  "ErgoPouch Baby Sleep Sack 2.5 TOG",
  "H&M Girls Floral Summer Dress",
  "Hot Wheels Ultimate Garage Playset",
  "IKEA HEMNES 3-Drawer Nursery Dresser",
  "IKEA SUNDVIK Baby Crib with Mattress",
  "LEGO DUPLO Classic Brick Box",
  "Mamas & Papas Signature Changing Bag",
  "Mango Girls Wool Winter Coat",
  "Maxi-Cosi Pebble Pro i-Size Car Seat",
  "Medela Swing Flex Single Breast Pump",
  "Melissa & Doug Deluxe Art & Craft Supply Set",
  "Melissa & Doug Wooden Puzzle Bundle",
  "Nike Kids Tracksuit Set",
  "Philips Avent Natural Baby Bottle Set",
  "Playmobil City Life School Playset",
  "Rotho Babydesign Baby Bath Tub with Stand",
  "Safety 1st Corner & Edge Guards Set",
  "Samsonite Kids Ergonomic School Backpack",
  "Theraline Pregnancy & Nursing Pillow",
  "Zara Boys Denim Jacket",
];

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  let updated = 0;

  for (const title of images) {
    const srcFile  = path.join(srcDir, `${title}.jpeg`);
    const slug     = slugify(title);
    const destFile = path.join(destDir, `${slug}.jpeg`);
    const urlPath  = `/uploads/${slug}.jpeg`;

    // Copy image to uploads/
    if (!fs.existsSync(srcFile)) {
      console.warn(`  MISSING source: ${srcFile}`);
      continue;
    }
    fs.copyFileSync(srcFile, destFile);

    // Update DB — match on title (exact)
    const result = await pool.query(
      `UPDATE "Product" SET "imageUrl" = $1 WHERE title = $2 RETURNING id, title`,
      [urlPath, title]
    );

    if (result.rows.length === 0) {
      console.warn(`  NO DB MATCH for title: "${title}"`);
    } else {
      updated++;
      console.log(`${updated}. Updated: ${title}`);
    }
  }

  console.log(`\nDone. ${updated} products updated with local images.`);
  await pool.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });

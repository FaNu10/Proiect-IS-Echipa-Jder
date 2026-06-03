const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5433, user: 'littleloop', password: 'littleloop123', database: 'littleloop' });

const bios = [
  {
    email: 'test@gmail.com',
    bio: "Selling gently used girls' clothing (size 4–5y), baby sleep gear and nursery furniture from Bucharest. Everything is clean, well-maintained and from a smoke-free home. Also have LEGO DUPLO sets and school backpacks in great condition!"
  },
  {
    email: 'test2@gmail.com',
    bio: "Based in Cluj. Listing boys' sportswear (size 6–7y, Nike), baby bath equipment, a Medela breast pump and childproofing items. All products come from a pet-free, smoke-free home and have been carefully cleaned before listing."
  },
  {
    email: 'alex.ionescu@littleloop.com',
    bio: "Oradea seller offering a wide range: boys' denim clothing (size 8–9y), Playmobil playsets, a premium Bugaboo Fox 3 stroller and baby sleep sacks. Also have maternity/pregnancy support items. Quality guaranteed — fast replies!"
  },
  {
    email: 'diana.matei@littleloop.com',
    bio: "Timisoara mum selling girls' winter clothing (size 3–4y, Mango), IKEA nursery furniture, Philips Avent baby bottles and art supplies for school. Everything is in excellent condition — most items used for one season only."
  },
  {
    email: 'paul.barbu@littleloop.com',
    bio: "Listing from Iasi: Hot Wheels garage sets, a Maxi-Cosi infant car seat, baby health essentials (Braun thermometer + NoseFrida) and childproofing corner guards. Great deals for growing families — all items are new or like-new!"
  },
];

async function main() {
  for (const u of bios) {
    const r = await pool.query(
      `UPDATE "User" SET bio = $1 WHERE email = $2 RETURNING name, email`,
      [u.bio, u.email]
    );
    console.log('Bio set for:', r.rows[0]?.name);
  }
  console.log('\nAll bios updated.');
  await pool.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });

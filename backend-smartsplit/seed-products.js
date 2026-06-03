const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5433, user: 'littleloop', password: 'littleloop123', database: 'littleloop' });

const products = [

  // ── test (b491c091) ──────────────────────────────────────────────────────
  {
    title: "H&M Girls Floral Summer Dress",
    category: "Clothing",
    brand: "H&M",
    price: 12,
    size: "4-5 years",
    condition: "Very good",
    location: "Bucharest",
    description: "Lovely floral print dress perfect for summer. Light cotton fabric, easy to wash. No stains or tears. Worn only a few times.",
    imageUrl: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop",
    sellerId: "b491c091-c2a6-45cc-9de5-4f843eecccf3"
  },
  {
    title: "LEGO DUPLO Classic Brick Box",
    category: "Toys",
    brand: "LEGO",
    price: 35,
    size: "One size",
    condition: "Good",
    location: "Bucharest",
    description: "Complete LEGO DUPLO Classic Brick Box, 85 pieces. All bricks present and clean. Great for toddlers aged 1.5+. Box included.",
    imageUrl: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=800&auto=format&fit=crop",
    sellerId: "b491c091-c2a6-45cc-9de5-4f843eecccf3"
  },
  {
    title: "IKEA SUNDVIK Baby Crib with Mattress",
    category: "Furniture & decor",
    brand: "IKEA",
    price: 120,
    size: "120 x 60 cm",
    condition: "Good",
    location: "Bucharest",
    description: "Classic white IKEA SUNDVIK crib in solid pine. Adjustable base height. Includes a clean foam mattress. Easy to disassemble for transport.",
    imageUrl: "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&auto=format&fit=crop",
    sellerId: "b491c091-c2a6-45cc-9de5-4f843eecccf3"
  },
  {
    title: "Chicco Baby Hug Air 4-in-1 Sleeper",
    category: "Sleep & bedding",
    brand: "Chicco",
    price: 150,
    size: "0-6 months",
    condition: "Very good",
    location: "Bucharest",
    description: "Multi-function co-sleeping crib with vibration and night light. Fully adjustable. Mattress washed and cover cleaned. All parts included.",
    imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&auto=format&fit=crop",
    sellerId: "b491c091-c2a6-45cc-9de5-4f843eecccf3"
  },
  {
    title: "Samsonite Kids Ergonomic School Backpack",
    category: "School supplies",
    brand: "Samsonite",
    price: 25,
    size: "One size",
    condition: "New",
    location: "Bucharest",
    description: "Brand new Samsonite kids ergonomic backpack. Padded back support and adjustable straps. Multiple compartments. Perfect for primary school.",
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop",
    sellerId: "b491c091-c2a6-45cc-9de5-4f843eecccf3"
  },

  // ── Zerghe Stefan (207b7522) ─────────────────────────────────────────────
  {
    title: "Nike Kids Tracksuit Set",
    category: "Clothing",
    brand: "Nike",
    price: 30,
    size: "6-7 years",
    condition: "Very good",
    location: "Cluj",
    description: "Nike Dri-FIT tracksuit (jacket + pants). Navy blue. Barely worn, no pilling. Great for sports or everyday casual use.",
    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop",
    sellerId: "207b7522-0a90-4a02-bbb0-b031637be557"
  },
  {
    title: "Rotho Babydesign Baby Bath Tub with Stand",
    category: "Bathing & changing",
    brand: "Rotho Babydesign",
    price: 45,
    size: "0-24 months",
    condition: "Good",
    location: "Cluj",
    description: "Ergonomic baby bath tub on adjustable stand. Non-slip insert included. Height adjustable from 63 to 85 cm. Thoroughly cleaned.",
    imageUrl: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&auto=format&fit=crop",
    sellerId: "207b7522-0a90-4a02-bbb0-b031637be557"
  },
  {
    title: "Medela Swing Flex Single Breast Pump",
    category: "Nursing & feeding",
    brand: "Medela",
    price: 80,
    size: "One size",
    condition: "Very good",
    location: "Cluj",
    description: "Medela Swing Flex electric breast pump with 2-phase expression. All parts sterilised. New membranes included. Bag and accessories included.",
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop",
    sellerId: "207b7522-0a90-4a02-bbb0-b031637be557"
  },
  {
    title: "Chicco Pressure-Fit Safety Gate",
    category: "Childproofing & safety equipment",
    brand: "Chicco",
    price: 40,
    size: "75-82 cm wide",
    condition: "Good",
    location: "Cluj",
    description: "Easy-to-install pressure-mounted safety gate. Fits openings 75-82 cm wide. One-hand operation. No drilling required. Clean and fully functional.",
    imageUrl: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&auto=format&fit=crop",
    sellerId: "207b7522-0a90-4a02-bbb0-b031637be557"
  },
  {
    title: "Melissa & Doug Wooden Puzzle Bundle",
    category: "Other kids' items",
    brand: "Melissa & Doug",
    price: 18,
    size: "One size",
    condition: "New",
    location: "Cluj",
    description: "Set of 3 Melissa & Doug chunky wooden puzzles: farm animals, vehicles, and alphabet. Never used, still in original wrapping. Age 2+.",
    imageUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&auto=format&fit=crop",
    sellerId: "207b7522-0a90-4a02-bbb0-b031637be557"
  },

  // ── Alex Ionescu (0c61becc) ──────────────────────────────────────────────
  {
    title: "Playmobil City Life School Playset",
    category: "Toys",
    brand: "Playmobil",
    price: 28,
    size: "One size",
    condition: "Good",
    location: "Oradea",
    description: "Playmobil 5923 School set with teacher, 2 pupils and classroom accessories. All pieces present and accounted for. Box included.",
    imageUrl: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop",
    sellerId: "0c61becc-533a-477c-82a7-c2495c77e937"
  },
  {
    title: "Bugaboo Fox 3 Complete Stroller",
    category: "Pushchairs, carriers & car seats",
    brand: "Bugaboo",
    price: 350,
    size: "0-3 years",
    condition: "Very good",
    location: "Oradea",
    description: "Bugaboo Fox 3 all-terrain stroller in midnight black. Reversible seat, one-hand fold. Bassinet, rain cover and bag included. Immaculate condition.",
    imageUrl: "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&auto=format&fit=crop",
    sellerId: "0c61becc-533a-477c-82a7-c2495c77e937"
  },
  {
    title: "Zara Boys Denim Jacket",
    category: "Clothing",
    brand: "Zara",
    price: 20,
    size: "8-9 years",
    condition: "Very good",
    location: "Oradea",
    description: "Classic Zara denim jacket, medium wash. Two chest pockets. Slight fading consistent with gentle use. No damage. Great layering piece.",
    imageUrl: "https://images.unsplash.com/photo-1604644401890-0bd678c83788?w=800&auto=format&fit=crop",
    sellerId: "0c61becc-533a-477c-82a7-c2495c77e937"
  },
  {
    title: "Theraline Pregnancy & Nursing Pillow",
    category: "Health & pregnancy",
    brand: "Theraline",
    price: 55,
    size: "One size",
    condition: "Good",
    location: "Oradea",
    description: "Theraline 190 cm maternity pillow with micro-bead filling. Machine-washed cover. Supports back, belly and knees. Ideal for pregnancy and breastfeeding.",
    imageUrl: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&auto=format&fit=crop",
    sellerId: "0c61becc-533a-477c-82a7-c2495c77e937"
  },
  {
    title: "ErgoPouch Baby Sleep Sack 2.5 TOG",
    category: "Sleep & bedding",
    brand: "ErgoPouch",
    price: 22,
    size: "6-12 months",
    condition: "New",
    location: "Oradea",
    description: "Brand-new ErgoPouch sleep sack, 2.5 TOG rating for cooler nights. Organic cotton, GOTS certified. Zip opening at bottom for easy nappy changes.",
    imageUrl: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&auto=format&fit=crop",
    sellerId: "0c61becc-533a-477c-82a7-c2495c77e937"
  },

  // ── Diana Matei (94f350b1) ───────────────────────────────────────────────
  {
    title: "Mango Girls Wool Winter Coat",
    category: "Clothing",
    brand: "Mango",
    price: 35,
    size: "3-4 years",
    condition: "Very good",
    location: "Timisoara",
    description: "Mango camel-coloured wool-blend winter coat. Double-breasted buttons. Fully lined. One season use. No pulls or stains. Dry-cleaned.",
    imageUrl: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&auto=format&fit=crop",
    sellerId: "94f350b1-04c0-4aa7-a489-7da92e055ae8"
  },
  {
    title: "IKEA HEMNES 3-Drawer Nursery Dresser",
    category: "Furniture & decor",
    brand: "IKEA",
    price: 180,
    size: "108 x 78 cm",
    condition: "Good",
    location: "Timisoara",
    description: "IKEA HEMNES chest of 3 drawers in white stain. Solid wood. Smooth-running drawers. Minor scuffs on base. Buyer must arrange transport.",
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop",
    sellerId: "94f350b1-04c0-4aa7-a489-7da92e055ae8"
  },
  {
    title: "Mamas & Papas Signature Changing Bag",
    category: "Bathing & changing",
    brand: "Mamas & Papas",
    price: 50,
    size: "One size",
    condition: "Very good",
    location: "Timisoara",
    description: "Stylish Mamas & Papas Signature changing bag in tan. Changing mat, insulated bottle holder and stroller clips included. Lightly used.",
    imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop",
    sellerId: "94f350b1-04c0-4aa7-a489-7da92e055ae8"
  },
  {
    title: "Crayola Ultimate Art Supply Kit",
    category: "School supplies",
    brand: "Crayola",
    price: 15,
    size: "One size",
    condition: "New",
    location: "Timisoara",
    description: "Crayola 120-piece art kit including crayons, markers, coloured pencils and washable paints. Factory sealed. Perfect school or birthday gift.",
    imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop",
    sellerId: "94f350b1-04c0-4aa7-a489-7da92e055ae8"
  },
  {
    title: "Philips Avent Natural Baby Bottle Set",
    category: "Nursing & feeding",
    brand: "Philips Avent",
    price: 30,
    size: "0-6 months",
    condition: "Very good",
    location: "Timisoara",
    description: "Set of 4 Philips Avent Natural 260 ml bottles with slow-flow teats. Sterilised after each use. Scratch-free. BPA free. Sold with steriliser bag.",
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop",
    sellerId: "94f350b1-04c0-4aa7-a489-7da92e055ae8"
  },

  // ── Paul Barbu (2ec54089) ─────────────────────────────────────────────────
  {
    title: "Hot Wheels Ultimate Garage Playset",
    category: "Toys",
    brand: "Hot Wheels",
    price: 45,
    size: "One size",
    condition: "Good",
    location: "Iasi",
    description: "Hot Wheels Ultimate Garage with elevator and 3 Hot Wheels cars. Holds 140+ cars. All parts present. Minor paint scratches from play.",
    imageUrl: "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=800&auto=format&fit=crop",
    sellerId: "2ec54089-1077-4e21-b57b-f9a829c001d7"
  },
  {
    title: "Maxi-Cosi Pebble Pro i-Size Car Seat",
    category: "Pushchairs, carriers & car seats",
    brand: "Maxi-Cosi",
    price: 200,
    size: "0-13 kg",
    condition: "Very good",
    location: "Iasi",
    description: "Maxi-Cosi Pebble Pro i-Size infant car seat in Essential Black. Compatible with FamilyFix base (not included). No accidents. Cover washed.",
    imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop",
    sellerId: "2ec54089-1077-4e21-b57b-f9a829c001d7"
  },
  {
    title: "Braun No Touch Thermometer + NoseFrida Kit",
    category: "Health & pregnancy",
    brand: "Braun",
    price: 25,
    size: "One size",
    condition: "New",
    location: "Iasi",
    description: "Bundle of Braun No Touch forehead thermometer and NoseFrida nasal aspirator. Both brand new, sealed. Ideal new-parent starter kit.",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop",
    sellerId: "2ec54089-1077-4e21-b57b-f9a829c001d7"
  },
  {
    title: "Safety 1st Corner & Edge Guards Set (20 pcs)",
    category: "Childproofing & safety equipment",
    brand: "Safety 1st",
    price: 12,
    size: "One size",
    condition: "New",
    location: "Iasi",
    description: "Set of 20 soft foam corner guards and 4 edge strips. Strong adhesive, easy to apply and remove. Protects toddlers from sharp furniture edges.",
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop",
    sellerId: "2ec54089-1077-4e21-b57b-f9a829c001d7"
  },
  {
    title: "Melissa & Doug Deluxe Art & Craft Supply Set",
    category: "Other kids' items",
    brand: "Melissa & Doug",
    price: 38,
    size: "One size",
    condition: "New",
    location: "Iasi",
    description: "Deluxe open-ended art kit with 208 pieces: stamps, stencils, glitter glue, pom-poms and more. Still factory sealed. Age 4+. Great gift.",
    imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop",
    sellerId: "2ec54089-1077-4e21-b57b-f9a829c001d7"
  },
];

async function main() {
  let count = 0;
  for (const p of products) {
    await pool.query(
      `INSERT INTO "Product" (id, title, category, brand, price, size, condition, location, description, "imageUrl", "sellerId", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [p.title, p.category, p.brand, p.price, p.size, p.condition, p.location, p.description, p.imageUrl, p.sellerId]
    );
    count++;
    console.log(`${count}. Inserted: ${p.title}`);
  }
  console.log(`\nDone. ${count} products inserted.`);
  await pool.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });

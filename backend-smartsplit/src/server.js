// src/server.js
const app = require('./app'); // Importăm configurația din app.js [cite: 181]
const PORT = process.env.PORT || 3000; // Luăm portul din .env sau punem 3000 implicit [cite: 182, 183]

app.listen(PORT, () => {
    console.log(`Serverul ruleaza pe http://localhost:${PORT}`); // [cite: 184, 185]
});
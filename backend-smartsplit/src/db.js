const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5433,
    user: 'littleloop',
    password: 'littleloop123',
    database: 'littleloop',
});

module.exports = pool;

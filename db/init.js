const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function initializeDatabase() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  try {
    await pool.query(schemaSql);
    console.log('Database schema initialized successfully.');
  } finally {
    await pool.end();
  }
}

module.exports = initializeDatabase;

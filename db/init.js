const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { spawnSync } = require('child_process');

async function initializeDatabase() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  try {
    await pool.query(schemaSql);
    console.log('Database schema initialized successfully.');

    const counts = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS user_count,
        (SELECT COUNT(*) FROM clients) AS client_count,
        (SELECT COUNT(*) FROM matters) AS matter_count,
        (SELECT COUNT(*) FROM invoices) AS invoice_count,
        (SELECT COUNT(*) FROM renewals) AS renewal_count
    `);

    const total = Object.values(counts.rows[0]).reduce((sum, value) => sum + Number(value || 0), 0);
    if (total === 0) {
      console.log('No seed data found; running db/seed.js...');
      const result = spawnSync(process.execPath, ['db/seed.js'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        env: process.env,
      });
      if (result.status !== 0) {
        throw new Error('Failed to seed database data.');
      }
      console.log('Database seed completed.');
    } else {
      console.log('Seed data already present; skipping db/seed.js.');
    }
  } finally {
    await pool.end();
  }
}

module.exports = initializeDatabase;

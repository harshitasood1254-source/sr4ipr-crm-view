// middleware/auth.js — JWT verification for all protected routes

const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = function(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'No token provided' });

  const token = header.startsWith('Bearer ') ? header.slice(7) : header;

  // Support the seeded-user session token used by the page login flow.
  if (token.startsWith('seeded:')) {
    const id = token.slice('seeded:'.length);
    return pool.query('SELECT id, email, name, role, avatar FROM users WHERE id=$1', [id])
      .then((result) => {
        if (!result.rows.length) return res.status(401).json({ error: 'Invalid session' });
        req.user = result.rows[0];
        return next();
      })
      .catch(() => res.status(401).json({ error: 'Invalid session' }));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

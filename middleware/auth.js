// middleware/auth.js — JWT verification for all protected routes

const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SEEDED_USERS = {
  u1: { id: 'u1', email: 'rpyadav@sr4ipr.in', name: 'R P Yadav', role: 'founder', avatar: 'RP' },
  u2: { id: 'u2', email: 'himanshu@sr4ipr.in', name: 'Himanshu Yadav', role: 'coo', avatar: 'HY' },
  u3: { id: 'u3', email: 'divyanshu@sr4ipr.in', name: 'Divyanshu Yadav', role: 'biz_head', avatar: 'DY' },
  u4: { id: 'u4', email: 'dinesh@sr4ipr.in', name: 'Dinesh Kumar', role: 'patent_head', avatar: 'DK' },
  u5: { id: 'u5', email: 'shreya@sr4ipr.in', name: 'Shreya Gaur', role: 'tm_head', avatar: 'SG' },
  u6: { id: 'u6', email: 'abhishek@sr4ipr.in', name: 'Abhishek Tyagi', role: 'accounts', avatar: 'AT' },
  u7: { id: 'u7', email: 'shivangi@sr4ipr.in', name: 'Shivangi', role: 'patent_paralegal', avatar: 'SH' },
  u8: { id: 'u8', email: 'jitender@sr4ipr.in', name: 'Jitender Anand', role: 'comms', avatar: 'JA' },
  u9: { id: 'u9', email: 'nishtha@sr4ipr.in', name: 'Nishtha', role: 'tm_associate', avatar: 'NI' },
  u10: { id: 'u10', email: 'lipi@sr4ipr.in', name: 'Lipi', role: 'tm_associate', avatar: 'LI' },
  u11: { id: 'u11', email: 'ayush@sr4ipr.in', name: 'Ayush', role: 'tm_paralegal', avatar: 'AY' },
  u12: { id: 'u12', email: 'lokesh@sr4ipr.in', name: 'Lokesh', role: 'tm_paralegal', avatar: 'LO' },
};

module.exports = function(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'No token provided' });

  const token = header.startsWith('Bearer ') ? header.slice(7) : header;

  // Support the seeded-user session token used by the page login flow.
  if (token.startsWith('seeded:')) {
    const id = token.slice('seeded:'.length);
    const fallbackUser = SEEDED_USERS[id];

    return pool.query('SELECT id, email, name, role, avatar FROM users WHERE id=$1', [id])
      .then((result) => {
        if (result.rows.length) {
          req.user = result.rows[0];
          return next();
        }

        if (fallbackUser) {
          req.user = fallbackUser;
          return next();
        }

        return res.status(401).json({ error: 'Invalid session' });
      })
      .catch(() => {
        if (fallbackUser) {
          req.user = fallbackUser;
          return next();
        }
        return res.status(401).json({ error: 'Invalid session' });
      });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

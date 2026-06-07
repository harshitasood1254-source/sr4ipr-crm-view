// routes/renewals.js
const express = require('express');
const router  = express.Router();
const { Pool } = require('pg');
const auth    = require('../middleware/auth');
const pool    = new Pool({ connectionString: process.env.DATABASE_URL });

router.get('/', auth, async (req, res) => {
  const { type, urgency } = req.query;
  let where=[], params=[], idx=1;
  if (type) { where.push(`type=$${idx++}`); params.push(type); }
  if (urgency) {
    where.push(`due_date <= CURRENT_DATE + INTERVAL '${parseInt(urgency)} days'`);
  }
  const sql = `SELECT * FROM renewals ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY due_date ASC`;
  const result = await pool.query(sql, params);
  res.json(result.rows);
});

router.post('/', auth, async (req, res) => {
  const r = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO renewals (id, matter_id, matter_title, client_id, client_name, type, year, due_date, amount, status, alert_sent)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
    `, [
      r.id || 'ren' + Date.now(),
      r.matterId || null,
      r.matterTitle || '',
      r.clientId || null,
      r.clientName || '',
      r.type || 'Renewal',
      r.year || new Date().getFullYear(),
      r.dueDate || new Date().toISOString().split('T')[0],
      r.amount || 0,
      r.status || 'pending',
      r.alertSent || false
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', auth, async (req, res) => {
  const { status, alertSent } = req.body;
  const result = await pool.query(
    'UPDATE renewals SET status=$1, alert_sent=$2 WHERE id=$3 RETURNING *',
    [status||'pending', alertSent||false, req.params.id]
  );
  res.json(result.rows[0]);
});

module.exports = router;

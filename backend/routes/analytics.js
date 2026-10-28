const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const pool = require('../config/database');

// Get incident statistics
router.get('/incidents', auth, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const params = [];
    let paramIndex = 1;

    if (start_date && end_date) {
      dateFilter = `WHERE created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(start_date, end_date);
      paramIndex += 2;
    }

    // Total incidents
    const totalResult = await pool.query(
      `SELECT COUNT(*) as total FROM incidents ${dateFilter}`,
      params
    );

    // By type
    const typeResult = await pool.query(
      `SELECT type, COUNT(*) as count FROM incidents ${dateFilter} GROUP BY type ORDER BY count DESC`,
      params
    );

    // By severity
    const severityResult = await pool.query(
      `SELECT severity, COUNT(*) as count FROM incidents ${dateFilter} GROUP BY severity ORDER BY count DESC`,
      params
    );

    // By status
    const statusResult = await pool.query(
      `SELECT status, COUNT(*) as count FROM incidents ${dateFilter} GROUP BY status ORDER BY count DESC`,
      params
    );

    res.json({
      total: parseInt(totalResult.rows[0].total),
      by_type: typeResult.rows,
      by_severity: severityResult.rows,
      by_status: statusResult.rows
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get user statistics
router.get('/users', auth, async (req, res) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) as total FROM users');
    const activeUsers = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE created_at > NOW() - INTERVAL \'30 days\''
    );

    res.json({
      total_users: parseInt(totalUsers.rows[0].total),
      active_users: parseInt(activeUsers.rows[0].total)
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get incident trends (last 7 days)
router.get('/trends', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         DATE(created_at) as date,
         COUNT(*) as count
       FROM incidents
       WHERE created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    res.json({ trends: result.rows });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

module.exports = router;

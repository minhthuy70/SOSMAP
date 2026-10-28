const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const { getAuditLogs } = require('../middleware/audit');

// Get audit logs (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const {
      user_id,
      action,
      entity_type,
      entity_id,
      start_date,
      end_date,
      limit = 100,
      offset = 0
    } = req.query;

    const logs = await getAuditLogs({
      user_id,
      action,
      entity_type,
      entity_id,
      start_date,
      end_date,
      limit,
      offset
    });

    res.json({ logs });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get audit statistics (admin only)
router.get('/statistics', adminAuth, async (req, res) => {
  try {
    const pool = require('../config/database');

    // Logs by action
    const actionResult = await pool.query(
      'SELECT action, COUNT(*) as count FROM audit_logs GROUP BY action ORDER BY count DESC LIMIT 10'
    );

    // Logs by entity type
    const entityResult = await pool.query(
      'SELECT entity_type, COUNT(*) as count FROM audit_logs GROUP BY entity_type ORDER BY count DESC LIMIT 10'
    );

    // Logs by user
    const userResult = await pool.query(
      `SELECT u.name, COUNT(*) as count FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       GROUP BY u.name ORDER BY count DESC LIMIT 10`
    );

    // Recent activity
    const recentResult = await pool.query(
      `SELECT al.*, u.name as user_name FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC LIMIT 10`
    );

    res.json({
      by_action: actionResult.rows,
      by_entity: entityResult.rows,
      by_user: userResult.rows,
      recent_activity: recentResult.rows
    });
  } catch (error) {
    console.error('Get audit statistics error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const pool = require('../config/database');

// Get user notifications
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 20, offset = 0, unread_only } = req.query;

    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [req.user.id];
    let paramIndex = 2;

    if (unread_only === 'true') {
      query += ` AND read = false`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications
       SET read = true, read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Notification not found', status: 404 } });
    }

    res.json({ message: 'Notification marked as read', notification: result.rows[0] });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET read = true, read_at = NOW() WHERE user_id = $1 AND read = false',
      [req.user.id]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Create notification (internal use)
router.post('/', async (req, res) => {
  try {
    const { user_id, type, title, message, data } = req.body;

    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, type, title, message, data || {}]
    );

    res.status(201).json({ notification: result.rows[0] });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const pool = require('../config/database');
const webpush = require('web-push');

// Configure VAPID keys (should be in environment variables in production)
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'YOUR_VAPID_PUBLIC_KEY';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'YOUR_VAPID_PRIVATE_KEY';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@sosmap.com';

if (vapidPublicKey !== 'YOUR_VAPID_PUBLIC_KEY' && vapidPrivateKey !== 'YOUR_VAPID_PRIVATE_KEY') {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

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

// Subscribe to push notifications
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription) {
      return res.status(400).json({ error: { message: 'Subscription data required', status: 400 } });
    }

    // Save subscription to database (you might want a separate table for this)
    await pool.query(
      `UPDATE users
       SET push_subscription = $1
       WHERE id = $2`,
      [JSON.stringify(subscription), req.user.id]
    );

    res.json({ message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Send push notification (internal use)
async function sendPushNotification(userId, title, body, data = {}) {
  try {
    const result = await pool.query(
      'SELECT push_subscription FROM users WHERE id = $1 AND push_subscription IS NOT NULL',
      [userId]
    );

    if (result.rows.length === 0) {
      console.log('No push subscription found for user:', userId);
      return;
    }

    const subscription = JSON.parse(result.rows[0].push_subscription);

    await webpush.sendNotification(subscription, JSON.stringify({
      title,
      body,
      data
    }));

    console.log('Push notification sent to user:', userId);
  } catch (error) {
    console.error('Send push notification error:', error);
  }
}

module.exports = router;
module.exports.sendPushNotification = sendPushNotification;

module.exports = router;

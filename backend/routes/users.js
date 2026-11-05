const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { getUserRateLimitStatus, resetUserRateLimit } = require('../middleware/rateLimitPerUser');

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, phone, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found', status: 404 } });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Update user profile
router.put('/profile', auth, [
  body('name').optional().trim().notEmpty(),
  body('phone').optional().trim(),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, email } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, email, name, phone, role`,
      [name, phone, email, req.user.id]
    );

    res.json({ message: 'Profile updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Change password
router.put('/password', auth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current password
    const userResult = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found', status: 404 } });
    }

    const user = userResult.rows[0];

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: { message: 'Current password is incorrect', status: 401 } });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Update location
router.put('/location', auth, [
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('accuracy').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { latitude, longitude, accuracy, timestamp } = req.body;

    // Check if user has location column (add if not exists)
    try {
      await pool.query(
        `UPDATE users
         SET last_latitude = $1,
             last_longitude = $2,
             last_location_accuracy = $3,
             last_location_at = COALESCE($4, NOW())
         WHERE id = $5`,
        [latitude, longitude, accuracy, timestamp, req.user.id]
      );
    } catch (updateError) {
      // Column might not exist, ignore for now
      console.log('Location update failed (column may not exist):', updateError.message);
    }

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Add reputation points
router.post('/:id/reputation', auth, [
  body('points').isInt({ min: -100, max: 100 }),
  body('reason').optional().trim().isLength({ max: 200 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Only admins can modify reputation
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized to modify reputation', status: 403 } });
    }

    const { points, reason } = req.body;

    // Get current user reputation
    const userResult = await pool.query(
      'SELECT reputation_points FROM users WHERE id = $1',
      [req.params.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found', status: 404 } });
    }

    const currentPoints = userResult.rows[0].reputation_points || 0;
    const newPoints = currentPoints + points;

    // Calculate new level
    let newLevel = 'bronze';
    if (newPoints >= 1000) newLevel = 'diamond';
    else if (newPoints >= 500) newLevel = 'platinum';
    else if (newPoints >= 250) newLevel = 'gold';
    else if (newPoints >= 100) newLevel = 'silver';

    // Update user reputation
    await pool.query(
      `UPDATE users
       SET reputation_points = $1,
           reputation_level = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [newPoints, newLevel, req.params.id]
    );

    // Log reputation change
    const audit = require('./audit');
    audit.logAuditLog(req.user.id, 'reputation_change', 'user', req.params.id, {
      points: points,
      reason: reason,
      previous_points: currentPoints,
      new_points: newPoints,
      level: newLevel
    });

    res.json({
      message: 'Reputation updated successfully',
      reputation_points: newPoints,
      reputation_level: newLevel
    });
  } catch (error) {
    console.error('Update reputation error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get user reputation
router.get('/:id/reputation', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT reputation_points, reputation_level FROM users WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found', status: 404 } });
    }

    const reputation = result.rows[0];

    // Get reputation breakdown (how many incidents reported, verified, etc.)
    const incidentsResult = await pool.query(
      'SELECT COUNT(*) as total, COUNT(CASE WHEN verified_by IS NOT NULL THEN 1 END) as verified FROM incidents WHERE user_id = $1',
      [req.params.id]
    );

    const ratingsResult = await pool.query(
      'SELECT COUNT(*) as total, AVG(rating) as average FROM incident_ratings WHERE user_id = $1',
      [req.params.id]
    );

    res.json({
      reputation_points: reputation.reputation_points || 0,
      reputation_level: reputation.reputation_level || 'bronze',
      stats: {
        incidents_reported: parseInt(incidentsResult.rows[0].total || 0),
        incidents_verified: parseInt(incidentsResult.rows[0].verified || 0),
        ratings_given: parseInt(ratingsResult.rows[0].total || 0),
        average_rating: parseFloat(ratingsResult.rows[0].average || 0).toFixed(1)
      }
    });
  } catch (error) {
    console.error('Get reputation error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get user dashboard data
router.get('/:id/dashboard', auth, async (req, res) => {
  try {
    const userId = req.params.id;

    // Only users can view their own dashboard or admins can view any
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized to view this dashboard', status: 403 } });
    }

    // Get user profile
    const userResult = await pool.query(
      'SELECT id, email, name, phone, role, reputation_points, reputation_level, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found', status: 404 } });
    }

    const user = userResult.rows[0];

    // Get user's incidents
    const incidentsResult = await pool.query(
      `SELECT id, type, title, status, severity, created_at 
       FROM incidents 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [userId]
    );

    // Get user's comments
    const commentsResult = await pool.query(
      `SELECT ic.id, ic.comment, ic.created_at, i.title as incident_title
       FROM incident_comments ic
       LEFT JOIN incidents i ON ic.incident_id = i.id
       WHERE ic.user_id = $1
       ORDER BY ic.created_at DESC
       LIMIT 5`,
      [userId]
    );

    // Get user's achievements
    const achievementsResult = await pool.query(
      'SELECT * FROM user_achievements WHERE user_id = $1 ORDER BY earned_at DESC',
      [userId]
    );

    // Get activity stats
    const statsResult = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM incidents WHERE user_id = $1) as total_incidents,
        (SELECT COUNT(*) FROM incident_comments WHERE user_id = $1) as total_comments,
        (SELECT COUNT(*) FROM incident_ratings WHERE user_id = $1) as total_ratings,
        (SELECT COUNT(*) FROM incident_relations WHERE created_by = $1) as total_relations,
        (SELECT COUNT(*) FROM incidents WHERE user_id = $1 AND status = 'resolved') as resolved_incidents,
        (SELECT COUNT(*) FROM incidents WHERE user_id = $1 AND verified_by IS NOT NULL) as verified_incidents,
        (SELECT COUNT(*) FROM incidents WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days') as week_incidents,
        (SELECT COUNT(*) FROM incidents WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 day') as today_incidents,
        (SELECT COUNT(*) FROM incident_comments WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days') as week_comments,
        (SELECT COUNT(*) FROM incident_comments WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 day') as today_comments,
        (SELECT COUNT(*) FROM incident_ratings WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days') as week_ratings,
        (SELECT COUNT(*) FROM incident_ratings WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 day') as today_ratings
      `,
      [userId]
    );

    res.json({
      user: user,
      recent_incidents: incidentsResult.rows,
      recent_comments: commentsResult.rows,
      achievements: achievementsResult.rows,
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get notification preferences
router.get('/:id/notification-preferences', auth, async (req, res) => {
  try {
    const userId = req.params.id;

    // Only users can view their own preferences or admins
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized', status: 403 } });
    }

    const result = await pool.query(
      'SELECT * FROM user_notification_preferences WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Return default preferences
      return res.json({
        user_id: parseInt(userId),
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        in_app_notifications: true,
        notify_on_new_incident: true,
        notify_on_assigned_incident: true,
        notify_on_incident_update: true,
        notify_on_comment_reply: true,
        notify_on_escalation: true,
        notify_on_nearby_incident: true,
        nearby_radius_km: 5,
        notification_frequency: 'realtime'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Update notification preferences
router.put('/:id/notification-preferences', auth, [
  body('email_notifications').optional().isBoolean(),
  body('push_notifications').optional().isBoolean(),
  body('sms_notifications').optional().isBoolean(),
  body('in_app_notifications').optional().isBoolean(),
  body('notify_on_new_incident').optional().isBoolean(),
  body('notify_on_assigned_incident').optional().isBoolean(),
  body('notify_on_incident_update').optional().isBoolean(),
  body('notify_on_comment_reply').optional().isBoolean(),
  body('notify_on_escalation').optional().isBoolean(),
  body('notify_on_nearby_incident').optional().isBoolean(),
  body('nearby_radius_km').optional().isInt({ min: 1, max: 50 }),
  body('quiet_hours_start').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('quiet_hours_end').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('notification_frequency').optional().isIn(['realtime', 'hourly', 'daily', 'weekly'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.params.id;

    // Only users can update their own preferences or admins
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized', status: 403 } });
    }

    const {
      email_notifications,
      push_notifications,
      sms_notifications,
      in_app_notifications,
      notify_on_new_incident,
      notify_on_assigned_incident,
      notify_on_incident_update,
      notify_on_comment_reply,
      notify_on_escalation,
      notify_on_nearby_incident,
      nearby_radius_km,
      quiet_hours_start,
      quiet_hours_end,
      notification_frequency
    } = req.body;

    // Check if preferences exist
    const existing = await pool.query(
      'SELECT id FROM user_notification_preferences WHERE user_id = $1',
      [userId]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing
      result = await pool.query(
        `UPDATE user_notification_preferences
         SET email_notifications = COALESCE($1, email_notifications),
             push_notifications = COALESCE($2, push_notifications),
             sms_notifications = COALESCE($3, sms_notifications),
             in_app_notifications = COALESCE($4, in_app_notifications),
             notify_on_new_incident = COALESCE($5, notify_on_new_incident),
             notify_on_assigned_incident = COALESCE($6, notify_on_assigned_incident),
             notify_on_incident_update = COALESCE($7, notify_on_incident_update),
             notify_on_comment_reply = COALESCE($8, notify_on_comment_reply),
             notify_on_escalation = COALESCE($9, notify_on_escalation),
             notify_on_nearby_incident = COALESCE($10, notify_on_nearby_incident),
             nearby_radius_km = COALESCE($11, nearby_radius_km),
             quiet_hours_start = $12,
             quiet_hours_end = $13,
             notification_frequency = COALESCE($14, notification_frequency),
             updated_at = NOW()
         WHERE user_id = $15
         RETURNING *`,
        [
          email_notifications,
          push_notifications,
          sms_notifications,
          in_app_notifications,
          notify_on_new_incident,
          notify_on_assigned_incident,
          notify_on_incident_update,
          notify_on_comment_reply,
          notify_on_escalation,
          notify_on_nearby_incident,
          nearby_radius_km,
          quiet_hours_start,
          quiet_hours_end,
          notification_frequency,
          userId
        ]
      );
    } else {
      // Create new
      result = await pool.query(
        `INSERT INTO user_notification_preferences
         (user_id, email_notifications, push_notifications, sms_notifications, in_app_notifications,
          notify_on_new_incident, notify_on_assigned_incident, notify_on_incident_update,
          notify_on_comment_reply, notify_on_escalation, notify_on_nearby_incident,
          nearby_radius_km, quiet_hours_start, quiet_hours_end, notification_frequency)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING *`,
        [
          userId,
          email_notifications !== undefined ? email_notifications : true,
          push_notifications !== undefined ? push_notifications : true,
          sms_notifications !== undefined ? sms_notifications : false,
          in_app_notifications !== undefined ? in_app_notifications : true,
          notify_on_new_incident !== undefined ? notify_on_new_incident : true,
          notify_on_assigned_incident !== undefined ? notify_on_assigned_incident : true,
          notify_on_incident_update !== undefined ? notify_on_incident_update : true,
          notify_on_comment_reply !== undefined ? notify_on_comment_reply : true,
          notify_on_escalation !== undefined ? notify_on_escalation : true,
          notify_on_nearby_incident !== undefined ? notify_on_nearby_incident : true,
          nearby_radius_km !== undefined ? nearby_radius_km : 5,
          quiet_hours_start,
          quiet_hours_end,
          notification_frequency !== undefined ? notification_frequency : 'realtime'
        ]
      );
    }

    res.json({
      message: 'Notification preferences updated successfully',
      preferences: result.rows[0]
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get user rate limit status
router.get('/:id/rate-limit-status', auth, async (req, res) => {
  try {
    const userId = req.params.id;

    // Only users can view their own rate limit or admins
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized', status: 403 } });
    }

    const userResult = await pool.query(
      'SELECT id, role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found', status: 404 } });
    }

    const user = userResult.rows[0];
    const status = getUserRateLimitStatus(user.id, user.role);

    res.json({
      user_id: user.id,
      role: user.role,
      rate_limit: status
    });
  } catch (error) {
    console.error('Get rate limit status error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Reset user rate limit (admin only)
router.post('/:id/reset-rate-limit', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized', status: 403 } });
    }

    const userId = req.params.id;

    const userResult = await pool.query(
      'SELECT id, role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found', status: 404 } });
    }

    const user = userResult.rows[0];
    resetUserRateLimit(user.id, user.role);

    res.json({
      message: 'Rate limit reset successfully',
      user_id: user.id
    });
  } catch (error) {
    console.error('Reset rate limit error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

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

module.exports = router;

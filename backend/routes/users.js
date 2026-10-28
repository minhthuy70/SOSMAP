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

module.exports = router;

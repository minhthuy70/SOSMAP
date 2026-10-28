const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { adminAuth } = require('../middleware/auth');
const pool = require('../config/database');

// Get all users with their roles
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { role, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT id, email, name, phone, role, created_at FROM users WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (role) {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Update user role (admin only)
router.put('/users/:id/role', [
  adminAuth,
  body('role').isIn(['user', 'moderator', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role } = req.body;

    // Prevent admin from changing their own role
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: { message: 'Cannot change your own role', status: 400 } });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, name, role',
      [role, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found', status: 404 } });
    }

    res.json({ message: 'User role updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Deactivate user (admin only)
router.put('/users/:id/deactivate', adminAuth, async (req, res) => {
  try {
    // Prevent admin from deactivating themselves
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: { message: 'Cannot deactivate your own account', status: 400 } });
    }

    const result = await pool.query(
      'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id, email, name',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found', status: 404 } });
    }

    res.json({ message: 'User deactivated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Activate user (admin only)
router.put('/users/:id/activate', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE users SET is_active = true, updated_at = NOW() WHERE id = $1 RETURNING id, email, name',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found', status: 404 } });
    }

    res.json({ message: 'User activated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get role statistics
router.get('/statistics', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC'
    );

    res.json({ statistics: result.rows });
  } catch (error) {
    console.error('Get role statistics error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const pool = require('../config/database');
const { sendIncidentUpdate } = require('../services/websocket');

// Get comments for an incident
router.get('/incident/:incidentId', auth, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    // Check if incident exists
    const incidentResult = await pool.query(
      'SELECT id FROM incidents WHERE id = $1',
      [req.params.incidentId]
    );

    if (incidentResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Incident not found', status: 404 } });
    }

    // Get comments (internal comments only for admins/moderators)
    let query = 'SELECT * FROM incident_comments WHERE incident_id = $1';
    const params = [req.params.incidentId];

    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      query += ' AND is_internal = false';
    }

    query += ' ORDER BY created_at ASC LIMIT $2 OFFSET $3';
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({ comments: result.rows });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Add comment to incident
router.post('/incident/:incidentId', auth, [
  body('comment').trim().notEmpty().isLength({ min: 1, max: 2000 }),
  body('is_internal').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { comment, is_internal } = req.body;

    // Check if incident exists
    const incidentResult = await pool.query(
      'SELECT id, title FROM incidents WHERE id = $1',
      [req.params.incidentId]
    );

    if (incidentResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Incident not found', status: 404 } });
    }

    // Only admins/moderators can add internal comments
    if (is_internal && req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ error: { message: 'Only admins can add internal comments', status: 403 } });
    }

    const result = await pool.query(
      `INSERT INTO incident_comments (incident_id, user_id, comment, is_internal)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.params.incidentId, req.user.id, comment, is_internal || false]
    );

    const newComment = result.rows[0];

    // Broadcast update
    sendIncidentUpdate(req.params.incidentId, {
      action: 'comment_added',
      comment: newComment
    });

    res.status(201).json({ message: 'Comment added successfully', comment: newComment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Update comment
router.put('/:id', auth, [
  body('comment').trim().notEmpty().isLength({ min: 1, max: 2000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { comment } = req.body;

    // Check if comment exists and user owns it or is admin
    const commentResult = await pool.query(
      'SELECT * FROM incident_comments WHERE id = $1',
      [req.params.id]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Comment not found', status: 404 } });
    }

    const existingComment = commentResult.rows[0];

    if (existingComment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized to update this comment', status: 403 } });
    }

    const result = await pool.query(
      `UPDATE incident_comments
       SET comment = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [comment, req.params.id]
    );

    const updatedComment = result.rows[0];

    // Broadcast update
    sendIncidentUpdate(existingComment.incident_id, {
      action: 'comment_updated',
      comment: updatedComment
    });

    res.json({ message: 'Comment updated successfully', comment: updatedComment });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Delete comment
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if comment exists and user owns it or is admin
    const commentResult = await pool.query(
      'SELECT * FROM incident_comments WHERE id = $1',
      [req.params.id]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Comment not found', status: 404 } });
    }

    const existingComment = commentResult.rows[0];

    if (existingComment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized to delete this comment', status: 403 } });
    }

    await pool.query(
      'DELETE FROM incident_comments WHERE id = $1',
      [req.params.id]
    );

    // Broadcast update
    sendIncidentUpdate(existingComment.incident_id, {
      action: 'comment_deleted',
      commentId: req.params.id
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

module.exports = router;

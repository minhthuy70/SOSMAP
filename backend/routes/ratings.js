const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const pool = require('../config/database');
const { sendIncidentUpdate } = require('../services/websocket');

// Get ratings for an incident
router.get('/incident/:incidentId', async (req, res) => {
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

    // Get ratings
    const result = await pool.query(
      `SELECT ir.*, u.name as user_name
       FROM incident_ratings ir
       LEFT JOIN users u ON ir.user_id = u.id
       WHERE ir.incident_id = $1
       ORDER BY ir.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.incidentId, limit, offset]
    );

    // Get average rating
    const avgResult = await pool.query(
      'SELECT AVG(rating) as average, COUNT(*) as total FROM incident_ratings WHERE incident_id = $1',
      [req.params.incidentId]
    );

    res.json({
      ratings: result.rows,
      average: parseFloat(avgResult.rows[0].average || 0).toFixed(1),
      total: parseInt(avgResult.rows[0].total || 0)
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get user's rating for an incident
router.get('/incident/:incidentId/user', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM incident_ratings WHERE incident_id = $1 AND user_id = $2',
      [req.params.incidentId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({ rated: false });
    }

    res.json({ rated: true, rating: result.rows[0] });
  } catch (error) {
    console.error('Get user rating error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Add/update rating for incident
router.post('/incident/:incidentId', auth, [
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rating, comment } = req.body;

    // Check if incident exists
    const incidentResult = await pool.query(
      'SELECT id, title FROM incidents WHERE id = $1',
      [req.params.incidentId]
    );

    if (incidentResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Incident not found', status: 404 } });
    }

    // Check if user already rated this incident
    const existingResult = await pool.query(
      'SELECT * FROM incident_ratings WHERE incident_id = $1 AND user_id = $2',
      [req.params.incidentId, req.user.id]
    );

    let ratingResult;

    if (existingResult.rows.length > 0) {
      // Update existing rating
      ratingResult = await pool.query(
        `UPDATE incident_ratings
         SET rating = $1, comment = $2, updated_at = NOW()
         WHERE incident_id = $3 AND user_id = $4
         RETURNING *`,
        [rating, comment, req.params.incidentId, req.user.id]
      );
    } else {
      // Insert new rating
      ratingResult = await pool.query(
        `INSERT INTO incident_ratings (incident_id, user_id, rating, comment)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [req.params.incidentId, req.user.id, rating, comment]
      );
    }

    const newRating = ratingResult.rows[0];

    // Broadcast update
    sendIncidentUpdate(req.params.incidentId, {
      action: 'rating_updated',
      rating: newRating
    });

    res.status(201).json({ message: 'Rating saved successfully', rating: newRating });
  } catch (error) {
    console.error('Add rating error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Delete rating
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if rating exists and user owns it or is admin
    const ratingResult = await pool.query(
      'SELECT * FROM incident_ratings WHERE id = $1',
      [req.params.id]
    );

    if (ratingResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Rating not found', status: 404 } });
    }

    const existingRating = ratingResult.rows[0];

    if (existingRating.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized to delete this rating', status: 403 } });
    }

    await pool.query(
      'DELETE FROM incident_ratings WHERE id = $1',
      [req.params.id]
    );

    // Broadcast update
    sendIncidentUpdate(existingRating.incident_id, {
      action: 'rating_deleted',
      ratingId: req.params.id
    });

    res.json({ message: 'Rating deleted successfully' });
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

module.exports = router;

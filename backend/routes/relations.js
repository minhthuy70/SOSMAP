const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const pool = require('../config/database');
const { sendIncidentUpdate } = require('../services/websocket');

// Get related incidents for an incident
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

    // Get related incidents
    const result = await pool.query(
      `SELECT ir.*, 
              i.title as related_title, 
              i.type as related_type,
              i.status as related_status,
              i.severity as related_severity,
              u.name as created_by_name
       FROM incident_relations ir
       LEFT JOIN incidents i ON ir.related_incident_id = i.id
       LEFT JOIN users u ON ir.created_by = u.id
       WHERE ir.incident_id = $1
       ORDER BY ir.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.incidentId, limit, offset]
    );

    res.json({ relations: result.rows });
  } catch (error) {
    console.error('Get relations error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Add relation between incidents
router.post('/', auth, [
  body('incident_id').isInt(),
  body('related_incident_id').isInt(),
  body('relation_type').isIn(['duplicate', 'follow_up', 'related', 'caused_by', 'causing']),
  body('notes').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { incident_id, related_incident_id, relation_type, notes } = req.body;

    // Check if both incidents exist
    const incidentResult = await pool.query(
      'SELECT id FROM incidents WHERE id IN ($1, $2)',
      [incident_id, related_incident_id]
    );

    if (incidentResult.rows.length < 2) {
      return res.status(404).json({ error: { message: 'One or both incidents not found', status: 404 } });
    }

    // Check if relation already exists
    const existingResult = await pool.query(
      'SELECT * FROM incident_relations WHERE incident_id = $1 AND related_incident_id = $2',
      [incident_id, related_incident_id]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: { message: 'Relation already exists', status: 409 } });
    }

    // Insert relation
    const result = await pool.query(
      `INSERT INTO incident_relations (incident_id, related_incident_id, relation_type, notes, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [incident_id, related_incident_id, relation_type, notes, req.user.id]
    );

    const newRelation = result.rows[0];

    // Broadcast updates for both incidents
    sendIncidentUpdate(incident_id, {
      action: 'relation_added',
      relation: newRelation
    });

    sendIncidentUpdate(related_incident_id, {
      action: 'relation_added',
      relation: newRelation
    });

    res.status(201).json({ message: 'Relation added successfully', relation: newRelation });
  } catch (error) {
    console.error('Add relation error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Delete relation
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if relation exists
    const relationResult = await pool.query(
      'SELECT * FROM incident_relations WHERE id = $1',
      [req.params.id]
    );

    if (relationResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Relation not found', status: 404 } });
    }

    const existingRelation = relationResult.rows[0];

    // Only admins or the creator can delete
    if (existingRelation.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized to delete this relation', status: 403 } });
    }

    await pool.query(
      'DELETE FROM incident_relations WHERE id = $1',
      [req.params.id]
    );

    // Broadcast updates for both incidents
    sendIncidentUpdate(existingRelation.incident_id, {
      action: 'relation_deleted',
      relationId: req.params.id
    });

    sendIncidentUpdate(existingRelation.related_incident_id, {
      action: 'relation_deleted',
      relationId: req.params.id
    });

    res.json({ message: 'Relation deleted successfully' });
  } catch (error) {
    console.error('Delete relation error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

module.exports = router;

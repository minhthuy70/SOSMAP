const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const pool = require('../config/database');
const upload = require('../middleware/upload');

// Get all incidents with filters
router.get('/', auth, async (req, res) => {
  try {
    const { type, severity, status, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM incidents WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (severity) {
      query += ` AND severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ incidents: result.rows });
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get single incident
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM incidents WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Incident not found', status: 404 } });
    }

    res.json({ incident: result.rows[0] });
  } catch (error) {
    console.error('Get incident error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Create incident
router.post('/', [
  auth,
  body('type').notEmpty(),
  body('title').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('latitude').isFloat(),
  body('longitude').isFloat(),
  body('severity').isIn(['low', 'medium', 'high', 'critical'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, title, description, latitude, longitude, severity, images } = req.body;

    const result = await pool.query(
      `INSERT INTO incidents (user_id, type, title, description, latitude, longitude, severity, status, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.user.id, type, title, description, latitude, longitude, severity, 'pending', images || []]
    );

    res.status(201).json({ message: 'Incident created successfully', incident: result.rows[0] });
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Update incident
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, severity, status } = req.body;

    const result = await pool.query(
      `UPDATE incidents
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           severity = COALESCE($3, severity),
           status = COALESCE($4, status),
           updated_at = NOW()
       WHERE id = $5 AND (user_id = $6 OR $7 = 'admin')
       RETURNING *`,
      [title, description, severity, status, req.params.id, req.user.id, req.user.role]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Incident not found or unauthorized', status: 404 } });
    }

    res.json({ message: 'Incident updated successfully', incident: result.rows[0] });
  } catch (error) {
    console.error('Update incident error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Delete incident
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM incidents WHERE id = $1 AND (user_id = $2 OR $3 = \'admin\') RETURNING *',
      [req.params.id, req.user.id, req.user.role]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Incident not found or unauthorized', status: 404 } });
    }

    res.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    console.error('Delete incident error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Upload images/videos for incident
router.post('/:id/upload', [auth, upload.array('files', 5)], async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: { message: 'No files uploaded', status: 400 } });
    }

    // Get incident
    const incidentResult = await pool.query(
      'SELECT * FROM incidents WHERE id = $1',
      [req.params.id]
    );

    if (incidentResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Incident not found', status: 404 } });
    }

    const incident = incidentResult.rows[0];

    // Check authorization
    if (incident.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized', status: 403 } });
    }

    // Get current images
    const currentImages = incident.images || [];

    // Add new file paths
    const newFiles = req.files.map(file => `/uploads/${file.filename}`);
    const updatedImages = [...currentImages, ...newFiles];

    // Update incident
    const updateResult = await pool.query(
      'UPDATE incidents SET images = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [JSON.stringify(updatedImages), req.params.id]
    );

    res.json({
      message: 'Files uploaded successfully',
      incident: updateResult.rows[0],
      uploadedFiles: newFiles
    });
  } catch (error) {
    console.error('Upload files error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Delete image from incident
router.delete('/:id/images/:filename', auth, async (req, res) => {
  try {
    const incidentResult = await pool.query(
      'SELECT * FROM incidents WHERE id = $1',
      [req.params.id]
    );

    if (incidentResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Incident not found', status: 404 } });
    }

    const incident = incidentResult.rows[0];

    // Check authorization
    if (incident.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized', status: 403 } });
    }

    const currentImages = incident.images || [];
    const filenameToDelete = `/uploads/${req.params.filename}`;

    const updatedImages = currentImages.filter(img => img !== filenameToDelete);

    const updateResult = await pool.query(
      'UPDATE incidents SET images = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [JSON.stringify(updatedImages), req.params.id]
    );

    res.json({
      message: 'Image deleted successfully',
      incident: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const pool = require('../config/database');
const upload = require('../middleware/upload');
const { broadcastIncidentUpdate, sendIncidentUpdate } = require('../services/websocket');
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');
const { clusterIncidents, detectEmergingHotspots, clusterByTime, getClusterStatistics } = require('../services/clustering');
const { autoCalculateSeverity, recalculateIncidentSeverity, batchRecalculateSeverity } = require('../services/severityCalculator');
const { findPotentialDuplicates, markAsDuplicate, getDuplicateIncidents, unmarkDuplicate, scanForDuplicates } = require('../services/duplicateDetection');

/**
 * @swagger
 * /api/incidents:
 *   get:
 *     summary: Get all incidents with filters
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, verified, in_progress, resolved, rejected]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of incidents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 incidents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Incident'
 *                 pagination:
 *                   type: object
 */

// Get all incidents with filters
router.get('/', auth, cacheMiddleware(60), async (req, res) => {
  try {
    const {
      type,
      severity,
      status,
      user_id,
      start_date,
      end_date,
      search,
      limit = 50,
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

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

    if (user_id) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }

    if (start_date) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    if (search) {
      // Full-text search with tsvector
      query += ` AND (to_tsvector('vietnamese', title || ' ' || description) @@ plainto_tsquery('vietnamese', $${paramIndex}) OR title ILIKE $${paramIndex + 1} OR description ILIKE $${paramIndex + 1})`;
      params.push(search, `%${search}%`);
      paramIndex += 2;
    }

    // Validate sort_by
    const validSortFields = ['created_at', 'updated_at', 'severity', 'status', 'type'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';

    // Validate sort_order
    const sortOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${sortField} ${sortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM incidents WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;

    if (type) {
      countQuery += ` AND type = $${countParamIndex}`;
      countParams.push(type);
      countParamIndex++;
    }

    if (severity) {
      countQuery += ` AND severity = $${countParamIndex}`;
      countParams.push(severity);
      countParamIndex++;
    }

    if (status) {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (user_id) {
      countQuery += ` AND user_id = $${countParamIndex}`;
      countParams.push(user_id);
      countParamIndex++;
    }

    if (start_date) {
      countQuery += ` AND created_at >= $${countParamIndex}`;
      countParams.push(start_date);
      countParamIndex++;
    }

    if (end_date) {
      countQuery += ` AND created_at <= $${countParamIndex}`;
      countParams.push(end_date);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (title ILIKE $${countParamIndex} OR description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      incidents: result.rows,
      pagination: {
        total: total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / limit)
      }
    });
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

    const { type, title, description, latitude, longitude, severity, images, is_anonymous } = req.body;

    // Check if user allows anonymous reporting
    if (is_anonymous) {
      const userResult = await pool.query(
        'SELECT allow_anonymous_reporting FROM users WHERE id = $1',
        [req.user.id]
      );

      if (userResult.rows.length === 0 || !userResult.rows[0].allow_anonymous_reporting) {
        return res.status(403).json({ error: { message: 'Anonymous reporting not allowed for this user', status: 403 } });
      }
    }

    const result = await pool.query(
      `INSERT INTO incidents (user_id, type, title, description, latitude, longitude, severity, status, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [is_anonymous ? null : req.user.id, type, title, description, latitude, longitude, severity, 'pending', images || []]
    );

    const incident = result.rows[0];

    // Invalidate cache for incidents
    invalidateCache('/incidents');

    // Broadcast to all connected clients
    broadcastIncidentUpdate({
      action: 'created',
      incident: incident
    });

    res.status(201).json({ message: 'Incident created successfully', incident: incident });
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Citizen reporting (without authentication)
router.post('/citizen', [
  body('type').notEmpty(),
  body('title').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('latitude').isFloat(),
  body('longitude').isFloat(),
  body('severity').isIn(['low', 'medium', 'high', 'critical']),
  body('contact_phone').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, title, description, latitude, longitude, severity, images, contact_phone } = req.body;

    // For citizen reporting, we don't require authentication
    // Store contact info in notes if provided
    const notes = contact_phone ? `Contact: ${contact_phone}` : null;

    const result = await pool.query(
      `INSERT INTO incidents (user_id, type, title, description, latitude, longitude, severity, status, images, notes)
       VALUES (NULL, $1, $2, $3, $4, $5, $6, 'pending', $7, $8)
       RETURNING *`,
      [type, title, description, latitude, longitude, severity, images || [], notes]
    );

    const incident = result.rows[0];

    // Broadcast to all connected clients
    broadcastIncidentUpdate({
      action: 'created',
      incident: incident
    });

    res.status(201).json({ message: 'Incident reported successfully. Thank you for your contribution!', incident: incident });
  } catch (error) {
    console.error('Citizen report error:', error);
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

    const incident = result.rows[0];

    // Invalidate cache for incidents
    invalidateCache('/incidents');

    // Send update to incident-specific room
    sendIncidentUpdate(req.params.id, {
      action: 'updated',
      incident: incident
    });

    res.json({ message: 'Incident updated successfully', incident: incident });
  } catch (error) {
    console.error('Update incident error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Assign incident to user
router.put('/:id/assign', auth, [
  body('assigned_to').isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { assigned_to, notes } = req.body;

    // Check if assigned user exists
    const userResult = await pool.query(
      'SELECT id, name FROM users WHERE id = $1',
      [assigned_to]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Assigned user not found', status: 404 } });
    }

    const result = await pool.query(
      `UPDATE incidents
       SET assigned_to = $1,
           assigned_at = NOW(),
           assigned_by = $2,
           notes = COALESCE($3, notes),
           status = 'in_progress',
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [assigned_to, req.user.id, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Incident not found', status: 404 } });
    }

    const incident = result.rows[0];

    // Send notification to assigned user
    const { sendPushNotification } = require('./notifications');
    sendPushNotification(assigned_to, 'Sự cố mới được phân công', incident.title, {
      incidentId: incident.id,
      type: 'incident_assigned'
    });

    // Broadcast update
    sendIncidentUpdate(req.params.id, {
      action: 'assigned',
      incident: incident
    });

    res.json({ message: 'Incident assigned successfully', incident: incident });
  } catch (error) {
    console.error('Assign incident error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Unassign incident
router.put('/:id/unassign', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE incidents
       SET assigned_to = NULL,
           assigned_at = NULL,
           assigned_by = NULL,
           status = 'pending',
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Incident not found', status: 404 } });
    }

    const incident = result.rows[0];

    // Broadcast update
    sendIncidentUpdate(req.params.id, {
      action: 'unassigned',
      incident: incident
    });

    res.json({ message: 'Incident unassigned successfully', incident: incident });
  } catch (error) {
    console.error('Unassign incident error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Escalate incident
router.put('/:id/escalate', auth, [
  body('escalation_level').isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { escalation_level, reason, auto_escalate_hours } = req.body;

    // Calculate auto-escalate time if specified
    let auto_escalate_at = null;
    if (auto_escalate_hours && auto_escalate_hours > 0) {
      auto_escalate_at = new Date(Date.now() + auto_escalate_hours * 60 * 60 * 1000);
    }

    const result = await pool.query(
      `UPDATE incidents
       SET escalation_level = $1,
           escalated_at = NOW(),
           escalated_by = $2,
           auto_escalate_at = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [escalation_level, req.user.id, auto_escalate_at, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Incident not found', status: 404 } });
    }

    const incident = result.rows[0];

    // Add escalation note if reason provided
    if (reason) {
      await pool.query(
        `UPDATE incidents
         SET notes = COALESCE(notes, '') || $1
         WHERE id = $2`,
        [`\n[Escalation L${escalation_level} by ${req.user.name} at ${new Date().toLocaleString()}]: ${reason}`, req.params.id]
      );
    }

    // Send notifications to admins for high escalation levels
    if (escalation_level >= 3) {
      const { sendPushNotification } = require('./notifications');
      const adminResult = await pool.query(
        'SELECT id FROM users WHERE role = $1',
        ['admin']
      );

      for (const admin of adminResult.rows) {
        sendPushNotification(admin.id, 'Sự cố đã được nâng cấp', `${incident.title} - Cấp độ ${escalation_level}`, {
          incidentId: incident.id,
          type: 'incident_escalated'
        });
      }
    }

    // Broadcast update
    sendIncidentUpdate(req.params.id, {
      action: 'escalated',
      incident: incident
    });

    res.json({ message: 'Incident escalated successfully', incident: incident });
  } catch (error) {
    console.error('Escalate incident error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// De-escalate incident
router.put('/:id/deescalate', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE incidents
       SET escalation_level = 0,
           escalated_at = NULL,
           escalated_by = NULL,
           auto_escalate_at = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Incident not found', status: 404 } });
    }

    const incident = result.rows[0];

    // Broadcast update
    sendIncidentUpdate(req.params.id, {
      action: 'deescalated',
      incident: incident
    });

    res.json({ message: 'Incident de-escalated successfully', incident: incident });
  } catch (error) {
    console.error('De-escalate incident error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get incident history/timeline
router.get('/:id/history', auth, async (req, res) => {
  try {
    // Check if incident exists
    const incidentResult = await pool.query(
      'SELECT id FROM incidents WHERE id = $1',
      [req.params.id]
    );

    if (incidentResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Incident not found', status: 404 } });
    }

    // Get audit logs for this incident
    const auditResult = await pool.query(
      `SELECT al.*, u.name as user_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.entity_type = 'incident' AND al.entity_id = $1
       ORDER BY al.created_at DESC
       LIMIT 100`,
      [req.params.id]
    );

    // Get comments for timeline
    const commentsResult = await pool.query(
      `SELECT ic.*, u.name as user_name, 'comment' as event_type
       FROM incident_comments ic
       LEFT JOIN users u ON ic.user_id = u.id
       WHERE ic.incident_id = $1
       ORDER BY ic.created_at DESC`,
      [req.params.id]
    );

    // Get status changes from incidents table (we'll need to track this separately)
    // For now, combine audit logs and comments

    const timeline = [];

    // Add audit logs
    auditResult.rows.forEach(log => {
      timeline.push({
        type: 'audit',
        action: log.action,
        description: log.description,
        user_name: log.user_name,
        created_at: log.created_at,
        details: log.details
      });
    });

    // Add comments
    commentsResult.rows.forEach(comment => {
      timeline.push({
        type: 'comment',
        action: 'comment_added',
        description: comment.comment,
        user_name: comment.user_name,
        created_at: comment.created_at,
        is_internal: comment.is_internal
      });
    });

    // Sort by date
    timeline.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ timeline: timeline });
  } catch (error) {
    console.error('Get incident history error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Verify incident
router.put('/:id/verify', auth, [
  body('verified').isBoolean(),
  body('verification_notes').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { verified, verification_notes } = req.body;

    // Only admins and moderators can verify
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ error: { message: 'Unauthorized to verify incidents', status: 403 } });
    }

    const result = await pool.query(
      `UPDATE incidents
       SET verified_by = $1,
           verified_at = CASE WHEN $2 = true THEN NOW() ELSE NULL END,
           status = CASE WHEN $2 = true THEN 'verified' ELSE status END,
           notes = CASE WHEN $3 IS NOT NULL THEN COALESCE(notes, '') || $3 ELSE notes END,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [req.user.id, verified, verification_notes ? `\n[Verification by ${req.user.name}]: ${verification_notes}` : null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Incident not found', status: 404 } });
    }

    const incident = result.rows[0];

    // Broadcast update
    sendIncidentUpdate(req.params.id, {
      action: 'verified',
      incident: incident
    });

    res.json({ message: 'Incident verification updated successfully', incident: incident });
  } catch (error) {
    console.error('Verify incident error:', error);
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

    // Broadcast deletion
    sendIncidentUpdate(req.params.id, {
      action: 'deleted',
      incidentId: req.params.id
    });

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

// Get incident clusters
router.get('/clusters', auth, async (req, res) => {
  try {
    const { distance_threshold = 1, min_incidents = 2 } = req.query;

    const result = await pool.query(
      'SELECT id, type, title, description, latitude, longitude, severity, status, created_at FROM incidents WHERE latitude IS NOT NULL AND longitude IS NOT NULL'
    );

    const incidents = result.rows;
    const clusters = clusterIncidents(
      incidents,
      parseFloat(distance_threshold),
      parseInt(min_incidents)
    );

    res.json({
      clusters: clusters,
      total_incidents: incidents.length,
      cluster_count: clusters.length
    });
  } catch (error) {
    console.error('Get clusters error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get emerging hotspots
router.get('/hotspots', auth, async (req, res) => {
  try {
    const { time_window_hours = 24 } = req.query;

    const result = await pool.query(
      'SELECT id, type, title, description, latitude, longitude, severity, status, created_at FROM incidents WHERE latitude IS NOT NULL AND longitude IS NOT NULL ORDER BY created_at DESC'
    );

    const incidents = result.rows;
    const hotspots = detectEmergingHotspots(incidents, parseInt(time_window_hours));

    res.json({
      hotspots: hotspots,
      total_recent_incidents: incidents.length,
      hotspot_count: hotspots.length
    });
  } catch (error) {
    console.error('Get hotspots error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get temporal clusters
router.get('/temporal-clusters', auth, async (req, res) => {
  try {
    const { time_window_minutes = 60 } = req.query;

    const result = await pool.query(
      'SELECT id, type, title, description, latitude, longitude, severity, status, created_at FROM incidents ORDER BY created_at ASC'
    );

    const incidents = result.rows;
    const temporalClusters = clusterByTime(incidents, parseInt(time_window_minutes));

    res.json({
      temporal_clusters: temporalClusters,
      total_incidents: incidents.length,
      cluster_count: temporalClusters.length
    });
  } catch (error) {
    console.error('Get temporal clusters error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get cluster statistics
router.get('/cluster-stats', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, type, title, description, latitude, longitude, severity, status, created_at FROM incidents WHERE latitude IS NOT NULL AND longitude IS NOT NULL'
    );

    const incidents = result.rows;
    const stats = getClusterStatistics(incidents);

    res.json(stats);
  } catch (error) {
    console.error('Get cluster stats error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get incident timeline with filters
router.get('/:id/timeline', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      event_type,
      start_date,
      end_date,
      limit = 50
    } = req.query;

    // Verify incident exists
    const incidentResult = await pool.query(
      'SELECT id FROM incidents WHERE id = $1',
      [id]
    );

    if (incidentResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Incident not found', status: 404 } });
    }

    let query = `
      SELECT 
        'incident' as event_type,
        id as event_id,
        created_at,
        'created' as action,
        json_build_object(
          'title', title,
          'type', type,
          'severity', severity,
          'status', status
        ) as details
      FROM incidents WHERE id = $1
    `;
    const params = [id];
    let paramIndex = 2;

    // Add comments
    query += `
      UNION ALL
      SELECT 
        'comment' as event_type,
        ic.id as event_id,
        ic.created_at,
        'commented' as action,
        json_build_object(
          'comment', ic.comment,
          'user_id', ic.user_id
        ) as details
      FROM incident_comments ic WHERE ic.incident_id = $1
    `;

    // Add ratings
    query += `
      UNION ALL
      SELECT 
        'rating' as event_type,
        ir.id as event_id,
        ir.created_at,
        'rated' as action,
        json_build_object(
          'rating', ir.rating,
          'user_id', ir.user_id
        ) as details
      FROM incident_ratings ir WHERE ir.incident_id = $1
    `;

    // Add relations
    query += `
      UNION ALL
      SELECT 
        'relation' as event_type,
        irel.id as event_id,
        irel.created_at,
        'related' as action,
        json_build_object(
          'related_incident_id', irel.related_incident_id,
          'relation_type', irel.relation_type,
          'created_by', irel.created_by
        ) as details
      FROM incident_relations irel WHERE irel.incident_id = $1
    `;

    // Add assignments
    query += `
      UNION ALL
      SELECT 
        'assignment' as event_type,
        ia.id as event_id,
        ia.created_at,
        'assigned' as action,
        json_build_object(
          'assigned_to', ia.assigned_to,
          'assigned_by', ia.assigned_by,
          'status', ia.status
        ) as details
      FROM incident_assignments ia WHERE ia.incident_id = $1
    `;

    // Add escalations
    query += `
      UNION ALL
      SELECT 
        'escalation' as event_type,
        ie.id as event_id,
        ie.created_at,
        'escalated' as action,
        json_build_object(
          'escalated_to', ie.escalated_to,
          'escalated_by', ie.escalated_by,
          'reason', ie.reason
        ) as details
      FROM incident_escalations ie WHERE ie.incident_id = $1
    `;

    // Add audit logs
    query += `
      UNION ALL
      SELECT 
        'audit' as event_type,
        al.id as event_id,
        al.created_at,
        al.action,
        json_build_object(
          'entity_type', al.entity_type,
          'entity_id', al.entity_id,
          'details', al.details
        ) as details
      FROM audit_logs al WHERE al.entity_type = 'incident' AND al.entity_id::text = $1
    `;

    // Apply filters
    if (event_type) {
      query += ` AND event_type = $${paramIndex}`;
      params.push(event_type);
      paramIndex++;
    }

    if (start_date) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    res.json({
      incident_id: id,
      timeline: result.rows,
      total_events: result.rows.length
    });
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Auto-calculate severity for an incident
router.post('/:id/calculate-severity', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await recalculateIncidentSeverity(pool, id);

    res.json({
      message: 'Severity recalculated successfully',
      result
    });
  } catch (error) {
    console.error('Calculate severity error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Batch calculate severity for multiple incidents
router.post('/batch-calculate-severity', auth, async (req, res) => {
  try {
    const { incident_ids } = req.body;

    if (!Array.isArray(incident_ids) || incident_ids.length === 0) {
      return res.status(400).json({ error: { message: 'incident_ids must be a non-empty array', status: 400 } });
    }

    const results = await batchRecalculateSeverity(pool, incident_ids);

    res.json({
      message: 'Batch severity calculation completed',
      results
    });
  } catch (error) {
    console.error('Batch calculate severity error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Find potential duplicates for an incident
router.get('/:id/duplicates', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    const incidentResult = await pool.query(
      'SELECT * FROM incidents WHERE id = $1',
      [id]
    );

    if (incidentResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Incident not found', status: 404 } });
    }

    const incident = incidentResult.rows[0];
    const duplicates = await findPotentialDuplicates(pool, incident, parseInt(limit));

    res.json({
      incident_id: id,
      potential_duplicates: duplicates,
      count: duplicates.length
    });
  } catch (error) {
    console.error('Find duplicates error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Mark incident as duplicate
router.post('/:id/mark-duplicate', auth, [
  body('original_incident_id').notEmpty().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { original_incident_id } = req.body;

    // Verify original incident exists
    const originalResult = await pool.query(
      'SELECT id FROM incidents WHERE id = $1',
      [original_incident_id]
    );

    if (originalResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Original incident not found', status: 404 } });
    }

    const result = await markAsDuplicate(pool, id, original_incident_id, req.user.id);

    res.json({
      message: 'Incident marked as duplicate successfully',
      result
    });
  } catch (error) {
    console.error('Mark duplicate error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get all duplicate incidents
router.get('/duplicates', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized', status: 403 } });
    }

    const duplicates = await getDuplicateIncidents(pool);

    res.json({
      duplicates,
      count: duplicates.length
    });
  } catch (error) {
    console.error('Get duplicates error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Unmark incident as duplicate
router.post('/:id/unmark-duplicate', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized', status: 403 } });
    }

    const result = await unmarkDuplicate(pool, id);

    res.json({
      message: 'Incident unmarked as duplicate successfully',
      result
    });
  } catch (error) {
    console.error('Unmark duplicate error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Scan for duplicates
router.post('/scan-duplicates', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized', status: 403 } });
    }

    const { time_window_hours = 24 } = req.body;

    const result = await scanForDuplicates(pool, time_window_hours);

    res.json({
      message: 'Duplicate scan completed',
      result
    });
  } catch (error) {
    console.error('Scan duplicates error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

module.exports = router;

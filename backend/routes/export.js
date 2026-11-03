const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const pool = require('../config/database');

/**
 * Export user activity data
 * GET /api/users/:id/export?format=csv|excel&start_date=&end_date=
 */

router.get('/:id/export', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'csv', start_date, end_date } = req.query;

    // Only users can export their own data or admins
    if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized', status: 403 } });
    }

    let query = `
      SELECT 
        u.id as user_id,
        u.email,
        u.name,
        i.id as incident_id,
        i.title,
        i.type,
        i.severity,
        i.status,
        i.created_at as incident_created_at,
        ic.comment,
        ir.rating,
        al.action as audit_action,
        al.created_at as event_date
      FROM users u
      LEFT JOIN incidents i ON u.id = i.user_id
      LEFT JOIN incident_comments ic ON i.id = ic.incident_id
      LEFT JOIN incident_ratings ir ON i.id = ir.incident_id
      LEFT JOIN audit_logs al ON u.id = al.user_id
      WHERE u.id = $1
    `;
    const params = [id];
    let paramIndex = 2;

    if (start_date) {
      query += ` AND COALESCE(i.created_at, ic.created_at, ir.created_at, al.created_at) >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND COALESCE(i.created_at, ic.created_at, ir.created_at, al.created_at) <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ` ORDER BY event_date DESC`;

    const result = await pool.query(query, params);
    const data = result.rows;

    if (format === 'csv') {
      // Generate CSV
      const headers = ['User ID', 'Email', 'Name', 'Incident ID', 'Title', 'Type', 'Severity', 'Status', 'Incident Date', 'Comment', 'Rating', 'Audit Action', 'Event Date'];
      const csvRows = [headers.join(',')];

      data.forEach(row => {
        const csvRow = [
          row.user_id,
          row.email,
          row.name,
          row.incident_id || '',
          `"${(row.title || '').replace(/"/g, '""')}"`,
          row.incident_type || '',
          row.severity || '',
          row.status || '',
          row.incident_created_at || '',
          `"${(row.comment || '').replace(/"/g, '""')}"`,
          row.rating || '',
          row.audit_action || '',
          row.event_date || ''
        ];
        csvRows.push(csvRow.join(','));
      });

      const csv = csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=user_activity_${id}_${Date.now()}.csv`);
      res.send(csv);

    } else if (format === 'excel') {
      // Return JSON for Excel generation on frontend
      res.setHeader('Content-Type', 'application/json');
      res.json({
        data: data,
        filename: `user_activity_${id}_${Date.now()}.json`
      });

    } else {
      res.status(400).json({ error: { message: 'Invalid format. Use csv or excel', status: 400 } });
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

module.exports = router;

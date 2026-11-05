const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const pool = require('../config/database');
const { generateIncidentReport, generateAnalyticsReport, savePdfToFile } = require('../services/pdf');

// Get comprehensive dashboard analytics
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let interval = '7 days';
    if (period === '30d') interval = '30 days';
    if (period === '90d') interval = '90 days';
    if (period === '1y') interval = '1 year';

    // Total incidents
    const totalResult = await pool.query(
      `SELECT COUNT(*) as total FROM incidents WHERE created_at >= NOW() - INTERVAL '${interval}'`
    );

    // By type
    const typeResult = await pool.query(
      `SELECT type, COUNT(*) as count 
       FROM incidents 
       WHERE created_at >= NOW() - INTERVAL '${interval}'
       GROUP BY type 
       ORDER BY count DESC`
    );

    // By severity
    const severityResult = await pool.query(
      `SELECT severity, COUNT(*) as count 
       FROM incidents 
       WHERE created_at >= NOW() - INTERVAL '${interval}'
       GROUP BY severity 
       ORDER BY count DESC`
    );

    // By status
    const statusResult = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM incidents 
       WHERE created_at >= NOW() - INTERVAL '${interval}'
       GROUP BY status 
       ORDER BY count DESC`
    );

    // Daily trends
    const trendsResult = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM incidents
       WHERE created_at >= NOW() - INTERVAL '${interval}'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    // Hourly distribution
    const hourlyResult = await pool.query(
      `SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as count
       FROM incidents
       WHERE created_at >= NOW() - INTERVAL '${interval}'
       GROUP BY EXTRACT(HOUR FROM created_at)
       ORDER BY hour ASC`
    );

    // Geographic distribution (by province/city)
    const geoResult = await pool.query(
      `SELECT SUBSTRING(address FROM 1 FOR POSITION(',' IN address) - 1) as location, COUNT(*) as count
       FROM incidents
       WHERE address IS NOT NULL 
         AND created_at >= NOW() - INTERVAL '${interval}'
       GROUP BY location
       ORDER BY count DESC
       LIMIT 10`
    );

    // Top contributors
    const contributorsResult = await pool.query(
      `SELECT u.id, u.name, u.email, COUNT(i.id) as incident_count
       FROM users u
       JOIN incidents i ON u.id = i.user_id
       WHERE i.created_at >= NOW() - INTERVAL '${interval}'
       GROUP BY u.id, u.name, u.email
       ORDER BY incident_count DESC
       LIMIT 10`
    );

    // Resolution rate
    const resolutionResult = await pool.query(
      `SELECT 
         COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')) as resolved,
         COUNT(*) as total
       FROM incidents
       WHERE created_at >= NOW() - INTERVAL '${interval}'`
    );

    const resolutionRate = resolutionResult.rows[0].total > 0
      ? (resolutionResult.rows[0].resolved / resolutionResult.rows[0].total * 100).toFixed(2)
      : 0;

    // Average response time (time to first assignment)
    const responseTimeResult = await pool.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (ia.assigned_at - i.created_at)) / 60) as avg_minutes
       FROM incidents i
       JOIN incident_assignments ia ON i.id = ia.incident_id
       WHERE i.created_at >= NOW() - INTERVAL '${interval}'
         AND ia.assigned_at IS NOT NULL`
    );

    const avgResponseTime = responseTimeResult.rows[0].avg_minutes
      ? parseFloat(responseTimeResult.rows[0].avg_minutes).toFixed(2)
      : 0;

    res.json({
      period,
      summary: {
        total_incidents: parseInt(totalResult.rows[0].total),
        resolution_rate: parseFloat(resolutionRate),
        avg_response_time_minutes: parseFloat(avgResponseTime)
      },
      by_type: typeResult.rows,
      by_severity: severityResult.rows,
      by_status: statusResult.rows,
      daily_trends: trendsResult.rows,
      hourly_distribution: hourlyResult.rows,
      geographic_distribution: geoResult.rows,
      top_contributors: contributorsResult.rows
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get incident statistics
router.get('/incidents', auth, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const params = [];
    let paramIndex = 1;

    if (start_date && end_date) {
      dateFilter = `WHERE created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(start_date, end_date);
      paramIndex += 2;
    }

    // Total incidents
    const totalResult = await pool.query(
      `SELECT COUNT(*) as total FROM incidents ${dateFilter}`,
      params
    );

    // By type
    const typeResult = await pool.query(
      `SELECT type, COUNT(*) as count FROM incidents ${dateFilter} GROUP BY type ORDER BY count DESC`,
      params
    );

    // By severity
    const severityResult = await pool.query(
      `SELECT severity, COUNT(*) as count FROM incidents ${dateFilter} GROUP BY severity ORDER BY count DESC`,
      params
    );

    // By status
    const statusResult = await pool.query(
      `SELECT status, COUNT(*) as count FROM incidents ${dateFilter} GROUP BY status ORDER BY count DESC`,
      params
    );

    res.json({
      total: parseInt(totalResult.rows[0].total),
      by_type: typeResult.rows,
      by_severity: severityResult.rows,
      by_status: statusResult.rows
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get user statistics
router.get('/users', auth, async (req, res) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) as total FROM users');
    const activeUsers = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE created_at > NOW() - INTERVAL \'30 days\''
    );

    res.json({
      total_users: parseInt(totalUsers.rows[0].total),
      active_users: parseInt(activeUsers.rows[0].total)
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get incident trends (last 7 days)
router.get('/trends', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         DATE(created_at) as date,
         COUNT(*) as count
       FROM incidents
       WHERE created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    res.json({ trends: result.rows });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Export analytics to PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const params = [];
    let paramIndex = 1;

    if (start_date && end_date) {
      dateFilter = `WHERE created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(start_date, end_date);
      paramIndex += 2;
    }

    // Get analytics data
    const totalResult = await pool.query(
      `SELECT COUNT(*) as total FROM incidents ${dateFilter}`,
      params
    );

    const typeResult = await pool.query(
      `SELECT type, COUNT(*) as count FROM incidents ${dateFilter} GROUP BY type ORDER BY count DESC`,
      params
    );

    const severityResult = await pool.query(
      `SELECT severity, COUNT(*) as count FROM incidents ${dateFilter} GROUP BY severity ORDER BY count DESC`,
      params
    );

    const statusResult = await pool.query(
      `SELECT status, COUNT(*) as count FROM incidents ${dateFilter} GROUP BY status ORDER BY count DESC`,
      params
    );

    const analytics = {
      total: parseInt(totalResult.rows[0].total),
      by_type: typeResult.rows,
      by_severity: severityResult.rows,
      by_status: statusResult.rows
    };

    // Generate PDF
    const pdfBuffer = await generateAnalyticsReport(analytics);

    // Save to file
    const filename = `analytics-report-${Date.now()}.pdf`;
    const filePath = await savePdfToFile(pdfBuffer, filename);

    res.json({
      message: 'PDF generated successfully',
      filename: filename,
      downloadUrl: `/exports/${filename}`
    });
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

module.exports = router;

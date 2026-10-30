/**
 * Monitoring Dashboard Routes
 * Provides system metrics and monitoring data
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

/**
 * GET /api/monitoring/metrics
 * Get system metrics
 */
router.get('/metrics', (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    };
    
    logger.debug('Monitoring metrics retrieved');
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get metrics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics'
    });
  }
});

/**
 * GET /api/monitoring/status
 * Get overall system status
 */
router.get('/status', (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      status: 'operational',
      uptime: process.uptime(),
      memoryUsage: {
        used: process.memoryUsage().heapUsed / 1024 / 1024 + ' MB',
        total: process.memoryUsage().heapTotal / 1024 / 1024 + ' MB',
        rss: process.memoryUsage().rss / 1024 / 1024 + ' MB'
      },
      loadAverage: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal
    };
    
    // Add warning if memory usage is high
    if (status.loadAverage > 0.9) {
      status.status = 'warning';
      status.message = 'High memory usage';
    }
    
    logger.debug('Monitoring status retrieved');
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Failed to get status', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get status'
    });
  }
});

/**
 * GET /api/monitoring/logs
 * Get recent log entries
 */
router.get('/logs', (req, res) => {
  try {
    const { level = 'info', limit = 50 } = req.query;
    
    // In production, this would read from log files
    // For now, return a sample
    const logs = [
      { timestamp: new Date().toISOString(), level: 'info', message: 'System operational' },
      { timestamp: new Date(Date.now() - 60000).toISOString(), level: 'info', message: 'Health check passed' }
    ];
    
    logger.debug('Monitoring logs retrieved', { level, limit });
    res.json({
      success: true,
      data: logs.slice(0, limit)
    });
  } catch (error) {
    logger.error('Failed to get logs', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get logs'
    });
  }
});

/**
 * GET /api/monitoring/connections
 * Get active connections info
 */
router.get('/connections', (req, res) => {
  try {
    const { getConnectionStats, isInitialized } = require('../services/websocket');
    
    const connections = {
      timestamp: new Date().toISOString(),
      websocket: {
        initialized: isInitialized(),
        stats: getConnectionStats()
      }
    };
    
    logger.debug('Monitoring connections retrieved');
    res.json({
      success: true,
      data: connections
    });
  } catch (error) {
    logger.error('Failed to get connections', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get connections'
    });
  }
});

module.exports = router;

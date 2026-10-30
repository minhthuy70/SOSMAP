/**
 * Telemetry Routes
 * Handles telemetry data collection from frontend
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// In-memory storage for telemetry (replace with database in production)
const telemetryStore = {
  pageViews: [],
  userActions: [],
  performance: [],
  errors: []
};

/**
 * POST /api/telemetry
 * Receive telemetry data from frontend
 */
router.post('/', async (req, res) => {
  try {
    const { type, data, timestamp } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({
        success: false,
        error: 'Type and data are required'
      });
    }
    
    // Store telemetry based on type
    switch (type) {
      case 'page_view':
        telemetryStore.pageViews.push({ ...data, receivedAt: new Date().toISOString() });
        break;
      case 'user_action':
        telemetryStore.userActions.push({ ...data, receivedAt: new Date().toISOString() });
        break;
      case 'performance':
      case 'api_call':
        telemetryStore.performance.push({ ...data, receivedAt: new Date().toISOString() });
        break;
      case 'error':
        telemetryStore.errors.push({ ...data, receivedAt: new Date().toISOString() });
        logger.error('Telemetry error received', data);
        break;
      default:
        logger.warn('Unknown telemetry type', { type });
    }
    
    logger.debug('Telemetry received', { type });
    
    res.json({
      success: true,
      message: 'Telemetry received'
    });
  } catch (error) {
    logger.error('Telemetry processing error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to process telemetry'
    });
  }
});

/**
 * GET /api/telemetry/summary
 * Get telemetry summary (admin only)
 */
router.get('/summary', (req, res) => {
  const summary = {
    pageViews: telemetryStore.pageViews.length,
    userActions: telemetryStore.userActions.length,
    performanceMetrics: telemetryStore.performance.length,
    errors: telemetryStore.errors.length,
    uniqueUsers: new Set([
      ...telemetryStore.pageViews.map(p => p.userId),
      ...telemetryStore.userActions.map(a => a.userId)
    ]).size
  };
  
  res.json({
    success: true,
    data: summary
  });
});

/**
 * GET /api/telemetry/:type
 * Get telemetry by type (admin only)
 */
router.get('/:type', (req, res) => {
  const { type } = req.params;
  const { limit = 100 } = req.query;
  
  let data = [];
  switch (type) {
    case 'pageViews':
      data = telemetryStore.pageViews.slice(-limit);
      break;
    case 'userActions':
      data = telemetryStore.userActions.slice(-limit);
      break;
    case 'performance':
      data = telemetryStore.performance.slice(-limit);
      break;
    case 'errors':
      data = telemetryStore.errors.slice(-limit);
      break;
    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid telemetry type'
      });
  }
  
  res.json({
    success: true,
    data,
    count: data.length
  });
});

/**
 * DELETE /api/telemetry
 * Clear telemetry data (admin only)
 */
router.delete('/', (req, res) => {
  telemetryStore.pageViews = [];
  telemetryStore.userActions = [];
  telemetryStore.performance = [];
  telemetryStore.errors = [];
  
  logger.info('Telemetry data cleared');
  
  res.json({
    success: true,
    message: 'Telemetry data cleared'
  });
});

module.exports = router;

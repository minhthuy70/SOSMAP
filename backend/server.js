const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const http = require('http');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Logging
const logger = require('./utils/logger');

// Initialize WebSocket
const { initializeWebSocket } = require('./services/websocket');
const io = initializeWebSocket(server);

// Initialize Email Service
const { initializeEmailService } = require('./services/email');
initializeEmailService();

// Swagger Documentation
const swaggerSpec = require('./swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/exports', express.static(path.join(__dirname, 'exports')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Detailed health check endpoint
app.get('/health/detailed', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0'
    };
    
    // Check database connection
    try {
      const db = require('./config/database');
      await db.query('SELECT 1');
      health.database = { status: 'connected' };
    } catch (error) {
      health.database = { status: 'disconnected', error: error.message };
      health.status = 'degraded';
    }
    
    // Check WebSocket
    const { isInitialized, getConnectionStats } = require('./services/websocket');
    health.websocket = {
      initialized: isInitialized(),
      connections: getConnectionStats()
    };
    
    // Check disk space (if available)
    const fs = require('fs');
    try {
      const stats = fs.statSync('.');
      health.disk = { available: true };
    } catch (error) {
      health.disk = { available: false, error: error.message };
    }
    
    res.json(health);
  } catch (error) {
    logger.error('Detailed health check error', { error: error.message });
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Readiness check endpoint
app.get('/health/ready', (req, res) => {
  const ready = {
    status: 'ready',
    timestamp: new Date().toISOString()
  };
  
  // Add any readiness checks here
  res.json(ready);
});

// Liveness check endpoint
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/layers', require('./routes/layers'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/telemetry', require('./routes/telemetry'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Not Found', status: 404 } });
});

// Start server
server.listen(PORT, () => {
  console.log(`SOSMAP Backend Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`WebSocket enabled`);
});

module.exports = { app, server, io };

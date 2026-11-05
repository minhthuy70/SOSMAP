/**
 * Request/Response Logging Middleware
 * Logs detailed information about incoming requests and outgoing responses
 */

const logger = require('../utils/logger');

/**
 * Log request details
 */
function logRequest(req, res, next) {
  const startTime = Date.now();
  
  // Log request
  logger.info('Incoming Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    contentType: req.get('content-type'),
    contentLength: req.get('content-length'),
    userId: req.user?.id,
    userRole: req.user?.role,
    query: req.query,
    // Don't log body for sensitive endpoints
    hasBody: !!req.body
  });
  
  // Store start time for response logging
  req.startTime = startTime;
  
  next();
}

/**
 * Log response details
 */
function logResponse(req, res, next) {
  const originalSend = res.send;
  
  res.send = function(data) {
    const responseTime = Date.now() - req.startTime;
    
    // Determine response category
    let category = 'info';
    if (res.statusCode >= 400 && res.statusCode < 500) {
      category = 'warn';
    } else if (res.statusCode >= 500) {
      category = 'error';
    }
    
    // Log response
    logger[category]('Outgoing Response', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      responseSize: data ? data.length : 0,
      userId: req.user?.id,
      userRole: req.user?.role
    });
    
    // Call original send
    originalSend.call(this, data);
  };
  
  next();
}

/**
 * Log errors
 */
function logError(err, req, res, next) {
  const responseTime = Date.now() - req.startTime;
  
  logger.error('Request Error', {
    method: req.method,
    url: req.originalUrl,
    error: err.message,
    stack: err.stack,
    statusCode: err.status || 500,
    responseTime: `${responseTime}ms`,
    userId: req.user?.id,
    userRole: req.user?.role,
    ip: req.ip
  });
  
  next(err);
}

/**
 * Log slow requests (performance monitoring)
 */
function logSlowRequests(thresholdMs = 1000) {
  return (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      
      if (responseTime > thresholdMs) {
        logger.warn('Slow Request Detected', {
          method: req.method,
          url: req.originalUrl,
          responseTime: `${responseTime}ms`,
          threshold: `${thresholdMs}ms`,
          userId: req.user?.id,
          ip: req.ip
        });
      }
    });
    
    next();
  };
}

/**
 * Sanitize sensitive data from request body
 */
function sanitizeBody(body) {
  if (!body) return null;
  
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Detailed logging middleware (with body)
 */
function detailedLogger(req, res, next) {
  const startTime = Date.now();
  
  logger.info('Detailed Request', {
    method: req.method,
    url: req.originalUrl,
    headers: {
      'content-type': req.get('content-type'),
      'user-agent': req.get('user-agent'),
      'authorization': req.get('authorization') ? '[REDACTED]' : undefined
    },
    query: req.query,
    body: sanitizeBody(req.body),
    ip: req.ip,
    userId: req.user?.id,
    userRole: req.user?.role
  });
  
  const originalSend = res.send;
  
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    
    logger.info('Detailed Response', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      responseSize: data ? data.length : 0
    });
    
    originalSend.call(this, data);
  };
  
  next();
}

module.exports = {
  logRequest,
  logResponse,
  logError,
  logSlowRequests,
  detailedLogger
};

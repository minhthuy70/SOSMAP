/**
 * Enhanced Logger Utility
 * Provides structured logging with different levels and outputs
 */

const fs = require('fs');
const path = require('path');

// Log levels
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

// Current log level from environment
const CURRENT_LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Log directory
const LOG_DIR = path.join(__dirname, '../logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Log file paths
const ERROR_LOG_FILE = path.join(LOG_DIR, 'error.log');
const COMBINED_LOG_FILE = path.join(LOG_DIR, 'combined.log');

/**
 * Format log entry with timestamp and level
 */
function formatLogEntry(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta
  };
  return JSON.stringify(logEntry);
}

/**
 * Write to log file
 */
function writeToFile(logFile, entry) {
  try {
    fs.appendFileSync(logFile, entry + '\n');
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

/**
 * Check if log level should be logged
 */
function shouldLog(level) {
  const levels = ['error', 'warn', 'info', 'debug'];
  const currentIndex = levels.indexOf(CURRENT_LOG_LEVEL);
  const levelIndex = levels.indexOf(level);
  return levelIndex <= currentIndex;
}

/**
 * Log error
 */
function error(message, meta = {}) {
  if (shouldLog('error')) {
    const entry = formatLogEntry(LOG_LEVELS.ERROR, message, meta);
    console.error(entry);
    writeToFile(ERROR_LOG_FILE, entry);
    writeToFile(COMBINED_LOG_FILE, entry);
  }
}

/**
 * Log warning
 */
function warn(message, meta = {}) {
  if (shouldLog('warn')) {
    const entry = formatLogEntry(LOG_LEVELS.WARN, message, meta);
    console.warn(entry);
    writeToFile(COMBINED_LOG_FILE, entry);
  }
}

/**
 * Log info
 */
function info(message, meta = {}) {
  if (shouldLog('info')) {
    const entry = formatLogEntry(LOG_LEVELS.INFO, message, meta);
    console.log(entry);
    writeToFile(COMBINED_LOG_FILE, entry);
  }
}

/**
 * Log debug
 */
function debug(message, meta = {}) {
  if (shouldLog('debug')) {
    const entry = formatLogEntry(LOG_LEVELS.DEBUG, message, meta);
    console.log(entry);
    writeToFile(COMBINED_LOG_FILE, entry);
  }
}

/**
 * Log API request
 */
function logRequest(req, res, next) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };
    
    if (res.statusCode >= 400) {
      error('API request failed', logData);
    } else {
      info('API request completed', logData);
    }
  });
  
  next();
}

/**
 * Log database query
 */
function logQuery(query, params, duration) {
  debug('Database query', {
    query: query.substring(0, 100),
    params: JSON.stringify(params),
    duration: `${duration}ms`
  });
}

/**
 * Log WebSocket event
 */
function logWebSocketEvent(event, data) {
  info('WebSocket event', {
    event,
    data: JSON.stringify(data).substring(0, 100)
  });
}

/**
 * Log authentication attempt
 */
function logAuthAttempt(success, userId, ip) {
  if (success) {
    info('Authentication successful', { userId, ip });
  } else {
    warn('Authentication failed', { userId, ip });
  }
}

/**
 * Log security event
 */
function logSecurityEvent(event, details) {
  error('Security event', { event, ...details });
}

/**
 * Clean old log files (older than 7 days)
 */
function cleanOldLogs() {
  try {
    const files = fs.readdirSync(LOG_DIR);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    files.forEach(file => {
      const filePath = path.join(LOG_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        info('Cleaned old log file', { file });
      }
    });
  } catch (error) {
    error('Failed to clean old logs', { error: error.message });
  }
}

// Clean old logs on startup
cleanOldLogs();

// Schedule log cleanup daily
setInterval(cleanOldLogs, 24 * 60 * 60 * 1000);

module.exports = {
  error,
  warn,
  info,
  debug,
  logRequest,
  logQuery,
  logWebSocketEvent,
  logAuthAttempt,
  logSecurityEvent,
  cleanOldLogs,
  LOG_LEVELS
};

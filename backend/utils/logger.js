/**
 * Enhanced Logger Utility
 * Provides structured logging with different levels and outputs
 */

const fs = require('fs');
const path = require('path');

// Log levels with priority
const LOG_LEVELS = {
  ERROR: { level: 0, name: 'error', color: '\x1b[31m' },
  WARN: { level: 1, name: 'warn', color: '\x1b[33m' },
  INFO: { level: 2, name: 'info', color: '\x1b[36m' },
  DEBUG: { level: 3, name: 'debug', color: '\x1b[90m' },
  TRACE: { level: 4, name: 'trace', color: '\x1b[37m' }
};

// Current log level from environment
const CURRENT_LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const CURRENT_LEVEL_PRIORITY = LOG_LEVELS[CURRENT_LOG_LEVEL.toUpperCase()]?.level || 2;

// Log directory
const LOG_DIR = path.join(__dirname, '../logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Log file paths
const ERROR_LOG_FILE = path.join(LOG_DIR, 'error.log');
const WARN_LOG_FILE = path.join(LOG_DIR, 'warn.log');
const INFO_LOG_FILE = path.join(LOG_DIR, 'info.log');
const DEBUG_LOG_FILE = path.join(LOG_DIR, 'debug.log');
const COMBINED_LOG_FILE = path.join(LOG_DIR, 'combined.log');

/**
 * Format log entry with timestamp and level
 */
function formatLogEntry(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.name,
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
  return level.level <= CURRENT_LEVEL_PRIORITY;
}

/**
 * Log error
 */
function error(message, meta = {}) {
  if (shouldLog(LOG_LEVELS.ERROR)) {
    const entry = formatLogEntry(LOG_LEVELS.ERROR, message, meta);
    console.error(LOG_LEVELS.ERROR.color + entry + '\x1b[0m');
    writeToFile(ERROR_LOG_FILE, entry);
    writeToFile(COMBINED_LOG_FILE, entry);
  }
}

/**
 * Log warning
 */
function warn(message, meta = {}) {
  if (shouldLog(LOG_LEVELS.WARN)) {
    const entry = formatLogEntry(LOG_LEVELS.WARN, message, meta);
    console.warn(LOG_LEVELS.WARN.color + entry + '\x1b[0m');
    writeToFile(WARN_LOG_FILE, entry);
    writeToFile(COMBINED_LOG_FILE, entry);
  }
}

/**
 * Log info
 */
function info(message, meta = {}) {
  if (shouldLog(LOG_LEVELS.INFO)) {
    const entry = formatLogEntry(LOG_LEVELS.INFO, message, meta);
    console.log(LOG_LEVELS.INFO.color + entry + '\x1b[0m');
    writeToFile(INFO_LOG_FILE, entry);
    writeToFile(COMBINED_LOG_FILE, entry);
  }
}

/**
 * Log debug
 */
function debug(message, meta = {}) {
  if (shouldLog(LOG_LEVELS.DEBUG)) {
    const entry = formatLogEntry(LOG_LEVELS.DEBUG, message, meta);
    console.log(LOG_LEVELS.DEBUG.color + entry + '\x1b[0m');
    writeToFile(DEBUG_LOG_FILE, entry);
    writeToFile(COMBINED_LOG_FILE, entry);
  }
}

/**
 * Log trace
 */
function trace(message, meta = {}) {
  if (shouldLog(LOG_LEVELS.TRACE)) {
    const entry = formatLogEntry(LOG_LEVELS.TRACE, message, meta);
    console.log(LOG_LEVELS.TRACE.color + entry + '\x1b[0m');
    writeToFile(DEBUG_LOG_FILE, entry);
    writeToFile(COMBINED_LOG_FILE, entry);
  }
}

/**
 * Set log level dynamically
 */
function setLogLevel(level) {
  const newLevel = LOG_LEVELS[level.toUpperCase()];
  if (newLevel) {
    process.env.LOG_LEVEL = level;
    info('Log level changed', { from: CURRENT_LOG_LEVEL, to: level });
  }
}

/**
 * Get current log level
 */
function getLogLevel() {
  return CURRENT_LOG_LEVEL;
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
 * Rotate log files
 */
function rotateLogs() {
  const logFiles = [
    ERROR_LOG_FILE,
    WARN_LOG_FILE,
    INFO_LOG_FILE,
    DEBUG_LOG_FILE,
    COMBINED_LOG_FILE
  ];
  
  logFiles.forEach(function(logFile) {
    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (stats.size > maxSize) {
        const backupFile = logFile + '.bak';
        if (fs.existsSync(backupFile)) {
          fs.unlinkSync(backupFile);
        }
        fs.renameSync(logFile, backupFile);
        info('Log file rotated', { file: logFile });
      }
    }
  });
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

// Initialize logging
rotateLogs();
cleanOldLogs();

// Schedule log rotation daily
setInterval(rotateLogs, 24 * 60 * 60 * 1000);
setInterval(cleanOldLogs, 24 * 60 * 60 * 1000);

module.exports = {
  error,
  warn,
  info,
  debug,
  trace,
  setLogLevel,
  getLogLevel,
  logRequest,
  logQuery,
  logWebSocketEvent,
  logAuthAttempt,
  logSecurityEvent,
  cleanOldLogs,
  rotateLogs,
  LOG_LEVELS
};

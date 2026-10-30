/**
 * Environment Validation Utility
 * Validates required environment variables and configuration
 * 
 * This module ensures that all required environment variables are set
 * and validates their formats before the application starts.
 * It also provides default values for optional variables.
 */

const logger = require('./logger');

// Required environment variables
const REQUIRED_ENV_VARS = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD'
];

// Optional environment variables with defaults
const OPTIONAL_ENV_VARS = {
  PORT: '3000',
  NODE_ENV: 'development',
  LOG_LEVEL: 'info',
  RATE_LIMIT_MAX_REQUESTS: '100',
  RATE_LIMIT_WINDOW_MS: '900000',
  JWT_SECRET: 'default-secret-change-in-production',
  CORS_ORIGIN: '*'
};

/**
 * Validate required environment variables
 */
function validateRequiredEnv() {
  const missing = [];
  
  REQUIRED_ENV_VARS.forEach(function(varName) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  if (missing.length > 0) {
    throw new Error('Missing required environment variables: ' + missing.join(', '));
  }
  
  logger.info('Required environment variables validated');
}

/**
 * Set default values for optional environment variables
 */
function setDefaultEnv() {
  Object.keys(OPTIONAL_ENV_VARS).forEach(function(varName) {
    if (!process.env[varName]) {
      process.env[varName] = OPTIONAL_ENV_VARS[varName];
      logger.debug('Set default environment variable', { varName, value: OPTIONAL_ENV_VARS[varName] });
    }
  });
}

/**
 * Validate environment variable format
 */
function validateEnvFormat() {
  const port = parseInt(process.env.PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error('Invalid PORT value: must be between 1 and 65535');
  }
  
  const dbPort = parseInt(process.env.DB_PORT);
  if (isNaN(dbPort) || dbPort < 1 || dbPort > 65535) {
    throw new Error('Invalid DB_PORT value: must be between 1 and 65535');
  }
  
  const validLogLevels = ['error', 'warn', 'info', 'debug', 'trace'];
  if (!validLogLevels.includes(process.env.LOG_LEVEL?.toLowerCase())) {
    logger.warn('Invalid LOG_LEVEL, defaulting to info', { LOG_LEVEL: process.env.LOG_LEVEL });
    process.env.LOG_LEVEL = 'info';
  }
  
  logger.info('Environment variable formats validated');
}

/**
 * Validate JWT secret strength
 */
function validateJWTSecret() {
  const secret = process.env.JWT_SECRET;
  
  if (secret === 'default-secret-change-in-production' && process.env.NODE_ENV === 'production') {
    logger.warn('Using default JWT secret in production - please change JWT_SECRET');
  }
  
  if (secret.length < 32) {
    logger.warn('JWT_SECRET is too short - should be at least 32 characters for security');
  }
  
  logger.info('JWT secret validated');
}

/**
 * Validate database connection string
 */
function validateDatabaseConfig() {
  const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  };
  
  if (!dbConfig.host || !dbConfig.database || !dbConfig.user) {
    throw new Error('Invalid database configuration');
  }
  
  logger.info('Database configuration validated', { host: dbConfig.host, database: dbConfig.database });
}

/**
 * Validate CORS configuration
 */
function validateCORSConfig() {
  const corsOrigin = process.env.CORS_ORIGIN;
  
  if (corsOrigin === '*' && process.env.NODE_ENV === 'production') {
    logger.warn('Using wildcard CORS origin in production - this may be insecure');
  }
  
  logger.info('CORS configuration validated', { corsOrigin });
}

/**
 * Validate email configuration
 */
function validateEmailConfig() {
  if (process.env.EMAIL_HOST) {
    if (!process.env.EMAIL_PORT) {
      logger.warn('EMAIL_HOST set but EMAIL_PORT missing, using default 587');
      process.env.EMAIL_PORT = '587';
    }
    
    if (!process.env.EMAIL_USER && process.env.NODE_ENV === 'production') {
      logger.warn('EMAIL_HOST set but EMAIL_USER missing in production');
    }
    
    logger.info('Email configuration validated');
  } else {
    logger.info('Email configuration not set - email features will be disabled');
  }
}

/**
 * Validate geocoding configuration
 */
function validateGeocodingConfig() {
  if (process.env.GEOCODING_PROVIDER) {
    const validProviders = ['openstreetmap', 'google', 'mapbox'];
    if (!validProviders.includes(process.env.GEOCODING_PROVIDER)) {
      logger.warn('Invalid GEOCODING_PROVIDER, defaulting to openstreetmap');
      process.env.GEOCODING_PROVIDER = 'openstreetmap';
    }
    
    logger.info('Geocoding configuration validated', { provider: process.env.GEOCODING_PROVIDER });
  } else {
    logger.info('Geocoding configuration not set - geocoding will use default provider');
  }
}

/**
 * Validate file upload configuration
 */
function validateUploadConfig() {
  const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default
  
  if (maxFileSize > 50 * 1024 * 1024) {
    logger.warn('MAX_FILE_SIZE is very large (>50MB), consider reducing for security');
  }
  
  process.env.MAX_FILE_SIZE = maxFileSize.toString();
  
  logger.info('Upload configuration validated', { maxFileSize: (maxFileSize / 1024 / 1024).toFixed(2) + 'MB' });
}

/**
 * Run all environment validations
 */
function validateEnvironment() {
  try {
    logger.info('Starting environment validation...');
    
    setDefaultEnv();
    validateRequiredEnv();
    validateEnvFormat();
    validateJWTSecret();
    validateDatabaseConfig();
    validateCORSConfig();
    validateEmailConfig();
    validateGeocodingConfig();
    validateUploadConfig();
    
    logger.info('Environment validation completed successfully');
    
    return {
      valid: true,
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT
    };
  } catch (error) {
    logger.error('Environment validation failed', { error: error.message });
    throw error;
  }
}

/**
 * Get environment summary
 */
function getEnvironmentSummary() {
  return {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    logLevel: process.env.LOG_LEVEL,
    dbHost: process.env.DB_HOST,
    corsOrigin: process.env.CORS_ORIGIN,
    hasEmail: !!process.env.EMAIL_HOST,
    hasGeocoding: !!process.env.GEOCODING_PROVIDER
  };
}

module.exports = {
  validateEnvironment,
  validateRequiredEnv,
  setDefaultEnv,
  validateEnvFormat,
  validateJWTSecret,
  validateDatabaseConfig,
  validateCORSConfig,
  validateEmailConfig,
  validateGeocodingConfig,
  validateUploadConfig,
  getEnvironmentSummary
};

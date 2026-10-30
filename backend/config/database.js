/**
 * Database Configuration
 * PostgreSQL connection pool configuration
 * 
 * This module sets up the PostgreSQL connection pool using pg library.
 * It reads connection parameters from environment variables.
 */

const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool with environment variables
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'sosmap',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;

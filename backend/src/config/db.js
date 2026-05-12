import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

// Enhanced connection pool configuration
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  
  // Connection pool settings
  max: parseInt(process.env.DB_POOL_MAX) || 25,           // Maximum connections
  min: parseInt(process.env.DB_POOL_MIN) || 5,            // Minimum connections
  
  // Timeout settings
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,     // 30s idle timeout
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT) || 5000, // 5s connection timeout
  acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 10000,   // 10s acquire timeout
  
  // Health check settings
  allowExitOnIdle: false,
  
  // SSL configuration - disable for Docker/local development
  ssl: false,
  
  // Query timeout
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000, // 30s query timeout
  
  // Statement timeout
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 60000, // 60s statement timeout
});

// Pool event handlers for monitoring
pool.on('connect', (client) => {
  console.log(`New client connected (PID: ${client.processID})`);
});

pool.on('acquire', (client) => {
  console.log(`Client acquired from pool (PID: ${client.processID})`);
});

pool.on('remove', (client) => {
  console.log(`Client removed from pool (PID: ${client.processID})`);
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client:', err);
  console.error('Client PID:', client?.processID);
});

// Enhanced connection function with better error handling and retries
export const connectDB = async (retries = 5) => {
  let attempt = 0;
  
  while (attempt < retries) {
    try {
      // Test connection with timeout
      const client = await pool.connect();
      
      try {
        // Verify database connectivity
        const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
        console.log('PostgreSQL connected successfully');
        console.log(`Database time: ${result.rows[0].current_time}`);
        console.log(`PostgreSQL version: ${result.rows[0].pg_version.split(' ')[0]}`);
        
        // Initialize schema
        const schema = readFileSync(join(__dirname, '../schema.sql'), 'utf8');
        await client.query(schema);
        console.log('Schema initialized successfully');
        
        // Log pool status
        console.log(`Connection pool status: ${pool.totalCount} total, ${pool.idleCount} idle, ${pool.waitingCount} waiting`);
        
        return;
      } finally {
        client.release();
      }
    } catch (err) {
      attempt++;
      console.error(`Database connection attempt ${attempt}/${retries} failed:`, err.message);
      
      if (attempt >= retries) {
        console.error('Could not connect to database after all retries');
        console.error('Full error:', err);
        process.exit(1);
      }
      
      // Exponential backoff: 3s, 6s, 12s, 24s, 48s
      const delay = Math.min(3000 * Math.pow(2, attempt - 1), 48000);
      console.log(`Retrying in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// Graceful shutdown handler
export const closeDB = async () => {
  try {
    console.log('Closing database connection pool...');
    await pool.end();
    console.log('Database connection pool closed successfully');
  } catch (err) {
    console.error('Error closing database pool:', err);
  }
};

// Health check function
export const checkDBHealth = async () => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT 1 as health_check');
      return {
        healthy: true,
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingConnections: pool.waitingCount,
        timestamp: new Date().toISOString()
      };
    } finally {
      client.release();
    }
  } catch (err) {
    return {
      healthy: false,
      error: err.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Query wrapper with automatic retry and logging
export const queryWithRetry = async (text, params, retries = 3) => {
  let attempt = 0;
  
  while (attempt < retries) {
    try {
      const start = Date.now();
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries (> 1 second)
      if (duration > 1000) {
        console.warn(`Slow query detected (${duration}ms):`, text.substring(0, 100));
      }
      
      return result;
    } catch (err) {
      attempt++;
      console.error(`Query attempt ${attempt}/${retries} failed:`, err.message);
      
      if (attempt >= retries) {
        console.error('Query failed after all retries:', text.substring(0, 100));
        throw err;
      }
      
      // Short delay before retry
      await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
    }
  }
};

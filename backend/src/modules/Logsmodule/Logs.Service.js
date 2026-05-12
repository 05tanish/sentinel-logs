import axios from 'axios';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { pool, queryWithRetry } from '../../config/db.js';
import { dbQueryWrapper, ValidationError, DatabaseError } from '../../middelware/ErrorMiddelware.js';
import { metrics } from '../../middelware/metrics.js';
import { parseLog } from './parser.js';

export { parseLog };

const LOKI_URL = process.env.LOKI_URL || 'http://loki:3100';

// ─── Loki ────────────────────────────────────────────────
export const fetchLogs = async () => {
  try {
    const response = await axios.get(`${LOKI_URL}/loki/api/v1/query`, {
      params: { query: '{job="sample_logs"}' },
      timeout: 10000 // 10 second timeout
    });
    return response.data;
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      throw new Error('Loki service unavailable');
    }
    throw new Error(`Loki query failed: ${err.message}`);
  }
};

export const fetchAndAnalyzeLogs = async () => {
  try {
    const response = await axios.get(`${LOKI_URL}/loki/api/v1/query`, {
      params: { query: '{job="sample_logs"}' },
      timeout: 10000
    });
    const logs = response.data.data.result[0]?.values || [];
    const logMessages = logs.map((l) => l[1]);
    return { logs: logMessages };
  } catch (err) {
    console.error('Loki analysis failed:', err.message);
    return { logs: [] }; // Return empty array instead of failing
  }
};

// ─── Ingestion with Enhanced Error Handling & Metrics ───────────────────────────────────────────
export const storeLog = async ({ raw, source, timestamp, parsed }) => {
  const startTime = Date.now();
  
  // Input validation
  if (!raw || typeof raw !== 'string') {
    throw new ValidationError('Raw log data is required and must be a string');
  }

  if (!source || typeof source !== 'string') {
    throw new ValidationError('Log source is required and must be a string');
  }

  // Validate parsed data structure
  if (parsed && typeof parsed !== 'object') {
    throw new ValidationError('Parsed data must be an object');
  }

  // Sanitize and validate timestamp
  let logTimestamp;
  if (timestamp) {
    logTimestamp = new Date(timestamp);
    if (isNaN(logTimestamp.getTime())) {
      console.warn(`Invalid timestamp provided: ${timestamp}, using current time`);
      logTimestamp = new Date();
    }
  } else {
    logTimestamp = new Date();
  }

  // Ensure parsed data has safe defaults
  const safeParsed = parsed || {};
  
  try {
    const result = await dbQueryWrapper(async () => {
      const result = await queryWithRetry(
        `INSERT INTO logs (raw, source, timestamp, ip_address, username, event_type, severity, parsed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, created_at`,
        [
          raw.substring(0, 10000), // Limit raw log size
          source.substring(0, 100), // Limit source size
          logTimestamp,
          safeParsed.ip_address?.substring(0, 45) || null,
          safeParsed.username?.substring(0, 100) || null,
          safeParsed.event_type?.substring(0, 100) || null,
          safeParsed.severity?.substring(0, 20) || null,
          JSON.stringify(safeParsed),
        ]
      );
      return result.rows[0];
    }, 'Store log query');

    // Record metrics
    const duration = Date.now() - startTime;
    metrics.recordDatabaseQuery('INSERT', 'logs', duration, 'success');
    metrics.recordLogIngestion(source, safeParsed.severity || 'UNKNOWN');

    return result;
  } catch (err) {
    // Record failed metrics
    const duration = Date.now() - startTime;
    metrics.recordDatabaseQuery('INSERT', 'logs', duration, 'error');
    throw err;
  }
};

// ─── File Upload / USB Ingestion with Better Error Handling & Metrics ─────────────────────────
export const processLogFile = async (filePath, source = 'file-upload') => {
  if (!filePath || typeof filePath !== 'string') {
    throw new ValidationError('File path is required');
  }

  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    let stream;
    let rl;
    
    try {
      stream = createReadStream(filePath, { encoding: 'utf8' });
      rl = createInterface({ input: stream });
    } catch (err) {
      return reject(new Error(`Failed to open file: ${err.message}`));
    }

    let processed = 0;
    let errors = 0;
    let skipped = 0;
    const promises = [];
    const errorDetails = [];

    // Set up error handlers
    const cleanup = () => {
      if (rl) rl.close();
      if (stream) stream.destroy();
    };

    const handleError = (err) => {
      cleanup();
      reject(new Error(`File processing failed: ${err.message}`));
    };

    stream.on('error', handleError);
    rl.on('error', handleError);

    rl.on('line', (line) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        skipped++;
        return;
      }

      // Skip lines that are too long (potential DoS protection)
      if (trimmedLine.length > 10000) {
        console.warn(`Skipping oversized log line (${trimmedLine.length} chars)`);
        skipped++;
        return;
      }

      const promise = (async () => {
        try {
          const parsed = parseLog(trimmedLine);
          await storeLog({ 
            raw: trimmedLine, 
            source: `${source}:${filePath}`, 
            parsed 
          });
          processed++;
        } catch (err) {
          errors++;
          errorDetails.push({
            line: trimmedLine.substring(0, 100),
            error: err.message
          });
          
          // Log first few errors for debugging
          if (errorDetails.length <= 5) {
            console.error(`Log processing error: ${err.message}`);
          }
        }
      })();

      promises.push(promise);
    });

    rl.on('close', async () => {
      try {
        await Promise.allSettled(promises);
        
        const result = { 
          processed, 
          errors, 
          skipped,
          total: processed + errors + skipped,
          duration: Date.now() - startTime
        };

        // Include error samples if there were errors
        if (errorDetails.length > 0) {
          result.errorSamples = errorDetails.slice(0, 5);
        }

        // Record file processing metrics
        metrics.recordDatabaseQuery('BULK_INSERT', 'logs', result.duration, 'success');

        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to complete file processing: ${err.message}`));
      } finally {
        cleanup();
      }
    });
  });
};

// ─── Enhanced Query Functions with Metrics ───────────────────────────────────────────
export const fetchLogsBySeverity = async (severity, limit = 100, offset = 0) => {
  const startTime = Date.now();
  
  // Input validation
  if (!severity || typeof severity !== 'string') {
    throw new ValidationError('Severity is required and must be a string');
  }

  const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
  const normalizedSeverity = severity.toUpperCase();
  
  if (!validSeverities.includes(normalizedSeverity)) {
    throw new ValidationError(`Invalid severity. Must be one of: ${validSeverities.join(', ')}`);
  }

  // Validate pagination parameters
  const safeLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 1000);
  const safeOffset = Math.max(parseInt(offset) || 0, 0);

  try {
    const result = await dbQueryWrapper(async () => {
      const result = await queryWithRetry(
        `SELECT id, raw, event_type, timestamp, ip_address, username, severity, source, created_at
         FROM logs 
         WHERE severity = $1 
         ORDER BY timestamp DESC, created_at DESC
         LIMIT $2 OFFSET $3`,
        [normalizedSeverity, safeLimit, safeOffset]
      );
      return result.rows;
    }, 'Fetch logs by severity query');

    // Record metrics
    const duration = Date.now() - startTime;
    metrics.recordDatabaseQuery('SELECT', 'logs', duration, 'success');

    return result;
  } catch (err) {
    // Record failed metrics
    const duration = Date.now() - startTime;
    metrics.recordDatabaseQuery('SELECT', 'logs', duration, 'error');
    throw err;
  }
};

// New function: Get log statistics with metrics
export const getLogStatistics = async (timeRange = '24 hours') => {
  const startTime = Date.now();
  
  const validRanges = ['1 hour', '24 hours', '7 days', '30 days'];
  if (!validRanges.includes(timeRange)) {
    throw new ValidationError(`Invalid time range. Must be one of: ${validRanges.join(', ')}`);
  }

  try {
    const result = await dbQueryWrapper(async () => {
      const result = await queryWithRetry(
        `SELECT 
           COUNT(*) as total_logs,
           COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical_count,
           COUNT(*) FILTER (WHERE severity = 'HIGH') as high_count,
           COUNT(*) FILTER (WHERE severity = 'MEDIUM') as medium_count,
           COUNT(*) FILTER (WHERE severity = 'LOW') as low_count,
           COUNT(DISTINCT source) as unique_sources,
           COUNT(DISTINCT ip_address) as unique_ips
         FROM logs 
         WHERE created_at >= NOW() - INTERVAL $1`,
        [timeRange]
      );
      return result.rows[0];
    }, 'Log statistics query');

    // Record metrics
    const duration = Date.now() - startTime;
    metrics.recordDatabaseQuery('SELECT', 'logs', duration, 'success');

    return result;
  } catch (err) {
    // Record failed metrics
    const duration = Date.now() - startTime;
    metrics.recordDatabaseQuery('SELECT', 'logs', duration, 'error');
    throw err;
  }
};

// New function: Search logs with full-text search and metrics
export const searchLogs = async (searchTerm, limit = 100, offset = 0) => {
  const startTime = Date.now();
  
  if (!searchTerm || typeof searchTerm !== 'string') {
    throw new ValidationError('Search term is required');
  }

  const safeLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 1000);
  const safeOffset = Math.max(parseInt(offset) || 0, 0);

  try {
    const result = await dbQueryWrapper(async () => {
      const result = await queryWithRetry(
        `SELECT id, raw, event_type, timestamp, ip_address, username, severity, source, created_at,
                ts_rank(to_tsvector('english', raw), plainto_tsquery('english', $1)) as rank
         FROM logs 
         WHERE to_tsvector('english', raw) @@ plainto_tsquery('english', $1)
         ORDER BY rank DESC, timestamp DESC
         LIMIT $2 OFFSET $3`,
        [searchTerm, safeLimit, safeOffset]
      );
      return result.rows;
    }, 'Search logs query');

    // Record metrics
    const duration = Date.now() - startTime;
    metrics.recordDatabaseQuery('SELECT', 'logs', duration, 'success');

    return result;
  } catch (err) {
    // Record failed metrics
    const duration = Date.now() - startTime;
    metrics.recordDatabaseQuery('SELECT', 'logs', duration, 'error');
    throw err;
  }
};

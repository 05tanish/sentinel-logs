import { pool } from '../config/db.js';

// Custom error classes for better error handling
export class DatabaseError extends Error {
  constructor(message, originalError = null, query = null) {
    super(message);
    this.name = 'DatabaseError';
    this.originalError = originalError;
    this.query = query;
    this.timestamp = new Date().toISOString();
  }
}

export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.timestamp = new Date().toISOString();
  }
}

export class NotFoundError extends Error {
  constructor(resource, id = null) {
    super(`${resource} not found${id ? ` with id: ${id}` : ''}`);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.id = id;
    this.timestamp = new Date().toISOString();
  }
}

// Enhanced error handler with detailed logging and monitoring
export const errorHandler = (err, req, res, next) => {
  // Log error details
  const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const errorLog = {
    id: errorId,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id || 'anonymous',
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      originalError: err.originalError?.message,
      query: err.query
    }
  };

  // Log to console (in production, this should go to a proper logging service)
  console.error('Error occurred:', JSON.stringify(errorLog, null, 2));

  // Determine status code and response based on error type
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = {};

  switch (err.name) {
    case 'ValidationError':
      statusCode = 400;
      message = err.message;
      details = { field: err.field };
      break;
      
    case 'NotFoundError':
      statusCode = 404;
      message = err.message;
      details = { resource: err.resource, id: err.id };
      break;
      
    case 'DatabaseError':
      statusCode = 500;
      message = 'Database operation failed';
      details = { query: err.query?.substring(0, 100) };
      break;
      
    case 'JsonWebTokenError':
      statusCode = 401;
      message = 'Invalid token';
      break;
      
    case 'TokenExpiredError':
      statusCode = 401;
      message = 'Token expired';
      break;
      
    case 'MulterError':
      statusCode = 400;
      message = `File upload error: ${err.message}`;
      break;
      
    case 'SyntaxError':
      if (err.message.includes('JSON')) {
        statusCode = 400;
        message = 'Invalid JSON format';
      }
      break;
      
    default:
      if (err.statusCode) {
        statusCode = err.statusCode;
        message = err.message;
      }
  }

  // Security: Don't expose sensitive information in production
  const response = {
    success: false,
    message,
    errorId,
    timestamp: errorLog.timestamp,
    ...details
  };

  // Include validation errors if present
  if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
    response.errors = err.errors;
  }

  // Include stack trace and additional details only in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.originalError = err.originalError?.message;
    if (!response.errors && err.errors) {
      response.errors = err.errors;
    }
  }

  // Send response
  res.status(statusCode).json(response);

  // Log to database for monitoring (async, don't wait)
  logErrorToDatabase(errorLog).catch(dbErr => {
    console.error('Failed to log error to database:', dbErr.message);
  });
};

// Async error logger for database storage
const logErrorToDatabase = async (errorLog) => {
  try {
    await pool.query(
      `INSERT INTO error_logs (id, timestamp, method, url, user_id, error_name, error_message, stack_trace, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        errorLog.id,
        errorLog.timestamp,
        errorLog.method,
        errorLog.url,
        errorLog.userId === 'anonymous' ? null : errorLog.userId,
        errorLog.error.name,
        errorLog.error.message,
        errorLog.error.stack,
        errorLog.ip
      ]
    );
  } catch (err) {
    // Don't throw here to avoid infinite error loops
    console.error('Database error logging failed:', err.message);
  }
};

// 404 handler for unmatched routes
export const notFoundHandler = (req, res) => {
  const errorId = `404_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.warn(`404 Not Found: ${req.method} ${req.url} from ${req.ip}`);
  
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
    errorId,
    timestamp: new Date().toISOString()
  });
};

// Async error wrapper to catch promise rejections
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Database query error wrapper
export const dbQueryWrapper = async (queryFn, queryText = 'Unknown query') => {
  try {
    return await queryFn();
  } catch (err) {
    // PostgreSQL specific error handling
    if (err.code) {
      switch (err.code) {
        case '23505': // unique_violation
          throw new ValidationError('Duplicate entry found', err.detail);
        case '23503': // foreign_key_violation
          throw new ValidationError('Referenced record does not exist', err.detail);
        case '23502': // not_null_violation
          throw new ValidationError('Required field is missing', err.column);
        case '22P02': // invalid_text_representation
          throw new ValidationError('Invalid data format', err.message);
        case '42P01': // undefined_table
          throw new DatabaseError('Table does not exist', err, queryText);
        case '42703': // undefined_column
          throw new DatabaseError('Column does not exist', err, queryText);
        default:
          throw new DatabaseError(`Database error (${err.code})`, err, queryText);
      }
    }
    
    throw new DatabaseError('Unknown database error', err, queryText);
  }
};

// Process-level error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.error('Stack:', err.stack);
  
  // Log to database if possible
  logErrorToDatabase({
    id: `UNCAUGHT_${Date.now()}`,
    timestamp: new Date().toISOString(),
    method: 'SYSTEM',
    url: 'N/A',
    userId: 'system',
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    }
  }).finally(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  // Log to database if possible
  logErrorToDatabase({
    id: `UNHANDLED_${Date.now()}`,
    timestamp: new Date().toISOString(),
    method: 'SYSTEM',
    url: 'N/A',
    userId: 'system',
    error: {
      name: 'UnhandledRejection',
      message: reason?.message || String(reason),
      stack: reason?.stack || 'No stack trace available'
    }
  }).catch(() => {
    // If we can't log to database, at least log to console
    console.error('Failed to log unhandled rejection to database');
  });
});

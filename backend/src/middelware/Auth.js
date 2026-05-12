import { AppError } from '../utilis/ApiResponse.js';
import { AsyncHandeler } from '../utilis/Aysnchandler.js';
import { verifyToken } from '../utilis/Jwt.js';
import { pool } from '../config/db.js';
import { dbQueryWrapper } from './ErrorMiddelware.js';
import { metrics } from './metrics.js';
import { recordAudit, AUDIT_ACTIONS } from '../utilis/AuditTrail.js';

// Enhanced authentication middleware with security improvements and metrics
export const authenticate = AsyncHandeler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    metrics.recordAuth('failure');
    throw new AppError(401, 'Invalid authorization format');
  }

  const token = authHeader.substring(7);

  // Validate token format (basic check)
  if (!token || token.length < 10) {
    metrics.recordAuth('failure');
    throw new AppError(401, 'Invalid token format');
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    // Log suspicious token attempts
    console.warn(`Invalid token attempt from ${req.ip}: ${err.message}`);
    metrics.recordAuth('failure');
    
    if (err.name === 'TokenExpiredError') {
      throw new AppError(401, 'Token expired');
    }
    if (err.name === 'JsonWebTokenError') {
      throw new AppError(401, 'Invalid token');
    }
    throw new AppError(401, 'Token verification failed');
  }

  // Validate token payload
  if (!decoded.id || !decoded.username) {
    metrics.recordAuth('failure');
    throw new AppError(401, 'Invalid token payload');
  }

  // Fetch user with security checks
  const user = await dbQueryWrapper(async () => {
    const result = await pool.query(
      'SELECT id, username, role, is_active, created_at FROM users WHERE id = $1',
      [decoded.id]
    );
    return result.rows[0];
  }, 'User authentication query');

  if (!user) {
    metrics.recordAuth('failure');
    throw new AppError(401, 'User not found');
  }

  if (!user.is_active) {
    metrics.recordAuth('failure');
    throw new AppError(401, 'Account deactivated');
  }

  // Check for username mismatch (token tampering)
  if (user.username !== decoded.username) {
    console.error(`Token username mismatch for user ${user.id}: token=${decoded.username}, db=${user.username}`);
    metrics.recordAuth('failure');
    throw new AppError(401, 'Token integrity violation');
  }

  // Record successful authentication
  metrics.recordAuth('success');

  // Add user info to request
  req.user = user;
  req.tokenIssued = decoded.iat;
  
  next();
});

// Role-based authorization middleware
export const authorize = (...allowedRoles) => {
  return AsyncHandeler(async (req, res, next) => {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.warn(`Unauthorized access attempt by user ${req.user.id} (${req.user.role}) to ${req.path}`);
      throw new AppError(403, 'Insufficient permissions');
    }

    next();
  });
};

// Admin-only middleware
export const requireAdmin = authorize('admin');

// Analyst or admin middleware
export const requireAnalyst = authorize('admin', 'analyst');

// Any authenticated user middleware (viewer, analyst, admin)
export const requireAuth = authorize('viewer', 'analyst', 'admin');

// Optional authentication (doesn't fail if no token)
export const optionalAuth = AsyncHandeler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Continue without authentication
  }

  try {
    await authenticate(req, res, next);
  } catch (err) {
    // Log but don't fail
    console.warn(`Optional auth failed for ${req.ip}: ${err.message}`);
    next();
  }
});

// API key authentication for agents
export const authenticateAgent = AsyncHandeler(async (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey) {
    throw new AppError(401, 'API key required');
  }

  // Validate API key format
  if (typeof apiKey !== 'string' || apiKey.length < 10) {
    throw new AppError(401, 'Invalid API key format');
  }

  // In production, you'd validate against a database of API keys
  const validApiKey = process.env.AGENT_API_KEY;
  
  if (!validApiKey) {
    console.error('AGENT_API_KEY not configured');
    throw new AppError(500, 'Server configuration error');
  }

  if (apiKey !== validApiKey) {
    console.warn(`Invalid API key attempt from ${req.ip}: ${apiKey.substring(0, 8)}...`);
    throw new AppError(401, 'Invalid API key');
  }

  // Add agent info to request
  req.agent = {
    type: 'agent',
    ip: req.ip,
    userAgent: req.get('User-Agent')
  };

  next();
});

// Flexible authentication - accepts both JWT and API key
export const authenticateFlexible = AsyncHandeler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];

  // Try API key first (for agents)
  if (apiKey) {
    try {
      await authenticateAgent(req, res, next);
      return;
    } catch (err) {
      throw err;
    }
  }

  // Try JWT authentication (for users)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      await authenticate(req, res, next);
      return;
    } catch (err) {
      throw err;
    }
  }

  // No valid authentication provided
  throw new AppError(401, 'Authentication required (JWT or API key)');
});

// Rate limiting for sensitive operations
export const sensitiveOperationLimiter = AsyncHandeler(async (req, res, next) => {
  const key = `sensitive_${req.user?.id || req.ip}`;
  
  // This is a simple in-memory implementation
  // In production, use Redis or similar
  if (!global.sensitiveOpLimits) {
    global.sensitiveOpLimits = new Map();
  }

  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxAttempts = 3;

  const userLimits = global.sensitiveOpLimits.get(key) || { count: 0, resetTime: now + windowMs };

  if (now > userLimits.resetTime) {
    userLimits.count = 0;
    userLimits.resetTime = now + windowMs;
  }

  if (userLimits.count >= maxAttempts) {
    const remainingTime = Math.ceil((userLimits.resetTime - now) / 1000);
    throw new AppError(429, `Too many sensitive operations. Try again in ${remainingTime} seconds.`);
  }

  userLimits.count++;
  global.sensitiveOpLimits.set(key, userLimits);

  next();
});

// Session validation middleware (checks token age)
export const validateSession = (maxAgeHours = 24) => {
  return AsyncHandeler(async (req, res, next) => {
    if (!req.tokenIssued) {
      throw new AppError(401, 'Token information missing');
    }

    const tokenAge = Date.now() - (req.tokenIssued * 1000);
    const maxAge = maxAgeHours * 60 * 60 * 1000;

    if (tokenAge > maxAge) {
      throw new AppError(401, 'Session expired. Please login again.');
    }

    next();
  });
};

/**
 * Account Lockout Management
 * Prevents brute force attacks by locking accounts after failed login attempts
 */

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;
const ATTEMPT_WINDOW_MINUTES = 15;

/**
 * Check if account is locked
 * @param {string} username - Username to check
 * @param {string} ipAddress - IP address of the request
 * @returns {Object} - { isLocked: boolean, lockedUntil: Date, attemptsRemaining: number }
 */
export const checkAccountLockout = async (username, ipAddress) => {
  try {
    // Clean up old lockout records (older than 24 hours)
    await pool.query(
      `DELETE FROM account_lockouts 
       WHERE last_attempt < NOW() - INTERVAL '24 hours'`
    );
    
    // Check for existing lockout record
    const result = await pool.query(
      `SELECT * FROM account_lockouts 
       WHERE username = $1 
       ORDER BY last_attempt DESC 
       LIMIT 1`,
      [username]
    );
    
    if (result.rows.length === 0) {
      return { isLocked: false, attemptsRemaining: MAX_FAILED_ATTEMPTS };
    }
    
    const lockout = result.rows[0];
    const now = new Date();
    
    // Check if account is currently locked
    if (lockout.locked_until && new Date(lockout.locked_until) > now) {
      const minutesRemaining = Math.ceil((new Date(lockout.locked_until) - now) / 60000);
      
      await recordAudit({
        username,
        action: AUDIT_ACTIONS.FAILED_LOGIN_ATTEMPT,
        resource: 'auth',
        details: { reason: 'account_locked', minutesRemaining },
        ipAddress,
        status: 'failure'
      });
      
      return {
        isLocked: true,
        lockedUntil: lockout.locked_until,
        minutesRemaining
      };
    }
    
    // Check if we're within the attempt window
    const attemptWindowStart = new Date(now - ATTEMPT_WINDOW_MINUTES * 60000);
    if (new Date(lockout.last_attempt) < attemptWindowStart) {
      // Outside attempt window, reset counter
      await pool.query(
        `DELETE FROM account_lockouts WHERE id = $1`,
        [lockout.id]
      );
      return { isLocked: false, attemptsRemaining: MAX_FAILED_ATTEMPTS };
    }
    
    // Within attempt window, check attempts
    const attemptsRemaining = MAX_FAILED_ATTEMPTS - lockout.failed_attempts;
    
    return {
      isLocked: false,
      attemptsRemaining: Math.max(0, attemptsRemaining),
      currentAttempts: lockout.failed_attempts
    };
  } catch (err) {
    console.error('Error checking account lockout:', err);
    // Don't block login on lockout check failure
    return { isLocked: false, attemptsRemaining: MAX_FAILED_ATTEMPTS };
  }
};

/**
 * Record failed login attempt
 * @param {string} username - Username that failed login
 * @param {string} ipAddress - IP address of the request
 * @returns {Object} - { isLocked: boolean, attemptsRemaining: number }
 */
export const recordFailedLogin = async (username, ipAddress) => {
  try {
    // Get current lockout status
    const result = await pool.query(
      `SELECT * FROM account_lockouts 
       WHERE username = $1 
       ORDER BY last_attempt DESC 
       LIMIT 1`,
      [username]
    );
    
    const now = new Date();
    const attemptWindowStart = new Date(now - ATTEMPT_WINDOW_MINUTES * 60000);
    
    if (result.rows.length === 0 || new Date(result.rows[0].last_attempt) < attemptWindowStart) {
      // First attempt or outside window, create new record
      await pool.query(
        `INSERT INTO account_lockouts (username, ip_address, failed_attempts, last_attempt)
         VALUES ($1, $2, 1, NOW())`,
        [username, ipAddress]
      );
      
      await recordAudit({
        username,
        action: AUDIT_ACTIONS.FAILED_LOGIN_ATTEMPT,
        resource: 'auth',
        details: { attempts: 1, ipAddress },
        ipAddress,
        status: 'failure'
      });
      
      return {
        isLocked: false,
        attemptsRemaining: MAX_FAILED_ATTEMPTS - 1
      };
    }
    
    // Increment failed attempts
    const lockout = result.rows[0];
    const newAttempts = lockout.failed_attempts + 1;
    
    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      // Lock the account
      const lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MINUTES * 60000);
      
      await pool.query(
        `UPDATE account_lockouts 
         SET failed_attempts = $1, locked_until = $2, last_attempt = NOW()
         WHERE id = $3`,
        [newAttempts, lockedUntil, lockout.id]
      );
      
      await recordAudit({
        username,
        action: AUDIT_ACTIONS.ACCOUNT_LOCKED,
        resource: 'auth',
        details: { 
          attempts: newAttempts, 
          lockedUntil, 
          durationMinutes: LOCKOUT_DURATION_MINUTES,
          ipAddress 
        },
        ipAddress,
        status: 'failure'
      });
      
      console.warn(`Account locked: ${username} from IP ${ipAddress} after ${newAttempts} failed attempts`);
      
      return {
        isLocked: true,
        lockedUntil,
        minutesRemaining: LOCKOUT_DURATION_MINUTES
      };
    }
    
    // Update attempt count
    await pool.query(
      `UPDATE account_lockouts 
       SET failed_attempts = $1, last_attempt = NOW()
       WHERE id = $2`,
      [newAttempts, lockout.id]
    );
    
    await recordAudit({
      username,
      action: AUDIT_ACTIONS.FAILED_LOGIN_ATTEMPT,
      resource: 'auth',
      details: { attempts: newAttempts, ipAddress },
      ipAddress,
      status: 'failure'
    });
    
    return {
      isLocked: false,
      attemptsRemaining: MAX_FAILED_ATTEMPTS - newAttempts
    };
  } catch (err) {
    console.error('Error recording failed login:', err);
    return { isLocked: false, attemptsRemaining: 0 };
  }
};

/**
 * Clear failed login attempts (on successful login)
 * @param {string} username - Username to clear
 */
export const clearFailedLogins = async (username) => {
  try {
    await pool.query(
      `DELETE FROM account_lockouts WHERE username = $1`,
      [username]
    );
  } catch (err) {
    console.error('Error clearing failed logins:', err);
  }
};

/**
 * Manually unlock an account (admin function)
 * @param {string} username - Username to unlock
 */
export const unlockAccount = async (username) => {
  try {
    const result = await pool.query(
      `DELETE FROM account_lockouts WHERE username = $1 RETURNING *`,
      [username]
    );
    
    if (result.rows.length > 0) {
      await recordAudit({
        username,
        action: AUDIT_ACTIONS.ACCOUNT_UNLOCKED,
        resource: 'auth',
        details: { manual: true },
        status: 'success'
      });
      
      return { success: true, message: `Account ${username} unlocked successfully` };
    }
    
    return { success: false, message: `No lockout found for ${username}` };
  } catch (err) {
    console.error('Error unlocking account:', err);
    throw new AppError(500, 'Failed to unlock account');
  }
};

import { pool } from '../config/db.js';
import { logger } from './Logger.js';

/**
 * Audit Trail Utility
 * Records all security-relevant actions for compliance and forensics
 */

export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  TOKEN_REFRESH: 'token_refresh',
  
  // User Management
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_ACTIVATED: 'user_activated',
  USER_DEACTIVATED: 'user_deactivated',
  
  // Password Management
  PASSWORD_CHANGED: 'password_changed',
  PASSWORD_RESET: 'password_reset',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',
  
  // Account Security
  ACCOUNT_LOCKED: 'account_locked',
  ACCOUNT_UNLOCKED: 'account_unlocked',
  FAILED_LOGIN_ATTEMPT: 'failed_login_attempt',
  
  // Authorization
  ACCESS_DENIED: 'access_denied',
  PERMISSION_CHANGED: 'permission_changed',
  ROLE_CHANGED: 'role_changed',
  
  // Data Operations
  LOG_CREATED: 'log_created',
  LOG_DELETED: 'log_deleted',
  ALERT_CREATED: 'alert_created',
  ALERT_ACKNOWLEDGED: 'alert_acknowledged',
  ALERT_RESOLVED: 'alert_resolved',
  ALERT_DELETED: 'alert_deleted',
  
  // Reports
  REPORT_GENERATED: 'report_generated',
  REPORT_DOWNLOADED: 'report_downloaded',
  
  // System
  CONFIG_CHANGED: 'config_changed',
  SYSTEM_BACKUP: 'system_backup',
  SYSTEM_RESTORE: 'system_restore',
  
  // Agent
  AGENT_REGISTERED: 'agent_registered',
  AGENT_DEREGISTERED: 'agent_deregistered',
};

/**
 * Record an audit trail entry
 * @param {Object} params - Audit parameters
 * @param {number} params.userId - User ID (optional for system actions)
 * @param {string} params.username - Username (optional)
 * @param {string} params.action - Action performed (use AUDIT_ACTIONS constants)
 * @param {string} params.resource - Resource type (e.g., 'user', 'log', 'alert')
 * @param {string} params.resourceId - Resource identifier
 * @param {Object} params.details - Additional details (stored as JSONB)
 * @param {string} params.ipAddress - IP address of the requester
 * @param {string} params.userAgent - User agent string
 * @param {string} params.status - Status ('success' or 'failure')
 */
export const recordAudit = async ({
  userId = null,
  username = null,
  action,
  resource = null,
  resourceId = null,
  details = {},
  ipAddress = null,
  userAgent = null,
  status = 'success'
}) => {
  try {
    await pool.query(
      `INSERT INTO audit_trail 
       (user_id, username, action, resource, resource_id, details, ip_address, user_agent, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        username,
        action,
        resource,
        resourceId,
        JSON.stringify(details),
        ipAddress,
        userAgent,
        status
      ]
    );
    
    logger.info('Audit trail recorded', { action, username, resource, status });
  } catch (err) {
    // Don't fail the main operation if audit logging fails
    logger.error('Failed to record audit trail', { 
      error: err.message, 
      action, 
      username 
    });
  }
};

/**
 * Get audit trail entries with filtering
 * @param {Object} filters - Filter parameters
 * @param {number} filters.userId - Filter by user ID
 * @param {string} filters.username - Filter by username
 * @param {string} filters.action - Filter by action
 * @param {string} filters.resource - Filter by resource type
 * @param {Date} filters.startDate - Filter by start date
 * @param {Date} filters.endDate - Filter by end date
 * @param {number} filters.limit - Limit results (default 100)
 * @param {number} filters.offset - Offset for pagination
 */
export const getAuditTrail = async (filters = {}) => {
  const {
    userId,
    username,
    action,
    resource,
    startDate,
    endDate,
    limit = 100,
    offset = 0
  } = filters;
  
  let query = 'SELECT * FROM audit_trail WHERE 1=1';
  const params = [];
  let paramIndex = 1;
  
  if (userId) {
    query += ` AND user_id = $${paramIndex}`;
    params.push(userId);
    paramIndex++;
  }
  
  if (username) {
    query += ` AND username = $${paramIndex}`;
    params.push(username);
    paramIndex++;
  }
  
  if (action) {
    query += ` AND action = $${paramIndex}`;
    params.push(action);
    paramIndex++;
  }
  
  if (resource) {
    query += ` AND resource = $${paramIndex}`;
    params.push(resource);
    paramIndex++;
  }
  
  if (startDate) {
    query += ` AND timestamp >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }
  
  if (endDate) {
    query += ` AND timestamp <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }
  
  query += ` ORDER BY timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Get audit statistics
 */
export const getAuditStats = async (startDate, endDate) => {
  const result = await pool.query(
    `SELECT 
       action,
       status,
       COUNT(*) as count
     FROM audit_trail
     WHERE timestamp >= $1 AND timestamp <= $2
     GROUP BY action, status
     ORDER BY count DESC`,
    [startDate, endDate]
  );
  
  return result.rows;
};

/**
 * Middleware to automatically record audit trail from request
 */
export const auditMiddleware = (action, resource) => {
  return (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to capture response
    res.json = function(data) {
      // Record audit after successful response
      const status = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure';
      
      recordAudit({
        userId: req.user?.id,
        username: req.user?.username,
        action,
        resource,
        resourceId: req.params?.id || data?.id,
        details: {
          method: req.method,
          path: req.path,
          query: req.query,
          body: sanitizeBody(req.body)
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status
      });
      
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Sanitize request body to remove sensitive data
 */
const sanitizeBody = (body) => {
  if (!body) return {};
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'currentPassword', 'newPassword', 'token', 'apiKey'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

export default {
  recordAudit,
  getAuditTrail,
  getAuditStats,
  auditMiddleware,
  AUDIT_ACTIONS
};

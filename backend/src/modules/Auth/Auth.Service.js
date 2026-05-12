import { pool } from '../../config/db.js';
import { AppError } from '../../utilis/ApiResponse.js';
import { comparePassword, hashPassword, validatePasswordComplexity } from '../../utilis/Password.validator.js';
import { generateToken } from '../../utilis/Jwt.js';
import { logger } from '../../utilis/Logger.js';
import { checkAccountLockout, recordFailedLogin, clearFailedLogins } from '../../middelware/Auth.js';
import { recordAudit, AUDIT_ACTIONS } from '../../utilis/AuditTrail.js';

export const loginUser = async ({ username, password }, ipAddress = null) => {
  // Check if account is locked
  const lockoutStatus = await checkAccountLockout(username, ipAddress);
  
  if (lockoutStatus.isLocked) {
    logger.warn('Login attempt on locked account', { username, ipAddress });
    throw new AppError(
      423, 
      `Account is locked due to multiple failed login attempts. Please try again in ${lockoutStatus.minutesRemaining} minutes.`
    );
  }
  
  const result = await pool.query(
    'SELECT * FROM users WHERE username = $1 AND is_active = true', [username]
  );
  const user = result.rows[0];

  if (!user) {
    logger.warn('Failed login attempt - user not found', { username, ipAddress });
    const failStatus = await recordFailedLogin(username, ipAddress);
    
    if (failStatus.isLocked) {
      throw new AppError(
        423,
        `Account locked due to multiple failed attempts. Try again in ${failStatus.minutesRemaining} minutes.`
      );
    }
    
    throw new AppError(
      401, 
      `Invalid credentials. ${failStatus.attemptsRemaining} attempts remaining before account lockout.`
    );
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    logger.warn('Failed login attempt - invalid password', { username, ipAddress });
    const failStatus = await recordFailedLogin(username, ipAddress);
    
    if (failStatus.isLocked) {
      throw new AppError(
        423,
        `Account locked due to multiple failed attempts. Try again in ${failStatus.minutesRemaining} minutes.`
      );
    }
    
    throw new AppError(
      401, 
      `Invalid credentials. ${failStatus.attemptsRemaining} attempts remaining before account lockout.`
    );
  }

  // Clear failed login attempts on successful login
  await clearFailedLogins(username);
  
  logger.info('Successful login', { username, role: user.role, ipAddress });
  
  // Record successful login in audit trail
  await recordAudit({
    userId: user.id,
    username: user.username,
    action: AUDIT_ACTIONS.LOGIN_SUCCESS,
    resource: 'auth',
    details: { role: user.role },
    ipAddress,
    status: 'success'
  });

  const token = generateToken({ id: user.id, username: user.username, role: user.role });

  return {
    token,
    user: { id: user.id, username: user.username, role: user.role },
  };
};

export const changePassword = async (userId, { currentPassword, newPassword }, ipAddress = null) => {
  // Get current user data
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1 AND is_active = true', [userId]
  );
  const user = result.rows[0];

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Verify current password
  const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    logger.warn('Failed password change attempt - invalid current password', { userId, username: user.username });
    
    await recordAudit({
      userId,
      username: user.username,
      action: AUDIT_ACTIONS.PASSWORD_CHANGED,
      resource: 'auth',
      details: { reason: 'invalid_current_password' },
      ipAddress,
      status: 'failure'
    });
    
    throw new AppError(401, 'Current password is incorrect');
  }

  // Validate new password complexity
  const validation = validatePasswordComplexity(newPassword);
  if (!validation.isValid) {
    logger.warn('Password change failed - complexity requirements not met', { 
      userId, 
      username: user.username,
      errors: validation.errors 
    });
    throw new AppError(400, 'Password does not meet complexity requirements', validation.errors);
  }

  // Hash new password
  const hashedNewPassword = await hashPassword(newPassword);

  // Update password in database
  await pool.query(
    'UPDATE users SET password = $1 WHERE id = $2',
    [hashedNewPassword, userId]
  );

  logger.info('Password changed successfully', { userId, username: user.username });
  
  await recordAudit({
    userId,
    username: user.username,
    action: AUDIT_ACTIONS.PASSWORD_CHANGED,
    resource: 'auth',
    details: { strength: validation.strength },
    ipAddress,
    status: 'success'
  });
  
  return { message: 'Password changed successfully' };
};

export const resetUserPassword = async (adminUserId, { userId, newPassword }, ipAddress = null) => {
  // Verify admin user exists and has admin role
  const adminResult = await pool.query(
    'SELECT role, username FROM users WHERE id = $1 AND is_active = true', [adminUserId]
  );
  const admin = adminResult.rows[0];

  if (!admin || admin.role !== 'admin') {
    throw new AppError(403, 'Only administrators can reset user passwords');
  }

  // Get target user data
  const userResult = await pool.query(
    'SELECT * FROM users WHERE id = $1', [userId]
  );
  const user = userResult.rows[0];

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Validate new password complexity
  const validation = validatePasswordComplexity(newPassword);
  if (!validation.isValid) {
    logger.warn('Password reset failed - complexity requirements not met', { 
      adminUserId,
      targetUserId: userId,
      targetUsername: user.username,
      errors: validation.errors 
    });
    throw new AppError(400, 'Password does not meet complexity requirements', validation.errors);
  }

  // Hash new password
  const hashedNewPassword = await hashPassword(newPassword);

  // Update password in database
  await pool.query(
    'UPDATE users SET password = $1 WHERE id = $2',
    [hashedNewPassword, userId]
  );

  logger.info('Password reset by admin', { 
    adminUserId, 
    targetUserId: userId, 
    targetUsername: user.username 
  });
  
  await recordAudit({
    userId: adminUserId,
    username: admin.username,
    action: AUDIT_ACTIONS.PASSWORD_RESET,
    resource: 'user',
    resourceId: userId.toString(),
    details: { 
      targetUsername: user.username,
      strength: validation.strength 
    },
    ipAddress,
    status: 'success'
  });
  
  return { message: `Password reset successfully for user: ${user.username}` };
};

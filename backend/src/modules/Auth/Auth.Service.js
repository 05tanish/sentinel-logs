import { pool } from '../../config/db.js';
import { AppError } from '../../utilis/ApiResponse.js';
import { comparePassword, hashPassword } from '../../utilis/Password.validator.js';
import { generateToken } from '../../utilis/Jwt.js';
import { logger } from '../../utilis/Logger.js';

export const loginUser = async ({ username, password }) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE username = $1 AND is_active = true', [username]
  );
  const user = result.rows[0];

  if (!user) {
    logger.warn('Failed login attempt', { username });
    throw new AppError(401, 'Invalid credentials');
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    logger.warn('Failed login attempt', { username });
    throw new AppError(401, 'Invalid credentials');
  }

  logger.info('Successful login', { username, role: user.role });

  const token = generateToken({ id: user.id, username: user.username, role: user.role });

  return {
    token,
    user: { id: user.id, username: user.username, role: user.role },
  };
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
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
    throw new AppError(401, 'Current password is incorrect');
  }

  // Hash new password
  const hashedNewPassword = await hashPassword(newPassword);

  // Update password in database
  await pool.query(
    'UPDATE users SET password = $1 WHERE id = $2',
    [hashedNewPassword, userId]
  );

  logger.info('Password changed successfully', { userId, username: user.username });
  
  return { message: 'Password changed successfully' };
};

export const resetUserPassword = async (adminUserId, { userId, newPassword }) => {
  // Verify admin user exists and has admin role
  const adminResult = await pool.query(
    'SELECT role FROM users WHERE id = $1 AND is_active = true', [adminUserId]
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
  
  return { message: `Password reset successfully for user: ${user.username}` };
};

import { AppError } from '../utilis/ApiResponse.js';
import { AsyncHandeler } from '../utilis/Aysnchandler.js';
import { verifyToken } from '../utilis/Jwt.js';
import { pool } from '../config/db.js';

export const authenticate = AsyncHandeler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'Invalid authorization format');
  }

  const token = authHeader.substring(7);

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw new AppError(401, 'Token expired');
    throw new AppError(401, 'Invalid token');
  }

  const result = await pool.query(
    'SELECT id, username, role FROM users WHERE id = $1 AND is_active = true',
    [decoded.id]
  );

  if (!result.rows[0]) throw new AppError(401, 'User not found or inactive');

  req.user = result.rows[0];
  next();
});

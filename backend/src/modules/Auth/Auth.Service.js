import { pool } from '../../config/db.js';
import { AppError } from '../../utilis/ApiResponse.js';
import { comparePassword } from '../../utilis/Password.validator.js';
import { generateToken } from '../../utilis/Jwt.js';

export const loginUser = async ({ username, password }) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE username = $1 AND is_active = true', [username]
  );
  const user = result.rows[0];

  if (!user) throw new AppError(401, 'Invalid credentials');

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new AppError(401, 'Invalid credentials');

  const token = generateToken({ id: user.id, username: user.username, role: user.role });

  return {
    token,
    user: { id: user.id, username: user.username, role: user.role },
  };
};

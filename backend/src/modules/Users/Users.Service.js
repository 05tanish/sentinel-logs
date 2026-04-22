import axios from 'axios';
import { pool } from '../../config/db.js';
import { AppError } from '../../utilis/ApiResponse.js';
import { hashPassword } from '../../utilis/Password.validator.js';
import { logger } from '../../utilis/Logger.js';

const ALLOWED_ROLES = ['admin', 'analyst', 'viewer'];

// Grafana role mapping — viewer does NOT get Grafana access
const grafanaRole = (role) => {
  if (role === 'admin') return 'Admin';
  if (role === 'analyst') return 'Viewer'; // can see dashboards, can't edit
  return null; // viewer — skip Grafana
};

// Create Grafana user via Grafana Admin API
const createGrafanaUser = async (username, plainPassword, role) => {
  const gRole = grafanaRole(role);
  if (!gRole) return; // viewer — skip

  try {
    await axios.post(
      'http://grafana:3000/api/admin/users',
      {
        name: username,
        login: username,
        password: plainPassword,
        role: gRole,
      },
      {
        auth: {
          username: 'admin',
          password: process.env.GF_SECURITY_ADMIN_PASSWORD,
        },
        timeout: 5000,
      }
    );
    logger.info('Grafana user created', { username, grafanaRole: gRole });
  } catch (err) {
    // don't fail user creation if Grafana sync fails
    logger.warn('Grafana user creation failed — user still created in app', {
      username,
      error: err.response?.data?.message || err.message,
    });
  }
};

// Create a new user — admin only
export const createUser = async ({ username, password, role = 'viewer' }) => {
  if (!ALLOWED_ROLES.includes(role)) {
    throw new AppError(400, `Invalid role. Must be one of: ${ALLOWED_ROLES.join(', ')}`);
  }

  // check duplicate
  const existing = await pool.query(
    'SELECT id FROM users WHERE username = $1', [username]
  );
  if (existing.rows[0]) throw new AppError(409, 'Username already exists');

  // hash password for PostgreSQL
  const hashed = await hashPassword(password);

  // insert into PostgreSQL
  const result = await pool.query(
    `INSERT INTO users (username, password, role)
     VALUES ($1, $2, $3)
     RETURNING id, username, role, is_active, created_at`,
    [username, hashed, role]
  );

  // sync to Grafana if admin or analyst (plain password used here, before it's discarded)
  await createGrafanaUser(username, password, role);

  logger.info('User created', { username, role });
  return result.rows[0];
};

// Get all users — admin only
export const getAllUsers = async () => {
  const result = await pool.query(
    'SELECT id, username, role, is_active, created_at FROM users ORDER BY created_at DESC'
  );
  return result.rows;
};

// Deactivate user — admin only
export const deactivateUser = async (id) => {
  const result = await pool.query(
    `UPDATE users SET is_active = false
     WHERE id = $1
     RETURNING id, username, role, is_active`,
    [id]
  );
  if (!result.rows[0]) throw new AppError(404, 'User not found');

  logger.info('User deactivated', { userId: id });
  return result.rows[0];
};

// Reactivate user — admin only
export const activateUser = async (id) => {
  const result = await pool.query(
    `UPDATE users SET is_active = true
     WHERE id = $1
     RETURNING id, username, role, is_active`,
    [id]
  );
  if (!result.rows[0]) throw new AppError(404, 'User not found');

  logger.info('User activated', { userId: id });
  return result.rows[0];
};

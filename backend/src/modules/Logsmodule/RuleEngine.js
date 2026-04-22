import { pool } from '../../config/db.js';
import { logger } from '../../utilis/Logger.js';

// deduplication — don't create same alert twice in 5 minutes
const alertExists = async (type, source_ip, username) => {
  const result = await pool.query(
    `SELECT id FROM alerts
     WHERE type = $1
     AND (source_ip = $2 OR ($2 IS NULL AND source_ip IS NULL))
     AND (username = $3 OR ($3 IS NULL AND username IS NULL))
     AND detected_at >= NOW() - INTERVAL '5 minutes'
     LIMIT 1`,
    [type, source_ip, username]
  );
  return result.rows.length > 0;
};

const createAlert = async ({ type, severity, description, source_ip, username, log_count }) => {
  // check deduplication before inserting
  const exists = await alertExists(type, source_ip, username);
  if (exists) return; // same alert already created recently

  await pool.query(
    `INSERT INTO alerts (type, severity, description, source_ip, username, log_count)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [type, severity, description, source_ip, username, log_count]
  );
  logger.warn('Alert created', { type, severity, source_ip, username });
};

// Rule 1 — Brute Force: 5+ failed logins from same IP in 5 minutes
const checkBruteForce = async (parsed) => {
  if (parsed.event_type !== 'FAILED_LOGIN') return;
  if (!parsed.ip_address) return;

  const result = await pool.query(
    `SELECT COUNT(*) FROM logs
     WHERE ip_address = $1
     AND event_type = 'FAILED_LOGIN'
     AND created_at >= NOW() - INTERVAL '5 minutes'`,
    [parsed.ip_address]
  );

  const count = parseInt(result.rows[0].count);
  if (count >= 5) {
    await createAlert({
      type: 'BRUTE_FORCE',
      severity: 'HIGH',
      description: `${count} failed login attempts from ${parsed.ip_address} in 5 minutes`,
      source_ip: parsed.ip_address,
      username: parsed.username,
      log_count: count,
    });
  }
};

// Rule 2 — Repeated failed logins for same user
const checkRepeatedUserFailures = async (parsed) => {
  if (parsed.event_type !== 'FAILED_LOGIN') return;
  if (!parsed.username) return;

  const result = await pool.query(
    `SELECT COUNT(*) FROM logs
     WHERE username = $1
     AND event_type = 'FAILED_LOGIN'
     AND created_at >= NOW() - INTERVAL '10 minutes'`,
    [parsed.username]
  );

  const count = parseInt(result.rows[0].count);
  if (count >= 3) {
    await createAlert({
      type: 'REPEATED_USER_FAILURE',
      severity: 'MEDIUM',
      description: `${count} failed login attempts for user '${parsed.username}' in 10 minutes`,
      source_ip: parsed.ip_address,
      username: parsed.username,
      log_count: count,
    });
  }
};

export const runRuleEngine = async (parsed) => {
  await Promise.allSettled([
    checkBruteForce(parsed),
    checkRepeatedUserFailures(parsed),
  ]);
};

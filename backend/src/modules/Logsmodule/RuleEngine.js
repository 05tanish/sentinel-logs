import { pool } from '../../config/db.js';

const createAlert = async ({ type, severity, description, source_ip, username, log_count }) => {
  await pool.query(
    `INSERT INTO alerts (type, severity, description, source_ip, username, log_count)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [type, severity, description, source_ip, username, log_count]
  );
};

// Rule 1 — Brute Force: 5+ failed logins from same IP in 5 minutes
const checkBruteForce = async (parsed) => {
  if (parsed.event_type !== 'FAILED_LOGIN') return;
  if (!parsed.ip_address) return; // skip if no IP extracted

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
  if (!parsed.username) return; // skip if no username extracted

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

// Main runner — call after every log ingestion
export const runRuleEngine = async (parsed) => {
  await Promise.allSettled([
    checkBruteForce(parsed),
    checkRepeatedUserFailures(parsed),
  ]);
};

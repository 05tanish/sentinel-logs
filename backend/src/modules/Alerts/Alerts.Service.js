import { pool } from '../../config/db.js';

export const getAllAlerts = async ({ severity, type, resolved, limit = 50, offset = 0 }) => {
  let query = 'SELECT * FROM alerts WHERE 1=1';
  const params = [];

  if (severity) {
    params.push(severity.toUpperCase());
    query += ` AND severity = $${params.length}`;
  }
  if (type) {
    params.push(type.toUpperCase());
    query += ` AND type = $${params.length}`;
  }
  if (resolved !== undefined) {
    params.push(resolved === 'true');
    query += ` AND resolved = $${params.length}`;
  }

  params.push(parseInt(limit), parseInt(offset));
  query += ` ORDER BY detected_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

  const result = await pool.query(query, params);
  return result.rows;
};

export const getAlertById = async (id) => {
  const result = await pool.query('SELECT * FROM alerts WHERE id = $1', [id]);
  return result.rows[0] || null;
};

export const acknowledgeAlert = async (id) => {
  const result = await pool.query(
    'UPDATE alerts SET acknowledged = true WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0] || null;
};

export const resolveAlert = async (id) => {
  const result = await pool.query(
    'UPDATE alerts SET resolved = true, acknowledged = true WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0] || null;
};

export const getAlertStats = async () => {
  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE resolved = false) AS open,
      COUNT(*) FILTER (WHERE severity = 'CRITICAL' AND resolved = false) AS critical,
      COUNT(*) FILTER (WHERE severity = 'HIGH' AND resolved = false) AS high,
      COUNT(*) FILTER (WHERE severity = 'MEDIUM' AND resolved = false) AS medium,
      COUNT(*) FILTER (WHERE detected_at >= NOW() - INTERVAL '24 hours') AS last_24h
    FROM alerts
  `);
  return result.rows[0];
};

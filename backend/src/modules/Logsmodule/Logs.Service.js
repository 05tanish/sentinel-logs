import axios from 'axios';
import { pool } from '../../config/db.js';

const LOKI_URL = process.env.LOKI_URL || 'http://loki:3100';

// ─── Loki ────────────────────────────────────────────────
export const fetchLogs = async () => {
  const response = await axios.get(`${LOKI_URL}/loki/api/v1/query`, {
    params: { query: '{job="sample_logs"}' },
  });
  return response.data;
};

export const fetchAndAnalyzeLogs = async () => {
  const response = await axios.get(`${LOKI_URL}/loki/api/v1/query`, {
    params: { query: '{job="sample_logs"}' },
  });
  const logs = response.data.data.result[0]?.values || [];
  const logMessages = logs.map((l) => l[1]);
  return { logs: logMessages };
};

// ─── Ingestion ───────────────────────────────────────────
export const parseLog = (raw) => {
  const ipMatch = raw.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
  const userMatch = raw.match(/user[:\s]+(\w+)/i);
  const failedLogin = raw.toLowerCase().includes('failed login');
  const successLogin = raw.toLowerCase().includes('successful login');

  return {
    ip_address: ipMatch ? ipMatch[0] : null,
    username: userMatch ? userMatch[1] : null,
    event_type: failedLogin ? 'FAILED_LOGIN' : successLogin ? 'SUCCESSFUL_LOGIN' : 'GENERAL',
    severity: failedLogin ? 'HIGH' : 'LOW',
  };
};

export const storeLog = async ({ raw, source, timestamp, parsed }) => {
  const result = await pool.query(
    `INSERT INTO logs (raw, source, timestamp, ip_address, username, event_type, severity, parsed)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      raw,
      source,
      timestamp ? new Date(timestamp) : new Date(),
      parsed.ip_address,
      parsed.username,
      parsed.event_type,
      parsed.severity,
      JSON.stringify(parsed),
    ]
  );
  return result.rows[0];
};

// ─── Query ───────────────────────────────────────────────
export const fetchLogsBySeverity = async (severity) => {
  const result = await pool.query(
    'SELECT * FROM logs WHERE severity = $1 ORDER BY created_at DESC',
    [severity.toUpperCase()]
  );
  return result.rows;
};

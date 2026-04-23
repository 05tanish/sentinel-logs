import axios from 'axios';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { pool } from '../../config/db.js';
import { parseLog } from './parser.js';

export { parseLog };

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

// ─── File Upload / USB Ingestion ─────────────────────────
export const processLogFile = async (filePath, source = 'file-upload') => {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath, { encoding: 'utf8' });
    const rl = createInterface({ input: stream });

    let processed = 0;
    let errors = 0;
    const promises = [];

    rl.on('line', (line) => {
      if (!line.trim()) return;

      const promise = (async () => {
        try {
          const parsed = parseLog(line);
          await storeLog({ raw: line, source, parsed });
          processed++;
        } catch {
          errors++;
        }
      })();

      promises.push(promise);
    });

    rl.on('close', async () => {
      await Promise.allSettled(promises);
      resolve({ processed, errors });
    });

    rl.on('error', reject);
    stream.on('error', reject);
  });
};

// ─── Query ───────────────────────────────────────────────
export const fetchLogsBySeverity = async (severity) => {
  const result = await pool.query(
    'SELECT * FROM logs WHERE severity = $1 ORDER BY created_at DESC',
    [severity.toUpperCase()]
  );
  return result.rows;
};

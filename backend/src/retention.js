import { pool } from './config/db.js';
import { logger } from './utilis/Logger.js';

// retention periods in days — configurable via .env
const LOG_RETENTION_DAYS = parseInt(process.env.LOG_RETENTION_DAYS) || 90;
const ALERT_RETENTION_DAYS = parseInt(process.env.ALERT_RETENTION_DAYS) || 365;

export const runRetentionCleanup = async () => {
  try {
    const logsResult = await pool.query(
      `DELETE FROM logs WHERE created_at < NOW() - INTERVAL '${LOG_RETENTION_DAYS} days'`
    );

    const alertsResult = await pool.query(
      `DELETE FROM alerts WHERE resolved = true AND detected_at < NOW() - INTERVAL '${ALERT_RETENTION_DAYS} days'`
    );

    const logsDeleted = logsResult.rowCount;
    const alertsDeleted = alertsResult.rowCount;

    if (logsDeleted > 0 || alertsDeleted > 0) {
      logger.info('Retention cleanup completed', {
        logsDeleted,
        alertsDeleted,
        logRetentionDays: LOG_RETENTION_DAYS,
        alertRetentionDays: ALERT_RETENTION_DAYS,
      });
      console.log(`[RETENTION] Deleted ${logsDeleted} logs, ${alertsDeleted} resolved alerts`);
    }
  } catch (err) {
    logger.error('Retention cleanup failed', { error: err.message });
  }
};

export const startRetentionJob = () => {
  // run once on startup
  runRetentionCleanup();

  // then every 24 hours
  setInterval(runRetentionCleanup, 24 * 60 * 60 * 1000);
  console.log(`Retention policy started (logs: ${LOG_RETENTION_DAYS}d, alerts: ${ALERT_RETENTION_DAYS}d)`);
};

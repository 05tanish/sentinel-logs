import { pool } from '../../config/db.js';
import { logger } from '../../utilis/Logger.js';

// upsert heartbeat — insert if new agent, update if existing
export const upsertHeartbeat = async ({ source, hostname, platform }) => {
  await pool.query(
    `INSERT INTO agent_heartbeats (source, hostname, platform, last_seen, status)
     VALUES ($1, $2, $3, NOW(), 'online')
     ON CONFLICT (source)
     DO UPDATE SET
       hostname = EXCLUDED.hostname,
       platform = EXCLUDED.platform,
       last_seen = NOW(),
       status = 'online'`,
    [source, hostname, platform]
  );
};

// get all agents with seconds since last heartbeat
export const getAgents = async () => {
  const result = await pool.query(`
    SELECT
      source,
      hostname,
      platform,
      last_seen,
      status,
      EXTRACT(EPOCH FROM (NOW() - last_seen))::INTEGER AS seconds_ago
    FROM agent_heartbeats
    ORDER BY last_seen DESC
  `);
  return result.rows;
};

// background job — detect silent agents and create alerts
export const checkSilentAgents = async () => {
  const silent = await pool.query(`
    SELECT source, hostname FROM agent_heartbeats
    WHERE last_seen < NOW() - INTERVAL '5 minutes'
    AND status = 'online'
  `);

  for (const agent of silent.rows) {
    // mark as offline
    await pool.query(
      `UPDATE agent_heartbeats SET status = 'offline' WHERE source = $1`,
      [agent.source]
    );

    // create critical alert
    await pool.query(
      `INSERT INTO alerts (type, severity, description)
       VALUES ('AGENT_SILENT', 'CRITICAL', $1)`,
      [`Agent '${agent.source}' (${agent.hostname}) has gone silent — possible tampering or shutdown`]
    );

    logger.warn('Agent went silent', { source: agent.source, hostname: agent.hostname });
  }

  if (silent.rows.length > 0) {
    console.log(`[HEARTBEAT] ${silent.rows.length} agent(s) marked offline`);
  }
};

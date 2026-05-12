import axios from 'axios';
import https from 'https';
import config from './config.js';
import {
  saveToPendingFile,
  getPendingLogs,
  saveRemainingLogs,
  clearPendingFile,
  chunkArray,
  sleep,
} from './retry.js';

const CHUNK_SIZE = 20;      // logs per chunk when flushing
const CHUNK_DELAY = 500;    // ms between chunks — prevents bottleneck

const httpClient = axios.create({
  baseURL: config.backendUrl,
  timeout: 5000,
  headers: { 'x-api-key': config.apiKey },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false  // Accept self-signed certificates
  })
});

// check if backend is reachable
export const isBackendOnline = async () => {
  try {
    await httpClient.get('/health');
    return true;
  } catch {
    return false;
  }
};

// send a single log line immediately (real-time)
export const sendLog = async (raw) => {
  try {
    await httpClient.post('/api/logs', { raw, source: config.source });
  } catch {
    // backend down — save to disk
    saveToPendingFile(raw, config.source);
    console.warn(`[OFFLINE] Saved to disk: ${raw.substring(0, 60)}...`);
  }
};

// send stop alert before agent exits
export const sendStopAlert = async (signal) => {
  try {
    await httpClient.post('/api/logs', {
      raw: `SECURITY: Agent stop attempt detected via ${signal} on ${config.source}`,
      source: config.source,
    });
  } catch {
    // best effort — if backend is down we can't do much
  }
};
export const flushPendingLogs = async () => {
  const pending = getPendingLogs();
  if (pending.length === 0) return;

  // health check before starting flush
  const online = await isBackendOnline();
  if (!online) {
    console.log(`[RETRY] Backend still offline. ${pending.length} logs waiting`);
    return;
  }

  console.log(`[FLUSH] Backend online. Sending ${pending.length} pending logs in chunks of ${CHUNK_SIZE}`);

  const chunks = chunkArray(pending, CHUNK_SIZE);
  let sentCount = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    try {
      await Promise.all(
        chunk.map((entry) =>
          httpClient.post('/api/logs', { raw: entry.raw, source: entry.source })
        )
      );
      sentCount += chunk.length;
      console.log(`[FLUSH] Chunk ${i + 1}/${chunks.length} sent (${sentCount}/${pending.length})`);

      // wait between chunks to avoid bottleneck
      if (i < chunks.length - 1) await sleep(CHUNK_DELAY);

    } catch (err) {
      // backend went down mid-flush — save remaining logs back to disk
      const remaining = pending.slice(sentCount);
      saveRemainingLogs(remaining);
      console.error(`[FLUSH] Failed mid-flush. Saved ${remaining.length} remaining logs to disk`);
      return;
    }
  }

  clearPendingFile();
  console.log(`[FLUSH] Complete. Sent ${sentCount} pending logs`);
};

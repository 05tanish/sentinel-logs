#!/usr/bin/env node
import { readLogFile } from './src/reader.js';
import { watchFiles } from './src/watcher.js';
import { sendLog, flushPendingLogs, isBackendOnline } from './src/sender.js';
import config from './src/config.js';

const start = async () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SIEM Agent starting...');
  console.log(`  Backend : ${config.backendUrl}`);
  console.log(`  Source  : ${config.source}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // flush any logs saved while backend was previously down
  await flushPendingLogs();

  // read and send existing log lines on startup (historical)
  const online = await isBackendOnline();
  for (const filePath of config.logPaths) {
    try {
      const lines = await readLogFile(filePath);
      if (lines.length > 0 && online) {
        console.log(`[STARTUP] Sending ${lines.length} existing lines from ${filePath}`);
        for (const line of lines) {
          await sendLog(line);
        }
      }
    } catch (err) {
      console.error(`[STARTUP] Could not read ${filePath}:`, err.message);
    }
  }

  // watch files in real-time using chokidar
  // every new line detected → send immediately or save to disk
  watchFiles(config.logPaths, async (line) => {
    console.log(`[NEW] ${line.substring(0, 80)}`);
    await sendLog(line);
  });

  // retry pending logs every retryInterval ms (chunked + throttled)
  setInterval(flushPendingLogs, config.retryInterval);

  console.log('\n[AGENT] Running — watching for new log lines\n');
};

start().catch((err) => {
  console.error('Agent failed to start:', err.message);
  process.exit(1);
});

#!/usr/bin/env node
import os from 'os';

const command = process.argv[2];

// ─── siem-agent init ──────────────────────────────────────
if (command === 'init') {
  const { runInit } = await import('./src/init.js');
  await runInit();
  process.exit(0);
}

// ─── siem-agent install ───────────────────────────────────
if (command === 'install') {
  const { install } = await import('./src/install.js');
  install();
  process.exit(0);
}

// ─── siem-agent uninstall ─────────────────────────────────
if (command === 'uninstall') {
  const { uninstall } = await import('./src/install.js');
  uninstall();
  process.exit(0);
}

// ─── siem-agent --help ────────────────────────────────────
if (command === '--help' || command === '-h') {
  console.log(`
  siem-agent — SIEM Security Log Collection Agent

  Commands:
    siem-agent init        Interactive setup — creates config
    siem-agent start       Start the agent (foreground)
    siem-agent install     Install as system service (runs forever)
    siem-agent uninstall   Remove system service
    siem-agent --help      Show this help

  Setup (first time):
    1. siem-agent init
    2. sudo siem-agent install

  Config location:  ${os.homedir()}/.siem-agent/config.json
  Pending logs:     ${os.homedir()}/.siem-agent/pending-logs.json
  `);
  process.exit(0);
}

// ─── siem-agent start (default) ───────────────────────────
const { readLogFile } = await import('./src/reader.js');
const { watchFiles } = await import('./src/watcher.js');
const { sendLog, flushPendingLogs, isBackendOnline, sendStopAlert } = await import('./src/sender.js');
const { default: config } = await import('./src/config.js');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  SIEM Agent starting...');
console.log(`  Backend  : ${config.backendUrl}`);
console.log(`  Source   : ${config.source}`);
console.log(`  Platform : ${os.platform()}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// ─── Tamper detection — alert before exit ─────────────────
process.on('SIGTERM', async () => {
  console.warn('[SECURITY] SIGTERM received — agent stopping');
  await sendStopAlert('SIGTERM');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.warn('[SECURITY] SIGINT received — agent stopping');
  await sendStopAlert('SIGINT');
  process.exit(0);
});

// ─── Start ────────────────────────────────────────────────
await flushPendingLogs();

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

watchFiles(config.logPaths, async (line) => {
  console.log(`[NEW] ${line.substring(0, 80)}`);
  await sendLog(line);
});

// retry pending logs
setInterval(flushPendingLogs, config.retryInterval);

// heartbeat every 60 seconds
setInterval(async () => {
  try {
    const { default: axios } = await import('axios');
    const { default: https } = await import('https');
    await axios.post(`${config.backendUrl}/api/agent/heartbeat`, {
      source: config.source,
      hostname: os.hostname(),
      platform: os.platform(),
      status: 'running',
    }, {
      headers: { 'x-api-key': config.apiKey },
      timeout: 5000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false  // Accept self-signed certificates
      })
    });
  } catch {
    // heartbeat failure is silent — backend will detect silence
  }
}, 60000);

console.log('\n[AGENT] Running — watching for new log lines');
console.log('[AGENT] Heartbeat active — sending every 60s\n');

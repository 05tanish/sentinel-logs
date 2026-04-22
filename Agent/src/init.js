import inquirer from 'inquirer';
import os from 'os';
import { mkdirSync, writeFileSync, existsSync, chmodSync } from 'fs';
import { join } from 'path';

// hidden config directory in user's home
export const CONFIG_DIR = join(os.homedir(), '.siem-agent');
export const CONFIG_PATH = join(CONFIG_DIR, 'config.json');
export const PENDING_PATH = join(CONFIG_DIR, 'pending-logs.json');

export const runInit = async () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SIEM Agent Setup');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'backendUrl',
      message: 'SIEM Backend URL:',
      default: 'http://localhost:4000',
      validate: (val) => val.startsWith('http') || 'Must be a valid URL',
    },
    {
      type: 'password',
      name: 'apiKey',
      message: 'API Key (JWT token from login):',
      mask: '*',
      validate: (val) => val.length > 10 || 'Invalid token',
    },
    {
      type: 'input',
      name: 'logPaths',
      message: 'Log files to watch (comma separated):',
      default: os.platform() === 'win32'
        ? 'C:\\Windows\\System32\\winevt\\Logs\\Security.evtx'
        : '/var/log/auth.log,/var/log/syslog',
      filter: (val) => val.split(',').map((p) => p.trim()),
    },
    {
      type: 'input',
      name: 'source',
      message: 'Machine name (identifier for this machine):',
      default: os.hostname(),
    },
    {
      type: 'number',
      name: 'retryInterval',
      message: 'Retry interval in seconds (when backend is offline):',
      default: 30,
      filter: (val) => val * 1000, // convert to ms
    },
  ]);

  // create hidden config directory
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }

  const config = {
    backendUrl: answers.backendUrl,
    apiKey: answers.apiKey,
    logPaths: answers.logPaths,
    source: answers.source,
    retryInterval: answers.retryInterval,
  };

  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');

  // restrict permissions — owner read/write only (not readable by other users)
  try { chmodSync(CONFIG_PATH, 0o600); } catch { /* Windows doesn't support chmod */ }

  console.log(`\n✅ Config saved to ${CONFIG_PATH}`);
  console.log('\nNext steps:');
  console.log('  Start agent:   siem-agent start');
  console.log('  Install service: sudo siem-agent install  (runs forever)\n');
};

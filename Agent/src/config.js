import { readFileSync, existsSync } from 'fs';
import { CONFIG_PATH } from './init.js';

if (!existsSync(CONFIG_PATH)) {
  console.error('❌ No config found. Run: siem-agent init');
  process.exit(1);
}

const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));

const required = ['backendUrl', 'apiKey', 'logPaths', 'source'];
for (const key of required) {
  if (!config[key]) {
    console.error(`❌ Missing config field: ${key}. Run: siem-agent init`);
    process.exit(1);
  }
}

config.retryInterval = config.retryInterval || 30000;

export default config;

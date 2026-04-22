import { appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_FILE = join(__dirname, '../../../logs/backend.log');

const write = (level, message, meta = {}) => {
  const entry = JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  });
  console.log(entry);
  try {
    appendFileSync(LOG_FILE, entry + '\n', 'utf8');
  } catch {
    // don't crash if log file not writable
  }
};

export const logger = {
  info: (message, meta) => write('INFO', message, meta),
  warn: (message, meta) => write('WARN', message, meta),
  error: (message, meta) => write('ERROR', message, meta),
};

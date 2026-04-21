import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'fs';

const QUEUE_FILE = './pending-logs.json';

// append one failed log entry to disk
export const saveToPendingFile = (raw, source) => {
  const entry = JSON.stringify({ raw, source, timestamp: new Date().toISOString() }) + '\n';
  appendFileSync(QUEUE_FILE, entry, 'utf8');
};

// read all pending logs from disk
export const getPendingLogs = () => {
  if (!existsSync(QUEUE_FILE)) return [];
  const content = readFileSync(QUEUE_FILE, 'utf8').trim();
  if (!content) return [];
  return content.split('\n').filter(Boolean).map((line) => JSON.parse(line));
};

// overwrite file with remaining logs (used after partial flush)
export const saveRemainingLogs = (logs) => {
  const content = logs.map((l) => JSON.stringify(l)).join('\n');
  writeFileSync(QUEUE_FILE, content ? content + '\n' : '', 'utf8');
};

// clear file after full successful flush
export const clearPendingFile = () => {
  writeFileSync(QUEUE_FILE, '', 'utf8');
};

// split array into chunks of given size
export const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

// wait helper
export const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

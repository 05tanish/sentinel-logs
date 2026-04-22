import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'fs';
import { PENDING_PATH } from './init.js';

export const saveToPendingFile = (raw, source) => {
  const entry = JSON.stringify({ raw, source, timestamp: new Date().toISOString() }) + '\n';
  appendFileSync(PENDING_PATH, entry, 'utf8');
};

export const getPendingLogs = () => {
  if (!existsSync(PENDING_PATH)) return [];
  const content = readFileSync(PENDING_PATH, 'utf8').trim();
  if (!content) return [];
  return content.split('\n').filter(Boolean).map((line) => JSON.parse(line));
};

export const saveRemainingLogs = (logs) => {
  const content = logs.map((l) => JSON.stringify(l)).join('\n');
  writeFileSync(PENDING_PATH, content ? content + '\n' : '', 'utf8');
};

export const clearPendingFile = () => {
  writeFileSync(PENDING_PATH, '', 'utf8');
};

export const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

export const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

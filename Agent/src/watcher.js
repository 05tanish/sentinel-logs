import chokidar from 'chokidar';
import { createReadStream, statSync, existsSync } from 'fs';
import { createInterface } from 'readline';

// tracks last read position per file — so we never re-read old lines
const positions = {};

// initialize position to end of file (don't re-read history on startup)
const initPosition = (filePath) => {
  if (!positions[filePath]) {
    positions[filePath] = existsSync(filePath) ? statSync(filePath).size : 0;
  }
};

// read only new bytes added since last read
const readNewLines = (filePath, onLine) => {
  const currentSize = statSync(filePath).size;
  const lastPos = positions[filePath] || 0;

  if (currentSize <= lastPos) return; // nothing new

  const stream = createReadStream(filePath, {
    start: lastPos,
    end: currentSize - 1,
    encoding: 'utf8',
  });

  const rl = createInterface({ input: stream });

  rl.on('line', (line) => {
    if (line.trim()) onLine(line);
  });

  rl.on('close', () => {
    positions[filePath] = currentSize; // update position after reading
  });

  stream.on('error', (err) => {
    console.error(`Stream error on ${filePath}:`, err.message);
  });
};

// watch files using chokidar — fires on every file change
export const watchFiles = (filePaths, onNewLine) => {
  // initialize positions first
  filePaths.forEach(initPosition);

  const watcher = chokidar.watch(filePaths, {
    persistent: true,
    ignoreInitial: true,   // don't fire for existing content on startup
    awaitWriteFinish: {
      stabilityThreshold: 100,  // wait 100ms after write before firing
      pollInterval: 50,
    },
  });

  watcher.on('change', (filePath) => {
    readNewLines(filePath, onNewLine);
  });

  watcher.on('error', (err) => {
    console.error('Watcher error:', err.message);
  });

  filePaths.forEach((f) => console.log(`Watching: ${f}`));

  return watcher;
};

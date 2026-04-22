import chokidar from 'chokidar';
import { createReadStream, statSync, existsSync } from 'fs';
import { createInterface } from 'readline';

const positions = {};

const initPosition = (filePath) => {
  if (!positions[filePath]) {
    positions[filePath] = existsSync(filePath) ? statSync(filePath).size : 0;
  }
};

const readNewLines = (filePath, onLine) => {
  try {
    // guard: file may have been deleted between event and read
    if (!existsSync(filePath)) {
      console.warn(`[WATCHER] File no longer exists: ${filePath}`);
      positions[filePath] = 0; // reset position for when it comes back
      return;
    }

    const currentSize = statSync(filePath).size;
    const lastPos = positions[filePath] || 0;

    // file was rotated (new file smaller than last position)
    if (currentSize < lastPos) {
      console.log(`[WATCHER] File rotated: ${filePath} — resetting position`);
      positions[filePath] = 0;
    }

    if (currentSize <= positions[filePath]) return; // nothing new

    const stream = createReadStream(filePath, {
      start: positions[filePath],
      end: currentSize - 1,
      encoding: 'utf8',
    });

    const rl = createInterface({ input: stream });

    rl.on('line', (line) => {
      if (line.trim()) onLine(line);
    });

    rl.on('close', () => {
      positions[filePath] = currentSize;
    });

    stream.on('error', (err) => {
      console.error(`[WATCHER] Stream error on ${filePath}:`, err.message);
    });
  } catch (err) {
    console.error(`[WATCHER] Error reading ${filePath}:`, err.message);
  }
};

export const watchFiles = (filePaths, onNewLine) => {
  filePaths.forEach(initPosition);

  const watcher = chokidar.watch(filePaths, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  });

  watcher.on('change', (filePath) => {
    readNewLines(filePath, onNewLine);
  });

  // handle file deletion — log rotation scenario
  watcher.on('unlink', (filePath) => {
    console.warn(`[WATCHER] File deleted: ${filePath} — will resume if recreated`);
    positions[filePath] = 0;
  });

  // handle file recreation after deletion
  watcher.on('add', (filePath) => {
    console.log(`[WATCHER] File appeared: ${filePath} — resuming watch`);
    positions[filePath] = 0;
  });

  watcher.on('error', (err) => {
    console.error('[WATCHER] Error:', err.message);
  });

  filePaths.forEach((f) => console.log(`Watching: ${f}`));

  return watcher;
};

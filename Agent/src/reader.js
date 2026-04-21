import { createReadStream, existsSync } from 'fs';
import { createInterface } from 'readline';

// reads all existing lines from a log file on startup
export const readLogFile = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!existsSync(filePath)) {
      console.warn(`File not found, skipping: ${filePath}`);
      return resolve([]);
    }

    const lines = [];
    const stream = createReadStream(filePath, { encoding: 'utf8' });
    const rl = createInterface({ input: stream });

    rl.on('line', (line) => {
      if (line.trim()) lines.push(line);
    });

    rl.on('close', () => resolve(lines));
    rl.on('error', reject);
    stream.on('error', reject);
  });
};

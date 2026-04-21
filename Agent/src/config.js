import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config = JSON.parse(
  readFileSync(join(__dirname, '../config.json'), 'utf8')
);

export default config;

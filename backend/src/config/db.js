import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                  // max connections in pool
  idleTimeoutMillis: 30000, // close idle connections after 30s
  connectionTimeoutMillis: 2000, // fail fast if can't connect in 2s
});

export const connectDB = async (retries = 5) => {
  while (retries) {
    try {
      await pool.query('SELECT 1');
      console.log('PostgreSQL connected successfully');

      const schema = readFileSync(join(__dirname, '../schema.sql'), 'utf8');
      await pool.query(schema);
      console.log('Schema initialized');
      return;
    } catch (err) {
      retries--;
      console.log(`DB not ready, retrying... (${retries} left)`);
      if (!retries) {
        console.error('Could not connect to DB:', err.message);
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, 3000));
    }
  }
};

import { Pool, type QueryResultRow } from 'pg';
import { config } from '../config/index.js';

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false
      }
    : {
        host: config.database.host,
        port: config.database.port,
        user: config.database.user,
        password: config.database.password,
        database: config.database.database
      }
);

export function query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) {
  return pool.query<T>(text, params);
}

export { pool };

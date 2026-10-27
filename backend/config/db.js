import pg from 'pg';
import env from './env.js';

const { Pool } = pg;

export default new Pool({ connectionString: env.DATABASE_URL });

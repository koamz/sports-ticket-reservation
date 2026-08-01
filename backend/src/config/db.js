import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://test_user:test_password@localhost:5432/sports_ticket_db'
});

pool.on('connect', () => {
  console.log('PostgreSQL Connection Pool established.');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

export default pool;
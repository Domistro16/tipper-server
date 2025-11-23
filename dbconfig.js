import pkg from 'pg';
const { Pool } = pkg;

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  max: 20, // Maximum number of connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const DB_connection = async () => {
  try {
    const client = await pool.connect();
    console.log(`PostgreSQL connection success on: ${client.host}:${client.port}`);
    client.release();
  } catch (error) {
    console.log('PostgreSQL connection error:', error);
  }
};

// Export the pool for use in queries
export const db = pool;

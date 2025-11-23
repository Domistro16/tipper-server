import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const { Client } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initializeDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  });

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('Connected successfully!');

    console.log('Reading schema file...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

    console.log('Executing schema...');
    await client.query(schemaSQL);

    console.log('Database schema created successfully!');
    console.log('\nTables created:');
    console.log('  - course_progress');
    console.log('  - points');
    console.log('  - droptips');
    console.log('  - members');
    console.log('\nDatabase is ready to use!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initializeDatabase();

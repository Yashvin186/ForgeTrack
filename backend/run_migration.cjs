const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:x,wQ9-V4%23ycwqja@db.yoyyjeiuyhpdfuhoqgfj.supabase.co:5432/postgres';

async function runSQL() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL');

    const migrationPath = path.join(__dirname, 'supabase', 'migrations', 'initial_schema.sql');
    const seedPath = path.join(__dirname, 'seed.sql');

    console.log('Running migration...');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    await client.query(migrationSql);
    console.log('Migration completed.');

    console.log('Running seed...');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await client.query(seedSql);
    console.log('Seed completed.');

  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

runSQL();

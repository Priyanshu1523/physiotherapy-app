/**
 * PostgreSQL Database Initialization Script
 * Runs schema.sql and seed.sql to setup the database.
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Client } = require('pg');

async function initDatabase() {
  const connectionConfig = {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
  };

  const dbName = process.env.PGDATABASE || 'physiotherapy_db';

  console.log(`[Database Init] Connecting to PostgreSQL server at ${connectionConfig.host}:${connectionConfig.port}...`);

  // Step 1: Connect to default 'postgres' database to check/create target database
  const rootClient = new Client({ ...connectionConfig, database: 'postgres' });

  try {
    await rootClient.connect();
    console.log('[Database Init] Connected to PostgreSQL root server.');

    const res = await rootClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (res.rowCount === 0) {
      console.log(`[Database Init] Creating database "${dbName}"...`);
      await rootClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[Database Init] Database "${dbName}" created successfully!`);
    } else {
      console.log(`[Database Init] Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.warn(`[Database Init] Note: Could not auto-create database (might already exist or lack superuser priv): ${err.message}`);
  } finally {
    await rootClient.end().catch(() => {});
  }

  // Step 2: Connect to target database and run schema & seed
  const targetClient = new Client({
    ...connectionConfig,
    database: dbName,
  });

  try {
    await targetClient.connect();
    console.log(`[Database Init] Connected to database "${dbName}".`);

    const schemaPath = path.join(__dirname, 'schema.sql');
    const seedPath = path.join(__dirname, 'seed.sql');

    if (fs.existsSync(schemaPath)) {
      console.log('[Database Init] Executing schema.sql...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await targetClient.query(schemaSql);
      console.log('[Database Init] Schema created successfully!');
    }

    if (fs.existsSync(seedPath)) {
      console.log('[Database Init] Executing seed.sql...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await targetClient.query(seedSql);
      console.log('[Database Init] Seed data inserted successfully!');
    }

    console.log('[Database Init] Done! PostgreSQL database is ready to use.');
  } catch (err) {
    console.error('[Database Init Error]', err);
    process.exit(1);
  } finally {
    await targetClient.end().catch(() => {});
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;

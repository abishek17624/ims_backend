/**
 * db-init.js
 * Reads sql/init.sql and executes it against MySQL.
 * Run with: npm run db:init
 */

const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SQL_FILE = path.join(__dirname, 'init.sql');

async function initializeDatabase(force = false) {
  const dbName = process.env.DB_NAME || 'stockeasy_db';
  const dbPort = parseInt(process.env.DB_PORT || '3306');
  let conn;

  try {
    // 1. Try to connect directly to the target database (needed for remote/shared hostings like Clever Cloud)
    conn = await mysql.createConnection({
      host:            process.env.DB_HOST     || 'localhost',
      port:            dbPort,
      user:            process.env.DB_USER     || 'root',
      password:        process.env.DB_PASSWORD || '',
      database:        dbName,
      multipleStatements: true,
    });
  } catch (err) {
    // If the database doesn't exist (e.g. fresh local install), try connecting without database to create it
    if (err.code === 'ER_BAD_DB_ERROR' || err.errno === 1049) {
      try {
        conn = await mysql.createConnection({
          host:            process.env.DB_HOST     || 'localhost',
          port:            dbPort,
          user:            process.env.DB_USER     || 'root',
          password:        process.env.DB_PASSWORD || '',
          multipleStatements: true,
        });
        console.log(`ℹ️ Database '${dbName}' not found. Attempting to create it...`);
        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;`);
        await conn.query(`USE \`${dbName}\``);
      } catch (innerErr) {
        console.error('❌ Failed to connect and create database:', innerErr.message);
        throw innerErr;
      }
    } else {
      console.error('❌ Database connection failed:', err.message);
      throw err;
    }
  }

  try {
    if (!force) {
      // Check if 'users' table exists to decide if we need to run init.sql
      const [tables] = await conn.query('SHOW TABLES LIKE "users"');
      if (tables.length > 0) {
        console.log(`ℹ️ Database '${dbName}' and tables already exist. Skipping initialization to protect data.`);
        return;
      }
    }

    console.log('🚀 StockEasy DB Init — Starting...\n');
    console.log(`✅ Connected to MySQL at ${process.env.DB_HOST || 'localhost'}:${dbPort}`);

    let sql = fs.readFileSync(SQL_FILE, 'utf8');
    
    // Strip CREATE DATABASE and USE statements to allow running inside pre-allocated cloud databases
    sql = sql.replace(/CREATE DATABASE[\s\S]*?;/gi, '');
    sql = sql.replace(/USE `?[\w\-]+`?;/gi, '');

    await conn.query(sql);
    
    console.log(`✅ Database '${dbName}' initialized and all tables seeded!`);
    console.log('\n📋 Tables created:');
    const tables = [
      'users', 'admin', 'salesperson', 'supplier', 'category',
      'products', 'orders', 'billing', 'invoice',
      'content_home', 'content_about', 'content_features', 'feature_cards'
    ];
    tables.forEach(t => console.log(`   ✔ ${t}`));
    console.log('\n🎉 Database initialization complete!\n');
  } catch (err) {
    console.error('❌ Error during database initialization:', err.message);
    throw err;
  } finally {
    if (conn) await conn.end();
  }
}

// Run directly if this file is executed directly
if (require.main === module) {
  initializeDatabase(true)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { initializeDatabase };


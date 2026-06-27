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
  
  // Connect WITHOUT specifying a database so we can CREATE DATABASE
  const conn = await mysql.createConnection({
    host:            process.env.DB_HOST     || 'localhost',
    user:            process.env.DB_USER     || 'root',
    password:        process.env.DB_PASSWORD || '',
    multipleStatements: true,           // required to run the whole SQL file at once
  });

  try {
    if (!force) {
      // 1. Check if database exists
      const [databases] = await conn.query('SHOW DATABASES LIKE ?', [dbName]);
      if (databases.length > 0) {
        // 2. Database exists, check if 'users' table exists
        await conn.query(`USE \`${dbName}\``);
        const [tables] = await conn.query('SHOW TABLES LIKE "users"');
        if (tables.length > 0) {
          console.log(`ℹ️ Database '${dbName}' and tables already exist. Skipping initialization to protect data.`);
          return;
        }
      }
    }

    console.log('🚀 StockEasy DB Init — Starting...\n');
    console.log(`✅ Connected to MySQL at ${process.env.DB_HOST || 'localhost'}`);

    const sql = fs.readFileSync(SQL_FILE, 'utf8');
    await conn.query(sql);
    
    console.log(`✅ Database '${dbName}' created and all tables seeded!`);
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
    await conn.end();
  }
}

// Run directly if this file is executed directly
if (require.main === module) {
  initializeDatabase(true)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { initializeDatabase };


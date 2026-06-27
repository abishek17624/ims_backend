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

async function main() {
  console.log('🚀 StockEasy DB Init — Starting...\n');

  // Connect WITHOUT specifying a database so we can CREATE DATABASE
  const conn = await mysql.createConnection({
    host:            process.env.DB_HOST     || 'localhost',
    user:            process.env.DB_USER     || 'root',
    password:        process.env.DB_PASSWORD || '',
    multipleStatements: true,           // required to run the whole SQL file at once
  });

  console.log(`✅ Connected to MySQL at ${process.env.DB_HOST || 'localhost'}`);

  const sql = fs.readFileSync(SQL_FILE, 'utf8');

  try {
    await conn.query(sql);
    console.log(`✅ Database '${process.env.DB_NAME || 'stockeasy_db'}' created and all tables seeded!`);
    console.log('\n📋 Tables created:');
    const tables = [
      'users', 'admin', 'salesperson', 'supplier', 'category',
      'products', 'orders', 'billing', 'invoice',
      'content_home', 'content_about', 'content_features', 'feature_cards'
    ];
    tables.forEach(t => console.log(`   ✔ ${t}`));
    console.log('\n🎉 Done! You can now run: npm start\n');
  } catch (err) {
    console.error('❌ Error running init.sql:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();

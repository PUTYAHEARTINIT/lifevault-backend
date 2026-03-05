const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || './lifevault.db';

// Initialize database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('✅ Database connected');
    initTables();
  }
});

// Create tables
function initTables() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  // Vaults table
  db.run(`
    CREATE TABLE IF NOT EXISTS vaults (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      is_public BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Files table (encrypted storage references)
  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      vault_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      encrypted_path TEXT NOT NULL,
      mime_type TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vault_id) REFERENCES vaults(id)
    )
  `);

  // Time-locked content table
  db.run(`
    CREATE TABLE IF NOT EXISTS time_locked_content (
      id TEXT PRIMARY KEY,
      vault_id TEXT NOT NULL,
      content_type TEXT,
      encrypted_content TEXT NOT NULL,
      unlock_date DATETIME NOT NULL,
      recipient_email TEXT,
      is_delivered BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vault_id) REFERENCES vaults(id)
    )
  `);

  // Shared vaults (family tree access)
  db.run(`
    CREATE TABLE IF NOT EXISTS vault_shares (
      id TEXT PRIMARY KEY,
      vault_id TEXT NOT NULL,
      shared_with_email TEXT NOT NULL,
      permission_level TEXT DEFAULT 'view',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vault_id) REFERENCES vaults(id)
    )
  `);

  console.log('✅ Database tables initialized');
}

module.exports = db;

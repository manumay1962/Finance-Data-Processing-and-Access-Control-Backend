const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './database/finance.db';
const absolutePath = path.resolve(DB_PATH);

const fs = require('fs');
const dir = path.dirname(absolutePath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(absolutePath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'viewer' CHECK(role IN ('viewer', 'analyst', 'admin')),
      status      TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS financial_records (
      id          TEXT PRIMARY KEY,
      amount      REAL NOT NULL CHECK(amount >= 0),
      type        TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category    TEXT NOT NULL,
      date        TEXT NOT NULL,
      description TEXT,
      created_by  TEXT NOT NULL REFERENCES users(id),
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at  TEXT DEFAULT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_records_type ON financial_records(type);
    CREATE INDEX IF NOT EXISTS idx_records_category ON financial_records(category);
    CREATE INDEX IF NOT EXISTS idx_records_date ON financial_records(date);
    CREATE INDEX IF NOT EXISTS idx_records_deleted ON financial_records(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
  `);

  console.log('✅ Database initialized successfully');
}

module.exports = { db, initializeDatabase };

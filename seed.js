/**
 * Seed Script — Populates the database with:
 *   1. A default admin user
 *   2. Sample financial records for testing
 * 
 * Run: npm run seed
 */

require('dotenv').config();

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db, initializeDatabase } = require('./src/config/database');

// Initialize tables first
initializeDatabase();

// Clear existing data so seed is re-runnable
db.exec('DELETE FROM financial_records');
db.exec('DELETE FROM users');
console.log('🧹 Cleared existing data.\n');

const ADMIN_ID = uuidv4();
const ANALYST_ID = uuidv4();
const VIEWER_ID = uuidv4();

// ─── Seed Users ──────────────────────────────────────────────
const hashedPassword = bcrypt.hashSync('password123', 10);

const seedUsers = db.prepare(`
  INSERT OR IGNORE INTO users (id, name, email, password, role, status)
  VALUES (?, ?, ?, ?, ?, 'active')
`);

const insertUsers = db.transaction(() => {
  seedUsers.run(ADMIN_ID, 'Admin User', 'admin@finance.com', hashedPassword, 'admin');
  seedUsers.run(ANALYST_ID, 'Analyst User', 'analyst@finance.com', hashedPassword, 'analyst');
  seedUsers.run(VIEWER_ID, 'Viewer User', 'viewer@finance.com', hashedPassword, 'viewer');
});

insertUsers();
console.log('✅ Seed users created:');
console.log('   Admin:   admin@finance.com   / password123');
console.log('   Analyst: analyst@finance.com  / password123');
console.log('   Viewer:  viewer@finance.com   / password123');

// ─── Seed Financial Records ─────────────────────────────────
const sampleRecords = [
  // Income records
  { amount: 5000, type: 'income', category: 'salary', date: '2026-01-15', description: 'January salary' },
  { amount: 5000, type: 'income', category: 'salary', date: '2026-02-15', description: 'February salary' },
  { amount: 5000, type: 'income', category: 'salary', date: '2026-03-15', description: 'March salary' },
  { amount: 1200, type: 'income', category: 'freelance', date: '2026-01-20', description: 'Web development project' },
  { amount: 800, type: 'income', category: 'freelance', date: '2026-02-25', description: 'Logo design work' },
  { amount: 350, type: 'income', category: 'investment', date: '2026-01-10', description: 'Stock dividends Q1' },
  { amount: 1500, type: 'income', category: 'rental', date: '2026-02-01', description: 'Apartment rental income' },
  { amount: 1500, type: 'income', category: 'rental', date: '2026-03-01', description: 'Apartment rental income' },

  // Expense records
  { amount: 1200, type: 'expense', category: 'food', date: '2026-01-05', description: 'Groceries and dining' },
  { amount: 950, type: 'expense', category: 'food', date: '2026-02-08', description: 'Groceries and dining' },
  { amount: 1100, type: 'expense', category: 'food', date: '2026-03-10', description: 'Groceries and dining' },
  { amount: 300, type: 'expense', category: 'transport', date: '2026-01-12', description: 'Monthly metro pass' },
  { amount: 300, type: 'expense', category: 'transport', date: '2026-02-12', description: 'Monthly metro pass' },
  { amount: 150, type: 'expense', category: 'utilities', date: '2026-01-25', description: 'Electricity bill' },
  { amount: 180, type: 'expense', category: 'utilities', date: '2026-02-25', description: 'Electricity bill' },
  { amount: 60, type: 'expense', category: 'utilities', date: '2026-01-28', description: 'Internet subscription' },
  { amount: 500, type: 'expense', category: 'entertainment', date: '2026-02-14', description: 'Concert tickets' },
  { amount: 250, type: 'expense', category: 'healthcare', date: '2026-03-05', description: 'Dental checkup' },
  { amount: 2000, type: 'expense', category: 'education', date: '2026-01-02', description: 'Online course subscription' },
  { amount: 450, type: 'expense', category: 'shopping', date: '2026-03-20', description: 'New headphones' },
  { amount: 3500, type: 'expense', category: 'travel', date: '2026-03-25', description: 'Weekend trip flights and hotel' },
];

const seedRecord = db.prepare(`
  INSERT INTO financial_records (id, amount, type, category, date, description, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertRecords = db.transaction(() => {
  for (const record of sampleRecords) {
    seedRecord.run(
      uuidv4(),
      record.amount,
      record.type,
      record.category,
      record.date,
      record.description,
      ADMIN_ID
    );
  }
});

insertRecords();
console.log(`✅ ${sampleRecords.length} sample financial records created.`);
console.log('\n🎉 Seed complete! Start the server with: npm start');

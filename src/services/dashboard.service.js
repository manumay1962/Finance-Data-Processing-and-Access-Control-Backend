const { db } = require('../config/database');

function getSummary() {
  const result = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)  AS total_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses,
      COUNT(*) AS total_records
    FROM financial_records
    WHERE deleted_at IS NULL
  `).get();

  return {
    total_income: result.total_income,
    total_expenses: result.total_expenses,
    net_balance: result.total_income - result.total_expenses,
    total_records: result.total_records,
  };
}

function getCategoryTotals() {
  const rows = db.prepare(`
    SELECT
      category,
      type,
      SUM(amount) AS total,
      COUNT(*) AS count
    FROM financial_records
    WHERE deleted_at IS NULL
    GROUP BY category, type
    ORDER BY total DESC
  `).all();

  const income = [];
  const expense = [];

  for (const row of rows) {
    const entry = { category: row.category, total: row.total, count: row.count };
    if (row.type === 'income') {
      income.push(entry);
    } else {
      expense.push(entry);
    }
  }

  return { income, expense };
}

function getMonthlyTrends(year) {
  const targetYear = year || new Date().getFullYear();

  const rows = db.prepare(`
    SELECT
      strftime('%m', date) AS month,
      type,
      SUM(amount) AS total,
      COUNT(*) AS count
    FROM financial_records
    WHERE deleted_at IS NULL
      AND strftime('%Y', date) = ?
    GROUP BY month, type
    ORDER BY month ASC
  `).all(String(targetYear));

  const months = [];
  for (let m = 1; m <= 12; m++) {
    const monthStr = String(m).padStart(2, '0');
    const incomeRow = rows.find((r) => r.month === monthStr && r.type === 'income');
    const expenseRow = rows.find((r) => r.month === monthStr && r.type === 'expense');

    months.push({
      month: m,
      month_label: new Date(targetYear, m - 1).toLocaleString('en-US', { month: 'short' }),
      income: incomeRow ? incomeRow.total : 0,
      expense: expenseRow ? expenseRow.total : 0,
      net: (incomeRow ? incomeRow.total : 0) - (expenseRow ? expenseRow.total : 0),
      transaction_count: (incomeRow ? incomeRow.count : 0) + (expenseRow ? expenseRow.count : 0),
    });
  }

  return { year: targetYear, months };
}

function getRecentActivity(limit = 10) {
  return db.prepare(`
    SELECT fr.*, u.name as created_by_name
    FROM financial_records fr
    LEFT JOIN users u ON fr.created_by = u.id
    WHERE fr.deleted_at IS NULL
    ORDER BY fr.created_at DESC
    LIMIT ?
  `).all(limit);
}

module.exports = { getSummary, getCategoryTotals, getMonthlyTrends, getRecentActivity };

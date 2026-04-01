const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');

function createRecord({ amount, type, category, date, description }, createdBy) {
  const id = uuidv4();

  db.prepare(`
    INSERT INTO financial_records (id, amount, type, category, date, description, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, amount, type, category, date, description || null, createdBy);

  return getRecordById(id);
}

function getRecordById(id) {
  const record = db.prepare(`
    SELECT fr.*, u.name as created_by_name
    FROM financial_records fr
    LEFT JOIN users u ON fr.created_by = u.id
    WHERE fr.id = ? AND fr.deleted_at IS NULL
  `).get(id);

  if (!record) {
    const err = new Error('Financial record not found.');
    err.statusCode = 404;
    throw err;
  }

  return record;
}

function getRecords({ type, category, startDate, endDate, page = 1, limit = 20 }) {
  const conditions = ['fr.deleted_at IS NULL'];
  const params = [];

  if (type) {
    conditions.push('fr.type = ?');
    params.push(type);
  }

  if (category) {
    conditions.push('fr.category = ?');
    params.push(category);
  }

  if (startDate) {
    conditions.push('fr.date >= ?');
    params.push(startDate);
  }

  if (endDate) {
    conditions.push('fr.date <= ?');
    params.push(endDate);
  }

  const whereClause = conditions.join(' AND ');
  const offset = (page - 1) * limit;

  const countResult = db.prepare(`
    SELECT COUNT(*) as total
    FROM financial_records fr
    WHERE ${whereClause}
  `).get(...params);

  const records = db.prepare(`
    SELECT fr.*, u.name as created_by_name
    FROM financial_records fr
    LEFT JOIN users u ON fr.created_by = u.id
    WHERE ${whereClause}
    ORDER BY fr.date DESC, fr.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const total = countResult.total;
  const totalPages = Math.ceil(total / limit);

  return {
    records,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

function updateRecord(id, updates) {
  const existing = getRecordById(id);

  const fields = [];
  const params = [];

  if (updates.amount !== undefined) {
    fields.push('amount = ?');
    params.push(updates.amount);
  }
  if (updates.type !== undefined) {
    fields.push('type = ?');
    params.push(updates.type);
  }
  if (updates.category !== undefined) {
    fields.push('category = ?');
    params.push(updates.category);
  }
  if (updates.date !== undefined) {
    fields.push('date = ?');
    params.push(updates.date);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    params.push(updates.description);
  }

  if (fields.length === 0) {
    const err = new Error('No valid fields to update.');
    err.statusCode = 400;
    throw err;
  }

  fields.push("updated_at = datetime('now')");

  db.prepare(`
    UPDATE financial_records SET ${fields.join(', ')} WHERE id = ?
  `).run(...params, id);

  return getRecordById(id);
}

function deleteRecord(id) {
  getRecordById(id);

  db.prepare(`
    UPDATE financial_records SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?
  `).run(id);

  return { message: 'Record deleted successfully.' };
}

module.exports = { createRecord, getRecordById, getRecords, updateRecord, deleteRecord };

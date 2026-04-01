const { db } = require('../config/database');

function getAllUsers() {
  return db.prepare(`
    SELECT id, name, email, role, status, created_at, updated_at
    FROM users
    ORDER BY created_at DESC
  `).all();
}

function getUserById(id) {
  const user = db.prepare(`
    SELECT id, name, email, role, status, created_at, updated_at
    FROM users WHERE id = ?
  `).get(id);

  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  return user;
}

function updateRole(id, role) {
  const user = getUserById(id); // throws if not found

  if (user.role === role) {
    const err = new Error(`User already has the '${role}' role.`);
    err.statusCode = 400;
    throw err;
  }

  db.prepare(`
    UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?
  `).run(role, id);

  return { ...user, role, updated_at: new Date().toISOString() };
}

function updateStatus(id, status) {
  const user = getUserById(id); // throws if not found

  if (user.status === status) {
    const err = new Error(`User is already '${status}'.`);
    err.statusCode = 400;
    throw err;
  }

  db.prepare(`
    UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?
  `).run(status, id);

  return { ...user, status, updated_at: new Date().toISOString() };
}

function deleteUser(id, requestingUserId) {
  if (id === requestingUserId) {
    const err = new Error('You cannot delete your own account.');
    err.statusCode = 400;
    throw err;
  }

  getUserById(id);

  db.prepare('DELETE FROM users WHERE id = ?').run(id);

  return { message: 'User deleted successfully.' };
}

module.exports = { getAllUsers, getUserById, updateRole, updateStatus, deleteUser };

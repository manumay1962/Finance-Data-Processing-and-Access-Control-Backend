const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');

const SALT_ROUNDS = 10;

function register({ name, email, password }) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    const err = new Error('A user with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
  const id = uuidv4();

  db.prepare(`
    INSERT INTO users (id, name, email, password, role, status)
    VALUES (?, ?, ?, ?, 'viewer', 'active')
  `).run(id, name, email, hashedPassword);

  return {
    id,
    name,
    email,
    role: 'viewer',
    status: 'active',
  };
}

function login({ email, password }) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  if (user.status === 'inactive') {
    const err = new Error('Account is deactivated. Contact an administrator.');
    err.statusCode = 403;
    throw err;
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  };
}

module.exports = { register, login };

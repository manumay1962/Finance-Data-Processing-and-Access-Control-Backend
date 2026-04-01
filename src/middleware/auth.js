const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { error } = require('../utils/apiResponse');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Access denied. No token provided.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = db.prepare('SELECT id, name, email, role, status FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return error(res, 'User not found. Token is invalid.', 401);
    }

    if (user.status === 'inactive') {
      return error(res, 'Account is deactivated. Contact an administrator.', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Token has expired. Please login again.', 401);
    }
    return error(res, 'Invalid token.', 401);
  }
}

module.exports = { authenticate };

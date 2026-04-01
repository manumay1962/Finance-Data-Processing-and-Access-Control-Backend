const authService = require('../services/auth.service');
const { success, error } = require('../utils/apiResponse');

async function register(req, res, next) {
  try {
    const user = authService.register(req.body);
    return success(res, user, 'User registered successfully.', 201);
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode);
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = authService.login(req.body);
    return success(res, result, 'Login successful.');
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode);
    }
    next(err);
  }
}

async function getMe(req, res) {
  return success(res, req.user, 'Profile retrieved successfully.');
}

module.exports = { register, login, getMe };

const userService = require('../services/user.service');
const { success, error } = require('../utils/apiResponse');

async function getAllUsers(req, res, next) {
  try {
    const users = userService.getAllUsers();
    return success(res, users, 'Users retrieved successfully.');
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = userService.getUserById(req.params.id);
    return success(res, user, 'User retrieved successfully.');
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode);
    }
    next(err);
  }
}

async function updateRole(req, res, next) {
  try {
    const user = userService.updateRole(req.params.id, req.body.role);
    return success(res, user, 'User role updated successfully.');
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode);
    }
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const user = userService.updateStatus(req.params.id, req.body.status);
    return success(res, user, 'User status updated successfully.');
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode);
    }
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const result = userService.deleteUser(req.params.id, req.user.id);
    return success(res, result, 'User deleted successfully.');
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode);
    }
    next(err);
  }
}

module.exports = { getAllUsers, getUserById, updateRole, updateStatus, deleteUser };

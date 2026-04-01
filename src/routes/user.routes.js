const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { updateRoleRules, updateStatusRules } = require('../validators/user.validator');

// admin only
router.use(authenticate, authorize('admin'));

// list
router.get('/', userController.getAllUsers);

// single
router.get('/:id', userController.getUserById);

// role
router.patch('/:id/role', updateRoleRules, validate, userController.updateRole);

// status
router.patch('/:id/status', updateStatusRules, validate, userController.updateStatus);

// delete
router.delete('/:id', userController.deleteUser);

module.exports = router;

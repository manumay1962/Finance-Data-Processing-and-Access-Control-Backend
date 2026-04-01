const { body } = require('express-validator');

const updateRoleRules = [
  body('role')
    .trim()
    .notEmpty().withMessage('Role is required.')
    .isIn(['viewer', 'analyst', 'admin']).withMessage('Role must be one of: viewer, analyst, admin.'),
];

const updateStatusRules = [
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required.')
    .isIn(['active', 'inactive']).withMessage('Status must be one of: active, inactive.'),
];

module.exports = { updateRoleRules, updateStatusRules };

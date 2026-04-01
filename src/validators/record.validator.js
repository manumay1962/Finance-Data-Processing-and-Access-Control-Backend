const { body } = require('express-validator');

const VALID_CATEGORIES = [
  'salary', 'freelance', 'investment', 'rental',
  'food', 'transport', 'utilities', 'entertainment',
  'healthcare', 'education', 'shopping', 'travel', 'other'
];

const createRecordRules = [
  body('amount')
    .notEmpty().withMessage('Amount is required.')
    .isFloat({ min: 0 }).withMessage('Amount must be a non-negative number.'),

  body('type')
    .trim()
    .notEmpty().withMessage('Type is required.')
    .isIn(['income', 'expense']).withMessage('Type must be either "income" or "expense".'),

  body('category')
    .trim()
    .notEmpty().withMessage('Category is required.')
    .isIn(VALID_CATEGORIES).withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}.`),

  body('date')
    .trim()
    .notEmpty().withMessage('Date is required.')
    .isISO8601({ strict: true }).withMessage('Date must be a valid ISO 8601 date (e.g. 2026-01-15).'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters.'),
];

const updateRecordRules = [
  body('amount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Amount must be a non-negative number.'),

  body('type')
    .optional()
    .trim()
    .isIn(['income', 'expense']).withMessage('Type must be either "income" or "expense".'),

  body('category')
    .optional()
    .trim()
    .isIn(VALID_CATEGORIES).withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}.`),

  body('date')
    .optional()
    .trim()
    .isISO8601({ strict: true }).withMessage('Date must be a valid ISO 8601 date (e.g. 2026-01-15).'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters.'),
];

module.exports = { createRecordRules, updateRecordRules, VALID_CATEGORIES };

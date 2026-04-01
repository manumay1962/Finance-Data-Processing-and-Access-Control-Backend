const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerRules, loginRules } = require('../validators/auth.validator');

// register
router.post('/register', registerRules, validate, authController.register);

// login
router.post('/login', loginRules, validate, authController.login);

// profile
router.get('/me', authenticate, authController.getMe);

module.exports = router;

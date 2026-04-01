const express = require('express');
const router = express.Router();
const recordController = require('../controllers/record.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { createRecordRules, updateRecordRules } = require('../validators/record.validator');

// require auth
router.use(authenticate);

// create
router.post('/', authorize('admin'), createRecordRules, validate, recordController.createRecord);

// list
router.get('/', authorize('analyst', 'admin'), recordController.getRecords);

// get single
router.get('/:id', authorize('analyst', 'admin'), recordController.getRecordById);

// update
router.put('/:id', authorize('admin'), updateRecordRules, validate, recordController.updateRecord);

// soft delete
router.delete('/:id', authorize('admin'), recordController.deleteRecord);

module.exports = router;

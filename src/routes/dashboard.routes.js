const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// require auth
router.use(authenticate);

// summary
router.get('/summary', dashboardController.getSummary);

// categories
router.get('/category-totals', authorize('viewer', 'analyst', 'admin'), dashboardController.getCategoryTotals);

// trends
router.get('/trends', authorize('viewer', 'analyst', 'admin'), dashboardController.getMonthlyTrends);

// recents
router.get('/recent-activity', authorize('viewer', 'analyst', 'admin'), dashboardController.getRecentActivity);

module.exports = router;

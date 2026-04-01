const dashboardService = require('../services/dashboard.service');
const { success } = require('../utils/apiResponse');

async function getSummary(req, res, next) {
  try {
    const summary = dashboardService.getSummary();
    return success(res, summary, 'Dashboard summary retrieved successfully.');
  } catch (err) {
    next(err);
  }
}

async function getCategoryTotals(req, res, next) {
  try {
    const totals = dashboardService.getCategoryTotals();
    return success(res, totals, 'Category totals retrieved successfully.');
  } catch (err) {
    next(err);
  }
}

async function getMonthlyTrends(req, res, next) {
  try {
    const year = req.query.year ? parseInt(req.query.year) : undefined;
    const trends = dashboardService.getMonthlyTrends(year);
    return success(res, trends, 'Monthly trends retrieved successfully.');
  } catch (err) {
    next(err);
  }
}

async function getRecentActivity(req, res, next) {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const activity = dashboardService.getRecentActivity(limit);
    return success(res, activity, 'Recent activity retrieved successfully.');
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary, getCategoryTotals, getMonthlyTrends, getRecentActivity };

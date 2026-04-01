const recordService = require('../services/record.service');
const { success, error, paginated } = require('../utils/apiResponse');

async function createRecord(req, res, next) {
  try {
    const record = recordService.createRecord(req.body, req.user.id);
    return success(res, record, 'Financial record created successfully.', 201);
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode);
    }
    next(err);
  }
}

async function getRecords(req, res, next) {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 20 } = req.query;

    // Validate pagination params
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    const result = recordService.getRecords({
      type,
      category,
      startDate,
      endDate,
      page: pageNum,
      limit: limitNum,
    });

    return paginated(res, result.records, result.pagination, 'Records retrieved successfully.');
  } catch (err) {
    next(err);
  }
}

async function getRecordById(req, res, next) {
  try {
    const record = recordService.getRecordById(req.params.id);
    return success(res, record, 'Record retrieved successfully.');
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode);
    }
    next(err);
  }
}

async function updateRecord(req, res, next) {
  try {
    const record = recordService.updateRecord(req.params.id, req.body);
    return success(res, record, 'Record updated successfully.');
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode);
    }
    next(err);
  }
}

async function deleteRecord(req, res, next) {
  try {
    const result = recordService.deleteRecord(req.params.id);
    return success(res, result, 'Record deleted successfully.');
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode);
    }
    next(err);
  }
}

module.exports = { createRecord, getRecords, getRecordById, updateRecord, deleteRecord };

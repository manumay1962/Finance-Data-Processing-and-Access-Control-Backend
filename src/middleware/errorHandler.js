const { error } = require('../utils/apiResponse');

function errorHandler(err, req, res, _next) {
  console.error(`❌ [${new Date().toISOString()}] ${err.message}`);
  console.error(err.stack);

  if (err.type === 'entity.parse.failed') {
    return error(res, 'Invalid JSON in request body.', 400);
  }

  if (err.code === 'SQLITE_CONSTRAINT') {
    return error(res, 'Database constraint violation.', 409);
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error.' : err.message;

  return error(res, message, statusCode);
}

module.exports = { errorHandler };

const { error } = require('../utils/apiResponse');

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return error(
        res,
        `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}.`,
        403
      );
    }

    next();
  };
}

module.exports = { authorize };

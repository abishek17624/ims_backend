/**
 * middleware/role.middleware.js
 * Accepts a single role string OR an array of allowed roles.
 * Usage:
 *   roleMiddleware('admin')
 *   roleMiddleware(['admin', 'salesperson'])
 */
const roleMiddleware = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied: requires role(s) [${roles.join(', ')}]`
      });
    }
    next();
  };
};

module.exports = roleMiddleware;

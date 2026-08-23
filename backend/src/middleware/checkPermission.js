const Role = require('../models/Role');

// =============================================
// بررسی مجوز خاص (Permission-Based)
// =============================================
const checkPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          error: 'وارد سیستم نشده‌اید' 
        });
      }

      const userRoleName = req.user.roleName || req.user.role?.name || 'user';
      if (userRoleName === 'admin') {
        return next();
      }

      if (req.user.extraPermissions && req.user.extraPermissions.length > 0) {
        const hasExtraPerm = req.user.extraPermissions.some(p => p.name === permissionName);
        if (hasExtraPerm) {
          return next();
        }
      }

      if (req.user.role) {
        const userRole = await Role.findById(req.user.role).populate('permissions');
        if (userRole) {
          const hasRolePerm = userRole.permissions.some(p => p.name === permissionName);
          if (hasRolePerm) {
            return next();
          }
        }
      }

      return res.status(403).json({
        success: false,
        error: `شما مجوز ${permissionName} را ندارید`,
      });
    } catch (error) {
      console.error('❌ خطا در بررسی مجوز:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  };
};

module.exports = checkPermission;
const Role = require('../../models/Role');

// =============================================
// بررسی مجوز خاص (Permission-Based)
// =============================================
const checkPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'وارد سیستم نشده‌اید',
        });
      }

      // ادمین دسترسی کامل دارد
      const userRoleName = req.user.roleName || req.user.role?.name || 'user';
      if (userRoleName === 'admin') {
        return next();
      }

      // بررسی extraPermissions
      if (req.user.extraPermissions && req.user.extraPermissions.length > 0) {
        const hasExtraPerm = req.user.extraPermissions.some(p => p.name === permissionName);
        if (hasExtraPerm) {
          return next();
        }
      }

      // بررسی مجوزهای نقش
      if (req.user.role) {
        let role = req.user.role;
        if (typeof role === 'string' || role._id) {
          role = await Role.findById(req.user.role).populate('permissions');
        }
        
        if (role) {
          const hasRolePerm = role.permissions.some(p => p.name === permissionName);
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
        error: error.message,
      });
    }
  };
};

// =============================================
// بررسی نقش (Role-Based)
// =============================================
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'وارد سیستم نشده‌اید',
      });
    }

    const userRole = req.user.roleName || req.user.role?.name || 'user';
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `شما دسترسی لازم برای این عملیات را ندارید`,
      });
    }
    next();
  };
};

// =============================================
// بررسی مالکیت (Owner-Based)
// =============================================
const checkOwnership = (model) => {
  return async (req, res, next) => {
    try {
      const item = await model.findById(req.params.id);
      if (!item) {
        return res.status(404).json({
          success: false,
          error: 'آیتم یافت نشد',
        });
      }

      const isOwner = item.user?.toString() === req.user.id ||
                      item.createdBy?.toString() === req.user.id ||
                      item.owner?.toString() === req.user.id;

      const isAdmin = req.user.roleName === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'شما دسترسی به این آیتم را ندارید',
        });
      }

      req.item = item;
      next();
    } catch (error) {
      console.error('❌ خطا در بررسی مالکیت:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };
};

module.exports = {
  checkPermission,
  authorize,
  checkOwnership,
};
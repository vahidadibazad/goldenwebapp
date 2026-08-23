const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

// =============================================
// بررسی احراز هویت (نسخه بهبودیافته کامل)
// =============================================
const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'برای دسترسی به این مسیر باید وارد سیستم شوید',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ بهبود: دریافت کاربر با populate شرطی
    const user = await User.findById(decoded.id)
      .select('-password')
      .populate({
        path: 'role',
        match: { isActive: true }, // فقط نقش‌های فعال
        populate: {
          path: 'permissions',
          select: 'name label module'
        }
      })
      .populate('extraPermissions');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'کاربر یافت نشد',
      });
    }

    // ✅ بررسی فعال بودن کاربر
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        error: 'حساب کاربری شما غیرفعال شده است',
      });
    }

    // ✅ تنظیم نقش کاربر (با fallback)
    req.user = user;
    req.user.roleName = user.role?.name || decoded.role || 'user';
    
    next();
  } catch (error) {
    console.error('❌ خطا در احراز هویت:', error.message);
    return res.status(401).json({
      success: false,
      error: 'توکن نامعتبر است',
    });
  }
};

// =============================================
// بررسی مجوز (نسخه بهبودیافته کامل)
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
      
      // ✅ ادمین دسترسی کامل دارد
      if (userRoleName === 'admin') {
        return next();
      }

      // ✅ بررسی extraPermissions
      if (req.user.extraPermissions && req.user.extraPermissions.length > 0) {
        const hasExtraPerm = req.user.extraPermissions.some(p => p.name === permissionName);
        if (hasExtraPerm) {
          return next();
        }
      }

      // ✅ بررسی مجوزهای نقش
      if (req.user.role) {
        // اگر role قبلاً populate نشده، دوباره populate کن
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
        error: error.message 
      });
    }
  };
};

// =============================================
// بررسی سطح دسترسی (Role-Based)
// =============================================
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'ابتدا وارد سیستم شوید',
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

module.exports = { protect, authorize, checkPermission };
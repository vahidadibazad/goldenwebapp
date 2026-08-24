// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// محافظت از مسیرها (احراز هویت)
const protect = async (req, res, next) => {
  // 1. دریافت توکن از هدر
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. اگر توکن وجود ندارد
  if (!token) {
    return res.status(401).json({ success: false, error: 'شما وارد سیستم نشده‌اید' });
  }

  try {
    // 3. بررسی توکن
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
    
    // 4. پیدا کردن کاربر (با populate role)
    const user = await User.findById(decoded.id).select('-password').populate('role');

    if (!user) {
      return res.status(401).json({ success: false, error: 'کاربر یافت نشد' });
    }

    // 5. ذخیره کاربر در req
    req.user = user;
    next();
  } catch (error) {
    // 6. خطای توکن نامعتبر
    res.status(401).json({ success: false, error: 'توکن نامعتبر است' });
  }
};

// دسترسی فقط ادمین
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'شما وارد سیستم نشده‌اید' });
  }

  // بررسی نقش به صورت مستقیم و ساده
  const userRole = req.user.role;
  if (userRole && (userRole.name === 'admin' || userRole === 'admin')) {
    return next();
  }

  return res.status(403).json({ success: false, error: 'دسترسی ادمین ندارید' });
};

// سایر توابع کمکی را می‌توانید به همین سادگی تعریف کنید
const checkPermission = () => (req, res, next) => next();
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'وارد نشده‌اید' });
  const userRole = req.user.role?.name || req.user.role;
  if (roles.includes(userRole)) return next();
  return res.status(403).json({ success: false, error: 'دسترسی ندارید' });
};

module.exports = { protect, adminOnly, checkPermission, authorize };
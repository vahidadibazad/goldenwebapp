const rateLimit = require('express-rate-limit');

// =============================================
// محدودیت عمومی API
// =============================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ۱۵ دقیقه
  max: 500, // ۱۰۰ درخواست
  message: {
    success: false,
    error: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً بعداً تلاش کنید.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// =============================================
// محدودیت برای لاگین
// =============================================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ۱۵ دقیقه
  max: 5, // ۵ درخواست
  message: {
    success: false,
    error: 'تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً ۱۵ دقیقه بعد تلاش کنید.',
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// =============================================
// محدودیت برای آپلود فایل
// =============================================
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ۱ ساعت
  max: 50, // ۵۰ آپلود
  message: {
    success: false,
    error: 'تعداد آپلودهای شما بیش از حد مجاز است. لطفاً بعداً تلاش کنید.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// =============================================
// محدودیت برای جستجو
// =============================================
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // ۱ دقیقه
  max: 30, // ۳۰ جستجو
  message: {
    success: false,
    error: 'تعداد جستجوهای شما بیش از حد مجاز است. لطفاً بعداً تلاش کنید.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// =============================================
// محدودیت برای API‌های حساس (حذف، ویرایش)
// =============================================
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // ۱ دقیقه
  max: 10, // ۱۰ درخواست
  message: {
    success: false,
    error: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً بعداً تلاش کنید.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  loginLimiter,
  uploadLimiter,
  searchLimiter,
  strictLimiter,
};
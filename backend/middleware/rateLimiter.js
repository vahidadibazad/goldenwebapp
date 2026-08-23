const rateLimit = require('express-rate-limit');

const createLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 دقیقه
    max: options.max || 100, // 100 درخواست
    message: {
      success: false,
      error: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً بعداً تلاش کنید.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });
};

// محدودیت برای لاگین
const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});

// محدودیت برای API عمومی
const apiLimiter = createLimiter({
  windowMs: 60 * 1000, // ۱ دقیقه
  max: 60,
});

module.exports = { createLimiter, loginLimiter, apiLimiter };
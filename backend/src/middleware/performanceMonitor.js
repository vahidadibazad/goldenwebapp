// backend/src/middleware/performanceMonitor.js
const logger = require('../utils/logger');

// =============================================
// ✅ ذخیره زمان شروع درخواست
// =============================================
const performanceMonitor = (req, res, next) => {
  const startTime = process.hrtime();
  
  // ذخیره زمان شروع در req
  req.startTime = startTime;
  
  // گرفتن response پایان
  const originalSend = res.send;
  res.send = function(data) {
    // محاسبه زمان اجرا
    const diff = process.hrtime(startTime);
    const duration = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2);
    
    // لاگ API
    logger.api(req, res, duration);
    
    // اگر زمان پاسخ بیشتر از ۱ ثانیه بود، هشدار بده
    if (duration > 1000) {
      logger.warn(`⚠️ درخواست کند: ${req.method} ${req.url} - ${duration}ms`);
    }
    
    // اگر زمان پاسخ بیشتر از ۳ ثانیه بود، خطا ثبت کن
    if (duration > 3000) {
      logger.error(`🐌 درخواست بسیار کند: ${req.method} ${req.url} - ${duration}ms`);
    }
    
    // فراخوانی send اصلی
    originalSend.call(this, data);
  };
  
  next();
};

// =============================================
// ✅ مانیتورینگ کوئری‌های دیتابیس
// =============================================
const queryMonitor = (collection, operation, filter) => {
  const startTime = process.hrtime();
  
  return {
    end: () => {
      const diff = process.hrtime(startTime);
      const duration = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2);
      
      // لاگ کوئری
      logger.query(collection, operation, filter, duration);
      
      // اگر کوئری بیشتر از ۵۰۰ms طول کشید، هشدار بده
      if (duration > 500) {
        logger.warn(`⚠️ کوئری کند: ${collection}.${operation} - ${duration}ms`);
      }
      
      return duration;
    }
  };
};

// =============================================
// ✅ مانیتورینگ حافظه
// =============================================
const memoryMonitor = () => {
  const memoryUsage = process.memoryUsage();
  const used = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
  const total = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);
  
  // اگر استفاده از حافظه بیش از ۸۰٪ بود، هشدار بده
  if (parseFloat(used) / parseFloat(total) > 0.8) {
    logger.warn(`⚠️ استفاده بالای حافظه: ${used}MB / ${total}MB`);
  }
  
  return { used, total };
};

// =============================================
// ✅ مانیتورینگ Event Loop
// =============================================
const eventLoopMonitor = () => {
  const start = process.hrtime();
  
  setImmediate(() => {
    const diff = process.hrtime(start);
    const delay = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2);
    
    // اگر Event Loop بیش از ۵۰ms تأخیر داشت، هشدار بده
    if (delay > 50) {
      logger.warn(`⚠️ Event Loop تأخیر: ${delay}ms`);
    }
  });
};

// =============================================
// ✅ اجرای دوره‌ای مانیتورینگ
// =============================================
const startMonitoring = () => {
  // هر ۳۰ ثانیه یکبار حافظه را بررسی کن
  setInterval(() => {
    memoryMonitor();
    eventLoopMonitor();
  }, 30000);
};

module.exports = {
  performanceMonitor,
  queryMonitor,
  memoryMonitor,
  eventLoopMonitor,
  startMonitoring,
};
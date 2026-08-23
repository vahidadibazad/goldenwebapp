const mongoose = require('mongoose');

// =============================================
// مدل لاگ پیشرفته با جزئیات کامل
// =============================================
const AuditLogSchema = new mongoose.Schema({
  // ===== اطلاعات کاربر =====
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    default: '',
  },
  userRole: {
    type: String,
    default: 'user',
  },

  // ===== نوع عملیات =====
  action: {
    type: String,
    enum: [
      'CREATE',    // ایجاد
      'UPDATE',    // ویرایش
      'DELETE',    // حذف
      'LOGIN',     // ورود
      'LOGOUT',    // خروج
      'VIEW',      // مشاهده
      'DOWNLOAD',  // دانلود
      'SEARCH',    // جستجو
      'EXPORT',    // خروجی گرفتن
      'IMPORT',    // ورودی گرفتن
    ],
    required: true,
  },

  // ===== ماژول مربوطه =====
  module: {
    type: String,
    enum: [
      'HARDWARE',    // اموال
      'CREDENTIAL',  // رمزها
      'DOCUMENT',    // اسناد
      'TICKET',      // تیکت‌ها
      'USER',        // کاربران
      'CATEGORY',    // دسته‌بندی‌ها
      'ROLE',        // نقش‌ها
      'AUTH',        // احراز هویت
      'SEARCH',      // جستجو
      'SETTINGS',    // تنظیمات
      'BACKUP',      // پشتیبان‌گیری
    ],
    required: true,
  },

  // ===== جزئیات عملیات =====
  details: {
    type: Object,
    default: {},
    // مثال: { hardwareId: '...', name: 'سرور اصلی' }
  },

  // ===== تغییرات (قبل و بعد) =====
  changes: {
    type: Object,
    default: {},
    // مثال: { before: { status: 'in_stock' }, after: { status: 'active' } }
  },

  // ===== اطلاعات فنی =====
  ip: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
  browser: {
    type: String,
    default: '',
  },
  os: {
    type: String,
    default: '',
  },
  device: {
    type: String,
    default: '',
  },

  // ===== زمان =====
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: false }); // از timestamp خودمان استفاده می‌کنیم

// =============================================
// ایندکس‌ها برای جستجوی سریع
// =============================================
AuditLogSchema.index({ user: 1, timestamp: -1 });
AuditLogSchema.index({ module: 1, action: 1 });
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ username: 'text', fullName: 'text' });

// =============================================
// متدهای کمکی
// =============================================
AuditLogSchema.statics.getStats = async function (days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    { $match: { timestamp: { $gte: startDate } } },
    {
      $group: {
        _id: { module: '$module', action: '$action' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.module',
        actions: {
          $push: { action: '$_id.action', count: '$count' },
        },
        total: { $sum: '$count' },
      },
    },
    { $sort: { total: -1 } },
  ]);
};

AuditLogSchema.statics.getUserActivity = async function (userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    user: userId,
    timestamp: { $gte: startDate },
  }).sort({ timestamp: -1 });
};

// =============================================
// مدل نهایی
// =============================================
module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
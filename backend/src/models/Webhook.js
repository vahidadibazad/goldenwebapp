// backend/src/models/Webhook.js
const mongoose = require('mongoose');

const WebhookSchema = new mongoose.Schema(
  {
    // =============================================
    // اطلاعات پایه
    // =============================================
    name: {
      type: String,
      required: [true, 'نام وب‌هوک الزامی است'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'آدرس وب‌هوک الزامی است'],
      trim: true,
    },

    // =============================================
    // رویدادها
    // =============================================
    events: [{
      type: String,
      enum: [
        // نامه
        'letter.created',
        'letter.updated',
        'letter.registered',
        'letter.approved',
        'letter.rejected',
        'letter.signed',
        'letter.archived',
        // ارجاع
        'referral.created',
        'referral.actioned',
        // امضا
        'signature.created',
        'signature.verified',
        // فکس
        'fax.received',
        'fax.sent',
        // ایمیل
        'email.received',
        'email.sent',
        // گزارش
        'report.generated',
        // سیستم
        'user.created',
        'user.updated',
        'system.error',
        'system.backup',
      ],
    }],

    // =============================================
    // روش احراز هویت
    // =============================================
    auth: {
      type: {
        type: String,
        enum: ['none', 'basic', 'bearer', 'api_key'],
        default: 'none',
      },
      username: { type: String, default: '' },
      password: { type: String, default: '' },
      token: { type: String, default: '' },
      apiKey: { type: String, default: '' },
      apiKeyHeader: { type: String, default: 'X-API-Key' },
    },

    // =============================================
    // تنظیمات
    // =============================================
    settings: {
      retryCount: { type: Number, default: 3 },
      retryDelay: { type: Number, default: 1000 },
      timeout: { type: Number, default: 5000 },
      active: { type: Boolean, default: true },
    },

    // =============================================
    // فیلترهای رویداد
    // =============================================
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // =============================================
    // آمار
    // =============================================
    stats: {
      totalCalls: { type: Number, default: 0 },
      successfulCalls: { type: Number, default: 0 },
      failedCalls: { type: Number, default: 0 },
      lastCall: { type: Date, default: null },
      lastError: { type: String, default: '' },
    },

    // =============================================
    // اطلاعات ایجادکننده
    // =============================================
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

  },
  { timestamps: true }
);

// =============================================
// ✅ ایندکس‌ها
// =============================================
WebhookSchema.index({ events: 1 });
WebhookSchema.index({ 'settings.active': 1 });

// =============================================
// ✅ متدهای نمونه
// =============================================

// ثبت آمار
WebhookSchema.methods.recordCall = async function(success, error = '') {
  this.stats.totalCalls += 1;
  if (success) {
    this.stats.successfulCalls += 1;
  } else {
    this.stats.failedCalls += 1;
    this.stats.lastError = error;
  }
  this.stats.lastCall = new Date();
  await this.save();
};

// بررسی اینکه رویداد مورد نظر پشتیبانی می‌شود
WebhookSchema.methods.supportsEvent = function(event) {
  return this.events.includes(event);
};

// اعمال فیلترها
WebhookSchema.methods.applyFilters = function(data) {
  if (!this.filters || Object.keys(this.filters).length === 0) {
    return true;
  }

  // پیاده‌سازی منطق فیلتر
  for (const [key, value] of Object.entries(this.filters)) {
    if (data[key] !== value) {
      return false;
    }
  }
  return true;
};

module.exports = mongoose.models.Webhook || mongoose.model('Webhook', WebhookSchema);
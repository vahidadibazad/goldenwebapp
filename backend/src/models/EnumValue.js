// backend/src/models/EnumValue.js
const mongoose = require('mongoose');

const EnumValueSchema = new mongoose.Schema({
  // گروه enum
  group: {
    type: String,
    enum: [
      'department',      // واحدها
      'letter_type',     // انواع نامه
      'letter_status',   // وضعیت نامه
      'hardware_status', // وضعیت اموال
      'ticket_status',   // وضعیت تیکت
      'ticket_priority', // اولویت تیکت
      'credential_level',// سطح دسترسی رمز
      'access_level',    // سطح دسترسی اسناد
      'file_type',       // نوع فایل
      'notification_type',// نوع اعلان
      'audit_action',    // اقدامات لاگ
      'audit_module',    // ماژول‌های لاگ
      'workflow_type',   // انواع گردش کار
      'signature_type',  // انواع امضا
      'priority',        // اولویت‌ها
      'gender',          // جنسیت
      'menu_item',       // آیتم‌های منو
    ],
    required: true,
  },
  
  // کلید (برای استفاده در کد)
  key: {
    type: String,
    required: true,
  },
  
  // مقدار نمایشی
  label: {
    type: String,
    required: true,
  },
  
  // توضیحات
  description: {
    type: String,
    default: '',
  },
  
  // رنگ (برای UI)
  color: {
    type: String,
    default: '#1677ff',
  },
  
  // آیکون
  icon: {
    type: String,
    default: '',
  },
  
  // ترتیب نمایش
  order: {
    type: Number,
    default: 0,
  },
  
  // فعال/غیرفعال
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // مقدار اضافی (برای ذخیره داده‌های بیشتر)
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  
  // سیستمی (قابل حذف توسط کاربر نیست)
  isSystem: {
    type: Boolean,
    default: false,
  },
  
}, { timestamps: true });

// ایندکس‌ها
EnumValueSchema.index({ group: 1, key: 1 }, { unique: true });
EnumValueSchema.index({ group: 1, order: 1 });

module.exports = mongoose.models.EnumValue || mongoose.model('EnumValue', EnumValueSchema);
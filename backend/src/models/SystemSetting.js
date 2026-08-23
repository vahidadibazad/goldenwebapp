// backend/src/models/SystemSetting.js
const mongoose = require('mongoose');

const SystemSettingSchema = new mongoose.Schema({
  // کلید تنظیمات
  key: {
    type: String,
    required: true,
    unique: true,
  },
  
  // مقدار
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  
  // نوع داده
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'array', 'object', 'color'],
    default: 'string',
  },
  
  // گروه
  group: {
    type: String,
    enum: ['general', 'appearance', 'security', 'email', 'sms', 'workflow', 'letter'],
    default: 'general',
  },
  
  // برچسب نمایشی
  label: {
    type: String,
    required: true,
  },
  
  // توضیحات
  description: {
    type: String,
    default: '',
  },
  
  // برای نمایش در UI
  options: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  
  // فعال/غیرفعال
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // سیستمی (قابل حذف توسط کاربر نیست)
  isSystem: {
    type: Boolean,
    default: false,
  },
  
}, { timestamps: true });

module.exports = mongoose.models.SystemSetting || mongoose.model('SystemSetting', SystemSettingSchema);
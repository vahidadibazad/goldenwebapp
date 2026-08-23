const mongoose = require('mongoose');

// =============================================
// زیرمجموعه: قالب پیام
// =============================================
const MessageTemplateSchema = new mongoose.Schema({
  // نوع اخطار
  type: {
    type: String,
    enum: ['reminder', 'overdue', 'approval', 'rejection', 'completion', 'signature_request'],
    required: true,
  },
  
  // عنوان پیام
  title: {
    type: String,
    required: true,
  },
  
  // متن پیام
  body: {
    type: String,
    required: true,
  },
  
  // متغیرهای قابل استفاده در پیام
  variables: [{
    type: String,
    enum: ['{task}', '{dueDate}', '{user}', '{department}', '{link}', '{daysRemaining}'],
  }],
  
  // فعال/غیرفعال
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // اولویت
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  
}, { timestamps: true });

// =============================================
// زیرمجموعه: تنظیمات زمان‌بندی
// =============================================
const ScheduleSchema = new mongoose.Schema({
  // نوع هدف
  targetType: {
    type: String,
    enum: ['letter', 'leave', 'mission', 'purchase', 'contract', 'general'],
    required: true,
  },
  
  // روزهای قبل از سررسید
  daysBefore: {
    type: [Number],
    default: [5, 3, 1, 0],
  },
  
  // تکرار (ساعت)
  repeatInterval: {
    type: Number,
    default: 24,
  },
  
  // ساعت ارسال (۲۴ ساعته)
  sendHour: {
    type: Number,
    default: 9,
    min: 0,
    max: 23,
  },
  
  // روزهای هفته برای ارسال
  weekDays: {
    type: [Number],
    default: [0, 1, 2, 3, 4, 5, 6], // یکشنبه تا شنبه
  },
  
  // حداکثر تعداد اخطار
  maxReminders: {
    type: Number,
    default: 5,
  },
  
  // فعال/غیرفعال
  isActive: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

// =============================================
// مدل اصلی ReminderSetting
// =============================================
const ReminderSettingSchema = new mongoose.Schema({
  // =============================================
  // اطلاعات پایه
  // =============================================
  
  // نام تنظیمات
  name: {
    type: String,
    required: [true, 'نام تنظیمات الزامی است'],
    trim: true,
  },
  
  // توضیحات
  description: {
    type: String,
    default: '',
  },
  
  // فعال/غیرفعال
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // =============================================
  // تنظیمات زمان‌بندی
  // =============================================
  
  schedules: [ScheduleSchema],
  
  // =============================================
  // روش‌های ارسال
  // =============================================
  
  methods: {
    // سیستم (نوتیفیکیشن داخلی)
    system: {
      enabled: { type: Boolean, default: true },
      priority: { type: Number, default: 1 },
    },
    
    // پیامک
    sms: {
      enabled: { type: Boolean, default: false },
      priority: { type: Number, default: 2 },
      provider: { type: String, default: '' },
      apiKey: { type: String, default: '' },
    },
    
    // ایمیل
    email: {
      enabled: { type: Boolean, default: false },
      priority: { type: Number, default: 3 },
      template: { type: String, default: '' },
    },
    
    // اعلان‌های مرورگر (Push)
    push: {
      enabled: { type: Boolean, default: false },
      priority: { type: Number, default: 4 },
    },
  },
  
  // =============================================
  // قالب‌های پیام
  // =============================================
  
  messageTemplates: [MessageTemplateSchema],
  
  // =============================================
  // تنظیمات پیشرفته
  // =============================================
  
  // آیا اخطارها باید گروهی ارسال شوند؟
  batchSending: {
    enabled: { type: Boolean, default: false },
    batchSize: { type: Number, default: 10 },
    batchInterval: { type: Number, default: 60 }, // ثانیه
  },
  
  // آیا اخطارها باید تکراری باشند؟
  allowDuplicate: {
    type: Boolean,
    default: false,
  },
  
  // حداکثر تعداد اخطار تکراری
  maxDuplicateCount: {
    type: Number,
    default: 3,
  },
  
  // زمان بین اخطارهای تکراری (ساعت)
  duplicateInterval: {
    type: Number,
    default: 24,
  },
  
  // =============================================
  // اطلاعات ایجادکننده
  // =============================================
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  
}, { timestamps: true });

// =============================================
// ✅ ایندکس‌ها
// =============================================
ReminderSettingSchema.index({ name: 1 });
ReminderSettingSchema.index({ isActive: 1 });
ReminderSettingSchema.index({ 'schedules.targetType': 1 });
ReminderSettingSchema.index({ 'schedules.isActive': 1 });

// =============================================
// ✅ متدهای نمونه (Instance Methods)
// =============================================

// دریافت تنظیمات برای یک نوع خاص
ReminderSettingSchema.methods.getScheduleForType = function(targetType) {
  return this.schedules.find(s => s.targetType === targetType);
};

// دریافت قالب پیام برای یک نوع
ReminderSettingSchema.methods.getMessageTemplate = function(type) {
  return this.messageTemplates.find(t => t.type === type);
};

// تولید پیام با جایگزینی متغیرها
ReminderSettingSchema.methods.renderMessage = function(template, variables = {}) {
  let message = template.body;
  
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(`{${key}}`, value);
  }
  
  return message;
};

// دریافت روش‌های ارسال فعال
ReminderSettingSchema.methods.getActiveMethods = function() {
  const activeMethods = [];
  
  if (this.methods.system.enabled) {
    activeMethods.push({
      name: 'system',
      priority: this.methods.system.priority,
    });
  }
  
  if (this.methods.sms.enabled) {
    activeMethods.push({
      name: 'sms',
      priority: this.methods.sms.priority,
    });
  }
  
  if (this.methods.email.enabled) {
    activeMethods.push({
      name: 'email',
      priority: this.methods.email.priority,
    });
  }
  
  if (this.methods.push.enabled) {
    activeMethods.push({
      name: 'push',
      priority: this.methods.push.priority,
    });
  }
  
  // مرتب‌سازی بر اساس اولویت
  return activeMethods.sort((a, b) => a.priority - b.priority);
};

// =============================================
// ✅ استاتیک‌ها (Static Methods)
// =============================================

// دریافت تنظیمات فعال
ReminderSettingSchema.statics.getActiveSettings = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// دریافت تنظیمات برای یک نوع خاص
ReminderSettingSchema.statics.getSettingsForType = function(targetType) {
  return this.findOne({
    isActive: true,
    'schedules.targetType': targetType,
    'schedules.isActive': true,
  });
};

// دریافت تنظیمات پیش‌فرض
ReminderSettingSchema.statics.getDefaultSettings = async function() {
  let settings = await this.findOne({ isActive: true, name: 'پیش‌فرض' });
  
  if (!settings) {
    // ایجاد تنظیمات پیش‌فرض
    settings = new this({
      name: 'پیش‌فرض',
      description: 'تنظیمات پیش‌فرض اخطارهای سیستم',
      isActive: true,
      schedules: [
        {
          targetType: 'letter',
          daysBefore: [5, 3, 1, 0],
          repeatInterval: 24,
          sendHour: 9,
          weekDays: [0, 1, 2, 3, 4, 5, 6],
          maxReminders: 5,
          isActive: true,
        },
        {
          targetType: 'leave',
          daysBefore: [7, 3, 1, 0],
          repeatInterval: 24,
          sendHour: 9,
          weekDays: [0, 1, 2, 3, 4, 5, 6],
          maxReminders: 5,
          isActive: true,
        },
        {
          targetType: 'mission',
          daysBefore: [5, 3, 1, 0],
          repeatInterval: 24,
          sendHour: 9,
          weekDays: [0, 1, 2, 3, 4, 5, 6],
          maxReminders: 5,
          isActive: true,
        },
      ],
      methods: {
        system: { enabled: true, priority: 1 },
        sms: { enabled: false, priority: 2 },
        email: { enabled: false, priority: 3 },
        push: { enabled: false, priority: 4 },
      },
      messageTemplates: [
        {
          type: 'reminder',
          title: 'یادآوری: {task}',
          body: 'به شما یادآوری می‌شود که {task} در تاریخ {dueDate} به اتمام می‌رسد. {daysRemaining} روز باقی مانده است.',
          variables: ['{task}', '{dueDate}', '{daysRemaining}'],
          isActive: true,
          priority: 'medium',
        },
        {
          type: 'overdue',
          title: '⚠️ {task} از موعد مقرر گذشته است',
          body: '{task} از تاریخ {dueDate} گذشته است. لطفاً هرچه سریع‌تر اقدام فرمایید.',
          variables: ['{task}', '{dueDate}'],
          isActive: true,
          priority: 'high',
        },
        {
          type: 'approval',
          title: 'نیاز به تایید: {task}',
          body: 'درخواست {task} توسط {user} نیاز به تایید شما دارد.',
          variables: ['{task}', '{user}', '{link}'],
          isActive: true,
          priority: 'high',
        },
      ],
      createdBy: null,
    });
    
    await settings.save();
  }
  
  return settings;
};

// =============================================
// ✅ میدلور (Middleware)
// =============================================

// قبل از ذخیره، اعتبارسنجی
ReminderSettingSchema.pre('save', function(next) {
  // اطمینان از وجود حداقل یک schedule
  if (this.schedules.length === 0) {
    return next(new Error('حداقل یک زمان‌بندی باید تعریف شود'));
  }
  
  // اطمینان از وجود حداقل یک قالب پیام
  if (this.messageTemplates.length === 0) {
    return next(new Error('حداقل یک قالب پیام باید تعریف شود'));
  }
  
  // اطمینان از فعال بودن حداقل یک روش ارسال
  const hasEnabledMethod = Object.values(this.methods).some(m => m.enabled);
  if (!hasEnabledMethod) {
    return next(new Error('حداقل یک روش ارسال باید فعال باشد'));
  }
  
  next();
});

// =============================================
// ✅ مدل نهایی
// =============================================
module.exports = mongoose.models.ReminderSetting || mongoose.model('ReminderSetting', ReminderSettingSchema);
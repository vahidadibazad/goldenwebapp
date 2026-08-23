const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    // =============================================
    // کاربر گیرنده
    // =============================================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'شناسه کاربر الزامی است'],
      index: true,
    },

    // =============================================
    // نوع اعلان
    // =============================================
    type: {
      type: String,
      enum: [
        // تیکت
        'ticket_created',
        'ticket_updated',
        'ticket_assigned',
        'ticket_resolved',
        'ticket_closed',
        // اموال
        'hardware_created',
        'hardware_assigned',
        'hardware_status_changed',
        // رمزها
        'credential_created',
        'credential_updated',
        'credential_shared',
        // اسناد
        'document_uploaded',
        'document_updated',
        'document_shared',
        // نامه‌ها
        'letter_created',
        'letter_registered',
        'letter_review',
        'letter_approved',
        'letter_rejected',
        'letter_signed',
        'letter_archived',
        // ارجاع
        'referral_created',
        'referral_actioned',
        // امضا
        'signature_request',
        'signature_completed',
        // سیستم
        'system_notification',
        'access_review',
        'backup_completed',
        'error_alert',
      ],
      required: [true, 'نوع اعلان الزامی است'],
    },

    // =============================================
    // عنوان و پیام
    // =============================================
    title: {
      type: String,
      required: [true, 'عنوان اعلان الزامی است'],
      trim: true,
      maxlength: [200, 'عنوان نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد'],
    },
    message: {
      type: String,
      required: [true, 'متن اعلان الزامی است'],
      trim: true,
      maxlength: [1000, 'متن نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد'],
    },

    // =============================================
    // لینک و شناسه مرتبط
    // =============================================
    link: {
      type: String,
      default: '',
      trim: true,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'type',
      default: null,
    },

    // =============================================
    // اولویت و دسته‌بندی
    // =============================================
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    category: {
      type: String,
      enum: ['system', 'ticket', 'hardware', 'credential', 'document', 'letter', 'signature', 'referral', 'user'],
      default: 'system',
    },

    // =============================================
    // روش‌های ارسال
    // =============================================
    deliveryMethod: {
      type: String,
      enum: ['system', 'email', 'sms', 'push', 'all'],
      default: 'system',
    },

    // =============================================
    // وضعیت خوانده شده
    // =============================================
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },

    // =============================================
    // وضعیت ارسال
    // =============================================
    isSent: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'delivered'],
      default: 'pending',
    },

    // =============================================
    // اطلاعات فنی
    // =============================================
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },

    // =============================================
    // متادیتا (اطلاعات اضافی)
    // =============================================
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// =============================================
// ✅ ایندکس‌ها
// =============================================
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ deliveryStatus: 1, createdAt: -1 });

// =============================================
// ✅ ویرچوال‌ها
// =============================================
NotificationSchema.virtual('isNew').get(function () {
  return !this.isRead;
});

NotificationSchema.virtual('age').get(function () {
  return Date.now() - this.createdAt.getTime();
});

// =============================================
// ✅ متدهای نمونه (Instance Methods)
// =============================================

// علامت‌گذاری به عنوان خوانده شده
NotificationSchema.methods.markAsRead = async function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

// ارسال اعلان (از طریق روش‌های مختلف)
NotificationSchema.methods.deliver = async function () {
  if (this.isSent) return this;

  const results = [];

  // ۱. ارسال از طریق سیستم (Socket.io)
  if (this.deliveryMethod === 'system' || this.deliveryMethod === 'all') {
    const { sendNotification } = require('../../socket');
    sendNotification(this.user, {
      id: this._id,
      type: this.type,
      title: this.title,
      message: this.message,
      link: this.link,
      priority: this.priority,
      createdAt: this.createdAt,
    });
    results.push({ method: 'system', success: true });
  }

  // ۲. ارسال از طریق ایمیل
  if ((this.deliveryMethod === 'email' || this.deliveryMethod === 'all') && process.env.SMTP_USER) {
    try {
      const User = require('../models/User');
      const user = await User.findById(this.user).select('email fullName');
      if (user?.email) {
        const EmailService = require('../../services/emailService');
        await EmailService.sendEmail({
          to: user.email,
          subject: this.title,
          html: `
            <div dir="rtl">
              <h3>${this.title}</h3>
              <p>${this.message}</p>
              ${this.link ? `<a href="${process.env.FRONTEND_URL}${this.link}">مشاهده</a>` : ''}
              <hr/>
              <p style="color:#999;font-size:12px;">این ایمیل به صورت خودکار از سامانه مدیریت ارسال شده است.</p>
            </div>
          `,
          letterId: this.relatedId,
        });
        results.push({ method: 'email', success: true });
      }
    } catch (error) {
      console.error('❌ خطا در ارسال ایمیل اعلان:', error);
      results.push({ method: 'email', success: false, error: error.message });
    }
  }

  // ۳. ارسال از طریق پیامک
  if ((this.deliveryMethod === 'sms' || this.deliveryMethod === 'all') && process.env.KAVENEGAR_API_KEY) {
    try {
      const User = require('../models/User');
      const user = await User.findById(this.user).select('phoneNumber');
      if (user?.phoneNumber) {
        const SmsService = require('../../services/smsService');
        await SmsService.sendSMS(user.phoneNumber, `${this.title}\n${this.message}`);
        results.push({ method: 'sms', success: true });
      }
    } catch (error) {
      console.error('❌ خطا در ارسال پیامک اعلان:', error);
      results.push({ method: 'sms', success: false, error: error.message });
    }
  }

  // به‌روزرسانی وضعیت ارسال
  this.isSent = true;
  this.sentAt = new Date();
  this.deliveryStatus = results.every(r => r.success) ? 'delivered' : 'sent';
  await this.save();

  return { results, deliveryStatus: this.deliveryStatus };
};

// =============================================
// ✅ استاتیک‌ها (Static Methods)
// =============================================

// دریافت اعلان‌های یک کاربر
NotificationSchema.statics.getByUser = function (userId, options = {}) {
  const { limit = 50, page = 1, isRead = null, type = null } = options;

  const filter = { user: userId };
  if (isRead !== null) filter.isRead = isRead;
  if (type) filter.type = type;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  return this.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
};

// دریافت تعداد اعلان‌های خوانده‌نشده
NotificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({ user: userId, isRead: false });
};

// علامت‌گذاری همه به عنوان خوانده شده
NotificationSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// حذف اعلان‌های قدیمی (بیشتر از ۳۰ روز)
NotificationSchema.statics.deleteOld = function (days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true,
  });
};

// ایجاد اعلان با ارسال خودکار
NotificationSchema.statics.createAndDeliver = async function (data) {
  const notification = new this(data);
  await notification.save();

  // ارسال خودکار اعلان
  await notification.deliver();

  return notification;
};

// =============================================
// ✅ میدلور (Middleware)
// =============================================

// قبل از ذخیره - تنظیم دسته‌بندی بر اساس نوع
NotificationSchema.pre('save', function (next) {
  const categoryMap = {
    ticket_created: 'ticket',
    ticket_updated: 'ticket',
    ticket_assigned: 'ticket',
    ticket_resolved: 'ticket',
    ticket_closed: 'ticket',
    hardware_created: 'hardware',
    hardware_assigned: 'hardware',
    hardware_status_changed: 'hardware',
    credential_created: 'credential',
    credential_updated: 'credential',
    credential_shared: 'credential',
    document_uploaded: 'document',
    document_updated: 'document',
    document_shared: 'document',
    letter_created: 'letter',
    letter_registered: 'letter',
    letter_review: 'letter',
    letter_approved: 'letter',
    letter_rejected: 'letter',
    letter_signed: 'letter',
    letter_archived: 'letter',
    referral_created: 'referral',
    referral_actioned: 'referral',
    signature_request: 'signature',
    signature_completed: 'signature',
    system_notification: 'system',
    access_review: 'system',
    backup_completed: 'system',
    error_alert: 'system',
  };

  this.category = categoryMap[this.type] || 'system';

  // اگر اولویت مشخص نشده، پیش‌فرض
  if (!this.priority) {
    const priorityMap = {
      urgent: ['error_alert', 'signature_request'],
      high: ['letter_review', 'ticket_assigned', 'referral_created'],
      medium: ['ticket_created', 'hardware_assigned', 'letter_approved'],
      low: ['system_notification', 'backup_completed'],
    };

    for (const [priority, types] of Object.entries(priorityMap)) {
      if (types.includes(this.type)) {
        this.priority = priority;
        break;
      }
    }
  }

  next();
});

module.exports = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
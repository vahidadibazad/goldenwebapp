// backend/src/models/Fax.js
const mongoose = require('mongoose');

const FaxSchema = new mongoose.Schema(
  {
    // =============================================
    // اطلاعات پایه
    // =============================================
    faxNumber: {
      type: String,
      required: [true, 'شماره فکس الزامی است'],
      trim: true,
    },
    senderNumber: {
      type: String,
      required: [true, 'شماره فرستنده الزامی است'],
      trim: true,
    },

    // =============================================
    // نوع فکس (دریافتی/ارسال‌شده)
    // =============================================
    direction: {
      type: String,
      enum: ['incoming', 'outgoing'],
      required: true,
    },

    // =============================================
    // وضعیت فکس
    // =============================================
    status: {
      type: String,
      enum: [
        'pending',     // در انتظار
        'processing',  // در حال پردازش
        'sent',        // ارسال شده
        'received',    // دریافت شده
        'failed',      // ناموفق
        'cancelled',   // لغو شده
      ],
      default: 'pending',
    },

    // =============================================
    // فایل فکس
    // =============================================
    filePath: {
      type: String,
      required: [true, 'مسیر فایل فکس الزامی است'],
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    pages: {
      type: Number,
      default: 1,
    },

    // =============================================
    // نامه مرتبط
    // =============================================
    letter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Letter',
      default: null,
    },

    // =============================================
    // کاربر مرتبط
    // =============================================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // =============================================
    // تاریخ‌ها
    // =============================================
    sentAt: {
      type: Date,
      default: null,
    },
    receivedAt: {
      type: Date,
      default: null,
    },

    // =============================================
    // اطلاعات فنی
    // =============================================
    provider: {
      type: String,
      enum: ['internal', 'external_api'],
      default: 'internal',
    },
    providerReference: {
      type: String,
      default: '',
    },
    errorMessage: {
      type: String,
      default: '',
    },

    // =============================================
    // تلاش‌های مجدد
    // =============================================
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },

    // =============================================
    // متادیتا
    // =============================================
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

  },
  { timestamps: true }
);

// =============================================
// ✅ ایندکس‌ها
// =============================================
FaxSchema.index({ faxNumber: 1, direction: 1 });
FaxSchema.index({ status: 1, createdAt: -1 });
FaxSchema.index({ letter: 1 });
FaxSchema.index({ user: 1 });

// =============================================
// ✅ متدهای نمونه
// =============================================

// علامت‌گذاری به عنوان دریافت شده
FaxSchema.methods.markAsReceived = async function() {
  this.status = 'received';
  this.receivedAt = new Date();
  await this.save();
  return this;
};

// علامت‌گذاری به عنوان ارسال شده
FaxSchema.methods.markAsSent = async function() {
  this.status = 'sent';
  this.sentAt = new Date();
  await this.save();
  return this;
};

// ثبت خطا
FaxSchema.methods.markAsFailed = async function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  this.retryCount += 1;
  await this.save();
  return this;
};

// =============================================
// ✅ استاتیک‌ها
// =============================================

// دریافت فکس‌های یک کاربر
FaxSchema.statics.getByUser = function(userId) {
  return this.find({ user: userId })
    .populate('letter', 'subject number')
    .sort({ createdAt: -1 });
};

// دریافت فکس‌های یک نامه
FaxSchema.statics.getByLetter = function(letterId) {
  return this.find({ letter: letterId })
    .sort({ createdAt: -1 });
};

// دریافت آمار فکس
FaxSchema.statics.getStats = async function(userId = null) {
  const filter = {};
  if (userId) filter.user = userId;

  const stats = await this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    pending: 0,
    processing: 0,
    sent: 0,
    received: 0,
    failed: 0,
    cancelled: 0,
    total: 0,
  };

  stats.forEach((stat) => {
    if (stat._id) {
      result[stat._id] = stat.count;
      result.total += stat.count;
    }
  });

  return result;
};

module.exports = mongoose.models.Fax || mongoose.model('Fax', FaxSchema);
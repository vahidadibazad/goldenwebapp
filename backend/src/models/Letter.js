// backend/src/models/Letter.js
const mongoose = require('mongoose');

const LetterSchema = new mongoose.Schema(
  {
    // =============================================
    // اطلاعات پایه نامه
    // =============================================
    number: {
      type: String,
      // ❌ حذف کامل unique: true و index: true از اینجا
      sparse: true,
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'موضوع نامه الزامی است'],
      trim: true,
      maxlength: [500, 'موضوع نامه نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد'],
    },
    summary: {
      type: String,
      default: '',
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },

    // =============================================
    // نوع نامه (وارد، صادر، داخلی)
    // =============================================
    letterType: {
      type: String,
      enum: ['incoming', 'outgoing', 'internal'],
      required: [true, 'نوع نامه الزامی است'],
    },

    // =============================================
    // فرستنده و گیرنده
    // =============================================
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    senderName: {
      type: String,
      default: '',
      trim: true,
    },
    senderOrganization: {
      type: String,
      default: '',
      trim: true,
    },
    senderDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    receiverName: {
      type: String,
      default: '',
      trim: true,
    },
    receiverOrganization: {
      type: String,
      default: '',
      trim: true,
    },
    receiverDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },

    // =============================================
    // تاریخ‌ها
    // =============================================
    letterDate: {
      type: Date,
      required: [true, 'تاریخ نامه الزامی است'],
    },
    receiveDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },

    // =============================================
    // سطوح دسترسی و اولویت
    // =============================================
    classification: {
      type: String,
      enum: ['normal', 'confidential', 'secret', 'top_secret'],
      default: 'normal',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },

    // =============================================
    // دبیرخانه و وضعیت
    // =============================================
    secretariat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Secretariat',
      required: [true, 'دبیرخانه الزامی است'],
    },
    
    // =============================================
    // چرخه حیات نامه (۷ وضعیت استاندارد)
    // =============================================
    status: {
      type: String,
      enum: [
        'draft',        // پیش‌نویس
        'registered',   // ثبت شده
        'in_review',    // در جریان بررسی
        'approved',     // تأیید شده
        'rejected',     // رد شده
        'signed',       // امضا شده
        'archived',     // بایگانی شده
      ],
      default: 'draft',
    },

    // =============================================
    // ارجاعات و امضاها
    // =============================================
    referrals: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Referral',
    }],
    signatures: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DigitalSignature',
    }],
    isSigned: {
      type: Boolean,
      default: false,
    },
    signedAt: {
      type: Date,
      default: null,
    },

    // =============================================
    // تاریخچه تغییرات
    // =============================================
    trackingHistory: [{
      status: { type: String },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      comment: { type: String, default: '' },
      timestamp: { type: Date, default: Date.now },
    }],

    // =============================================
    // بایگانی
    // =============================================
    isArchived: {
      type: Boolean,
      default: false,
    },
    archiveType: {
      type: String,
      enum: ['active', 'semi_active', 'inactive'],
      default: 'active',
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // =============================================
    // گردش کار
    // =============================================
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      default: null,
    },
    workflowInstance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkflowInstance',
      default: null,
    },
    currentStep: {
      type: String,
      default: '',
    },

    // =============================================
    // پیوست‌ها
    // =============================================
    attachments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attachment',
    }],

    // =============================================
    // یادداشت‌ها (Memo/Pirang)
    // =============================================
    memos: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Memo',
    }],

    // =============================================
    // اطلاعات ثبت‌کننده
    // =============================================
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ثبت‌کننده نامه الزامی است'],
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
// ✅ ایندکس‌ها (فقط از اینجا)
// =============================================
LetterSchema.index({ number: 1 }, { unique: true, sparse: true });
LetterSchema.index({ letterType: 1, status: 1 });
LetterSchema.index({ secretariat: 1, status: 1 });
LetterSchema.index({ sender: 1, receiver: 1 });
LetterSchema.index({ dueDate: 1 });
LetterSchema.index({ createdAt: -1 });
LetterSchema.index({ registeredBy: 1 });

// =============================================
// ✅ ایندکس Full-Text
// =============================================
LetterSchema.index(
  { 
    subject: 'text', 
    content: 'text', 
    summary: 'text',
    number: 'text',
    senderName: 'text',
    receiverName: 'text',
  },
  {
    weights: {
      subject: 10,
      number: 8,
      senderName: 5,
      receiverName: 5,
      summary: 3,
      content: 2,
    },
    name: 'letter_fulltext_index',
    default_language: 'none',
  }
);

// =============================================
// ✅ متدهای نمونه (Instance Methods)
// =============================================

LetterSchema.methods.addTracking = async function(status, userId, comment = '') {
  this.trackingHistory = this.trackingHistory || [];
  this.trackingHistory.push({
    status,
    user: userId,
    comment: comment || '',
    timestamp: new Date(),
  });
  await this.save();
  return this;
};

LetterSchema.methods.getStatusLabel = function() {
  const map = {
    draft: 'پیش‌نویس',
    registered: 'ثبت شده',
    in_review: 'در جریان بررسی',
    approved: 'تأیید شده',
    rejected: 'رد شده',
    signed: 'امضا شده',
    archived: 'بایگانی شده',
  };
  return map[this.status] || this.status;
};

// =============================================
// ✅ استاتیک‌ها (Static Methods)
// =============================================

LetterSchema.statics.getStats = async function(secretariatId = null) {
  try {
    const filter = {};
    if (secretariatId) filter.secretariat = secretariatId;

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
      draft: 0,
      registered: 0,
      in_review: 0,
      approved: 0,
      rejected: 0,
      signed: 0,
      archived: 0,
      total: 0,
    };

    stats.forEach((stat) => {
      if (stat._id) {
        result[stat._id] = stat.count;
        result.total += stat.count;
      }
    });

    return result;
  } catch (error) {
    console.error('❌ خطا در دریافت آمار:', error);
    return {
      draft: 0,
      registered: 0,
      in_review: 0,
      approved: 0,
      rejected: 0,
      signed: 0,
      archived: 0,
      total: 0,
    };
  }
};

LetterSchema.statics.getOverdue = function() {
  const now = new Date();
  return this.find({
    status: { $nin: ['archived', 'approved', 'rejected'] },
    dueDate: { $lt: now },
  })
    .populate('sender', 'fullName username')
    .populate('receiver', 'fullName username')
    .sort({ dueDate: 1 });
};

module.exports = mongoose.models.Letter || mongoose.model('Letter', LetterSchema);
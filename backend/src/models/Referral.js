// backend/src/models/Referral.js
const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema(
  {
    // =============================================
    // نامه مرتبط
    // =============================================
    letter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Letter',
      required: true,
    },

    // =============================================
    // ارجاع‌دهنده
    // =============================================
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // =============================================
    // گیرنده ارجاع
    // =============================================
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // =============================================
    // ✅ نوع ارجاع (پاراف، تأیید، امضا، اطلاع)
    // =============================================
    type: {
      type: String,
      enum: ['review', 'approve', 'sign', 'inform', 'forward'],
      default: 'review',
    },

    // =============================================
    // وضعیت ارجاع
    // =============================================
    status: {
      type: String,
      enum: ['pending', 'read', 'actioned', 'rejected', 'forwarded'],
      default: 'pending',
    },

    // =============================================
    // تاریخ‌ها
    // =============================================
    sentAt: {
      type: Date,
      default: Date.now,
    },
    readAt: {
      type: Date,
      default: null,
    },
    actionedAt: {
      type: Date,
      default: null,
    },

    // =============================================
    // سررسید
    // =============================================
    dueDate: {
      type: Date,
      default: null,
    },

    // =============================================
    // پیام و توضیحات
    // =============================================
    message: {
      type: String,
      default: '',
    },
    comment: {
      type: String,
      default: '',
    },

    // =============================================
    // اولویت
    // =============================================
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },

    // =============================================
    // ارجاع والد (برای ارجاع‌های زنجیره‌ای)
    // =============================================
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Referral',
      default: null,
    },

    // =============================================
    // پاسخ‌ها و بازخوردها
    // =============================================
    responses: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      message: { type: String },
      createdAt: { type: Date, default: Date.now },
    }],

    // =============================================
    // امضا
    // =============================================
    signature: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Signature',
      default: null,
    },
    isSigned: {
      type: Boolean,
      default: false,
    },

    // =============================================
    // پیوست‌ها
    // =============================================
    attachments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attachment',
    }],

    // =============================================
    // تاریخچه تغییرات
    // =============================================
    history: [{
      status: { type: String },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      comment: { type: String },
      timestamp: { type: Date, default: Date.now },
    }],

  },
  { timestamps: true }
);

// =============================================
// ✅ ایندکس‌ها
// =============================================
ReferralSchema.index({ letter: 1, status: 1 });
ReferralSchema.index({ from: 1, to: 1 });
ReferralSchema.index({ dueDate: 1 });
ReferralSchema.index({ status: 1, dueDate: 1 });
ReferralSchema.index({ type: 1 });

// =============================================
// ✅ متدهای نمونه
// =============================================

// علامت‌گذاری به عنوان خوانده شده
ReferralSchema.methods.markAsRead = async function(userId) {
  this.status = 'read';
  this.readAt = new Date();
  this.history.push({
    status: 'read',
    user: userId,
    comment: 'نامه مطالعه شد',
    timestamp: new Date(),
  });
  return this.save();
};

// ثبت اقدام (پاراف/تأیید)
ReferralSchema.methods.action = async function(userId, comment = '') {
  this.status = 'actioned';
  this.actionedAt = new Date();
  this.comment = comment;
  this.history.push({
    status: 'actioned',
    user: userId,
    comment: comment || 'اقدام انجام شد',
    timestamp: new Date(),
  });
  return this.save();
};

// ارجاع مجدد
ReferralSchema.methods.forward = async function(userId, toUserId, message = '') {
  this.status = 'forwarded';
  this.history.push({
    status: 'forwarded',
    user: userId,
    comment: `ارجاع به ${toUserId}`,
    timestamp: new Date(),
  });

  const Referral = mongoose.model('Referral');
  const newReferral = new Referral({
    letter: this.letter,
    from: userId,
    to: toUserId,
    parent: this._id,
    type: this.type,
    message: message || this.message,
    priority: this.priority,
    dueDate: this.dueDate,
  });

  await newReferral.save();
  return newReferral;
};

// =============================================
// ✅ استاتیک‌ها
// =============================================

// دریافت ارجاعات یک کاربر
ReferralSchema.statics.getByUser = function(userId, status = null) {
  const filter = { to: userId };
  if (status) filter.status = status;
  return this.find(filter)
    .populate('letter', 'subject number letterType')
    .populate('from', 'fullName username')
    .populate('to', 'fullName username')
    .sort({ createdAt: -1 });
};

// دریافت ارجاعات یک نامه
ReferralSchema.statics.getByLetter = function(letterId) {
  return this.find({ letter: letterId })
    .populate('from', 'fullName username')
    .populate('to', 'fullName username')
    .sort({ createdAt: -1 });
};

// دریافت ارجاعات معوق
ReferralSchema.statics.getOverdue = function() {
  const now = new Date();
  return this.find({
    status: { $in: ['pending', 'read'] },
    dueDate: { $lt: now },
  })
    .populate('letter', 'subject number')
    .populate('to', 'fullName username')
    .sort({ dueDate: 1 });
};

module.exports = mongoose.models.Referral || mongoose.model('Referral', ReferralSchema);
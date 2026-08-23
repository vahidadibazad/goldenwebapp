// backend/src/models/Memo.js
const mongoose = require('mongoose');

const MemoSchema = new mongoose.Schema(
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
    // کاربر ایجادکننده
    // =============================================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // =============================================
    // متن یادداشت
    // =============================================
    content: {
      type: String,
      required: [true, 'متن یادداشت الزامی است'],
    },

    // =============================================
    // نوع یادداشت
    // =============================================
    type: {
      type: String,
      enum: ['note', 'instruction', 'comment', 'approval'],
      default: 'note',
    },

    // =============================================
    // وضعیت خوانده شده
    // =============================================
    isRead: {
      type: Boolean,
      default: false,
    },

    // =============================================
    // کاربران خوانده‌شده
    // =============================================
    readBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      readAt: { type: Date, default: Date.now },
    }],

    // =============================================
    // پاسخ به یادداشت
    // =============================================
    parentMemo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Memo',
      default: null,
    },

    // =============================================
    // پیوست‌ها
    // =============================================
    attachments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attachment',
    }],

  },
  { timestamps: true }
);

// =============================================
// ✅ ایندکس‌ها
// =============================================
MemoSchema.index({ letter: 1, createdAt: -1 });
MemoSchema.index({ user: 1, isRead: 1 });
MemoSchema.index({ parentMemo: 1 });

// =============================================
// ✅ متدهای نمونه
// =============================================

// علامت‌گذاری به عنوان خوانده شده
MemoSchema.methods.markAsRead = async function(userId) {
  if (!this.readBy.some(r => r.user.toString() === userId.toString())) {
    this.readBy.push({ user: userId });
    this.isRead = true;
    await this.save();
  }
  return this;
};

module.exports = mongoose.models.Memo || mongoose.model('Memo', MemoSchema);
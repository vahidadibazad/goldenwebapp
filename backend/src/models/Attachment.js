// backend/src/models/Attachment.js
const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema(
  {
    // =============================================
    // اطلاعات پایه
    // =============================================
    title: {
      type: String,
      required: [true, 'عنوان پیوست الزامی است'],
      trim: true,
    },

    // =============================================
    // فایل
    // =============================================
    filePath: {
      type: String,
      required: [true, 'مسیر فایل الزامی است'],
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: 'application/octet-stream',
    },

    // =============================================
    // نامه‌های مرتبط (یک پیوست می‌تواند به چند نامه متصل شود)
    // =============================================
    letters: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Letter',
    }],

    // =============================================
    // کاربر آپلودکننده
    // =============================================
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // =============================================
    // توضیحات
    // =============================================
    description: {
      type: String,
      default: '',
    },

    // =============================================
    // سطح دسترسی
    // =============================================
    accessLevel: {
      type: String,
      enum: ['public', 'restricted', 'confidential'],
      default: 'public',
    },

  },
  { timestamps: true }
);

// =============================================
// ✅ ایندکس‌ها
// =============================================
AttachmentSchema.index({ letters: 1 });
AttachmentSchema.index({ uploadedBy: 1 });

module.exports = mongoose.models.Attachment || mongoose.model('Attachment', AttachmentSchema);
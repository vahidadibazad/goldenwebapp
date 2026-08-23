// backend/src/modules/cms/models/Media.js
const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema(
  {
    // =============================================
    // اطلاعات پایه
    // =============================================
    title: {
      type: String,
      required: [true, 'عنوان فایل الزامی است'],
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
      default: 0,
    },
    mimeType: {
      type: String,
      required: true,
    },

    // =============================================
    // نوع فایل
    // =============================================
    mediaType: {
      type: String,
      enum: ['image', 'video', 'audio', 'document', 'other'],
      required: true,
    },

    // =============================================
    // اطلاعات تصویر (برای تصاویر)
    // =============================================
    imageInfo: {
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      colors: [String],
      dominantColor: { type: String, default: '' },
      thumbnail: { type: String, default: '' },
      medium: { type: String, default: '' },
      large: { type: String, default: '' },
    },

    // =============================================
    // دسته‌بندی و برچسب‌ها
    // =============================================
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    tags: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tag',
    }],

    // =============================================
    // کاربر مرتبط
    // =============================================
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // =============================================
    // وضعیت
    // =============================================
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
    },

    // =============================================
    // دسترسی
    // =============================================
    accessLevel: {
      type: String,
      enum: ['public', 'restricted', 'private'],
      default: 'public',
    },
    allowedRoles: [{
      type: String,
      enum: ['admin', 'editor', 'author', 'subscriber'],
    }],

    // =============================================
    // متادیتا
    // =============================================
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    altText: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },

    // =============================================
    // آمار
    // =============================================
    downloadCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
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
MediaSchema.index({ mediaType: 1, status: 1 });
MediaSchema.index({ uploadedBy: 1 });
MediaSchema.index({ category: 1 });
MediaSchema.index({ tags: 1 });
MediaSchema.index({ accessLevel: 1 });
MediaSchema.index({ createdAt: -1 });

// ایندکس Full-Text
MediaSchema.index(
  {
    title: 'text',
    fileName: 'text',
    description: 'text',
    altText: 'text',
    'metadata.keywords': 'text',
  },
  {
    weights: {
      title: 10,
      fileName: 8,
      description: 5,
      altText: 5,
      'metadata.keywords': 3,
    },
    name: 'cms_media_fulltext_index',
    default_language: 'none',
  }
);

// =============================================
// ✅ ویرچوال‌ها
// =============================================
MediaSchema.virtual('url').get(function() {
  return `/uploads/${this.filePath}`;
});

MediaSchema.virtual('sizeInKB').get(function() {
  return (this.fileSize / 1024).toFixed(2);
});

MediaSchema.virtual('sizeInMB').get(function() {
  return (this.fileSize / 1024 / 1024).toFixed(2);
});

MediaSchema.virtual('isImage').get(function() {
  return this.mediaType === 'image';
});

MediaSchema.virtual('isVideo').get(function() {
  return this.mediaType === 'video';
});

MediaSchema.virtual('isDocument').get(function() {
  return this.mediaType === 'document';
});

// =============================================
// ✅ متدهای نمونه
// =============================================

// افزایش بازدید
MediaSchema.methods.incrementView = async function() {
  this.viewCount += 1;
  await this.save();
  return this;
};

// افزایش دانلود
MediaSchema.methods.incrementDownload = async function() {
  this.downloadCount += 1;
  await this.save();
  return this;
};

// بایگانی
MediaSchema.methods.archive = async function() {
  this.status = 'archived';
  await this.save();
  return this;
};

// انتشار مجدد
MediaSchema.methods.publish = async function() {
  this.status = 'published';
  await this.save();
  return this;
};

// =============================================
// ✅ متدهای استاتیک
// =============================================

// دریافت فایل‌های یک کاربر
MediaSchema.statics.getByUser = function(userId, options = {}) {
  const { mediaType, status = 'published', page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const filter = { uploadedBy: userId };
  if (mediaType) filter.mediaType = mediaType;
  if (status !== 'all') filter.status = status;

  return this.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// دریافت آمار فایل‌ها
MediaSchema.statics.getStats = function() {
  return Promise.all([
    this.countDocuments({ status: 'published' }),
    this.countDocuments({ status: 'archived' }),
    this.countDocuments({ mediaType: 'image', status: 'published' }),
    this.countDocuments({ mediaType: 'video', status: 'published' }),
    this.countDocuments({ mediaType: 'document', status: 'published' }),
    this.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: null, totalSize: { $sum: '$fileSize' } } },
    ]),
  ]).then(([published, archived, images, videos, documents, sizeAgg]) => ({
    published,
    archived,
    total: published + archived,
    byType: { images, videos, documents },
    totalSize: sizeAgg[0]?.totalSize || 0,
  }));
};

// دریافت فایل‌های اخیر
MediaSchema.statics.getRecent = function(limit = 10) {
  return this.find({ status: 'published' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('uploadedBy', 'fullName username')
    .lean();
};

// دریافت محبوب‌ترین فایل‌ها
MediaSchema.statics.getPopular = function(limit = 10) {
  return this.find({ status: 'published' })
    .sort({ downloadCount: -1, viewCount: -1 })
    .limit(limit)
    .lean();
};

module.exports = mongoose.models.Media || mongoose.model('Media', MediaSchema);
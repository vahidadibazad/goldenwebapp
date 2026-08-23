// backend/src/modules/cms/models/Entry.js
const mongoose = require('mongoose');

const EntrySchema = new mongoose.Schema(
  {
    // =============================================
    // اطلاعات پایه
    // =============================================
    contentType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContentType',
      required: [true, 'نوع محتوا الزامی است'],
    },
    
    locale: {
      type: String,
      enum: ['fa', 'en', 'ar'],
      default: 'fa',
    },

    // =============================================
    // داده‌های اصلی (داینامیک بر اساس ContentType)
    // =============================================
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },

    // =============================================
    // اسلاگ (آدرس URL)
    // =============================================
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },

    // =============================================
    // وضعیت
    // =============================================
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },

    // =============================================
    // نسخه‌بندی
    // =============================================
    version: {
      type: Number,
      default: 1,
    },

    // =============================================
    // کاربران مرتبط
    // =============================================
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // =============================================
    // تاریخ‌ها
    // =============================================
    publishedAt: {
      type: Date,
      default: null,
    },

    // =============================================
    // آمار
    // =============================================
    viewCount: {
      type: Number,
      default: 0,
    },

    // =============================================
    // SEO و متادیتا
    // =============================================
    metaData: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      keywords: [String],
      ogImage: { type: String, default: '' },
    },

    // =============================================
    // ✅ دسته‌بندی‌ها و برچسب‌ها
    // =============================================
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    }],
    tags: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tag',
    }],

    // =============================================
    // ویژه
    // =============================================
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },

    // =============================================
    // تنظیمات دسترسی
    // =============================================
    isProtected: {
      type: Boolean,
      default: false,
    },
    allowedRoles: [{
      type: String,
      enum: ['admin', 'editor', 'author', 'subscriber'],
    }],

    // =============================================
    // متادیتای اضافی
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
// ✅ ایندکس‌ها (بهینه‌سازی سرعت)
// =============================================

// ایندکس‌های اصلی
EntrySchema.index({ contentType: 1, status: 1, locale: 1 });
EntrySchema.index({ slug: 1, locale: 1 }, { unique: true, sparse: true });
EntrySchema.index({ createdAt: -1 });
EntrySchema.index({ publishedAt: -1 });

// ایندکس‌های دسته‌بندی و برچسب
EntrySchema.index({ categories: 1 });
EntrySchema.index({ tags: 1 });
EntrySchema.index({ categories: 1, status: 1 });
EntrySchema.index({ tags: 1, status: 1 });

// ایندکس‌های ویژه
EntrySchema.index({ isFeatured: 1, status: 1 });
EntrySchema.index({ isPinned: 1, status: 1 });

// ایندکس Full-Text (برای جستجو)
EntrySchema.index(
  { 
    'data.title': 'text',
    'data.content': 'text',
    'data.excerpt': 'text',
    'metaData.title': 'text',
    'metaData.description': 'text',
  },
  {
    weights: {
      'data.title': 10,
      'metaData.title': 8,
      'data.excerpt': 5,
      'metaData.description': 3,
      'data.content': 2,
    },
    name: 'cms_entry_fulltext_index',
    default_language: 'none',
  }
);

// =============================================
// ✅ میدلورها (Middleware)
// =============================================

// قبل از ذخیره - تولید slug خودکار
EntrySchema.pre('save', function(next) {
  // اگر slug نداشته باشد و data.title موجود باشد
  if (!this.slug && this.data && this.data.title) {
    // تولید slug از title
    let slug = this.data.title
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
    
    // اگر slug خالی شد، از تاریخ استفاده کن
    if (!slug) {
      slug = `entry-${Date.now()}`;
    }
    
    this.slug = slug;
  }
  
  // اگر slug تغییر کرد و قبلاً وجود داشت، unique بودن را بررسی کن
  if (this.isModified('slug') && this.slug) {
    // بررسی تکراری بودن slug (در pre-save انجام نمی‌شود)
    // این کار در سطح دیتابیس با ایندکس unique انجام می‌شود
  }
  
  next();
});

// قبل از ذخیره - تنظیم خودکار updateBy
EntrySchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    // updatedBy باید در کنترلر تنظیم شود
    // اینجا فقط برای اطمینان
  }
  next();
});

// =============================================
// ✅ متدهای نمونه (Instance Methods)
// =============================================

// انتشار (Publish)
EntrySchema.methods.publish = async function(userId) {
  if (this.status === 'published') {
    throw new Error('این ورودی قبلاً منتشر شده است');
  }
  
  this.status = 'published';
  this.publishedBy = userId;
  this.publishedAt = new Date();
  this.version += 1;
  await this.save();
  return this;
};

// بایگانی (Archive)
EntrySchema.methods.archive = async function() {
  if (this.status === 'archived') {
    throw new Error('این ورودی قبلاً بایگانی شده است');
  }
  
  this.status = 'archived';
  await this.save();
  return this;
};

// افزایش بازدید
EntrySchema.methods.incrementView = async function() {
  this.viewCount += 1;
  await this.save();
  return this;
};

// دریافت خلاصه
EntrySchema.methods.getSummary = function() {
  return {
    id: this._id,
    slug: this.slug,
    status: this.status,
    locale: this.locale,
    title: this.data?.title || this.metaData?.title || 'بدون عنوان',
    excerpt: this.data?.excerpt || '',
    featuredImage: this.data?.featuredImage || '',
    categories: this.categories,
    tags: this.tags,
    publishedAt: this.publishedAt,
    viewCount: this.viewCount,
    isFeatured: this.isFeatured,
  };
};

// بررسی دسترسی
EntrySchema.methods.hasAccess = function(user) {
  if (!this.isProtected) return true;
  if (!user) return false;
  if (user.role?.name === 'admin') return true;
  if (this.allowedRoles.includes(user.role?.name)) return true;
  return false;
};

// =============================================
// ✅ متدهای استاتیک (Static Methods)
// =============================================

// دریافت ورودی‌های منتشرشده
EntrySchema.statics.getPublished = function(contentTypeId, locale = 'fa', options = {}) {
  const {
    page = 1,
    limit = 20,
    category = null,
    tag = null,
    featured = false,
    search = '',
  } = options;

  const skip = (page - 1) * limit;
  const filter = {
    contentType: contentTypeId,
    status: 'published',
    locale,
  };

  if (category) filter.categories = category;
  if (tag) filter.tags = tag;
  if (featured) filter.isFeatured = true;
  
  if (search) {
    filter.$text = { $search: search };
  }

  let query = this.find(filter)
    .sort({ isPinned: -1, publishedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('createdBy', 'fullName username')
    .populate('contentType', 'name apiName')
    .populate('categories', 'name slug')
    .populate('tags', 'name slug');

  if (search) {
    query = query.sort({ score: { $meta: 'textScore' } });
  }

  return Promise.all([
    query.lean(),
    this.countDocuments(filter),
  ]).then(([data, total]) => ({
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }));
};

// دریافت ورودی با اسلاگ
EntrySchema.statics.getBySlug = function(slug, locale = 'fa', status = 'published') {
  const filter = { slug, locale };
  if (status !== 'all') filter.status = status;
  
  return this.findOne(filter)
    .populate('createdBy', 'fullName username')
    .populate('contentType', 'name apiName fields')
    .populate('categories', 'name slug')
    .populate('tags', 'name slug');
};

// دریافت ورودی‌های مرتبط
EntrySchema.statics.getRelated = function(entryId, contentTypeId, limit = 5) {
  return this.find({
    _id: { $ne: entryId },
    contentType: contentTypeId,
    status: 'published',
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .populate('createdBy', 'fullName username')
    .populate('categories', 'name slug')
    .populate('tags', 'name slug')
    .lean();
};

// جستجوی پیشرفته
EntrySchema.statics.advancedSearch = function(query, options = {}) {
  const {
    locale = 'fa',
    status = 'published',
    category = null,
    tag = null,
    fromDate = null,
    toDate = null,
    page = 1,
    limit = 20,
  } = options;

  const skip = (page - 1) * limit;
  const filter = { locale };

  if (status !== 'all') filter.status = status;
  if (category) filter.categories = category;
  if (tag) filter.tags = tag;
  
  if (fromDate || toDate) {
    filter.publishedAt = {};
    if (fromDate) filter.publishedAt.$gte = new Date(fromDate);
    if (toDate) filter.publishedAt.$lte = new Date(toDate);
  }

  if (query) {
    filter.$text = { $search: query };
  }

  let findQuery = this.find(filter)
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('createdBy', 'fullName username')
    .populate('contentType', 'name apiName')
    .populate('categories', 'name slug')
    .populate('tags', 'name slug');

  if (query) {
    findQuery = findQuery.sort({ score: { $meta: 'textScore' } });
  }

  return Promise.all([
    findQuery.lean(),
    this.countDocuments(filter),
  ]).then(([data, total]) => ({
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }));
};

// =============================================
// ✅ مدل نهایی
// =============================================
module.exports = mongoose.models.Entry || mongoose.model('Entry', EntrySchema);
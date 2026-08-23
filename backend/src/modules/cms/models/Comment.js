// backend/src/modules/cms/models/Comment.js
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    // =============================================
    // ورودی مرتبط
    // =============================================
    entry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Entry',
      required: [true, 'شناسه ورودی الزامی است'],
      index: true,
    },

    // =============================================
    // کاربر (اگر ثبت‌نام کرده باشد)
    // =============================================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // =============================================
    // اطلاعات نویسنده (برای کاربران مهمان)
    // =============================================
    author: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      website: { type: String, default: '', trim: true },
      ip: { type: String, default: '' },
      userAgent: { type: String, default: '' },
    },

    // =============================================
    // محتوای کامنت
    // =============================================
    content: {
      type: String,
      required: [true, 'متن کامنت الزامی است'],
      trim: true,
      maxlength: [5000, 'متن کامنت نمی‌تواند بیشتر از ۵۰۰۰ کاراکتر باشد'],
    },

    // =============================================
    // کامنت والد (برای پاسخ‌ها)
    // =============================================
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },

    // =============================================
    // وضعیت
    // =============================================
    status: {
      type: String,
      enum: ['pending', 'approved', 'spam', 'trash'],
      default: 'pending',
      index: true,
    },

    // =============================================
    // امتیاز (لایک/دیس‌لایک)
    // =============================================
    votes: {
      up: { type: Number, default: 0 },
      down: { type: Number, default: 0 },
    },

    // =============================================
    // تاریخ‌ها
    // =============================================
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // =============================================
    // متادیتا
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
CommentSchema.index({ entry: 1, status: 1, createdAt: -1 });
CommentSchema.index({ parent: 1, status: 1 });
CommentSchema.index({ user: 1 });
CommentSchema.index({ 'author.email': 1 });
CommentSchema.index({ status: 1, createdAt: -1 });

// =============================================
// ✅ ویرچوال‌ها (فیلدهای مجازی)
// =============================================
CommentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parent',
});

CommentSchema.virtual('isApproved').get(function() {
  return this.status === 'approved';
});

CommentSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

CommentSchema.virtual('isSpam').get(function() {
  return this.status === 'spam';
});

CommentSchema.virtual('isTrash').get(function() {
  return this.status === 'trash';
});

CommentSchema.virtual('voteScore').get(function() {
  return this.votes.up - this.votes.down;
});

// =============================================
// ✅ میدلورها
// =============================================

// قبل از ذخیره - اعتبارسنجی
CommentSchema.pre('save', function(next) {
  // اگر کاربر ثبت‌نام کرده، نام و ایمیل از کاربر گرفته شود
  if (this.user && !this.isModified('author')) {
    // در صورت نیاز، اطلاعات کاربر را از مدل User دریافت کن
  }
  
  // حذف تگ‌های HTML از محتوا
  if (this.content) {
    this.content = this.content
      .replace(/<[^>]*>/g, '')
      .trim();
  }
  
  next();
});

// =============================================
// ✅ متدهای نمونه
// =============================================

// تأیید کامنت
CommentSchema.methods.approve = async function(userId) {
  if (this.status === 'approved') {
    throw new Error('این کامنت قبلاً تأیید شده است');
  }
  
  this.status = 'approved';
  this.approvedAt = new Date();
  this.approvedBy = userId;
  await this.save();
  return this;
};

// رد کامنت (ارسال به زباله‌دان)
CommentSchema.methods.trash = async function() {
  this.status = 'trash';
  await this.save();
  return this;
};

// علامت‌گذاری به عنوان اسپم
CommentSchema.methods.markAsSpam = async function() {
  this.status = 'spam';
  await this.save();
  return this;
};

// بازیابی از زباله‌دان
CommentSchema.methods.restore = async function() {
  if (this.status !== 'trash') {
    throw new Error('این کامنت در زباله‌دان نیست');
  }
  this.status = 'pending';
  await this.save();
  return this;
};

// رأی مثبت
CommentSchema.methods.upvote = async function() {
  this.votes.up += 1;
  await this.save();
  return this;
};

// رأی منفی
CommentSchema.methods.downvote = async function() {
  this.votes.down += 1;
  await this.save();
  return this;
};

// دریافت پاسخ‌ها
CommentSchema.methods.getReplies = async function(options = {}) {
  const { status = 'approved', limit = 20, page = 1 } = options;
  const skip = (page - 1) * limit;

  return Comment.find({
    parent: this._id,
    status,
  })
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'fullName username')
    .lean();
};

// =============================================
// ✅ متدهای استاتیک
// =============================================

// دریافت کامنت‌های یک ورودی
CommentSchema.statics.getByEntry = function(entryId, options = {}) {
  const {
    status = 'approved',
    page = 1,
    limit = 20,
    includeReplies = true,
  } = options;

  const skip = (page - 1) * limit;
  const filter = {
    entry: entryId,
    parent: null,
    status,
  };

  const query = this.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'fullName username')
    .populate({
      path: 'replies',
      match: { status: 'approved' },
      populate: {
        path: 'user',
        select: 'fullName username',
      },
    });

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

// دریافت کامنت‌های یک کاربر
CommentSchema.statics.getByUser = function(userId, options = {}) {
  const { status = 'approved', page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const filter = { user: userId };
  if (status !== 'all') filter.status = status;

  return this.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('entry', 'slug metaData.title')
    .lean();
};

// دریافت کامنت‌های در انتظار تایید
CommentSchema.statics.getPending = function(limit = 50) {
  return this.find({ status: 'pending' })
    .sort({ createdAt: 1 })
    .limit(limit)
    .populate('user', 'fullName username')
    .populate('entry', 'slug metaData.title');
};

// دریافت آمار کامنت‌ها
CommentSchema.statics.getStats = function() {
  return Promise.all([
    this.countDocuments({ status: 'pending' }),
    this.countDocuments({ status: 'approved' }),
    this.countDocuments({ status: 'spam' }),
    this.countDocuments({ status: 'trash' }),
    this.countDocuments(),
  ]).then(([pending, approved, spam, trash, total]) => ({
    pending,
    approved,
    spam,
    trash,
    total,
  }));
};

// دریافت کامنت‌های اخیر
CommentSchema.statics.getRecent = function(limit = 10) {
  return this.find({ status: 'approved' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'fullName username')
    .populate('entry', 'slug metaData.title')
    .lean();
};

module.exports = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
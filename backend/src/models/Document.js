const mongoose = require('mongoose');
const EnumValue = require('./EnumValue');

const DocumentSchema = new mongoose.Schema(
  {
    // =============================================
    // فیلدهای اصلی
    // =============================================
    title: {
      type: String,
      required: [true, 'عنوان سند الزامی است'],
      trim: true,
      maxlength: [500, 'عنوان نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'توضیحات نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد'],
    },
    filePath: {
      type: String,
      required: [true, 'مسیر فایل الزامی است'],
      trim: true,
    },
    fileName: {
      type: String,
      default: '',
      trim: true,
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
    // فیلدهای دسته‌بندی
    // =============================================
    fileType: {
      type: String,
      ref: 'EnumValue',
      default: null,
    },
    category: {
      type: String,
      default: 'سایر',
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },

    // =============================================
    // فیلدهای دسترسی
    // =============================================
    accessLevel: {
      type: String,
      ref: 'EnumValue',
      default: null,
    },
    department: {
      type: String,
      default: 'All',
      trim: true,
    },
    accessExpiry: {
      type: Date,
      default: null,
    },

    // =============================================
    // فیلدهای کاربری
    // =============================================
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'شناسه کاربر الزامی است'],
    },
    version: {
      type: Number,
      default: 1,
      min: [1, 'نسخه نمی‌تواند کمتر از ۱ باشد'],
    },

    // =============================================
    // فیلدهای OCR
    // =============================================
    ocrText: {
      type: String,
      default: '',
      maxlength: [100000, 'متن OCR نمی‌تواند بیشتر از ۱۰۰۰۰۰ کاراکتر باشد'],
    },
    ocrKeywords: [{
      word: { type: String, trim: true },
      count: { type: Number, default: 0 },
    }],
    ocrStats: {
      wordCount: { type: Number, default: 0 },
      charCount: { type: Number, default: 0 },
      lineCount: { type: Number, default: 0 },
      pageCount: { type: Number, default: 1 },
      confidence: { type: Number, default: 0, min: 0, max: 100 },
    },
    ocrLanguage: {
      type: String,
      enum: ['fas', 'eng', 'ara', 'tur', 'unknown'],
      default: 'unknown',
    },
    ocrConfidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    ocrProcessed: {
      type: Boolean,
      default: false,
    },
    ocrProcessedAt: {
      type: Date,
      default: null,
    },

    // =============================================
    // فیلدهای مکاتبات اداری
    // =============================================
    documentType: {
      type: String,
      enum: ['general', 'letter', 'contract', 'report', 'other'],
      default: 'general',
    },
    letterType: {
      type: String,
      ref: 'EnumValue',
      default: null,
    },
    letterNumber: {
      type: String,
      sparse: true,
      default: null,
      trim: true,
    },
    numberingCode: {
      type: String,
      default: '',
      trim: true,
    },
    seq: {
      type: Number,
      default: 0,
    },

    // =============================================
    // فیلدهای فرستنده و گیرنده
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
    // فیلدهای تاریخ
    // =============================================
    letterDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    receiveDate: {
      type: Date,
      default: null,
    },

    // =============================================
    // فیلدهای اولویت و محرمانگی
    // =============================================
    priority: {
      type: String,
      ref: 'EnumValue',
      default: null,
    },
    classification: {
      type: String,
      enum: ['normal', 'confidential', 'secret', 'top_secret'],
      default: 'normal',
    },

    // =============================================
    // فیلدهای گردش کار
    // =============================================
    workflowStatus: {
      type: String,
      ref: 'EnumValue',
      default: null,
    },
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
    // فیلدهای امضا
    // =============================================
    signatures: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Signature',
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
    // فیلدهای بایگانی
    // =============================================
    isArchived: {
      type: Boolean,
      default: false,
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
    archiveType: {
      type: String,
      enum: ['active', 'semi_active', 'inactive'],
      default: 'active',
    },
    // ✅ تغییر نام از archive به archiveInfo
    archiveInfo: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Archive' },
      name: { type: String, default: '' },
      path: { type: String, default: '' },
    },

    // =============================================
    // فیلدهای تاریخچه
    // =============================================
    trackingHistory: [{
      status: { type: String },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      comment: { type: String, default: '' },
      timestamp: { type: Date, default: Date.now },
    }],
    viewLogs: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      viewedAt: { type: Date, default: Date.now },
      ip: { type: String, default: '' },
      userAgent: { type: String, default: '' },
      action: { type: String, enum: ['view', 'download', 'print'], default: 'view' },
    }],

    // =============================================
    // فیلدهای دسترسی و درخواست‌ها
    // =============================================
    accessRequests: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
      message: { type: String, default: '' },
      response: { type: String, default: '' },
      createdAt: { type: Date, default: Date.now },
      respondedAt: { type: Date, default: null },
      respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    }],

    // =============================================
    // فیلدهای مرتبط
    // =============================================
    relatedLetters: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    }],
    relatedHardware: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hardware',
    }],

    // =============================================
    // فیلدهای متادیتا
    // =============================================
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

  },
  { timestamps: true }
);

// =============================================
// ✅ ایندکس‌ها (بدون تکراری)
// =============================================

// ایندکس‌های اصلی
DocumentSchema.index({ letterNumber: 1 }, { unique: true, sparse: true });
DocumentSchema.index({ letterType: 1, letterDate: -1 });
DocumentSchema.index({ workflowStatus: 1, dueDate: 1 });
DocumentSchema.index({ sender: 1, receiver: 1 });
DocumentSchema.index({ documentType: 1 });
DocumentSchema.index({ department: 1, accessLevel: 1 });
DocumentSchema.index({ accessExpiry: 1 });
DocumentSchema.index({ uploadedBy: 1 });

// ایندکس‌های OCR
DocumentSchema.index({ ocrText: 'text' });
DocumentSchema.index({ ocrProcessed: 1 });
DocumentSchema.index({ ocrLanguage: 1 });
DocumentSchema.index({ ocrKeywords: 1 });

// ایندکس‌های بایگانی
DocumentSchema.index({ isArchived: 1, archivedAt: -1 });
DocumentSchema.index({ 'archiveInfo.id': 1 });

// ایندکس‌های تاریخچه
DocumentSchema.index({ 'trackingHistory.timestamp': -1 });
DocumentSchema.index({ 'viewLogs.viewedAt': -1 });

// ایندکس Full-Text
DocumentSchema.index(
  { 
    title: 'text', 
    description: 'text', 
    tags: 'text',
    ocrText: 'text',
  },
  {
    weights: {
      title: 10,
      tags: 8,
      description: 3,
      ocrText: 2,
    },
    name: 'document_fulltext_index',
    default_language: 'none',
  }
);

// =============================================
// ✅ میدلور (Middleware)
// =============================================

// قبل از ذخیره - تنظیم خودکار برخی فیلدها
DocumentSchema.pre('save', function(next) {
  // اگر OCR انجام شده، زمان را ثبت کن
  if (this.ocrProcessed && !this.ocrProcessedAt) {
    this.ocrProcessedAt = new Date();
  }

  // تنظیم fileName اگر خالی باشد
  if (!this.fileName && this.filePath) {
    const path = require('path');
    this.fileName = path.basename(this.filePath);
  }

  next();
});

// =============================================
// ✅ متدهای نمونه (Instance Methods)
// =============================================

// =============================================
// ۱. دریافت مقدار نمایشی یک فیلد Enum
// =============================================
DocumentSchema.methods.getEnumLabel = async function (field) {
  if (!this[field]) return null;
  const enumValue = await EnumValue.findOne({
    group:
      field === 'fileType'
        ? 'file_type'
        : field === 'accessLevel'
        ? 'access_level'
        : field === 'letterType'
        ? 'letter_type'
        : field === 'priority'
        ? 'ticket_priority'
        : field === 'workflowStatus'
        ? 'letter_status'
        : null,
    key: this[field],
  });
  return enumValue ? enumValue.label : this[field];
};

// =============================================
// ۲. اضافه کردن به تاریخچه
// =============================================
DocumentSchema.methods.addTracking = async function (status, userId, comment = '') {
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

// =============================================
// ۳. ثبت بازدید
// =============================================
DocumentSchema.methods.addView = async function (userId, action = 'view', ip = '', userAgent = '') {
  this.viewLogs = this.viewLogs || [];
  this.viewLogs.push({
    user: userId,
    viewedAt: new Date(),
    ip,
    userAgent,
    action,
  });
  await this.save();
  return this;
};

// =============================================
// ۴. درخواست دسترسی
// =============================================
DocumentSchema.methods.requestAccess = async function (userId, message = '') {
  this.accessRequests = this.accessRequests || [];
  const existing = this.accessRequests.find(
    r => r.user.toString() === userId.toString() && r.status === 'pending'
  );
  if (existing) {
    throw new Error('شما قبلاً درخواست دسترسی داده‌اید');
  }
  this.accessRequests.push({
    user: userId,
    message,
    status: 'pending',
    createdAt: new Date(),
  });
  await this.save();
  return this;
};

// =============================================
// ۵. پاسخ به درخواست دسترسی
// =============================================
DocumentSchema.methods.respondToAccessRequest = async function (
  requestId,
  status,
  response = '',
  responderId
) {
  const request = this.accessRequests.id(requestId);
  if (!request) {
    throw new Error('درخواست یافت نشد');
  }
  request.status = status;
  request.response = response;
  request.respondedAt = new Date();
  request.respondedBy = responderId;
  await this.save();
  return this;
};

// =============================================
// ۶. بررسی دسترسی کاربر به سند
// =============================================
DocumentSchema.methods.hasAccess = function (userId) {
  // ادمین دسترسی کامل دارد
  const User = mongoose.model('User');
  // اینجا باید role کاربر بررسی شود، در کنترلر انجام می‌شود
  
  // اگر عمومی است
  if (this.accessLevel === 'public') return true;
  
  // اگر آپلودکننده است
  if (this.uploadedBy.toString() === userId.toString()) return true;
  
  // اگر دسترسی محدود به دپارتمان است
  if (this.accessLevel === 'restricted' && this.department === 'All') return true;
  
  // اگر درخواست تایید شده دارد
  const approvedRequest = this.accessRequests?.find(
    r => r.user.toString() === userId.toString() && r.status === 'approved'
  );
  if (approvedRequest) return true;
  
  return false;
};

// =============================================
// ۷. بایگانی کردن سند (✅ تغییر نام به archiveDocument)
// =============================================
DocumentSchema.methods.archiveDocument = async function (archiveType = 'active', userId, comment = '') {
  this.isArchived = true;
  this.archivedAt = new Date();
  this.archivedBy = userId;
  this.archiveType = archiveType;
  await this.addTracking('archived', userId, comment || `سند بایگانی شد (${archiveType})`);
  await this.save();
  return this;
};

// =============================================
// ۸. بازیابی از بایگانی
// =============================================
DocumentSchema.methods.unarchive = async function (userId, comment = '') {
  this.isArchived = false;
  this.archivedAt = null;
  this.archivedBy = null;
  await this.addTracking('unarchived', userId, comment || 'سند از بایگانی بازیابی شد');
  await this.save();
  return this;
};

// =============================================
// ۹. دریافت وضعیت OCR
// =============================================
DocumentSchema.methods.getOCRStatus = function () {
  return {
    processed: this.ocrProcessed,
    language: this.ocrLanguage,
    confidence: this.ocrConfidence,
    wordCount: this.ocrStats?.wordCount || 0,
    processedAt: this.ocrProcessedAt,
  };
};

// =============================================
// ۱۰. دریافت خلاصه سند
// =============================================
DocumentSchema.methods.getSummary = function () {
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    fileType: this.fileType,
    category: this.category,
    tags: this.tags,
    accessLevel: this.accessLevel,
    uploadedBy: this.uploadedBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    isArchived: this.isArchived,
    ocrProcessed: this.ocrProcessed,
  };
};

// =============================================
// ✅ استاتیک‌ها (Static Methods)
// =============================================

// =============================================
// ۱. دریافت Enumها
// =============================================
DocumentSchema.statics.getEnumOptions = async function (group) {
  const enumValues = await EnumValue.find({ group, isActive: true }).sort({ order: 1 });
  return enumValues.map((ev) => ({
    value: ev.key,
    label: ev.label,
    color: ev.color,
    icon: ev.icon,
  }));
};

// =============================================
// ۲. دریافت نامه‌های در انتظار برای یک کاربر
// =============================================
DocumentSchema.statics.getPendingLetters = async function (userId) {
  return this.find({
    documentType: 'letter',
    workflowStatus: 'pending',
    $or: [{ receiver: userId }, { 'trackingHistory.user': userId }],
  })
    .populate('sender', 'fullName username')
    .populate('receiver', 'fullName username')
    .sort({ createdAt: -1 });
};

// =============================================
// ۳. دریافت نامه‌های سررسید شده
// =============================================
DocumentSchema.statics.getOverdueLetters = async function () {
  const now = new Date();
  return this.find({
    documentType: 'letter',
    workflowStatus: { $nin: ['archived', 'rejected', 'approved'] },
    dueDate: { $lt: now },
  })
    .populate('sender', 'fullName username')
    .populate('receiver', 'fullName username')
    .sort({ dueDate: 1 });
};

// =============================================
// ۴. دریافت آمار نامه‌ها
// =============================================
DocumentSchema.statics.getLetterStats = async function () {
  const stats = await this.aggregate([
    { $match: { documentType: 'letter' } },
    {
      $group: {
        _id: '$workflowStatus',
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    archived: 0,
    total: 0,
  };

  stats.forEach((stat) => {
    if (stat._id === 'draft') result.draft = stat.count;
    else if (stat._id === 'pending') result.pending = stat.count;
    else if (stat._id === 'approved') result.approved = stat.count;
    else if (stat._id === 'rejected') result.rejected = stat.count;
    else if (stat._id === 'archived') result.archived = stat.count;
    result.total += stat.count;
  });

  return result;
};

// =============================================
// ۵. دریافت آمار OCR
// =============================================
DocumentSchema.statics.getOCRStats = async function () {
  const total = await this.countDocuments();
  const processed = await this.countDocuments({ ocrProcessed: true });
  const pending = total - processed;

  const languageStats = await this.aggregate([
    { $match: { ocrProcessed: true } },
    {
      $group: {
        _id: '$ocrLanguage',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$ocrConfidence' },
      },
    },
  ]);

  return {
    total,
    processed,
    pending,
    languageStats,
    averageConfidence: languageStats.length > 0
      ? languageStats.reduce((sum, s) => sum + s.avgConfidence, 0) / languageStats.length
      : 0,
  };
};

// =============================================
// ۶. جستجوی پیشرفته در اسناد
// =============================================
DocumentSchema.statics.advancedSearch = async function (params) {
  const {
    query,
    category,
    fileType,
    accessLevel,
    department,
    fromDate,
    toDate,
    ocrOnly = false,
    tags = [],
    page = 1,
    limit = 20,
  } = params;

  const filter = {};

  if (query) {
    const searchFields = ['title', 'description', 'tags', 'ocrText'];
    const searchConditions = searchFields.map(field => ({
      [field]: { $regex: query, $options: 'i' },
    }));
    filter.$or = searchConditions;
  }

  if (category) filter.category = category;
  if (fileType) filter.fileType = fileType;
  if (accessLevel) filter.accessLevel = accessLevel;
  if (department && department !== 'All') filter.department = department;
  if (tags && tags.length > 0) filter.tags = { $in: tags };

  if (ocrOnly) {
    filter.ocrProcessed = true;
    filter.ocrText = { $ne: '' };
  }

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }

  const skip = (page - 1) * limit;

  const data = await this.find(filter)
    .populate('uploadedBy', 'fullName username')
    .populate('department', 'name code')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await this.countDocuments(filter);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// =============================================
// ۷. دریافت اسناد نیازمند OCR
// =============================================
DocumentSchema.statics.getDocumentsNeedingOCR = async function (limit = 100) {
  return this.find({
    $or: [
      { ocrProcessed: { $ne: true } },
      { ocrProcessed: { $exists: false } },
    ],
    filePath: { $ne: '' },
  })
    .sort({ createdAt: 1 })
    .limit(limit);
};

// =============================================
// ۸. دریافت اسناد یک کاربر
// =============================================
DocumentSchema.statics.getByUser = function (userId, options = {}) {
  const { limit = 50, page = 1, includeArchived = false } = options;
  const filter = { uploadedBy: userId };
  if (!includeArchived) filter.isArchived = false;

  const skip = (page - 1) * limit;

  return this.find(filter)
    .populate('department', 'name code')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// =============================================
// ۹. دریافت آمار کلی اسناد
// =============================================
DocumentSchema.statics.getStats = async function () {
  const total = await this.countDocuments();
  const archived = await this.countDocuments({ isArchived: true });
  const active = total - archived;

  const byType = await this.aggregate([
    {
      $group: {
        _id: '$documentType',
        count: { $sum: 1 },
      },
    },
  ]);

  const byFileType = await this.aggregate([
    {
      $group: {
        _id: '$fileType',
        count: { $sum: 1 },
      },
    },
  ]);

  const ocrStats = await this.getOCRStats();

  return {
    total,
    active,
    archived,
    byType,
    byFileType,
    ocr: ocrStats,
  };
};

// =============================================
// ✅ مدل نهایی
// =============================================
module.exports = mongoose.models.Document || mongoose.model('Document', DocumentSchema);
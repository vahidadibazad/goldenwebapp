const mongoose = require('mongoose');

const ArchiveSchema = new mongoose.Schema({
  // =============================================
  // اطلاعات پایه
  // =============================================
  name: {
    type: String,
    required: [true, 'نام بایگانی الزامی است'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'کد بایگانی الزامی است'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  
  // =============================================
  // نوع بایگانی
  // =============================================
  type: {
    type: String,
    enum: ['active', 'semi_active', 'inactive', 'digital'],
    default: 'active',
  },
  
  // =============================================
  // دبیرخانه مرتبط
  // =============================================
  secretariat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Secretariat',
    required: true,
  },
  
  // =============================================
  // ساختار درختی
  // =============================================
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Archive',
    default: null,
  },
  path: {
    type: String,
    default: '',
  },
  level: {
    type: Number,
    default: 0,
  },
  
  // =============================================
  // دسته‌بندی
  // =============================================
  category: {
    type: String,
    enum: ['general', 'financial', 'legal', 'personnel', 'technical', 'other'],
    default: 'general',
  },
  
  // =============================================
  // محدوده زمانی
  // =============================================
  yearFrom: {
    type: Number,
    default: null,
  },
  yearTo: {
    type: Number,
    default: null,
  },
  
  // =============================================
  // تنظیمات
  // =============================================
  settings: {
    allowDelete: { type: Boolean, default: false },
    allowEdit: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: true },
    retentionPeriod: { type: Number, default: 365 }, // روز
  },
  
  // =============================================
  // آمار
  // =============================================
  stats: {
    totalLetters: { type: Number, default: 0 },
    totalSize: { type: Number, default: 0 }, // بایت
    lastUpdate: { type: Date, default: null },
  },
  
  // =============================================
  // مسئول بایگانی
  // =============================================
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // =============================================
  // فعال/غیرفعال
  // =============================================
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // =============================================
  // اطلاعات ایجادکننده
  // =============================================
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
}, { timestamps: true });

// =============================================
// ✅ ایندکس‌ها
// =============================================
ArchiveSchema.index({ code: 1 });
ArchiveSchema.index({ secretariat: 1, type: 1 });
ArchiveSchema.index({ parent: 1, path: 1 });
ArchiveSchema.index({ category: 1 });

// =============================================
// ✅ میدلور - محاسبه path و level
// =============================================
ArchiveSchema.pre('save', async function(next) {
  if (this.parent) {
    const parent = await mongoose.model('Archive').findById(this.parent);
    if (parent) {
      this.level = parent.level + 1;
      this.path = parent.path ? `${parent.path}/${this._id}` : `${this._id}`;
    }
  } else {
    this.level = 0;
    this.path = `${this._id}`;
  }
  next();
});

// =============================================
// ✅ متدهای نمونه
// =============================================

// دریافت زیرمجموعه‌ها
ArchiveSchema.methods.getChildren = async function() {
  return mongoose.model('Archive').find({ parent: this._id, isActive: true })
    .sort({ name: 1 });
};

// دریافت تمام زیرمجموعه‌ها (بازگشتی)
ArchiveSchema.methods.getAllChildren = async function() {
  const children = await this.getChildren();
  let allChildren = [...children];
  
  for (const child of children) {
    const grandChildren = await child.getAllChildren();
    allChildren = allChildren.concat(grandChildren);
  }
  
  return allChildren;
};

// دریافت درخت کامل
ArchiveSchema.methods.getTree = async function() {
  const children = await this.getChildren();
  const tree = {
    ...this.toObject(),
    children: [],
  };
  
  for (const child of children) {
    const childTree = await child.getTree();
    tree.children.push(childTree);
  }
  
  return tree;
};

// دریافت نامه‌های این بایگانی
ArchiveSchema.methods.getLetters = async function(filter = {}) {
  const Letter = mongoose.model('Letter');
  return Letter.find({
    'archive.id': this._id,
    ...filter,
  })
    .populate('sender', 'fullName username')
    .populate('receiver', 'fullName username')
    .sort({ createdAt: -1 });
};

// =============================================
// ✅ استاتیک‌ها
// =============================================

// دریافت ساختار درختی کامل
ArchiveSchema.statics.getFullTree = async function(secretariatId) {
  const roots = await this.find({
    secretariat: secretariatId,
    parent: null,
    isActive: true,
  }).sort({ name: 1 });
  
  const tree = [];
  for (const root of roots) {
    const rootTree = await root.getTree();
    tree.push(rootTree);
  }
  
  return tree;
};

// جستجو در بایگانی
ArchiveSchema.statics.search = async function(query, secretariatId) {
  return this.find({
    secretariat: secretariatId,
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { code: { $regex: query, $options: 'i' } },
      { category: { $regex: query, $options: 'i' } },
    ],
  }).sort({ name: 1 });
};

// دریافت آمار بایگانی
ArchiveSchema.statics.getStats = async function(secretariatId) {
  const archives = await this.find({ secretariat: secretariatId, isActive: true });
  
  let totalLetters = 0;
  let totalSize = 0;
  
  for (const archive of archives) {
    totalLetters += archive.stats.totalLetters || 0;
    totalSize += archive.stats.totalSize || 0;
  }
  
  return {
    totalArchives: archives.length,
    totalLetters,
    totalSize,
    byType: {
      active: archives.filter(a => a.type === 'active').length,
      semi_active: archives.filter(a => a.type === 'semi_active').length,
      inactive: archives.filter(a => a.type === 'inactive').length,
      digital: archives.filter(a => a.type === 'digital').length,
    },
  };
};

module.exports = mongoose.models.Archive || mongoose.model('Archive', ArchiveSchema);
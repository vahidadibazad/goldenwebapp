const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  // =============================================
  // اطلاعات پایه
  // =============================================
  name: {
    type: String,
    required: [true, 'نام گزارش الزامی است'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'کد گزارش الزامی است'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  
  // =============================================
  // نوع گزارش
  // =============================================
  type: {
    type: String,
    enum: [
      'performance',     // عملکرد مکاتبات
      'delay',           // تأخیرات
      'volume',          // حجم مکاتبات
      'department',      // عملکرد واحدها
      'user',            // عملکرد کاربران
      'custom',          // سفارشی
    ],
    required: true,
  },
  
  // =============================================
  // دسته‌بندی
  // =============================================
  category: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
    default: 'monthly',
  },
  
  // =============================================
  // بازه زمانی
  // =============================================
  dateRange: {
    from: { type: Date, default: null },
    to: { type: Date, default: null },
  },
  
  // =============================================
  // فیلترها
  // =============================================
  filters: {
    secretariat: { type: mongoose.Schema.Types.ObjectId, ref: 'Secretariat', default: null },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    letterType: { type: String, enum: ['incoming', 'outgoing', 'internal', 'all'], default: 'all' },
    status: { type: String, enum: ['all', 'draft', 'registered', 'referred', 'read', 'actioned', 'archived'], default: 'all' },
    classification: { type: String, enum: ['all', 'normal', 'confidential', 'secret', 'top_secret'], default: 'all' },
    priority: { type: String, enum: ['all', 'low', 'medium', 'high', 'urgent'], default: 'all' },
  },
  
  // =============================================
  // ستون‌های گزارش
  // =============================================
  columns: [{
    key: { type: String, required: true },
    label: { type: String, required: true },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  }],
  
  // =============================================
  // داده‌های گزارش (ذخیره‌شده)
  // =============================================
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  
  // =============================================
  // آمار
  // =============================================
  stats: {
    totalRecords: { type: Number, default: 0 },
    totalPages: { type: Number, default: 0 },
    generatedAt: { type: Date, default: null },
  },
  
  // =============================================
  // وضعیت
  // =============================================
  status: {
    type: String,
    enum: ['draft', 'pending', 'generated', 'failed'],
    default: 'draft',
  },
  
  // =============================================
  // فرمت خروجی
  // =============================================
  exportFormat: {
    type: String,
    enum: ['excel', 'pdf', 'csv', 'json'],
    default: 'excel',
  },
  
  // =============================================
  // زمان‌بندی
  // =============================================
  schedule: {
    enabled: { type: Boolean, default: false },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'monthly' },
    dayOfWeek: { type: Number, min: 0, max: 6, default: 0 },
    dayOfMonth: { type: Number, min: 1, max: 31, default: 1 },
    time: { type: String, default: '09:00' },
    lastRun: { type: Date, default: null },
    nextRun: { type: Date, default: null },
  },
  
  // =============================================
  // گیرندگان گزارش (برای ارسال خودکار)
  // =============================================
  recipients: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String },
    role: { type: String },
  }],
  
  // =============================================
  // اطلاعات ایجادکننده
  // =============================================
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  
}, { timestamps: true });

// =============================================
// ✅ ایندکس‌ها
// =============================================
ReportSchema.index({ code: 1 });
ReportSchema.index({ type: 1, category: 1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ 'schedule.enabled': 1, 'schedule.nextRun': 1 });

// =============================================
// ✅ متدهای نمونه
// =============================================

// تولید داده‌های گزارش
ReportSchema.methods.generate = async function() {
  const Letter = mongoose.model('Letter');
  const Referral = mongoose.model('Referral');
  
  const filter = {};
  
  // اعمال فیلترهای تاریخ
  if (this.dateRange.from) filter.letterDate = { $gte: this.dateRange.from };
  if (this.dateRange.to) {
    filter.letterDate = filter.letterDate || {};
    filter.letterDate.$lte = this.dateRange.to;
  }
  
  // اعمال فیلترهای دیگر
  if (this.filters.secretariat) filter.secretariat = this.filters.secretariat;
  if (this.filters.department) {
    filter.$or = [
      { senderDepartment: this.filters.department },
      { receiverDepartment: this.filters.department },
    ];
  }
  if (this.filters.letterType && this.filters.letterType !== 'all') {
    filter.letterType = this.filters.letterType;
  }
  if (this.filters.status && this.filters.status !== 'all') {
    filter.status = this.filters.status;
  }
  if (this.filters.classification && this.filters.classification !== 'all') {
    filter.classification = this.filters.classification;
  }
  if (this.filters.priority && this.filters.priority !== 'all') {
    filter.priority = this.filters.priority;
  }
  
  // دریافت داده‌ها
  const letters = await Letter.find(filter)
    .populate('sender', 'fullName username')
    .populate('receiver', 'fullName username')
    .populate('secretariat', 'name code')
    .populate('senderDepartment', 'name code')
    .populate('receiverDepartment', 'name code')
    .sort({ letterDate: -1 });
  
  // محاسبه آمار
  const stats = {
    total: letters.length,
    byType: this._groupBy(letters, 'letterType'),
    byStatus: this._groupBy(letters, 'status'),
    byPriority: this._groupBy(letters, 'priority'),
    byClassification: this._groupBy(letters, 'classification'),
    byDepartment: this._groupByDepartment(letters),
    overdue: letters.filter(l => l.dueDate && new Date(l.dueDate) < new Date()).length,
  };
  
  // ذخیره داده‌ها
  this.data = letters;
  this.stats = {
    totalRecords: letters.length,
    generatedAt: new Date(),
    ...stats,
  };
  this.status = 'generated';
  
  await this.save();
  return this;
};

// تابع کمکی برای گروه‌بندی
ReportSchema.methods._groupBy = function(data, field) {
  const result = {};
  data.forEach(item => {
    const key = item[field] || 'unknown';
    result[key] = (result[key] || 0) + 1;
  });
  return result;
};

// تابع کمکی برای گروه‌بندی بر اساس واحد
ReportSchema.methods._groupByDepartment = function(data) {
  const result = {};
  data.forEach(item => {
    const dept = item.senderDepartment?.name || item.receiverDepartment?.name || 'سایر';
    result[dept] = (result[dept] || 0) + 1;
  });
  return result;
};

// محاسبه زمان اجرای بعدی
ReportSchema.methods.calculateNextRun = function() {
  if (!this.schedule.enabled) return null;
  
  const now = new Date();
  let nextRun = new Date(now);
  
  switch (this.schedule.frequency) {
    case 'daily':
      nextRun.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      const daysUntil = (this.schedule.dayOfWeek - now.getDay() + 7) % 7;
      nextRun.setDate(now.getDate() + (daysUntil || 7));
      break;
    case 'monthly':
      nextRun.setMonth(now.getMonth() + 1);
      nextRun.setDate(Math.min(this.schedule.dayOfMonth, this._getDaysInMonth(nextRun)));
      break;
  }
  
  // تنظیم ساعت
  const [hours, minutes] = (this.schedule.time || '09:00').split(':');
  nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  this.schedule.nextRun = nextRun;
  return nextRun;
};

// تعداد روزهای ماه
ReportSchema.methods._getDaysInMonth = function(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

// =============================================
// ✅ استاتیک‌ها
// =============================================

// دریافت گزارش‌های زمان‌بندی شده
ReportSchema.statics.getScheduledReports = function() {
  const now = new Date();
  return this.find({
    'schedule.enabled': true,
    'schedule.nextRun': { $lte: now },
    status: { $ne: 'generated' },
  });
};

// دریافت گزارش‌های یک کاربر
ReportSchema.statics.getByUser = function(userId) {
  return this.find({
    $or: [
      { createdBy: userId },
      { 'recipients.user': userId },
    ],
  }).sort({ createdAt: -1 });
};

// دریافت آمار گزارش‌ها
ReportSchema.statics.getStats = async function() {
  const total = await this.countDocuments();
  const byType = await this.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);
  const byStatus = await this.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  
  return { total, byType, byStatus };
};

module.exports = mongoose.models.Report || mongoose.model('Report', ReportSchema);
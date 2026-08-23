const mongoose = require('mongoose');

// =============================================
// زیرمجموعه: تاریخچه مراحل
// =============================================
const StepHistorySchema = new mongoose.Schema({
  stepId: {
    type: String,
    required: true,
  },
  stepName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected', 'skipped'],
    default: 'pending',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  comment: {
    type: String,
    default: '',
  },
  startedAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  timeoutAt: {
    type: Date,
    default: null,
  },
  reminderSent: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

// =============================================
// زیرمجموعه: مرحله موازی
// =============================================
const ParallelStepSchema = new mongoose.Schema({
  stepId: {
    type: String,
    required: true,
  },
  stepName: {
    type: String,
    required: true,
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  completedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  requiredCount: {
    type: Number,
    default: 1,
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending',
  },
  startedAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
}, { _id: false });

// =============================================
// مدل اصلی WorkflowInstance
// =============================================
const WorkflowInstanceSchema = new mongoose.Schema({
  // =============================================
  // اطلاعات گردش کار
  // =============================================
  
  // ارجاع به گردش کار اصلی
  workflow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true,
  },
  
  // شناسه هدف (نامه، درخواست مرخصی، ماموریت و غیره)
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType',
  },
  
  // نوع هدف
  targetType: {
    type: String,
    enum: ['Document', 'LeaveRequest', 'MissionRequest', 'PurchaseRequest'],
    required: true,
  },
  
  // =============================================
  // وضعیت گردش کار
  // =============================================
  
  // وضعیت کلی
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'rejected', 'paused'],
    default: 'active',
  },
  
  // مرحله جاری
  currentStep: {
    type: String,
    default: '',
  },
  
  // مرحله قبلی
  previousStep: {
    type: String,
    default: '',
  },
  
  // =============================================
  // تاریخچه
  // =============================================
  
  history: [StepHistorySchema],
  
  // =============================================
  // مراحل موازی
  // =============================================
  
  parallelSteps: [ParallelStepSchema],
  
  // =============================================
  // اطلاعات درخواست‌دهنده
  // =============================================
  
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // =============================================
  // اطلاعات تکمیل
  // =============================================
  
  completedAt: {
    type: Date,
    default: null,
  },
  cancelledAt: {
    type: Date,
    default: null,
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  cancelReason: {
    type: String,
    default: '',
  },
  
  // =============================================
  // تنظیمات زمان‌بندی
  // =============================================
  
  // تاریخ سررسید
  dueDate: {
    type: Date,
    default: null,
  },
  
  // آخرین اخطار ارسال شده
  lastReminderAt: {
    type: Date,
    default: null,
  },
  
  // تعداد اخطارهای ارسال شده
  reminderCount: {
    type: Number,
    default: 0,
  },
  
  // =============================================
  // اطلاعات اضافی (برای انعطاف‌پذیری)
  // =============================================
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  
}, { timestamps: true });

// =============================================
// ✅ ایندکس‌ها
// =============================================
WorkflowInstanceSchema.index({ workflow: 1, status: 1 });
WorkflowInstanceSchema.index({ targetId: 1, targetType: 1 });
WorkflowInstanceSchema.index({ requester: 1, status: 1 });
WorkflowInstanceSchema.index({ currentStep: 1 });
WorkflowInstanceSchema.index({ dueDate: 1 });
WorkflowInstanceSchema.index({ 'history.stepId': 1 });

// =============================================
// ✅ متدهای نمونه (Instance Methods)
// =============================================

// شروع گردش کار
WorkflowInstanceSchema.methods.start = async function() {
  if (this.status !== 'active') {
    throw new Error('گردش کار قابل شروع نیست');
  }
  
  const workflow = await mongoose.model('Workflow').findById(this.workflow);
  if (!workflow) {
    throw new Error('گردش کار یافت نشد');
  }
  
  const firstStep = workflow.getFirstStep();
  if (!firstStep) {
    throw new Error('گردش کار فاقد مرحله اول است');
  }
  
  this.currentStep = firstStep.id;
  this.history.push({
    stepId: firstStep.id,
    stepName: firstStep.name,
    status: 'pending',
    startedAt: new Date(),
  });
  
  await this.save();
  return this;
};

// حرکت به مرحله بعدی
WorkflowInstanceSchema.methods.nextStep = async function(stepId, userId, comment = '') {
  const workflow = await mongoose.model('Workflow').findById(this.workflow);
  if (!workflow) {
    throw new Error('گردش کار یافت نشد');
  }
  
  const currentStep = workflow.getStepById(this.currentStep);
  if (!currentStep) {
    throw new Error('مرحله جاری یافت نشد');
  }
  
  // به‌روزرسانی تاریخچه مرحله جاری
  const historyEntry = this.history.find(h => h.stepId === this.currentStep);
  if (historyEntry) {
    historyEntry.status = 'completed';
    historyEntry.performedBy = userId;
    historyEntry.comment = comment;
    historyEntry.completedAt = new Date();
  }
  
  // پیدا کردن مراحل بعدی
  const nextSteps = workflow.getNextSteps(this.currentStep);
  
  if (nextSteps.length === 0) {
    // گردش کار کامل شد
    this.status = 'completed';
    this.completedAt = new Date();
    this.currentStep = '';
  } else if (nextSteps.length === 1) {
    // یک مرحله بعدی
    this.previousStep = this.currentStep;
    this.currentStep = nextSteps[0].id;
    this.history.push({
      stepId: nextSteps[0].id,
      stepName: nextSteps[0].name,
      status: 'pending',
      startedAt: new Date(),
    });
  } else {
    // چند مرحله بعدی (موازی)
    this.previousStep = this.currentStep;
    this.currentStep = 'parallel';
    
    const parallelStep = {
      stepId: 'parallel',
      stepName: 'مراحل موازی',
      assignedTo: [],
      completedBy: [],
      requiredCount: nextSteps.length,
      status: 'in_progress',
      startedAt: new Date(),
    };
    
    for (const step of nextSteps) {
      this.history.push({
        stepId: step.id,
        stepName: step.name,
        status: 'pending',
        startedAt: new Date(),
      });
      parallelStep.assignedTo.push(step.actors[0]); // ساده‌سازی: نقش اول
    }
    
    this.parallelSteps.push(parallelStep);
  }
  
  await this.save();
  return this;
};

// تکمیل مرحله موازی
WorkflowInstanceSchema.methods.completeParallelStep = async function(stepId, userId) {
  const parallelIndex = this.parallelSteps.findIndex(p => p.stepId === 'parallel');
  if (parallelIndex === -1) {
    throw new Error('مرحله موازی یافت نشد');
  }
  
  const parallel = this.parallelSteps[parallelIndex];
  
  // بررسی اینکه آیا کاربر مجاز است
  if (!parallel.assignedTo.includes(userId) && parallel.completedBy.includes(userId)) {
    throw new Error('شما مجاز به تکمیل این مرحله نیستید');
  }
  
  // اضافه کردن کاربر به لیست تکمیل‌کنندگان
  if (!parallel.completedBy.includes(userId)) {
    parallel.completedBy.push(userId);
  }
  
  // به‌روزرسانی تاریخچه
  const historyEntry = this.history.find(h => h.stepId === stepId);
  if (historyEntry) {
    historyEntry.status = 'completed';
    historyEntry.performedBy = userId;
    historyEntry.completedAt = new Date();
  }
  
  // بررسی اینکه آیا همه تکمیل شده است
  if (parallel.completedBy.length >= parallel.requiredCount) {
    parallel.status = 'completed';
    parallel.completedAt = new Date();
    
    // حرکت به مرحله بعدی
    const workflow = await mongoose.model('Workflow').findById(this.workflow);
    const nextSteps = workflow.getNextSteps(this.currentStep);
    
    if (nextSteps.length === 1) {
      this.currentStep = nextSteps[0].id;
      this.history.push({
        stepId: nextSteps[0].id,
        stepName: nextSteps[0].name,
        status: 'pending',
        startedAt: new Date(),
      });
    } else {
      this.status = 'completed';
      this.completedAt = new Date();
      this.currentStep = '';
    }
  }
  
  await this.save();
  return this;
};

// لغو گردش کار
WorkflowInstanceSchema.methods.cancel = async function(userId, reason = '') {
  if (this.status === 'completed') {
    throw new Error('گردش کار قبلاً تکمیل شده است');
  }
  
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelledBy = userId;
  this.cancelReason = reason;
  
  await this.save();
  return this;
};

// دریافت وضعیت جاری
WorkflowInstanceSchema.methods.getCurrentStatus = async function() {
  const workflow = await mongoose.model('Workflow').findById(this.workflow);
  if (!workflow) {
    return { status: this.status, step: null, progress: 0 };
  }
  
  const totalSteps = workflow.steps.length;
  const completedSteps = this.history.filter(h => h.status === 'completed').length;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  
  const currentStepInfo = workflow.getStepById(this.currentStep);
  
  return {
    status: this.status,
    step: currentStepInfo,
    progress,
    totalSteps,
    completedSteps,
  };
};

// ارسال اخطار
WorkflowInstanceSchema.methods.sendReminder = async function() {
  this.lastReminderAt = new Date();
  this.reminderCount += 1;
  await this.save();
  return this;
};

// =============================================
// ✅ استاتیک‌ها (Static Methods)
// =============================================

// دریافت گردش‌کارهای فعال برای یک کاربر
WorkflowInstanceSchema.statics.getActiveForUser = function(userId) {
  return this.find({
    $or: [
      { requester: userId },
      { 'history.assignedTo': userId },
      { 'parallelSteps.assignedTo': userId },
    ],
    status: 'active',
  })
  .populate('workflow', 'name type')
  .populate('requester', 'fullName username')
  .sort({ createdAt: -1 });
};

// دریافت گردش‌کارهای در انتظار برای یک کاربر
WorkflowInstanceSchema.statics.getPendingForUser = function(userId) {
  return this.find({
    $or: [
      { 'history.assignedTo': userId, 'history.status': 'pending' },
      { 'parallelSteps.assignedTo': userId, 'parallelSteps.status': 'in_progress' },
    ],
    status: 'active',
  })
  .populate('workflow', 'name type')
  .populate('requester', 'fullName username')
  .sort({ dueDate: 1, createdAt: 1 });
};

// دریافت گردش‌کارهای سررسید شده
WorkflowInstanceSchema.statics.getOverdue = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    dueDate: { $lt: now },
  })
  .populate('workflow', 'name type')
  .populate('requester', 'fullName username')
  .sort({ dueDate: 1 });
};

// دریافت آمار گردش‌کارها
WorkflowInstanceSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);
  
  const result = {
    active: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0,
    paused: 0,
    total: 0,
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  return result;
};

// =============================================
// ✅ میدلور (Middleware)
// =============================================

// قبل از ذخیره، اعتبارسنجی
WorkflowInstanceSchema.pre('save', function(next) {
  // اگر dueDate تنظیم نشده، از تنظیمات گردش کار استفاده کن
  if (!this.dueDate) {
    // اینجا می‌توان منطق پیش‌فرض برای تعیین dueDate پیاده‌سازی کرد
  }
  next();
});

// =============================================
// ✅ مدل نهایی
// =============================================
module.exports = mongoose.models.WorkflowInstance || mongoose.model('WorkflowInstance', WorkflowInstanceSchema);
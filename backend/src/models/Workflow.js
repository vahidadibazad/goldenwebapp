const mongoose = require('mongoose');

// =============================================
// زیرمجموعه: مرحله گردش کار
// =============================================
const WorkflowStepSchema = new mongoose.Schema({
  // شناسه یکتای مرحله
  id: {
    type: String,
    required: true,
  },
  
  // نام مرحله
  name: {
    type: String,
    required: true,
  },
  
  // توضیحات مرحله
  description: {
    type: String,
    default: '',
  },
  
  // نقش‌های مجاز برای این مرحله
  actors: [{
    type: String,
    enum: ['requester', 'manager', 'department_manager', 'office_manager', 
           'hr_manager', 'finance_manager', 'ceo', 'admin', 'user', 'custom'],
  }],
  
  // کاربران خاص مجاز برای این مرحله (اختیاری)
  specificUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  
  // نوع اقدام
  action: {
    type: String,
    enum: ['submit', 'review', 'approve', 'reject', 'sign', 'forward', 'archive', 'custom'],
    default: 'approve',
  },
  
  // مراحل بعدی (می‌تواند چندین مرحله برای مسیرهای موازی باشد)
  nextSteps: [{
    type: String,
  }],
  
  // آیا این مرحله اختیاری است؟
  optional: {
    type: Boolean,
    default: false,
  },
  
  // زمان مجاز برای این مرحله (ساعت - ۰ یعنی نامحدود)
  timeout: {
    type: Number,
    default: 0,
  },
  
  // روزهای قبل از سررسید برای یادآوری
  reminderDays: {
    type: [Number],
    default: [3, 1, 0],
  },
  
  // آیا نیاز به امضا دارد؟
  requiresSignature: {
    type: Boolean,
    default: false,
  },
  
  // تعداد امضاهای مورد نیاز (برای امضای چندنفره)
  requiredSignatures: {
    type: Number,
    default: 1,
  },
  
  // پیام پیش‌فرض برای این مرحله
  defaultMessage: {
    type: String,
    default: '',
  },
}, { _id: false });

// =============================================
// زیرمجموعه: شرط گردش کار
// =============================================
const WorkflowConditionSchema = new mongoose.Schema({
  // نام شرط
  name: {
    type: String,
    required: true,
  },
  
  // توضیحات شرط
  description: {
    type: String,
    default: '',
  },
  
  // عبارت شرطی (مثلاً: 'priority === "urgent"')
  condition: {
    type: String,
    required: true,
  },
  
  // مراحلی که باید رد شوند
  skipSteps: [{
    type: String,
  }],
  
  // مرحله‌ای که مستقیماً به آن می‌رود
  directStep: {
    type: String,
    default: '',
  },
  
  // اولویت شرط (عدد بزرگتر = اولویت بالاتر)
  priority: {
    type: Number,
    default: 0,
  },
}, { _id: false });

// =============================================
// مدل اصلی Workflow
// =============================================
const WorkflowSchema = new mongoose.Schema({
  // =============================================
  // اطلاعات پایه
  // =============================================
  
  // نام گردش کار
  name: {
    type: String,
    required: [true, 'نام گردش کار الزامی است'],
    trim: true,
  },
  
  // نوع گردش کار
  type: {
    type: String,
    enum: ['leave', 'mission', 'letter', 'purchase', 'contract', 'custom'],
    required: true,
  },
  
  // توضیحات
  description: {
    type: String,
    default: '',
  },
  
  // وضعیت فعال
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // آیا این گردش کار سیستمی است؟ (قابل حذف توسط کاربر نیست)
  isSystem: {
    type: Boolean,
    default: false,
  },
  
  // =============================================
  // مراحل گردش کار
  // =============================================
  
  steps: [WorkflowStepSchema],
  
  // =============================================
  // قوانین شرطی
  // =============================================
  
  conditions: [WorkflowConditionSchema],
  
  // =============================================
  // تنظیمات اخطار
  // =============================================
  
  reminderSettings: {
    // روزهای قبل از سررسید برای یادآوری
    daysBefore: {
      type: [Number],
      default: [5, 3, 1, 0],
    },
    // روش‌های ارسال
    methods: {
      sms: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
      system: { type: Boolean, default: true },
    },
    // تکرار اخطار (ساعت)
    repeatInterval: {
      type: Number,
      default: 24,
    },
  },
  
  // =============================================
  // واحدهای مجاز برای این گردش کار
  // =============================================
  
  allowedDepartments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  }],
  
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
WorkflowSchema.index({ type: 1, isActive: 1 });
WorkflowSchema.index({ name: 'text', description: 'text' });
WorkflowSchema.index({ isSystem: 1 });
WorkflowSchema.index({ allowedDepartments: 1 });

// =============================================
// ✅ متدهای نمونه (Instance Methods)
// =============================================

// دریافت مرحله بر اساس id
WorkflowSchema.methods.getStepById = function(stepId) {
  return this.steps.find(step => step.id === stepId);
};

// دریافت مرحله اول
WorkflowSchema.methods.getFirstStep = function() {
  return this.steps.length > 0 ? this.steps[0] : null;
};

// دریافت مرحله بعدی
WorkflowSchema.methods.getNextSteps = function(currentStepId) {
  const step = this.getStepById(currentStepId);
  if (!step) return [];
  return step.nextSteps.map(id => this.getStepById(id)).filter(Boolean);
};

// بررسی اینکه آیا گردش کار کامل شده است
WorkflowSchema.methods.isComplete = function(currentStepId) {
  const step = this.getStepById(currentStepId);
  if (!step) return true;
  return step.nextSteps.length === 0;
};

// دریافت مراحل نیازمند امضا
WorkflowSchema.methods.getSignatureSteps = function() {
  return this.steps.filter(step => step.requiresSignature === true);
};

// اعمال شرط‌ها بر روی گردش کار
WorkflowSchema.methods.applyConditions = function(context) {
  let modifiedSteps = [...this.steps];
  const sortedConditions = [...this.conditions].sort((a, b) => b.priority - a.priority);
  
  for (const condition of sortedConditions) {
    try {
      // ساخت Function از شرط
      const fn = new Function('context', `return ${condition.condition};`);
      const result = fn(context);
      
      if (result) {
        // حذف مراحل skipp شده
        if (condition.skipSteps && condition.skipSteps.length > 0) {
          modifiedSteps = modifiedSteps.filter(
            step => !condition.skipSteps.includes(step.id)
          );
        }
        
        // اگر مسیر مستقیم مشخص شده
        if (condition.directStep) {
          // پیدا کردن مرحله مقصد
          const targetStepIndex = modifiedSteps.findIndex(
            step => step.id === condition.directStep
          );
          if (targetStepIndex !== -1) {
            // حذف همه مراحل قبل از مرحله مقصد
            modifiedSteps = modifiedSteps.slice(targetStepIndex);
          }
        }
      }
    } catch (error) {
      console.error(`❌ خطا در اجرای شرط ${condition.name}:`, error);
    }
  }
  
  return modifiedSteps;
};

// =============================================
// ✅ استاتیک‌ها (Static Methods)
// =============================================

// دریافت گردش‌کارهای فعال
WorkflowSchema.statics.getActiveWorkflows = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// دریافت گردش‌کار بر اساس نوع
WorkflowSchema.statics.getByType = function(type) {
  return this.find({ type, isActive: true }).sort({ name: 1 });
};

// دریافت گردش‌کارهای مجاز برای یک واحد
WorkflowSchema.statics.getByDepartment = function(departmentId) {
  return this.find({
    isActive: true,
    $or: [
      { allowedDepartments: { $size: 0 } },
      { allowedDepartments: departmentId },
    ]
  }).sort({ name: 1 });
};

// دریافت گردش‌کارهای سیستمی
WorkflowSchema.statics.getSystemWorkflows = function() {
  return this.find({ isSystem: true, isActive: true }).sort({ name: 1 });
};

// جستجوی گردش‌کارها
WorkflowSchema.statics.search = function(query) {
  return this.find({
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
    ]
  }).sort({ name: 1 });
};

// کپی کردن یک گردش کار (برای ایجاد نسخه جدید)
WorkflowSchema.statics.duplicate = async function(workflowId, newName, userId) {
  const original = await this.findById(workflowId);
  if (!original) throw new Error('گردش کار یافت نشد');
  
  const newWorkflow = new this({
    name: newName || `${original.name} (کپی)`,
    type: original.type,
    description: original.description,
    steps: original.steps.map(step => step.toObject()),
    conditions: original.conditions.map(cond => cond.toObject()),
    reminderSettings: original.reminderSettings.toObject(),
    allowedDepartments: original.allowedDepartments,
    createdBy: userId,
    isSystem: false,
    isActive: true,
  });
  
  return newWorkflow.save();
};

// =============================================
// ✅ میدلور (Middleware)
// =============================================

// قبل از ذخیره، اعتبارسنجی مراحل
WorkflowSchema.pre('save', function(next) {
  // بررسی اینکه حداقل یک مرحله وجود دارد
  if (this.steps.length === 0) {
    return next(new Error('گردش کار باید حداقل یک مرحله داشته باشد'));
  }
  
  // بررسی اینکه مرحله اول وجود دارد
  const firstStep = this.steps[0];
  if (!firstStep) {
    return next(new Error('مرحله اول گردش کار مشخص نشده است'));
  }
  
  // بررسی اینکه تمام nextStepها معتبر هستند
  const allStepIds = new Set(this.steps.map(s => s.id));
  for (const step of this.steps) {
    for (const nextId of step.nextSteps) {
      if (!allStepIds.has(nextId)) {
        return next(new Error(`مرحله ${nextId} در nextSteps وجود ندارد`));
      }
    }
  }
  
  next();
});

// =============================================
// ✅ مدل نهایی
// =============================================
module.exports = mongoose.models.Workflow || mongoose.model('Workflow', WorkflowSchema);
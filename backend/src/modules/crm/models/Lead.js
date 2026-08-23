// backend/src/modules/crm/models/Lead.js
const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema(
  {
    // =============================================
    // اطلاعات پایه
    // =============================================
    leadNumber: {
      type: String,
      required: true,
      unique: true,
    },
    salutation: {
      type: String,
      enum: ['mr', 'ms', 'mrs', 'dr', 'prof'],
      default: 'mr',
    },
    firstName: {
      type: String,
      required: [true, 'نام الزامی است'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'نام خانوادگی الزامی است'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'ایمیل الزامی است'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    mobile: {
      type: String,
      default: '',
      trim: true,
    },

    // =============================================
    // اطلاعات شرکت
    // =============================================
    company: {
      type: String,
      default: '',
      trim: true,
    },
    jobTitle: {
      type: String,
      default: '',
      trim: true,
    },
    industry: {
      type: String,
      default: '',
      trim: true,
    },
    annualRevenue: {
      type: Number,
      default: 0,
    },
    employeeCount: {
      type: Number,
      default: 0,
    },

    // =============================================
    // منبع و امتیاز
    // =============================================
    leadSource: {
      type: String,
      enum: [
        'website', 'referral', 'cold_call', 'email',
        'social', 'ad', 'event', 'partner', 'other',
      ],
      default: 'website',
    },
    rating: {
      type: String,
      enum: ['hot', 'warm', 'cold'],
      default: 'warm',
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // =============================================
    // وضعیت
    // =============================================
    leadStatus: {
      type: String,
      enum: ['new', 'contacted', 'working', 'qualified', 'converted', 'lost'],
      default: 'new',
    },

    // =============================================
    // تخصیص
    // =============================================
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },

    // =============================================
    // تبدیل به مشتری
    // =============================================
    convertedAt: {
      type: Date,
      default: null,
    },
    convertedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },

    // =============================================
    // توضیحات
    // =============================================
    description: {
      type: String,
      default: '',
      trim: true,
    },

    // =============================================
    // برچسب‌ها و فیلدهای سفارشی
    // =============================================
    tags: [String],
    customFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // =============================================
    // تاریخچه فعالیت
    // =============================================
    lastActivity: {
      type: Date,
      default: null,
    },

    // =============================================
    // متادیتا
    // =============================================
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // =============================================
    // کاربر ایجادکننده
    // =============================================
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
LeadSchema.index({ leadNumber: 1 }, { unique: true });
LeadSchema.index({ email: 1 });
LeadSchema.index({ assignedTo: 1, leadStatus: 1 });
LeadSchema.index({ leadStatus: 1, createdAt: -1 });
LeadSchema.index({ company: 1 });
LeadSchema.index({ tags: 1 });
LeadSchema.index({ score: -1 });

// ایندکس Full-Text
LeadSchema.index(
  {
    firstName: 'text',
    lastName: 'text',
    email: 'text',
    company: 'text',
    jobTitle: 'text',
    description: 'text',
  },
  {
    weights: {
      firstName: 10,
      lastName: 10,
      email: 8,
      company: 6,
      jobTitle: 4,
      description: 2,
    },
    name: 'lead_fulltext_index',
    default_language: 'none',
  }
);

// =============================================
// ✅ میدلورها
// =============================================

// تولید شماره سرنخ
LeadSchema.pre('save', function(next) {
  if (this.isNew && !this.leadNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    this.leadNumber = `LEAD-${year}${month}-${random}`;
  }
  next();
});

// =============================================
// ✅ متدهای نمونه
// =============================================

// تخصیص به کاربر
LeadSchema.methods.assign = async function(userId) {
  this.assignedTo = userId;
  this.assignedAt = new Date();
  await this.save();
  return this;
};

// تغییر وضعیت
LeadSchema.methods.changeStatus = async function(status) {
  this.leadStatus = status;
  if (status === 'converted') {
    this.convertedAt = new Date();
  }
  await this.save();
  return this;
};

// تبدیل به مشتری
LeadSchema.methods.convertToAccount = async function(accountData) {
  if (this.leadStatus === 'converted') {
    throw new Error('این سرنخ قبلاً تبدیل شده است');
  }

  const Account = mongoose.model('Account');
  const Contact = mongoose.model('Contact');

  // ایجاد شرکت
  const account = new Account({
    ...accountData,
    name: this.company || `${this.firstName} ${this.lastName}`,
    email: this.email,
    phone: this.phone,
    lead: this._id,
    createdBy: this.createdBy,
    owner: this.assignedTo || this.createdBy,
  });
  await account.save();

  // ایجاد مخاطب
  const contact = new Contact({
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    phone: this.phone,
    mobile: this.mobile,
    jobTitle: this.jobTitle,
    account: account._id,
    lead: this._id,
    createdBy: this.createdBy,
    owner: this.assignedTo || this.createdBy,
  });
  await contact.save();

  // به‌روزرسانی سرنخ
  this.leadStatus = 'converted';
  this.convertedAt = new Date();
  this.convertedTo = account._id;
  await this.save();

  return { account, contact };
};

// =============================================
// ✅ متدهای استاتیک
// =============================================

// دریافت سرنخ‌های یک کاربر
LeadSchema.statics.getByUser = function(userId, options = {}) {
  const { status, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const filter = { assignedTo: userId };
  if (status) filter.leadStatus = status;

  return this.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// دریافت آمار سرنخ‌ها
LeadSchema.statics.getStats = function() {
  return Promise.all([
    this.countDocuments({ leadStatus: 'new' }),
    this.countDocuments({ leadStatus: 'contacted' }),
    this.countDocuments({ leadStatus: 'working' }),
    this.countDocuments({ leadStatus: 'qualified' }),
    this.countDocuments({ leadStatus: 'converted' }),
    this.countDocuments({ leadStatus: 'lost' }),
    this.aggregate([
      { $group: { _id: '$leadSource', count: { $sum: 1 } } },
    ]),
  ]).then(([newLeads, contacted, working, qualified, converted, lost, bySource]) => ({
    new: newLeads,
    contacted,
    working,
    qualified,
    converted,
    lost,
    total: newLeads + contacted + working + qualified + converted + lost,
    bySource,
  }));
};

module.exports = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
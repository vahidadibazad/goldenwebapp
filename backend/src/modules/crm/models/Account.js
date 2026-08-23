// backend/src/modules/crm/models/Account.js
const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema(
  {
    // =============================================
    // اطلاعات پایه
    // =============================================
    accountNumber: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'نام شرکت الزامی است'],
      trim: true,
    },
    website: {
      type: String,
      default: '',
      trim: true,
    },
    industry: {
      type: String,
      default: '',
      trim: true,
    },
    type: {
      type: String,
      enum: ['customer', 'partner', 'competitor', 'vendor', 'other'],
      default: 'customer',
    },
    tier: {
      type: String,
      enum: ['platinum', 'gold', 'silver', 'bronze', 'normal'],
      default: 'normal',
    },

    // =============================================
    // اطلاعات مالی
    // =============================================
    annualRevenue: {
      type: Number,
      default: 0,
    },
    employeeCount: {
      type: Number,
      default: 0,
    },

    // =============================================
    // آدرس‌ها
    // =============================================
    billingAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'IR' },
    },
    shippingAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'IR' },
    },

    // =============================================
    // اطلاعات تماس
    // =============================================
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    fax: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },

    // =============================================
    // سرنخ مرتبط
    // =============================================
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },

    // =============================================
    // ساختار سازمانی
    // =============================================
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },

    // =============================================
    // مالک و تیم
    // =============================================
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    team: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],

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
    // وضعیت
    // =============================================
    isActive: {
      type: Boolean,
      default: true,
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
AccountSchema.index({ accountNumber: 1 }, { unique: true });
AccountSchema.index({ name: 1 });
AccountSchema.index({ owner: 1, isActive: 1 });
AccountSchema.index({ tier: 1 });
AccountSchema.index({ industry: 1 });
AccountSchema.index({ tags: 1 });

// =============================================
// ✅ میدلورها
// =============================================

// تولید شماره شرکت
AccountSchema.pre('save', function(next) {
  if (this.isNew && !this.accountNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    this.accountNumber = `ACC-${year}${month}-${random}`;
  }
  next();
});

// =============================================
// ✅ متدهای نمونه
// =============================================

// دریافت مخاطبین
AccountSchema.methods.getContacts = function() {
  const Contact = mongoose.model('Contact');
  return Contact.find({ account: this._id, isActive: true })
    .sort({ firstName: 1, lastName: 1 })
    .lean();
};

// دریافت فرصت‌ها
AccountSchema.methods.getOpportunities = function() {
  const Opportunity = mongoose.model('Opportunity');
  return Opportunity.find({ account: this._id })
    .sort({ createdAt: -1 })
    .lean();
};

// دریافت قراردادها
AccountSchema.methods.getContracts = function() {
  const Contract = mongoose.model('Contract');
  return Contract.find({ account: this._id })
    .sort({ createdAt: -1 })
    .lean();
};

// =============================================
// ✅ متدهای استاتیک
// =============================================

// دریافت شرکت‌های یک کاربر
AccountSchema.statics.getByUser = function(userId, options = {}) {
  const { tier, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const filter = { owner: userId, isActive: true };
  if (tier) filter.tier = tier;

  return this.find(filter)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// دریافت آمار شرکت‌ها
AccountSchema.statics.getStats = function() {
  return Promise.all([
    this.countDocuments({ isActive: true }),
    this.countDocuments({ isActive: false }),
    this.aggregate([
      { $group: { _id: '$tier', count: { $sum: 1 } } },
    ]),
    this.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
  ]).then(([active, inactive, byTier, byType]) => ({
    active,
    inactive,
    total: active + inactive,
    byTier,
    byType,
  }));
};

module.exports = mongoose.models.Account || mongoose.model('Account', AccountSchema);
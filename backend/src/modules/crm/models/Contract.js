// backend/src/modules/crm/models/Contract.js
const mongoose = require('mongoose');

const ContractSchema = new mongoose.Schema(
  {
    // =============================================
    // اطلاعات پایه
    // =============================================
    contractNumber: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'نام قرارداد الزامی است'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },

    // =============================================
    // شرکت و فرصت مرتبط
    // =============================================
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'شرکت مرتبط الزامی است'],
    },
    opportunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      default: null,
    },

    // =============================================
    // ارزش و شرایط
    // =============================================
    value: {
      amount: { type: Number, default: 0, min: 0 },
      currency: { type: String, default: 'IRR' },
      paymentTerms: {
        type: String,
        enum: ['monthly', 'quarterly', 'yearly', 'one_time'],
        default: 'monthly',
      },
    },

    // =============================================
    // تاریخ‌ها
    // =============================================
    startDate: {
      type: Date,
      required: [true, 'تاریخ شروع الزامی است'],
    },
    endDate: {
      type: Date,
      required: [true, 'تاریخ پایان الزامی است'],
    },
    renewalDate: {
      type: Date,
      default: null,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },

    // =============================================
    // صورتحساب
    // =============================================
    billing: {
      method: {
        type: String,
        enum: ['invoice', 'auto_pay', 'manual'],
        default: 'invoice',
      },
      frequency: {
        type: String,
        enum: ['monthly', 'quarterly', 'yearly'],
        default: 'monthly',
      },
      dayOfMonth: {
        type: Number,
        default: 1,
        min: 1,
        max: 31,
      },
    },

    // =============================================
    // وضعیت
    // =============================================
    status: {
      type: String,
      enum: ['draft', 'active', 'expired', 'cancelled', 'completed'],
      default: 'draft',
    },

    // =============================================
    // مالک
    // =============================================
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // =============================================
    // پیوست‌ها
    // =============================================
    attachments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attachment',
    }],

    // =============================================
    // یادداشت‌ها
    // =============================================
    notes: {
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
ContractSchema.index({ contractNumber: 1 }, { unique: true });
ContractSchema.index({ account: 1 });
ContractSchema.index({ owner: 1, status: 1 });
ContractSchema.index({ status: 1, endDate: 1 });
ContractSchema.index({ renewalDate: 1 });

// =============================================
// ✅ میدلورها
// =============================================

// تولید شماره قرارداد
ContractSchema.pre('save', function(next) {
  if (this.isNew && !this.contractNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    this.contractNumber = `CTR-${year}${month}-${random}`;
  }
  next();
});

// =============================================
// ✅ متدهای نمونه
// =============================================

// فعال کردن قرارداد
ContractSchema.methods.activate = async function() {
  this.status = 'active';
  await this.save();
  return this;
};

// تمدید قرارداد
ContractSchema.methods.renew = async function(newEndDate) {
  if (this.status !== 'active' && this.status !== 'expired') {
    throw new Error('قرارداد قابل تمدید نیست');
  }
  this.endDate = newEndDate;
  this.renewalDate = null;
  this.status = 'active';
  await this.save();
  return this;
};

// لغو قرارداد
ContractSchema.methods.cancel = async function() {
  this.status = 'cancelled';
  await this.save();
  return this;
};

// تکمیل قرارداد
ContractSchema.methods.complete = async function() {
  this.status = 'completed';
  await this.save();
  return this;
};

// =============================================
// ✅ متدهای استاتیک
// =============================================

// دریافت قراردادهای در حال انقضا
ContractSchema.statics.getExpiringSoon = function(days = 30) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return this.find({
    status: 'active',
    endDate: { $lte: date },
  })
    .populate('account', 'name')
    .sort({ endDate: 1 })
    .lean();
};

// دریافت آمار قراردادها
ContractSchema.statics.getStats = function() {
  return Promise.all([
    this.countDocuments({ status: 'draft' }),
    this.countDocuments({ status: 'active' }),
    this.countDocuments({ status: 'expired' }),
    this.countDocuments({ status: 'cancelled' }),
    this.countDocuments({ status: 'completed' }),
    this.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, totalValue: { $sum: '$value.amount' } } },
    ]),
  ]).then(([draft, active, expired, cancelled, completed, value]) => ({
    draft,
    active,
    expired,
    cancelled,
    completed,
    total: draft + active + expired + cancelled + completed,
    totalValue: value[0]?.totalValue || 0,
  }));
};

module.exports = mongoose.models.Contract || mongoose.model('Contract', ContractSchema);
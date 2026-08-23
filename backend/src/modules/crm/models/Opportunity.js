// backend/src/modules/crm/models/Opportunity.js
const mongoose = require('mongoose');

const OpportunitySchema = new mongoose.Schema(
  {
    // =============================================
    // اطلاعات پایه
    // =============================================
    opportunityNumber: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'نام فرصت الزامی است'],
      trim: true,
    },

    // =============================================
    // شرکت و مخاطب مرتبط
    // =============================================
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'شرکت مرتبط الزامی است'],
    },
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      default: null,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },

    // =============================================
    // ارزش و مرحله
    // =============================================
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expectedRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    stage: {
      type: String,
      enum: ['discovery', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
      default: 'discovery',
    },
    probability: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // =============================================
    // تاریخ‌ها
    // =============================================
    closeDate: {
      type: Date,
      required: [true, 'تاریخ بسته شدن الزامی است'],
    },
    actualCloseDate: {
      type: Date,
      default: null,
    },

    // =============================================
    // نوع و منبع
    // =============================================
    type: {
      type: String,
      enum: ['new_business', 'renewal', 'upsell', 'cross_sell'],
      default: 'new_business',
    },
    leadSource: {
      type: String,
      default: '',
      trim: true,
    },

    // =============================================
    // محصولات
    // =============================================
    products: [{
      product: { type: String, trim: true },
      quantity: { type: Number, default: 1, min: 1 },
      price: { type: Number, default: 0, min: 0 },
      total: { type: Number, default: 0 },
    }],

    // =============================================
    // تاریخچه مرحله
    // =============================================
    stageHistory: [{
      stage: { type: String, required: true },
      date: { type: Date, default: Date.now },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      note: { type: String, default: '' },
    }],

    // =============================================
    // مالک
    // =============================================
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
OpportunitySchema.index({ opportunityNumber: 1 }, { unique: true });
OpportunitySchema.index({ account: 1 });
OpportunitySchema.index({ owner: 1, stage: 1 });
OpportunitySchema.index({ stage: 1, closeDate: 1 });
OpportunitySchema.index({ closeDate: 1 });

// =============================================
// ✅ میدلورها
// =============================================

// تولید شماره فرصت
OpportunitySchema.pre('save', function(next) {
  if (this.isNew && !this.opportunityNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    this.opportunityNumber = `OPP-${year}${month}-${random}`;
  }
  next();
});

// ثبت تاریخچه مرحله
OpportunitySchema.pre('save', function(next) {
  if (this.isModified('stage')) {
    this.stageHistory.push({
      stage: this.stage,
      date: new Date(),
      user: this.owner,
    });
  }
  next();
});

// =============================================
// ✅ متدهای نمونه
// =============================================

// تغییر مرحله
OpportunitySchema.methods.changeStage = async function(stage, note = '') {
  this.stage = stage;
  this.stageHistory.push({
    stage,
    date: new Date(),
    user: this.owner,
    note,
  });
  await this.save();
  return this;
};

// بستن فرصت (برنده/بازنده)
OpportunitySchema.methods.close = async function(stage, note = '') {
  if (stage !== 'closed_won' && stage !== 'closed_lost') {
    throw new Error('وضعیت باید closed_won یا closed_lost باشد');
  }
  this.stage = stage;
  this.actualCloseDate = new Date();
  this.stageHistory.push({
    stage,
    date: new Date(),
    user: this.owner,
    note,
  });
  await this.save();
  return this;
};

// =============================================
// ✅ متدهای استاتیک
// =============================================

// دریافت فرصت‌های یک کاربر
OpportunitySchema.statics.getByUser = function(userId, options = {}) {
  const { stage, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const filter = { owner: userId, isActive: true };
  if (stage) filter.stage = stage;

  return this.find(filter)
    .sort({ closeDate: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// دریافت آمار فرصت‌ها
OpportunitySchema.statics.getStats = function() {
  return Promise.all([
    this.countDocuments({ stage: 'discovery', isActive: true }),
    this.countDocuments({ stage: 'qualification', isActive: true }),
    this.countDocuments({ stage: 'proposal', isActive: true }),
    this.countDocuments({ stage: 'negotiation', isActive: true }),
    this.countDocuments({ stage: 'closed_won' }),
    this.countDocuments({ stage: 'closed_lost' }),
    this.aggregate([
      { $match: { stage: { $in: ['closed_won'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
    ]),
  ]).then(([discovery, qualification, proposal, negotiation, won, lost, revenue]) => ({
    discovery,
    qualification,
    proposal,
    negotiation,
    won,
    lost,
    total: discovery + qualification + proposal + negotiation + won + lost,
    totalRevenue: revenue[0]?.totalRevenue || 0,
  }));
};

module.exports = mongoose.models.Opportunity || mongoose.model('Opportunity', OpportunitySchema);
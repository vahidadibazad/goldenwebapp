// backend/src/modules/crm/models/Contact.js
const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema(
  {
    // =============================================
    // اطلاعات پایه
    // =============================================
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
    // اطلاعات شغلی
    // =============================================
    jobTitle: {
      type: String,
      default: '',
      trim: true,
    },
    department: {
      type: String,
      default: '',
      trim: true,
    },

    // =============================================
    // شرکت مرتبط
    // =============================================
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'شرکت مرتبط الزامی است'],
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
    reportsTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      default: null,
    },

    // =============================================
    // آدرس
    // =============================================
    mailingAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'IR' },
    },

    // =============================================
    // روش تماس ترجیحی
    // =============================================
    preferredContact: {
      type: String,
      enum: ['email', 'phone', 'mobile'],
      default: 'email',
    },

    // =============================================
    // مالک و تیم
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
ContactSchema.index({ account: 1 });
ContactSchema.index({ email: 1 });
ContactSchema.index({ owner: 1, isActive: 1 });
ContactSchema.index({ firstName: 1, lastName: 1 });
ContactSchema.index({ tags: 1 });

// =============================================
// ✅ متدهای استاتیک
// =============================================

// دریافت مخاطبین یک شرکت
ContactSchema.statics.getByAccount = function(accountId, options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  return this.find({ account: accountId, isActive: true })
    .sort({ firstName: 1, lastName: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// دریافت مخاطبین یک کاربر
ContactSchema.statics.getByUser = function(userId, options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  return this.find({ owner: userId, isActive: true })
    .sort({ firstName: 1, lastName: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

module.exports = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
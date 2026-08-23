// backend/src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema(
  {
    // =============================================
    // اطلاعات پایه
    // =============================================
    username: {
      type: String,
      required: [true, 'نام کاربری الزامی است'],
      unique: true,
      trim: true,
      minlength: [3, 'نام کاربری باید حداقل ۳ کاراکتر باشد'],
      maxlength: [30, 'نام کاربری نمی‌تواند بیشتر از ۳۰ کاراکتر باشد'],
    },
    email: {
      type: String,
      required: [true, 'ایمیل الزامی است'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'ایمیل معتبر وارد کنید'],
    },
    password: {
      type: String,
      required: [true, 'رمز عبور الزامی است'],
      minlength: [6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'],
      select: false,
    },
    fullName: {
      type: String,
      required: [true, 'نام کامل الزامی است'],
      trim: true,
      maxlength: [100, 'نام کامل نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد'],
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },

    // =============================================
    // نقش و مجوزها
    // =============================================
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      default: null,
    },
    extraPermissions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Permission',
    }],

    // =============================================
    // وضعیت کاربر
    // =============================================
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'pending'],
      default: 'pending',
    },

    // =============================================
    // پروفایل عمومی (برای کاربران CMS)
    // =============================================
    publicProfile: {
      bio: { type: String, default: '' },
      avatar: { type: String, default: '' },
      website: { type: String, default: '' },
      socialMedia: {
        facebook: { type: String, default: '' },
        twitter: { type: String, default: '' },
        instagram: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        telegram: { type: String, default: '' },
        youtube: { type: String, default: '' },
      },
    },

    // =============================================
    // تنظیمات کاربر
    // =============================================
    settings: {
      language: { type: String, enum: ['fa', 'en', 'ar'], default: 'fa' },
      timezone: { type: String, default: 'Asia/Tehran' },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
      privacy: {
        showEmail: { type: Boolean, default: false },
        showPhone: { type: Boolean, default: false },
        showOnline: { type: Boolean, default: true },
      },
    },

    // =============================================
    // آدرس‌ها (برای فروشگاه)
    // =============================================
    addresses: [{
      title: { type: String, required: true },
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'IR' },
      isDefault: { type: Boolean, default: false },
    }],

    // =============================================
    // دپارتمان (برای کارمندان)
    // =============================================
    department: {
      type: String,
      default: 'All',
    },

    // =============================================
    // جانشین‌ها (تفویض اختیار)
    // =============================================
    substitutes: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      startDate: { type: Date },
      endDate: { type: Date },
      isActive: { type: Boolean, default: true },
      permissions: [{
        type: String,
        enum: ['view', 'action', 'sign', 'approve', 'all'],
      }],
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now },
    }],

    // =============================================
    // امضا (برای کارمندان)
    // =============================================
    canSign: {
      type: Boolean,
      default: false,
    },
    signingLimit: {
      type: Number,
      default: 0,
    },

    // =============================================
    // تاریخچه فعالیت
    // =============================================
    lastLogin: { type: Date, default: null },
    lastActivity: { type: Date, default: null },
    loginCount: { type: Number, default: 0 },

    // =============================================
    // تأیید ایمیل
    // =============================================
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: '',
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },

    // =============================================
    // بازنشانی رمز عبور
    // =============================================
    resetPasswordToken: {
      type: String,
      default: '',
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    // =============================================
    // تاریخ عضویت
    // =============================================
    registeredAt: {
      type: Date,
      default: Date.now,
    },

    // =============================================
    // متادیتا
    // =============================================
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ isActive: 1, status: 1 });
UserSchema.index({ lastLogin: -1 });

// ایندکس Full-Text
UserSchema.index(
  {
    username: 'text',
    fullName: 'text',
    email: 'text',
  },
  {
    weights: {
      username: 10,
      fullName: 8,
      email: 5,
    },
    name: 'user_fulltext_index',
    default_language: 'none',
  }
);

// =============================================
// ✅ میدلورها
// =============================================

// هش کردن رمز عبور قبل از ذخیره
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// =============================================
// ✅ متدهای نمونه (Instance Methods)
// =============================================

// مقایسه رمز عبور
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ثبت آخرین فعالیت
UserSchema.methods.updateActivity = async function() {
  this.lastActivity = new Date();
  this.loginCount += 1;
  await this.save();
  return this;
};

// ثبت آخرین ورود
UserSchema.methods.updateLogin = async function() {
  this.lastLogin = new Date();
  this.lastActivity = new Date();
  this.loginCount += 1;
  await this.save();
  return this;
};

// تأیید ایمیل
UserSchema.methods.verifyEmail = async function() {
  this.isEmailVerified = true;
  this.emailVerificationToken = '';
  this.emailVerificationExpires = null;
  this.status = 'active';
  await this.save();
  return this;
};

// تولید توکن تأیید ایمیل
UserSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = token;
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // ۲۴ ساعت
  return token;
};

// تولید توکن بازنشانی رمز عبور
UserSchema.methods.generateResetPasswordToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = token;
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // ۱ ساعت
  return token;
};

// بررسی اعتبار توکن تأیید ایمیل
UserSchema.methods.isEmailVerificationTokenValid = function(token) {
  return (
    this.emailVerificationToken === token &&
    this.emailVerificationExpires &&
    this.emailVerificationExpires > new Date()
  );
};

// بررسی اعتبار توکن بازنشانی رمز عبور
UserSchema.methods.isResetPasswordTokenValid = function(token) {
  return (
    this.resetPasswordToken === token &&
    this.resetPasswordExpires &&
    this.resetPasswordExpires > new Date()
  );
};

// دریافت نقش کاربر
UserSchema.methods.getRole = async function() {
  if (!this.role) return null;
  const Role = mongoose.model('Role');
  return Role.findById(this.role).populate('permissions');
};

// بررسی مجوز خاص
UserSchema.methods.hasPermission = async function(permissionName) {
  // ادمین دسترسی کامل دارد
  const role = await this.getRole();
  if (role?.name === 'admin') return true;

  // بررسی مجوزهای استثنا
  if (this.extraPermissions && this.extraPermissions.length > 0) {
    const Permission = mongoose.model('Permission');
    const extraPerms = await Permission.find({
      _id: { $in: this.extraPermissions },
      name: permissionName,
    });
    if (extraPerms.length > 0) return true;
  }

  // بررسی مجوزهای نقش
  if (role && role.permissions) {
    return role.permissions.some(p => p.name === permissionName);
  }

  return false;
};

// =============================================
// ✅ متدهای استاتیک (Static Methods)
// =============================================

// دریافت کاربر با نقش
UserSchema.statics.getWithRole = function(id) {
  return this.findById(id)
    .populate('role', 'name label')
    .populate('extraPermissions', 'name label');
};

// دریافت کاربران فعال
UserSchema.statics.getActive = function() {
  return this.find({ isActive: true, status: 'active' })
    .populate('role', 'name label')
    .sort({ fullName: 1 });
};

// دریافت کاربران بر اساس نقش
UserSchema.statics.getByRole = function(roleName) {
  return this.find({ isActive: true })
    .populate({
      path: 'role',
      match: { name: roleName },
    })
    .then(users => users.filter(u => u.role));
};

// جستجوی کاربران
UserSchema.statics.search = function(query, options = {}) {
  const { limit = 20, page = 1, role, isActive } = options;
  const skip = (page - 1) * limit;

  const filter = {};
  if (query) {
    filter.$text = { $search: query };
  }
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive;

  return this.find(filter)
    .populate('role', 'name label')
    .sort({ fullName: 1 })
    .skip(skip)
    .limit(limit);
};

// دریافت آمار کاربران
UserSchema.statics.getStats = function() {
  return Promise.all([
    this.countDocuments({ isActive: true, status: 'active' }),
    this.countDocuments({ isActive: false }),
    this.countDocuments({ status: 'pending' }),
    this.countDocuments({ status: 'suspended' }),
    this.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $lookup: { from: 'roles', localField: '_id', foreignField: '_id', as: 'roleInfo' } },
      { $unwind: { path: '$roleInfo', preserveNullAndEmptyArrays: true } },
      { $project: { role: '$roleInfo.name', count: 1 } },
    ]),
  ]).then(([active, inactive, pending, suspended, byRole]) => ({
    active,
    inactive,
    pending,
    suspended,
    total: active + inactive + pending + suspended,
    byRole,
  }));
};

// =============================================
// ✅ مدل نهایی
// =============================================
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
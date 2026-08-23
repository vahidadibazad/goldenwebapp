const mongoose = require('mongoose');

// =============================================
// زیرمجموعه: اطلاعات OTP
// =============================================
const OTPSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  verifiedAt: {
    type: Date,
    default: null,
  },
  method: {
    type: String,
    enum: ['sms', 'email', 'both'],
    default: 'sms',
  },
  attempts: {
    type: Number,
    default: 0,
  },
  maxAttempts: {
    type: Number,
    default: 3,
  },
}, { _id: false });

// =============================================
// زیرمجموعه: اطلاعات امضای تصویری
// =============================================
const ImageSignatureSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    default: '',
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  ipAddress: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
  deviceInfo: {
    type: String,
    default: '',
  },
}, { _id: false });

// =============================================
// مدل اصلی Signature
// =============================================
const SignatureSchema = new mongoose.Schema({
  // =============================================
  // اطلاعات پایه
  // =============================================
  
  // کاربر امضاکننده
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // هدف امضا (نامه، درخواست، و غیره)
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType',
  },
  
  // نوع هدف
  targetType: {
    type: String,
    enum: ['Document', 'LeaveRequest', 'MissionRequest', 'PurchaseRequest', 'Contract'],
    required: true,
  },
  
  // مرحله گردش کار مرتبط (اختیاری)
  workflowStepId: {
    type: String,
    default: '',
  },
  
  // =============================================
  // اطلاعات امضا
  // =============================================
  
  // نوع امضا
  type: {
    type: String,
    enum: ['otp', 'image', 'both'],
    default: 'both',
  },
  
  // وضعیت امضا
  status: {
    type: String,
    enum: ['pending', 'otp_sent', 'otp_verified', 'image_uploaded', 'completed', 'rejected'],
    default: 'pending',
  },
  
  // اطلاعات OTP
  otp: OTPSchema,
  
  // اطلاعات امضای تصویری
  image: ImageSignatureSchema,
  
  // =============================================
  // اطلاعات تکمیل
  // =============================================
  
  // تاریخ امضا
  signedAt: {
    type: Date,
    default: null,
  },
  
  // IP کاربر
  ipAddress: {
    type: String,
    default: '',
  },
  
  // User Agent
  userAgent: {
    type: String,
    default: '',
  },
  
  // =============================================
  // اطلاعات اضافی
  // =============================================
  
  // توضیحات
  description: {
    type: String,
    default: '',
  },
  
  // امضای والد (برای امضای مجدد)
  parentSignature: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Signature',
    default: null,
  },
  
  // ترتیب امضا
  order: {
    type: Number,
    default: 0,
  },
  
}, { timestamps: true });

// =============================================
// ✅ ایندکس‌ها
// =============================================
SignatureSchema.index({ user: 1, targetId: 1, targetType: 1 });
SignatureSchema.index({ targetId: 1, targetType: 1, status: 1 });
SignatureSchema.index({ 'otp.code': 1 });
SignatureSchema.index({ status: 1, signedAt: -1 });
SignatureSchema.index({ user: 1, status: 1 });

// =============================================
// ✅ متدهای نمونه (Instance Methods)
// =============================================

// شروع فرآیند امضا
SignatureSchema.methods.startSignature = async function(userId) {
  if (this.status !== 'pending') {
    throw new Error('این امضا قبلاً شروع شده است');
  }
  
  this.user = userId;
  this.status = 'otp_sent';
  
  // تولید OTP
  const otpCode = this.generateOTP();
  this.otp = {
    code: otpCode,
    sentAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // ۵ دقیقه
    method: 'sms',
    attempts: 0,
    maxAttempts: 3,
  };
  
  await this.save();
  
  // ارسال OTP (اینجا باید سرویس پیامک متصل شود)
  // await sendSMS(user.phoneNumber, `کد امضای شما: ${otpCode}`);
  
  return this;
};

// تایید OTP
SignatureSchema.methods.verifyOTP = async function(code) {
  if (this.status !== 'otp_sent' && this.status !== 'otp_verified') {
    throw new Error('OTP قابل تایید نیست');
  }
  
  if (!this.otp || this.otp.expiresAt < new Date()) {
    throw new Error('کد OTP منقضی شده است');
  }
  
  this.otp.attempts += 1;
  
  if (this.otp.attempts > this.otp.maxAttempts) {
    this.status = 'rejected';
    await this.save();
    throw new Error('تعداد تلاش‌های ناموفق بیش از حد مجاز است');
  }
  
  if (this.otp.code !== code) {
    await this.save();
    throw new Error('کد OTP اشتباه است');
  }
  
  this.otp.verifiedAt = new Date();
  this.status = 'otp_verified';
  
  // اگر فقط OTP نیاز است، امضا کامل می‌شود
  if (this.type === 'otp') {
    this.status = 'completed';
    this.signedAt = new Date();
  }
  
  await this.save();
  return this;
};

// آپلود امضای تصویری
SignatureSchema.methods.uploadImage = async function(imageUrl, metadata = {}) {
  if (this.status === 'completed' || this.status === 'rejected') {
    throw new Error('امضا قبلاً تکمیل یا رد شده است');
  }
  
  this.image = {
    url: imageUrl,
    thumbnail: metadata.thumbnail || '',
    uploadedAt: new Date(),
    ipAddress: metadata.ipAddress || '',
    userAgent: metadata.userAgent || '',
    deviceInfo: metadata.deviceInfo || '',
  };
  
  this.status = 'image_uploaded';
  
  // اگر هر دو نوع امضا نیاز است و OTP قبلاً تایید شده
  if (this.type === 'both' && this.otp?.verifiedAt) {
    this.status = 'completed';
    this.signedAt = new Date();
  }
  
  await this.save();
  return this;
};

// تکمیل امضا (برای زمانی که هر دو روش انجام شده)
SignatureSchema.methods.complete = async function() {
  if (this.status === 'completed') {
    throw new Error('امضا قبلاً تکمیل شده است');
  }
  
  this.status = 'completed';
  this.signedAt = new Date();
  
  await this.save();
  return this;
};

// رد امضا
SignatureSchema.methods.reject = async function(reason = '') {
  this.status = 'rejected';
  this.description = reason;
  await this.save();
  return this;
};

// تولید کد OTP
SignatureSchema.methods.generateOTP = function() {
  return String(Math.floor(100000 + Math.random() * 900000));
};

// بررسی اعتبار امضا
SignatureSchema.methods.isValid = function() {
  return this.status === 'completed';
};

// =============================================
// ✅ استاتیک‌ها (Static Methods)
// =============================================

// دریافت امضاهای یک هدف
SignatureSchema.statics.getByTarget = function(targetId, targetType) {
  return this.find({ targetId, targetType })
    .populate('user', 'fullName username email phoneNumber')
    .sort({ order: 1, createdAt: 1 });
};

// دریافت امضاهای در انتظار برای یک کاربر
SignatureSchema.statics.getPendingForUser = function(userId) {
  return this.find({
    user: userId,
    status: { $in: ['pending', 'otp_sent', 'otp_verified', 'image_uploaded'] },
  })
  .populate('targetId')
  .sort({ createdAt: -1 });
};

// دریافت امضاهای تکمیل شده یک کاربر
SignatureSchema.statics.getCompletedForUser = function(userId) {
  return this.find({
    user: userId,
    status: 'completed',
  })
  .populate('targetId')
  .sort({ signedAt: -1 })
  .limit(50);
};

// دریافت آمار امضاها
SignatureSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);
  
  const result = {
    pending: 0,
    otp_sent: 0,
    otp_verified: 0,
    image_uploaded: 0,
    completed: 0,
    rejected: 0,
    total: 0,
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  return result;
};

// بررسی اینکه آیا یک کاربر قبلاً امضا کرده است
SignatureSchema.statics.hasSigned = async function(targetId, targetType, userId) {
  const signature = await this.findOne({
    targetId,
    targetType,
    user: userId,
    status: 'completed',
  });
  return !!signature;
};

// دریافت امضاهای معتبر یک هدف
SignatureSchema.statics.getValidSignatures = function(targetId, targetType) {
  return this.find({
    targetId,
    targetType,
    status: 'completed',
  })
  .populate('user', 'fullName username position')
  .sort({ order: 1, signedAt: 1 });
};

// =============================================
// ✅ میدلور (Middleware)
// =============================================

// قبل از ذخیره، اعتبارسنجی
SignatureSchema.pre('save', function(next) {
  // اگر امضا کامل شده، زمان امضا ثبت شود
  if (this.status === 'completed' && !this.signedAt) {
    this.signedAt = new Date();
  }
  next();
});

// =============================================
// ✅ مدل نهایی
// =============================================
module.exports = mongoose.models.Signature || mongoose.model('Signature', SignatureSchema);
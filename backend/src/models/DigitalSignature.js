// backend/src/models/DigitalSignature.js
const mongoose = require('mongoose');

const DigitalSignatureSchema = new mongoose.Schema(
  {
    // =============================================
    // نامه مرتبط
    // =============================================
    letter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Letter',
      required: true,
    },

    // =============================================
    // امضاکننده
    // =============================================
    signer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // =============================================
    // اطلاعات گواهی دیجیتال (PKI)
    // =============================================
    certificate: {
      serialNumber: { type: String, default: '' },
      issuer: { type: String, default: '' },
      subject: { type: String, default: '' },
      validFrom: { type: Date, default: null },
      validTo: { type: Date, default: null },
      publicKey: { type: String, default: '' },
    },

    // =============================================
    // امضای دیجیتال (PKCS#7 / CMS)
    // =============================================
    digitalSignature: {
      type: String,
      default: '',
    },
    
    // هش سند (برای تأیید یکپارچگی)
    documentHash: {
      type: String,
      default: '',
    },

    // =============================================
    // امضای تصویری (برای نمایش)
    // =============================================
    imageSignature: {
      url: { type: String, default: '' },
      thumbnail: { type: String, default: '' },
      uploadedAt: { type: Date, default: null },
    },

    // =============================================
    // موقعیت امضا در سند
    // =============================================
    position: {
      page: { type: Number, default: 1 },
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      width: { type: Number, default: 150 },
      height: { type: Number, default: 50 },
    },

    // =============================================
    // تأییدیه‌ها
    // =============================================
    verification: {
      status: {
        type: String,
        enum: ['pending', 'verified', 'failed', 'expired'],
        default: 'pending',
      },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      verifiedAt: { type: Date, default: null },
      verificationCode: { type: String, default: '' },
      errors: [{ type: String }],
    },

    // =============================================
    // تاریخ‌ها
    // =============================================
    signedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },

    // =============================================
    // اطلاعات فنی
    // =============================================
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    location: { type: String, default: '' },

    // =============================================
    // وضعیت
    // =============================================
    status: {
      type: String,
      enum: ['pending', 'otp_sent', 'otp_verified', 'signed', 'verified', 'rejected', 'expired'],
      default: 'pending',
    },

    // =============================================
    // OTP
    // =============================================
    otp: {
      code: { type: String, default: '' },
      sentAt: { type: Date, default: null },
      expiresAt: { type: Date, default: null },
      verifiedAt: { type: Date, default: null },
      attempts: { type: Number, default: 0 },
      maxAttempts: { type: Number, default: 3 },
    },

    // =============================================
    // امضای والد (برای زنجیره امضا)
    // =============================================
    parentSignature: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DigitalSignature',
      default: null,
    },

    // =============================================
    // متادیتا
    // =============================================
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

  },
  { timestamps: true }
);

// =============================================
// ✅ ایندکس‌ها
// =============================================
DigitalSignatureSchema.index({ letter: 1, signer: 1 });
DigitalSignatureSchema.index({ status: 1, signedAt: -1 });
DigitalSignatureSchema.index({ 'verification.verificationCode': 1 });
DigitalSignatureSchema.index({ 'certificate.serialNumber': 1 });

// =============================================
// ✅ متدهای نمونه
// =============================================

// تأیید امضا (با بررسی گواهی)
DigitalSignatureSchema.methods.verify = async function(userId) {
  // ۱. بررسی اعتبار گواهی
  if (this.certificate.validTo && new Date(this.certificate.validTo) < new Date()) {
    this.verification.status = 'expired';
    this.verification.errors.push('گواهی دیجیتال منقضی شده است');
    await this.save();
    return { valid: false, error: 'گواهی منقضی شده است' };
  }

  // ۲. بررسی یکپارچگی (تطابق هش)
  // اینجا باید هش فعلی سند با هش ذخیره‌شده مقایسه شود
  // const currentHash = generateHash(document);
  // if (currentHash !== this.documentHash) { ... }

  // ۳. تأیید امضای دیجیتال
  // const isValid = verifyDigitalSignature(this.digitalSignature, this.certificate.publicKey);

  // ۴. ثبت تأیید
  this.verification.status = 'verified';
  this.verification.verifiedBy = userId;
  this.verification.verifiedAt = new Date();
  this.verification.verificationCode = this._generateVerificationCode();
  this.status = 'verified';

  await this.save();
  return { valid: true, message: 'امضا با موفقیت تأیید شد' };
};

// تولید کد تأیید
DigitalSignatureSchema.methods._generateVerificationCode = function() {
  return `VER-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
};

// بررسی اعتبار امضا
DigitalSignatureSchema.methods.isValid = function() {
  if (this.status !== 'verified' && this.status !== 'signed') return false;
  if (this.expiresAt && new Date(this.expiresAt) < new Date()) return false;
  if (this.certificate.validTo && new Date(this.certificate.validTo) < new Date()) return false;
  return true;
};

// تولید OTP
DigitalSignatureSchema.methods.generateOTP = function() {
  return String(Math.floor(100000 + Math.random() * 900000));
};

// ارسال OTP
DigitalSignatureSchema.methods.sendOTP = async function() {
  const otpCode = this.generateOTP();
  this.otp = {
    code: otpCode,
    sentAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // ۵ دقیقه
    attempts: 0,
    maxAttempts: 3,
  };
  this.status = 'otp_sent';
  await this.save();
  
  // ارسال OTP از طریق SMS یا Email
  // await sendSMS(user.phoneNumber, `کد امضای شما: ${otpCode}`);
  
  return otpCode;
};

// تایید OTP
DigitalSignatureSchema.methods.verifyOTP = async function(code) {
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
  await this.save();
  
  return this;
};

// =============================================
// ✅ استاتیک‌ها
// =============================================

// دریافت امضاهای یک نامه
DigitalSignatureSchema.statics.getByLetter = function(letterId) {
  return this.find({ letter: letterId })
    .populate('signer', 'fullName username position')
    .populate('verification.verifiedBy', 'fullName username')
    .sort({ signedAt: 1 });
};

// دریافت امضاهای معتبر یک نامه
DigitalSignatureSchema.statics.getValidSignatures = function(letterId) {
  const now = new Date();
  return this.find({
    letter: letterId,
    status: { $in: ['verified', 'signed'] },
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: now } },
    ],
    'certificate.validTo': { $or: [{ $exists: false }, { $gt: now }] },
  }).populate('signer', 'fullName username position');
};

// دریافت امضاهای در انتظار برای یک کاربر
DigitalSignatureSchema.statics.getPendingForUser = function(userId) {
  return this.find({
    signer: userId,
    status: { $in: ['pending', 'otp_sent', 'otp_verified'] },
  })
    .populate('letter', 'subject number')
    .sort({ createdAt: 1 });
};

module.exports = mongoose.models.DigitalSignature || mongoose.model('DigitalSignature', DigitalSignatureSchema);
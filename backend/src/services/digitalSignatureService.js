// backend/src/services/digitalSignatureService.js
const crypto = require('crypto');
const DigitalSignature = require('../models/DigitalSignature');
const Letter = require('../models/Letter');
const Notification = require('../models/Notification');
const { sendNotification } = require('../socket');

/**
 * سرویس امضای دیجیتال مبتنی بر PKI
 */
class DigitalSignatureService {

  // =============================================
  // ۱. ایجاد درخواست امضا
  // =============================================
  static async createSignatureRequest(letterId, signerId, requesterId, options = {}) {
    const letter = await Letter.findById(letterId);
    if (!letter) throw new Error('نامه یافت نشد');

    // بررسی وضعیت نامه
    if (letter.status !== 'approved') {
      throw new Error('نامه باید ابتدا تأیید شده باشد');
    }

    // بررسی تکراری نبودن درخواست
    const existing = await DigitalSignature.findOne({
      letter: letterId,
      signer: signerId,
      status: { $nin: ['rejected', 'expired'] },
    });

    if (existing) {
      throw new Error('درخواست امضا برای این کاربر قبلاً ثبت شده است');
    }

    // ایجاد امضا
    const signature = new DigitalSignature({
      letter: letterId,
      signer: signerId,
      status: 'pending',
      expiresAt: options.expiresAt || this.calculateExpiryDate(7), // ۷ روز
      metadata: {
        requestedBy: requesterId,
        requestedAt: new Date(),
        message: options.message || '',
      },
    });

    // ذخیره هش سند (برای تأیید یکپارچگی)
    if (options.documentContent) {
      signature.documentHash = this.generateHash(options.documentContent);
    }

    await signature.save();

    // اعلان به امضاکننده
    await this.sendNotification(signerId, {
      title: 'درخواست امضای دیجیتال',
      message: `نامه "${letter.subject}" نیاز به امضای شما دارد`,
      link: `/signatures/${signature._id}`,
    });

    return signature;
  }

  // =============================================
  // ۲. شروع فرآیند امضا (ارسال OTP)
  // =============================================
  static async startSignature(signatureId, userId) {
    const signature = await DigitalSignature.findById(signatureId);
    if (!signature) throw new Error('امضا یافت نشد');

    // بررسی دسترسی
    if (signature.signer.toString() !== userId) {
      throw new Error('شما مجاز به امضای این نامه نیستید');
    }

    if (signature.status !== 'pending') {
      throw new Error('امضا قابل شروع نیست');
    }

    // ارسال OTP
    await signature.sendOTP();

    return signature;
  }

  // =============================================
  // ۳. تأیید OTP
  // =============================================
  static async verifyOTP(signatureId, userId, code) {
    const signature = await DigitalSignature.findById(signatureId);
    if (!signature) throw new Error('امضا یافت نشد');

    if (signature.signer.toString() !== userId) {
      throw new Error('شما مجاز به این عملیات نیستید');
    }

    await signature.verifyOTP(code);

    return signature;
  }

  // =============================================
  // ۴. امضای دیجیتال (با گواهی PKI)
  // =============================================
  static async sign(signatureId, userId, signatureData) {
    const signature = await DigitalSignature.findById(signatureId);
    if (!signature) throw new Error('امضا یافت نشد');

    if (signature.signer.toString() !== userId) {
      throw new Error('شما مجاز به امضای این نامه نیستید');
    }

    // بررسی OTP
    if (signature.status !== 'otp_verified') {
      throw new Error('ابتدا OTP را تأیید کنید');
    }

    // =============================================
    // امضای دیجیتال با PKI
    // =============================================
    
    // ۱. دریافت گواهی کاربر
    // const certificate = await this.getUserCertificate(userId);
    
    // ۲. امضای دیجیتال
    // const digitalSignature = await this.createDigitalSignature(
    //   signature.documentHash,
    //   certificate.privateKey
    // );

    // ۳. ذخیره امضا
    // signature.digitalSignature = digitalSignature;
    // signature.certificate = {
    //   serialNumber: certificate.serialNumber,
    //   issuer: certificate.issuer,
    //   subject: certificate.subject,
    //   validFrom: certificate.validFrom,
    //   validTo: certificate.validTo,
    //   publicKey: certificate.publicKey,
    // };

    // امضای تصویری (اختیاری)
    if (signatureData.imageUrl) {
      signature.imageSignature = {
        url: signatureData.imageUrl,
        thumbnail: signatureData.thumbnail || '',
        uploadedAt: new Date(),
      };
    }

    // موقعیت امضا
    if (signatureData.position) {
      signature.position = signatureData.position;
    }

    signature.signedAt = new Date();
    signature.status = 'signed';
    signature.ipAddress = signatureData.ipAddress || '';
    signature.userAgent = signatureData.userAgent || '';

    await signature.save();

    // به‌روزرسانی نامه
    const letter = await Letter.findById(signature.letter);
    if (letter) {
      if (!letter.signatures) letter.signatures = [];
      letter.signatures.push(signature._id);
      
      // بررسی اینکه آیا همه امضاها تکمیل شده است
      const allSignatures = await DigitalSignature.find({
        letter: letter._id,
        status: { $in: ['signed', 'verified'] },
      });
      
      // اگر تعداد امضاهای مورد نیاز تکمیل شد
      // (منطق تعداد امضاهای مورد نیاز را از تنظیمات بگیرید)
      // if (allSignatures.length >= requiredCount) {
      //   letter.status = 'signed';
      //   letter.isSigned = true;
      //   letter.signedAt = new Date();
      // }
      
      await letter.save();
    }

    // اعلان به درخواست‌دهنده
    const requesterId = signature.metadata?.requestedBy;
    if (requesterId) {
      await this.sendNotification(requesterId, {
        title: 'امضا تکمیل شد',
        message: `نامه "${letter?.subject}" توسط ${userId} امضا شد`,
        link: `/letters/${letter?._id}`,
      });
    }

    return signature;
  }

  // =============================================
  // ۵. تأیید امضا (Verify)
  // =============================================
  static async verifySignature(signatureId, userId) {
    const signature = await DigitalSignature.findById(signatureId);
    if (!signature) throw new Error('امضا یافت نشد');

    const result = await signature.verify(userId);

    return { signature, result };
  }

  // =============================================
  // ۶. رد امضا
  // =============================================
  static async rejectSignature(signatureId, userId, reason = '') {
    const signature = await DigitalSignature.findById(signatureId);
    if (!signature) throw new Error('امضا یافت نشد');

    if (signature.signer.toString() !== userId) {
      throw new Error('شما مجاز به رد این امضا نیستید');
    }

    signature.status = 'rejected';
    signature.metadata.rejectedAt = new Date();
    signature.metadata.rejectReason = reason;
    await signature.save();

    // اعلان به درخواست‌دهنده
    const requesterId = signature.metadata?.requestedBy;
    if (requesterId) {
      await this.sendNotification(requesterId, {
        title: 'امضا رد شد',
        message: `امضای نامه توسط ${userId} رد شد`,
        link: `/letters/${signature.letter}`,
      });
    }

    return signature;
  }

  // =============================================
  // ۷. دریافت وضعیت امضا
  // =============================================
  static async getSignatureStatus(signatureId) {
    const signature = await DigitalSignature.findById(signatureId)
      .populate('signer', 'fullName username')
      .populate('letter', 'subject number');

    if (!signature) throw new Error('امضا یافت نشد');

    return {
      id: signature._id,
      letter: signature.letter,
      signer: signature.signer,
      status: signature.status,
      statusLabel: this.getStatusLabel(signature.status),
      signedAt: signature.signedAt,
      expiresAt: signature.expiresAt,
      isValid: signature.isValid(),
      verification: signature.verification,
      imageSignature: signature.imageSignature,
      position: signature.position,
    };
  }

  // =============================================
  // ۸. دریافت تاریخچه امضاهای یک نامه
  // =============================================
  static async getLetterSignatures(letterId) {
    const signatures = await DigitalSignature.getByLetter(letterId);
    
    return signatures.map(s => ({
      id: s._id,
      signer: s.signer,
      status: s.status,
      statusLabel: this.getStatusLabel(s.status),
      signedAt: s.signedAt,
      isValid: s.isValid(),
      imageSignature: s.imageSignature,
    }));
  }

  // =============================================
  // ۹. دریافت امضاهای معتبر یک نامه
  // =============================================
  static async getValidSignatures(letterId) {
    return DigitalSignature.getValidSignatures(letterId);
  }

  // =============================================
  // ۱۰. دریافت امضاهای در انتظار کاربر
  // =============================================
  static async getPendingSignatures(userId) {
    return DigitalSignature.getPendingForUser(userId);
  }

  // =============================================
  // توابع کمکی
  // =============================================

  static generateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  static calculateExpiryDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  static getStatusLabel(status) {
    const map = {
      pending: 'در انتظار',
      otp_sent: 'OTP ارسال شد',
      otp_verified: 'OTP تأیید شد',
      signed: 'امضا شده',
      verified: 'تأیید شده',
      rejected: 'رد شده',
      expired: 'منقضی شده',
    };
    return map[status] || status;
  }

  static async sendNotification(userId, data) {
    try {
      await Notification.create({
        user: userId,
        type: 'signature',
        title: data.title,
        message: data.message,
        link: data.link,
        isRead: false,
      });
      
      sendNotification(userId, {
        type: 'signature',
        title: data.title,
        message: data.message,
        link: data.link,
      });
    } catch (error) {
      console.error('❌ خطا در ارسال اعلان:', error);
    }
  }
}

module.exports = DigitalSignatureService;
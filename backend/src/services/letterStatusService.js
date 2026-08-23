// backend/src/services/letterStatusService.js
const Letter = require('../models/Letter');
const Referral = require('../models/Referral');
const Memo = require('../models/Memo');
const Notification = require('../models/Notification');
const { sendNotification } = require('../socket');

/**
 * سرویس مدیریت چرخه حیات نامه‌ها
 * شامل: ثبت، پاراف، تأیید، امضا، بایگانی
 */
class LetterStatusService {
  
  // =============================================
  // ۱. ثبت نامه (از پیش‌نویس به ثبت شده)
  // =============================================
  static async register(letterId, userId, comment = '') {
    const letter = await Letter.findById(letterId);
    if (!letter) throw new Error('نامه یافت نشد');
    
    if (letter.status !== 'draft') {
      throw new Error('فقط نامه‌های در وضعیت پیش‌نویس قابل ثبت هستند');
    }

    // تولید شماره نامه
    const number = await this.generateLetterNumber(letter);
    letter.number = number;
    
    // تغییر وضعیت
    letter.status = 'registered';
    letter.receiveDate = new Date();
    await letter.addTracking('registered', userId, comment || 'نامه ثبت شد');
    await letter.save();

    // ارسال اعلان به گیرنده (اگر مشخص شده باشد)
    if (letter.receiver) {
      await this.sendNotification(letter.receiver, {
        title: 'نامه جدید',
        message: `نامه "${letter.subject}" برای شما ثبت شد`,
        link: `/letters/${letter._id}`,
      });
    }

    return letter;
  }

  // =============================================
  // ۲. ارسال برای پاراف (از ثبت شده به در جریان بررسی)
  // =============================================
  static async sendForReview(letterId, userId, reviewerId, comment = '') {
    const letter = await Letter.findById(letterId);
    if (!letter) throw new Error('نامه یافت نشد');

    if (letter.status !== 'registered') {
      throw new Error('فقط نامه‌های ثبت شده قابل ارسال برای پاراف هستند');
    }

    // ایجاد ارجاع از نوع پاراف
    const Referral = require('../models/Referral');
    const referral = await Referral.create({
      letter: letterId,
      from: userId,
      to: reviewerId,
      type: 'review',
      message: comment || 'درخواست پاراف',
      priority: letter.priority,
      dueDate: this.calculateDueDate(3), // ۳ روز برای پاراف
    });

    // به‌روزرسانی نامه
    letter.status = 'in_review';
    letter.currentStep = 'review';
    if (!letter.referrals) letter.referrals = [];
    letter.referrals.push(referral._id);
    
    await letter.addTracking('in_review', userId, comment || 'ارسال برای پاراف');
    await letter.save();

    // اعلان به پاراف‌کننده
    await this.sendNotification(reviewerId, {
      title: 'درخواست پاراف',
      message: `نامه "${letter.subject}" برای پاراف به شما ارسال شد`,
      link: `/letters/${letter._id}`,
    });

    return { letter, referral };
  }

  // =============================================
  // ۳. تأیید پاراف
  // =============================================
  static async approveReview(letterId, userId, comment = '') {
    const letter = await Letter.findById(letterId);
    if (!letter) throw new Error('نامه یافت نشد');

    if (letter.status !== 'in_review') {
      throw new Error('نامه در وضعیت پاراف نیست');
    }

    // یافتن ارجاع در انتظار
    const Referral = require('../models/Referral');
    const referral = await Referral.findOne({
      letter: letterId,
      to: userId,
      status: 'pending',
      type: 'review',
    });

    if (!referral) {
      throw new Error('شما درخواست پاراف فعالی برای این نامه ندارید');
    }

    // ثبت اقدام
    await referral.action(userId, comment);

    // تغییر وضعیت نامه
    letter.status = 'approved';
    await letter.addTracking('approved', userId, comment || 'پاراف تأیید شد');
    await letter.save();

    // اعلان به فرستنده
    await this.sendNotification(letter.registeredBy, {
      title: 'پاراف تأیید شد',
      message: `نامه "${letter.subject}" توسط ${userId} تأیید شد`,
      link: `/letters/${letter._id}`,
    });

    return { letter, referral };
  }

  // =============================================
  // ۴. رد پاراف
  // =============================================
  static async rejectReview(letterId, userId, comment = '') {
    const letter = await Letter.findById(letterId);
    if (!letter) throw new Error('نامه یافت نشد');

    if (letter.status !== 'in_review') {
      throw new Error('نامه در وضعیت پاراف نیست');
    }

    const Referral = require('../models/Referral');
    const referral = await Referral.findOne({
      letter: letterId,
      to: userId,
      status: 'pending',
      type: 'review',
    });

    if (!referral) {
      throw new Error('شما درخواست پاراف فعالی برای این نامه ندارید');
    }

    // ثبت رد
    referral.status = 'rejected';
    referral.comment = comment;
    referral.actionedAt = new Date();
    referral.history.push({
      status: 'rejected',
      user: userId,
      comment: comment || 'پاراف رد شد',
      timestamp: new Date(),
    });
    await referral.save();

    // تغییر وضعیت نامه
    letter.status = 'rejected';
    await letter.addTracking('rejected', userId, comment || 'پاراف رد شد');
    await letter.save();

    // اعلان به فرستنده
    await this.sendNotification(letter.registeredBy, {
      title: 'پاراف رد شد',
      message: `نامه "${letter.subject}" توسط ${userId} رد شد`,
      link: `/letters/${letter._id}`,
    });

    return { letter, referral };
  }

  // =============================================
  // ۵. ارسال برای امضا
  // =============================================
  static async sendForSign(letterId, userId, signerId, comment = '') {
    const letter = await Letter.findById(letterId);
    if (!letter) throw new Error('نامه یافت نشد');

    if (letter.status !== 'approved') {
      throw new Error('نامه باید ابتدا تأیید شود');
    }

    // ایجاد ارجاع از نوع امضا
    const Referral = require('../models/Referral');
    const referral = await Referral.create({
      letter: letterId,
      from: userId,
      to: signerId,
      type: 'sign',
      message: comment || 'درخواست امضا',
      priority: letter.priority,
      dueDate: this.calculateDueDate(2), // ۲ روز برای امضا
    });

    // تغییر وضعیت
    letter.status = 'in_review';
    letter.currentStep = 'signature';
    if (!letter.referrals) letter.referrals = [];
    letter.referrals.push(referral._id);
    
    await letter.addTracking('in_review', userId, comment || 'ارسال برای امضا');
    await letter.save();

    // اعلان به امضاکننده
    await this.sendNotification(signerId, {
      title: 'درخواست امضا',
      message: `نامه "${letter.subject}" برای امضا به شما ارسال شد`,
      link: `/letters/${letter._id}`,
    });

    return { letter, referral };
  }

  // =============================================
  // ۶. تکمیل امضا
  // =============================================
  static async completeSign(letterId, userId, signatureData, comment = '') {
    const letter = await Letter.findById(letterId);
    if (!letter) throw new Error('نامه یافت نشد');

    const Referral = require('../models/Referral');
    const referral = await Referral.findOne({
      letter: letterId,
      to: userId,
      status: 'pending',
      type: 'sign',
    });

    if (!referral) {
      throw new Error('شما درخواست امضای فعالی برای این نامه ندارید');
    }

    // ذخیره امضا
    const Signature = require('../models/Signature');
    const signature = await Signature.create({
      letter: letterId,
      signer: userId,
      signatureData: signatureData,
      signedAt: new Date(),
      status: 'completed',
    });

    // به‌روزرسانی ارجاع
    referral.status = 'actioned';
    referral.signature = signature._id;
    referral.isSigned = true;
    referral.actionedAt = new Date();
    referral.comment = comment;
    referral.history.push({
      status: 'signed',
      user: userId,
      comment: comment || 'نامه امضا شد',
      timestamp: new Date(),
    });
    await referral.save();

    // تغییر وضعیت نامه
    letter.status = 'signed';
    letter.isSigned = true;
    letter.signedAt = new Date();
    if (!letter.signatures) letter.signatures = [];
    letter.signatures.push(signature._id);
    
    await letter.addTracking('signed', userId, comment || 'نامه امضا شد');
    await letter.save();

    // اعلان به فرستنده
    await this.sendNotification(letter.registeredBy, {
      title: 'نامه امضا شد',
      message: `نامه "${letter.subject}" توسط ${userId} امضا شد`,
      link: `/letters/${letter._id}`,
    });

    return { letter, referral, signature };
  }

  // =============================================
  // ۷. بایگانی نامه
  // =============================================
  static async archive(letterId, userId, archiveType = 'active', comment = '') {
    const letter = await Letter.findById(letterId);
    if (!letter) throw new Error('نامه یافت نشد');

    if (letter.status === 'archived') {
      throw new Error('نامه قبلاً بایگانی شده است');
    }

    letter.status = 'archived';
    letter.isArchived = true;
    letter.archiveType = archiveType;
    letter.archivedAt = new Date();
    letter.archivedBy = userId;
    
    await letter.addTracking('archived', userId, comment || `نامه بایگانی شد (${archiveType})`);
    await letter.save();

    return letter;
  }

  // =============================================
  // ۸. بازگشت به وضعیت قبلی (برای اصلاحات)
  // =============================================
  static async revert(letterId, userId, targetStatus, comment = '') {
    const letter = await Letter.findById(letterId);
    if (!letter) throw new Error('نامه یافت نشد');

    const validStatuses = ['draft', 'registered', 'in_review', 'approved', 'rejected', 'signed'];
    if (!validStatuses.includes(targetStatus)) {
      throw new Error('وضعیت هدف نامعتبر است');
    }

    // بررسی اینکه وضعیت هدف در مسیر قبلی باشد
    const statusOrder = ['draft', 'registered', 'in_review', 'approved', 'signed'];
    const currentIndex = statusOrder.indexOf(letter.status);
    const targetIndex = statusOrder.indexOf(targetStatus);
    
    if (targetIndex === -1 || targetIndex > currentIndex) {
      throw new Error('نمی‌توان به وضعیت بعدی بازگشت');
    }

    letter.status = targetStatus;
    await letter.addTracking(targetStatus, userId, comment || `بازگشت به ${targetStatus}`);
    await letter.save();

    return letter;
  }

  // =============================================
  // ۹. دریافت کارتابل کاربر
  // =============================================
  static async getDashboard(userId) {
    const Letter = require('../models/Letter');
    const Referral = require('../models/Referral');

    // نامه‌های در انتظار پاراف/امضای من
    const pendingReviews = await Referral.find({
      to: userId,
      status: 'pending',
      type: { $in: ['review', 'sign'] },
    })
    .populate('letter', 'subject number letterType priority')
    .populate('from', 'fullName username')
    .sort({ dueDate: 1 });

    // نامه‌های ثبت شده توسط من
    const myLetters = await Letter.find({
      registeredBy: userId,
      status: { $nin: ['archived'] },
    })
    .sort({ createdAt: -1 })
    .limit(10);

    // نامه‌های ارسالی به من
    const receivedLetters = await Letter.find({
      receiver: userId,
      status: { $nin: ['archived', 'draft'] },
    })
    .sort({ createdAt: -1 })
    .limit(10);

    // آمار کلی
    const stats = await Letter.getStats();

    // تعداد ارجاعات معوق
    const overdueCount = await Referral.countDocuments({
      to: userId,
      status: { $in: ['pending', 'read'] },
      dueDate: { $lt: new Date() },
    });

    return {
      pendingReviews,
      myLetters,
      receivedLetters,
      stats,
      overdueCount,
      totalPending: pendingReviews.length,
    };
  }

  // =============================================
  // توابع کمکی
  // =============================================

  static async generateLetterNumber(letter) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const typeMap = {
      incoming: 'و',
      outgoing: 'ص',
      internal: 'د',
    };
    
    const typeCode = typeMap[letter.letterType] || 'ع';
    
    const lastLetter = await Letter.findOne({
      number: { $regex: `^${typeCode}-${year}-${month}` },
    }).sort({ number: -1 });

    let seq = 1;
    if (lastLetter) {
      const parts = lastLetter.number.split('-');
      if (parts.length >= 4) {
        seq = parseInt(parts[3]) + 1;
      }
    }

    return `${typeCode}-${year}-${month}-${String(seq).padStart(4, '0')}`;
  }

  static calculateDueDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  static async sendNotification(userId, data) {
    try {
      await Notification.create({
        user: userId,
        type: 'letter_status',
        title: data.title,
        message: data.message,
        link: data.link,
        isRead: false,
      });
      
      sendNotification(userId, {
        type: 'letter_status',
        title: data.title,
        message: data.message,
        link: data.link,
      });
    } catch (error) {
      console.error('❌ خطا در ارسال اعلان:', error);
    }
  }
}

module.exports = LetterStatusService;
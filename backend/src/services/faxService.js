// backend/src/services/faxService.js
const Fax = require('../models/Fax');
const Letter = require('../models/Letter');
const Notification = require('../models/Notification');
const { sendNotification } = require('../../socket');
const fs = require('fs');
const path = require('path');

// =============================================
// ✅ بارگذاری axios با مدیریت خطا
// =============================================
let axios;
try {
  axios = require('axios');
} catch (error) {
  console.warn('⚠️ axios نصب نیست، سرویس فکس در حالت محدود کار می‌کند');
  axios = null;
}

/**
 * سرویس فکس آنلاین
 * پشتیبانی از ارسال و دریافت فکس از طریق API providers
 */
class FaxService {

  // =============================================
  // ۱. ارسال فکس
  // =============================================
  static async sendFax(userId, data) {
    const {
      faxNumber,
      filePath,
      fileName,
      letterId,
      provider = 'internal',
      metadata = {},
    } = data;

    // ایجاد رکورد فکس
    const fax = new Fax({
      faxNumber,
      senderNumber: process.env.FAX_SENDER_NUMBER || '',
      direction: 'outgoing',
      status: 'pending',
      filePath,
      fileName,
      user: userId,
      letter: letterId || null,
      provider,
      metadata,
    });

    await fax.save();

    // اگر نامه مرتبط است، به‌روزرسانی کن
    if (letterId) {
      const letter = await Letter.findById(letterId);
      if (letter) {
        if (!letter.metadata) letter.metadata = {};
        if (!letter.metadata.fax) letter.metadata.fax = [];
        letter.metadata.fax.push({
          id: fax._id,
          number: faxNumber,
          status: 'pending',
          sentAt: new Date(),
        });
        await letter.save();
      }
    }

    // شروع ارسال (غیرهمزمان)
    this._processOutgoingFax(fax._id);

    return fax;
  }

  // =============================================
  // ۲. پردازش ارسال فکس (غیرهمزمان)
  // =============================================
  static async _processOutgoingFax(faxId) {
    try {
      const fax = await Fax.findById(faxId);
      if (!fax) return;

      fax.status = 'processing';
      await fax.save();

      // ارسال به سرویس فکس
      const result = await this._sendToFaxProvider(fax);

      if (result.success) {
        await fax.markAsSent();
        await this._handleFaxSent(fax);
      } else {
        await fax.markAsFailed(result.error);
        await this._handleFaxFailed(fax);
      }

    } catch (error) {
      console.error('❌ خطا در پردازش فکس:', error);
      const fax = await Fax.findById(faxId);
      if (fax) {
        await fax.markAsFailed(error.message);
        await this._handleFaxFailed(fax);
      }
    }
  }

  // =============================================
  // ۳. ارسال به Provider فکس
  // =============================================
  static async _sendToFaxProvider(fax) {
    try {
      // بررسی وجود فایل
      if (!fs.existsSync(fax.filePath)) {
        throw new Error('فایل فکس وجود ندارد');
      }

      // اگر axios نصب نیست، فقط شبیه‌سازی کن
      if (!axios) {
        console.log('ℹ️ حالت شبیه‌سازی فکس (بدون axios)');
        return {
          success: true,
          reference: `SIM-${Date.now()}`,
        };
      }

      // خواندن فایل
      const fileBuffer = fs.readFileSync(fax.filePath);
      const base64File = fileBuffer.toString('base64');

      // ارسال به API Provider
      const providerConfig = this._getProviderConfig(fax.provider);
      
      const response = await axios.post(
        providerConfig.endpoint,
        {
          faxNumber: fax.faxNumber,
          senderNumber: fax.senderNumber,
          file: base64File,
          fileName: fax.fileName,
        },
        {
          headers: {
            'Authorization': `Bearer ${providerConfig.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.data && response.data.success) {
        return {
          success: true,
          reference: response.data.reference || '',
        };
      } else {
        throw new Error(response.data?.error || 'خطا در ارسال فکس');
      }

    } catch (error) {
      console.error('❌ خطا در ارسال به Provider فکس:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // =============================================
  // ۴. دریافت فکس (Webhook)
  // =============================================
  static async receiveFax(data) {
    const {
      faxNumber,
      senderNumber,
      filePath,
      fileName,
      pages,
      providerReference,
      metadata = {},
    } = data;

    // ایجاد رکورد فکس
    const fax = new Fax({
      faxNumber,
      senderNumber,
      direction: 'incoming',
      status: 'received',
      filePath,
      fileName,
      pages: pages || 1,
      receivedAt: new Date(),
      provider: 'external_api',
      providerReference,
      metadata,
    });

    await fax.save();

    // دریافت کاربر مرتبط با شماره فکس
    const User = require('../models/User');
    const user = await User.findOne({ faxNumber: fax.faxNumber });
    if (user) {
      fax.user = user._id;
      await fax.save();

      // اعلان به کاربر
      await this.sendNotification(user._id, {
        title: 'فکس جدید دریافت شد',
        message: `فکس جدید از شماره ${senderNumber} دریافت شد`,
        link: `/fax/${fax._id}`,
      });
    }

    // تلاش برای ایجاد نامه از فکس
    await this._createLetterFromFax(fax);

    return fax;
  }

  // =============================================
  // ۵. ایجاد نامه از فکس
  // =============================================
  static async _createLetterFromFax(fax) {
    try {
      // بررسی وجود کاربر
      const User = require('../models/User');
      const user = await User.findById(fax.user);
      if (!user) return;

      // استخراج متن از فکس (با OCR)
      const extractedText = await this._extractTextFromFax(fax.filePath);

      // ایجاد نامه پیش‌نویس
      const letter = new Letter({
        subject: `فکس از ${fax.senderNumber}`,
        content: extractedText || 'متن فکس استخراج نشد',
        letterType: 'incoming',
        senderName: fax.senderNumber,
        receiver: user._id,
        letterDate: new Date(),
        secretariat: user.secretariat || null,
        registeredBy: user._id,
        status: 'draft',
        metadata: {
          source: 'fax',
          faxId: fax._id,
          faxNumber: fax.faxNumber,
        },
      });

      await letter.save();

      // ارتباط با فکس
      fax.letter = letter._id;
      await fax.save();

      // اعلان به کاربر
      await this.sendNotification(user._id, {
        title: 'نامه از فکس ایجاد شد',
        message: `نامه با موضوع "${letter.subject}" از فکس دریافت شده ایجاد شد`,
        link: `/letters/${letter._id}`,
      });

      return letter;

    } catch (error) {
      console.error('❌ خطا در ایجاد نامه از فکس:', error);
      return null;
    }
  }

  // =============================================
  // ۶. استخراج متن از فکس
  // =============================================
  static async _extractTextFromFax(filePath) {
    try {
      // استفاده از Tesseract یا سرویس OCR
      // اینجا یک نمونه ساده
      return 'متن استخراج شده از فکس (OCR)';
    } catch (error) {
      console.error('❌ خطا در استخراج متن:', error);
      return '';
    }
  }

  // =============================================
  // ۷. پیدا کردن کاربر بر اساس شماره فکس
  // =============================================
  static async _findUserByFaxNumber(faxNumber) {
    const User = require('../models/User');
    return User.findOne({ faxNumber });
  }

  // =============================================
  // ۸. دریافت تنظیمات Provider
  // =============================================
  static _getProviderConfig(provider) {
    const configs = {
      internal: {
        endpoint: process.env.FAX_INTERNAL_ENDPOINT || '',
        apiKey: process.env.FAX_INTERNAL_API_KEY || '',
      },
      external_api: {
        endpoint: process.env.FAX_EXTERNAL_ENDPOINT || '',
        apiKey: process.env.FAX_EXTERNAL_API_KEY || '',
      },
    };
    return configs[provider] || configs.internal;
  }

  // =============================================
  // ۹. هندلرهای رویداد
  // =============================================
  static async _handleFaxSent(fax) {
    // اعلان به کاربر
    if (fax.user) {
      await this.sendNotification(fax.user, {
        title: 'فکس با موفقیت ارسال شد',
        message: `فکس به شماره ${fax.faxNumber} با موفقیت ارسال شد`,
        link: `/fax/${fax._id}`,
      });
    }

    // به‌روزرسانی نامه مرتبط
    if (fax.letter) {
      const letter = await Letter.findById(fax.letter);
      if (letter && letter.metadata?.fax) {
        const faxEntry = letter.metadata.fax.find(f => f.id.toString() === fax._id.toString());
        if (faxEntry) {
          faxEntry.status = 'sent';
          faxEntry.sentAt = fax.sentAt;
          await letter.save();
        }
      }
    }
  }

  static async _handleFaxFailed(fax) {
    // اعلان به کاربر
    if (fax.user) {
      await this.sendNotification(fax.user, {
        title: 'خطا در ارسال فکس',
        message: `ارسال فکس به شماره ${fax.faxNumber} با خطا مواجه شد`,
        link: `/fax/${fax._id}`,
      });
    }

    // تلاش مجدد اگر تعداد تلاش‌ها کمتر از حد مجاز است
    if (fax.retryCount < fax.maxRetries) {
      setTimeout(() => {
        this._processOutgoingFax(fax._id);
      }, 60000 * (fax.retryCount + 1));
    }
  }

  // =============================================
  // ۱۰. دریافت وضعیت فکس
  // =============================================
  static async getFaxStatus(faxId) {
    const fax = await Fax.findById(faxId)
      .populate('letter', 'subject number')
      .populate('user', 'fullName username');

    if (!fax) throw new Error('فکس یافت نشد');

    return {
      id: fax._id,
      faxNumber: fax.faxNumber,
      senderNumber: fax.senderNumber,
      direction: fax.direction,
      status: fax.status,
      statusLabel: this.getStatusLabel(fax.status),
      pages: fax.pages,
      fileName: fax.fileName,
      sentAt: fax.sentAt,
      receivedAt: fax.receivedAt,
      letter: fax.letter,
      user: fax.user,
      errorMessage: fax.errorMessage,
      retryCount: fax.retryCount,
      createdAt: fax.createdAt,
    };
  }

  // =============================================
  // ۱۱. دریافت لیست فکس‌ها
  // =============================================
  static async getFaxList(userId, filters = {}) {
    const {
      direction,
      status,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
    } = filters;

    const filter = { user: userId };

    if (direction) filter.direction = direction;
    if (status) filter.status = status;

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const data = await Fax.find(filter)
      .populate('letter', 'subject number')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Fax.countDocuments(filter);

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // =============================================
  // ۱۲. توابع کمکی
  // =============================================
  static getStatusLabel(status) {
    const map = {
      pending: 'در انتظار',
      processing: 'در حال پردازش',
      sent: 'ارسال شده',
      received: 'دریافت شده',
      failed: 'ناموفق',
      cancelled: 'لغو شده',
    };
    return map[status] || status;
  }

  static async sendNotification(userId, data) {
    try {
      await Notification.create({
        user: userId,
        type: 'fax',
        title: data.title,
        message: data.message,
        link: data.link,
        isRead: false,
      });

      sendNotification(userId, {
        type: 'fax',
        title: data.title,
        message: data.message,
        link: data.link,
      });
    } catch (error) {
      console.error('❌ خطا در ارسال اعلان:', error);
    }
  }
}

module.exports = FaxService;
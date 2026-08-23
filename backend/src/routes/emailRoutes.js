// backend/src/routes/emailRoutes.js
const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const SystemSetting = require('../models/SystemSetting');

// =============================================
// دریافت تنظیمات ایمیل
// =============================================
router.get('/settings', protect, authorize('admin'), async (req, res) => {
  try {
    const settings = await SystemSetting.find({
      group: 'email',
    });

    const result = {};
    settings.forEach((s) => {
      result[s.key] = s.value;
    });

    res.json({
      success: true,
      data: result,
      message: 'تنظیمات ایمیل دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت تنظیمات ایمیل:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// به‌روزرسانی تنظیمات ایمیل
// =============================================
router.put('/settings', protect, authorize('admin'), async (req, res) => {
  try {
    const updates = req.body;

    for (const [key, value] of Object.entries(updates)) {
      await SystemSetting.findOneAndUpdate(
        { key, group: 'email' },
        {
          key,
          value,
          group: 'email',
          type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string',
          label: key,
          isActive: true,
          isSystem: true,
        },
        { upsert: true, new: true }
      );
    }

    res.json({
      success: true,
      message: 'تنظیمات ایمیل با موفقیت ذخیره شد',
    });
  } catch (error) {
    console.error('❌ خطا در ذخیره تنظیمات ایمیل:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// تست اتصال
// =============================================
router.post('/test', protect, authorize('admin'), async (req, res) => {
  try {
    // دریافت تنظیمات
    const settings = await SystemSetting.find({ group: 'email' });
    const config = {};
    settings.forEach((s) => {
      config[s.key] = s.value;
    });

    // بررسی وجود اطلاعات اتصال
    if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
      return res.status(400).json({
        success: false,
        error: 'تنظیمات SMTP کامل نیست. لطفاً ابتدا تنظیمات را ذخیره کنید.',
      });
    }

    // تست اتصال با nodemailer
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: parseInt(config.smtpPort) || 587,
      secure: config.smtpSecure || false,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.verify();

    res.json({
      success: true,
      message: 'اتصال با موفقیت برقرار شد',
    });
  } catch (error) {
    console.error('❌ خطا در تست اتصال ایمیل:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// دریافت ایمیل‌ها
// =============================================
router.get('/inbox', protect, async (req, res) => {
  try {
    // دریافت تنظیمات
    const settings = await SystemSetting.find({ group: 'email' });
    const config = {};
    settings.forEach((s) => {
      config[s.key] = s.value;
    });

    // اگر دریافت خودکار فعال نباشد
    if (!config.autoReceive) {
      return res.json({
        success: true,
        data: [],
        message: 'دریافت خودکار غیرفعال است',
      });
    }

    // اینجا منطق دریافت از IMAP
    // برای نمونه، یک آرایه خالی برمی‌گردانیم
    res.json({
      success: true,
      data: [],
      message: 'ایمیل‌ها با موفقیت دریافت شدند',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت ایمیل‌ها:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// دریافت خودکار ایمیل‌ها (دستی)
// =============================================
router.post('/receive', protect, async (req, res) => {
  try {
    // اینجا منطق دریافت از IMAP
    // برای نمونه، یک پیام موفقیت برمی‌گردانیم
    res.json({
      success: true,
      data: [],
      message: 'ایمیل‌ها با موفقیت دریافت شدند',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت خودکار ایمیل‌ها:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ارسال ایمیل (برای ارسال نامه از طریق ایمیل)
// =============================================
router.post('/send-letter', protect, async (req, res) => {
  try {
    const { letterId, emailAddress, subject, message } = req.body;

    if (!letterId || !emailAddress) {
      return res.status(400).json({
        success: false,
        error: 'شناسه نامه و آدرس ایمیل الزامی است',
      });
    }

    // دریافت تنظیمات
    const settings = await SystemSetting.find({ group: 'email' });
    const config = {};
    settings.forEach((s) => {
      config[s.key] = s.value;
    });

    // ارسال ایمیل با nodemailer
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: parseInt(config.smtpPort) || 587,
      secure: config.smtpSecure || false,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: config.smtpUser,
      to: emailAddress,
      subject: subject || 'نامه از سامانه مکاتبات',
      html: message || 'متن نامه',
    });

    res.json({
      success: true,
      data: info,
      message: 'ایمیل با موفقیت ارسال شد',
    });
  } catch (error) {
    console.error('❌ خطا در ارسال ایمیل:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
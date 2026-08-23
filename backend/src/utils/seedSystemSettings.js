// backend/src/utils/seedSystemSettings.js
const SystemSetting = require('../models/SystemSetting');

const defaultSettings = [
  // =============================================
  // تنظیمات عمومی
  // =============================================
  {
    key: 'site_title',
    value: 'سامانه یکپارچه مدیریت سازمانی',
    type: 'string',
    group: 'general',
    label: 'عنوان سایت',
    description: 'عنوانی که در هدر و تب مرورگر نمایش داده می‌شود',
    isSystem: true,
  },
  {
    key: 'site_logo',
    value: '',
    type: 'string',
    group: 'general',
    label: 'لوگوی سایت',
    description: 'آدرس تصویر لوگو',
    isSystem: true,
  },
  {
    key: 'company_name',
    value: 'سازمان نمونه',
    type: 'string',
    group: 'general',
    label: 'نام سازمان',
    description: 'نام سازمان یا شرکت',
    isSystem: true,
  },
  {
    key: 'copyright',
    value: 'تمامی حقوق محفوظ است',
    type: 'string',
    group: 'general',
    label: 'متن کپی‌رایت',
    description: 'متن کپی‌رایت نمایش داده شده در فوتر',
    isSystem: true,
  },
  {
    key: 'version',
    value: '2.0.0',
    type: 'string',
    group: 'general',
    label: 'نسخه سیستم',
    description: 'نسخه فعلی سیستم',
    isSystem: true,
  },

  // =============================================
  // تنظیمات ظاهری
  // =============================================
  {
    key: 'primary_color',
    value: '#1677ff',
    type: 'color',
    group: 'appearance',
    label: 'رنگ اصلی',
    description: 'رنگ اصلی رابط کاربری',
    isSystem: true,
  },
  {
    key: 'secondary_color',
    value: '#64748b',
    type: 'color',
    group: 'appearance',
    label: 'رنگ ثانویه',
    description: 'رنگ ثانویه رابط کاربری',
    isSystem: true,
  },
  {
    key: 'default_theme',
    value: 'light',
    type: 'string',
    group: 'appearance',
    label: 'تم پیش‌فرض',
    description: 'تم پیش‌فرض سیستم (light/dark)',
    isSystem: true,
  },

  // =============================================
  // تنظیمات سایدبار
  // =============================================
  {
    key: 'siteSubtitle',
    value: '',
    type: 'string',
    group: 'general',
    label: 'زیرعنوان سایدبار',
    description: 'زیرعنوان نمایش داده شده در سایدبار',
    isSystem: true,
  },

  // =============================================
  // تنظیمات صفحه ورود
  // =============================================
  {
    key: 'loginTitle',
    value: 'مدیریت IT',
    type: 'string',
    group: 'login',
    label: 'عنوان صفحه ورود',
    description: 'عنوان نمایش داده شده در صفحه ورود',
    isSystem: true,
  },
  {
    key: 'loginIcon',
    value: '🏢',
    type: 'string',
    group: 'login',
    label: 'آیکون صفحه ورود',
    description: 'آیکون نمایش داده شده در صفحه ورود',
    isSystem: true,
  },
  {
    key: 'loginSubtitle',
    value: 'وارد حساب کاربری خود شوید',
    type: 'string',
    group: 'login',
    label: 'زیرعنوان صفحه ورود',
    description: 'زیرعنوان نمایش داده شده در صفحه ورود',
    isSystem: true,
  },

  // =============================================
  // تنظیمات امنیتی
  // =============================================
  {
    key: 'maxLoginAttempts',
    value: 5,
    type: 'number',
    group: 'security',
    label: 'حداکثر تلاش برای ورود',
    description: 'تعداد دفعات مجاز برای ورود ناموفق',
    isSystem: true,
  },
  {
    key: 'sessionTimeout',
    value: 60,
    type: 'number',
    group: 'security',
    label: 'زمان نشست (دقیقه)',
    description: 'زمان انقضای نشست کاربر',
    isSystem: true,
  },
  {
    key: 'twoFactorEnabled',
    value: false,
    type: 'boolean',
    group: 'security',
    label: 'فعال‌سازی تایید دو مرحله‌ای',
    description: 'فعال/غیرفعال کردن تایید دو مرحله‌ای',
    isSystem: true,
  },

  // =============================================
  // تنظیمات اعلان‌ها
  // =============================================
  {
    key: 'notificationEmail',
    value: '',
    type: 'string',
    group: 'notification',
    label: 'ایمیل برای اعلان‌ها',
    description: 'آدرس ایمیل برای دریافت اعلان‌ها',
    isSystem: true,
  },
  {
    key: 'notificationSms',
    value: false,
    type: 'boolean',
    group: 'notification',
    label: 'ارسال اعلان از طریق پیامک',
    description: 'فعال/غیرفعال کردن ارسال اعلان از طریق پیامک',
    isSystem: true,
  },

  // =============================================
  // تنظیمات API
  // =============================================
  {
    key: 'apiRateLimit',
    value: 100,
    type: 'number',
    group: 'api',
    label: 'محدودیت درخواست در دقیقه',
    description: 'تعداد درخواست‌های مجاز در دقیقه',
    isSystem: true,
  },
  {
    key: 'apiTimeout',
    value: 30,
    type: 'number',
    group: 'api',
    label: 'زمان پاسخ (ثانیه)',
    description: 'حداکثر زمان پاسخگویی API',
    isSystem: true,
  },

  // =============================================
  // تنظیمات شماره‌گذاری نامه‌ها
  // =============================================
  {
    key: 'letter_numbering_format',
    value: '{type}-{year}-{month}-{seq}-{department}',
    type: 'string',
    group: 'letter',
    label: 'فرمت شماره‌گذاری نامه‌ها',
    description: 'فرمت شماره‌گذاری نامه‌ها با متغیرهای {type}, {year}, {month}, {seq}, {department}',
    isSystem: true,
  },
  {
    key: 'letter_numbering_separator',
    value: '-',
    type: 'string',
    group: 'letter',
    label: 'جداکننده شماره نامه',
    description: 'کاراکتر جداکننده در شماره نامه',
    isSystem: true,
  },

  // =============================================
  // تنظیمات گردش کار
  // =============================================
  {
    key: 'default_workflow_timeout',
    value: 48,
    type: 'number',
    group: 'workflow',
    label: 'زمان پیش‌فرض هر مرحله',
    description: 'زمان پیش‌فرض برای هر مرحله گردش کار (ساعت)',
    isSystem: true,
  },
  {
    key: 'max_workflow_steps',
    value: 10,
    type: 'number',
    group: 'workflow',
    label: 'حداکثر مراحل گردش کار',
    description: 'حداکثر تعداد مراحل مجاز برای هر گردش کار',
    isSystem: true,
  },

  // =============================================
  // تنظیمات اخطارها
  // =============================================
  {
    key: 'reminder_days_before',
    value: [5, 3, 1, 0],
    type: 'array',
    group: 'reminder',
    label: 'روزهای یادآوری',
    description: 'چند روز قبل از سررسید، اخطار ارسال شود',
    isSystem: true,
  },
  {
    key: 'reminder_repeat_interval',
    value: 24,
    type: 'number',
    group: 'reminder',
    label: 'فاصله تکرار اخطار',
    description: 'فاصله زمانی بین اخطارهای تکراری (ساعت)',
    isSystem: true,
  },

  // =============================================
  // تنظیمات ایمیل (SMTP/IMAP)
  // =============================================
  {
    key: 'smtpHost',
    value: '',
    type: 'string',
    group: 'email',
    label: 'آدرس سرور SMTP',
    description: 'آدرس سرور SMTP برای ارسال ایمیل',
    isSystem: true,
  },
  {
    key: 'smtpPort',
    value: 587,
    type: 'number',
    group: 'email',
    label: 'پورت SMTP',
    description: 'پورت سرور SMTP',
    isSystem: true,
  },
  {
    key: 'smtpUser',
    value: '',
    type: 'string',
    group: 'email',
    label: 'نام کاربری SMTP',
    description: 'نام کاربری SMTP',
    isSystem: true,
  },
  {
    key: 'smtpPass',
    value: '',
    type: 'string',
    group: 'email',
    label: 'رمز عبور SMTP',
    description: 'رمز عبور SMTP',
    isSystem: true,
  },
  {
    key: 'smtpSecure',
    value: false,
    type: 'boolean',
    group: 'email',
    label: 'اتصال امن SMTP',
    description: 'فعال/غیرفعال کردن SSL/TLS برای SMTP',
    isSystem: true,
  },
  {
    key: 'imapHost',
    value: '',
    type: 'string',
    group: 'email',
    label: 'آدرس سرور IMAP',
    description: 'آدرس سرور IMAP برای دریافت ایمیل',
    isSystem: true,
  },
  {
    key: 'imapPort',
    value: 993,
    type: 'number',
    group: 'email',
    label: 'پورت IMAP',
    description: 'پورت سرور IMAP',
    isSystem: true,
  },
  {
    key: 'imapUser',
    value: '',
    type: 'string',
    group: 'email',
    label: 'نام کاربری IMAP',
    description: 'نام کاربری IMAP',
    isSystem: true,
  },
  {
    key: 'imapPass',
    value: '',
    type: 'string',
    group: 'email',
    label: 'رمز عبور IMAP',
    description: 'رمز عبور IMAP',
    isSystem: true,
  },
  {
    key: 'imapSecure',
    value: true,
    type: 'boolean',
    group: 'email',
    label: 'اتصال امن IMAP',
    description: 'فعال/غیرفعال کردن SSL/TLS برای IMAP',
    isSystem: true,
  },
  {
    key: 'autoReceive',
    value: false,
    type: 'boolean',
    group: 'email',
    label: 'دریافت خودکار ایمیل',
    description: 'دریافت خودکار ایمیل‌ها از سرور IMAP',
    isSystem: true,
  },
  {
    key: 'receiveInterval',
    value: 5,
    type: 'number',
    group: 'email',
    label: 'فاصله دریافت خودکار (دقیقه)',
    description: 'فاصله زمانی بین دریافت خودکار ایمیل‌ها',
    isSystem: true,
  },
  {
    key: 'defaultSubject',
    value: '',
    type: 'string',
    group: 'email',
    label: 'موضوع پیش‌فرض',
    description: 'موضوع پیش‌فرض برای ایمیل‌های دریافتی',
    isSystem: true,
  },
  {
    key: 'signature',
    value: '',
    type: 'string',
    group: 'email',
    label: 'امضای پیش‌فرض',
    description: 'امضای پیش‌فرض برای ایمیل‌های ارسالی',
    isSystem: true,
  },
];

const seedSystemSettings = async () => {
  try {
    console.log('🔄 شروع ایجاد تنظیمات سیستم...');
    
    for (const setting of defaultSettings) {
      await SystemSetting.findOneAndUpdate(
        { key: setting.key },
        setting,
        { upsert: true, returnDocument: 'after' }
      );
    }
    
    console.log(`✅ ${defaultSettings.length} تنظیمات سیستم با موفقیت ایجاد شدند`);
    return { success: true, count: defaultSettings.length };
  } catch (error) {
    console.error('❌ خطا در ایجاد تنظیمات سیستم:', error.message);
    throw error;
  }
};

module.exports = seedSystemSettings;
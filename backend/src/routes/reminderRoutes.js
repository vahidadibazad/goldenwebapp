const router = require('express').Router();
const ReminderSetting = require('../models/ReminderSetting');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Document = require('../models/Document');
const WorkflowInstance = require('../models/WorkflowInstance');
const { protect, authorize, checkPermission } = require('../middleware/auth');
const logAudit = require('../utils/auditLogger');

// =============================================
// دریافت تنظیمات اخطارها
// =============================================
router.get('/settings', protect, async (req, res) => {
  try {
    const settings = await ReminderSetting.getActiveSettings();

    res.json({
      success: true,
      data: settings,
      message: 'تنظیمات اخطارها با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت تنظیمات اخطارها:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// دریافت تنظیمات پیش‌فرض
// =============================================
router.get('/settings/default', protect, async (req, res) => {
  try {
    const settings = await ReminderSetting.getDefaultSettings();

    res.json({
      success: true,
      data: settings,
      message: 'تنظیمات پیش‌فرض اخطارها با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت تنظیمات پیش‌فرض:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// دریافت تنظیمات برای یک نوع خاص
// =============================================
router.get('/settings/type/:targetType', protect, async (req, res) => {
  try {
    const { targetType } = req.params;
    const settings = await ReminderSetting.getSettingsForType(targetType);

    res.json({
      success: true,
      data: settings,
      message: `تنظیمات اخطار برای نوع ${targetType} با موفقیت دریافت شد`
    });
  } catch (error) {
    console.error('❌ خطا در دریافت تنظیمات اخطار:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// دریافت یک تنظیمات با ID
// =============================================
router.get('/settings/:id', protect, authorize('admin', 'office_manager'), async (req, res) => {
  try {
    const settings = await ReminderSetting.findById(req.params.id)
      .populate('createdBy', 'fullName username')
      .populate('updatedBy', 'fullName username');

    if (!settings) {
      return res.status(404).json({
        success: false,
        error: 'تنظیمات یافت نشد'
      });
    }

    res.json({
      success: true,
      data: settings,
      message: 'تنظیمات اخطار با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت تنظیمات اخطار:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// ایجاد تنظیمات جدید (فقط ادمین)
// =============================================
router.post('/settings', protect, authorize('admin', 'office_manager'), async (req, res) => {
  try {
    const {
      name,
      description,
      schedules,
      methods,
      messageTemplates,
      batchSending,
      allowDuplicate,
      maxDuplicateCount,
      duplicateInterval,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'نام تنظیمات الزامی است'
      });
    }

    if (!schedules || schedules.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'حداقل یک زمان‌بندی تعریف کنید'
      });
    }

    if (!messageTemplates || messageTemplates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'حداقل یک قالب پیام تعریف کنید'
      });
    }

    // بررسی تکراری نبودن نام
    const existing = await ReminderSetting.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'تنظیماتی با این نام قبلاً ثبت شده است'
      });
    }

    const settings = new ReminderSetting({
      name,
      description: description || '',
      schedules,
      methods: methods || {
        system: { enabled: true, priority: 1 },
        sms: { enabled: false, priority: 2 },
        email: { enabled: false, priority: 3 },
        push: { enabled: false, priority: 4 },
      },
      messageTemplates,
      batchSending: batchSending || { enabled: false, batchSize: 10, batchInterval: 60 },
      allowDuplicate: allowDuplicate || false,
      maxDuplicateCount: maxDuplicateCount || 3,
      duplicateInterval: duplicateInterval || 24,
      createdBy: req.user.id,
      isActive: true,
    });

    await settings.save();

    // ثبت لاگ
    await logAudit(req, 'CREATE', 'REMINDER_SETTINGS', {
      settingsId: settings._id,
      name: settings.name,
      schedulesCount: settings.schedules.length,
    });

    res.status(201).json({
      success: true,
      data: settings,
      message: 'تنظیمات اخطار با موفقیت ایجاد شد'
    });
  } catch (error) {
    console.error('❌ خطا در ایجاد تنظیمات اخطار:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// ویرایش تنظیمات (فقط ادمین)
// =============================================
router.put('/settings/:id', protect, authorize('admin', 'office_manager'), async (req, res) => {
  try {
    const {
      name,
      description,
      schedules,
      methods,
      messageTemplates,
      batchSending,
      allowDuplicate,
      maxDuplicateCount,
      duplicateInterval,
      isActive,
    } = req.body;

    const settings = await ReminderSetting.findById(req.params.id);
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: 'تنظیمات یافت نشد'
      });
    }

    // به‌روزرسانی
    if (name) settings.name = name;
    if (description !== undefined) settings.description = description;
    if (schedules) settings.schedules = schedules;
    if (methods) settings.methods = methods;
    if (messageTemplates) settings.messageTemplates = messageTemplates;
    if (batchSending) settings.batchSending = batchSending;
    if (allowDuplicate !== undefined) settings.allowDuplicate = allowDuplicate;
    if (maxDuplicateCount) settings.maxDuplicateCount = maxDuplicateCount;
    if (duplicateInterval) settings.duplicateInterval = duplicateInterval;
    if (isActive !== undefined) settings.isActive = isActive;
    settings.updatedBy = req.user.id;

    await settings.save();

    // ثبت لاگ
    await logAudit(req, 'UPDATE', 'REMINDER_SETTINGS', {
      settingsId: settings._id,
      name: settings.name,
      changes: req.body,
    });

    res.json({
      success: true,
      data: settings,
      message: 'تنظیمات اخطار با موفقیت ویرایش شد'
    });
  } catch (error) {
    console.error('❌ خطا در ویرایش تنظیمات اخطار:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// حذف تنظیمات (فقط ادمین)
// =============================================
router.delete('/settings/:id', protect, authorize('admin', 'office_manager'), async (req, res) => {
  try {
    const settings = await ReminderSetting.findById(req.params.id);
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: 'تنظیمات یافت نشد'
      });
    }

    // جلوگیری از حذف تنظیمات پیش‌فرض
    if (settings.name === 'پیش‌فرض') {
      return res.status(400).json({
        success: false,
        error: 'تنظیمات پیش‌فرض قابل حذف نیست'
      });
    }

    await logAudit(req, 'DELETE', 'REMINDER_SETTINGS', {
      settingsId: settings._id,
      name: settings.name,
    });

    await settings.remove();

    res.json({
      success: true,
      message: 'تنظیمات اخطار با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('❌ خطا در حذف تنظیمات اخطار:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// دریافت اخطارهای کاربر جاری
// =============================================
router.get('/my', protect, async (req, res) => {
  try {
    const { read, limit = 50 } = req.query;
    
    const filter = { user: req.user.id };
    if (read === 'true') filter.isRead = true;
    if (read === 'false') filter.isRead = false;

    const reminders = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: reminders,
      message: 'اخطارها با موفقیت دریافت شدند'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت اخطارها:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// دریافت تعداد اخطارهای خوانده‌نشده
// =============================================
router.get('/unread/count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      isRead: false
    });

    res.json({
      success: true,
      data: { count },
      message: 'تعداد اخطارهای خوانده‌نشده با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت تعداد اخطارها:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// دریافت اخطارهای سررسید شده
// =============================================
router.get('/overdue', protect, async (req, res) => {
  try {
    const letters = await Document.getOverdueLetters();
    
    // تبدیل به اخطار
    const overdueReminders = letters.map(letter => ({
      id: letter._id,
      title: letter.title,
      letterNumber: letter.letterNumber,
      dueDate: letter.dueDate,
      status: letter.workflowStatus,
      type: 'overdue',
      message: `نامه "${letter.title}" از تاریخ ${letter.dueDate} گذشته است`,
    }));

    res.json({
      success: true,
      data: overdueReminders,
      message: 'اخطارهای سررسید شده با موفقیت دریافت شدند'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت اخطارهای سررسید شده:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// علامت‌گذاری اخطار به عنوان خوانده‌شده
// =============================================
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'اخطار یافت نشد'
      });
    }

    res.json({
      success: true,
      data: notification,
      message: 'اخطار با موفقیت خوانده شد'
    });
  } catch (error) {
    console.error('❌ خطا در علامت‌گذاری اخطار:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// علامت‌گذاری همه اخطارها به عنوان خوانده‌شده
// =============================================
router.put('/mark-all-read', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'همه اخطارها با موفقیت خوانده شدند'
    });
  } catch (error) {
    console.error('❌ خطا در علامت‌گذاری همه اخطارها:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// ارسال دستی اخطار (فقط ادمین)
// =============================================
router.post('/send', protect, authorize('admin', 'office_manager'), async (req, res) => {
  try {
    const { userId, title, message, link, type = 'reminder', priority = 'medium' } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'کاربر، عنوان و متن اخطار الزامی است'
      });
    }

    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      link: link || '',
      category: 'system',
      priority,
      deliveryMethod: 'system',
      isRead: false,
    });

    // ثبت لاگ
    await logAudit(req, 'CREATE', 'REMINDER', {
      notificationId: notification._id,
      userId,
      title,
    });

    res.status(201).json({
      success: true,
      data: notification,
      message: 'اخطار با موفقیت ارسال شد'
    });
  } catch (error) {
    console.error('❌ خطا در ارسال اخطار:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// حذف اخطار
// =============================================
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'اخطار یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'اخطار با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('❌ خطا در حذف اخطار:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// دریافت آمار اخطارها
// =============================================
router.get('/stats/overview', protect, authorize('admin', 'office_manager'), async (req, res) => {
  try {
    // تعداد کل اخطارها
    const total = await Notification.countDocuments();
    
    // تعداد اخطارهای خوانده‌نشده
    const unread = await Notification.countDocuments({ isRead: false });
    
    // تعداد اخطارهای امروز
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await Notification.countDocuments({
      createdAt: { $gte: today }
    });

    // تعداد اخطارها بر اساس نوع
    const typeStats = await Notification.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        total,
        unread,
        todayCount,
        byType: typeStats,
      },
      message: 'آمار اخطارها با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت آمار اخطارها:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
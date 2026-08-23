const router = require('express').Router();
const { protect } = require('../middleware/auth');
const NotificationService = require('../services/notificationService');

// =============================================
// دریافت اعلان‌های کاربر جاری
// =============================================
router.get('/', protect, async (req, res) => {
  try {
    const { limit = 50, page = 1, isRead = null, type = null } = req.query;

    const notifications = await NotificationService.getUserNotifications(
      req.user.id,
      { limit, page, isRead, type }
    );

    const unreadCount = await NotificationService.getUnreadCount(req.user.id);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: notifications.length,
      },
      message: 'لیست اعلان‌ها دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت اعلان‌ها:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// دریافت تعداد اعلان‌های خوانده‌نشده
// =============================================
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user.id);

    res.json({
      success: true,
      data: { count },
      message: 'تعداد اعلان‌های خوانده‌نشده دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت تعداد اعلان‌ها:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// علامت‌گذاری اعلان به عنوان خوانده شده
// =============================================
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await NotificationService.markAsRead(req.params.id, req.user.id);

    res.json({
      success: true,
      data: notification,
      message: 'اعلان با موفقیت خوانده شد',
    });
  } catch (error) {
    console.error('❌ خطا در علامت‌گذاری اعلان:', error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// علامت‌گذاری همه اعلان‌ها به عنوان خوانده شده
// =============================================
router.put('/mark-all-read', protect, async (req, res) => {
  try {
    const result = await NotificationService.markAllAsRead(req.user.id);

    res.json({
      success: true,
      data: result,
      message: 'همه اعلان‌ها با موفقیت خوانده شدند',
    });
  } catch (error) {
    console.error('❌ خطا در علامت‌گذاری همه اعلان‌ها:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// حذف اعلان
// =============================================
router.delete('/:id', protect, async (req, res) => {
  try {
    await NotificationService.deleteNotification(req.params.id, req.user.id);

    res.json({
      success: true,
      message: 'اعلان با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('❌ خطا در حذف اعلان:', error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ارسال اعلان تست (فقط برای توسعه)
// =============================================
router.post('/test', protect, async (req, res) => {
  try {
    const { title, message, type = 'system_notification' } = req.body;

    const notification = await NotificationService.sendToUser(req.user.id, {
      type,
      title: title || 'اعلان تست',
      message: message || 'این یک اعلان تستی است',
      priority: 'low',
    });

    res.json({
      success: true,
      data: notification,
      message: 'اعلان تست با موفقیت ارسال شد',
    });
  } catch (error) {
    console.error('❌ خطا در ارسال اعلان تست:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
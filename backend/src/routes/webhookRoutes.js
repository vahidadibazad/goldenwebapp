// backend/src/routes/webhookRoutes.js
const router = require('express').Router();
const WebhookService = require('../services/webhookService');
const Webhook = require('../models/Webhook');
const { protect, checkPermission } = require('../middleware/auth');

// =============================================
// ✅ دریافت لیست وب‌هوک‌ها
// =============================================
router.get('/', protect, checkPermission('view_webhooks'), async (req, res) => {
  try {
    const filter = {};
    const isAdmin = req.user.role?.name === 'admin';
    if (!isAdmin) {
      filter.createdBy = req.user.id;
    }

    const webhooks = await Webhook.find(filter)
      .populate('createdBy', 'fullName username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: webhooks,
      message: 'لیست وب‌هوک‌ها با موفقیت دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت وب‌هوک‌ها:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ دریافت آمار وب‌هوک‌ها
// =============================================
router.get('/stats', protect, checkPermission('view_webhooks'), async (req, res) => {
  try {
    const isAdmin = req.user.role?.name === 'admin';
    const userId = isAdmin ? null : req.user.id;

    const stats = await WebhookService.getStats(userId);

    res.status(200).json({
      success: true,
      data: stats,
      message: 'آمار وب‌هوک‌ها با موفقیت دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت آمار وب‌هوک‌ها:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ دریافت یک وب‌هوک
// =============================================
router.get('/:id', protect, checkPermission('view_webhooks'), async (req, res) => {
  try {
    const webhook = await Webhook.findById(req.params.id)
      .populate('createdBy', 'fullName username');

    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'وب‌هوک یافت نشد',
      });
    }

    // بررسی دسترسی
    const isAdmin = req.user.role?.name === 'admin';
    if (!isAdmin && webhook.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'شما دسترسی به این وب‌هوک را ندارید',
      });
    }

    res.status(200).json({
      success: true,
      data: webhook,
      message: 'اطلاعات وب‌هوک با موفقیت دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت وب‌هوک:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ ایجاد وب‌هوک جدید
// =============================================
router.post('/', protect, checkPermission('manage_webhooks'), async (req, res) => {
  try {
    const webhook = await WebhookService.createWebhook(req.body, req.user.id);

    res.status(201).json({
      success: true,
      data: webhook,
      message: 'وب‌هوک با موفقیت ایجاد شد',
    });
  } catch (error) {
    console.error('❌ خطا در ایجاد وب‌هوک:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ ویرایش وب‌هوک
// =============================================
router.put('/:id', protect, checkPermission('manage_webhooks'), async (req, res) => {
  try {
    const webhook = await Webhook.findById(req.params.id);
    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'وب‌هوک یافت نشد',
      });
    }

    const { name, url, events, auth, settings, filters } = req.body;

    if (name) webhook.name = name;
    if (url) webhook.url = url;
    if (events) webhook.events = events;
    if (auth) webhook.auth = auth;
    if (settings) webhook.settings = { ...webhook.settings, ...settings };
    if (filters) webhook.filters = filters;

    await webhook.save();

    res.status(200).json({
      success: true,
      data: webhook,
      message: 'وب‌هوک با موفقیت ویرایش شد',
    });
  } catch (error) {
    console.error('❌ خطا در ویرایش وب‌هوک:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ تست وب‌هوک
// =============================================
router.post('/:id/test', protect, checkPermission('manage_webhooks'), async (req, res) => {
  try {
    const webhook = await Webhook.findById(req.params.id);
    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'وب‌هوک یافت نشد',
      });
    }

    const result = await WebhookService.testWebhook(webhook._id);

    res.status(200).json({
      success: true,
      data: result,
      message: 'تست وب‌هوک با موفقیت انجام شد',
    });
  } catch (error) {
    console.error('❌ خطا در تست وب‌هوک:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ حذف وب‌هوک
// =============================================
router.delete('/:id', protect, checkPermission('delete_webhook'), async (req, res) => {
  try {
    const webhook = await Webhook.findById(req.params.id);
    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'وب‌هوک یافت نشد',
      });
    }

    await webhook.remove();

    res.status(200).json({
      success: true,
      message: 'وب‌هوک با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('❌ خطا در حذف وب‌هوک:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
const router = require('express').Router();
const Webhook = require('../models/Webhook');
const { protect, authorize } = require('../middleware/auth');
const logAudit = require('../utils/auditLogger');
const { sendWebhook, sendToAllWebhooks } = require('../utils/webhook');

// =============================================
// دریافت لیست وب‌هوک‌ها
// =============================================
router.get('/webhooks', protect, authorize('admin'), async (req, res) => {
  try {
    const webhooks = await Webhook.find()
      .populate('createdBy', 'fullName username')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: webhooks,
      message: 'لیست وب‌هوک‌ها دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت وب‌هوک‌ها:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ایجاد وب‌هوک جدید
// =============================================
router.post('/webhooks', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, url, events, auth, settings } = req.body;

    if (!name || !url || !events || events.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'نام، آدرس و حداقل یک رویداد الزامی است',
      });
    }

    const webhook = await Webhook.create({
      name,
      url,
      events,
      auth: auth || { type: 'none' },
      settings: settings || {
        retryCount: 3,
        retryDelay: 1000,
        timeout: 5000,
        active: true,
      },
      createdBy: req.user.id,
    });

    await logAudit(req, 'CREATE', 'WEBHOOK', {
      webhookId: webhook._id,
      name: webhook.name,
      url: webhook.url,
    });

    res.status(201).json({
      success: true,
      data: webhook,
      message: 'وب‌هوک با موفقیت ایجاد شد',
    });
  } catch (error) {
    console.error('❌ خطا در ایجاد وب‌هوک:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// به‌روزرسانی وب‌هوک
// =============================================
router.put('/webhooks/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, url, events, auth, settings } = req.body;

    const webhook = await Webhook.findById(req.params.id);
    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'وب‌هوک یافت نشد',
      });
    }

    if (name) webhook.name = name;
    if (url) webhook.url = url;
    if (events) webhook.events = events;
    if (auth) webhook.auth = auth;
    if (settings) webhook.settings = { ...webhook.settings, ...settings };

    await webhook.save();

    await logAudit(req, 'UPDATE', 'WEBHOOK', {
      webhookId: webhook._id,
      name: webhook.name,
    });

    res.json({
      success: true,
      data: webhook,
      message: 'وب‌هوک با موفقیت ویرایش شد',
    });
  } catch (error) {
    console.error('❌ خطا در ویرایش وب‌هوک:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// تست وب‌هوک
// =============================================
router.post('/webhooks/:id/test', protect, authorize('admin'), async (req, res) => {
  try {
    const webhook = await Webhook.findById(req.params.id);
    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'وب‌هوک یافت نشد',
      });
    }

    const result = await sendWebhook(webhook._id, 'test', {
      message: 'این یک تست از سیستم مکاتبات است',
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: result,
      message: 'تست وب‌هوک انجام شد',
    });
  } catch (error) {
    console.error('❌ خطا در تست وب‌هوک:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// حذف وب‌هوک
// =============================================
router.delete('/webhooks/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const webhook = await Webhook.findByIdAndDelete(req.params.id);
    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'وب‌هوک یافت نشد',
      });
    }

    await logAudit(req, 'DELETE', 'WEBHOOK', {
      webhookId: webhook._id,
      name: webhook.name,
    });

    res.json({
      success: true,
      message: 'وب‌هوک با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('❌ خطا در حذف وب‌هوک:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
const router = require('express').Router();
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

// =============================================
// دریافت لیست لاگ‌ها با فیلتر (فقط ادمین)
// =============================================
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { module, action, user, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    if (module) filter.module = module;
    if (action) filter.action = action;
    if (user) filter.user = user;

    const logs = await AuditLog.find(filter)
      .populate('user', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await AuditLog.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('❌ خطا در دریافت لاگ‌ها:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// دریافت آمار لاگ‌ها (فقط ادمین)
// =============================================
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await AuditLog.aggregate([
      {
        $group: {
          _id: { module: '$module', action: '$action' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.module',
          actions: {
            $push: { action: '$_id.action', count: '$count' },
          },
          total: { $sum: '$count' },
        },
      },
    ]);

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('❌ خطا در دریافت آمار لاگ‌ها:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
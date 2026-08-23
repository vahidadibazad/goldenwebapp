// backend/src/routes/settingRoutes.js
const router = require('express').Router();
const SystemSetting = require('../models/SystemSetting');
const { protect, authorize } = require('../middleware/auth');

// =============================================
// دریافت همه تنظیمات (عمومی)
// =============================================
router.get('/', async (req, res) => {
  try {
    const settings = await SystemSetting.find();
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    res.status(200).json({ success: true, data: settingsObj });
  } catch (error) {
    console.error('❌ خطا در دریافت تنظیمات:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// به‌روزرسانی تنظیمات (فقط ادمین)
// =============================================
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    const updates = req.body;
    
    for (const [key, value] of Object.entries(updates)) {
      await SystemSetting.findOneAndUpdate(
        { key },
        {
          key,
          value,
          type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string',
          group: 'general',
          label: key,
          isActive: true,
          isSystem: true,
        },
        { upsert: true, new: true }
      );
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'تنظیمات با موفقیت ذخیره شد' 
    });
  } catch (error) {
    console.error('❌ خطا در ذخیره تنظیمات:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
const router = require('express').Router();
const MenuItem = require('../models/MenuItem');
const { protect } = require('../middleware/auth');

// GET /api/menu/items - دریافت آیتم‌های منو
router.get('/items', protect, async (req, res) => {
  try {
    // دریافت منوها از دیتابیس
    let menuItems = await MenuItem.find({ isActive: true })
      .populate('parent')
      .sort({ order: 1 });

    // اگر منویی وجود نداشت، خالی برگردان
    res.json({
      success: true,
      data: menuItems,
      message: 'منوها با موفقیت دریافت شدند'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت منوها:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
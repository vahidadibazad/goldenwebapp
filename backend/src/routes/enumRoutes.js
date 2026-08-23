const router = require('express').Router();
const EnumValue = require('../models/EnumValue');
const { protect } = require('../middleware/auth');

// دریافت EnumValueها بر اساس گروه
router.get('/:group', protect, async (req, res) => {
  try {
    const { group } = req.params;
    const enumValues = await EnumValue.find({ group, isActive: true })
      .sort({ order: 1 });
    
    res.json({
      success: true,
      data: enumValues,
      message: `EnumValueهای گروه ${group} با موفقیت دریافت شدند`
    });
  } catch (error) {
    console.error('❌ خطا در دریافت EnumValueها:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
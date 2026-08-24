// backend/src/routes/authRoutes.js
const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protect, adminOnly } = require('../middleware/auth');

// =============================================
// ✅ مسیر لاگین
// =============================================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // پیدا کردن کاربر با populate role
    const user = await User.findOne({ username })
      .select('+password')
      .populate('role');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'نام کاربری یا رمز عبور اشتباه است',
      });
    }

    // بررسی رمز عبور
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'نام کاربری یا رمز عبور اشتباه است',
      });
    }

    // تولید توکن
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '7d' }
    );

    // به‌روزرسانی آخرین ورود
    user.lastLogin = new Date();
    await user.save();

    // ✅ ارسال پاسخ با نقش کامل
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role, // نقش به همراه populate
        },
      },
      message: 'ورود با موفقیت انجام شد',
    });
  } catch (error) {
    console.error('❌ خطا در لاگین:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ دریافت اطلاعات کاربر جاری
// =============================================
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('role');
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ دریافت لیست کاربران (فقط ادمین)
// =============================================
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users,
      message: 'لیست کاربران با موفقیت دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت کاربران:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
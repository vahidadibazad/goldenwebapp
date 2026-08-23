// backend/src/routes/authRoutes.js
const router = require('express').Router();
const AuthController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { loginLimiter } = require('../config/rateLimiter');

// =============================================
// مسیرهای عمومی (بدون احراز هویت)
// =============================================

// ثبت‌نام کاربر جدید
router.post('/register', loginLimiter, AuthController.register);

// ورود کاربر
router.post('/login', loginLimiter, AuthController.login);

// تأیید ایمیل
router.get('/verify-email', AuthController.verifyEmail);

// ارسال مجدد ایمیل تأیید
router.post('/resend-verification', AuthController.resendVerificationEmail);

// درخواست بازنشانی رمز عبور
router.post('/forgot-password', AuthController.forgotPassword);

// اجرای بازنشانی رمز عبور
router.post('/reset-password', AuthController.resetPassword);

// =============================================
// مسیرهای محافظت‌شده (با احراز هویت)
// =============================================

// دریافت پروفایل کاربر
router.get('/profile', protect, AuthController.getProfile);

// به‌روزرسانی پروفایل
router.put('/profile', protect, AuthController.updateProfile);

// تغییر رمز عبور
router.put('/change-password', protect, AuthController.changePassword);

// خروج از سیستم
router.post('/logout', protect, AuthController.logout);

module.exports = router;
// backend/src/routes/digitalSignatureRoutes.js
const router = require('express').Router();
const DigitalSignatureController = require('../controllers/digitalSignatureController');
const { protect, checkPermission } = require('../middleware/auth');

// =============================================
// ✅ دریافت امضاهای در انتظار کاربر
// =============================================
router.get('/pending', protect, DigitalSignatureController.getPending);

// =============================================
// ✅ دریافت امضاهای یک نامه
// =============================================
router.get('/letter/:letterId', protect, DigitalSignatureController.getLetterSignatures);

// =============================================
// ✅ دریافت امضاهای معتبر یک نامه
// =============================================
router.get('/letter/:letterId/valid', protect, DigitalSignatureController.getValidSignatures);

// =============================================
// ✅ دریافت وضعیت یک امضا
// =============================================
router.get('/:id/status', protect, DigitalSignatureController.getStatus);

// =============================================
// ✅ ایجاد درخواست امضا
// =============================================
router.post('/request', protect, checkPermission('request_signature'), DigitalSignatureController.createRequest);

// =============================================
// ✅ شروع امضا (ارسال OTP)
// =============================================
router.post('/:id/start', protect, DigitalSignatureController.startSignature);

// =============================================
// ✅ تأیید OTP
// =============================================
router.post('/:id/verify-otp', protect, DigitalSignatureController.verifyOTP);

// =============================================
// ✅ امضای دیجیتال
// =============================================
router.post('/:id/sign', protect, checkPermission('sign_letter'), DigitalSignatureController.sign);

// =============================================
// ✅ تأیید امضا
// =============================================
router.post('/:id/verify', protect, checkPermission('verify_signature'), DigitalSignatureController.verifySignature);

// =============================================
// ✅ رد امضا
// =============================================
router.post('/:id/reject', protect, checkPermission('reject_signature'), DigitalSignatureController.rejectSignature);

module.exports = router;
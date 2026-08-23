// backend/src/routes/letterStatusRoutes.js
const router = require('express').Router();
const LetterStatusController = require('../controllers/letterStatusController');
const { protect, checkPermission } = require('../middleware/auth');

// =============================================
// ✅ دریافت کارتابل کاربر
// =============================================
router.get('/dashboard', protect, LetterStatusController.getDashboard);

// =============================================
// ✅ دریافت وضعیت یک نامه
// =============================================
router.get('/:id/status', protect, LetterStatusController.getStatus);

// =============================================
// ✅ ثبت نامه
// =============================================
router.patch('/:id/register', protect, checkPermission('create_letter'), LetterStatusController.register);

// =============================================
// ✅ ارسال برای پاراف
// =============================================
router.patch('/:id/send-review', protect, checkPermission('forward_letter'), LetterStatusController.sendForReview);

// =============================================
// ✅ تأیید پاراف
// =============================================
router.patch('/:id/approve-review', protect, checkPermission('approve_letter'), LetterStatusController.approveReview);

// =============================================
// ✅ رد پاراف
// =============================================
router.patch('/:id/reject-review', protect, checkPermission('reject_letter'), LetterStatusController.rejectReview);

// =============================================
// ✅ ارسال برای امضا
// =============================================
router.patch('/:id/send-sign', protect, checkPermission('sign_letter'), LetterStatusController.sendForSign);

// =============================================
// ✅ تکمیل امضا
// =============================================
router.patch('/:id/complete-sign', protect, checkPermission('sign_letter'), LetterStatusController.completeSign);

// =============================================
// ✅ بایگانی نامه
// =============================================
router.patch('/:id/archive', protect, checkPermission('archive_letter'), LetterStatusController.archive);

// =============================================
// ✅ بازگشت به وضعیت قبلی
// =============================================
router.patch('/:id/revert', protect, checkPermission('edit_letter'), LetterStatusController.revert);

module.exports = router;
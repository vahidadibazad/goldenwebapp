// backend/src/routes/faxRoutes.js
const router = require('express').Router();
const FaxController = require('../controllers/faxController');
const { protect, checkPermission } = require('../middleware/auth');

// =============================================
// ✅ دریافت لیست فکس‌ها
// =============================================
router.get('/', protect, FaxController.getFaxList);

// =============================================
// ✅ دریافت آمار فکس
// =============================================
router.get('/stats', protect, FaxController.getFaxStats);

// =============================================
// ✅ دریافت وضعیت فکس
// =============================================
router.get('/:id/status', protect, FaxController.getFaxStatus);

// =============================================
// ✅ ارسال فکس (با آپلود فایل)
// =============================================
router.post(
  '/send',
  protect,
  checkPermission('send_fax'),
  FaxController.uploadFax(),
  FaxController.handleUploadError,
  FaxController.sendFax
);

// =============================================
// ✅ دریافت فکس (Webhook - بدون احراز هویت)
// =============================================
router.post('/receive', FaxController.receiveFax);

// =============================================
// ✅ لغو فکس
// =============================================
router.patch('/:id/cancel', protect, FaxController.cancelFax);

module.exports = router;
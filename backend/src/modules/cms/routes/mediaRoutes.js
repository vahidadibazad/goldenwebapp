// backend/src/modules/cms/routes/mediaRoutes.js
const router = require('express').Router();
const MediaController = require('../controllers/mediaController');
const { protect, checkPermission } = require('../../../middleware/auth');

// =============================================
// آپلود فایل (با احراز هویت)
// =============================================
router.post(
  '/upload',
  protect,
  checkPermission('cms.upload_media'),
  MediaController.uploadMiddleware(),
  MediaController.handleUploadError,
  MediaController.uploadFile
);

// =============================================
// دریافت فایل‌ها
// =============================================
router.get('/', protect, checkPermission('cms.view_media'), MediaController.getMedia);
router.get('/stats', protect, checkPermission('cms.view_media'), MediaController.getMediaStats);
router.get('/:id', protect, checkPermission('cms.view_media'), MediaController.getMediaById);
router.get('/:id/download', protect, MediaController.downloadFile);

// =============================================
// مدیریت فایل‌ها
// =============================================
router.put('/:id', protect, checkPermission('cms.edit_media'), MediaController.updateMedia);
router.delete('/:id', protect, checkPermission('cms.delete_media'), MediaController.deleteMedia);

module.exports = router;
// backend/src/modules/cms/routes/tagRoutes.js
const router = require('express').Router();
const TagController = require('../controllers/tagController');
const { protect, checkPermission } = require('../../../middleware/auth');

// =============================================
// مسیرهای عمومی (بدون احراز هویت)
// =============================================

// دریافت برچسب‌ها (عمومی)
router.get('/public', TagController.getTags);
router.get('/public/popular', TagController.getPopularTags);
router.get('/public/slug/:slug', TagController.getTagBySlug);

// =============================================
// مسیرهای محافظت‌شده (با احراز هویت)
// =============================================

// مدیریت برچسب‌ها
router.get('/', protect, checkPermission('cms.view_content'), TagController.getTags);
router.get('/popular', protect, checkPermission('cms.view_content'), TagController.getPopularTags);
router.get('/:id', protect, checkPermission('cms.view_content'), TagController.getTagById);
router.post('/', protect, checkPermission('cms.create_content'), TagController.createTag);
router.put('/:id', protect, checkPermission('cms.edit_content'), TagController.updateTag);
router.delete('/:id', protect, checkPermission('cms.delete_content'), TagController.deleteTag);

// برچسب‌های یک ورودی
router.get('/:id/entries', protect, checkPermission('cms.view_content'), TagController.getEntriesByTag);
router.post('/assign', protect, checkPermission('cms.edit_content'), TagController.assignTagsToEntry);

module.exports = router;
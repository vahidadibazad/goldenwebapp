// backend/src/modules/cms/routes/contentRoutes.js
const router = require('express').Router();
const ContentController = require('../controllers/contentController');
const { protect, checkPermission } = require('../../../middleware/auth');

// =============================================
// مسیرهای عمومی (بدون احراز هویت)
// =============================================

// دریافت ورودی با اسلاگ
router.get('/public/slug', ContentController.getEntryBySlug);

// دریافت دسته‌بندی‌ها (عمومی)
router.get('/public/categories', ContentController.getCategories);

// =============================================
// مسیرهای محافظت‌شده (با احراز هویت)
// =============================================

// انواع محتوا
router.get('/content-types', protect, checkPermission('cms.view_content'), ContentController.getContentTypes);
router.post('/content-types', protect, checkPermission('cms.create_content'), ContentController.createContentType);

// ورودی‌ها
router.get('/entries', protect, checkPermission('cms.view_content'), ContentController.getEntries);
router.get('/entries/:id', protect, checkPermission('cms.view_content'), ContentController.getEntryById);
router.post('/entries', protect, checkPermission('cms.create_content'), ContentController.createEntry);
router.put('/entries/:id', protect, checkPermission('cms.edit_content'), ContentController.updateEntry);
router.patch('/entries/:id/publish', protect, checkPermission('cms.edit_content'), ContentController.publishEntry);
router.patch('/entries/:id/archive', protect, checkPermission('cms.edit_content'), ContentController.archiveEntry);
router.delete('/entries/:id', protect, checkPermission('cms.delete_content'), ContentController.deleteEntry);

// دسته‌بندی‌ها
router.get('/categories', protect, checkPermission('cms.view_content'), ContentController.getCategories);
router.post('/categories', protect, checkPermission('cms.create_content'), ContentController.createCategory);
router.put('/categories/:id', protect, checkPermission('cms.edit_content'), ContentController.updateCategory);
router.delete('/categories/:id', protect, checkPermission('cms.delete_content'), ContentController.deleteCategory);

module.exports = router;
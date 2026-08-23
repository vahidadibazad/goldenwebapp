const router = require('express').Router();
const ContentController = require('../controllers/contentController');
const CommentController = require('../controllers/commentController');
const EcommerceController = require('../controllers/ecommerceController');
const MediaController = require('../controllers/mediaController');
const TagController = require('../controllers/tagController');
const { protect, checkPermission } = require('../../../middleware/auth');

// =============================================
// مسیرهای محافظت‌شده CMS (با احراز هویت)
// =============================================

// ===== محتوا =====
router.get('/entries', protect, checkPermission('cms.view_content'), ContentController.getEntries);
router.get('/entries/:id', protect, checkPermission('cms.view_content'), ContentController.getEntryById);
router.post('/entries', protect, checkPermission('cms.create_content'), ContentController.createEntry);
router.put('/entries/:id', protect, checkPermission('cms.edit_content'), ContentController.updateEntry);
router.patch('/entries/:id/publish', protect, checkPermission('cms.publish_content'), ContentController.publishEntry);
router.patch('/entries/:id/archive', protect, checkPermission('cms.edit_content'), ContentController.archiveEntry);
router.delete('/entries/:id', protect, checkPermission('cms.delete_content'), ContentController.deleteEntry);

// ===== کامنت‌ها =====
router.get('/comments/pending', protect, checkPermission('cms.view_comments'), CommentController.getPendingComments);
router.get('/comments/stats', protect, checkPermission('cms.view_comments'), CommentController.getCommentStats);
router.patch('/comments/:id/approve', protect, checkPermission('cms.approve_comments'), CommentController.approveComment);
router.patch('/comments/:id/trash', protect, checkPermission('cms.delete_comments'), CommentController.trashComment);
router.patch('/comments/:id/spam', protect, checkPermission('cms.delete_comments'), CommentController.markAsSpam);
router.patch('/comments/:id/restore', protect, checkPermission('cms.approve_comments'), CommentController.restoreComment);
router.delete('/comments/:id', protect, checkPermission('cms.delete_comments'), CommentController.deleteComment);

// ===== محصولات =====
router.get('/products', protect, checkPermission('cms.view_products'), EcommerceController.getProducts);
router.get('/products/:id', protect, checkPermission('cms.view_products'), EcommerceController.getProductById);
router.post('/products', protect, checkPermission('cms.create_products'), EcommerceController.createProduct);
router.put('/products/:id', protect, checkPermission('cms.edit_products'), EcommerceController.updateProduct);
router.delete('/products/:id', protect, checkPermission('cms.delete_products'), EcommerceController.deleteProduct);

// ===== سفارشات =====
router.get('/orders', protect, checkPermission('cms.view_orders'), EcommerceController.getOrders);
router.get('/orders/:id', protect, checkPermission('cms.view_orders'), EcommerceController.getOrderById);
router.post('/orders', protect, checkPermission('cms.create_orders'), EcommerceController.createOrder);
router.patch('/orders/:id/status', protect, checkPermission('cms.edit_orders'), EcommerceController.updateOrderStatus);
router.patch('/orders/:id/cancel', protect, checkPermission('cms.edit_orders'), EcommerceController.cancelOrder);

// ===== فایل‌ها =====
router.post('/media/upload', protect, checkPermission('cms.upload_media'), MediaController.uploadMiddleware(), MediaController.handleUploadError, MediaController.uploadFile);
router.get('/media', protect, checkPermission('cms.view_media'), MediaController.getMedia);
router.get('/media/:id', protect, checkPermission('cms.view_media'), MediaController.getMediaById);
router.get('/media/:id/download', protect, MediaController.downloadFile);
router.put('/media/:id', protect, checkPermission('cms.edit_media'), MediaController.updateMedia);
router.delete('/media/:id', protect, checkPermission('cms.delete_media'), MediaController.deleteMedia);

// ===== دسته‌بندی‌ها =====
router.get('/categories', protect, checkPermission('cms.view_content'), ContentController.getCategories);
router.post('/categories', protect, checkPermission('cms.create_content'), ContentController.createCategory);
router.put('/categories/:id', protect, checkPermission('cms.edit_content'), ContentController.updateCategory);
router.delete('/categories/:id', protect, checkPermission('cms.delete_content'), ContentController.deleteCategory);

// ===== برچسب‌ها =====
router.get('/tags', protect, checkPermission('cms.view_content'), TagController.getTags);
router.get('/tags/popular', protect, checkPermission('cms.view_content'), TagController.getPopularTags);
router.get('/tags/:id', protect, checkPermission('cms.view_content'), TagController.getTagById);
router.post('/tags', protect, checkPermission('cms.create_content'), TagController.createTag);
router.put('/tags/:id', protect, checkPermission('cms.edit_content'), TagController.updateTag);
router.delete('/tags/:id', protect, checkPermission('cms.delete_content'), TagController.deleteTag);

module.exports = router;
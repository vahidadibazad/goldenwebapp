const router = require('express').Router();
const ContentController = require('../controllers/contentController');
const CommentController = require('../controllers/commentController');
const EcommerceController = require('../controllers/ecommerceController');
const TagController = require('../controllers/tagController');

// =============================================
// مسیرهای عمومی CMS (بدون احراز هویت)
// =============================================

// ===== محتوا =====
router.get('/entries/:slug', ContentController.getEntryBySlug);
router.get('/entries', ContentController.getEntries);
router.get('/categories', ContentController.getCategories);
router.get('/content-types', ContentController.getContentTypes);

// ===== کامنت‌ها =====
router.post('/comments', CommentController.createComment);
router.get('/comments/entry/:entryId', CommentController.getCommentsByEntry);

// ===== محصولات =====
router.get('/products', EcommerceController.getProducts);
router.get('/products/:slug', EcommerceController.getProductBySlug);

// ===== برچسب‌ها =====
router.get('/tags', TagController.getTags);
router.get('/tags/popular', TagController.getPopularTags);
router.get('/tags/:slug', TagController.getTagBySlug);

// ===== جستجو =====
router.get('/search', ContentController.searchEntries);

module.exports = router;
// backend/src/modules/cms/routes/commentRoutes.js
const router = require('express').Router();
const CommentController = require('../controllers/commentController');
const { protect, checkPermission } = require('../../../middleware/auth');

// =============================================
// مسیرهای عمومی (بدون احراز هویت)
// =============================================

// ایجاد کامنت
router.post('/public', CommentController.createComment);

// دریافت کامنت‌های یک ورودی
router.get('/public/entry/:entryId', CommentController.getCommentsByEntry);

// =============================================
// مسیرهای محافظت‌شده (با احراز هویت)
// =============================================

// مدیریت کامنت‌ها
router.get('/pending', protect, checkPermission('cms.view_comments'), CommentController.getPendingComments);
router.get('/stats', protect, checkPermission('cms.view_comments'), CommentController.getCommentStats);
router.get('/:id', protect, checkPermission('cms.view_comments'), CommentController.getCommentById);

router.patch('/:id/approve', protect, checkPermission('cms.approve_comments'), CommentController.approveComment);
router.patch('/:id/trash', protect, checkPermission('cms.delete_comments'), CommentController.trashComment);
router.patch('/:id/spam', protect, checkPermission('cms.delete_comments'), CommentController.markAsSpam);
router.patch('/:id/restore', protect, checkPermission('cms.approve_comments'), CommentController.restoreComment);
router.delete('/:id', protect, checkPermission('cms.delete_comments'), CommentController.deleteComment);

// رأی‌دهی (با احراز هویت)
router.post('/:id/upvote', protect, CommentController.upvoteComment);
router.post('/:id/downvote', protect, CommentController.downvoteComment);

module.exports = router;
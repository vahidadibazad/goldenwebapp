// backend/src/modules/cms/controllers/commentController.js
const CommentService = require('../services/commentService');
const logAudit = require('../../../utils/auditLogger');

class CommentController {

  // =============================================
  // ایجاد کامنت (عمومی)
  // =============================================

  static async createComment(req, res) {
    try {
      const { entryId, content, parentId, authorName, authorEmail, authorWebsite } = req.body;

      const comment = await CommentService.createComment(
        { entryId, content, parentId, authorName, authorEmail, authorWebsite },
        req.user?.id || null,
        req.ip || '',
        req.headers['user-agent'] || ''
      );

      res.status(201).json({
        success: true,
        data: comment,
        message: 'کامنت با موفقیت ثبت شد و در انتظار تایید است',
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // =============================================
  // دریافت کامنت‌ها (عمومی)
  // =============================================

  static async getCommentsByEntry(req, res) {
    try {
      const { entryId } = req.params;
      const { page, limit } = req.query;

      const result = await CommentService.getCommentsByEntry(entryId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });

      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getCommentById(req, res) {
    try {
      const comment = await CommentService.getCommentById(req.params.id);
      if (!comment) {
        return res.status(404).json({ success: false, error: 'کامنت یافت نشد' });
      }
      res.json({ success: true, data: comment });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // =============================================
  // مدیریت کامنت‌ها (ادمین)
  // =============================================

  static async getPendingComments(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const comments = await CommentService.getPendingComments(limit);
      res.json({ success: true, data: comments });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getCommentStats(req, res) {
    try {
      const stats = await CommentService.getCommentStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async approveComment(req, res) {
    try {
      const comment = await CommentService.approveComment(req.params.id, req.user.id);
      await logAudit(req, 'UPDATE', 'CMS_COMMENT', { commentId: comment._id, action: 'approve' });
      res.json({ success: true, data: comment, message: 'کامنت با موفقیت تأیید شد' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async trashComment(req, res) {
    try {
      const comment = await CommentService.trashComment(req.params.id);
      await logAudit(req, 'UPDATE', 'CMS_COMMENT', { commentId: comment._id, action: 'trash' });
      res.json({ success: true, data: comment, message: 'کامنت به زباله‌دان منتقل شد' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async markAsSpam(req, res) {
    try {
      const comment = await CommentService.markAsSpam(req.params.id);
      await logAudit(req, 'UPDATE', 'CMS_COMMENT', { commentId: comment._id, action: 'spam' });
      res.json({ success: true, data: comment, message: 'کامنت به عنوان اسپم علامت‌گذاری شد' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async restoreComment(req, res) {
    try {
      const comment = await CommentService.restoreComment(req.params.id);
      await logAudit(req, 'UPDATE', 'CMS_COMMENT', { commentId: comment._id, action: 'restore' });
      res.json({ success: true, data: comment, message: 'کامنت با موفقیت بازیابی شد' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async deleteComment(req, res) {
    try {
      await CommentService.deleteComment(req.params.id);
      await logAudit(req, 'DELETE', 'CMS_COMMENT', { commentId: req.params.id });
      res.json({ success: true, message: 'کامنت با موفقیت حذف شد' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // =============================================
  // رأی‌دهی
  // =============================================

  static async upvoteComment(req, res) {
    try {
      const comment = await CommentService.upvoteComment(req.params.id, req.user.id);
      res.json({ success: true, data: comment, message: 'رأی شما ثبت شد' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async downvoteComment(req, res) {
    try {
      const comment = await CommentService.downvoteComment(req.params.id, req.user.id);
      res.json({ success: true, data: comment, message: 'رأی شما ثبت شد' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

module.exports = CommentController;
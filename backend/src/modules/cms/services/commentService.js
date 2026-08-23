// backend/src/modules/cms/services/commentService.js
const Comment = require('../../models/Comment');
const Entry = require('../../models/Entry');
const NotificationService = require('../../../services/notificationService');
const CacheService = require('../../../services/cacheService');

class CommentService {

  // =============================================
  // ایجاد کامنت جدید
  // =============================================

  static async createComment(data, userId = null, ip = '', userAgent = '') {
    const { entryId, content, parentId = null, authorName, authorEmail, authorWebsite } = data;

    // بررسی وجود ورودی
    const entry = await Entry.findById(entryId);
    if (!entry) {
      throw new Error('ورودی یافت نشد');
    }

    // بررسی اینکه ورودی منتشر شده باشد
    if (entry.status !== 'published') {
      throw new Error('این ورودی منتشر نشده است');
    }

    // ساخت کامنت
    const commentData = {
      entry: entryId,
      content,
      parent: parentId || null,
      status: 'pending', // نیاز به تایید
    };

    // اگر کاربر ثبت‌نام کرده
    if (userId) {
      commentData.user = userId;
      // دریافت اطلاعات کاربر
      const User = require('../../../models/User');
      const user = await User.findById(userId);
      if (user) {
        commentData.author = {
          name: user.fullName || user.username,
          email: user.email,
          website: '',
          ip,
          userAgent,
        };
      }
    } else {
      // کاربر مهمان
      if (!authorName || !authorEmail) {
        throw new Error('نام و ایمیل برای کاربران مهمان الزامی است');
      }
      commentData.author = {
        name: authorName,
        email: authorEmail,
        website: authorWebsite || '',
        ip,
        userAgent,
      };
    }

    const comment = new Comment(commentData);
    await comment.save();

    // پاک کردن کش
    await CacheService.clearModule(`cms:comments:entry:${entryId}`);

    // اعلان به مدیران
    await this._notifyAdmins(comment, entry);

    return comment;
  }

  // =============================================
  // دریافت کامنت‌ها
  // =============================================

  static async getCommentsByEntry(entryId, options = {}) {
    const cacheKey = `cms:comments:entry:${entryId}:${JSON.stringify(options)}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const result = await Comment.getByEntry(entryId, options);
    await CacheService.set(cacheKey, result, 120);
    return result;
  }

  static async getCommentById(id) {
    const cacheKey = `cms:comment:${id}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const comment = await Comment.findById(id)
      .populate('user', 'fullName username')
      .populate('parent')
      .lean();

    if (comment) {
      await CacheService.set(cacheKey, comment, 3600);
    }
    return comment;
  }

  static async getPendingComments(limit = 50) {
    return Comment.getPending(limit);
  }

  static async getCommentStats() {
    const cacheKey = 'cms:comments:stats';
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const stats = await Comment.getStats();
    await CacheService.set(cacheKey, stats, 300);
    return stats;
  }

  // =============================================
  // مدیریت کامنت‌ها
  // =============================================

  static async approveComment(commentId, userId) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('کامنت یافت نشد');

    await comment.approve(userId);

    // پاک کردن کش
    await CacheService.delete(`cms:comment:${commentId}`);
    await CacheService.clearModule(`cms:comments:entry:${comment.entry}`);

    // اعلان به نویسنده کامنت
    await this._notifyCommentAuthor(comment);

    return comment;
  }

  static async trashComment(commentId) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('کامنت یافت نشد');

    await comment.trash();

    await CacheService.delete(`cms:comment:${commentId}`);
    await CacheService.clearModule(`cms:comments:entry:${comment.entry}`);

    return comment;
  }

  static async markAsSpam(commentId) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('کامنت یافت نشد');

    await comment.markAsSpam();

    await CacheService.delete(`cms:comment:${commentId}`);
    await CacheService.clearModule(`cms:comments:entry:${comment.entry}`);

    return comment;
  }

  static async restoreComment(commentId) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('کامنت یافت نشد');

    await comment.restore();

    await CacheService.delete(`cms:comment:${commentId}`);
    await CacheService.clearModule(`cms:comments:entry:${comment.entry}`);

    return comment;
  }

  static async deleteComment(commentId) {
    const comment = await Comment.findByIdAndDelete(commentId);
    if (!comment) throw new Error('کامنت یافت نشد');

    await CacheService.delete(`cms:comment:${commentId}`);
    await CacheService.clearModule(`cms:comments:entry:${comment.entry}`);

    return comment;
  }

  // =============================================
  // رأی‌دهی
  // =============================================

  static async upvoteComment(commentId, userId) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('کامنت یافت نشد');

    // بررسی اینکه کاربر قبلاً رأی نداده باشد
    // می‌توانید از یک مدل Vote مجزا استفاده کنید

    await comment.upvote();

    await CacheService.delete(`cms:comment:${commentId}`);

    return comment;
  }

  static async downvoteComment(commentId, userId) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('کامنت یافت نشد');

    await comment.downvote();

    await CacheService.delete(`cms:comment:${commentId}`);

    return comment;
  }

  // =============================================
  // توابع خصوصی (اعلان‌ها)
  // =============================================

  static async _notifyAdmins(comment, entry) {
    try {
      const User = require('../../../models/User');
      const admins = await User.find({ role: { $in: ['admin', 'editor'] } });

      for (const admin of admins) {
        await NotificationService.sendToUser(admin._id, {
          type: 'cms_comment',
          title: 'کامنت جدید نیاز به تایید',
          message: `کامنت جدیدی از "${comment.author.name}" در "${entry.data?.title || entry.metaData?.title}" ثبت شده است`,
          link: `/admin/comments/${comment._id}`,
          priority: 'medium',
        });
      }
    } catch (error) {
      console.error('❌ خطا در ارسال اعلان به مدیران:', error);
    }
  }

  static async _notifyCommentAuthor(comment) {
    try {
      if (comment.user) {
        await NotificationService.sendToUser(comment.user, {
          type: 'cms_comment_approved',
          title: 'کامنت شما تأیید شد',
          message: `کامنت شما در "${comment.entry?.data?.title || 'محتوای مورد نظر'}" تأیید شد`,
          link: `/entry/${comment.entry?.slug}`,
          priority: 'low',
        });
      }
    } catch (error) {
      console.error('❌ خطا در ارسال اعلان به نویسنده:', error);
    }
  }
}

module.exports = CommentService;

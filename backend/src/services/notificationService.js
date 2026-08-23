const Notification = require('../models/Notification');
const { sendNotification } = require('../../socket');

/**
 * سرویس اعلان‌های پیشرفته
 * پشتیبانی از ارسال از طریق سیستم، ایمیل و پیامک
 */
class NotificationService {
  
  // =============================================
  // ارسال اعلان به یک کاربر
  // =============================================
  static async sendToUser(userId, data) {
    try {
      const notification = await Notification.createAndDeliver({
        user: userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link || '',
        relatedId: data.relatedId || null,
        priority: data.priority || 'medium',
        deliveryMethod: data.deliveryMethod || 'system',
        metadata: data.metadata || {},
        ipAddress: data.ipAddress || '',
        userAgent: data.userAgent || '',
      });

      return notification;
    } catch (error) {
      console.error('❌ خطا در ارسال اعلان:', error);
      throw error;
    }
  }

  // =============================================
  // ارسال اعلان به چند کاربر
  // =============================================
  static async sendToUsers(userIds, data) {
    const results = [];
    for (const userId of userIds) {
      try {
        const result = await this.sendToUser(userId, data);
        results.push({ userId, success: true, notification: result });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }
    return results;
  }

  // =============================================
  // ارسال اعلان به یک نقش
  // =============================================
  static async sendToRole(roleName, data) {
    const User = require('../models/User');
    const users = await User.find({
      role: roleName,
      isActive: true,
    }).select('_id');

    const userIds = users.map(u => u._id);
    return this.sendToUsers(userIds, data);
  }

  // =============================================
  // ارسال اعلان به همه کاربران (فقط ادمین)
  // =============================================
  static async sendToAll(data) {
    const User = require('../models/User');
    const users = await User.find({ isActive: true }).select('_id');
    const userIds = users.map(u => u._id);
    return this.sendToUsers(userIds, data);
  }

  // =============================================
  // دریافت اعلان‌های یک کاربر
  // =============================================
  static async getUserNotifications(userId, options = {}) {
    return Notification.getByUser(userId, options);
  }

  // =============================================
  // دریافت تعداد اعلان‌های خوانده‌نشده
  // =============================================
  static async getUnreadCount(userId) {
    return Notification.getUnreadCount(userId);
  }

  // =============================================
  // علامت‌گذاری اعلان به عنوان خوانده شده
  // =============================================
  static async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId,
    });

    if (!notification) {
      throw new Error('اعلان یافت نشد');
    }

    return notification.markAsRead();
  }

  // =============================================
  // علامت‌گذاری همه به عنوان خوانده شده
  // =============================================
  static async markAllAsRead(userId) {
    return Notification.markAllAsRead(userId);
  }

  // =============================================
  // حذف اعلان
  // =============================================
  static async deleteNotification(notificationId, userId) {
    const result = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId,
    });

    if (!result) {
      throw new Error('اعلان یافت نشد');
    }

    return result;
  }

  // =============================================
  // حذف اعلان‌های قدیمی
  // =============================================
  static async deleteOldNotifications(days = 30) {
    return Notification.deleteOld(days);
  }

  // =============================================
  // ایجاد اعلان‌های از پیش تعریف شده
  // =============================================

  // تیکت جدید
  static async ticketCreated(ticket, userId) {
    return this.sendToUser(userId, {
      type: 'ticket_created',
      title: 'تیکت جدید ثبت شد',
      message: `تیکت "${ticket.title}" با اولویت ${ticket.priority} ثبت شد`,
      link: `/tickets/${ticket._id}`,
      relatedId: ticket._id,
      priority: 'medium',
    });
  }

  // تیکت اختصاص داده شده
  static async ticketAssigned(ticket, assignedToId) {
    return this.sendToUser(assignedToId, {
      type: 'ticket_assigned',
      title: 'تیکت به شما اختصاص داده شد',
      message: `تیکت "${ticket.title}" به شما اختصاص داده شد`,
      link: `/tickets/${ticket._id}`,
      relatedId: ticket._id,
      priority: 'high',
    });
  }

  // نامه جدید برای پاراف
  static async letterForReview(letter, reviewerId) {
    return this.sendToUser(reviewerId, {
      type: 'letter_review',
      title: 'نامه برای پاراف',
      message: `نامه "${letter.subject}" برای پاراف به شما ارسال شد`,
      link: `/letters/${letter._id}`,
      relatedId: letter._id,
      priority: 'high',
    });
  }

  // نامه امضا شد
  static async letterSigned(letter, signerId) {
    return this.sendToUser(signerId, {
      type: 'letter_signed',
      title: 'نامه با موفقیت امضا شد',
      message: `نامه "${letter.subject}" با موفقیت امضا شد`,
      link: `/letters/${letter._id}`,
      relatedId: letter._id,
      priority: 'medium',
    });
  }

  // درخواست امضا
  static async signatureRequest(signature, userId) {
    return this.sendToUser(userId, {
      type: 'signature_request',
      title: 'درخواست امضای دیجیتال',
      message: `درخواست امضای دیجیتال برای شما ارسال شده است`,
      link: `/signatures/${signature._id}`,
      relatedId: signature._id,
      priority: 'urgent',
    });
  }

  // اموال تخصیص داده شد
  static async hardwareAssigned(hardware, userId) {
    return this.sendToUser(userId, {
      type: 'hardware_assigned',
      title: 'اموال به شما تخصیص داده شد',
      message: `اموال "${hardware.name}" به شما تخصیص داده شد`,
      link: `/hardware/${hardware._id}`,
      relatedId: hardware._id,
      priority: 'medium',
    });
  }

  // اعلان سیستمی
  static async systemNotification(title, message, userId = null) {
    if (userId) {
      return this.sendToUser(userId, {
        type: 'system_notification',
        title,
        message,
        priority: 'low',
      });
    } else {
      // ارسال به همه کاربران فعال
      return this.sendToAll({
        type: 'system_notification',
        title,
        message,
        priority: 'low',
      });
    }
  }
}

module.exports = NotificationService;
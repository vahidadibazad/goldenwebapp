const User = require('../models/User');
const Notification = require('../models/Notification');

// =============================================
// بازبینی خودکار دسترسی‌ها (کاربران غیرفعال)
// =============================================
const accessReview = async () => {
  try {
    // تاریخ ۳۰ روز قبل
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // پیدا کردن کاربرانی که بیش از ۳۰ روز است وارد نشده‌اند
    const inactiveUsers = await User.find({
      lastLogin: { $lt: thirtyDaysAgo },
      isActive: true,
    });

    console.log(`🔍 بازبینی دسترسی: ${inactiveUsers.length} کاربر غیرفعال شناسایی شدند`);

    // ایجاد اعلان برای هر کاربر غیرفعال
    for (const user of inactiveUsers) {
      await Notification.create({
        user: user._id,
        type: 'access_review',
        title: '⚠️ هشدار: عدم فعالیت طولانی مدت',
        message: `شما بیش از ۳۰ روز است که وارد سیستم نشده‌اید. لطفاً برای فعال‌سازی مجدد حساب خود وارد شوید.`,
        link: '/login',
        isRead: false,
      });

      // همچنین برای ادمین‌ها اعلان ارسال کنیم
      const admins = await User.find({ role: { $in: ['admin'] } });
      for (const admin of admins) {
        await Notification.create({
          user: admin._id,
          type: 'access_review',
          title: '⚠️ کاربر غیرفعال شناسایی شد',
          message: `کاربر ${user.fullName || user.username} بیش از ۳۰ روز است وارد نشده است.`,
          link: `/users/${user._id}`,
          isRead: false,
        });
      }
    }

    return { success: true, count: inactiveUsers.length };
  } catch (error) {
    console.error('❌ خطا در بازبینی دسترسی:', error);
    return { success: false, error: error.message };
  }
};

module.exports = accessReview;
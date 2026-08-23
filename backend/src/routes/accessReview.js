const User = require('../models/User');
const Notification = require('../models/Notification');

const accessReview = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const inactiveUsers = await User.find({
    lastLogin: { $lt: thirtyDaysAgo },
    isActive: true,
  });

  for (const user of inactiveUsers) {
    await Notification.create({
      user: user._id,
      type: 'access_review',
      title: '⚠️ دسترسی غیرفعال',
      message: `کاربر ${user.fullName} بیش از ۳۰ روز وارد نشده است. بررسی شود.`,
      link: `/users/${user._id}`,
    });
  }

  console.log(`✅ بازبینی دسترسی انجام شد. ${inactiveUsers.length} کاربر غیرفعال شناسایی شدند.`);
};

module.exports = accessReview;
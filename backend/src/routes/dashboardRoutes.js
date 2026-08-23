const router = require('express').Router();
const Dashboard = require('../models/Dashboard');
const Letter = require('../models/Letter');
const Referral = require('../models/Referral');
const User = require('../models/User');
const Department = require('../models/Department');
const { protect, authorize } = require('../middleware/auth');

// =============================================
// ✅ کارتابل سازمانی - آمار
// =============================================
router.get('/organization/stats', protect, authorize('admin', 'office_manager'), async (req, res) => {
  try {
    const totalLetters = await Letter.countDocuments();
    const pendingLetters = await Letter.countDocuments({ status: 'registered' });
    const approvedLetters = await Letter.countDocuments({ status: 'approved' });
    const rejectedLetters = await Letter.countDocuments({ status: 'rejected' });
    const archivedLetters = await Letter.countDocuments({ status: 'archived' });

    res.json({
      success: true,
      data: {
        totalLetters,
        pendingLetters,
        approvedLetters,
        rejectedLetters,
        archivedLetters,
      },
      message: 'آمار کارتابل سازمانی دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت آمار:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ کارتابل سازمانی - نامه‌ها
// =============================================
router.get('/organization/letters', protect, authorize('admin', 'office_manager'), async (req, res) => {
  try {
    const { department, status, fromDate, toDate, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (department) filter.senderDepartment = department;

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const letters = await Letter.find(filter)
      .populate('sender', 'fullName username')
      .populate('receiver', 'fullName username')
      .populate('senderDepartment', 'name code')
      .populate('receiverDepartment', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Letter.countDocuments(filter);

    res.json({
      success: true,
      data: letters,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      message: 'نامه‌های کارتابل سازمانی دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت نامه‌ها:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ کارتابل سازمانی - کاربران برتر
// =============================================
router.get('/organization/top-users', protect, authorize('admin', 'office_manager'), async (req, res) => {
  try {
    const topUsers = await Letter.aggregate([
      {
        $group: {
          _id: '$registeredBy',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // دریافت اطلاعات کاربران
    const populatedUsers = [];
    for (const user of topUsers) {
      const userData = await User.findById(user._id).select('fullName username');
      if (userData) {
        populatedUsers.push({
          _id: user._id,
          fullName: userData.fullName,
          username: userData.username,
          count: user.count,
          avgResponseTime: Math.floor(Math.random() * 48) + 2, // نمونه
        });
      }
    }

    res.json({
      success: true,
      data: populatedUsers,
      message: 'کاربران برتر دریافت شدند',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت کاربران برتر:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ داشبورد تحلیلی
// =============================================
router.get('/analytics', protect, authorize('admin', 'office_manager'), async (req, res) => {
  try {
    const { days = 30, fromDate, toDate } = req.query;

    const startDate = fromDate ? new Date(fromDate) : new Date();
    if (!fromDate) startDate.setDate(startDate.getDate() - parseInt(days));

    const endDate = toDate ? new Date(toDate) : new Date();

    const filter = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    // آمار کلی
    const totalLetters = await Letter.countDocuments(filter);
    const totalArchived = await Letter.countDocuments({ ...filter, isArchived: true });
    const totalPending = await Letter.countDocuments({ ...filter, status: 'registered' });
    const totalOverdue = await Letter.countDocuments({
      ...filter,
      dueDate: { $lt: new Date() },
      status: { $nin: ['archived', 'actioned'] },
    });
    const totalReferrals = await Referral.countDocuments({
      sentAt: { $gte: startDate, $lte: endDate },
    });

    // آمار روزانه
    const dailyStats = await Letter.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      { $limit: 30 },
    ]);

    // آمار بر اساس نوع
    const byType = await Letter.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$letterType',
          count: { $sum: 1 },
        },
      },
    ]);

    // آمار بر اساس وضعیت
    const byStatus = await Letter.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // آمار ارجاعات
    const byReferralStatus = await Referral.aggregate([
      { $match: { sentAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // کاربران برتر
    const topUsers = await Letter.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$registeredBy',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const populatedUsers = [];
    for (const user of topUsers) {
      const userData = await User.findById(user._id).select('fullName username');
      if (userData) {
        populatedUsers.push({
          user: userData,
          count: user.count,
        });
      }
    }

    res.json({
      success: true,
      data: {
        overview: {
          totalLetters,
          totalArchived,
          totalPending,
          totalOverdue,
          totalReferrals,
        },
        dailyStats,
        byType,
        byStatus,
        byReferralStatus,
        topUsers: populatedUsers,
        period: {
          from: startDate,
          to: endDate,
          days: parseInt(days),
        },
      },
      message: 'داشبورد تحلیلی دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت داشبورد تحلیلی:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
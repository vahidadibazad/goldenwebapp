const router = require('express').Router();
const Report = require('../models/Report');
const Letter = require('../models/Letter');
const Referral = require('../models/Referral');
const { protect, authorize } = require('../middleware/auth');
const logAudit = require('../utils/auditLogger');

// =============================================
// دریافت لیست گزارش‌ها
// =============================================
router.get('/', protect, authorize('admin', 'office_manager'), async (req, res) => {
  try {
    const { type, status, category, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (category) filter.category = category;
    
    const reports = await Report.find(filter)
      .populate('createdBy', 'fullName username')
      .populate('filters.secretariat', 'name code')
      .populate('recipients.user', 'fullName username')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    
    const total = await Report.countDocuments(filter);
    
    res.json({
      success: true,
      data: reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      message: 'لیست گزارش‌ها دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت گزارش‌ها:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// دریافت یک گزارش با ID
// =============================================
router.get('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('createdBy', 'fullName username')
      .populate('updatedBy', 'fullName username')
      .populate('filters.secretariat', 'name code')
      .populate('filters.department', 'name code')
      .populate('recipients.user', 'fullName username email');
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'گزارش یافت نشد',
      });
    }
    
    res.json({
      success: true,
      data: report,
      message: 'اطلاعات گزارش دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت گزارش:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ایجاد گزارش جدید
// =============================================
router.post('/', protect, authorize('admin', 'office_manager'), async (req, res) => {
  try {
    const {
      name,
      type,
      category = 'monthly',
      dateRange,
      filters,
      columns,
      exportFormat = 'excel',
      schedule,
      recipients,
    } = req.body;
    
    // اعتبارسنجی
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'نام و نوع گزارش الزامی است',
      });
    }
    
    // تولید کد یکتا
    const code = `RPT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
    
    // ✅ ستون‌های پیش‌فرض
    const defaultColumns = getDefaultColumns(type);
    
    const report = await Report.create({
      name,
      code,
      type,
      category: category || 'monthly',
      dateRange: dateRange || { from: null, to: null },
      filters: filters || {
        letterType: 'all',
        status: 'all',
        classification: 'all',
        priority: 'all',
      },
      columns: columns || defaultColumns,
      exportFormat: exportFormat || 'excel',
      schedule: schedule || { enabled: false },
      recipients: recipients || [],
      createdBy: req.user.id,
      status: 'draft',
    });
    
    await logAudit(req, 'CREATE', 'REPORT', {
      reportId: report._id,
      name: report.name,
      type: report.type,
    });
    
    res.status(201).json({
      success: true,
      data: report,
      message: 'گزارش با موفقیت ایجاد شد',
    });
  } catch (error) {
    console.error('❌ خطا در ایجاد گزارش:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ✅ تابع کمکی برای ستون‌های پیش‌فرض
// =============================================
function getDefaultColumns(type) {
  const baseColumns = [
    { key: 'number', label: 'شماره', visible: true, order: 1 },
    { key: 'subject', label: 'موضوع', visible: true, order: 2 },
    { key: 'letterType', label: 'نوع', visible: true, order: 3 },
    { key: 'status', label: 'وضعیت', visible: true, order: 4 },
    { key: 'sender', label: 'فرستنده', visible: true, order: 5 },
    { key: 'receiver', label: 'گیرنده', visible: true, order: 6 },
    { key: 'letterDate', label: 'تاریخ', visible: true, order: 7 },
  ];
  
  if (type === 'performance') {
    baseColumns.push(
      { key: 'referralCount', label: 'تعداد ارجاع', visible: true, order: 8 },
      { key: 'responseTime', label: 'زمان پاسخ', visible: true, order: 9 }
    );
  }
  
  if (type === 'delay') {
    baseColumns.push(
      { key: 'dueDate', label: 'سررسید', visible: true, order: 8 },
      { key: 'delayDays', label: 'روز تأخیر', visible: true, order: 9 }
    );
  }
  
  return baseColumns;
}

// =============================================
// تولید گزارش
// =============================================
router.post('/:id/generate', protect, authorize('admin', 'office_manager'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'گزارش یافت نشد',
      });
    }
    
    await report.generate();
    report.updatedBy = req.user.id;
    await report.save();
    
    await logAudit(req, 'UPDATE', 'REPORT', {
      reportId: report._id,
      action: 'generate',
    });
    
    res.json({
      success: true,
      data: report,
      message: 'گزارش با موفقیت تولید شد',
    });
  } catch (error) {
    console.error('❌ خطا در تولید گزارش:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// دریافت داشبورد تحلیلی
// =============================================
router.get('/dashboard/analytics', protect, async (req, res) => {
  try {
    const { secretariatId, days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const filter = {
      createdAt: { $gte: startDate },
    };
    if (secretariatId) filter.secretariat = secretariatId;
    
    // =============================================
    // ۱. آمار کلی
    // =============================================
    const totalLetters = await Letter.countDocuments(filter);
    const totalArchived = await Letter.countDocuments({ ...filter, isArchived: true });
    const totalPending = await Letter.countDocuments({ ...filter, status: 'registered' });
    const totalOverdue = await Letter.countDocuments({
      ...filter,
      dueDate: { $lt: new Date() },
      status: { $nin: ['archived', 'actioned'] },
    });
    
    // =============================================
    // ۲. آمار روزانه
    // =============================================
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
    ]);
    
    // =============================================
    // ۳. آمار بر اساس نوع
    // =============================================
    const typeStats = await Letter.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$letterType',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // =============================================
    // ۴. آمار بر اساس وضعیت
    // =============================================
    const statusStats = await Letter.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // =============================================
    // ۵. آمار ارجاعات
    // =============================================
    const referralStats = await Referral.aggregate([
      { $match: { sentAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // =============================================
    // ۶. برترین کاربران
    // =============================================
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
    
    // populate کاربران
    const User = require('../models/User');
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
          totalReferrals: referralStats.reduce((sum, r) => sum + r.count, 0),
        },
        dailyStats,
        byType: typeStats,
        byStatus: statusStats,
        byReferralStatus: referralStats,
        topUsers: populatedUsers,
        period: {
          from: startDate,
          to: new Date(),
          days: parseInt(days),
        },
      },
      message: 'داشبورد تحلیلی دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت داشبورد:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ویرایش گزارش
// =============================================
router.put('/:id', protect, authorize('admin', 'office_manager'), async (req, res) => {
  try {
    const {
      name,
      category,
      dateRange,
      filters,
      columns,
      exportFormat,
      schedule,
      recipients,
    } = req.body;
    
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'گزارش یافت نشد',
      });
    }
    
    // به‌روزرسانی
    if (name) report.name = name;
    if (category) report.category = category;
    if (dateRange) report.dateRange = dateRange;
    if (filters) report.filters = { ...report.filters, ...filters };
    if (columns) report.columns = columns;
    if (exportFormat) report.exportFormat = exportFormat;
    if (schedule) report.schedule = { ...report.schedule, ...schedule };
    if (recipients) report.recipients = recipients;
    
    report.updatedBy = req.user.id;
    report.status = 'draft';
    
    await report.save();
    
    await logAudit(req, 'UPDATE', 'REPORT', {
      reportId: report._id,
      name: report.name,
      changes: req.body,
    });
    
    res.json({
      success: true,
      data: report,
      message: 'گزارش با موفقیت ویرایش شد',
    });
  } catch (error) {
    console.error('❌ خطا در ویرایش گزارش:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// حذف گزارش
// =============================================
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'گزارش یافت نشد',
      });
    }
    
    await logAudit(req, 'DELETE', 'REPORT', {
      reportId: report._id,
      name: report.name,
    });
    
    await report.deleteOne();
    
    res.json({
      success: true,
      message: 'گزارش با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('❌ خطا در حذف گزارش:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// خروجی گرفتن از گزارش
// =============================================
router.get('/:id/export', protect, async (req, res) => {
  try {
    const { format = 'excel' } = req.query;
    
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'گزارش یافت نشد',
      });
    }
    
    if (report.status !== 'generated' || !report.data) {
      return res.status(400).json({
        success: false,
        error: 'گزارش هنوز تولید نشده است. ابتدا گزارش را تولید کنید.',
      });
    }
    
    res.json({
      success: true,
      data: report.data,
      stats: report.stats,
      format,
      message: `داده‌های گزارش برای خروجی ${format} آماده است`,
    });
  } catch (error) {
    console.error('❌ خطا در خروجی گزارش:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
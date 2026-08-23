const router = require('express').Router();
const Archive = require('../models/Archive');
const Letter = require('../models/Letter');
const { protect, authorize } = require('../middleware/auth');
const logAudit = require('../utils/auditLogger');

// =============================================
// دریافت لیست بایگانی‌ها
// =============================================
router.get('/', protect, async (req, res) => {
  try {
    const { secretariatId, type, category, parent, tree = 'false' } = req.query;
    
    if (tree === 'true' && secretariatId) {
      const fullTree = await Archive.getFullTree(secretariatId);
      return res.json({
        success: true,
        data: fullTree,
        message: 'ساختار درختی بایگانی دریافت شد',
      });
    }
    
    const filter = {};
    if (secretariatId) filter.secretariat = secretariatId;
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (parent) filter.parent = parent;
    
    const archives = await Archive.find(filter)
      .populate('secretariat', 'name code')
      .populate('manager', 'fullName username')
      .populate('parent', 'name code')
      .sort({ type: 1, name: 1 });
    
    res.json({
      success: true,
      data: archives,
      message: 'لیست بایگانی‌ها دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت بایگانی‌ها:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// دریافت یک بایگانی با ID
// =============================================
router.get('/:id', protect, async (req, res) => {
  try {
    const archive = await Archive.findById(req.params.id)
      .populate('secretariat', 'name code')
      .populate('manager', 'fullName username')
      .populate('parent', 'name code');
    
    if (!archive) {
      return res.status(404).json({
        success: false,
        error: 'بایگانی یافت نشد',
      });
    }
    
    // دریافت نامه‌های بایگانی
    const letters = await archive.getLetters();
    
    res.json({
      success: true,
      data: {
        ...archive.toObject(),
        letters,
      },
      message: 'اطلاعات بایگانی دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت بایگانی:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ایجاد بایگانی جدید
// =============================================
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      name,
      code,
      type = 'active',
      secretariat,
      parent,
      category = 'general',
      yearFrom,
      yearTo,
      settings,
      manager,
    } = req.body;
    
    // اعتبارسنجی
    if (!name || !code || !secretariat) {
      return res.status(400).json({
        success: false,
        error: 'نام، کد و دبیرخانه الزامی است',
      });
    }
    
    // بررسی تکراری نبودن کد
    const existing = await Archive.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'بایگانی با این کد قبلاً ثبت شده است',
      });
    }
    
    const archive = await Archive.create({
      name,
      code: code.toUpperCase(),
      type,
      secretariat,
      parent: parent || null,
      category,
      yearFrom: yearFrom || null,
      yearTo: yearTo || null,
      settings: settings || {
        allowDelete: false,
        allowEdit: true,
        requireApproval: true,
        retentionPeriod: 365,
      },
      manager: manager || req.user.id,
      createdBy: req.user.id,
      isActive: true,
    });
    
    await logAudit(req, 'CREATE', 'ARCHIVE', {
      archiveId: archive._id,
      name: archive.name,
      code: archive.code,
    });
    
    res.status(201).json({
      success: true,
      data: archive,
      message: 'بایگانی با موفقیت ایجاد شد',
    });
  } catch (error) {
    console.error('❌ خطا در ایجاد بایگانی:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ویرایش بایگانی
// =============================================
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      name,
      type,
      parent,
      category,
      yearFrom,
      yearTo,
      settings,
      manager,
      isActive,
    } = req.body;
    
    const archive = await Archive.findById(req.params.id);
    if (!archive) {
      return res.status(404).json({
        success: false,
        error: 'بایگانی یافت نشد',
      });
    }
    
    // به‌روزرسانی
    if (name) archive.name = name;
    if (type) archive.type = type;
    if (parent !== undefined) archive.parent = parent;
    if (category) archive.category = category;
    if (yearFrom) archive.yearFrom = yearFrom;
    if (yearTo) archive.yearTo = yearTo;
    if (settings) archive.settings = { ...archive.settings, ...settings };
    if (manager) archive.manager = manager;
    if (isActive !== undefined) archive.isActive = isActive;
    
    await archive.save();
    
    await logAudit(req, 'UPDATE', 'ARCHIVE', {
      archiveId: archive._id,
      name: archive.name,
      changes: req.body,
    });
    
    res.json({
      success: true,
      data: archive,
      message: 'بایگانی با موفقیت ویرایش شد',
    });
  } catch (error) {
    console.error('❌ خطا در ویرایش بایگانی:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// انتقال نامه به بایگانی
// =============================================
router.post('/:id/move', protect, async (req, res) => {
  try {
    const { letterIds } = req.body;
    
    if (!letterIds || letterIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'حداقل یک نامه برای انتقال انتخاب کنید',
      });
    }
    
    const archive = await Archive.findById(req.params.id);
    if (!archive) {
      return res.status(404).json({
        success: false,
        error: 'بایگانی یافت نشد',
      });
    }
    
    const letters = await Letter.find({ _id: { $in: letterIds } });
    let movedCount = 0;
    
    for (const letter of letters) {
      // به‌روزرسانی اطلاعات بایگانی نامه
      letter.isArchived = true;
      letter.archiveType = archive.type;
      letter.archivedAt = new Date();
      letter.archivedBy = req.user.id;
      letter.status = 'archived';
      letter.metadata = letter.metadata || {};
      letter.metadata.archiveId = archive._id;
      letter.metadata.archiveName = archive.name;
      
      await letter.addTracking('archived', req.user.id, `انتقال به بایگانی ${archive.name}`);
      await letter.save();
      movedCount++;
    }
    
    // به‌روزرسانی آمار بایگانی
    archive.stats.totalLetters = (archive.stats.totalLetters || 0) + movedCount;
    archive.stats.lastUpdate = new Date();
    await archive.save();
    
    await logAudit(req, 'UPDATE', 'ARCHIVE', {
      archiveId: archive._id,
      action: 'move_letters',
      count: movedCount,
    });
    
    res.json({
      success: true,
      data: {
        archive,
        movedCount,
      },
      message: `${movedCount} نامه با موفقیت به بایگانی منتقل شد`,
    });
  } catch (error) {
    console.error('❌ خطا در انتقال نامه به بایگانی:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// جستجو در بایگانی
// =============================================
router.get('/search', protect, async (req, res) => {
  try {
    const { q, secretariatId, type, fromDate, toDate } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'عبارت جستجو الزامی است',
      });
    }
    
    // جستجو در بایگانی‌ها
    const archives = await Archive.search(q, secretariatId);
    
    // جستجو در نامه‌های بایگانی شده
    const letterFilter = {
      isArchived: true,
      $or: [
        { subject: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { number: { $regex: q, $options: 'i' } },
        { summary: { $regex: q, $options: 'i' } },
      ],
    };
    
    if (secretariatId) letterFilter['secretariat'] = secretariatId;
    if (type) letterFilter.archiveType = type;
    
    if (fromDate || toDate) {
      letterFilter.letterDate = {};
      if (fromDate) letterFilter.letterDate.$gte = new Date(fromDate);
      if (toDate) letterFilter.letterDate.$lte = new Date(toDate);
    }
    
    const letters = await Letter.find(letterFilter)
      .populate('sender', 'fullName username')
      .populate('receiver', 'fullName username')
      .populate('secretariat', 'name code')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      data: {
        archives,
        letters,
        totalLetters: letters.length,
      },
      message: 'نتایج جستجو در بایگانی',
    });
  } catch (error) {
    console.error('❌ خطا در جستجوی بایگانی:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// دریافت آمار بایگانی
// =============================================
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const { secretariatId } = req.query;
    
    const stats = await Archive.getStats(secretariatId);
    
    // دریافت آمار بر اساس سال
    const yearStats = await Letter.aggregate([
      { 
        $match: { 
          isArchived: true,
          ...(secretariatId ? { secretariat: secretariatId } : {}),
        } 
      },
      {
        $group: {
          _id: { $year: '$letterDate' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);
    
    res.json({
      success: true,
      data: {
        ...stats,
        byYear: yearStats,
      },
      message: 'آمار بایگانی دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت آمار بایگانی:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// حذف بایگانی
// =============================================
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const archive = await Archive.findById(req.params.id);
    if (!archive) {
      return res.status(404).json({
        success: false,
        error: 'بایگانی یافت نشد',
      });
    }
    
    // بررسی وجود نامه
    const letterCount = await Letter.countDocuments({
      'metadata.archiveId': archive._id,
    });
    
    if (letterCount > 0) {
      return res.status(400).json({
        success: false,
        error: `این بایگانی شامل ${letterCount} نامه است. ابتدا نامه‌ها را انتقال دهید.`,
      });
    }
    
    await logAudit(req, 'DELETE', 'ARCHIVE', {
      archiveId: archive._id,
      name: archive.name,
    });
    
    await archive.deleteOne();
    
    res.json({
      success: true,
      message: 'بایگانی با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('❌ خطا در حذف بایگانی:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
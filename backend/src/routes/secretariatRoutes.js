const router = require('express').Router();
const Secretariat = require('../models/Secretariat');
const Letter = require('../models/Letter');
const LetterNumbering = require('../models/LetterNumbering');
const { protect, authorize } = require('../middleware/auth');
const logAudit = require('../utils/auditLogger');

// =============================================
// دریافت لیست دبیرخانه‌ها
// =============================================
router.get('/', protect, async (req, res) => {
  try {
    const { type, department, active = 'true' } = req.query;
    
    const filter = {};
    if (active === 'true') filter.isActive = true;
    if (type) filter.type = type;
    if (department) filter.departments = department;
    
    const secretariats = await Secretariat.find(filter)
      .populate('manager', 'fullName username')
      .populate('staff', 'fullName username')
      .populate('departments', 'name code')
      .sort({ type: 1, name: 1 });
    
    res.json({
      success: true,
      data: secretariats,
      message: 'لیست دبیرخانه‌ها دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت دبیرخانه‌ها:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// دریافت یک دبیرخانه با ID
// =============================================
router.get('/:id', protect, async (req, res) => {
  try {
    const secretariat = await Secretariat.findById(req.params.id)
      .populate('manager', 'fullName username email')
      .populate('staff', 'fullName username')
      .populate('departments', 'name code');
    
    if (!secretariat) {
      return res.status(404).json({
        success: false,
        error: 'دبیرخانه یافت نشد',
      });
    }
    
    // دریافت آمار
    const stats = await Letter.getStats(req.params.id);
    
    res.json({
      success: true,
      data: {
        ...secretariat.toObject(),
        stats,
      },
      message: 'اطلاعات دبیرخانه دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت دبیرخانه:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ایجاد دبیرخانه جدید (فقط ادمین)
// =============================================
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      name,
      code,
      type,
      parent,
      manager,
      staff,
      departments,
      settings,
    } = req.body;
    
    // بررسی تکراری نبودن کد
    const existing = await Secretariat.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'دبیرخانه با این کد قبلاً ثبت شده است',
      });
    }
    
    const secretariat = await Secretariat.create({
      name,
      code: code.toUpperCase(),
      type: type || 'main',
      parent: parent || null,
      manager,
      staff: staff || [],
      departments: departments || [],
      settings: settings || {
        autoNumbering: true,
        requireSignature: true,
        maxReferralLevel: 5,
        defaultPriority: 'medium',
      },
      isActive: true,
    });
    
    await logAudit(req, 'CREATE', 'SECRETARIAT', {
      secretariatId: secretariat._id,
      name: secretariat.name,
      code: secretariat.code,
    });
    
    res.status(201).json({
      success: true,
      data: secretariat,
      message: 'دبیرخانه با موفقیت ایجاد شد',
    });
  } catch (error) {
    console.error('❌ خطا در ایجاد دبیرخانه:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ویرایش دبیرخانه (فقط ادمین)
// =============================================
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      name,
      type,
      parent,
      manager,
      staff,
      departments,
      settings,
      isActive,
    } = req.body;
    
    const secretariat = await Secretariat.findById(req.params.id);
    if (!secretariat) {
      return res.status(404).json({
        success: false,
        error: 'دبیرخانه یافت نشد',
      });
    }
    
    // به‌روزرسانی
    if (name) secretariat.name = name;
    if (type) secretariat.type = type;
    if (parent !== undefined) secretariat.parent = parent;
    if (manager) secretariat.manager = manager;
    if (staff) secretariat.staff = staff;
    if (departments) secretariat.departments = departments;
    if (settings) secretariat.settings = settings;
    if (isActive !== undefined) secretariat.isActive = isActive;
    
    await secretariat.save();
    
    await logAudit(req, 'UPDATE', 'SECRETARIAT', {
      secretariatId: secretariat._id,
      name: secretariat.name,
      changes: req.body,
    });
    
    res.json({
      success: true,
      data: secretariat,
      message: 'دبیرخانه با موفقیت ویرایش شد',
    });
  } catch (error) {
    console.error('❌ خطا در ویرایش دبیرخانه:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// حذف دبیرخانه (فقط ادمین)
// =============================================
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const secretariat = await Secretariat.findById(req.params.id);
    if (!secretariat) {
      return res.status(404).json({
        success: false,
        error: 'دبیرخانه یافت نشد',
      });
    }
    
    // بررسی وجود نامه‌ها
    const letterCount = await Letter.countDocuments({ secretariat: secretariat._id });
    if (letterCount > 0) {
      return res.status(400).json({
        success: false,
        error: `این دبیرخانه دارای ${letterCount} نامه است. ابتدا نامه‌ها را انتقال دهید.`,
      });
    }
    
    await logAudit(req, 'DELETE', 'SECRETARIAT', {
      secretariatId: secretariat._id,
      name: secretariat.name,
    });
    
    await secretariat.deleteOne();
    
    res.json({
      success: true,
      message: 'دبیرخانه با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('❌ خطا در حذف دبیرخانه:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
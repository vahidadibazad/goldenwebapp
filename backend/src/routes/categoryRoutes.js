const router = require('express').Router();
const Category = require('../models/Category');
const { protect, authorize } = require('../middleware/auth');
const logAudit = require('../utils/auditLogger');

// =============================================
// دریافت دسته‌بندی‌های یک ماژول خاص (با پشتیبانی از داده‌های قدیمی)
// =============================================
router.get('/:module', async (req, res) => {
  try {
    const { module } = req.params;
    
    // پیدا کردن دسته‌بندی‌هایی که ماژول آنها برابر با module است
    // یا دسته‌بندی‌هایی که ماژول ندارند (قدیمی) و همه‌ی آنها را نمایش بده
    const categories = await Category.find({
      $or: [
        { module: module },
        { module: { $exists: false } }  // دسته‌بندی‌های قدیمی که ماژول ندارند
      ]
    }).sort({ name: 1 });
    
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// دریافت همه دسته‌بندی‌ها (بدون فیلتر)
// =============================================
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// دریافت یک دسته‌بندی با ID
// =============================================
router.get('/item/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'دسته‌بندی یافت نشد' });
    }
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ایجاد دسته‌بندی جدید (فقط ادمین)
// =============================================
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, module, description, icon, color } = req.body;
    
    // اگر ماژول ارسال نشده، از مقدار پیش‌فرض استفاده کن
    const moduleValue = module || 'hardware';
    
    const existing = await Category.findOne({ name, module: moduleValue });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'این دسته‌بندی برای این ماژول قبلاً ثبت شده است',
      });
    }
    
    const category = await Category.create({
      name,
      module: moduleValue,
      description: description || '',
      icon: icon || '📁',
      color: color || '#64748b',
      createdBy: req.user.id,
    });
    
    await logAudit(req, 'CREATE', 'CATEGORY', {
      categoryId: category._id,
      name: category.name,
      module: category.module,
    });
    
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================
// ویرایش دسته‌بندی
// =============================================
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, description, icon, color, module } = req.body;
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'دسته‌بندی یافت نشد' });
    }
    
    // اگر ماژول ارسال شده، آن را به‌روز کن
    if (module) {
      category.module = module;
    }
    
    category.name = name;
    category.description = description || '';
    category.icon = icon || '📁';
    category.color = color || '#64748b';
    await category.save();
    
    await logAudit(req, 'UPDATE', 'CATEGORY', {
      categoryId: category._id,
      name: category.name,
    });
    
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================
// حذف دسته‌بندی
// =============================================
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'دسته‌بندی یافت نشد' });
    }
    
    await logAudit(req, 'DELETE', 'CATEGORY', {
      categoryId: category._id,
      name: category.name,
    });
    
    res.status(200).json({ success: true, message: 'دسته‌بندی با موفقیت حذف شد' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
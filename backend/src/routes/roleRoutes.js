const router = require('express').Router();
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const { protect, authorize } = require('../middleware/auth');
const logAudit = require('../utils/auditLogger');

// =============================================
// دریافت لیست نقش‌ها (دسترسی عمومی)
// =============================================
router.get('/', async (req, res) => {
  try {
    const roles = await Role.find().populate('permissions', 'name label module');
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// دریافت یک نقش با ID (دسترسی عمومی)
// =============================================
router.get('/:id', async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate('permissions', 'name label module');
    if (!role) {
      return res.status(404).json({ success: false, error: 'نقش یافت نشد' });
    }
    res.status(200).json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// دریافت لیست مجوزها (دسترسی عمومی)
// =============================================
router.get('/permissions/list', async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ module: 1, name: 1 });
    res.status(200).json({ success: true, data: permissions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// دریافت مجوزهای یک نقش (دسترسی عمومی)
// =============================================
router.get('/:id/permissions', async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate('permissions');
    if (!role) {
      return res.status(404).json({ success: false, error: 'نقش یافت نشد' });
    }
    res.status(200).json({ success: true, data: role.permissions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ایجاد نقش جدید (فقط ادمین)
// =============================================
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, label, permissions, description } = req.body;
    
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ success: false, error: 'نقشی با این نام قبلاً ثبت شده است' });
    }
    
    const role = await Role.create({
      name,
      label,
      permissions: permissions || [],
      description: description || '',
      isSystem: false,
    });
    
    await logAudit(req, 'CREATE', 'ROLE', {
      roleId: role._id,
      name: role.name,
    });
    
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================
// ویرایش نقش (فقط ادمین)
// =============================================
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, label, permissions, description } = req.body;
    
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, error: 'نقش یافت نشد' });
    }
    
    if (role.isSystem && name !== role.name) {
      return res.status(400).json({ success: false, error: 'نقش‌های سیستمی قابل تغییر نام نیستند' });
    }
    
    role.name = name;
    role.label = label;
    role.permissions = permissions || [];
    role.description = description || '';
    await role.save();
    
    await logAudit(req, 'UPDATE', 'ROLE', {
      roleId: role._id,
      name: role.name,
    });
    
    res.status(200).json({ success: true, data: role });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================
// حذف نقش (فقط ادمین)
// =============================================
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, error: 'نقش یافت نشد' });
    }
    
    if (role.isSystem) {
      return res.status(400).json({ success: false, error: 'نقش‌های سیستمی قابل حذف نیستند' });
    }
    
    const User = require('../models/User');
    const usersWithRole = await User.countDocuments({ role: role._id });
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        error: `این نقش به ${usersWithRole} کاربر اختصاص داده شده است. ابتدا نقش کاربران را تغییر دهید.`
      });
    }
    
    await role.deleteOne();
    
    await logAudit(req, 'DELETE', 'ROLE', {
      roleId: role._id,
      name: role.name,
    });
    
    res.status(200).json({ success: true, message: 'نقش با موفقیت حذف شد' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
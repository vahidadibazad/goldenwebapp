const router = require('express').Router();
const Department = require('../models/Department');
const User = require('../models/User');
const { protect, authorize, checkPermission } = require('../middleware/auth');
const logAudit = require('../utils/auditLogger');
const CacheService = require('../services/cacheService');

// =============================================
// دریافت لیست واحدها (با کش)
// =============================================
router.get('/', protect, async (req, res) => {
  try {
    const { tree, active, search, level, parent } = req.query;

    const cacheKey = `dept:list:${JSON.stringify({ tree, active, search, level, parent })}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true,
        message: 'لیست واحدها از کش دریافت شد'
      });
    }

    let departments;

    if (tree === 'true') {
      departments = await Department.getOrganizationTree();
    } else if (search) {
      departments = await Department.search(search);
    } else if (active === 'true' || !active) {
      departments = await Department.getActive();
    } else {
      const filter = {};
      if (active === 'false') filter.isActive = false;
      if (level) filter.level = parseInt(level);
      if (parent) filter.parent = parent;

      departments = await Department.find(filter)
        .populate('parent', 'name code')
        .populate('manager', 'fullName username')
        .populate('deputy', 'fullName username')
        .sort({ level: 1, name: 1 });
    }

    await CacheService.set(cacheKey, departments, 600);

    res.json({
      success: true,
      data: departments,
      fromCache: false,
      message: 'لیست واحدها دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت واحدها:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// دریافت یک واحد با ID (با کش)
// =============================================
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const cacheKey = `dept:${id}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true,
        message: 'اطلاعات واحد از کش دریافت شد'
      });
    }

    const department = await Department.findById(id)
      .populate('parent', 'name code')
      .populate('manager', 'fullName username email')
      .populate('deputy', 'fullName username email')
      .populate('defaultWorkflows', 'name type');

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'واحد یافت نشد'
      });
    }

    const stats = await department.getStats();
    const result = {
      ...department.toObject(),
      stats
    };

    await CacheService.set(cacheKey, result, 3600);

    res.json({
      success: true,
      data: result,
      fromCache: false,
      message: 'اطلاعات واحد با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت واحد:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// دریافت کاربران یک واحد (با کش)
// =============================================
router.get('/:id/users', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const cacheKey = `dept:${id}:users`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true,
        message: 'کاربران واحد از کش دریافت شدند'
      });
    }

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'واحد یافت نشد'
      });
    }

    const users = await User.getUsersByDepartment(department._id);

    await CacheService.set(cacheKey, users, 600);

    res.json({
      success: true,
      data: users,
      fromCache: false,
      message: 'کاربران واحد با موفقیت دریافت شدند'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت کاربران واحد:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// ایجاد واحد جدید (با پاک کردن کش)
// =============================================
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      name,
      code,
      nameEn,
      description,
      parent,
      manager,
      deputy,
      color,
      icon,
      signingLimit,
      reminderSettings,
      defaultWorkflows,
    } = req.body;

    const existingName = await Department.findOne({ name });
    if (existingName) {
      return res.status(400).json({
        success: false,
        error: 'واحد با این نام قبلاً ثبت شده است'
      });
    }

    const existingCode = await Department.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        error: 'واحد با این کد قبلاً ثبت شده است'
      });
    }

    const department = new Department({
      name,
      code: code.toUpperCase(),
      nameEn: nameEn || '',
      description: description || '',
      parent: parent || null,
      manager: manager || null,
      deputy: deputy || null,
      color: color || '#1677ff',
      icon: icon || '🏢',
      signingLimit: signingLimit || 0,
      reminderSettings: reminderSettings || {
        daysBefore: [5, 3, 1, 0],
        methods: { sms: false, email: false, system: true }
      },
      defaultWorkflows: defaultWorkflows || [],
      isActive: true,
    });

    await department.save();

    await logAudit(req, 'CREATE', 'DEPARTMENT', {
      departmentId: department._id,
      name: department.name,
      code: department.code,
    });

    // پاک کردن کش
    await CacheService.clearModule('dept:');
    await CacheService.clearStats();

    res.status(201).json({
      success: true,
      data: department,
      message: 'واحد با موفقیت ایجاد شد'
    });
  } catch (error) {
    console.error('❌ خطا در ایجاد واحد:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// ویرایش واحد (با پاک کردن کش)
// =============================================
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      nameEn,
      description,
      parent,
      manager,
      deputy,
      color,
      icon,
      signingLimit,
      reminderSettings,
      defaultWorkflows,
      isActive,
    } = req.body;

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'واحد یافت نشد'
      });
    }

    if (name && name !== department.name) {
      const existingName = await Department.findOne({ name });
      if (existingName) {
        return res.status(400).json({
          success: false,
          error: 'واحد با این نام قبلاً ثبت شده است'
        });
      }
    }

    if (code && code !== department.code) {
      const existingCode = await Department.findOne({ code: code.toUpperCase() });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          error: 'واحد با این کد قبلاً ثبت شده است'
        });
      }
    }

    department.name = name || department.name;
    department.code = code ? code.toUpperCase() : department.code;
    department.nameEn = nameEn !== undefined ? nameEn : department.nameEn;
    department.description = description !== undefined ? description : department.description;
    department.parent = parent !== undefined ? parent : department.parent;
    department.manager = manager !== undefined ? manager : department.manager;
    department.deputy = deputy !== undefined ? deputy : department.deputy;
    department.color = color || department.color;
    department.icon = icon || department.icon;
    department.signingLimit = signingLimit !== undefined ? signingLimit : department.signingLimit;
    department.reminderSettings = reminderSettings || department.reminderSettings;
    department.defaultWorkflows = defaultWorkflows !== undefined ? defaultWorkflows : department.defaultWorkflows;
    department.isActive = isActive !== undefined ? isActive : department.isActive;

    await department.save();

    await logAudit(req, 'UPDATE', 'DEPARTMENT', {
      departmentId: department._id,
      name: department.name,
      changes: req.body,
    });

    // پاک کردن کش
    await CacheService.delete(`dept:${id}`);
    await CacheService.delete(`dept:${id}:users`);
    await CacheService.clearModule('dept:list');
    await CacheService.clearStats();

    res.json({
      success: true,
      data: department,
      message: 'واحد با موفقیت ویرایش شد'
    });
  } catch (error) {
    console.error('❌ خطا در ویرایش واحد:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// حذف واحد (با پاک کردن کش)
// =============================================
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'واحد یافت نشد'
      });
    }

    const children = await Department.find({ parent: department._id });
    if (children.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'این واحد دارای زیرمجموعه است. ابتدا زیرمجموعه‌ها را حذف یا جابجا کنید.'
      });
    }

    const users = await User.find({ departmentId: department._id });
    if (users.length > 0) {
      return res.status(400).json({
        success: false,
        error: `این واحد دارای ${users.length} کاربر است. ابتدا کاربران را جابجا کنید.`
      });
    }

    await logAudit(req, 'DELETE', 'DEPARTMENT', {
      departmentId: department._id,
      name: department.name,
      code: department.code,
    });

    await department.remove();

    // پاک کردن کش
    await CacheService.delete(`dept:${id}`);
    await CacheService.delete(`dept:${id}:users`);
    await CacheService.clearModule('dept:list');
    await CacheService.clearStats();

    res.json({
      success: true,
      message: 'واحد با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('❌ خطا در حذف واحد:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// فعال/غیرفعال کردن واحد (با پاک کردن کش)
// =============================================
router.patch('/:id/toggle', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'واحد یافت نشد'
      });
    }

    department.isActive = !department.isActive;
    await department.save();

    await logAudit(req, 'UPDATE', 'DEPARTMENT', {
      departmentId: department._id,
      name: department.name,
      action: 'toggle_active',
      newStatus: department.isActive,
    });

    // پاک کردن کش
    await CacheService.delete(`dept:${id}`);
    await CacheService.clearModule('dept:list');
    await CacheService.clearStats();

    res.json({
      success: true,
      data: department,
      message: `واحد با موفقیت ${department.isActive ? 'فعال' : 'غیرفعال'} شد`
    });
  } catch (error) {
    console.error('❌ خطا در تغییر وضعیت واحد:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
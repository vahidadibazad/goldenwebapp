const router = require('express').Router();
const Workflow = require('../models/Workflow');
const WorkflowInstance = require('../models/WorkflowInstance');
const Department = require('../models/Department');
const User = require('../models/User');
const { protect, authorize, checkPermission } = require('../middleware/auth');
const logAudit = require('../utils/auditLogger');

// =============================================
// دریافت لیست گردش‌های کاری (با فیلتر)
// =============================================
router.get('/', protect, async (req, res) => {
  try {
    const { type, active, search, department } = req.query;

    let query = {};
    
    if (type) query.type = type;
    if (active === 'true') query.isActive = true;
    if (active === 'false') query.isActive = false;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // اگر کاربر ادمین نیست، فقط گردش‌های عمومی را ببیند
    const isAdmin = req.user.role?.name === 'admin' || req.user.role?.name === 'office_manager';
    if (!isAdmin && department) {
      query.allowedDepartments = { $in: [department, null] };
    }

    const workflows = await Workflow.find(query)
      .populate('allowedDepartments', 'name code')
      .populate('createdBy', 'fullName username')
      .sort({ type: 1, name: 1 });

    res.json({
      success: true,
      data: workflows,
      message: 'لیست گردش‌های کاری با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت گردش‌های کاری:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// دریافت گردش‌های کاری فعال
// =============================================
router.get('/active', protect, async (req, res) => {
  try {
    const workflows = await Workflow.getActiveWorkflows();

    res.json({
      success: true,
      data: workflows,
      message: 'گردش‌های کاری فعال با موفقیت دریافت شدند'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت گردش‌های کاری فعال:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// دریافت گردش‌های کاری بر اساس نوع
// =============================================
router.get('/type/:type', protect, async (req, res) => {
  try {
    const { type } = req.params;
    const workflows = await Workflow.getByType(type);

    res.json({
      success: true,
      data: workflows,
      message: `گردش‌های کاری نوع ${type} با موفقیت دریافت شدند`
    });
  } catch (error) {
    console.error('❌ خطا در دریافت گردش‌های کاری بر اساس نوع:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// دریافت گردش‌های کاری یک واحد
// =============================================
router.get('/department/:departmentId', protect, async (req, res) => {
  try {
    const { departmentId } = req.params;
    const workflows = await Workflow.getByDepartment(departmentId);

    res.json({
      success: true,
      data: workflows,
      message: 'گردش‌های کاری واحد با موفقیت دریافت شدند'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت گردش‌های کاری واحد:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// دریافت یک گردش کار با ID
// =============================================
router.get('/:id', protect, async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id)
      .populate('allowedDepartments', 'name code')
      .populate('createdBy', 'fullName username');

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'گردش کار یافت نشد'
      });
    }

    res.json({
      success: true,
      data: workflow,
      message: 'اطلاعات گردش کار با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت گردش کار:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// ایجاد گردش کار جدید (فقط ادمین)
// =============================================
router.post('/', protect, authorize('admin', 'office_manager'), async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      steps,
      conditions,
      reminderSettings,
      allowedDepartments,
    } = req.body;

    // اعتبارسنجی
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'نام گردش کار الزامی است'
      });
    }

    if (!steps || steps.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'حداقل یک مرحله برای گردش کار تعریف کنید'
      });
    }

    // بررسی تکراری نبودن نام
    const existing = await Workflow.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'گردش کاری با این نام قبلاً ثبت شده است'
      });
    }

    // ایجاد گردش کار جدید
    const workflow = new Workflow({
      name,
      type: type || 'custom',
      description: description || '',
      steps,
      conditions: conditions || [],
      reminderSettings: reminderSettings || {
        daysBefore: [5, 3, 1, 0],
        methods: { sms: false, email: false, system: true },
        repeatInterval: 24,
      },
      allowedDepartments: allowedDepartments || [],
      createdBy: req.user.id,
      isActive: true,
      isSystem: false,
    });

    await workflow.save();

    // ثبت لاگ
    await logAudit(req, 'CREATE', 'WORKFLOW', {
      workflowId: workflow._id,
      name: workflow.name,
      type: workflow.type,
      stepsCount: workflow.steps.length,
    });

    res.status(201).json({
      success: true,
      data: workflow,
      message: 'گردش کار با موفقیت ایجاد شد'
    });
  } catch (error) {
    console.error('❌ خطا در ایجاد گردش کار:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// ویرایش گردش کار (فقط ادمین)
// =============================================
router.put('/:id', protect, authorize('admin', 'office_manager'), async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      steps,
      conditions,
      reminderSettings,
      allowedDepartments,
      isActive,
    } = req.body;

    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'گردش کار یافت نشد'
      });
    }

    // بررسی تکراری نبودن نام (به جز خودش)
    if (name && name !== workflow.name) {
      const existing = await Workflow.findOne({ name });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'گردش کاری با این نام قبلاً ثبت شده است'
        });
      }
    }

    // به‌روزرسانی
    if (name) workflow.name = name;
    if (type) workflow.type = type;
    if (description !== undefined) workflow.description = description;
    if (steps) workflow.steps = steps;
    if (conditions) workflow.conditions = conditions;
    if (reminderSettings) workflow.reminderSettings = reminderSettings;
    if (allowedDepartments) workflow.allowedDepartments = allowedDepartments;
    if (isActive !== undefined) workflow.isActive = isActive;

    await workflow.save();

    // ثبت لاگ
    await logAudit(req, 'UPDATE', 'WORKFLOW', {
      workflowId: workflow._id,
      name: workflow.name,
      changes: req.body,
    });

    res.json({
      success: true,
      data: workflow,
      message: 'گردش کار با موفقیت ویرایش شد'
    });
  } catch (error) {
    console.error('❌ خطا در ویرایش گردش کار:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// کپی کردن گردش کار (فقط ادمین)
// =============================================
router.post('/:id/duplicate', protect, authorize('admin', 'office_manager'), async (req, res) => {
  try {
    const { name } = req.body;
    
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'گردش کار یافت نشد'
      });
    }

    const newWorkflow = await Workflow.duplicate(
      workflow._id,
      name || `${workflow.name} (کپی)`,
      req.user.id
    );

    // ثبت لاگ
    await logAudit(req, 'CREATE', 'WORKFLOW', {
      workflowId: newWorkflow._id,
      name: newWorkflow.name,
      action: 'duplicate',
      sourceId: workflow._id,
    });

    res.status(201).json({
      success: true,
      data: newWorkflow,
      message: 'گردش کار با موفقیت کپی شد'
    });
  } catch (error) {
    console.error('❌ خطا در کپی گردش کار:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// حذف گردش کار (فقط ادمین - غیرسیستمی)
// =============================================
router.delete('/:id', protect, authorize('admin', 'office_manager'), async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'گردش کار یافت نشد'
      });
    }

    if (workflow.isSystem) {
      return res.status(400).json({
        success: false,
        error: 'گردش‌های کاری سیستمی قابل حذف نیستند'
      });
    }

    // بررسی اینکه گردش کار در حال استفاده است
    const activeInstances = await WorkflowInstance.countDocuments({
      workflow: workflow._id,
      status: 'active'
    });

    if (activeInstances > 0) {
      return res.status(400).json({
        success: false,
        error: `این گردش کار در ${activeInstances} نمونه فعال در حال استفاده است`
      });
    }

    // ثبت لاگ
    await logAudit(req, 'DELETE', 'WORKFLOW', {
      workflowId: workflow._id,
      name: workflow.name,
    });

    await workflow.remove();

    res.json({
      success: true,
      message: 'گردش کار با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('❌ خطا در حذف گردش کار:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// =============================================
// مسیرهای نمونه گردش کار (Workflow Instance)
// =============================================
// =============================================

// دریافت نمونه‌های گردش کار برای کاربر جاری
router.get('/instances/my', protect, async (req, res) => {
  try {
    const instances = await WorkflowInstance.getActiveForUser(req.user.id);

    // اضافه کردن اطلاعات هدف
    const instancesWithTarget = await Promise.all(instances.map(async (instance) => {
      const instanceObj = instance.toObject();
      
      // دریافت اطلاعات هدف بر اساس targetType
      if (instance.targetType === 'Document') {
        const Document = require('../models/Document');
        const target = await Document.findById(instance.targetId)
          .select('title letterNumber letterType');
        instanceObj.target = target;
      }
      
      // دریافت وضعیت جاری
      const status = await instance.getCurrentStatus();
      instanceObj.currentStatus = status;
      
      return instanceObj;
    }));

    res.json({
      success: true,
      data: instancesWithTarget,
      message: 'نمونه‌های گردش کار با موفقیت دریافت شدند'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت نمونه‌های گردش کار:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// دریافت نمونه‌های در انتظار برای کاربر جاری
router.get('/instances/pending', protect, async (req, res) => {
  try {
    const instances = await WorkflowInstance.getPendingForUser(req.user.id);

    res.json({
      success: true,
      data: instances,
      message: 'نمونه‌های گردش کار در انتظار با موفقیت دریافت شدند'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت نمونه‌های گردش کار در انتظار:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// دریافت یک نمونه گردش کار با ID
router.get('/instances/:id', protect, async (req, res) => {
  try {
    const instance = await WorkflowInstance.findById(req.params.id)
      .populate('workflow', 'name type steps')
      .populate('requester', 'fullName username');

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'نمونه گردش کار یافت نشد'
      });
    }

    // بررسی دسترسی
    const isAdmin = req.user.role?.name === 'admin' || req.user.role?.name === 'office_manager';
    const isRequester = instance.requester._id.toString() === req.user.id;

    if (!isAdmin && !isRequester) {
      return res.status(403).json({
        success: false,
        error: 'شما دسترسی به این نمونه گردش کار ندارید'
      });
    }

    // دریافت وضعیت جاری
    const status = await instance.getCurrentStatus();

    res.json({
      success: true,
      data: {
        ...instance.toObject(),
        currentStatus: status,
      },
      message: 'اطلاعات نمونه گردش کار با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت نمونه گردش کار:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// تکمیل مرحله موازی
router.patch('/instances/:id/parallel/:stepId', protect, async (req, res) => {
  try {
    const { id, stepId } = req.params;
    
    const instance = await WorkflowInstance.findById(id);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'نمونه گردش کار یافت نشد'
      });
    }

    await instance.completeParallelStep(stepId, req.user.id);

    res.json({
      success: true,
      data: instance,
      message: 'مرحله موازی با موفقیت تکمیل شد'
    });
  } catch (error) {
    console.error('❌ خطا در تکمیل مرحله موازی:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// لغو نمونه گردش کار
router.patch('/instances/:id/cancel', protect, async (req, res) => {
  try {
    const { reason = '' } = req.body;
    
    const instance = await WorkflowInstance.findById(req.params.id);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'نمونه گردش کار یافت نشد'
      });
    }

    // بررسی دسترسی
    const isAdmin = req.user.role?.name === 'admin' || req.user.role?.name === 'office_manager';
    const isRequester = instance.requester.toString() === req.user.id;

    if (!isAdmin && !isRequester) {
      return res.status(403).json({
        success: false,
        error: 'شما مجاز به لغو این گردش کار نیستید'
      });
    }

    await instance.cancel(req.user.id, reason);

    res.json({
      success: true,
      data: instance,
      message: 'گردش کار با موفقیت لغو شد'
    });
  } catch (error) {
    console.error('❌ خطا در لغو گردش کار:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// دریافت آمار گردش‌های کاری
// =============================================
router.get('/stats/overview', protect, authorize('admin', 'office_manager'), async (req, res) => {
  try {
    const stats = await WorkflowInstance.getStats();
    
    // دریافت تعداد گردش‌های کاری تعریف‌شده
    const totalWorkflows = await Workflow.countDocuments({ isActive: true });
    
    // دریافت تعداد گردش‌های کاری بر اساس نوع
    const workflowTypes = await Workflow.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalWorkflows,
        workflowTypes,
        instanceStats: stats,
      },
      message: 'آمار گردش‌های کاری با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت آمار گردش‌های کاری:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
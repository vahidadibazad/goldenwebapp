const router = require('express').Router();
const Document = require('../models/Document');
const { protect, authorize, checkPermission } = require('../middleware/auth');
const logAudit = require('../utils/auditLogger');
const CacheService = require('../services/cacheService');

// =============================================
// دریافت لیست اسناد (با کش)
// =============================================
router.get('/', protect, async (req, res) => {
  try {
    const {
      search,
      category,
      fileType,
      accessLevel,
      department,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
    } = req.query;

    const cacheKey = `document:list:${JSON.stringify({ search, category, fileType, accessLevel, department, fromDate, toDate, page, limit, userId: req.user.id })}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData.data,
        pagination: cachedData.pagination,
        fromCache: true,
        message: 'لیست اسناد از کش دریافت شد'
      });
    }

    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }
    if (category) filter.category = category;
    if (fileType) filter.fileType = fileType;
    if (accessLevel) filter.accessLevel = accessLevel;
    
    // =============================================
    // ✅ اصلاح فیلتر department
    // =============================================
    if (department) {
      if (department === 'All' || department === 'all') {
        // اگر 'All' بود، فیلتر را حذف کن (همه رو نشون بده)
        delete filter.department;
      } else {
        filter.department = department;
      }
    }

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const user = req.user;
    const userRole = user.role?.name || 'user';

    if (userRole !== 'admin') {
      filter.$or = [
        { uploadedBy: user._id },
        { accessLevel: 'public' },
        { department: user.department || 'All' },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const documents = await Document.find(filter)
      .populate('uploadedBy', 'fullName username')
      .populate('department', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Document.countDocuments(filter);

    const result = {
      data: documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };

    await CacheService.set(cacheKey, result, 300);

    res.json({
      success: true,
      ...result,
      fromCache: false,
      message: 'لیست اسناد دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت اسناد:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// آپلود سند جدید (با پاک کردن کش)
// =============================================
router.post('/', protect, checkPermission('upload_document'), async (req, res) => {
  try {
    const {
      title,
      description,
      tags,
      category,
      accessLevel = 'public',
      department = 'All',
      filePath,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'عنوان سند الزامی است',
      });
    }

    const document = await Document.create({
      title,
      description: description || '',
      tags: tags || [],
      category: category || 'سایر',
      filePath: filePath || '',
      uploadedBy: req.user.id,
      accessLevel,
      department: department || 'All',
      version: 1,
    });

    await logAudit(req, 'CREATE', 'DOCUMENT', {
      documentId: document._id,
      title: document.title,
      category: document.category,
    });

    // پاک کردن کش
    await CacheService.clearModule('document:');
    await CacheService.clearStats();

    res.status(201).json({
      success: true,
      data: document,
      message: 'سند با موفقیت آپلود شد',
    });
  } catch (error) {
    console.error('❌ خطا در آپلود سند:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================
// دریافت یک سند با ID (با کش)
// =============================================
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const cacheKey = `document:${id}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true,
        message: 'سند از کش دریافت شد'
      });
    }

    const document = await Document.findById(id)
      .populate('uploadedBy', 'fullName username')
      .populate('department', 'name code');

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'سند یافت نشد',
      });
    }

    const user = req.user;
    const userRole = user.role?.name || 'user';
    const isOwner = document.uploadedBy._id.toString() === user._id.toString();

    if (userRole !== 'admin' && !isOwner && document.accessLevel !== 'public') {
      return res.status(403).json({
        success: false,
        error: 'شما دسترسی به این سند ندارید',
      });
    }

    // ثبت بازدید
    document.viewLogs = document.viewLogs || [];
    document.viewLogs.push({
      user: user._id,
      viewedAt: new Date(),
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || '',
    });
    await document.save();

    await CacheService.set(cacheKey, document, 3600);

    res.json({
      success: true,
      data: document,
      fromCache: false,
      message: 'سند دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت سند:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ویرایش سند (با پاک کردن کش)
// =============================================
router.put('/:id', protect, checkPermission('edit_document'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, tags, category, accessLevel, department } = req.body;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'سند یافت نشد',
      });
    }

    const isOwner = document.uploadedBy.toString() === req.user.id;
    const isAdmin = req.user.role?.name === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'شما مجاز به ویرایش این سند نیستید',
      });
    }

    document.title = title || document.title;
    document.description = description !== undefined ? description : document.description;
    document.tags = tags || document.tags;
    document.category = category || document.category;
    document.accessLevel = accessLevel || document.accessLevel;
    document.department = department || document.department;
    document.version = (document.version || 1) + 1;

    await document.save();

    await logAudit(req, 'UPDATE', 'DOCUMENT', {
      documentId: document._id,
      title: document.title,
      changes: req.body,
    });

    // پاک کردن کش
    await CacheService.delete(`document:${id}`);
    await CacheService.clearModule('document:list');
    await CacheService.clearStats();

    res.json({
      success: true,
      data: document,
      message: 'سند با موفقیت ویرایش شد',
    });
  } catch (error) {
    console.error('❌ خطا در ویرایش سند:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================
// حذف سند (با پاک کردن کش)
// =============================================
router.delete('/:id', protect, checkPermission('delete_document'), async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'سند یافت نشد',
      });
    }

    const isOwner = document.uploadedBy.toString() === req.user.id;
    const isAdmin = req.user.role?.name === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'شما مجاز به حذف این سند نیستید',
      });
    }

    await logAudit(req, 'DELETE', 'DOCUMENT', {
      documentId: document._id,
      title: document.title,
    });

    await document.remove();

    // پاک کردن کش
    await CacheService.delete(`document:${id}`);
    await CacheService.clearModule('document:list');
    await CacheService.clearStats();

    res.json({
      success: true,
      message: 'سند با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('❌ خطا در حذف سند:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
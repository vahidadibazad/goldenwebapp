// backend/src/routes/searchRoutes.js
const router = require('express').Router();
const { protect, checkPermission } = require('../middleware/auth');
const ElasticsearchService = require('../services/elasticsearchService');
const Letter = require('../models/Letter');
const Hardware = require('../models/hardware');
const Document = require('../models/Document');
const Credential = require('../models/Credential');
const User = require('../models/User');
const logger = require('../utils/logger');

// =============================================
// ✅ جستجوی جامع (Global Search) با Elasticsearch
// =============================================
router.get('/global', protect, async (req, res) => {
  try {
    const { q, modules, limit = 20, page = 1, fuzzy = true } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'عبارت جستجو الزامی است',
      });
    }

    const searchTerm = q.trim();
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const from = (pageNum - 1) * limitNum;

    // تعیین ایندکس‌های مورد جستجو
    const modulesArray = modules ? modules.split(',') : ['letters', 'hardware', 'documents', 'credentials', 'users'];
    const results = {};

    // جستجو در هر ایندکس
    for (const module of modulesArray) {
      try {
        const result = await ElasticsearchService.search(module, searchTerm, {
          from,
          size: limitNum,
          fuzzy: fuzzy === 'true',
          filters: {
            // محدودیت دسترسی
            ...(module === 'users' && { isActive: true }),
          },
        });
        results[module] = result;
      } catch (error) {
        logger.warn(`⚠️ خطا در جستجوی ${module}:`, error.message);
        results[module] = { total: 0, hits: [] };
      }
    }

    // جمع‌آوری آمار
    const totalResults = Object.values(results).reduce((sum, mod) => sum + (mod.total || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        query: searchTerm,
        totalResults,
        results,
        page: pageNum,
        limit: limitNum,
      },
      message: 'نتایج جستجو با موفقیت دریافت شد',
    });

  } catch (error) {
    console.error('❌ خطا در جستجوی جامع:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ جستجوی پیشرفته در نامه‌ها
// =============================================
router.get('/letters', protect, checkPermission('view_letters'), async (req, res) => {
  try {
    const {
      q,
      letterType,
      status,
      priority,
      classification,
      fromDate,
      toDate,
      secretariat,
      sender,
      receiver,
      limit = 20,
      page = 1,
    } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'عبارت جستجو الزامی است',
      });
    }

    // ساخت فیلترها
    const filters = {};
    if (letterType) filters.letterType = letterType;
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (classification) filters.classification = classification;
    if (secretariat) filters.secretariat = secretariat;
    if (sender) filters.sender = sender;
    if (receiver) filters.receiver = receiver;

    if (fromDate || toDate) {
      filters.dateRange = {
        field: 'letterDate',
        from: fromDate,
        to: toDate,
      };
    }

    // محدودیت دسترسی
    const isAdmin = req.user.role?.name === 'admin' || req.user.role?.name === 'office_manager';
    if (!isAdmin) {
      filters.$or = [
        { sender: req.user.id },
        { receiver: req.user.id },
        { registeredBy: req.user.id },
      ];
    }

    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const from = (pageNum - 1) * limitNum;

    const result = await ElasticsearchService.search('letters', q.trim(), {
      from,
      size: limitNum,
      filters,
      highlight: true,
      sort: [{ _score: 'desc' }, { createdAt: 'desc' }],
    });

    // اضافه کردن اطلاعات کاربران به نتایج
    const enrichedHits = await Promise.all(result.hits.map(async (hit) => {
      const source = hit.source;
      // دریافت اطلاعات فرستنده و گیرنده از دیتابیس
      if (source.sender) {
        const senderUser = await User.findById(source.sender).select('fullName username').lean();
        source.senderInfo = senderUser;
      }
      if (source.receiver) {
        const receiverUser = await User.findById(source.receiver).select('fullName username').lean();
        source.receiverInfo = receiverUser;
      }
      return hit;
    }));

    result.hits = enrichedHits;

    res.status(200).json({
      success: true,
      data: result,
      message: 'نتایج جستجوی نامه‌ها با موفقیت دریافت شد',
    });

  } catch (error) {
    console.error('❌ خطا در جستجوی نامه‌ها:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ جستجوی پیشرفته در اموال
// =============================================
router.get('/hardware', protect, checkPermission('view_hardware'), async (req, res) => {
  try {
    const {
      q,
      category,
      status,
      minPrice,
      maxPrice,
      assignedTo,
      limit = 20,
      page = 1,
    } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'عبارت جستجو الزامی است',
      });
    }

    // ساخت فیلترها
    const filters = {};
    if (category) filters.category = category;
    if (status) filters.status = status;
    if (assignedTo) filters.assignedTo = assignedTo;

    if (minPrice || maxPrice) {
      filters.priceRange = {
        field: 'price',
        from: minPrice,
        to: maxPrice,
      };
    }

    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const from = (pageNum - 1) * limitNum;

    const result = await ElasticsearchService.search('hardware', q.trim(), {
      from,
      size: limitNum,
      filters,
      highlight: true,
      sort: [{ _score: 'desc' }, { createdAt: 'desc' }],
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'نتایج جستجوی اموال با موفقیت دریافت شد',
    });

  } catch (error) {
    console.error('❌ خطا در جستجوی اموال:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ جستجوی پیشرفته در اسناد
// =============================================
router.get('/documents', protect, checkPermission('view_document'), async (req, res) => {
  try {
    const {
      q,
      category,
      fileType,
      accessLevel,
      department,
      fromDate,
      toDate,
      limit = 20,
      page = 1,
    } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'عبارت جستجو الزامی است',
      });
    }

    // ساخت فیلترها
    const filters = {};
    if (category) filters.category = category;
    if (fileType) filters.fileType = fileType;
    if (accessLevel) filters.accessLevel = accessLevel;
    if (department) filters.department = department;

    if (fromDate || toDate) {
      filters.dateRange = {
        field: 'createdAt',
        from: fromDate,
        to: toDate,
      };
    }

    // محدودیت دسترسی
    const isAdmin = req.user.role?.name === 'admin';
    if (!isAdmin) {
      filters.$or = [
        { uploadedBy: req.user.id },
        { accessLevel: 'public' },
        { department: req.user.department || 'All' },
      ];
    }

    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const from = (pageNum - 1) * limitNum;

    const result = await ElasticsearchService.search('documents', q.trim(), {
      from,
      size: limitNum,
      filters,
      highlight: true,
      sort: [{ _score: 'desc' }, { createdAt: 'desc' }],
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'نتایج جستجوی اسناد با موفقیت دریافت شد',
    });

  } catch (error) {
    console.error('❌ خطا در جستجوی اسناد:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ جستجوی پیشرفته در رمزها
// =============================================
router.get('/credentials', protect, checkPermission('view_credential'), async (req, res) => {
  try {
    const {
      q,
      accessLevel,
      hardware,
      limit = 20,
      page = 1,
    } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'عبارت جستجو الزامی است',
      });
    }

    // ساخت فیلترها
    const filters = {};
    if (accessLevel) filters.accessLevel = accessLevel;
    if (hardware) filters.hardware = hardware;

    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const from = (pageNum - 1) * limitNum;

    const result = await ElasticsearchService.search('credentials', q.trim(), {
      from,
      size: limitNum,
      filters,
      highlight: true,
      sort: [{ _score: 'desc' }, { createdAt: 'desc' }],
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'نتایج جستجوی رمزها با موفقیت دریافت شد',
    });

  } catch (error) {
    console.error('❌ خطا در جستجوی رمزها:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ جستجوی پیشرفته در کاربران (فقط ادمین)
// =============================================
router.get('/users', protect, checkPermission('view_user'), async (req, res) => {
  try {
    const isAdmin = req.user.role?.name === 'admin';
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'شما دسترسی به جستجوی کاربران را ندارید',
      });
    }

    const {
      q,
      role,
      department,
      isActive,
      limit = 20,
      page = 1,
    } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'عبارت جستجو الزامی است',
      });
    }

    // ساخت فیلترها
    const filters = {};
    if (role) filters.role = role;
    if (department) filters.department = department;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const from = (pageNum - 1) * limitNum;

    const result = await ElasticsearchService.search('users', q.trim(), {
      from,
      size: limitNum,
      filters,
      highlight: true,
      sort: [{ _score: 'desc' }, { createdAt: 'desc' }],
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'نتایج جستجوی کاربران با موفقیت دریافت شد',
    });

  } catch (error) {
    console.error('❌ خطا در جستجوی کاربران:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ جستجوی پیشنهادی (Autocomplete)
// =============================================
router.get('/suggest', protect, async (req, res) => {
  try {
    const { q, module = 'letters', limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'حداقل ۲ کاراکتر وارد کنید',
      });
    }

    const result = await ElasticsearchService.autocomplete(module, q.trim(), {
      field: 'suggest',
      size: parseInt(limit),
    });

    // اضافه کردن اطلاعات اضافی برای نمایش بهتر
    const enrichedResults = result.map(item => ({
      ...item,
      type: module.slice(0, -1),
      path: `/${module.slice(0, -1)}/${item.id}`,
    }));

    res.status(200).json({
      success: true,
      data: enrichedResults,
      message: 'پیشنهادات جستجو با موفقیت دریافت شد',
    });

  } catch (error) {
    console.error('❌ خطا در دریافت پیشنهادات:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ جستجوی سریع (Quick Search) - برای نوار جستجوی اصلی
// =============================================
router.get('/quick', protect, async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'عبارت جستجو را وارد کنید',
      });
    }

    const searchTerm = q.trim();
    const limitNum = parseInt(limit);

    // جستجو در چند ماژول به صورت همزمان
    const modules = ['letters', 'hardware', 'documents'];
    const results = [];

    for (const module of modules) {
      try {
        const result = await ElasticsearchService.search(module, searchTerm, {
          size: Math.ceil(limitNum / modules.length) + 1,
          highlight: false,
        });

        const hits = result.hits.map(hit => {
          const source = hit.source;
          let title = '';
          let subtitle = '';
          let path = '';

          switch (module) {
            case 'letters':
              title = source.subject || source.number;
              subtitle = `نامه ${source.letterType || ''} - ${source.number || 'بدون شماره'}`;
              path = `/letters/${hit.id}`;
              break;
            case 'hardware':
              title = source.name;
              subtitle = `سریال: ${source.serialNumber || '---'}`;
              path = `/hardware/${hit.id}`;
              break;
            case 'documents':
              title = source.title;
              subtitle = `نوع: ${source.fileType || 'سایر'}`;
              path = `/documents/${hit.id}`;
              break;
            default:
              title = source.title || source.name || 'بدون عنوان';
              subtitle = '';
              path = `/${module.slice(0, -1)}/${hit.id}`;
          }

          return {
            id: hit.id,
            title,
            subtitle,
            type: module.slice(0, -1),
            score: hit.score,
            source: hit.source,
            path,
            highlight: hit.highlight,
          };
        });

        results.push(...hits);
      } catch (error) {
        logger.warn(`⚠️ خطا در جستجوی سریع ${module}:`, error.message);
      }
    }

    // مرتب‌سازی بر اساس امتیاز
    results.sort((a, b) => b.score - a.score);

    res.status(200).json({
      success: true,
      data: results.slice(0, limitNum),
      message: 'نتایج جستجوی سریع با موفقیت دریافت شد',
    });

  } catch (error) {
    console.error('❌ خطا در جستجوی سریع:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ جستجوی فیلتر شده (Filtered Search) - با فیلترهای پیشرفته
// =============================================
router.post('/filtered', protect, async (req, res) => {
  try {
    const {
      query,
      modules = ['letters', 'hardware', 'documents', 'credentials', 'users'],
      filters = {},
      sort = [],
      limit = 20,
      page = 1,
    } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'عبارت جستجو الزامی است',
      });
    }

    const searchTerm = query.trim();
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const from = (pageNum - 1) * limitNum;

    const results = {};

    for (const module of modules) {
      try {
        const moduleFilters = filters[module] || {};
        
        // محدودیت دسترسی
        if (module === 'users') {
          moduleFilters.isActive = true;
        }
        if (module === 'documents' && req.user.role?.name !== 'admin') {
          moduleFilters.$or = [
            { uploadedBy: req.user.id },
            { accessLevel: 'public' },
            { department: req.user.department || 'All' },
          ];
        }

        const result = await ElasticsearchService.search(module, searchTerm, {
          from,
          size: limitNum,
          filters: moduleFilters,
          highlight: true,
          sort: sort.length > 0 ? sort : [{ _score: 'desc' }],
        });

        results[module] = result;
      } catch (error) {
        logger.warn(`⚠️ خطا در جستجوی فیلتر شده ${module}:`, error.message);
        results[module] = { total: 0, hits: [] };
      }
    }

    const totalResults = Object.values(results).reduce((sum, mod) => sum + (mod.total || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        query: searchTerm,
        totalResults,
        results,
        page: pageNum,
        limit: limitNum,
        filters,
      },
      message: 'نتایج جستجوی فیلتر شده با موفقیت دریافت شد',
    });

  } catch (error) {
    console.error('❌ خطا در جستجوی فیلتر شده:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ دریافت آمار جستجو
// =============================================
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = {};

    const modules = ['letters', 'hardware', 'documents', 'credentials', 'users'];
    for (const module of modules) {
      const result = await ElasticsearchService.getIndexStats(module);
      stats[module] = result;
    }

    // دریافت محبوب‌ترین جستجوها (از Redis یا دیتابیس)
    // این بخش می‌تواند با Redis تکمیل شود

    res.status(200).json({
      success: true,
      data: stats,
      message: 'آمار جستجو با موفقیت دریافت شد',
    });

  } catch (error) {
    console.error('❌ خطا در دریافت آمار جستجو:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ Fallback: جستجوی مبتنی بر دیتابیس (زمانی که Elasticsearch در دسترس نباشد)
// =============================================
router.get('/fallback', protect, async (req, res) => {
  try {
    const { q, module = 'letters', limit = 20, page = 1 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'عبارت جستجو الزامی است',
      });
    }

    const searchTerm = q.trim();
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    let results = [];
    let total = 0;

    switch (module) {
      case 'letters':
        const letters = await Letter.find({
          $or: [
            { subject: { $regex: searchTerm, $options: 'i' } },
            { content: { $regex: searchTerm, $options: 'i' } },
            { number: { $regex: searchTerm, $options: 'i' } },
            { summary: { $regex: searchTerm, $options: 'i' } },
          ],
        })
          .populate('sender', 'fullName username')
          .populate('receiver', 'fullName username')
          .populate('secretariat', 'name code')
          .skip(skip)
          .limit(limitNum)
          .lean();

        total = await Letter.countDocuments({
          $or: [
            { subject: { $regex: searchTerm, $options: 'i' } },
            { content: { $regex: searchTerm, $options: 'i' } },
            { number: { $regex: searchTerm, $options: 'i' } },
            { summary: { $regex: searchTerm, $options: 'i' } },
          ],
        });
        results = letters;
        break;

      case 'hardware':
        const hardware = await Hardware.find({
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { serialNumber: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
          ],
        })
          .populate('category', 'name')
          .populate('assignedTo', 'fullName username')
          .skip(skip)
          .limit(limitNum)
          .lean();

        total = await Hardware.countDocuments({
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { serialNumber: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
          ],
        });
        results = hardware;
        break;

      case 'documents':
        const documents = await Document.find({
          $or: [
            { title: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { tags: { $in: [new RegExp(searchTerm, 'i')] } },
          ],
        })
          .populate('uploadedBy', 'fullName username')
          .populate('department', 'name code')
          .skip(skip)
          .limit(limitNum)
          .lean();

        total = await Document.countDocuments({
          $or: [
            { title: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { tags: { $in: [new RegExp(searchTerm, 'i')] } },
          ],
        });
        results = documents;
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'ماژول نامعتبر',
        });
    }

    res.status(200).json({
      success: true,
      data: {
        hits: results.map(item => ({
          id: item._id,
          source: item,
          score: 1,
        })),
        total,
        took: 0,
      },
      message: 'نتایج جستجوی Fallback با موفقیت دریافت شد',
    });

  } catch (error) {
    console.error('❌ خطا در جستجوی Fallback:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
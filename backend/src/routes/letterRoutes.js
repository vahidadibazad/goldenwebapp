// backend/src/routes/letterRoutes.js
const router = require('express').Router();
const Letter = require('../models/Letter');
const { protect, checkPermission } = require('../middleware/auth');
const CacheService = require('../services/cacheService');

// =============================================
// ✅ مسیر simple-stats باید قبل از مسیر :id باشد
// =============================================

// =============================================
// ✅ دریافت آمار ساده (باید قبل از /:id باشد)
// =============================================
router.get('/simple-stats', protect, async (req, res) => {
  try {
    const cacheKey = `letter:stats:${req.user.id}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true,
        message: 'آمار نامه‌ها از کش دریافت شد'
      });
    }

    const total = await Letter.countDocuments();
    
    const statusCounts = await Letter.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const stats = {
      draft: 0,
      registered: 0,
      in_review: 0,
      approved: 0,
      rejected: 0,
      signed: 0,
      archived: 0,
      total: total,
    };
    
    statusCounts.forEach(item => {
      if (item._id && stats[item._id] !== undefined) {
        stats[item._id] = item.count;
      }
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await Letter.countDocuments({
      createdAt: { $gte: today }
    });

    const result = {
      ...stats,
      today: todayCount,
      byType: {
        incoming: 0,
        outgoing: 0,
        internal: 0,
      }
    };

    await CacheService.set(cacheKey, result, 300);

    res.json({
      success: true,
      data: result,
      fromCache: false,
      message: 'آمار نامه‌ها با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت آمار ساده:', error);
    res.json({
      success: true,
      data: {
        draft: 0,
        registered: 0,
        in_review: 0,
        approved: 0,
        rejected: 0,
        signed: 0,
        archived: 0,
        total: 0,
        today: 0,
        byType: {
          incoming: 0,
          outgoing: 0,
          internal: 0,
        }
      },
      message: 'آمار نامه‌ها (مقادیر پیش‌فرض)'
    });
  }
});

// =============================================
// ✅ دریافت آمار (قدیمی - با احتمال خطا)
// =============================================
router.get('/stats', protect, async (req, res) => {
  try {
    const total = await Letter.countDocuments();
    
    const statusCounts = await Letter.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const stats = {
      draft: 0,
      registered: 0,
      in_review: 0,
      approved: 0,
      rejected: 0,
      signed: 0,
      archived: 0,
      total: total,
    };
    
    statusCounts.forEach(item => {
      if (item._id && stats[item._id] !== undefined) {
        stats[item._id] = item.count;
      }
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await Letter.countDocuments({
      createdAt: { $gte: today }
    });
    
    res.json({
      success: true,
      data: {
        ...stats,
        today: todayCount,
        byType: {
          incoming: 0,
          outgoing: 0,
          internal: 0,
        }
      },
      message: 'آمار نامه‌ها با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت آمار:', error);
    res.json({
      success: true,
      data: {
        draft: 0,
        registered: 0,
        in_review: 0,
        approved: 0,
        rejected: 0,
        signed: 0,
        archived: 0,
        total: 0,
        today: 0,
        byType: {
          incoming: 0,
          outgoing: 0,
          internal: 0,
        }
      },
      message: 'آمار نامه‌ها (مقادیر پیش‌فرض)'
    });
  }
});

// =============================================
// دریافت صندوق ورودی
// =============================================
router.get('/inbox', protect, async (req, res) => {
  try {
    const cacheKey = `letter:inbox:${req.user.id}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true,
        message: 'صندوق ورودی از کش دریافت شد'
      });
    }

    const letters = await Letter.find({
      receiver: req.user.id,
      status: { $ne: 'archived' }
    })
    .populate('sender', 'fullName username')
    .populate('secretariat', 'name code')
    .sort({ createdAt: -1 })
    .limit(50);

    await CacheService.set(cacheKey, letters, 120);

    res.json({
      success: true,
      data: letters,
      fromCache: false,
      message: 'صندوق ورودی با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت صندوق ورودی:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// دریافت صندوق خروجی
// =============================================
router.get('/outbox', protect, async (req, res) => {
  try {
    const cacheKey = `letter:outbox:${req.user.id}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true,
        message: 'صندوق خروجی از کش دریافت شد'
      });
    }

    const letters = await Letter.find({
      sender: req.user.id,
      status: { $ne: 'archived' }
    })
    .populate('receiver', 'fullName username')
    .populate('secretariat', 'name code')
    .sort({ createdAt: -1 })
    .limit(50);

    await CacheService.set(cacheKey, letters, 120);

    res.json({
      success: true,
      data: letters,
      fromCache: false,
      message: 'صندوق خروجی با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت صندوق خروجی:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// دریافت نامه‌های در انتظار تایید
// =============================================
router.get('/pending', protect, async (req, res) => {
  try {
    const cacheKey = `letter:pending:${req.user.id}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true,
        message: 'نامه‌های در انتظار از کش دریافت شدند'
      });
    }

    const letters = await Letter.find({
      status: 'in_review',
      $or: [
        { receiver: req.user.id },
        { 'referrals.to': req.user.id }
      ]
    })
    .populate('sender', 'fullName username')
    .populate('receiver', 'fullName username')
    .populate('secretariat', 'name code')
    .sort({ createdAt: -1 })
    .limit(50);

    await CacheService.set(cacheKey, letters, 60);

    res.json({
      success: true,
      data: letters,
      fromCache: false,
      message: 'نامه‌های در انتظار تایید با موفقیت دریافت شدند'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت نامه‌های در انتظار:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// دریافت لیست نامه‌ها با فیلتر
// =============================================
router.get('/', protect, async (req, res) => {
  try {
    const {
      type,
      status,
      priority,
      secretariat,
      search,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
      sender,
      receiver,
    } = req.query;

    const cacheKey = `letter:list:${JSON.stringify({ type, status, priority, secretariat, search, fromDate, toDate, page, limit, sender, receiver, userId: req.user.id })}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData.data,
        pagination: cachedData.pagination,
        fromCache: true,
        message: 'لیست نامه‌ها از کش دریافت شد'
      });
    }

    const filter = {};

    if (type) filter.letterType = type;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (secretariat) filter.secretariat = secretariat;

    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { number: { $regex: search, $options: 'i' } },
      ];
    }

    if (fromDate || toDate) {
      filter.letterDate = {};
      if (fromDate) filter.letterDate.$gte = new Date(fromDate);
      if (toDate) filter.letterDate.$lte = new Date(toDate);
    }

    if (sender === 'me') {
      filter.sender = req.user.id;
    } else if (sender) {
      filter.sender = sender;
    }

    if (receiver === 'me') {
      filter.receiver = req.user.id;
    } else if (receiver) {
      filter.receiver = receiver;
    }

    const userRole = req.user.role?.name || 'user';
    if (userRole !== 'admin' && userRole !== 'office_manager') {
      filter.$or = [
        { sender: req.user.id },
        { receiver: req.user.id },
        { registeredBy: req.user.id },
        { 'referrals.to': req.user.id },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const letters = await Letter.find(filter)
      .populate('sender', 'fullName username')
      .populate('receiver', 'fullName username')
      .populate('secretariat', 'name code')
      .populate('registeredBy', 'fullName username')
      .populate('referrals', 'user status type dueDate')
      .populate('signatures', 'signer signedAt status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Letter.countDocuments(filter);

    const result = {
      data: letters,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };

    await CacheService.set(cacheKey, result, 120);

    res.json({
      success: true,
      ...result,
      fromCache: false,
      message: 'لیست نامه‌ها دریافت شد',
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
// ✅ دریافت یک نامه با ID (بعد از simple-stats)
// =============================================
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const cacheKey = `letter:${id}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true,
        message: 'نامه از کش دریافت شد'
      });
    }

    const letter = await Letter.findById(id)
      .populate('sender', 'fullName username')
      .populate('receiver', 'fullName username')
      .populate('secretariat', 'name code')
      .populate('registeredBy', 'fullName username')
      .populate('referrals', 'from to status type dueDate')
      .populate('signatures', 'signer signedAt status')
      .populate('memos', 'user content createdAt')
      .populate('attachments', 'title fileName fileSize uploadedBy');

    if (!letter) {
      return res.status(404).json({
        success: false,
        error: 'نامه یافت نشد',
      });
    }

    const userRole = req.user.role?.name || 'user';
    const isAdmin = userRole === 'admin' || userRole === 'office_manager';
    const isSender = letter.sender?._id?.toString() === req.user.id;
    const isReceiver = letter.receiver?._id?.toString() === req.user.id;
    const isRegistrar = letter.registeredBy?._id?.toString() === req.user.id;

    if (!isAdmin && !isSender && !isReceiver && !isRegistrar) {
      return res.status(403).json({
        success: false,
        error: 'شما دسترسی به این نامه را ندارید',
      });
    }

    await CacheService.set(cacheKey, letter, 3600);

    res.json({
      success: true,
      data: letter,
      fromCache: false,
      message: 'اطلاعات نامه دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت نامه:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ثبت نامه جدید
// =============================================
router.post('/', protect, checkPermission('create_letter'), async (req, res) => {
  try {
    const {
      subject,
      content,
      summary,
      letterType,
      letterDate,
      sender,
      senderName,
      senderOrganization,
      senderDepartment,
      receiver,
      receiverName,
      receiverOrganization,
      receiverDepartment,
      classification = 'normal',
      priority = 'medium',
      secretariat,
      dueDate,
    } = req.body;

    if (!subject || !letterDate || !secretariat) {
      return res.status(400).json({
        success: false,
        error: 'موضوع، تاریخ نامه و دبیرخانه الزامی است',
      });
    }

    const letter = new Letter({
      subject,
      content: content || '',
      summary: summary || '',
      letterType: letterType || 'incoming',
      letterDate: new Date(letterDate),
      classification,
      priority,
      sender: sender || null,
      senderName: senderName || '',
      senderOrganization: senderOrganization || '',
      senderDepartment: senderDepartment || null,
      receiver: receiver || null,
      receiverName: receiverName || '',
      receiverOrganization: receiverOrganization || '',
      receiverDepartment: receiverDepartment || null,
      secretariat,
      dueDate: dueDate || null,
      registeredBy: req.user.id,
      status: 'draft',
    });

    await letter.addTracking('draft', req.user.id, 'نامه ایجاد شد');
    await letter.save();

    await CacheService.clearModule('letter:');
    await CacheService.clearStats();

    res.status(201).json({
      success: true,
      data: letter,
      message: 'نامه با موفقیت ثبت شد',
    });
  } catch (error) {
    console.error('❌ خطا در ثبت نامه:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ویرایش نامه
// =============================================
router.put('/:id', protect, checkPermission('edit_letter'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      subject,
      content,
      summary,
      classification,
      priority,
      dueDate,
      senderName,
      receiverName,
    } = req.body;

    const letter = await Letter.findById(id);
    if (!letter) {
      return res.status(404).json({
        success: false,
        error: 'نامه یافت نشد',
      });
    }

    if (letter.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'فقط نامه‌های در وضعیت پیش‌نویس قابل ویرایش هستند',
      });
    }

    const isAdmin = req.user.role?.name === 'admin';
    const isRegistrar = letter.registeredBy.toString() === req.user.id;

    if (!isAdmin && !isRegistrar) {
      return res.status(403).json({
        success: false,
        error: 'شما مجاز به ویرایش این نامه نیستید',
      });
    }

    if (subject) letter.subject = subject;
    if (content !== undefined) letter.content = content;
    if (summary !== undefined) letter.summary = summary;
    if (classification) letter.classification = classification;
    if (priority) letter.priority = priority;
    if (dueDate) letter.dueDate = dueDate;
    if (senderName !== undefined) letter.senderName = senderName;
    if (receiverName !== undefined) letter.receiverName = receiverName;

    await letter.addTracking('draft', req.user.id, 'نامه ویرایش شد');
    await letter.save();

    await CacheService.delete(`letter:${id}`);
    await CacheService.clearModule('letter:list');
    await CacheService.clearStats();

    res.json({
      success: true,
      data: letter,
      message: 'نامه با موفقیت ویرایش شد',
    });
  } catch (error) {
    console.error('❌ خطا در ویرایش نامه:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// حذف نامه
// =============================================
router.delete('/:id', protect, checkPermission('delete_letter'), async (req, res) => {
  try {
    const { id } = req.params;
    const letter = await Letter.findById(id);
    if (!letter) {
      return res.status(404).json({
        success: false,
        error: 'نامه یافت نشد',
      });
    }

    if (letter.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'فقط نامه‌های در وضعیت پیش‌نویس قابل حذف هستند',
      });
    }

    const isAdmin = req.user.role?.name === 'admin';
    const isRegistrar = letter.registeredBy.toString() === req.user.id;

    if (!isAdmin && !isRegistrar) {
      return res.status(403).json({
        success: false,
        error: 'شما مجاز به حذف این نامه نیستید',
      });
    }

    await letter.deleteOne();

    await CacheService.delete(`letter:${id}`);
    await CacheService.clearModule('letter:list');
    await CacheService.clearStats();

    res.json({
      success: true,
      message: 'نامه با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('❌ خطا در حذف نامه:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
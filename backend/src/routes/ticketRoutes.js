const router = require('express').Router();
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { protect, authorize, checkPermission } = require('../middleware/auth');
const logAudit = require('../utils/auditLogger');
const Notification = require('../models/Notification');
const CacheService = require('../services/cacheService');

// =============================================
// دریافت لیست تیکت‌ها (با کش)
// =============================================
router.get('/', protect, async (req, res) => {
  try {
    const {
      search,
      status,
      priority,
      requester,
      assignedTo,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
    } = req.query;

    const cacheKey = `ticket:list:${JSON.stringify({ search, status, priority, requester, assignedTo, fromDate, toDate, page, limit, userId: req.user.id })}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData.data,
        pagination: cachedData.pagination,
        fromCache: true,
        message: 'لیست تیکت‌ها از کش دریافت شد'
      });
    }

    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (requester) filter.requester = requester;
    if (assignedTo) filter.assignedTo = assignedTo;

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const user = req.user;
    const userRole = user.role?.name || 'user';

    if (userRole !== 'admin' && userRole !== 'support') {
      filter.$or = [{ requester: user._id }, { assignedTo: user._id }];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tickets = await Ticket.find(filter)
      .populate('requester', 'fullName username email')
      .populate('assignedTo', 'fullName username email')
      .populate('relatedHardware', 'name serialNumber')
      .populate('relatedDocument', 'title')
      .populate('comments.user', 'fullName username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Ticket.countDocuments(filter);

    const result = {
      data: tickets,
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
      message: 'لیست تیکت‌ها دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت تیکت‌ها:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// دریافت یک تیکت با ID (با کش)
// =============================================
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const cacheKey = `ticket:${id}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true,
        message: 'تیکت از کش دریافت شد'
      });
    }

    const ticket = await Ticket.findById(id)
      .populate('requester', 'fullName username email')
      .populate('assignedTo', 'fullName username email')
      .populate('relatedHardware', 'name serialNumber')
      .populate('relatedDocument', 'title')
      .populate('comments.user', 'fullName username');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'تیکت یافت نشد',
      });
    }

    const user = req.user;
    const userRole = user.role?.name || 'user';
    const isRequester = ticket.requester._id.toString() === user._id.toString();
    const isAssigned = ticket.assignedTo?._id?.toString() === user._id.toString();

    if (userRole !== 'admin' && userRole !== 'support' && !isRequester && !isAssigned) {
      return res.status(403).json({
        success: false,
        error: 'شما دسترسی به این تیکت ندارید',
      });
    }

    await CacheService.set(cacheKey, ticket, 3600);

    res.json({
      success: true,
      data: ticket,
      fromCache: false,
      message: 'تیکت دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت تیکت:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ایجاد تیکت جدید (با پاک کردن کش)
// =============================================
router.post('/', protect, checkPermission('create_ticket'), async (req, res) => {
  try {
    const {
      title,
      description,
      priority = 'medium',
      assignedTo,
      relatedHardware,
      relatedDocument,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'عنوان و شرح تیکت الزامی است',
      });
    }

    const ticket = await Ticket.create({
      title,
      description,
      priority,
      requester: req.user.id,
      assignedTo: assignedTo || null,
      relatedHardware: relatedHardware || null,
      relatedDocument: relatedDocument || null,
      status: 'open',
    });

    await logAudit(req, 'CREATE', 'TICKET', {
      ticketId: ticket._id,
      title: ticket.title,
      priority: ticket.priority,
    });

    // ارسال اعلان به مسئول
    if (assignedTo) {
      await Notification.create({
        user: assignedTo,
        type: 'ticket_created',
        title: 'تیکت جدید برای شما',
        message: `تیکت "${title}" توسط ${req.user.fullName} برای شما ایجاد شده است`,
        link: `/tickets/${ticket._id}`,
        relatedId: ticket._id,
      });
    }

    // ارسال اعلان به درخواست‌دهنده
    await Notification.create({
      user: req.user.id,
      type: 'ticket_created',
      title: 'تیکت با موفقیت ثبت شد',
      message: `تیکت "${title}" با موفقیت ثبت شد`,
      link: `/tickets/${ticket._id}`,
      relatedId: ticket._id,
    });

    // پاک کردن کش
    await CacheService.clearModule('ticket:');
    await CacheService.clearStats();

    res.status(201).json({
      success: true,
      data: ticket,
      message: 'تیکت با موفقیت ثبت شد',
    });
  } catch (error) {
    console.error('❌ خطا در ایجاد تیکت:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================
// ویرایش تیکت (با پاک کردن کش)
// =============================================
router.put('/:id', protect, checkPermission('edit_ticket'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assignedTo } = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'تیکت یافت نشد',
      });
    }

    const user = req.user;
    const userRole = user.role?.name || 'user';
    const isRequester = ticket.requester.toString() === user._id.toString();

    if (userRole !== 'admin' && userRole !== 'support' && !isRequester) {
      return res.status(403).json({
        success: false,
        error: 'شما مجاز به ویرایش این تیکت نیستید',
      });
    }

    const oldStatus = ticket.status;

    ticket.title = title || ticket.title;
    ticket.description = description || ticket.description;
    ticket.status = status || ticket.status;
    ticket.priority = priority || ticket.priority;
    ticket.assignedTo = assignedTo || ticket.assignedTo;

    await ticket.save();

    await logAudit(req, 'UPDATE', 'TICKET', {
      ticketId: ticket._id,
      title: ticket.title,
      changes: { status, priority, assignedTo },
    });

    // اگر وضعیت تغییر کرده، اعلان ارسال کن
    if (status && status !== oldStatus) {
      await Notification.create({
        user: ticket.requester,
        type: 'ticket_updated',
        title: `وضعیت تیکت تغییر کرد`,
        message: `وضعیت تیکت "${ticket.title}" به ${status} تغییر کرد`,
        link: `/tickets/${ticket._id}`,
        relatedId: ticket._id,
      });
    }

    // پاک کردن کش
    await CacheService.delete(`ticket:${id}`);
    await CacheService.clearModule('ticket:list');
    await CacheService.clearStats();

    res.json({
      success: true,
      data: ticket,
      message: 'تیکت با موفقیت ویرایش شد',
    });
  } catch (error) {
    console.error('❌ خطا در ویرایش تیکت:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================
// افزودن کامنت به تیکت (با پاک کردن کش)
// =============================================
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'متن کامنت الزامی است',
      });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'تیکت یافت نشد',
      });
    }

    ticket.comments = ticket.comments || [];
    ticket.comments.push({
      user: req.user.id,
      text,
      createdAt: new Date(),
    });

    await ticket.save();

    // ارسال اعلان به مسئول و درخواست‌دهنده
    const recipients = [ticket.requester];
    if (ticket.assignedTo) recipients.push(ticket.assignedTo);

    for (const userId of recipients) {
      if (userId.toString() !== req.user.id) {
        await Notification.create({
          user: userId,
          type: 'ticket_updated',
          title: 'کامنت جدید در تیکت',
          message: `${req.user.fullName} در تیکت "${ticket.title}" کامنت گذاشت`,
          link: `/tickets/${ticket._id}`,
          relatedId: ticket._id,
        });
      }
    }

    // پاک کردن کش
    await CacheService.delete(`ticket:${id}`);
    await CacheService.clearModule('ticket:list');

    res.status(201).json({
      success: true,
      data: ticket,
      message: 'کامنت با موفقیت اضافه شد',
    });
  } catch (error) {
    console.error('❌ خطا در افزودن کامنت:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================
// حذف تیکت (با پاک کردن کش)
// =============================================
router.delete('/:id', protect, checkPermission('delete_ticket'), async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'تیکت یافت نشد',
      });
    }

    const user = req.user;
    const userRole = user.role?.name || 'user';
    const isRequester = ticket.requester.toString() === user._id.toString();

    if (userRole !== 'admin' && userRole !== 'support' && !isRequester) {
      return res.status(403).json({
        success: false,
        error: 'شما مجاز به حذف این تیکت نیستید',
      });
    }

    await logAudit(req, 'DELETE', 'TICKET', {
      ticketId: ticket._id,
      title: ticket.title,
    });

    await ticket.remove();

    // پاک کردن کش
    await CacheService.delete(`ticket:${id}`);
    await CacheService.clearModule('ticket:list');
    await CacheService.clearStats();

    res.json({
      success: true,
      message: 'تیکت با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('❌ خطا در حذف تیکت:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
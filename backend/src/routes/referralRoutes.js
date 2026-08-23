const router = require('express').Router();
const Referral = require('../models/Referral');
const Letter = require('../models/Letter');
const Notification = require('../models/Notification');
const { protect, checkPermission } = require('../middleware/auth');
const logAudit = require('../utils/auditLogger');
const { sendNotification } = require('../socket');

// =============================================
// دریافت ارجاعات کاربر
// =============================================
router.get('/my', protect, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    
    const referrals = await Referral.getByUser(req.user.id, status)
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: referrals,
      message: 'ارجاعات شما دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت ارجاعات:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// دریافت ارجاعات یک نامه
// =============================================
router.get('/letter/:letterId', protect, async (req, res) => {
  try {
    const referrals = await Referral.getByLetter(req.params.letterId);
    
    res.json({
      success: true,
      data: referrals,
      message: 'ارجاعات نامه دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت ارجاعات:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ایجاد ارجاع جدید
// =============================================
router.post('/', protect, checkPermission('refer_letter'), async (req, res) => {
  try {
    const {
      letterId,
      to,
      message,
      dueDate,
      priority = 'medium',
      type = 'direct',
    } = req.body;
    
    // بررسی نامه
    const letter = await Letter.findById(letterId);
    if (!letter) {
      return res.status(404).json({
        success: false,
        error: 'نامه یافت نشد',
      });
    }
    
    // بررسی کاربر مقصد
    const User = require('../models/User');
    const targetUser = await User.findById(to);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'کاربر مقصد یافت نشد',
      });
    }
    
    // ایجاد ارجاع
    const referral = await Referral.create({
      letter: letterId,
      from: req.user.id,
      to,
      type,
      message: message || '',
      dueDate: dueDate || null,
      priority,
      status: 'pending',
      history: [{
        status: 'pending',
        user: req.user.id,
        comment: 'ارجاع ایجاد شد',
        timestamp: new Date(),
      }],
    });
    
    // به‌روزرسانی وضعیت نامه
    if (letter.status !== 'referred') {
      letter.status = 'referred';
      await letter.addTracking('referred', req.user.id, `ارجاع به ${targetUser.fullName}`);
      await letter.save();
    }
    
    // اضافه کردن ارجاع به نامه
    letter.referrals = letter.referrals || [];
    letter.referrals.push(referral._id);
    await letter.save();
    
    // ثبت لاگ
    await logAudit(req, 'CREATE', 'REFERRAL', {
      referralId: referral._id,
      letterId: letter._id,
      to: targetUser.username,
    });
    
    // ارسال اعلان به کاربر مقصد
    await Notification.create({
      user: to,
      type: 'referral_received',
      title: 'ارجاع جدید برای شما',
      message: `نامه "${letter.subject}" توسط ${req.user.fullName} به شما ارجاع شد`,
      link: `/letters/${letter._id}`,
      relatedId: referral._id,
      priority: 'high',
    });
    
    sendNotification(to, {
      type: 'referral_received',
      title: '📨 ارجاع جدید',
      message: `نامه "${letter.subject}" به شما ارجاع شد`,
      link: `/letters/${letter._id}`,
    });
    
    res.status(201).json({
      success: true,
      data: referral,
      message: 'ارجاع با موفقیت ثبت شد',
    });
  } catch (error) {
    console.error('❌ خطا در ایجاد ارجاع:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ارجاع گروهی
// =============================================
router.post('/bulk', protect, checkPermission('refer_letter'), async (req, res) => {
  try {
    const { letterId, users, message, dueDate, priority = 'medium' } = req.body;
    
    if (!users || users.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'حداقل یک کاربر برای ارجاع انتخاب کنید',
      });
    }
    
    const letter = await Letter.findById(letterId);
    if (!letter) {
      return res.status(404).json({
        success: false,
        error: 'نامه یافت نشد',
      });
    }
    
    const referrals = [];
    const User = require('../models/User');
    
    for (const userId of users) {
      const targetUser = await User.findById(userId);
      if (!targetUser) continue;
      
      const referral = await Referral.create({
        letter: letterId,
        from: req.user.id,
        to: userId,
        type: 'group',
        message: message || '',
        dueDate: dueDate || null,
        priority,
        status: 'pending',
        history: [{
          status: 'pending',
          user: req.user.id,
          comment: 'ارجاع گروهی ایجاد شد',
          timestamp: new Date(),
        }],
      });
      
      referrals.push(referral);
      letter.referrals = letter.referrals || [];
      letter.referrals.push(referral._id);
      
      // اعلان
      await Notification.create({
        user: userId,
        type: 'referral_received',
        title: 'ارجاع گروهی جدید',
        message: `نامه "${letter.subject}" به صورت گروهی به شما ارجاع شد`,
        link: `/letters/${letter._id}`,
        relatedId: referral._id,
      });
      
      sendNotification(userId, {
        type: 'referral_received',
        title: '📨 ارجاع گروهی',
        message: `نامه "${letter.subject}" به شما ارجاع شد`,
        link: `/letters/${letter._id}`,
      });
    }
    
    letter.status = 'referred';
    await letter.addTracking('referred', req.user.id, `ارجاع گروهی به ${users.length} نفر`);
    await letter.save();
    
    await logAudit(req, 'CREATE', 'REFERRAL', {
      letterId: letter._id,
      action: 'bulk_referral',
      count: referrals.length,
    });
    
    res.status(201).json({
      success: true,
      data: referrals,
      message: `${referrals.length} ارجاع با موفقیت ثبت شد`,
    });
  } catch (error) {
    console.error('❌ خطا در ارجاع گروهی:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// علامت‌گذاری ارجاع به عنوان خوانده شده
// =============================================
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id);
    if (!referral) {
      return res.status(404).json({
        success: false,
        error: 'ارجاع یافت نشد',
      });
    }
    
    // بررسی دسترسی
    if (referral.to.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'شما مجاز به این عملیات نیستید',
      });
    }
    
    await referral.markAsRead(req.user.id);
    
    res.json({
      success: true,
      data: referral,
      message: 'ارجاع به عنوان خوانده شده علامت‌گذاری شد',
    });
  } catch (error) {
    console.error('❌ خطا در علامت‌گذاری ارجاع:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ثبت اقدام روی ارجاع
// =============================================
router.patch('/:id/action', protect, async (req, res) => {
  try {
    const { comment = '' } = req.body;
    
    const referral = await Referral.findById(req.params.id);
    if (!referral) {
      return res.status(404).json({
        success: false,
        error: 'ارجاع یافت نشد',
      });
    }
    
    // بررسی دسترسی
    if (referral.to.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'شما مجاز به این عملیات نیستید',
      });
    }
    
    await referral.action(req.user.id, comment);
    
    // اعلان به ارجاع‌دهنده
    await Notification.create({
      user: referral.from,
      type: 'referral_actioned',
      title: 'اقدام روی ارجاع',
      message: `${req.user.fullName} روی نامه "${referral.letter.subject}" اقدام کرد`,
      link: `/letters/${referral.letter}`,
      relatedId: referral._id,
    });
    
    sendNotification(referral.from, {
      type: 'referral_actioned',
      title: '✅ اقدام انجام شد',
      message: `${req.user.fullName} روی ارجاع شما اقدام کرد`,
      link: `/letters/${referral.letter}`,
    });
    
    res.json({
      success: true,
      data: referral,
      message: 'اقدام با موفقیت ثبت شد',
    });
  } catch (error) {
    console.error('❌ خطا در ثبت اقدام:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ارجاع مجدد
// =============================================
router.post('/:id/forward', protect, async (req, res) => {
  try {
    const { to, message = '' } = req.body;
    
    const referral = await Referral.findById(req.params.id);
    if (!referral) {
      return res.status(404).json({
        success: false,
        error: 'ارجاع یافت نشد',
      });
    }
    
    // بررسی دسترسی
    if (referral.to.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'شما مجاز به این عملیات نیستید',
      });
    }
    
    const newReferral = await referral.forward(req.user.id, to, message);
    
    res.status(201).json({
      success: true,
      data: newReferral,
      message: 'ارجاع مجدد با موفقیت انجام شد',
    });
  } catch (error) {
    console.error('❌ خطا در ارجاع مجدد:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// دریافت ارجاعات معوق
// =============================================
router.get('/overdue', protect, async (req, res) => {
  try {
    const referrals = await Referral.getOverdue()
      .populate('letter', 'subject number')
      .populate('to', 'fullName username');
    
    // فیلتر بر اساس کاربر فعلی
    const myOverdue = referrals.filter(r => r.to._id.toString() === req.user.id);
    
    res.json({
      success: true,
      data: myOverdue,
      message: 'ارجاعات معوق دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت ارجاعات معوق:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
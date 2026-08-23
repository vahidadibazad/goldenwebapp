const router = require('express').Router();
const Signature = require('../models/Signature');
const User = require('../models/User');
const Document = require('../models/Document');
const WorkflowInstance = require('../models/WorkflowInstance');
const Notification = require('../models/Notification');
const { protect, authorize, checkPermission } = require('../middleware/auth');
const logAudit = require('../utils/auditLogger');

// =============================================
// دریافت لیست امضاهای یک هدف
// =============================================
router.get('/target/:targetId/:targetType', protect, async (req, res) => {
  try {
    const { targetId, targetType } = req.params;
    
    const signatures = await Signature.getByTarget(targetId, targetType);

    res.json({
      success: true,
      data: signatures,
      message: 'لیست امضاها با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت امضاها:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// دریافت امضاهای در انتظار برای کاربر جاری
// =============================================
router.get('/pending', protect, async (req, res) => {
  try {
    const signatures = await Signature.getPendingForUser(req.user.id);

    res.json({
      success: true,
      data: signatures,
      message: 'امضاهای در انتظار با موفقیت دریافت شدند'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت امضاهای در انتظار:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// دریافت تاریخچه امضاهای کاربر جاری
// =============================================
router.get('/history', protect, async (req, res) => {
  try {
    const signatures = await Signature.getCompletedForUser(req.user.id);

    res.json({
      success: true,
      data: signatures,
      message: 'تاریخچه امضاها با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت تاریخچه امضاها:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// دریافت یک امضا با ID
// =============================================
router.get('/:id', protect, async (req, res) => {
  try {
    const signature = await Signature.findById(req.params.id)
      .populate('user', 'fullName username email phoneNumber');

    if (!signature) {
      return res.status(404).json({
        success: false,
        error: 'امضا یافت نشد'
      });
    }

    // بررسی دسترسی
    const isAdmin = req.user.role?.name === 'admin' || req.user.role?.name === 'office_manager';
    const isOwner = signature.user._id.toString() === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'شما دسترسی به این امضا ندارید'
      });
    }

    res.json({
      success: true,
      data: signature,
      message: 'اطلاعات امضا با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت امضا:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// ایجاد درخواست امضا جدید
// =============================================
router.post('/', protect, checkPermission('request_signature'), async (req, res) => {
  try {
    const {
      targetId,
      targetType,
      type = 'both',
      description = '',
      order = 0,
      workflowStepId = '',
    } = req.body;

    if (!targetId || !targetType) {
      return res.status(400).json({
        success: false,
        error: 'شناسه و نوع هدف الزامی است'
      });
    }

    // بررسی وجود هدف
    let target;
    if (targetType === 'Document') {
      target = await Document.findOne({
        _id: targetId,
        documentType: 'letter'
      });
    }

    if (!target) {
      return res.status(404).json({
        success: false,
        error: 'هدف مورد نظر یافت نشد'
      });
    }

    // بررسی اینکه کاربر قبلاً امضا نکرده باشد
    const existing = await Signature.findOne({
      targetId,
      targetType,
      user: req.user.id,
      status: { $ne: 'rejected' }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'شما قبلاً برای این مورد درخواست امضا داده‌اید'
      });
    }

    // ایجاد امضا جدید
    const signature = new Signature({
      user: req.user.id,
      targetId,
      targetType,
      type,
      description,
      order,
      workflowStepId,
      status: 'pending',
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || '',
    });

    await signature.save();

    // ثبت لاگ
    await logAudit(req, 'CREATE', 'SIGNATURE', {
      signatureId: signature._id,
      targetId,
      targetType,
      type,
    });

    res.status(201).json({
      success: true,
      data: signature,
      message: 'درخواست امضا با موفقیت ثبت شد'
    });
  } catch (error) {
    console.error('❌ خطا در ایجاد درخواست امضا:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// شروع فرآیند امضا (ارسال OTP)
// =============================================
router.post('/:id/start', protect, async (req, res) => {
  try {
    const signature = await Signature.findById(req.params.id);
    if (!signature) {
      return res.status(404).json({
        success: false,
        error: 'امضا یافت نشد'
      });
    }

    // بررسی دسترسی
    if (signature.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'شما مجاز به شروع این امضا نیستید'
      });
    }

    if (signature.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'این امضا قبلاً شروع شده است'
      });
    }

    // شروع فرآیند امضا
    await signature.startSignature(req.user.id);

    // ارسال اعلان
    await Notification.create({
      user: req.user.id,
      type: 'signature_request',
      title: 'کد تایید امضا ارسال شد',
      message: `کد تایید برای امضای "${signature.targetId}" به شماره موبایل شما ارسال شد`,
      link: `/signatures/${signature._id}`,
      relatedId: signature._id,
      category: 'signature',
      priority: 'high',
      deliveryMethod: 'system',
    });

    res.json({
      success: true,
      data: {
        signatureId: signature._id,
        status: signature.status,
        message: 'کد تایید با موفقیت ارسال شد',
        // OTP را در پاسخ بر نمی‌گردانیم
      },
      message: 'کد تایید ارسال شد'
    });
  } catch (error) {
    console.error('❌ خطا در شروع امضا:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// تایید OTP
// =============================================
router.post('/:id/verify-otp', protect, async (req, res) => {
  try {
    const { code } = req.body;
    const signature = await Signature.findById(req.params.id);
    
    if (!signature) {
      return res.status(404).json({
        success: false,
        error: 'امضا یافت نشد'
      });
    }

    // بررسی دسترسی
    if (signature.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'شما مجاز به تایید این امضا نیستید'
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'کد تایید الزامی است'
      });
    }

    // تایید OTP
    await signature.verifyOTP(code);

    // اگر امضا کامل شده
    if (signature.status === 'completed') {
      // به‌روزرسانی وضعیت هدف
      if (signature.targetType === 'Document') {
        const document = await Document.findById(signature.targetId);
        if (document) {
          document.isSigned = true;
          document.signedAt = new Date();
          if (!document.signatures) document.signatures = [];
          document.signatures.push(signature._id);
          await document.save();
        }
      }

      // ثبت لاگ
      await logAudit(req, 'UPDATE', 'SIGNATURE', {
        signatureId: signature._id,
        action: 'complete',
        type: signature.type,
      });

      // ارسال اعلان
      await Notification.create({
        user: signature.user,
        type: 'signature_completed',
        title: 'امضا با موفقیت انجام شد',
        message: `امضای شما با موفقیت ثبت شد`,
        link: `/signatures/${signature._id}`,
        relatedId: signature._id,
        category: 'signature',
        priority: 'medium',
        deliveryMethod: 'system',
      });
    }

    res.json({
      success: true,
      data: {
        signatureId: signature._id,
        status: signature.status,
      },
      message: signature.status === 'completed' ? 'امضا با موفقیت تکمیل شد' : 'کد تایید با موفقیت تایید شد'
    });
  } catch (error) {
    console.error('❌ خطا در تایید OTP:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// آپلود امضای تصویری
// =============================================
router.post('/:id/upload-image', protect, async (req, res) => {
  try {
    const { imageUrl, thumbnail } = req.body;
    const signature = await Signature.findById(req.params.id);
    
    if (!signature) {
      return res.status(404).json({
        success: false,
        error: 'امضا یافت نشد'
      });
    }

    // بررسی دسترسی
    if (signature.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'شما مجاز به آپلود امضا نیستید'
      });
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'آدرس تصویر امضا الزامی است'
      });
    }

    // آپلود امضای تصویری
    await signature.uploadImage(imageUrl, {
      thumbnail: thumbnail || '',
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || '',
    });

    // اگر امضا کامل شده
    if (signature.status === 'completed') {
      // به‌روزرسانی وضعیت هدف
      if (signature.targetType === 'Document') {
        const document = await Document.findById(signature.targetId);
        if (document) {
          document.isSigned = true;
          document.signedAt = new Date();
          if (!document.signatures) document.signatures = [];
          document.signatures.push(signature._id);
          await document.save();
        }
      }

      // ثبت لاگ
      await logAudit(req, 'UPDATE', 'SIGNATURE', {
        signatureId: signature._id,
        action: 'complete',
        type: signature.type,
      });
    }

    res.json({
      success: true,
      data: {
        signatureId: signature._id,
        status: signature.status,
        imageUrl: signature.image.url,
      },
      message: signature.status === 'completed' ? 'امضا با موفقیت تکمیل شد' : 'امضای تصویری با موفقیت آپلود شد'
    });
  } catch (error) {
    console.error('❌ خطا در آپلود امضای تصویری:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// تکمیل امضا (برای زمانی که هر دو روش انجام شده)
// =============================================
router.patch('/:id/complete', protect, async (req, res) => {
  try {
    const signature = await Signature.findById(req.params.id);
    
    if (!signature) {
      return res.status(404).json({
        success: false,
        error: 'امضا یافت نشد'
      });
    }

    // بررسی دسترسی
    if (signature.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'شما مجاز به تکمیل این امضا نیستید'
      });
    }

    await signature.complete();

    // به‌روزرسانی وضعیت هدف
    if (signature.targetType === 'Document') {
      const document = await Document.findById(signature.targetId);
      if (document) {
        document.isSigned = true;
        document.signedAt = new Date();
        if (!document.signatures) document.signatures = [];
        document.signatures.push(signature._id);
        await document.save();
      }
    }

    // ثبت لاگ
    await logAudit(req, 'UPDATE', 'SIGNATURE', {
      signatureId: signature._id,
      action: 'complete',
    });

    // ارسال اعلان
    await Notification.create({
      user: signature.user,
      type: 'signature_completed',
      title: 'امضا با موفقیت انجام شد',
      message: `امضای شما با موفقیت ثبت شد`,
      link: `/signatures/${signature._id}`,
      relatedId: signature._id,
      category: 'signature',
      priority: 'medium',
      deliveryMethod: 'system',
    });

    res.json({
      success: true,
      data: signature,
      message: 'امضا با موفقیت تکمیل شد'
    });
  } catch (error) {
    console.error('❌ خطا در تکمیل امضا:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// رد امضا
// =============================================
router.patch('/:id/reject', protect, async (req, res) => {
  try {
    const { reason = '' } = req.body;
    const signature = await Signature.findById(req.params.id);
    
    if (!signature) {
      return res.status(404).json({
        success: false,
        error: 'امضا یافت نشد'
      });
    }

    // بررسی دسترسی
    if (signature.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'شما مجاز به رد این امضا نیستید'
      });
    }

    await signature.reject(reason);

    // ثبت لاگ
    await logAudit(req, 'UPDATE', 'SIGNATURE', {
      signatureId: signature._id,
      action: 'reject',
      reason,
    });

    res.json({
      success: true,
      data: signature,
      message: 'امضا با موفقیت رد شد'
    });
  } catch (error) {
    console.error('❌ خطا در رد امضا:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// دریافت امضاهای معتبر یک هدف
// =============================================
router.get('/valid/:targetId/:targetType', protect, async (req, res) => {
  try {
    const { targetId, targetType } = req.params;
    
    const signatures = await Signature.getValidSignatures(targetId, targetType);

    res.json({
      success: true,
      data: signatures,
      message: 'امضاهای معتبر با موفقیت دریافت شدند'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت امضاهای معتبر:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// دریافت آمار امضاها
// =============================================
router.get('/stats/overview', protect, authorize('admin', 'office_manager'), async (req, res) => {
  try {
    const stats = await Signature.getStats();
    
    // دریافت آمار امضاهای امروز
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCount = await Signature.countDocuments({
      signedAt: { $gte: today },
      status: 'completed'
    });

    // دریافت آمار امضاهای این هفته
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekCount = await Signature.countDocuments({
      signedAt: { $gte: weekAgo },
      status: 'completed'
    });

    res.json({
      success: true,
      data: {
        ...stats,
        todayCount,
        weekCount,
      },
      message: 'آمار امضاها با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت آمار امضاها:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
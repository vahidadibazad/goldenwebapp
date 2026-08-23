// backend/src/routes/letterNumberingRoutes.js
const router = require('express').Router();
const LetterNumbering = require('../models/LetterNumbering');
const { protect, authorize } = require('../middleware/auth');
const logAudit = require('../utils/auditLogger');

// =============================================
// دریافت لیست الگوهای شماره‌گذاری
// =============================================
router.get('/', protect, async (req, res) => {
  try {
    const { secretariatId } = req.query;
    const filter = { isActive: true };
    if (secretariatId) filter.secretariat = secretariatId;

    const numberings = await LetterNumbering.find(filter)
      .populate('secretariat', 'name code')
      .sort({ letterType: 1, name: 1 });

    res.json({
      success: true,
      data: numberings,
      message: 'لیست الگوهای شماره‌گذاری دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت الگوهای شماره‌گذاری:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// دریافت یک الگو با ID
// =============================================
router.get('/:id', protect, async (req, res) => {
  try {
    const numbering = await LetterNumbering.findById(req.params.id)
      .populate('secretariat', 'name code')
      .populate('createdBy', 'fullName username');

    if (!numbering) {
      return res.status(404).json({
        success: false,
        error: 'الگوی شماره‌گذاری یافت نشد',
      });
    }

    res.json({
      success: true,
      data: numbering,
      message: 'اطلاعات الگوی شماره‌گذاری دریافت شد',
    });
  } catch (error) {
    console.error('❌ خطا در دریافت الگوی شماره‌گذاری:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ایجاد الگوی شماره‌گذاری جدید (فقط ادمین)
// =============================================
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      name,
      code,
      letterType,
      format,
      separator,
      seqLength,
      secretariat,
    } = req.body;

    if (!name || !code || !letterType) {
      return res.status(400).json({
        success: false,
        error: 'نام، کد و نوع نامه الزامی است',
      });
    }

    // بررسی تکراری نبودن کد
    const existing = await LetterNumbering.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'الگویی با این کد قبلاً ثبت شده است',
      });
    }

    const numbering = await LetterNumbering.create({
      name,
      code: code.toUpperCase(),
      letterType,
      format: format || '{type}-{year}-{month}-{seq}',
      separator: separator || '-',
      seqLength: seqLength || 4,
      secretariat: secretariat || null,
      createdBy: req.user.id,
      isActive: true,
    });

    await logAudit(req, 'CREATE', 'LETTER_NUMBERING', {
      numberingId: numbering._id,
      name: numbering.name,
      code: numbering.code,
    });

    res.status(201).json({
      success: true,
      data: numbering,
      message: 'الگوی شماره‌گذاری با موفقیت ایجاد شد',
    });
  } catch (error) {
    console.error('❌ خطا در ایجاد الگوی شماره‌گذاری:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ویرایش الگوی شماره‌گذاری (فقط ادمین)
// =============================================
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      name,
      code,
      letterType,
      format,
      separator,
      seqLength,
      secretariat,
      isActive,
    } = req.body;

    const numbering = await LetterNumbering.findById(req.params.id);
    if (!numbering) {
      return res.status(404).json({
        success: false,
        error: 'الگوی شماره‌گذاری یافت نشد',
      });
    }

    // بررسی تکراری نبودن کد
    if (code && code !== numbering.code) {
      const existing = await LetterNumbering.findOne({ code: code.toUpperCase() });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'الگویی با این کد قبلاً ثبت شده است',
        });
      }
    }

    numbering.name = name || numbering.name;
    numbering.code = code ? code.toUpperCase() : numbering.code;
    numbering.letterType = letterType || numbering.letterType;
    numbering.format = format || numbering.format;
    numbering.separator = separator || numbering.separator;
    numbering.seqLength = seqLength || numbering.seqLength;
    numbering.secretariat = secretariat !== undefined ? secretariat : numbering.secretariat;
    numbering.isActive = isActive !== undefined ? isActive : numbering.isActive;

    await numbering.save();

    await logAudit(req, 'UPDATE', 'LETTER_NUMBERING', {
      numberingId: numbering._id,
      name: numbering.name,
      code: numbering.code,
    });

    res.json({
      success: true,
      data: numbering,
      message: 'الگوی شماره‌گذاری با موفقیت ویرایش شد',
    });
  } catch (error) {
    console.error('❌ خطا در ویرایش الگوی شماره‌گذاری:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// حذف الگوی شماره‌گذاری (فقط ادمین)
// =============================================
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const numbering = await LetterNumbering.findById(req.params.id);
    if (!numbering) {
      return res.status(404).json({
        success: false,
        error: 'الگوی شماره‌گذاری یافت نشد',
      });
    }

    await logAudit(req, 'DELETE', 'LETTER_NUMBERING', {
      numberingId: numbering._id,
      name: numbering.name,
      code: numbering.code,
    });

    await numbering.deleteOne();

    res.json({
      success: true,
      message: 'الگوی شماره‌گذاری با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('❌ خطا در حذف الگوی شماره‌گذاری:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// تولید شماره نمونه
// =============================================
router.post('/generate', protect, async (req, res) => {
  try {
    const { letterType, secretariatId, departmentCode = '' } = req.body;

    if (!letterType || !secretariatId) {
      return res.status(400).json({
        success: false,
        error: 'نوع نامه و دبیرخانه الزامی است',
      });
    }

    const LetterNumberingService = require('../services/letterNumberingService');
    const result = await LetterNumberingService.generateNumber(
      letterType,
      secretariatId,
      departmentCode
    );

    res.json({
      success: true,
      data: result,
      message: 'شماره نمونه با موفقیت تولید شد',
    });
  } catch (error) {
    console.error('❌ خطا در تولید شماره نمونه:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
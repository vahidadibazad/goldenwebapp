const router = require('express').Router();
const OCRSearchService = require('../services/ocrSearchService');
const { protect, checkPermission } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// تنظیمات آپلود برای OCR
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/ocr');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `ocr-${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // ۵۰ مگابایت
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع فایل پشتیبانی نمی‌شود'), false);
    }
  },
});

// =============================================
// ✅ پردازش OCR یک سند موجود
// =============================================
router.post('/process/:id', protect, checkPermission('edit_document'), async (req, res) => {
  try {
    const result = await OCRSearchService.processAndIndexDocument(req.params.id);
    res.json({
      success: true,
      data: result,
      message: 'OCR با موفقیت انجام شد',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ آپلود و OCR یک فایل جدید
// =============================================
router.post('/upload', protect, checkPermission('upload_document'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'فایلی انتخاب نشده است',
      });
    }

    // پردازش OCR
    const result = await OCRService.processDocument(req.file.path, req.file.originalname);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: {
        fileName: req.file.originalname,
        filePath: req.file.path,
        ...result,
      },
      message: 'فایل با موفقیت آپلود و پردازش شد',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ جستجوی OCR
// =============================================
router.get('/search', protect, async (req, res) => {
  try {
    const { q, category, fileType, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'عبارت جستجو الزامی است',
      });
    }

    const filters = {};
    if (category) filters.category = category;
    if (fileType) filters.fileType = fileType;

    const result = await OCRSearchService.searchOCR(q.trim(), filters, { page, limit });

    res.json({
      success: true,
      data: result,
      message: 'نتایج جستجوی OCR دریافت شد',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ جستجوی درون متنی یک سند
// =============================================
router.get('/search-in-document/:id', protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'عبارت جستجو الزامی است',
      });
    }

    const result = await OCRSearchService.searchInText(q.trim(), req.params.id);

    res.json({
      success: true,
      data: result,
      message: 'نتایج جستجوی درون متنی دریافت شد',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ پردازش همه اسناد بدون OCR
// =============================================
router.post('/process-all', protect, checkPermission('edit_document'), async (req, res) => {
  try {
    const results = await OCRSearchService.processAllUnprocessedDocuments();
    res.json({
      success: true,
      data: results,
      message: `پردازش ${results.length} سند انجام شد`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ دریافت آمار OCR
// =============================================
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = await OCRSearchService.getOCRStats();
    res.json({
      success: true,
      data: stats,
      message: 'آمار OCR دریافت شد',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================
// ✅ حذف داده‌های OCR یک سند
// =============================================
router.delete('/clear/:id', protect, checkPermission('edit_document'), async (req, res) => {
  try {
    const result = await OCRSearchService.clearOCR(req.params.id);
    res.json({
      success: true,
      data: result,
      message: 'داده‌های OCR با موفقیت حذف شد',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
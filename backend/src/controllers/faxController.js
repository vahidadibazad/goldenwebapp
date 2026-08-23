// backend/src/controllers/faxController.js
const FaxService = require('../services/faxService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// تنظیمات آپلود فایل فکس
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/fax');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `fax-${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'application/pdf',
      'image/tiff',
      'image/jpeg',
      'image/png',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('فرمت فایل مجاز نیست. فقط PDF, TIFF, JPEG, PNG'));
    }
  },
});

class FaxController {

  // =============================================
  // ارسال فکس
  // =============================================
  static async sendFax(req, res) {
    try {
      const { faxNumber, letterId, provider } = req.body;

      if (!faxNumber) {
        return res.status(400).json({
          success: false,
          error: 'شماره فکس الزامی است',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'فایل فکس الزامی است',
        });
      }

      const fax = await FaxService.sendFax(
        req.user.id,
        {
          faxNumber,
          filePath: req.file.path,
          fileName: req.file.originalname,
          letterId: letterId || null,
          provider: provider || 'internal',
          metadata: {
            uploadedBy: req.user.id,
            uploadedAt: new Date(),
          },
        }
      );

      res.status(201).json({
        success: true,
        data: fax,
        message: 'فکس با موفقیت ارسال شد',
      });
    } catch (error) {
      console.error('❌ خطا در ارسال فکس:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت فکس (Webhook برای Providerها)
  // =============================================
  static async receiveFax(req, res) {
    try {
      const data = req.body;

      // اعتبارسنجی
      if (!data.faxNumber || !data.filePath) {
        return res.status(400).json({
          success: false,
          error: 'اطلاعات فکس ناقص است',
        });
      }

      const fax = await FaxService.receiveFax(data);

      res.status(200).json({
        success: true,
        data: fax,
        message: 'فکس با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت فکس:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت وضعیت فکس
  // =============================================
  static async getFaxStatus(req, res) {
    try {
      const { id } = req.params;

      const status = await FaxService.getFaxStatus(id);

      // بررسی دسترسی
      if (status.user && status.user._id.toString() !== req.user.id) {
        const isAdmin = req.user.role?.name === 'admin';
        if (!isAdmin) {
          return res.status(403).json({
            success: false,
            error: 'شما دسترسی به این فکس را ندارید',
          });
        }
      }

      res.status(200).json({
        success: true,
        data: status,
        message: 'وضعیت فکس با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت وضعیت فکس:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت لیست فکس‌ها
  // =============================================
  static async getFaxList(req, res) {
    try {
      const {
        direction,
        status,
        fromDate,
        toDate,
        limit,
        page,
      } = req.query;

      const result = await FaxService.getFaxList(req.user.id, {
        direction,
        status,
        fromDate,
        toDate,
        limit: parseInt(limit) || 20,
        page: parseInt(page) || 1,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'لیست فکس‌ها با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت لیست فکس‌ها:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت آمار فکس
  // =============================================
  static async getFaxStats(req, res) {
    try {
      const Fax = require('../models/Fax');
      const stats = await Fax.getStats(req.user.id);

      res.status(200).json({
        success: true,
        data: stats,
        message: 'آمار فکس با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت آمار فکس:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // لغو فکس
  // =============================================
  static async cancelFax(req, res) {
    try {
      const { id } = req.params;
      const Fax = require('../models/Fax');

      const fax = await Fax.findById(id);
      if (!fax) {
        return res.status(404).json({
          success: false,
          error: 'فکس یافت نشد',
        });
      }

      // بررسی دسترسی
      if (fax.user.toString() !== req.user.id) {
        const isAdmin = req.user.role?.name === 'admin';
        if (!isAdmin) {
          return res.status(403).json({
            success: false,
            error: 'شما دسترسی به این فکس را ندارید',
          });
        }
      }

      if (fax.status !== 'pending' && fax.status !== 'processing') {
        return res.status(400).json({
          success: false,
          error: 'فکس قابل لغو نیست',
        });
      }

      fax.status = 'cancelled';
      await fax.save();

      res.status(200).json({
        success: true,
        data: fax,
        message: 'فکس با موفقیت لغو شد',
      });
    } catch (error) {
      console.error('❌ خطا در لغو فکس:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // Middleware آپلود فکس
  // =============================================
  static uploadFax() {
    return upload.single('faxFile');
  }

  static handleUploadError(err, req, res, next) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'FILE_TOO_LARGE') {
        return res.status(400).json({
          success: false,
          error: 'حجم فایل بیش از ۲۰ مگابایت است',
        });
      }
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
    next();
  }
}

module.exports = FaxController;
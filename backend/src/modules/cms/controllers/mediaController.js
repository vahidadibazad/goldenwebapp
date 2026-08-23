// backend/src/modules/cms/controllers/mediaController.js
const MediaService = require('../services/mediaService');
const logAudit = require('../../../utils/auditLogger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// =============================================
// تنظیمات Multer
// =============================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../../uploads/cms');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/avi', 'video/mov', 'video/webm',
    'audio/mpeg', 'audio/wav',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('فرمت فایل پشتیبانی نمی‌شود'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// =============================================
// کنترلر
// =============================================

class MediaController {

  // =============================================
  // آپلود فایل
  // =============================================

  static uploadMiddleware() {
    return upload.single('file');
  }

  static async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'فایلی آپلود نشده است' });
      }

      const media = await MediaService.uploadFile(
        req.file,
        req.body,
        req.user.id
      );

      await logAudit(req, 'CREATE', 'CMS_MEDIA', {
        mediaId: media._id,
        fileName: media.fileName,
      });

      res.status(201).json({
        success: true,
        data: media,
        message: 'فایل با موفقیت آپلود شد',
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // =============================================
  // دریافت فایل‌ها
  // =============================================

  static async getMedia(req, res) {
    try {
      const { mediaType, status, category, tag, search, page, limit } = req.query;
      const result = await MediaService.getMedia({
        mediaType,
        status,
        category,
        tag,
        search,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getMediaById(req, res) {
    try {
      const media = await MediaService.getMediaById(req.params.id);
      if (!media) {
        return res.status(404).json({ success: false, error: 'فایل یافت نشد' });
      }
      res.json({ success: true, data: media });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getMediaStats(req, res) {
    try {
      const stats = await MediaService.getMediaStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // =============================================
  // دانلود فایل
  // =============================================

  static async downloadFile(req, res) {
    try {
      const media = await MediaService.getMediaById(req.params.id);
      if (!media) {
        return res.status(404).json({ success: false, error: 'فایل یافت نشد' });
      }

      // افزایش دانلود
      await MediaService.incrementDownload(req.params.id);

      // بررسی دسترسی
      if (media.accessLevel !== 'public') {
        // بررسی مجوز کاربر
        const user = req.user;
        if (!user) {
          return res.status(403).json({ success: false, error: 'دسترسی غیرمجاز' });
        }
        // بررسی نقش‌های مجاز
        if (media.allowedRoles && media.allowedRoles.length > 0) {
          const userRole = user.role?.name || 'user';
          if (!media.allowedRoles.includes(userRole) && userRole !== 'admin') {
            return res.status(403).json({ success: false, error: 'دسترسی غیرمجاز' });
          }
        }
      }

      const filePath = media.filePath;
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: 'فایل فیزیکی یافت نشد' });
      }

      res.download(filePath, media.fileName);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // =============================================
  // مدیریت فایل‌ها
  // =============================================

  static async updateMedia(req, res) {
    try {
      const media = await MediaService.updateMedia(req.params.id, req.body, req.user.id);
      await logAudit(req, 'UPDATE', 'CMS_MEDIA', { mediaId: media._id });
      res.json({ success: true, data: media });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async deleteMedia(req, res) {
    try {
      await MediaService.deleteMedia(req.params.id);
      await logAudit(req, 'DELETE', 'CMS_MEDIA', { mediaId: req.params.id });
      res.json({ success: true, message: 'فایل با موفقیت حذف شد' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // =============================================
  // مدیریت خطای آپلود
  // =============================================

  static handleUploadError(err, req, res, next) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'FILE_TOO_LARGE') {
        return res.status(400).json({
          success: false,
          error: 'حجم فایل بیش از حد مجاز است (حداکثر ۵۰ مگابایت)',
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

module.exports = MediaController;
// backend/src/routes/backupRoutes.js

const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const backupDatabase = require('../utils/backup');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// =============================================
// ✅ تنظیمات آپلود برای بازگردانی
// =============================================
const upload = multer({
  dest: 'uploads/temp/',
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('فایل باید JSON باشد'), false);
    }
  },
});

// =============================================
// ✅ دریافت لیست پشتیبان‌ها
// =============================================
router.get('/list', protect, authorize('admin'), async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      return res.json({
        success: true,
        data: [],
        message: 'هیچ پشتیبان‌گیری وجود ندارد'
      });
    }
    
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .map(f => {
        const stats = fs.statSync(path.join(backupDir, f));
        return {
          name: f,
          size: (stats.size / 1024 / 1024).toFixed(2),
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    
    res.json({
      success: true,
      data: files,
      message: 'لیست پشتیبان‌ها دریافت شد'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// ✅ پشتیبان‌گیری دستی
// =============================================
router.post('/manual', protect, authorize('admin'), async (req, res) => {
  try {
    const result = await backupDatabase();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result,
        message: 'پشتیبان‌گیری با موفقیت انجام شد'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// ✅ دانلود فایل پشتیبان
// =============================================
router.get('/download/:filename', protect, authorize('admin'), async (req, res) => {
  try {
    const { filename } = req.params;
    const backupDir = path.join(__dirname, '../../backups');
    const filePath = path.join(backupDir, filename);
    
    // بررسی امنیتی: فقط فایل‌های JSON که با backup- شروع می‌شوند
    if (!filename.startsWith('backup-') || !filename.endsWith('.json')) {
      return res.status(400).json({
        success: false,
        error: 'نام فایل نامعتبر است'
      });
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'فایل پشتیبان یافت نشد'
      });
    }
    
    res.download(filePath, filename);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// ✅ حذف فایل پشتیبان
// =============================================
router.delete('/:filename', protect, authorize('admin'), async (req, res) => {
  try {
    const { filename } = req.params;
    const backupDir = path.join(__dirname, '../../backups');
    const filePath = path.join(backupDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'فایل پشتیبان یافت نشد'
      });
    }
    
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: 'فایل پشتیبان با موفقیت حذف شد'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// ✅ بازگردانی (Restore)
// =============================================
router.post('/restore', protect, authorize('admin'), upload.single('backupFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'فایل پشتیبان انتخاب نشده است'
      });
    }
    
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const backupData = JSON.parse(fileContent);
    
    // بازگردانی
    const db = mongoose.connection.db;
    const results = {};
    
    for (const [collectionName, documents] of Object.entries(backupData)) {
      if (documents.length === 0) continue;
      
      // حذف داده‌های قبلی
      await db.collection(collectionName).deleteMany({});
      
      // درج داده‌های جدید
      const result = await db.collection(collectionName).insertMany(documents);
      results[collectionName] = result.insertedCount;
      
      console.log(`✅ ${collectionName}: ${result.insertedCount} سند بازگردانی شد`);
    }
    
    // حذف فایل موقت
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      data: results,
      message: 'پشتیبان با موفقیت بازگردانی شد'
    });
  } catch (error) {
    console.error('❌ خطا در بازگردانی:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
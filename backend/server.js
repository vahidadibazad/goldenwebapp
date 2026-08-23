// =============================================
// تنظیمات Encoding برای نمایش صحیح فارسی
// =============================================
process.stdout.setDefaultEncoding('utf8');
process.stderr.setDefaultEncoding('utf8');

// تنظیم کدصفحه برای ویندوز
if (process.platform === 'win32') {
  try {
    const { execSync } = require('child_process');
    execSync('chcp 65001 > nul');
  } catch (e) {
    // خطا را نادیده بگیر
  }
}

// تنظیم متغیرهای محیطی برای UTF-8
process.env.NODE_OPTIONS = '--max-old-space-size=4096';
process.env.PYTHONIOENCODING = 'utf-8';
process.env.LANG = 'en_US.UTF-8';
process.env.LC_ALL = 'en_US.UTF-8';

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const helmet = require('helmet');
require('dotenv').config();

// =============================================
// Rate Limiter
// =============================================
const {
  apiLimiter,
  loginLimiter,
  uploadLimiter,
  searchLimiter,
  strictLimiter,
} = require('./src/config/rateLimiter');

// =============================================
// لاگر زیبا
// =============================================
const logger = require('./src/utils/logger');

// =============================================
// پشتیبان‌گیری خودکار (هر ۲۴ ساعت)
// =============================================
const backupDatabase = require('./src/utils/backup');

// =============================================
// سیدرها
// =============================================
const { seedPermissions } = require('./src/utils/seedPermissions');
const seedEnumValues = require('./src/utils/seedEnumValues');
const seedMenuItems = require('./src/utils/seedMenuItems');
const seedSystemSettings = require('./src/utils/seedSystemSettings');

// =============================================
// بازبینی خودکار دسترسی‌ها (هر ۷ روز)
// =============================================
const accessReview = require('./src/utils/accessReview');

// =============================================
// Middlewareهای احراز هویت و مجوز
// =============================================
const { protect } = require('./src/middleware/auth');

// =============================================
// مدل Document برای دانلود
// =============================================
const Document = require('./src/models/Document');

// =============================================
// Socket.io
// =============================================
const { initSocket } = require('./socket');

// =============================================
// Redis
// =============================================
const { connectRedis } = require('./src/config/redis');

// =============================================
// Cache Service
// =============================================
const CacheService = require('./src/services/cacheService');

// =============================================
// Multer برای آپلود فایل پشتیبان
// =============================================
const multer = require('multer');
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
// سرور
// =============================================
const app = express();

// =============================================
// ✅ تنظیمات امنیتی (Helmet)
// =============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// =============================================
// ✅ تنظیمات CORS (برای اتصال از آدرس Public)
// =============================================
const corsOptions = {
  origin: '*', // برای توسعه - در تولید محدود کنید
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// =============================================
// فشرده‌سازی (Compression)
// =============================================
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
}));

// =============================================
// محدودیت نرخ درخواست (Rate Limiting)
// =============================================
app.use('/api', apiLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', loginLimiter);
app.use('/api/documents', uploadLimiter);
app.use('/api/search', searchLimiter);
app.use('/api/hardware', strictLimiter);
app.use('/api/credentials', strictLimiter);
app.use('/api/users', strictLimiter);
app.use('/api/roles', strictLimiter);

// =============================================
// Middlewareهای عمومی
// =============================================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// =============================================
// مسیرهای استاتیک
// =============================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =============================================
// ✅ مسیر دانلود (نسخه نهایی با کش)
// =============================================
app.get('/api/documents/download/:id', async (req, res) => {
  try {
    console.log('='.repeat(60));
    console.log(`📥 درخواست دانلود: ${req.params.id}`);

    const cacheKey = `document:download:${req.params.id}`;
    const cachedFile = await CacheService.get(cacheKey);
    if (cachedFile && cachedFile.filePath && fs.existsSync(cachedFile.filePath)) {
      console.log('✅ فایل از کش دریافت شد');
      const filePath = cachedFile.filePath;
      const fileName = cachedFile.fileName;
      const contentType = cachedFile.contentType || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`);
      res.setHeader('Content-Length', fs.statSync(filePath).size);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      return;
    }

    const document = await Document.findById(req.params.id);
    if (!document) {
      console.log('❌ سند یافت نشد');
      return res.status(404).json({ 
        success: false, 
        error: 'سند یافت نشد' 
      });
    }
    
    console.log(`📄 سند پیدا شد: ${document.title}`);
    console.log(`📁 مسیر ذخیره‌شده: ${document.filePath}`);

    let filePath = document.filePath;
    
    if (filePath.startsWith('uploads/')) {
      filePath = path.join(__dirname, filePath);
    } else if (!path.isAbsolute(filePath)) {
      filePath = path.join(__dirname, filePath);
    }

    console.log(`📁 مسیر کامل فایل: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.log('❌ فایل فیزیکی وجود ندارد');
      return res.status(404).json({ 
        success: false, 
        error: 'فایل یافت نشد' 
      });
    }

    const ext = path.extname(filePath).toLowerCase();
    console.log(`📄 پسوند واقعی فایل: ${ext}`);

    let baseName = document.title || 'سند';
    const titleWithoutExt = baseName.replace(/\.[^/.]+$/, '');
    const finalFileName = `${titleWithoutExt}${ext}`;
    console.log(`📄 نام نهایی برای دانلود: ${finalFileName}`);

    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    console.log(`📋 Content-Type تنظیم شده: ${contentType}`);

    await CacheService.set(cacheKey, {
      filePath,
      fileName: finalFileName,
      contentType,
    }, 3600);

    const encodedFileName = encodeURIComponent(finalFileName);
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 
      `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`
    );
    res.setHeader('Content-Length', fs.statSync(filePath).size);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    console.log(`✅ شروع دانلود: ${finalFileName}`);
    console.log('='.repeat(60));

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      console.error('❌ خطا در استریم فایل:', err);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          error: 'خطا در ارسال فایل' 
        });
      }
    });

    fileStream.on('end', () => {
      console.log('✅ دانلود کامل شد');
    });

  } catch (error) {
    console.error('❌ خطا در دانلود:', error);
    console.error('📚 استک کامل:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// =============================================
// ✅ مسیرهای API (نسخه نهایی کامل)
// =============================================

// ---------- مسیرهای اصلی ----------
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/hardware', require('./src/routes/hardwareRoutes'));
app.use('/api/credentials', require('./src/routes/credentialRoutes'));
app.use('/api/tickets', require('./src/routes/ticketRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));

// ---------- مسیر اعلان‌ها ----------
app.use('/api/notifications', require('./src/routes/notificationRoutes'));

// ---------- مسیرهای مدیریتی ----------
app.use('/api/audit', require('./src/routes/auditRoutes'));
app.use('/api/roles', require('./src/routes/roleRoutes'));
app.use('/api/settings', require('./src/routes/settingRoutes'));
app.use('/api/search', require('./src/routes/searchRoutes'));
app.use('/api/backup', require('./src/routes/backupRoutes'));
app.use('/api/departments', require('./src/routes/departmentRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/email', require('./src/routes/emailRoutes'));

// ---------- مسیرهای اسناد ----------
app.use('/api/documents', require('./src/routes/documentRoutes'));

// ---------- مسیرهای نامه‌ها و گردش کار ----------
app.use('/api/letters', require('./src/routes/letterRoutes'));
app.use('/api/workflow', require('./src/routes/workflowRoutes'));
app.use('/api/signatures', require('./src/routes/signatureRoutes'));
app.use('/api/reminders', require('./src/routes/reminderRoutes'));

// ---------- مسیرهای Enum و منو ----------
app.use('/api/enums', require('./src/routes/enumRoutes'));
app.use('/api/menu', require('./src/routes/menuRoutes'));

// ---------- مسیرهای OCR ----------
app.use('/api/ocr', require('./src/routes/ocrSearchRoutes'));

// ---------- مسیرهای دبیرخانه و مکاتبات ----------
app.use('/api/secretariats', require('./src/routes/secretariatRoutes'));
app.use('/api/referrals', require('./src/routes/referralRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));
app.use('/api/archives', require('./src/routes/archiveRoutes'));
app.use('/api/reports', require('./src/routes/reportRoutes'));
app.use('/api/integration', require('./src/routes/integrationRoutes'));
app.use('/api/letter-status', require('./src/routes/letterStatusRoutes'));

// ---------- مسیر فکس ----------
app.use('/api/fax', require('./src/routes/faxRoutes'));

// ---------- مسیر وب‌هوک ----------
app.use('/api/webhooks', require('./src/routes/webhookRoutes'));

// ---------- مسیر شماره‌گذاری نامه‌ها ----------
app.use('/api/letter-numbering', require('./src/routes/letterNumberingRoutes'));

// =============================================
// ✅ مسیرهای CMS
// =============================================

// مسیرهای عمومی CMS (بدون احراز هویت)
app.use('/api/cms/public', require('./src/modules/cms/routes/publicRoutes'));

// مسیرهای محافظت‌شده CMS
app.use('/api/cms', require('./src/modules/cms/routes/contentRoutes'));
app.use('/api/cms/comments', require('./src/modules/cms/routes/commentRoutes'));
app.use('/api/cms/ecommerce', require('./src/modules/cms/routes/ecommerceRoutes'));
app.use('/api/cms/media', require('./src/modules/cms/routes/mediaRoutes'));
app.use('/api/cms/tags', require('./src/modules/cms/routes/tagRoutes'));

// =============================================
// ✅ مسیرهای CRM
// =============================================
app.use('/api/crm', require('./src/modules/crm/routes/crmRoutes'));

// =============================================
// ✅ مسیرهای پشتیبان‌گیری (Backup)
// =============================================

// دریافت لیست پشتیبان‌ها
app.get('/api/backup/list', protect, async (req, res) => {
  try {
    const backupDir = path.join(__dirname, 'backups');
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

// پشتیبان‌گیری دستی
app.post('/api/backup/manual', protect, async (req, res) => {
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

// دانلود فایل پشتیبان
app.get('/api/backup/download/:filename', protect, async (req, res) => {
  try {
    const { filename } = req.params;
    const backupDir = path.join(__dirname, 'backups');
    const filePath = path.join(backupDir, filename);
    
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

// حذف فایل پشتیبان
app.delete('/api/backup/:filename', protect, async (req, res) => {
  try {
    const { filename } = req.params;
    const backupDir = path.join(__dirname, 'backups');
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

// بازگردانی (Restore)
app.post('/api/backup/restore', protect, upload.single('backupFile'), async (req, res) => {
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
    
    const db = mongoose.connection.db;
    const results = {};
    let totalRestored = 0;

    for (const [collectionName, documents] of Object.entries(backupData)) {
      if (documents.length === 0) continue;
      
      await db.collection(collectionName).deleteMany({});
      const result = await db.collection(collectionName).insertMany(documents);
      results[collectionName] = result.insertedCount;
      totalRestored += result.insertedCount;
      console.log(`✅ ${collectionName}: ${result.insertedCount} سند بازگردانی شد`);
    }
    
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      data: {
        collections: results,
        totalRestored,
      },
      message: `✅ ${totalRestored} سند از ${Object.keys(results).length} کالکشن با موفقیت بازگردانی شد`
    });
  } catch (error) {
    console.error('❌ خطا در بازگردانی:', error);
    
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        // نادیده بگیر
      }
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// مسیر تست
// =============================================
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: '🚀 سرور با موفقیت کار می‌کند!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/api/test-protected', protect, (req, res) => {
  res.json({
    success: true,
    message: '✅ شما احراز هویت شده‌اید',
    user: req.user.username,
    role: req.user.roleName,
  });
});

// =============================================
// مسیر وضعیت Redis
// =============================================
app.get('/api/redis-status', protect, async (req, res) => {
  try {
    const status = await CacheService.getStatus();
    res.json({
      success: true,
      data: status,
      message: 'وضعیت Redis دریافت شد'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// مسیر پاک کردن کش (فقط ادمین)
// =============================================
app.delete('/api/cache/clear', protect, async (req, res) => {
  try {
    const isAdmin = req.user.role?.name === 'admin';
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'شما دسترسی به این عملیات را ندارید'
      });
    }

    const { pattern } = req.query;
    let count = 0;

    if (pattern) {
      count = await CacheService.deletePattern(pattern);
    } else {
      count = await CacheService.deletePattern('*');
    }

    res.json({
      success: true,
      data: { cleared: count },
      message: `${count} کلید از کش پاک شد`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================
// مدیریت خطاها
// =============================================
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'مسیر درخواستی یافت نشد',
    path: req.originalUrl 
  });
});

app.use((err, req, res, next) => {
  logger.error('خطای سرور:', err.message);
  console.error('❌ خطا:', err.stack);
  
  res.status(500).json({
    success: false,
    error: 'خطای داخلی سرور',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// =============================================
// اتصال به دیتابیس و راه‌اندازی سرور
// =============================================
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/goldenweb')
  .then(async () => {
    logger.success('✅ متصل به MongoDB');
    
    try {
      const result = await seedPermissions();
      logger.info(`✅ ${result.total} مجوز با موفقیت ایجاد/به‌روزرسانی شدند`);
    } catch (error) {
      logger.warn('⚠️ خطا در ایجاد مجوزها:', error.message);
    }
    
    try {
      await seedEnumValues();
      logger.info('✅ مقادیر Enum ایجاد شدند');
    } catch (error) {
      logger.warn('⚠️ خطا در ایجاد Enumها:', error.message);
    }
    
    try {
      await seedMenuItems();
      logger.info('✅ آیتم‌های منو ایجاد شدند');
    } catch (error) {
      logger.warn('⚠️ خطا در ایجاد منوها:', error.message);
    }
    
    try {
      await seedSystemSettings();
      logger.info('✅ تنظیمات سیستم ایجاد شدند');
    } catch (error) {
      logger.warn('⚠️ خطا در ایجاد تنظیمات سیستم:', error.message);
    }

    try {
      const redisConnected = await connectRedis();
      if (redisConnected) {
        logger.success('✅ Redis با موفقیت متصل شد');
        await CacheService.set('test:connection', { status: 'ok' }, 60);
        logger.success('✅ کش Redis با موفقیت تست شد');
      } else {
        logger.warn('⚠️ Redis متصل نشد، کش غیرفعال خواهد بود');
      }
    } catch (error) {
      logger.warn('⚠️ خطا در اتصال به Redis:', error.message);
    }

    try {
      setTimeout(() => backupDatabase(), 5000);
      setInterval(backupDatabase, 24 * 60 * 60 * 1000);
      setInterval(accessReview, 7 * 24 * 60 * 60 * 1000);
      setTimeout(accessReview, 10000);
      logger.info('✅ پشتیبان‌گیری و بازبینی دسترسی فعال شد');
    } catch (error) {
      logger.warn('⚠️ خطا در فعال‌سازی پشتیبان‌گیری:', error.message);
    }

    // =============================================
    // ✅ راه‌اندازی سرور با --host 0.0.0.0
    // =============================================
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.divider();
      logger.title('🚀 سرور با موفقیت راه‌اندازی شد');
      logger.success(`✅ سرور روی پورت ${PORT} در حال اجراست`);
      logger.info(`📍 آدرس محلی: http://localhost:${PORT}`);

      const { networkInterfaces } = require('os');
      const nets = networkInterfaces();
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            logger.info(`📍 آدرس شبکه: http://${net.address}:${PORT}`);
          }
        }
      }
      logger.divider();
    });

    // =============================================
    // ✅ راه‌اندازی Socket.IO
    // =============================================
    try {
      const io = initSocket(server);
      logger.success('✅ Socket.io با موفقیت راه‌اندازی شد');
      app.set('io', io);
    } catch (error) {
      logger.error('❌ خطا در راه‌اندازی Socket.io:', error.message);
    }

  })
  .catch(err => {
    logger.error('❌ خطا در اتصال به دیتابیس:', err.message);
    console.error('❌ خطای کامل:', err);
    process.exit(1);
  });

process.on('SIGINT', async () => {
  logger.info('🔴 دریافت سیگنال خاموش شدن...');
  try {
    const { redisClient } = require('./src/config/redis');
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
      logger.info('✅ اتصال Redis بسته شد');
    }
  } catch (error) {
    logger.warn('⚠️ خطا در بستن اتصال Redis:', error.message);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('🔴 دریافت سیگنال SIGTERM...');
  process.exit(0);
});

module.exports = app;
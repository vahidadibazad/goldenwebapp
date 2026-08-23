const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// =============================================
// تنظیمات ذخیره‌سازی بهینه
// =============================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // پوشه بر اساس نوع فایل
    let subDir = 'other';
    if (file.mimetype.startsWith('image/')) subDir = 'images';
    else if (file.mimetype === 'application/pdf') subDir = 'pdf';
    else if (file.mimetype.includes('word') || file.mimetype.includes('document')) subDir = 'documents';
    else if (file.mimetype.includes('sheet') || file.mimetype.includes('excel')) subDir = 'spreadsheets';
    
    const fullDir = path.join(uploadDir, subDir);
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
    }
    
    cb(null, fullDir);
  },
  filename: (req, file, cb) => {
    // نام فایل با timestamp و هش برای جلوگیری از تداخل
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const safeName = baseName.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_').substring(0, 50);
    cb(null, `${safeName}_${timestamp}_${random}${ext}`);
  },
});

// =============================================
// فیلتر فایل‌ها
// =============================================
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // تصاویر
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // اسناد
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // متون
    'text/plain',
    'text/csv',
    // ویدئو و صدا
    'video/mp4', 'video/avi', 'video/mov',
    'audio/mpeg', 'audio/wav',
    // فایل‌های فشرده
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`فرمت فایل ${file.mimetype} پشتیبانی نمی‌شود`), false);
  }
};

// =============================================
// ایجاد Multer با تنظیمات بهینه
// =============================================
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // ۲۰ مگابایت
    files: 5, // حداکثر ۵ فایل
    fieldSize: 10 * 1024 * 1024, // ۱۰ مگابایت
  },
});

// =============================================
// آپلود چندگانه با استریم
// =============================================
const uploadMultiple = (fieldName, maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

// =============================================
// آپلود تکی
// =============================================
const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

// =============================================
// مدیریت خطای آپلود
// =============================================
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        success: false,
        error: 'حجم فایل بیش از حد مجاز است (حداکثر ۲۰ مگابایت)',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'تعداد فایل‌ها بیش از حد مجاز است',
      });
    }
    if (err.code === 'LIMIT_FIELD_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'حجم فیلد بیش از حد مجاز است',
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
};

// =============================================
// حذف فایل‌های قدیمی
// =============================================
const cleanupOldFiles = async (filePaths) => {
  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ فایل حذف شد: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ خطا در حذف فایل ${filePath}:`, error);
    }
  }
};

// =============================================
// دریافت اطلاعات فایل
// =============================================
const getFileInfo = (file) => {
  if (!file) return null;
  return {
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    url: `/uploads/${path.basename(file.path)}`,
  };
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  cleanupOldFiles,
  getFileInfo,
};
const { body, param, query, validationResult } = require('express-validator');

// =============================================
// اعتبارسنجی ایجاد/ویرایش محتوا
// =============================================
const validateContent = [
  body('title')
    .trim()
    .notEmpty().withMessage('عنوان الزامی است')
    .isLength({ max: 200 }).withMessage('عنوان نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد'),
  
  body('content')
    .trim()
    .notEmpty().withMessage('متن محتوا الزامی است'),
  
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('خلاصه نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived']).withMessage('وضعیت نامعتبر است'),
  
  body('categories')
    .optional()
    .isArray().withMessage('دسته‌بندی‌ها باید آرایه باشند'),
  
  body('tags')
    .optional()
    .isArray().withMessage('برچسب‌ها باید آرایه باشند'),
];

// =============================================
// اعتبارسنجی کامنت
// =============================================
const validateComment = [
  body('content')
    .trim()
    .notEmpty().withMessage('متن کامنت الزامی است')
    .isLength({ max: 5000 }).withMessage('متن کامنت نمی‌تواند بیشتر از ۵۰۰۰ کاراکتر باشد'),
  
  body('authorName')
    .optional()
    .trim()
    .notEmpty().withMessage('نام نویسنده الزامی است برای کاربران مهمان'),
  
  body('authorEmail')
    .optional()
    .isEmail().withMessage('ایمیل نامعتبر است'),
  
  body('parentId')
    .optional()
    .isMongoId().withMessage('شناسه والد نامعتبر است'),
];

// =============================================
// اعتبارسنجی محصول
// =============================================
const validateProduct = [
  body('name')
    .trim()
    .notEmpty().withMessage('نام محصول الزامی است')
    .isLength({ max: 200 }).withMessage('نام محصول نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد'),
  
  body('slug')
    .trim()
    .notEmpty().withMessage('اسلاگ محصول الزامی است')
    .matches(/^[a-z0-9-]+$/).withMessage('اسلاگ فقط می‌تواند شامل حروف کوچک، اعداد و خط تیره باشد'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('توضیحات محصول الزامی است'),
  
  body('price')
    .isNumeric().withMessage('قیمت باید عدد باشد')
    .isFloat({ min: 0 }).withMessage('قیمت نمی‌تواند منفی باشد'),
  
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('موجودی باید عدد صحیح و غیرمنفی باشد'),
  
  body('categories')
    .optional()
    .isArray().withMessage('دسته‌بندی‌ها باید آرایه باشند'),
  
  body('tags')
    .optional()
    .isArray().withMessage('برچسب‌ها باید آرایه باشند'),
];

// =============================================
// اعتبارسنجی سفارش
// =============================================
const validateOrder = [
  body('items')
    .isArray({ min: 1 }).withMessage('حداقل یک آیتم برای سفارش الزامی است'),
  
  body('items.*.productId')
    .isMongoId().withMessage('شناسه محصول نامعتبر است'),
  
  body('items.*.quantity')
    .isInt({ min: 1 }).withMessage('تعداد باید حداقل ۱ باشد'),
  
  body('shippingAddress')
    .isObject().withMessage('آدرس حمل و نقل الزامی است'),
  
  body('shippingAddress.fullName')
    .trim()
    .notEmpty().withMessage('نام کامل در آدرس الزامی است'),
  
  body('shippingAddress.phone')
    .trim()
    .notEmpty().withMessage('تلفن در آدرس الزامی است'),
  
  body('shippingAddress.address')
    .trim()
    .notEmpty().withMessage('آدرس الزامی است'),
  
  body('shippingAddress.city')
    .trim()
    .notEmpty().withMessage('شهر الزامی است'),
  
  body('paymentMethod')
    .isIn(['credit_card', 'bank_transfer', 'cod', 'wallet', 'zarinpal'])
    .withMessage('روش پرداخت نامعتبر است'),
];

// =============================================
// اعتبارسنجی فایل (Media)
// =============================================
const validateMedia = [
  body('title')
    .trim()
    .notEmpty().withMessage('عنوان فایل الزامی است'),
  
  body('altText')
    .optional()
    .trim(),
  
  body('description')
    .optional()
    .trim(),
  
  body('category')
    .optional()
    .isMongoId().withMessage('دسته‌بندی نامعتبر است'),
  
  body('tags')
    .optional()
    .isArray().withMessage('برچسب‌ها باید آرایه باشند'),
  
  body('accessLevel')
    .optional()
    .isIn(['public', 'restricted', 'private']).withMessage('سطح دسترسی نامعتبر است'),
];

// =============================================
// تابع بررسی نتایج اعتبارسنجی
// =============================================
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

module.exports = {
  validateContent,
  validateComment,
  validateProduct,
  validateOrder,
  validateMedia,
  handleValidationErrors,
};
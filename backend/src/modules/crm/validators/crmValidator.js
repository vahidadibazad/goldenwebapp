const { body, param, query, validationResult } = require('express-validator');

// =============================================
// اعتبارسنجی سرنخ (Lead)
// =============================================
const validateLead = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('نام الزامی است')
    .isLength({ max: 50 }).withMessage('نام نمی‌تواند بیشتر از ۵۰ کاراکتر باشد'),
  
  body('lastName')
    .trim()
    .notEmpty().withMessage('نام خانوادگی الزامی است')
    .isLength({ max: 50 }).withMessage('نام خانوادگی نمی‌تواند بیشتر از ۵۰ کاراکتر باشد'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('ایمیل الزامی است')
    .isEmail().withMessage('ایمیل نامعتبر است'),
  
  body('phone')
    .optional()
    .trim(),
  
  body('company')
    .optional()
    .trim(),
  
  body('jobTitle')
    .optional()
    .trim(),
  
  body('leadSource')
    .optional()
    .isIn(['website', 'referral', 'cold_call', 'email', 'social', 'ad', 'event', 'partner', 'other'])
    .withMessage('منبع سرنخ نامعتبر است'),
  
  body('rating')
    .optional()
    .isIn(['hot', 'warm', 'cold'])
    .withMessage('امتیاز سرنخ نامعتبر است'),
  
  body('leadStatus')
    .optional()
    .isIn(['new', 'contacted', 'working', 'qualified', 'converted', 'lost'])
    .withMessage('وضعیت سرنخ نامعتبر است'),
];

// =============================================
// اعتبارسنجی شرکت (Account)
// =============================================
const validateAccount = [
  body('name')
    .trim()
    .notEmpty().withMessage('نام شرکت الزامی است')
    .isLength({ max: 200 }).withMessage('نام شرکت نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد'),
  
  body('website')
    .optional()
    .trim()
    .isURL().withMessage('آدرس وب‌سایت نامعتبر است'),
  
  body('industry')
    .optional()
    .trim(),
  
  body('tier')
    .optional()
    .isIn(['platinum', 'gold', 'silver', 'bronze', 'normal'])
    .withMessage('سطح شرکت نامعتبر است'),
  
  body('type')
    .optional()
    .isIn(['customer', 'partner', 'competitor', 'vendor', 'other'])
    .withMessage('نوع شرکت نامعتبر است'),
  
  body('phone')
    .optional()
    .trim(),
  
  body('email')
    .optional()
    .isEmail().withMessage('ایمیل نامعتبر است'),
];

// =============================================
// اعتبارسنجی مخاطب (Contact)
// =============================================
const validateContact = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('نام الزامی است')
    .isLength({ max: 50 }).withMessage('نام نمی‌تواند بیشتر از ۵۰ کاراکتر باشد'),
  
  body('lastName')
    .trim()
    .notEmpty().withMessage('نام خانوادگی الزامی است')
    .isLength({ max: 50 }).withMessage('نام خانوادگی نمی‌تواند بیشتر از ۵۰ کاراکتر باشد'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('ایمیل الزامی است')
    .isEmail().withMessage('ایمیل نامعتبر است'),
  
  body('accountId')
    .isMongoId().withMessage('شناسه شرکت نامعتبر است'),
  
  body('phone')
    .optional()
    .trim(),
  
  body('mobile')
    .optional()
    .trim(),
  
  body('jobTitle')
    .optional()
    .trim(),
];

// =============================================
// اعتبارسنجی فرصت (Opportunity)
// =============================================
const validateOpportunity = [
  body('name')
    .trim()
    .notEmpty().withMessage('نام فرصت الزامی است')
    .isLength({ max: 200 }).withMessage('نام فرصت نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد'),
  
  body('accountId')
    .isMongoId().withMessage('شناسه شرکت نامعتبر است'),
  
  body('amount')
    .isNumeric().withMessage('مبلغ باید عدد باشد')
    .isFloat({ min: 0 }).withMessage('مبلغ نمی‌تواند منفی باشد'),
  
  body('closeDate')
    .isISO8601().withMessage('تاریخ بسته شدن نامعتبر است')
    .toDate(),
  
  body('stage')
    .optional()
    .isIn(['discovery', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'])
    .withMessage('مرحله نامعتبر است'),
  
  body('probability')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('احتمال باید بین ۰ تا ۱۰۰ باشد'),
];

// =============================================
// اعتبارسنجی قرارداد (Contract)
// =============================================
const validateContract = [
  body('name')
    .trim()
    .notEmpty().withMessage('نام قرارداد الزامی است')
    .isLength({ max: 200 }).withMessage('نام قرارداد نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد'),
  
  body('accountId')
    .isMongoId().withMessage('شناسه شرکت نامعتبر است'),
  
  body('startDate')
    .isISO8601().withMessage('تاریخ شروع نامعتبر است')
    .toDate(),
  
  body('endDate')
    .isISO8601().withMessage('تاریخ پایان نامعتبر است')
    .toDate()
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('تاریخ پایان باید بعد از تاریخ شروع باشد');
      }
      return true;
    }),
  
  body('value.amount')
    .isNumeric().withMessage('مبلغ قرارداد باید عدد باشد')
    .isFloat({ min: 0 }).withMessage('مبلغ قرارداد نمی‌تواند منفی باشد'),
  
  body('status')
    .optional()
    .isIn(['draft', 'active', 'expired', 'cancelled', 'completed'])
    .withMessage('وضعیت قرارداد نامعتبر است'),
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
  validateLead,
  validateAccount,
  validateContact,
  validateOpportunity,
  validateContract,
  handleValidationErrors,
};
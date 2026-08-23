// backend/src/modules/crm/routes/accountRoutes.js
const router = require('express').Router();
const AccountController = require('../controllers/accountController');
const { protect, checkPermission } = require('../../../middleware/auth');
const { validateAccount, handleValidationErrors } = require('../validators/crmValidator');

// =============================================
// مسیرهای شرکت‌ها
// =============================================

// دریافت لیست شرکت‌ها
router.get('/', protect, checkPermission('crm.view_accounts'), AccountController.getAccounts);

// دریافت آمار شرکت‌ها
router.get('/stats', protect, checkPermission('crm.view_accounts'), AccountController.getAccountStats);

// دریافت یک شرکت با ID
router.get('/:id', protect, checkPermission('crm.view_accounts'), AccountController.getAccountById);

// دریافت مخاطبین یک شرکت
router.get('/:id/contacts', protect, checkPermission('crm.view_accounts'), AccountController.getAccountContacts);

// دریافت فرصت‌های یک شرکت
router.get('/:id/opportunities', protect, checkPermission('crm.view_accounts'), AccountController.getAccountOpportunities);

// دریافت قراردادهای یک شرکت
router.get('/:id/contracts', protect, checkPermission('crm.view_accounts'), AccountController.getAccountContracts);

// ایجاد شرکت جدید
router.post('/', protect, checkPermission('crm.create_accounts'), validateAccount, handleValidationErrors, AccountController.createAccount);

// ویرایش شرکت
router.put('/:id', protect, checkPermission('crm.edit_accounts'), validateAccount, handleValidationErrors, AccountController.updateAccount);

// حذف شرکت
router.delete('/:id', protect, checkPermission('crm.delete_accounts'), AccountController.deleteAccount);

module.exports = router;
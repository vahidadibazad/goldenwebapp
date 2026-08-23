// backend/src/modules/crm/routes/contractRoutes.js
const router = require('express').Router();
const ContractController = require('../controllers/contractController');
const { protect, checkPermission } = require('../../../middleware/auth');
const { validateContract, handleValidationErrors } = require('../validators/crmValidator');

// =============================================
// مسیرهای قراردادها
// =============================================

// دریافت لیست قراردادها
router.get('/', protect, checkPermission('crm.view_contracts'), ContractController.getContracts);

// دریافت آمار قراردادها
router.get('/stats', protect, checkPermission('crm.view_contracts'), ContractController.getContractStats);

// دریافت قراردادهای در حال انقضا
router.get('/expiring', protect, checkPermission('crm.view_contracts'), ContractController.getExpiringContracts);

// دریافت یک قرارداد با ID
router.get('/:id', protect, checkPermission('crm.view_contracts'), ContractController.getContractById);

// ایجاد قرارداد جدید
router.post('/', protect, checkPermission('crm.create_contracts'), validateContract, handleValidationErrors, ContractController.createContract);

// ویرایش قرارداد
router.put('/:id', protect, checkPermission('crm.edit_contracts'), validateContract, handleValidationErrors, ContractController.updateContract);

// فعال‌سازی قرارداد
router.patch('/:id/activate', protect, checkPermission('crm.edit_contracts'), ContractController.activateContract);

// تمدید قرارداد
router.patch('/:id/renew', protect, checkPermission('crm.edit_contracts'), ContractController.renewContract);

// لغو قرارداد
router.patch('/:id/cancel', protect, checkPermission('crm.edit_contracts'), ContractController.cancelContract);

// حذف قرارداد
router.delete('/:id', protect, checkPermission('crm.delete_contracts'), ContractController.deleteContract);

module.exports = router;
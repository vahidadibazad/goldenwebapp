// backend/src/modules/crm/routes/opportunityRoutes.js
const router = require('express').Router();
const OpportunityController = require('../controllers/opportunityController');
const { protect, checkPermission } = require('../../../middleware/auth');
const { validateOpportunity, handleValidationErrors } = require('../validators/crmValidator');

// =============================================
// مسیرهای فرصت‌ها
// =============================================

// دریافت لیست فرصت‌ها
router.get('/', protect, checkPermission('crm.view_opportunities'), OpportunityController.getOpportunities);

// دریافت آمار فرصت‌ها
router.get('/stats', protect, checkPermission('crm.view_opportunities'), OpportunityController.getOpportunityStats);

// دریافت یک فرصت با ID
router.get('/:id', protect, checkPermission('crm.view_opportunities'), OpportunityController.getOpportunityById);

// ایجاد فرصت جدید
router.post('/', protect, checkPermission('crm.create_opportunities'), validateOpportunity, handleValidationErrors, OpportunityController.createOpportunity);

// ویرایش فرصت
router.put('/:id', protect, checkPermission('crm.edit_opportunities'), validateOpportunity, handleValidationErrors, OpportunityController.updateOpportunity);

// تغییر مرحله فرصت
router.patch('/:id/stage', protect, checkPermission('crm.move_opportunity'), OpportunityController.changeOpportunityStage);

// ✅ حذف شد: مسیرهای close-won و close-lost (متد در کنترلر وجود ندارد)

// حذف فرصت
router.delete('/:id', protect, checkPermission('crm.delete_opportunities'), OpportunityController.deleteOpportunity);

module.exports = router;
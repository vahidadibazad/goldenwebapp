// backend/src/modules/crm/routes/leadRoutes.js
const router = require('express').Router();
const LeadController = require('../controllers/leadController');
const { protect, checkPermission } = require('../../../middleware/auth');
const { validateLead, handleValidationErrors } = require('../validators/crmValidator');

// =============================================
// مسیرهای سرنخ‌ها
// =============================================

// دریافت لیست سرنخ‌ها
router.get('/', protect, checkPermission('crm.view_leads'), LeadController.getLeads);

// دریافت آمار سرنخ‌ها
router.get('/stats', protect, checkPermission('crm.view_leads'), LeadController.getLeadStats);

// دریافت یک سرنخ با ID
router.get('/:id', protect, checkPermission('crm.view_leads'), LeadController.getLeadById);

// ایجاد سرنخ جدید
router.post('/', protect, checkPermission('crm.create_leads'), validateLead, handleValidationErrors, LeadController.createLead);

// ویرایش سرنخ
router.put('/:id', protect, checkPermission('crm.edit_leads'), validateLead, handleValidationErrors, LeadController.updateLead);

// تبدیل سرنخ به مشتری
router.post('/:id/convert', protect, checkPermission('crm.convert_leads'), LeadController.convertLead);

// تخصیص سرنخ به کاربر
router.patch('/:id/assign', protect, checkPermission('crm.assign_leads'), LeadController.assignLead);

// حذف سرنخ
router.delete('/:id', protect, checkPermission('crm.delete_leads'), LeadController.deleteLead);

module.exports = router;
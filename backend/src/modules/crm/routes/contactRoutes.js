// backend/src/modules/crm/routes/contactRoutes.js
const router = require('express').Router();
const ContactController = require('../controllers/contactController');
const { protect, checkPermission } = require('../../../middleware/auth');
const { validateContact, handleValidationErrors } = require('../validators/crmValidator');

// =============================================
// مسیرهای مخاطبین
// =============================================

// دریافت لیست مخاطبین
router.get('/', protect, checkPermission('crm.view_contacts'), ContactController.getContacts);

// دریافت آمار مخاطبین
router.get('/stats', protect, checkPermission('crm.view_contacts'), ContactController.getContactStats);

// دریافت یک مخاطب با ID
router.get('/:id', protect, checkPermission('crm.view_contacts'), ContactController.getContactById);

// دریافت تاریخچه فعالیت‌های مخاطب
router.get('/:id/activities', protect, checkPermission('crm.view_contacts'), ContactController.getContactActivities);

// ایجاد مخاطب جدید
router.post('/', protect, checkPermission('crm.create_contacts'), validateContact, handleValidationErrors, ContactController.createContact);

// ویرایش مخاطب
router.put('/:id', protect, checkPermission('crm.edit_contacts'), validateContact, handleValidationErrors, ContactController.updateContact);

// حذف مخاطب
router.delete('/:id', protect, checkPermission('crm.delete_contacts'), ContactController.deleteContact);

module.exports = router;
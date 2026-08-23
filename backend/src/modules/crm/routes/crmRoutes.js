// backend/src/modules/crm/routes/crmRoutes.js
const router = require('express').Router();
const { protect, checkPermission } = require('../../../middleware/auth');

// =============================================
// وارد کردن مسیرهای جداگانه
// =============================================
const leadRoutes = require('./leadRoutes');
const accountRoutes = require('./accountRoutes');
const contactRoutes = require('./contactRoutes');
const opportunityRoutes = require('./opportunityRoutes');
const contractRoutes = require('./contractRoutes');

// =============================================
// ثبت مسیرها با پیشوند مناسب
// =============================================
router.use('/leads', leadRoutes);
router.use('/accounts', accountRoutes);
router.use('/contacts', contactRoutes);
router.use('/opportunities', opportunityRoutes);
router.use('/contracts', contractRoutes);

// =============================================
// داشبورد CRM
// =============================================
const CrmController = require('../controllers/crmController');

router.get('/dashboard', protect, checkPermission('crm.view_leads'), CrmController.getDashboard);

module.exports = router;
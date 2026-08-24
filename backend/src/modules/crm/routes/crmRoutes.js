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
// ✅ داشبورد CRM (نسخه ساده و تست شده)
// =============================================
router.get('/dashboard', protect, checkPermission('crm.view_leads'), (req, res) => {
  console.log('✅ /crm/dashboard called');
  res.json({
    success: true,
    data: {
      stats: {
        leads: 0,
        accounts: 0,
        opportunities: 0,
        contracts: 0
      },
      recentLeads: [],
      recentOpportunities: []
    }
  });
});

module.exports = router;
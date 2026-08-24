// backend/src/modules/crm/routes/crmStatsRoutes.js
const router = require('express').Router();

// =============================================
// ⚠️ احراز هویت موقت برای تست
// =============================================
const protect = (req, res, next) => {
  req.user = { id: 'test', username: 'admin' };
  next();
};

// =============================================
// ✅ مسیر اصلی
// =============================================
router.get('/dashboard', protect, (req, res) => {
  console.log('🔥🔥🔥 DASHBOARD CALLED 🔥🔥🔥');
  res.json({
    success: true,
    data: {
      stats: { leads: 0, accounts: 0, opportunities: 0, contracts: 0 },
      recentLeads: [],
      recentOpportunities: []
    }
  });
});

router.get('/stats/leads', protect, (req, res) => {
  res.json({ success: true, data: { total: 0, byStatus: [] } });
});

router.get('/stats/accounts', protect, (req, res) => {
  res.json({ success: true, data: { total: 0, byIndustry: [] } });
});

router.get('/stats/opportunities', protect, (req, res) => {
  res.json({ success: true, data: { total: 0, byStage: [], totalValue: 0 } });
});

router.get('/stats/contracts', protect, (req, res) => {
  res.json({ success: true, data: { total: 0, byStatus: [] } });
});

module.exports = router;
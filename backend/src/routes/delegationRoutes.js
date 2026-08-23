const router = require('express').Router();
const DelegationService = require('../services/delegationService');
const { protect } = require('../middleware/auth');

// ایجاد تفویض اختیار جدید
router.post('/', protect, async (req, res) => {
  try {
    const delegation = await DelegationService.createDelegation(req.user.id, req.body);
    res.status(201).json({
      success: true,
      data: delegation,
      message: 'تفویض اختیار با موفقیت ایجاد شد',
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// دریافت تفویض‌های فعال
router.get('/active', protect, async (req, res) => {
  try {
    const delegations = await DelegationService.getActiveDelegations(req.user.id);
    res.json({
      success: true,
      data: delegations,
      message: 'لیست تفویض‌های فعال دریافت شد',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// لغو تفویض اختیار
router.delete('/:id', protect, async (req, res) => {
  try {
    const delegation = await DelegationService.cancelDelegation(req.user.id, req.params.id);
    res.json({
      success: true,
      data: delegation,
      message: 'تفویض اختیار با موفقیت لغو شد',
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// دریافت نامه‌های تفویض شده
router.get('/letters', protect, async (req, res) => {
  try {
    const letters = await DelegationService.getDelegatedLetters(req.user.id);
    res.json({
      success: true,
      data: letters,
      message: 'نامه‌های تفویض شده دریافت شد',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
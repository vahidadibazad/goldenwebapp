const router = require('express').Router();
const Credential = require('../models/Credential');
const { protect } = require('../middleware/auth');
const logAudit = require('../utils/auditLogger');
const CacheService = require('../services/cacheService');

// =============================================
// دریافت لیست رمزها (با کش)
// =============================================
router.get('/', async (req, res) => {
  try {
    const cacheKey = `credential:list`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({ 
        success: true, 
        data: cachedData,
        fromCache: true,
        message: 'لیست رمزها از کش دریافت شد'
      });
    }

    const credentials = await Credential.find()
      .populate('hardware', 'name serialNumber')
      .sort({ createdAt: -1 });

    await CacheService.set(cacheKey, credentials, 300);

    res.status(200).json({ 
      success: true, 
      data: credentials,
      fromCache: false,
      message: 'لیست رمزها دریافت شد'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// دریافت یک رمز با ID (با کش)
// =============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const cacheKey = `credential:${id}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({ 
        success: true, 
        data: cachedData,
        fromCache: true,
        message: 'رمز از کش دریافت شد'
      });
    }

    const credential = await Credential.findById(id)
      .populate('hardware', 'name serialNumber');
    
    if (!credential) {
      return res.status(404).json({ success: false, error: 'رمز یافت نشد' });
    }

    await CacheService.set(cacheKey, credential, 3600);

    res.status(200).json({ 
      success: true, 
      data: credential,
      fromCache: false,
      message: 'رمز دریافت شد'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ایجاد رمز جدید (با پاک کردن کش)
// =============================================
router.post('/', protect, async (req, res) => {
  try {
    const newCredential = await Credential.create(req.body);
    
    await logAudit(req, 'CREATE', 'CREDENTIAL', {
      credentialId: newCredential._id,
      systemName: newCredential.systemName,
    });

    // پاک کردن کش
    await CacheService.clearModule('credential:');
    await CacheService.clearStats();

    res.status(201).json({ success: true, data: newCredential });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================
// ویرایش رمز (با پاک کردن کش)
// =============================================
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const credential = await Credential.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!credential) {
      return res.status(404).json({ success: false, error: 'رمز یافت نشد' });
    }

    await logAudit(req, 'UPDATE', 'CREDENTIAL', {
      credentialId: credential._id,
      systemName: credential.systemName,
      changes: req.body,
    });

    // پاک کردن کش
    await CacheService.delete(`credential:${id}`);
    await CacheService.clearModule('credential:list');
    await CacheService.clearStats();

    res.status(200).json({ success: true, data: credential });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================
// حذف رمز (با پاک کردن کش)
// =============================================
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const credential = await Credential.findByIdAndDelete(id);
    if (!credential) {
      return res.status(404).json({ success: false, error: 'رمز یافت نشد' });
    }

    await logAudit(req, 'DELETE', 'CREDENTIAL', {
      credentialId: credential._id,
      systemName: credential.systemName,
    });

    // پاک کردن کش
    await CacheService.delete(`credential:${id}`);
    await CacheService.clearModule('credential:list');
    await CacheService.clearStats();

    res.status(200).json({ success: true, message: 'رمز با موفقیت حذف شد' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
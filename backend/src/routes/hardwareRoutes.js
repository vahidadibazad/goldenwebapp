const express = require('express');
const router = express.Router();
const Hardware = require('../models/hardware');
const Category = require('../models/category');
const { protect, authorize } = require('../middleware/auth');
const logAudit = require('../utils/auditLogger');
const CacheService = require('../services/cacheService');

// =============================================
// دریافت لیست سخت‌افزارها با کش
// =============================================
router.get('/', async (req, res) => {
  try {
    const { search, category, status, minPrice, maxPrice } = req.query;

    // ساخت کلید کش بر اساس پارامترها
    const cacheKey = `hardware:list:${JSON.stringify({ search, category, status, minPrice, maxPrice })}`;
    
    // بررسی کش
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({ 
        success: true, 
        data: cachedData,
        fromCache: true,
        message: 'لیست سخت‌افزارها از کش دریافت شد'
      });
    }

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    const hardwareList = await Hardware.find(filter)
      .populate('category', 'name')
      .populate('assignedTo', 'username fullName')
      .sort({ createdAt: -1 });

    // ذخیره در کش (۵ دقیقه)
    await CacheService.set(cacheKey, hardwareList, 300);

    res.status(200).json({ 
      success: true, 
      data: hardwareList,
      fromCache: false,
      message: 'لیست سخت‌افزارها دریافت شد'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// دریافت یک سخت‌افزار با ID (با کش)
// =============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // کش کردن آیتم
    const cacheKey = `hardware:${id}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({ 
        success: true, 
        data: cachedData,
        fromCache: true,
        message: 'سخت‌افزار از کش دریافت شد'
      });
    }

    const hardwareItem = await Hardware.findById(id)
      .populate('category', 'name')
      .populate('assignedTo', 'username fullName');

    if (!hardwareItem) {
      return res.status(404).json({
        success: false,
        error: 'سخت‌افزار یافت نشد',
      });
    }

    await CacheService.set(cacheKey, hardwareItem, 3600);

    res.status(200).json({ 
      success: true, 
      data: hardwareItem,
      fromCache: false,
      message: 'سخت‌افزار دریافت شد'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// ایجاد سخت‌افزار جدید (با پاک کردن کش)
// =============================================
router.post('/', protect, authorize('admin', 'support'), async (req, res) => {
  try {
    const {
      name,
      category: categoryId,
      serialNumber,
      purchaseDate,
      warrantyExpire,
      price,
      status,
      assignedTo,
      description,
    } = req.body;

    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        error: 'دسته‌بندی انتخاب شده وجود ندارد',
      });
    }

    const newHardware = await Hardware.create({
      name,
      category: categoryId,
      serialNumber,
      purchaseDate,
      warrantyExpire,
      price,
      status: status || 'in_stock',
      assignedTo: assignedTo || null,
      description: description || '',
    });

    await logAudit(req, 'CREATE', 'HARDWARE', {
      hardwareId: newHardware._id,
      name: newHardware.name,
      serialNumber: newHardware.serialNumber,
      price: newHardware.price,
    });

    // پاک کردن کش‌های مربوط به اموال
    await CacheService.clearModule('hardware:');
    await CacheService.clearStats();

    res.status(201).json({ success: true, data: newHardware });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================
// ویرایش سخت‌افزار (با پاک کردن کش)
// =============================================
router.put('/:id', protect, authorize('admin', 'support'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      serialNumber,
      purchaseDate,
      warrantyExpire,
      price,
      status,
      assignedTo,
      description,
    } = req.body;

    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          error: 'دسته‌بندی انتخاب شده وجود ندارد',
        });
      }
    }

    const hardwareItem = await Hardware.findByIdAndUpdate(
      id,
      {
        name,
        category,
        serialNumber,
        purchaseDate,
        warrantyExpire,
        price,
        status,
        assignedTo,
        description,
      },
      { new: true, runValidators: true }
    );

    if (!hardwareItem) {
      return res.status(404).json({
        success: false,
        error: 'سخت‌افزار یافت نشد',
      });
    }

    await logAudit(req, 'UPDATE', 'HARDWARE', {
      hardwareId: hardwareItem._id,
      name: hardwareItem.name,
      changes: req.body,
    });

    // پاک کردن کش‌های مربوط
    await CacheService.delete(`hardware:${id}`);
    await CacheService.clearModule('hardware:list');
    await CacheService.clearStats();

    res.status(200).json({ success: true, data: hardwareItem });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================
// حذف سخت‌افزار (با پاک کردن کش)
// =============================================
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const hardwareItem = await Hardware.findByIdAndDelete(id);

    if (!hardwareItem) {
      return res.status(404).json({
        success: false,
        error: 'سخت‌افزار یافت نشد',
      });
    }

    await logAudit(req, 'DELETE', 'HARDWARE', {
      hardwareId: hardwareItem._id,
      name: hardwareItem.name,
      serialNumber: hardwareItem.serialNumber,
    });

    // پاک کردن کش‌های مربوط
    await CacheService.delete(`hardware:${id}`);
    await CacheService.clearModule('hardware:list');
    await CacheService.clearStats();

    res.status(200).json({
      success: true,
      message: 'سخت‌افزار با موفقیت حذف شد',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
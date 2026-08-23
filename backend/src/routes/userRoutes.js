const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { protect, authorize } = require('../middleware/auth');
const logAudit = require('../utils/auditLogger');
const CacheService = require('../services/cacheService');

// =============================================
// GET /api/users - دریافت لیست کاربران (با کش)
// =============================================
router.get('/', protect, async (req, res) => {
  try {
    const { search, role, isActive, page = 1, limit = 10 } = req.query;

    const cacheKey = `user:list:${JSON.stringify({ search, role, isActive, page, limit })}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        ...cachedData,
        fromCache: true,
        message: 'لیست کاربران از کش دریافت شد'
      });
    }

    const filter = {};

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;
    if (isActive !== undefined && isActive !== '') {
      filter.isActive = isActive === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .populate({
          path: 'role',
          populate: { path: 'permissions', select: 'name label module' }
        })
        .populate('extraPermissions')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    const result = {
      data: users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    };

    await CacheService.set(cacheKey, result, 300);

    res.json({
      success: true,
      ...result,
      fromCache: false,
      message: 'لیست کاربران دریافت شد'
    });
  } catch (error) {
    console.error('❌ خطا در دریافت کاربران:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// GET /api/users/:id - دریافت یک کاربر (با کش)
// =============================================
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const cacheKey = `user:${id}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true,
        message: 'اطلاعات کاربر از کش دریافت شد'
      });
    }

    const user = await User.findById(id)
      .select('-password')
      .populate({
        path: 'role',
        populate: { path: 'permissions', select: 'name label module' }
      })
      .populate('extraPermissions');

    if (!user) {
      return res.status(404).json({ success: false, error: 'کاربر یافت نشد' });
    }

    await CacheService.set(cacheKey, user, 3600);

    res.json({ success: true, data: user, fromCache: false, message: 'اطلاعات کاربر دریافت شد' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// POST /api/users - ایجاد کاربر جدید (با پاک کردن کش)
// =============================================
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { username, email, fullName, password, role, extraPermissions, department, isActive } = req.body;

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'نام کاربری یا ایمیل قبلاً ثبت شده است'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      fullName,
      password: hashedPassword,
      role: role || null,
      extraPermissions: extraPermissions || [],
      department: department || 'All',
      isActive: isActive !== undefined ? isActive : true,
    });

    await logAudit(req, 'CREATE', 'USER', {
      userId: user._id,
      username: user.username,
    });

    const userResponse = await User.findById(user._id)
      .select('-password')
      .populate({
        path: 'role',
        populate: { path: 'permissions', select: 'name label module' }
      })
      .populate('extraPermissions');

    // پاک کردن کش
    await CacheService.clearModule('user:');
    await CacheService.clearStats();

    res.status(201).json({ success: true, data: userResponse });
  } catch (error) {
    console.error('❌ خطا در ایجاد کاربر:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================
// PUT /api/users/:id - ویرایش کاربر (با پاک کردن کش)
// =============================================
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, fullName, role, extraPermissions, department, isActive } = req.body;
    const updateData = { username, email, fullName, role, extraPermissions, department, isActive };

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(req.body.password, salt);
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate({
        path: 'role',
        populate: { path: 'permissions', select: 'name label module' }
      })
      .populate('extraPermissions');

    if (!user) {
      return res.status(404).json({ success: false, error: 'کاربر یافت نشد' });
    }

    await logAudit(req, 'UPDATE', 'USER', {
      userId: user._id,
      username: user.username,
    });

    // پاک کردن کش
    await CacheService.delete(`user:${id}`);
    await CacheService.clearModule('user:list');
    await CacheService.clearStats();

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('❌ خطا در ویرایش کاربر:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// =============================================
// DELETE /api/users/:id - حذف کاربر (با پاک کردن کش)
// =============================================
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'کاربر یافت نشد' });
    }

    await logAudit(req, 'DELETE', 'USER', {
      userId: user._id,
      username: user.username,
    });

    // پاک کردن کش
    await CacheService.delete(`user:${id}`);
    await CacheService.clearModule('user:list');
    await CacheService.clearStats();

    res.json({ success: true, message: 'کاربر با موفقیت حذف شد' });
  } catch (error) {
    console.error('❌ خطا در حذف کاربر:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// PATCH /api/users/:id/toggle-active (با پاک کردن کش)
// =============================================
router.patch('/:id/toggle-active', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, error: 'کاربر یافت نشد' });
    }

    await logAudit(req, 'UPDATE', 'USER', {
      userId: user._id,
      username: user.username,
      action: 'toggle_active',
    });

    // پاک کردن کش
    await CacheService.delete(`user:${id}`);
    await CacheService.clearModule('user:list');
    await CacheService.clearStats();

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('❌ خطا در تغییر وضعیت کاربر:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
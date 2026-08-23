// backend/src/services/hardwareService.js
const Hardware = require('../models/hardware');
const CacheService = require('./cacheService');

class HardwareService {

  // =============================================
  // ✅ دریافت لیست اموال با بهینه‌سازی
  // =============================================
  static async getHardware(filter = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const cacheKey = `hardware:list:${JSON.stringify({ filter, page, limit })}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const [data, total] = await Promise.all([
      Hardware.find(filter)
        .select('name serialNumber category status price assignedTo purchaseDate warrantyExpire')
        .populate('category', 'name')
        .populate('assignedTo', 'username fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Hardware.countDocuments(filter)
    ]);

    const result = {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    await CacheService.set(cacheKey, result, 300);

    return result;
  }

  // =============================================
  // ✅ دریافت یک اموال با ID
  // =============================================
  static async getHardwareById(id) {
    const cacheKey = `hardware:${id}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const hardware = await Hardware.findById(id)
      .select('-__v')
      .populate('category', 'name icon color')
      .populate('assignedTo', 'username fullName email')
      .lean();

    if (hardware) {
      await CacheService.set(cacheKey, hardware, 3600);
    }

    return hardware;
  }

  // =============================================
  // ✅ دریافت آمار اموال با Aggregation
  // =============================================
  static async getHardwareStats() {
    const cacheKey = 'hardware:stats';
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const stats = await Hardware.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      active: 0,
      in_stock: 0,
      repair: 0,
      archived: 0,
      disposed: 0,
      total: 0,
    };

    stats.forEach(item => {
      if (item._id && result[item._id] !== undefined) {
        result[item._id] = item.count;
        result.total += item.count;
      }
    });

    await CacheService.set(cacheKey, result, 600);

    return result;
  }

  // =============================================
  // ✅ جستجوی اموال
  // =============================================
  static async searchHardware(query, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const filter = {
      $text: {
        $search: query,
        $caseSensitive: false,
        $diacriticSensitive: false
      }
    };

    const [data, total] = await Promise.all([
      Hardware.find(filter)
        .select('name serialNumber category status price assignedTo')
        .populate('category', 'name')
        .populate('assignedTo', 'username fullName')
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .lean(),
      Hardware.countDocuments(filter)
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = HardwareService;
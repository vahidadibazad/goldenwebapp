// backend/src/services/cacheService.js
const { getCached, setCached, deleteCached, deletePattern } = require('../config/redis');

// =============================================
// ✅ زمان انقضای هوشمند بر اساس نوع داده
// =============================================
const CACHE_TTL = {
  // داده‌های پویا (همیشه تغییر می‌کنند)
  LETTERS_LIST: 60,        // ۱ دقیقه
  LETTERS_STATS: 120,      // ۲ دقیقه
  TICKETS_LIST: 60,        // ۱ دقیقه
  HARDWARE_LIST: 120,      // ۲ دقیقه
  
  // داده‌های نیمه پویا (کمتر تغییر می‌کنند)
  USERS_LIST: 300,         // ۵ دقیقه
  DEPARTMENTS_LIST: 600,   // ۱۰ دقیقه
  SECRETARIATS_LIST: 600,  // ۱۰ دقیقه
  
  // داده‌های ثابت (به ندرت تغییر می‌کنند)
  SETTINGS: 3600,          // ۱ ساعت
  MENU_ITEMS: 3600,        // ۱ ساعت
  ENUM_VALUES: 7200,       // ۲ ساعت
  PERMISSIONS: 7200,       // ۲ ساعت
  
  // داده‌های تک آیتم
  SINGLE_ITEM: 3600,       // ۱ ساعت
  USER_PROFILE: 3600,      // ۱ ساعت
};

// =============================================
// ✅ پیشوندهای کش برای مدیریت آسان‌تر
// =============================================
const CACHE_PREFIXES = {
  LETTER: 'letter:',
  LETTER_LIST: 'letters:list:',
  LETTER_STATS: 'letters:stats:',
  HARDWARE: 'hardware:',
  HARDWARE_LIST: 'hardware:list:',
  HARDWARE_STATS: 'hardware:stats:',
  TICKET: 'ticket:',
  TICKET_LIST: 'tickets:list:',
  USER: 'user:',
  USER_LIST: 'users:list:',
  DEPARTMENT: 'dept:',
  DEPARTMENT_LIST: 'depts:list:',
  SECRETARIAT: 'sec:',
  SECRETARIAT_LIST: 'secs:list:',
  SETTINGS: 'settings:',
  MENU: 'menu:',
  ENUM: 'enum:',
  PERMISSION: 'permission:',
  DASHBOARD: 'dashboard:',
  STATS: 'stats:',
};

/**
 * سرویس کش هوشمند
 * مدیریت کش با TTL متفاوت و پاکسازی خودکار
 */
class CacheService {

  // =============================================
  // ۱. دریافت داده از کش با احتساب TTL
  // =============================================
  static async get(key) {
    try {
      const data = await getCached(key);
      if (data) {
        // به‌روزرسانی TTL برای داده‌های پرکاربرد (Sliding TTL)
        const ttl = await this._getTTLForKey(key);
        if (ttl && ttl > 60) {
          await setCached(key, data, ttl);
        }
      }
      return data;
    } catch (error) {
      console.error('❌ خطا در دریافت از کش:', error);
      return null;
    }
  }

  // =============================================
  // ۲. ذخیره داده در کش با TTL مناسب
  // =============================================
  static async set(key, data, ttl = null) {
    try {
      // اگر TTL مشخص نشده، از TTL پیش‌فرض استفاده کن
      const finalTTL = ttl || this._getDefaultTTL(key);
      return await setCached(key, data, finalTTL);
    } catch (error) {
      console.error('❌ خطا در ذخیره در کش:', error);
      return false;
    }
  }

  // =============================================
  // ۳. دریافت TTL پیش‌فرض بر اساس کلید
  // =============================================
  static _getDefaultTTL(key) {
    for (const [pattern, ttl] of Object.entries(CACHE_TTL)) {
      if (key.includes(pattern.toLowerCase())) {
        return ttl;
      }
    }
    return 300; // ۵ دقیقه پیش‌فرض
  }

  // =============================================
  // ۴. دریافت TTL فعلی یک کلید
  // =============================================
  static async _getTTLForKey(key) {
    try {
      const { ttl } = require('../config/redis');
      return await ttl(key);
    } catch (error) {
      return -1;
    }
  }

  // =============================================
  // ۵. کش کردن با پیشوند و ID
  // =============================================
  static async setWithPrefix(prefix, id, data, ttl = null) {
    const key = `${prefix}${id}`;
    return this.set(key, data, ttl);
  }

  // =============================================
  // ۶. دریافت با پیشوند و ID
  // =============================================
  static async getWithPrefix(prefix, id) {
    const key = `${prefix}${id}`;
    return this.get(key);
  }

  // =============================================
  // ۷. حذف یک کلید
  // =============================================
  static async delete(key) {
    try {
      return await deleteCached(key);
    } catch (error) {
      console.error('❌ خطا در حذف از کش:', error);
      return false;
    }
  }

  // =============================================
  // ۸. حذف با پیشوند و ID
  // =============================================
  static async deleteWithPrefix(prefix, id) {
    const key = `${prefix}${id}`;
    return this.delete(key);
  }

  // =============================================
  // ۹. پاک کردن همه کش‌های یک ماژول
  // =============================================
  static async clearModule(prefix) {
    try {
      return await deletePattern(`${prefix}*`);
    } catch (error) {
      console.error('❌ خطا در پاک کردن ماژول:', error);
      return 0;
    }
  }

  // =============================================
  // ۱۰. پاک کردن همه کش‌های یک الگو
  // =============================================
  static async clearPattern(pattern) {
    try {
      return await deletePattern(pattern);
    } catch (error) {
      console.error('❌ خطا در پاک کردن الگو:', error);
      return 0;
    }
  }

  // =============================================
  // ۱۱. پاک کردن کش آمار
  // =============================================
  static async clearStats() {
    return this.clearPattern('stats:*');
  }

  // =============================================
  // ۱۲. کش کردن لیست با صفحه‌بندی
  // =============================================
  static async setList(prefix, params, data, ttl = null) {
    const key = this._generateListKey(prefix, params);
    return this.set(key, data, ttl);
  }

  // =============================================
  // ۱۳. دریافت لیست با صفحه‌بندی
  // =============================================
  static async getList(prefix, params) {
    const key = this._generateListKey(prefix, params);
    return this.get(key);
  }

  // =============================================
  // ۱۴. تولید کلید لیست بر اساس پارامترها
  // =============================================
  static _generateListKey(prefix, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          acc[key] = params[key];
        }
        return acc;
      }, {});

    const paramString = Object.entries(sortedParams)
      .map(([key, value]) => `${key}:${value}`)
      .join('|');

    return `${prefix}list:${paramString}`;
  }

  // =============================================
  // ۱۵. دریافت وضعیت Redis
  // =============================================
  static async getStatus() {
    try {
      const redisClient = require('../config/redis').redisClient;
      const ping = await redisClient.ping();
      const info = await redisClient.info();
      
      // استخراج اطلاعات حافظه
      const memory = {};
      const lines = info.split('\n');
      for (const line of lines) {
        if (line.includes('used_memory_human')) {
          memory.used = line.split(':')[1]?.trim();
        }
        if (line.includes('used_memory_peak_human')) {
          memory.peak = line.split(':')[1]?.trim();
        }
        if (line.includes('total_system_memory_human')) {
          memory.total = line.split(':')[1]?.trim();
        }
        if (line.includes('connected_clients')) {
          memory.clients = line.split(':')[1]?.trim();
        }
      }
      
      return {
        connected: ping === 'PONG',
        memory,
        keys: await this._getKeyCount(),
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }

  // =============================================
  // ۱۶. تعداد کلیدهای کش
  // =============================================
  static async _getKeyCount() {
    try {
      const redisClient = require('../config/redis').redisClient;
      const keys = await redisClient.keys('*');
      return keys.length;
    } catch (error) {
      return 0;
    }
  }

  // =============================================
  // ۱۷. پاک کردن کش‌های قدیمی
  // =============================================
  static async cleanOldCache(maxAge = 86400) { // ۲۴ ساعت
    try {
      const redisClient = require('../config/redis').redisClient;
      const keys = await redisClient.keys('*');
      let deletedCount = 0;
      
      for (const key of keys) {
        const ttl = await redisClient.ttl(key);
        if (ttl === -1) {
          // کلید بدون TTL - حذف کن
          await redisClient.del(key);
          deletedCount++;
        }
      }
      
      return { deletedCount };
    } catch (error) {
      console.error('❌ خطا در پاک کردن کش‌های قدیمی:', error);
      return { deletedCount: 0 };
    }
  }
}

module.exports = CacheService;
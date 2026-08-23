const redis = require('redis');

// =============================================
// تنظیمات اتصال به Redis
// =============================================
const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || undefined,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('❌ حداکثر تلاش برای اتصال به Redis');
        return new Error('اتصال به Redis قطع شد');
      }
      return Math.min(retries * 100, 3000);
    },
    timeout: 5000,
  },
};

// ایجاد کلاینت
const redisClient = redis.createClient(redisConfig);

// =============================================
// رویدادهای Redis
// =============================================
redisClient.on('connect', () => {
  console.log('✅ Redis متصل شد');
});

redisClient.on('ready', () => {
  console.log('✅ Redis آماده است');
});

redisClient.on('error', (err) => {
  console.error('❌ خطای Redis:', err.message);
});

redisClient.on('end', () => {
  console.log('🔴 اتصال Redis قطع شد');
});

// =============================================
// اتصال به Redis
// =============================================
const connectRedis = async () => {
  try {
    await redisClient.connect();
    return true;
  } catch (error) {
    console.error('❌ خطا در اتصال به Redis:', error.message);
    return false;
  }
};

// =============================================
// توابع کمکی
// =============================================
const getCached = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('❌ خطا در دریافت از Redis:', error.message);
    return null;
  }
};

const setCached = async (key, value, ttl = 3600) => {
  try {
    await redisClient.set(key, JSON.stringify(value), {
      EX: ttl,
    });
    return true;
  } catch (error) {
    console.error('❌ خطا در ذخیره در Redis:', error.message);
    return false;
  }
};

const deleteCached = async (key) => {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('❌ خطا در حذف از Redis:', error.message);
    return false;
  }
};

const deletePattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return keys.length;
  } catch (error) {
    console.error('❌ خطا در حذف با الگو:', error.message);
    return 0;
  }
};

const exists = async (key) => {
  try {
    return await redisClient.exists(key);
  } catch (error) {
    console.error('❌ خطا در بررسی وجود کلید:', error.message);
    return false;
  }
};

const ttl = async (key) => {
  try {
    return await redisClient.ttl(key);
  } catch (error) {
    console.error('❌ خطا در دریافت TTL:', error.message);
    return -2;
  }
};

module.exports = {
  redisClient,
  connectRedis,
  getCached,
  setCached,
  deleteCached,
  deletePattern,
  exists,
  ttl,
};
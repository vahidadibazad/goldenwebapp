// backend/src/tests/performance.test.js
const axios = require('axios');
const logger = require('../utils/logger');

// =============================================
// ✅ تنظیمات تست
// =============================================
const BASE_URL = 'http://localhost:3000/api';
const CONCURRENT_REQUESTS = 10;
const TOTAL_REQUESTS = 100;

// =============================================
// ✅ دریافت توکن برای احراز هویت
// =============================================
const getToken = async () => {
  const response = await axios.post(`${BASE_URL}/auth/login`, {
    username: 'admin',
    password: '123456'
  });
  return response.data.data.token;
};

// =============================================
// ✅ تست یک درخواست
// =============================================
const testRequest = async (url, token, method = 'GET', data = null) => {
  const startTime = Date.now();
  try {
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };
    
    let response;
    if (method === 'GET') {
      response = await axios.get(`${BASE_URL}${url}`, config);
    } else if (method === 'POST') {
      response = await axios.post(`${BASE_URL}${url}`, data, config);
    }
    
    const duration = Date.now() - startTime;
    return { success: true, duration, status: response.status };
  } catch (error) {
    const duration = Date.now() - startTime;
    return { 
      success: false, 
      duration, 
      status: error.response?.status || 500,
      error: error.message 
    };
  }
};

// =============================================
// ✅ اجرای تست همزمان
// =============================================
const runConcurrentTest = async (url, method = 'GET', data = null) => {
  const token = await getToken();
  const requests = [];
  
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    requests.push(testRequest(url, token, method, data));
  }
  
  const results = await Promise.all(requests);
  return results;
};

// =============================================
// ✅ تست اصلی
// =============================================
const runPerformanceTest = async () => {
  logger.divider();
  logger.title('🚀 شروع تست عملکرد');
  
  // =============================================
  // ۱. تست لیست نامه‌ها
  // =============================================
  logger.info('📝 تست ۱: دریافت لیست نامه‌ها');
  const lettersResult = await runConcurrentTest('/letters');
  
  const lettersSuccess = lettersResult.filter(r => r.success).length;
  const lettersAvg = lettersResult.reduce((sum, r) => sum + r.duration, 0) / lettersResult.length;
  
  logger.info(`  ✅ موفق: ${lettersSuccess}/${CONCURRENT_REQUESTS}`);
  logger.info(`  ⏱️  میانگین زمان: ${lettersAvg.toFixed(2)}ms`);
  
  // =============================================
  // ۲. تست داشبورد
  // =============================================
  logger.info('\n📝 تست ۲: دریافت داشبورد');
  const dashboardResult = await runConcurrentTest('/dashboard/stats');
  
  const dashboardSuccess = dashboardResult.filter(r => r.success).length;
  const dashboardAvg = dashboardResult.reduce((sum, r) => sum + r.duration, 0) / dashboardResult.length;
  
  logger.info(`  ✅ موفق: ${dashboardSuccess}/${CONCURRENT_REQUESTS}`);
  logger.info(`  ⏱️  میانگین زمان: ${dashboardAvg.toFixed(2)}ms`);
  
  // =============================================
  // ۳. تست ثبت نامه
  // =============================================
  logger.info('\n📝 تست ۳: ثبت نامه جدید');
  const createData = {
    subject: 'تست عملکرد',
    content: 'این یک تست عملکرد است',
    letterType: 'incoming',
    letterDate: new Date().toISOString(),
    secretariat: '65f8a1b2c3d4e5f6a7b8c9d0',
  };
  const createResult = await runConcurrentTest('/letters', 'POST', createData);
  
  const createSuccess = createResult.filter(r => r.success).length;
  const createAvg = createResult.reduce((sum, r) => sum + r.duration, 0) / createResult.length;
  
  logger.info(`  ✅ موفق: ${createSuccess}/${CONCURRENT_REQUESTS}`);
  logger.info(`  ⏱️  میانگین زمان: ${createAvg.toFixed(2)}ms`);
  
  // =============================================
  // ۴. جمع‌بندی
  // =============================================
  logger.divider();
  logger.title('📊 خلاصه نتایج');
  
  const totalSuccess = lettersSuccess + dashboardSuccess + createSuccess;
  const totalRequests = CONCURRENT_REQUESTS * 3;
  const successRate = ((totalSuccess / totalRequests) * 100).toFixed(2);
  
  logger.info(`✅ نرخ موفقیت: ${successRate}%`);
  logger.info(`📊 میانگین زمان پاسخ: ${((lettersAvg + dashboardAvg + createAvg) / 3).toFixed(2)}ms`);
  
  // نتیجه‌گیری
  if (parseFloat(successRate) > 90) {
    logger.success(`🎉 سیستم عملکرد خوبی دارد!`);
  } else if (parseFloat(successRate) > 70) {
    logger.warn(`⚠️ سیستم نیاز به بهینه‌سازی دارد!`);
  } else {
    logger.error(`❌ سیستم عملکرد ضعیفی دارد!`);
  }
  
  logger.divider();
};

// =============================================
// ✅ اجرای تست در صورت اجرای مستقیم
// =============================================
if (require.main === module) {
  runPerformanceTest().catch(console.error);
}

module.exports = runPerformanceTest;
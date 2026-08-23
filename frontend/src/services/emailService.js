// frontend/src/services/emailService.js
import api from './api';

/**
 * سرویس اتصال به ایمیل
 * پشتیبانی از ارسال و دریافت ایمیل
 */
const emailService = {
  // =============================================
  // تنظیمات
  // =============================================
  
  // دریافت تنظیمات ایمیل
  getSettings: () => api.get('/email/settings'),
  
  // به‌روزرسانی تنظیمات ایمیل
  updateSettings: (data) => api.put('/email/settings', data),
  
  // تست اتصال ایمیل
  testConnection: () => api.post('/email/test'),

  // =============================================
  // دریافت ایمیل‌ها
  // =============================================
  
  // دریافت لیست ایمیل‌ها
  getInbox: () => api.get('/email/inbox'),
  
  // دریافت خودکار ایمیل‌ها
  receiveNow: () => api.post('/email/receive'),

  // =============================================
  // ارسال ایمیل
  // =============================================
  
  // ارسال نامه از طریق ایمیل
  sendLetter: (data) => api.post('/email/send-letter', data),
};

export default emailService;
// src/services/signatureService.js
import api from './api';

/**
 * سرویس امضای دیجیتال
 * پشتیبانی از PKI + OTP + امضای تصویری
 */
const signatureService = {
  // =============================================
  // دریافت امضاها
  // =============================================
  
  // دریافت امضاهای در انتظار کاربر
  getPending: () => api.get('/signatures/pending'),
  
  // دریافت امضاهای یک نامه
  getByLetter: (letterId) => api.get(`/signatures/letter/${letterId}`),
  
  // دریافت امضاهای معتبر یک نامه
  getValid: (letterId) => api.get(`/signatures/letter/${letterId}/valid`),
  
  // دریافت وضعیت یک امضا
  getStatus: (id) => api.get(`/signatures/${id}/status`),

  // =============================================
  // درخواست و امضا
  // =============================================
  
  // ایجاد درخواست امضا
  request: (data) => api.post('/signatures/request', data),
  
  // شروع امضا (ارسال OTP)
  start: (id) => api.post(`/signatures/${id}/start`),
  
  // تأیید OTP
  verifyOTP: (id, code) => api.post(`/signatures/${id}/verify-otp`, { code }),
  
  // امضای دیجیتال (با PKI)
  sign: (id, data) => api.post(`/signatures/${id}/sign`, data),
  
  // تأیید امضا
  verify: (id) => api.post(`/signatures/${id}/verify`),
  
  // رد امضا
  reject: (id, reason) => api.post(`/signatures/${id}/reject`, { reason }),
};

export default signatureService;
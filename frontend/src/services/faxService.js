// src/services/faxService.js
import api from './api';

/**
 * سرویس فکس آنلاین
 * پشتیبانی از ارسال و دریافت فکس
 */
const faxService = {
  // =============================================
  // دریافت فکس‌ها
  // =============================================
  
  // دریافت لیست فکس‌ها با فیلتر
  getAll: (params) => api.get('/fax', { params }),
  
  // دریافت یک فکس با ID
  getById: (id) => api.get(`/fax/${id}`),
  
  // دریافت وضعیت فکس
  getStatus: (id) => api.get(`/fax/${id}/status`),
  
  // دریافت آمار فکس
  getStats: () => api.get('/fax/stats'),

  // =============================================
  // ارسال فکس
  // =============================================
  
  // ارسال فکس جدید
  send: (data) => {
    const formData = new FormData();
    formData.append('faxNumber', data.faxNumber);
    if (data.letterId) formData.append('letterId', data.letterId);
    if (data.provider) formData.append('provider', data.provider);
    if (data.file) formData.append('faxFile', data.file);
    return api.post('/fax/send', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // =============================================
  // مدیریت فکس
  // =============================================
  
  // لغو فکس
  cancel: (id) => api.patch(`/fax/${id}/cancel`),
  
  // دریافت فایل فکس
  download: (id) => api.get(`/fax/${id}/download`, { responseType: 'blob' }),
};

export default faxService;
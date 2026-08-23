// src/services/webhookService.js
import api from './api';

/**
 * سرویس وب‌هوک
 * پشتیبانی از ۲۰ رویداد سیستم
 */
const webhookService = {
  // =============================================
  // دریافت وب‌هوک‌ها
  // =============================================
  
  // دریافت لیست وب‌هوک‌ها
  getAll: (params) => api.get('/webhooks', { params }),
  
  // دریافت یک وب‌هوک با ID
  getById: (id) => api.get(`/webhooks/${id}`),
  
  // دریافت آمار وب‌هوک‌ها
  getStats: () => api.get('/webhooks/stats'),

  // =============================================
  // مدیریت وب‌هوک‌ها
  // =============================================
  
  // ایجاد وب‌هوک جدید
  create: (data) => api.post('/webhooks', data),
  
  // ویرایش وب‌هوک
  update: (id, data) => api.put(`/webhooks/${id}`, data),
  
  // حذف وب‌هوک
  delete: (id) => api.delete(`/webhooks/${id}`),
  
  // تست وب‌هوک
  test: (id) => api.post(`/webhooks/${id}/test`),
};

export default webhookService;
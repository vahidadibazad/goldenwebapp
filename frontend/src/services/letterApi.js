// frontend/src/services/letterApi.js
import api from './api';

// =============================================
// سرویس‌های مدیریت واحدها (Department)
// =============================================
export const departmentService = {
  getAll: () => api.get('/departments'),
  getActive: () => api.get('/departments?active=true'),
  getTree: () => api.get('/departments?tree=true'),
  getById: (id) => api.get(`/departments/${id}`),
  getSubDepartments: (parentId) => api.get(`/departments/sub/${parentId}`),
  getUsers: (id) => api.get(`/departments/${id}/users`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
  toggle: (id) => api.patch(`/departments/${id}/toggle`),
};

// =============================================
// سرویس‌های مدیریت نامه‌ها (Letter)
// =============================================
export const letterService = {
  getAll: (params) => api.get('/letters', { params }),
  getInbox: () => api.get('/letters/inbox'),
  getOutbox: () => api.get('/letters/outbox'),
  getPending: () => api.get('/letters/pending'),
  getById: (id) => api.get(`/letters/${id}`),
  create: (data) => api.post('/letters', data),
  update: (id, data) => api.put(`/letters/${id}`, data),
  send: (id) => api.patch(`/letters/${id}/send`),
  approve: (id, data) => api.patch(`/letters/${id}/approve`, data),
  reject: (id, data) => api.patch(`/letters/${id}/reject`, data),
  archive: (id) => api.patch(`/letters/${id}/archive`),
  delete: (id) => api.delete(`/letters/${id}`),
  getStats: () => api.get('/letters/stats/overview'),
};

// =============================================
// سرویس‌های مدیریت گردش کار (Workflow)
// =============================================
export const workflowService = {
  getAll: (params) => api.get('/workflow', { params }),
  getActive: () => api.get('/workflow/active'),
  getByType: (type) => api.get(`/workflow/type/${type}`),
  getByDepartment: (departmentId) => api.get(`/workflow/department/${departmentId}`),
  getById: (id) => api.get(`/workflow/${id}`),
  create: (data) => api.post('/workflow', data),
  update: (id, data) => api.put(`/workflow/${id}`, data),
  // ✅ اضافه شدن متد duplicate
  duplicate: (id, data) => api.post(`/workflow/${id}/duplicate`, data),
  delete: (id) => api.delete(`/workflow/${id}`),
};

// =============================================
// سرویس‌های مدیریت امضا (Signature)
// =============================================
export const signatureService = {
  getPending: () => api.get('/signatures/pending'),
  getHistory: () => api.get('/signatures/history'),
  getByTarget: (targetId, targetType) => 
    api.get(`/signatures/target/${targetId}/${targetType}`),
  getValid: (targetId, targetType) => 
    api.get(`/signatures/valid/${targetId}/${targetType}`),
  getById: (id) => api.get(`/signatures/${id}`),
  request: (data) => api.post('/signatures', data),
  start: (id) => api.post(`/signatures/${id}/start`),
  verifyOTP: (id, code) => api.post(`/signatures/${id}/verify-otp`, { code }),
  uploadImage: (id, data) => api.post(`/signatures/${id}/upload-image`, data),
  complete: (id) => api.patch(`/signatures/${id}/complete`),
  reject: (id, data) => api.patch(`/signatures/${id}/reject`, data),
};

// =============================================
// سرویس‌های مدیریت اخطارها (Reminder)
// =============================================
export const reminderService = {
  getMyReminders: (params) => api.get('/reminders/my', { params }),
  getUnreadCount: () => api.get('/reminders/unread/count'),
  getOverdue: () => api.get('/reminders/overdue'),
  markAsRead: (id) => api.put(`/reminders/${id}/read`),
  markAllAsRead: () => api.put('/reminders/mark-all-read'),
  delete: (id) => api.delete(`/reminders/${id}`),
  getSettings: () => api.get('/reminders/settings'),
};

// =============================================
// سرویس‌های EnumValue
// =============================================
export const enumService = {
  getByGroup: (group) => api.get(`/enums/${group}`),
};

// =============================================
// سرویس‌های منو (Menu)
// =============================================
export const menuService = {
  getItems: () => api.get('/menu/items'),
};
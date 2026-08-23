import api from './api';

// =============================================
// سرویس‌های مدیریت واحدها (Department)
// =============================================
export const departmentService = {
  // دریافت لیست واحدها
  getAll: () => api.get('/departments'),
  
  // دریافت واحدهای فعال
  getActive: () => api.get('/departments?active=true'),
  
  // دریافت درخت سازمانی
  getTree: () => api.get('/departments?tree=true'),
  
  // دریافت یک واحد با ID
  getById: (id) => api.get(`/departments/${id}`),
  
  // دریافت زیرمجموعه‌های یک واحد
  getSubDepartments: (parentId) => api.get(`/departments/sub/${parentId}`),
  
  // دریافت کاربران یک واحد
  getUsers: (id) => api.get(`/departments/${id}/users`),
  
  // ایجاد واحد جدید
  create: (data) => api.post('/departments', data),
  
  // ویرایش واحد
  update: (id, data) => api.put(`/departments/${id}`, data),
  
  // حذف واحد
  delete: (id) => api.delete(`/departments/${id}`),
  
  // فعال/غیرفعال کردن واحد
  toggle: (id) => api.patch(`/departments/${id}/toggle`),
};

// =============================================
// سرویس‌های مدیریت نامه‌ها (Letter)
// =============================================
export const letterService = {
  // دریافت لیست نامه‌ها با فیلتر
  getAll: (params) => api.get('/letters', { params }),

  // دریافت صندوق ورودی
  getInbox: () => api.get('/letters/inbox'),

  // دریافت صندوق خروجی
  getOutbox: () => api.get('/letters/outbox'),

  // دریافت نامه‌های در انتظار تایید
  getPending: () => api.get('/letters/pending'),

  // دریافت یک نامه با ID
  getById: (id) => api.get(`/letters/${id}`),

  // ایجاد نامه جدید
  create: (data) => api.post('/letters', data),

  // ویرایش نامه (فقط پیش‌نویس)
  update: (id, data) => api.put(`/letters/${id}`, data),

  // ارسال نامه (تغییر وضعیت به در انتظار)
  send: (id) => api.patch(`/letters/${id}/send`),

  // تایید مرحله گردش کار
  approve: (id, data) => api.patch(`/letters/${id}/approve`, data),

  // رد مرحله گردش کار
  reject: (id, data) => api.patch(`/letters/${id}/reject`, data),

  // بایگانی نامه
  archive: (id) => api.patch(`/letters/${id}/archive`),

  // حذف نامه (فقط پیش‌نویس)
  delete: (id) => api.delete(`/letters/${id}`),

  // دریافت آمار نامه‌ها
  getStats: () => api.get('/letters/stats/overview'),
};

// =============================================
// سرویس‌های مدیریت گردش کار (Workflow)
// =============================================
export const workflowService = {
  // دریافت لیست گردش‌های کاری
  getAll: (params) => api.get('/workflow', { params }),
  
  // دریافت گردش‌های کاری فعال
  getActive: () => api.get('/workflow/active'),
  
  // دریافت گردش‌های کاری بر اساس نوع
  getByType: (type) => api.get(`/workflow/type/${type}`),
  
  // دریافت گردش‌های کاری یک واحد
  getByDepartment: (departmentId) => api.get(`/workflow/department/${departmentId}`),
  
  // دریافت یک گردش کار با ID
  getById: (id) => api.get(`/workflow/${id}`),
  
  // ایجاد گردش کار جدید
  create: (data) => api.post('/workflow', data),
  
  // ویرایش گردش کار
  update: (id, data) => api.put(`/workflow/${id}`, data),
  
  // کپی کردن گردش کار
  duplicate: (id, data) => api.post(`/workflow/${id}/duplicate`, data),
  
  // حذف گردش کار
  delete: (id) => api.delete(`/workflow/${id}`),
};

// =============================================
// سرویس‌های مدیریت امضا (Signature)
// =============================================
export const signatureService = {
  // دریافت امضاهای در انتظار من
  getPending: () => api.get('/signatures/pending'),
  
  // دریافت تاریخچه امضاهای من
  getHistory: () => api.get('/signatures/history'),
  
  // دریافت امضاهای یک هدف
  getByTarget: (targetId, targetType) => 
    api.get(`/signatures/target/${targetId}/${targetType}`),
  
  // دریافت امضاهای معتبر یک هدف
  getValid: (targetId, targetType) => 
    api.get(`/signatures/valid/${targetId}/${targetType}`),
  
  // دریافت یک امضا با ID
  getById: (id) => api.get(`/signatures/${id}`),
  
  // درخواست امضا
  request: (data) => api.post('/signatures', data),
  
  // شروع فرآیند امضا (ارسال OTP)
  start: (id) => api.post(`/signatures/${id}/start`),
  
  // تایید OTP
  verifyOTP: (id, code) => api.post(`/signatures/${id}/verify-otp`, { code }),
  
  // آپلود امضای تصویری
  uploadImage: (id, data) => api.post(`/signatures/${id}/upload-image`, data),
  
  // تکمیل امضا
  complete: (id) => api.patch(`/signatures/${id}/complete`),
  
  // رد امضا
  reject: (id, data) => api.patch(`/signatures/${id}/reject`, data),
};

// =============================================
// سرویس‌های مدیریت اخطارها (Reminder)
// =============================================
export const reminderService = {
  // دریافت اخطارهای من
  getMyReminders: (params) => api.get('/reminders/my', { params }),
  
  // دریافت تعداد اخطارهای خوانده‌نشده
  getUnreadCount: () => api.get('/reminders/unread/count'),
  
  // دریافت اخطارهای سررسید شده
  getOverdue: () => api.get('/reminders/overdue'),
  
  // علامت‌گذاری به عنوان خوانده‌شده
  markAsRead: (id) => api.put(`/reminders/${id}/read`),
  
  // علامت‌گذاری همه به عنوان خوانده‌شده
  markAllAsRead: () => api.put('/reminders/mark-all-read'),
  
  // حذف اخطار
  delete: (id) => api.delete(`/reminders/${id}`),
  
  // دریافت تنظیمات اخطارها
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
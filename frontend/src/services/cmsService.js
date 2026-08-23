// frontend/src/services/crmService.js
import api from './api';

/**
 * سرویس مدیریت ارتباط با مشتریان (CRM)
 * شامل: سرنخ‌ها، شرکت‌ها، مخاطبین، فرصت‌ها، قراردادها
 */
const crmService = {

  // =============================================
  // سرنخ‌ها (Leads)
  // =============================================
  
  // دریافت لیست سرنخ‌ها
  getLeads: (params) => api.get('/crm/leads', { params }),
  
  // دریافت یک سرنخ با ID
  getLeadById: (id) => api.get(`/crm/leads/${id}`),
  
  // ایجاد سرنخ جدید
  createLead: (data) => api.post('/crm/leads', data),
  
  // ویرایش سرنخ
  updateLead: (id, data) => api.put(`/crm/leads/${id}`, data),
  
  // حذف سرنخ
  deleteLead: (id) => api.delete(`/crm/leads/${id}`),
  
  // تبدیل سرنخ به مشتری
  convertLead: (id, accountData) => api.post(`/crm/leads/${id}/convert`, { accountData }),
  
  // تخصیص سرنخ به کاربر
  assignLead: (id, userId) => api.patch(`/crm/leads/${id}/assign`, { userId }),
  
  // دریافت آمار سرنخ‌ها
  getLeadStats: () => api.get('/crm/leads/stats'),

  // =============================================
  // شرکت‌ها (Accounts)
  // =============================================
  
  // دریافت لیست شرکت‌ها
  getAccounts: (params) => api.get('/crm/accounts', { params }),
  
  // دریافت یک شرکت با ID
  getAccountById: (id) => api.get(`/crm/accounts/${id}`),
  
  // ایجاد شرکت جدید
  createAccount: (data) => api.post('/crm/accounts', data),
  
  // ویرایش شرکت
  updateAccount: (id, data) => api.put(`/crm/accounts/${id}`, data),
  
  // حذف شرکت
  deleteAccount: (id) => api.delete(`/crm/accounts/${id}`),
  
  // دریافت مخاطبین یک شرکت
  getAccountContacts: (id, params) => api.get(`/crm/accounts/${id}/contacts`, { params }),
  
  // دریافت فرصت‌های یک شرکت
  getAccountOpportunities: (id, params) => api.get(`/crm/accounts/${id}/opportunities`, { params }),
  
  // دریافت قراردادهای یک شرکت
  getAccountContracts: (id, params) => api.get(`/crm/accounts/${id}/contracts`, { params }),
  
  // دریافت آمار شرکت‌ها
  getAccountStats: () => api.get('/crm/accounts/stats'),

  // =============================================
  // مخاطبین (Contacts)
  // =============================================
  
  // دریافت لیست مخاطبین
  getContacts: (params) => api.get('/crm/contacts', { params }),
  
  // دریافت یک مخاطب با ID
  getContactById: (id) => api.get(`/crm/contacts/${id}`),
  
  // ایجاد مخاطب جدید
  createContact: (data) => api.post('/crm/contacts', data),
  
  // ویرایش مخاطب
  updateContact: (id, data) => api.put(`/crm/contacts/${id}`, data),
  
  // حذف مخاطب
  deleteContact: (id) => api.delete(`/crm/contacts/${id}`),
  
  // دریافت تاریخچه فعالیت‌های مخاطب
  getContactActivities: (id, params) => api.get(`/crm/contacts/${id}/activities`, { params }),
  
  // دریافت آمار مخاطبین
  getContactStats: () => api.get('/crm/contacts/stats'),

  // =============================================
  // فرصت‌ها (Opportunities)
  // =============================================
  
  // دریافت لیست فرصت‌ها
  getOpportunities: (params) => api.get('/crm/opportunities', { params }),
  
  // دریافت یک فرصت با ID
  getOpportunityById: (id) => api.get(`/crm/opportunities/${id}`),
  
  // ایجاد فرصت جدید
  createOpportunity: (data) => api.post('/crm/opportunities', data),
  
  // ویرایش فرصت
  updateOpportunity: (id, data) => api.put(`/crm/opportunities/${id}`, data),
  
  // تغییر مرحله فرصت
  changeOpportunityStage: (id, stage, note) => api.patch(`/crm/opportunities/${id}/stage`, { stage, note }),
  
  // بستن فرصت (برنده)
  closeWon: (id, note) => api.patch(`/crm/opportunities/${id}/close-won`, { note }),
  
  // بستن فرصت (بازنده)
  closeLost: (id, note) => api.patch(`/crm/opportunities/${id}/close-lost`, { note }),
  
  // حذف فرصت
  deleteOpportunity: (id) => api.delete(`/crm/opportunities/${id}`),
  
  // دریافت آمار فرصت‌ها
  getOpportunityStats: () => api.get('/crm/opportunities/stats'),

  // =============================================
  // قراردادها (Contracts)
  // =============================================
  
  // دریافت لیست قراردادها
  getContracts: (params) => api.get('/crm/contracts', { params }),
  
  // دریافت یک قرارداد با ID
  getContractById: (id) => api.get(`/crm/contracts/${id}`),
  
  // ایجاد قرارداد جدید
  createContract: (data) => api.post('/crm/contracts', data),
  
  // ویرایش قرارداد
  updateContract: (id, data) => api.put(`/crm/contracts/${id}`, data),
  
  // فعال‌سازی قرارداد
  activateContract: (id) => api.patch(`/crm/contracts/${id}/activate`),
  
  // تمدید قرارداد
  renewContract: (id, newEndDate, note) => api.patch(`/crm/contracts/${id}/renew`, { newEndDate, note }),
  
  // لغو قرارداد
  cancelContract: (id, reason) => api.patch(`/crm/contracts/${id}/cancel`, { reason }),
  
  // دریافت قراردادهای در حال انقضا
  getExpiringContracts: (params) => api.get('/crm/contracts/expiring', { params }),
  
  // حذف قرارداد
  deleteContract: (id) => api.delete(`/crm/contracts/${id}`),
  
  // دریافت آمار قراردادها
  getContractStats: () => api.get('/crm/contracts/stats'),

  // =============================================
  // داشبورد CRM
  // =============================================
  
  // دریافت داشبورد CRM
  getDashboard: () => api.get('/crm/dashboard'),
};

export default crmService;
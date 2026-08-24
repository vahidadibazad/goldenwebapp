// src/services/crmService.js
import api from '../utils/api';

const crmService = {
  // داشبورد
  getDashboard: () => api.get('/crm/dashboard'),

  // سرنخ‌ها (Leads)
  getLeads: (params) => api.get('/crm/leads', { params }),
  getLeadById: (id) => api.get(`/crm/leads/${id}`),
  createLead: (data) => api.post('/crm/leads', data),
  updateLead: (id, data) => api.put(`/crm/leads/${id}`, data),
  deleteLead: (id) => api.delete(`/crm/leads/${id}`),
  convertLead: (id, data) => api.post(`/crm/leads/${id}/convert`, data),
  assignLead: (id, data) => api.post(`/crm/leads/${id}/assign`, data),
  getLeadStats: () => api.get('/crm/stats/leads'),

  // شرکت‌ها (Accounts)
  getAccounts: (params) => api.get('/crm/accounts', { params }),
  getAccountById: (id) => api.get(`/crm/accounts/${id}`),
  createAccount: (data) => api.post('/crm/accounts', data),
  updateAccount: (id, data) => api.put(`/crm/accounts/${id}`, data),
  deleteAccount: (id) => api.delete(`/crm/accounts/${id}`),
  getAccountContacts: (accountId) => api.get(`/crm/accounts/${accountId}/contacts`),
  getAccountStats: () => api.get('/crm/stats/accounts'),

  // فرصت‌ها (Opportunities)
  getOpportunities: (params) => api.get('/crm/opportunities', { params }),
  getOpportunityById: (id) => api.get(`/crm/opportunities/${id}`),
  createOpportunity: (data) => api.post('/crm/opportunities', data),
  updateOpportunity: (id, data) => api.put(`/crm/opportunities/${id}`, data),
  deleteOpportunity: (id) => api.delete(`/crm/opportunities/${id}`),
  changeOpportunityStage: (id, stage) => api.patch(`/crm/opportunities/${id}/stage`, { stage }),
  closeWon: (id) => api.post(`/crm/opportunities/${id}/close-won`),
  closeLost: (id) => api.post(`/crm/opportunities/${id}/close-lost`),
  getOpportunityStats: () => api.get('/crm/stats/opportunities'),

  // قراردادها (Contracts)
  getContracts: (params) => api.get('/crm/contracts', { params }),
  getContractById: (id) => api.get(`/crm/contracts/${id}`),
  createContract: (data) => api.post('/crm/contracts', data),
  updateContract: (id, data) => api.put(`/crm/contracts/${id}`, data),
  deleteContract: (id) => api.delete(`/crm/contracts/${id}`),
  activateContract: (id) => api.post(`/crm/contracts/${id}/activate`),
  cancelContract: (id, reason) => api.post(`/crm/contracts/${id}/cancel`, { reason }),
  renewContract: (id, newEndDate, note) => api.post(`/crm/contracts/${id}/renew`, { newEndDate, note }),
  getContractStats: () => api.get('/crm/stats/contracts'),
};

export default crmService;
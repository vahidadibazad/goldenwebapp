// frontend/src/services/letterService.js
import api from './api';

const letterService = {
  // =============================================
  // دریافت نامه‌ها
  // =============================================
  getAll: (params) => api.get('/letters', { params }),
  getById: (id) => api.get(`/letters/${id}`),
  getByUser: () => api.get('/letters/my'),
  getPending: () => api.get('/letters/pending'),
  getOverdue: () => api.get('/letters/overdue'),

  // =============================================
  // ایجاد و ویرایش
  // =============================================
  create: (data) => api.post('/letters', data),
  update: (id, data) => api.put(`/letters/${id}`, data),
  delete: (id) => api.delete(`/letters/${id}`),

  // =============================================
  // مدیریت وضعیت (چرخه حیات)
  // =============================================
  register: (id, comment) => api.patch(`/letter-status/${id}/register`, { comment }),
  sendForReview: (id, reviewerId, comment) => 
    api.patch(`/letter-status/${id}/send-review`, { reviewerId, comment }),
  approveReview: (id, comment) => 
    api.patch(`/letter-status/${id}/approve-review`, { comment }),
  rejectReview: (id, comment) => 
    api.patch(`/letter-status/${id}/reject-review`, { comment }),
  sendForSign: (id, signerId, comment) => 
    api.patch(`/letter-status/${id}/send-sign`, { signerId, comment }),
  completeSign: (id, signatureData, comment) => 
    api.patch(`/letter-status/${id}/complete-sign`, { signatureData, comment }),
  archive: (id, archiveType, comment) => 
    api.patch(`/letter-status/${id}/archive`, { archiveType, comment }),
  revert: (id, targetStatus, comment) => 
    api.patch(`/letter-status/${id}/revert`, { targetStatus, comment }),

  // =============================================
  // کارتابل
  // =============================================
  getDashboard: () => api.get('/letter-status/dashboard'),
  getStatus: (id) => api.get(`/letter-status/${id}/status`),

  // =============================================
  // جستجو
  // =============================================
  search: (params) => api.get('/search/letters', { params }),

  // =============================================
  // ✅ آمار - نسخه ساده و بدون خطا
  // =============================================
  getSimpleStats: () => api.get('/letters/simple-stats'),
  
  // =============================================
  // آمار قدیمی (با احتمال خطا)
  // =============================================
  getStats: () => api.get('/letters/stats'),

  // =============================================
  // یادداشت‌ها (Memos)
  // =============================================
  getMemos: (letterId) => api.get(`/letters/${letterId}/memos`),
  addMemo: (letterId, data) => api.post(`/letters/${letterId}/memos`, data),
  updateMemo: (memoId, data) => api.put(`/memos/${memoId}`, data),
  deleteMemo: (memoId) => api.delete(`/memos/${memoId}`),

  // =============================================
  // پیوست‌ها (Attachments)
  // =============================================
  getAttachments: (letterId) => api.get(`/letters/${letterId}/attachments`),
  addAttachment: (letterId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/letters/${letterId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteAttachment: (attachmentId) => api.delete(`/attachments/${attachmentId}`),
  downloadAttachment: (attachmentId) => 
    api.get(`/attachments/${attachmentId}/download`, { responseType: 'blob' }),
};

export default letterService;
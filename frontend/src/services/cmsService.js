// frontend/src/services/cmsService.js
import api from './api';

/**
 * سرویس مدیریت محتوا (CMS)
 * شامل: صفحات، نوشته‌ها، دسته‌بندی‌ها، برچسب‌ها، کامنت‌ها و فایل‌ها
 */
const cmsService = {

  // =============================================
  // انواع محتوا (Content Types)
  // =============================================
  getContentTypes: () => api.get('/cms/content-types'),
  createContentType: (data) => api.post('/cms/content-types', data),

  // =============================================
  // ورودی‌ها (Entries - صفحات و نوشته‌ها)
  // =============================================
  getEntries: (params) => api.get('/cms/entries', { params }),
  getEntryById: (id) => api.get(`/cms/entries/${id}`),
  getEntryBySlug: (slug, locale) => api.get(`/cms/public/slug?slug=${slug}&locale=${locale || 'fa'}`),
  createEntry: (data) => api.post('/cms/entries', data),
  updateEntry: (id, data) => api.put(`/cms/entries/${id}`, data),
  publishEntry: (id) => api.patch(`/cms/entries/${id}/publish`),
  archiveEntry: (id) => api.patch(`/cms/entries/${id}/archive`),
  deleteEntry: (id) => api.delete(`/cms/entries/${id}`),

  // =============================================
  // دسته‌بندی‌ها (Categories)
  // =============================================
  getCategories: () => api.get('/cms/categories'),
  getCategoriesPublic: () => api.get('/cms/public/categories'),
  createCategory: (data) => api.post('/cms/categories', data),
  updateCategory: (id, data) => api.put(`/cms/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/cms/categories/${id}`),

  // =============================================
  // برچسب‌ها (Tags)
  // =============================================
  getTags: (params) => api.get('/cms/tags', { params }),
  getPopularTags: (limit) => api.get(`/cms/tags/popular?limit=${limit || 10}`),
  getTagBySlug: (slug) => api.get(`/cms/tags/public/slug/${slug}`),
  createTag: (data) => api.post('/cms/tags', data),
  updateTag: (id, data) => api.put(`/cms/tags/${id}`, data),
  deleteTag: (id) => api.delete(`/cms/tags/${id}`),
  assignTagsToEntry: (entryId, tagIds) => api.post('/cms/tags/assign', { entryId, tagIds }),

  // =============================================
  // کامنت‌ها (Comments)
  // =============================================
  getComments: (entryId, params) => api.get(`/cms/comments/public/entry/${entryId}`, { params }),
  getPendingComments: (limit) => api.get(`/cms/comments/pending?limit=${limit || 50}`),
  getCommentStats: () => api.get('/cms/comments/stats'),
  createComment: (data) => api.post('/cms/comments/public', data),
  approveComment: (id) => api.patch(`/cms/comments/${id}/approve`),
  trashComment: (id) => api.patch(`/cms/comments/${id}/trash`),
  markAsSpam: (id) => api.patch(`/cms/comments/${id}/spam`),
  restoreComment: (id) => api.patch(`/cms/comments/${id}/restore`),
  deleteComment: (id) => api.delete(`/cms/comments/${id}`),
  upvoteComment: (id) => api.post(`/cms/comments/${id}/upvote`),
  downvoteComment: (id) => api.post(`/cms/comments/${id}/downvote`),

  // =============================================
  // فایل‌ها (Media)
  // =============================================
  getMedia: (params) => api.get('/cms/media', { params }),
  getMediaStats: () => api.get('/cms/media/stats'),
  getMediaById: (id) => api.get(`/cms/media/${id}`),
  uploadMedia: (file, data) => {
    const formData = new FormData();
    formData.append('file', file);
    if (data.title) formData.append('title', data.title);
    if (data.category) formData.append('category', data.category);
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));
    if (data.accessLevel) formData.append('accessLevel', data.accessLevel);
    if (data.altText) formData.append('altText', data.altText);
    if (data.description) formData.append('description', data.description);
    return api.post('/cms/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateMedia: (id, data) => api.put(`/cms/media/${id}`, data),
  deleteMedia: (id) => api.delete(`/cms/media/${id}`),
  downloadMedia: (id) => api.get(`/cms/media/${id}/download`, { responseType: 'blob' }),
};

export default cmsService;
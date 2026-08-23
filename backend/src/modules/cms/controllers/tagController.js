// backend/src/modules/cms/controllers/tagController.js
const TagService = require('../services/tagService');
const logAudit = require('../../../utils/auditLogger');

class TagController {

  // =============================================
  // دریافت برچسب‌ها
  // =============================================

  static async getTags(req, res) {
    try {
      const { popular, limit, search, active } = req.query;
      const tags = await TagService.getTags({
        popular: popular === 'true',
        limit: parseInt(limit) || 20,
        search: search || '',
        active: active !== 'false',
      });
      res.json({ success: true, data: tags });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getPopularTags(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const tags = await TagService.getPopularTags(limit);
      res.json({ success: true, data: tags });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getTagById(req, res) {
    try {
      const tag = await TagService.getTagById(req.params.id);
      if (!tag) {
        return res.status(404).json({ success: false, error: 'برچسب یافت نشد' });
      }
      res.json({ success: true, data: tag });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getTagBySlug(req, res) {
    try {
      const tag = await TagService.getTagBySlug(req.params.slug);
      if (!tag) {
        return res.status(404).json({ success: false, error: 'برچسب یافت نشد' });
      }
      res.json({ success: true, data: tag });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getEntriesByTag(req, res) {
    try {
      const { page, limit, status } = req.query;
      const result = await TagService.getEntriesByTag(req.params.id, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status: status || 'published',
      });
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // =============================================
  // مدیریت برچسب‌ها
  // =============================================

  static async createTag(req, res) {
    try {
      const tag = await TagService.createTag(req.body, req.user.id);
      await logAudit(req, 'CREATE', 'CMS_TAG', { tagId: tag._id, name: tag.name });
      res.status(201).json({ success: true, data: tag });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async updateTag(req, res) {
    try {
      const tag = await TagService.updateTag(req.params.id, req.body);
      await logAudit(req, 'UPDATE', 'CMS_TAG', { tagId: tag._id });
      res.json({ success: true, data: tag });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async deleteTag(req, res) {
    try {
      await TagService.deleteTag(req.params.id);
      await logAudit(req, 'DELETE', 'CMS_TAG', { tagId: req.params.id });
      res.json({ success: true, message: 'برچسب با موفقیت حذف شد' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // =============================================
  // مدیریت برچسب‌های ورودی
  // =============================================

  static async assignTagsToEntry(req, res) {
    try {
      const { entryId, tagIds } = req.body;
      const entry = await TagService.assignTagsToEntry(entryId, tagIds);
      await logAudit(req, 'UPDATE', 'CMS_ENTRY', { entryId: entry._id, action: 'assign_tags' });
      res.json({ success: true, data: entry });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

module.exports = TagController;
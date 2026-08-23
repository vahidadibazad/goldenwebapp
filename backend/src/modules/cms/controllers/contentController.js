// backend/src/modules/cms/controllers/contentController.js
const ContentService = require('../services/contentService');
const logAudit = require('../../../utils/auditLogger');

class ContentController {

  // =============================================
  // انواع محتوا
  // =============================================

  static async getContentTypes(req, res) {
    try {
      const { active } = req.query;
      const types = await ContentService.getContentTypes(active !== 'false');
      res.json({
        success: true,
        data: types,
        message: 'لیست انواع محتوا با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت انواع محتوا:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async createContentType(req, res) {
    try {
      const type = await ContentService.createContentType(req.body, req.user.id);
      await logAudit(req, 'CREATE', 'CMS_CONTENT_TYPE', {
        typeId: type._id,
        name: type.name,
        apiName: type.apiName,
      });
      res.status(201).json({
        success: true,
        data: type,
        message: 'نوع محتوا با موفقیت ایجاد شد',
      });
    } catch (error) {
      console.error('❌ خطا در ایجاد نوع محتوا:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async updateContentType(req, res) {
    try {
      const type = await ContentService.updateContentType(req.params.id, req.body);
      await logAudit(req, 'UPDATE', 'CMS_CONTENT_TYPE', {
        typeId: type._id,
        name: type.name,
        changes: req.body,
      });
      res.json({
        success: true,
        data: type,
        message: 'نوع محتوا با موفقیت ویرایش شد',
      });
    } catch (error) {
      console.error('❌ خطا در ویرایش نوع محتوا:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async deleteContentType(req, res) {
    try {
      await ContentService.deleteContentType(req.params.id);
      await logAudit(req, 'DELETE', 'CMS_CONTENT_TYPE', {
        typeId: req.params.id,
      });
      res.json({
        success: true,
        message: 'نوع محتوا با موفقیت حذف شد',
      });
    } catch (error) {
      console.error('❌ خطا در حذف نوع محتوا:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // ورودی‌ها (Entries)
  // =============================================

  static async getEntries(req, res) {
    try {
      const { contentType, locale, status, page, limit, search } = req.query;
      const result = await ContentService.getEntries(contentType, {
        locale: locale || 'fa',
        status: status || 'all',
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        search: search || '',
      });
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: 'لیست ورودی‌ها با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت ورودی‌ها:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async getEntryById(req, res) {
    try {
      const entry = await ContentService.getEntryById(req.params.id);
      if (!entry) {
        return res.status(404).json({
          success: false,
          error: 'ورودی یافت نشد',
        });
      }
      res.json({
        success: true,
        data: entry,
        message: 'اطلاعات ورودی با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت ورودی:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async getEntryBySlug(req, res) {
    try {
      const { slug, locale } = req.query;
      if (!slug) {
        return res.status(400).json({
          success: false,
          error: 'اسلاگ الزامی است',
        });
      }
      const entry = await ContentService.getEntryBySlug(slug, locale || 'fa');
      if (!entry) {
        return res.status(404).json({
          success: false,
          error: 'ورودی یافت نشد',
        });
      }
      // افزایش بازدید
      await Entry.findByIdAndUpdate(entry._id, { $inc: { viewCount: 1 } });
      res.json({
        success: true,
        data: entry,
        message: 'اطلاعات ورودی با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت ورودی با اسلاگ:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async createEntry(req, res) {
    try {
      const entry = await ContentService.createEntry(req.body, req.user.id);
      await logAudit(req, 'CREATE', 'CMS_ENTRY', {
        entryId: entry._id,
        contentType: entry.contentType,
        status: entry.status,
      });
      res.status(201).json({
        success: true,
        data: entry,
        message: 'ورودی با موفقیت ایجاد شد',
      });
    } catch (error) {
      console.error('❌ خطا در ایجاد ورودی:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async updateEntry(req, res) {
    try {
      const entry = await ContentService.updateEntry(req.params.id, req.body, req.user.id);
      await logAudit(req, 'UPDATE', 'CMS_ENTRY', {
        entryId: entry._id,
        changes: req.body,
      });
      res.json({
        success: true,
        data: entry,
        message: 'ورودی با موفقیت ویرایش شد',
      });
    } catch (error) {
      console.error('❌ خطا در ویرایش ورودی:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async publishEntry(req, res) {
    try {
      const entry = await ContentService.publishEntry(req.params.id, req.user.id);
      await logAudit(req, 'UPDATE', 'CMS_ENTRY', {
        entryId: entry._id,
        action: 'publish',
      });
      res.json({
        success: true,
        data: entry,
        message: 'ورودی با موفقیت منتشر شد',
      });
    } catch (error) {
      console.error('❌ خطا در انتشار ورودی:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async archiveEntry(req, res) {
    try {
      const entry = await ContentService.archiveEntry(req.params.id);
      await logAudit(req, 'UPDATE', 'CMS_ENTRY', {
        entryId: entry._id,
        action: 'archive',
      });
      res.json({
        success: true,
        data: entry,
        message: 'ورودی با موفقیت بایگانی شد',
      });
    } catch (error) {
      console.error('❌ خطا در بایگانی ورودی:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async deleteEntry(req, res) {
    try {
      await ContentService.deleteEntry(req.params.id);
      await logAudit(req, 'DELETE', 'CMS_ENTRY', {
        entryId: req.params.id,
      });
      res.json({
        success: true,
        message: 'ورودی با موفقیت حذف شد',
      });
    } catch (error) {
      console.error('❌ خطا در حذف ورودی:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // جستجوی محتوا
  // =============================================

  static async searchEntries(req, res) {
    try {
      const { q, contentType, status, page, limit } = req.query;
      
      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'عبارت جستجو الزامی است',
        });
      }

      const result = await ContentService.searchEntries(
        q.trim(),
        {
          contentType,
          status: status || 'published',
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 20,
        }
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: 'نتایج جستجو با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در جستجوی محتوا:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دسته‌بندی‌ها
  // =============================================

  static async getCategories(req, res) {
    try {
      const categories = await ContentService.getCategories();
      res.json({
        success: true,
        data: categories,
        message: 'لیست دسته‌بندی‌ها با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت دسته‌بندی‌ها:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async createCategory(req, res) {
    try {
      const category = await ContentService.createCategory(req.body, req.user.id);
      await logAudit(req, 'CREATE', 'CMS_CATEGORY', {
        categoryId: category._id,
        name: category.name,
      });
      res.status(201).json({
        success: true,
        data: category,
        message: 'دسته‌بندی با موفقیت ایجاد شد',
      });
    } catch (error) {
      console.error('❌ خطا در ایجاد دسته‌بندی:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async updateCategory(req, res) {
    try {
      const category = await ContentService.updateCategory(req.params.id, req.body);
      await logAudit(req, 'UPDATE', 'CMS_CATEGORY', {
        categoryId: category._id,
        name: category.name,
        changes: req.body,
      });
      res.json({
        success: true,
        data: category,
        message: 'دسته‌بندی با موفقیت ویرایش شد',
      });
    } catch (error) {
      console.error('❌ خطا در ویرایش دسته‌بندی:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async deleteCategory(req, res) {
    try {
      await ContentService.deleteCategory(req.params.id);
      await logAudit(req, 'DELETE', 'CMS_CATEGORY', {
        categoryId: req.params.id,
      });
      res.json({
        success: true,
        message: 'دسته‌بندی با موفقیت حذف شد',
      });
    } catch (error) {
      console.error('❌ خطا در حذف دسته‌بندی:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // آمار محتوا
  // =============================================

  static async getContentStats(req, res) {
    try {
      const stats = await ContentService.getContentStats();
      res.json({
        success: true,
        data: stats,
        message: 'آمار محتوا با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت آمار محتوا:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // ورودی‌های مرتبط
  // =============================================

  static async getRelatedEntries(req, res) {
    try {
      const { id } = req.params;
      const { limit = 5 } = req.query;
      
      const entry = await ContentService.getEntryById(id);
      if (!entry) {
        return res.status(404).json({
          success: false,
          error: 'ورودی یافت نشد',
        });
      }

      const related = await ContentService.getRelatedEntries(
        id,
        entry.contentType._id,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: related,
        message: 'ورودی‌های مرتبط با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت ورودی‌های مرتبط:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = ContentController;
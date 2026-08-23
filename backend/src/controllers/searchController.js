// backend/src/controllers/searchController.js
const SearchService = require('../services/searchService');

class SearchController {

  // =============================================
  // جستجوی جامع
  // =============================================
  static async globalSearch(req, res) {
    try {
      const { q, modules, limit, page } = req.query;

      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'عبارت جستجو الزامی است',
        });
      }

      const modulesArray = modules ? modules.split(',') : undefined;

      const results = await SearchService.globalSearch(
        q.trim(),
        req.user,
        {
          modules: modulesArray,
          limit: parseInt(limit) || 20,
          page: parseInt(page) || 1,
        }
      );

      res.status(200).json({
        success: true,
        data: results,
        message: 'نتایج جستجو با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در جستجوی جامع:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // جستجوی پیشرفته در نامه‌ها
  // =============================================
  static async searchLetters(req, res) {
    try {
      const {
        q,
        letterType,
        status,
        priority,
        classification,
        fromDate,
        toDate,
        secretariat,
        sender,
        receiver,
        department,
        limit,
        page,
      } = req.query;

      const results = await SearchService.searchLetters(
        q || '',
        req.user,
        {
          letterType,
          status,
          priority,
          classification,
          fromDate,
          toDate,
          secretariat,
          sender,
          receiver,
          department,
          limit: parseInt(limit) || 20,
          page: parseInt(page) || 1,
        }
      );

      res.status(200).json({
        success: true,
        data: results,
        message: 'نتایج جستجوی نامه‌ها با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در جستجوی نامه‌ها:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // پیشنهادات جستجو (Autocomplete)
  // =============================================
  static async getSuggestions(req, res) {
    try {
      const { q, limit } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'حداقل ۲ کاراکتر وارد کنید',
        });
      }

      const suggestions = await SearchService.getSuggestions(
        q.trim(),
        req.user,
        { limit: parseInt(limit) || 10 }
      );

      res.status(200).json({
        success: true,
        data: suggestions,
        message: 'پیشنهادات جستجو با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت پیشنهادات:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = SearchController;
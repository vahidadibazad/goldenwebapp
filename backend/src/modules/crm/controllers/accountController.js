// backend/src/modules/crm/controllers/accountController.js
const AccountService = require('../services/accountService');
const logAudit = require('../../../utils/auditLogger');

class AccountController {

  // =============================================
  // دریافت لیست شرکت‌ها
  // =============================================
  static async getAccounts(req, res) {
    try {
      const { tier, owner, search, page, limit } = req.query;
      
      const result = await AccountService.getAccounts({
        tier,
        owner: owner || req.user.id,
        search,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: 'لیست شرکت‌ها با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت شرکت‌ها:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت یک شرکت با ID
  // =============================================
  static async getAccountById(req, res) {
    try {
      const account = await AccountService.getAccountById(req.params.id);
      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'شرکت یافت نشد',
        });
      }
      res.json({
        success: true,
        data: account,
        message: 'اطلاعات شرکت با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت شرکت:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // ایجاد شرکت جدید
  // =============================================
  static async createAccount(req, res) {
    try {
      const account = await AccountService.createAccount(req.body, req.user.id);
      
      await logAudit(req, 'CREATE', 'CRM_ACCOUNT', {
        accountId: account._id,
        name: account.name,
        tier: account.tier,
      });
      
      res.status(201).json({
        success: true,
        data: account,
        message: 'شرکت با موفقیت ایجاد شد',
      });
    } catch (error) {
      console.error('❌ خطا در ایجاد شرکت:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // ویرایش شرکت
  // =============================================
  static async updateAccount(req, res) {
    try {
      const account = await AccountService.updateAccount(req.params.id, req.body);
      
      await logAudit(req, 'UPDATE', 'CRM_ACCOUNT', {
        accountId: account._id,
        name: account.name,
        changes: req.body,
      });
      
      res.json({
        success: true,
        data: account,
        message: 'شرکت با موفقیت ویرایش شد',
      });
    } catch (error) {
      console.error('❌ خطا در ویرایش شرکت:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // حذف شرکت
  // =============================================
  static async deleteAccount(req, res) {
    try {
      await AccountService.deleteAccount(req.params.id);
      
      await logAudit(req, 'DELETE', 'CRM_ACCOUNT', {
        accountId: req.params.id,
      });
      
      res.json({
        success: true,
        message: 'شرکت با موفقیت حذف شد',
      });
    } catch (error) {
      console.error('❌ خطا در حذف شرکت:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت مخاطبین یک شرکت
  // =============================================
  static async getAccountContacts(req, res) {
    try {
      const { id } = req.params;
      const { page, limit } = req.query;
      
      const contacts = await AccountService.getAccountContacts(id, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      
      res.json({
        success: true,
        data: contacts,
        message: 'مخاطبین شرکت با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت مخاطبین شرکت:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت فرصت‌های یک شرکت
  // =============================================
  static async getAccountOpportunities(req, res) {
    try {
      const { id } = req.params;
      const { page, limit } = req.query;
      
      const opportunities = await AccountService.getAccountOpportunities(id, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      
      res.json({
        success: true,
        data: opportunities,
        message: 'فرصت‌های شرکت با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت فرصت‌های شرکت:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت قراردادهای یک شرکت
  // =============================================
  static async getAccountContracts(req, res) {
    try {
      const { id } = req.params;
      const { page, limit } = req.query;
      
      const contracts = await AccountService.getAccountContracts(id, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      
      res.json({
        success: true,
        data: contracts,
        message: 'قراردادهای شرکت با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت قراردادهای شرکت:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت آمار شرکت‌ها
  // =============================================
  static async getAccountStats(req, res) {
    try {
      const stats = await AccountService.getAccountStats();
      res.json({
        success: true,
        data: stats,
        message: 'آمار شرکت‌ها با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت آمار شرکت‌ها:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = AccountController;
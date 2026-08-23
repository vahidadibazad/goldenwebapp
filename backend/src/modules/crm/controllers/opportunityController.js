const OpportunityService = require('../services/opportunityService');
const logAudit = require('../../../shared/utils/auditLogger');

class OpportunityController {

  // =============================================
  // دریافت لیست فرصت‌ها
  // =============================================
  static async getOpportunities(req, res) {
    try {
      const { stage, owner, account, page, limit } = req.query;
      
      const result = await OpportunityService.getOpportunities({
        stage,
        owner: owner || req.user.id,
        account,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: 'لیست فرصت‌ها با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت فرصت‌ها:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت یک فرصت با ID
  // =============================================
  static async getOpportunityById(req, res) {
    try {
      const opportunity = await OpportunityService.getOpportunityById(req.params.id);
      if (!opportunity) {
        return res.status(404).json({
          success: false,
          error: 'فرصت یافت نشد',
        });
      }
      res.json({
        success: true,
        data: opportunity,
        message: 'اطلاعات فرصت با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت فرصت:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // ایجاد فرصت جدید
  // =============================================
  static async createOpportunity(req, res) {
    try {
      const opportunity = await OpportunityService.createOpportunity(req.body, req.user.id);
      
      await logAudit(req, 'CREATE', 'CRM_OPPORTUNITY', {
        opportunityId: opportunity._id,
        name: opportunity.name,
        amount: opportunity.amount,
      });
      
      res.status(201).json({
        success: true,
        data: opportunity,
        message: 'فرصت با موفقیت ایجاد شد',
      });
    } catch (error) {
      console.error('❌ خطا در ایجاد فرصت:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // ویرایش فرصت
  // =============================================
  static async updateOpportunity(req, res) {
    try {
      const opportunity = await OpportunityService.updateOpportunity(req.params.id, req.body);
      
      await logAudit(req, 'UPDATE', 'CRM_OPPORTUNITY', {
        opportunityId: opportunity._id,
        changes: req.body,
      });
      
      res.json({
        success: true,
        data: opportunity,
        message: 'فرصت با موفقیت ویرایش شد',
      });
    } catch (error) {
      console.error('❌ خطا در ویرایش فرصت:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // حذف فرصت
  // =============================================
  static async deleteOpportunity(req, res) {
    try {
      await OpportunityService.deleteOpportunity(req.params.id);
      
      await logAudit(req, 'DELETE', 'CRM_OPPORTUNITY', {
        opportunityId: req.params.id,
      });
      
      res.json({
        success: true,
        message: 'فرصت با موفقیت حذف شد',
      });
    } catch (error) {
      console.error('❌ خطا در حذف فرصت:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // تغییر مرحله فرصت
  // =============================================
  static async changeOpportunityStage(req, res) {
    try {
      const { stage, note } = req.body;
      
      const opportunity = await OpportunityService.changeOpportunityStage(
        req.params.id,
        stage,
        note || ''
      );
      
      await logAudit(req, 'UPDATE', 'CRM_OPPORTUNITY', {
        opportunityId: opportunity._id,
        action: 'change_stage',
        stage,
      });
      
      res.json({
        success: true,
        data: opportunity,
        message: 'مرحله فرصت با موفقیت تغییر کرد',
      });
    } catch (error) {
      console.error('❌ خطا در تغییر مرحله فرصت:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت آمار فرصت‌ها
  // =============================================
  static async getOpportunityStats(req, res) {
    try {
      const stats = await OpportunityService.getOpportunityStats();
      res.json({
        success: true,
        data: stats,
        message: 'آمار فرصت‌ها با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت آمار فرصت‌ها:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = OpportunityController;
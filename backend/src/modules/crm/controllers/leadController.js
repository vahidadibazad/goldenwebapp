const LeadService = require('../services/leadService');
const logAudit = require('../../../utils/auditLogger');

class LeadController {

  // =============================================
  // دریافت لیست سرنخ‌ها
  // =============================================
  static async getLeads(req, res) {
    try {
      const { status, assignedTo, search, page, limit } = req.query;
      
      const result = await LeadService.getLeads({
        status,
        assignedTo: assignedTo || req.user.id,
        search,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: 'لیست سرنخ‌ها با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت سرنخ‌ها:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت یک سرنخ با ID
  // =============================================
  static async getLeadById(req, res) {
    try {
      const lead = await LeadService.getLeadById(req.params.id);
      if (!lead) {
        return res.status(404).json({
          success: false,
          error: 'سرنخ یافت نشد',
        });
      }
      res.json({
        success: true,
        data: lead,
        message: 'اطلاعات سرنخ با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت سرنخ:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // ایجاد سرنخ جدید
  // =============================================
  static async createLead(req, res) {
    try {
      const lead = await LeadService.createLead(req.body, req.user.id);
      
      await logAudit(req, 'CREATE', 'CRM_LEAD', {
        leadId: lead._id,
        firstName: lead.firstName,
        lastName: lead.lastName,
      });
      
      res.status(201).json({
        success: true,
        data: lead,
        message: 'سرنخ با موفقیت ایجاد شد',
      });
    } catch (error) {
      console.error('❌ خطا در ایجاد سرنخ:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // ویرایش سرنخ
  // =============================================
  static async updateLead(req, res) {
    try {
      const lead = await LeadService.updateLead(req.params.id, req.body);
      
      await logAudit(req, 'UPDATE', 'CRM_LEAD', {
        leadId: lead._id,
        changes: req.body,
      });
      
      res.json({
        success: true,
        data: lead,
        message: 'سرنخ با موفقیت ویرایش شد',
      });
    } catch (error) {
      console.error('❌ خطا در ویرایش سرنخ:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // حذف سرنخ
  // =============================================
  static async deleteLead(req, res) {
    try {
      await LeadService.deleteLead(req.params.id);
      
      await logAudit(req, 'DELETE', 'CRM_LEAD', {
        leadId: req.params.id,
      });
      
      res.json({
        success: true,
        message: 'سرنخ با موفقیت حذف شد',
      });
    } catch (error) {
      console.error('❌ خطا در حذف سرنخ:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // تبدیل سرنخ به مشتری
  // =============================================
  static async convertLead(req, res) {
    try {
      const { accountData } = req.body;
      const lead = await LeadService.getLeadById(req.params.id);
      
      if (!lead) {
        return res.status(404).json({
          success: false,
          error: 'سرنخ یافت نشد',
        });
      }
      
      const result = await lead.convertToAccount(accountData);
      
      await logAudit(req, 'UPDATE', 'CRM_LEAD', {
        leadId: lead._id,
        action: 'convert',
        accountId: result.account._id,
      });
      
      res.json({
        success: true,
        data: result,
        message: 'سرنخ با موفقیت به مشتری تبدیل شد',
      });
    } catch (error) {
      console.error('❌ خطا در تبدیل سرنخ:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت آمار سرنخ‌ها
  // =============================================
  static async getLeadStats(req, res) {
    try {
      const stats = await LeadService.getLeadStats();
      res.json({
        success: true,
        data: stats,
        message: 'آمار سرنخ‌ها با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت آمار سرنخ‌ها:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // تخصیص سرنخ به کاربر
  // =============================================
  static async assignLead(req, res) {
    try {
      const { userId } = req.body;
      const lead = await LeadService.assignLead(req.params.id, userId);
      
      await logAudit(req, 'UPDATE', 'CRM_LEAD', {
        leadId: lead._id,
        action: 'assign',
        assignedTo: userId,
      });
      
      res.json({
        success: true,
        data: lead,
        message: 'سرنخ با موفقیت تخصیص داده شد',
      });
    } catch (error) {
      console.error('❌ خطا در تخصیص سرنخ:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = LeadController;
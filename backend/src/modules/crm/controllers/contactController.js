// backend/src/modules/crm/controllers/contactController.js
const ContactService = require('../services/contactService');
const logAudit = require('../../../utils/auditLogger');

class ContactController {

  // =============================================
  // دریافت لیست مخاطبین
  // =============================================
  static async getContacts(req, res) {
    try {
      const { account, owner, search, page, limit } = req.query;
      
      const result = await ContactService.getContacts({
        account,
        owner: owner || req.user.id,
        search,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: 'لیست مخاطبین با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت مخاطبین:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت یک مخاطب با ID
  // =============================================
  static async getContactById(req, res) {
    try {
      const contact = await ContactService.getContactById(req.params.id);
      if (!contact) {
        return res.status(404).json({
          success: false,
          error: 'مخاطب یافت نشد',
        });
      }
      res.json({
        success: true,
        data: contact,
        message: 'اطلاعات مخاطب با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت مخاطب:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // ایجاد مخاطب جدید
  // =============================================
  static async createContact(req, res) {
    try {
      const contact = await ContactService.createContact(req.body, req.user.id);
      
      await logAudit(req, 'CREATE', 'CRM_CONTACT', {
        contactId: contact._id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        account: contact.account,
      });
      
      res.status(201).json({
        success: true,
        data: contact,
        message: 'مخاطب با موفقیت ایجاد شد',
      });
    } catch (error) {
      console.error('❌ خطا در ایجاد مخاطب:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // ویرایش مخاطب
  // =============================================
  static async updateContact(req, res) {
    try {
      const contact = await ContactService.updateContact(req.params.id, req.body);
      
      await logAudit(req, 'UPDATE', 'CRM_CONTACT', {
        contactId: contact._id,
        changes: req.body,
      });
      
      res.json({
        success: true,
        data: contact,
        message: 'مخاطب با موفقیت ویرایش شد',
      });
    } catch (error) {
      console.error('❌ خطا در ویرایش مخاطب:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // حذف مخاطب
  // =============================================
  static async deleteContact(req, res) {
    try {
      await ContactService.deleteContact(req.params.id);
      
      await logAudit(req, 'DELETE', 'CRM_CONTACT', {
        contactId: req.params.id,
      });
      
      res.json({
        success: true,
        message: 'مخاطب با موفقیت حذف شد',
      });
    } catch (error) {
      console.error('❌ خطا در حذف مخاطب:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت تاریخچه فعالیت‌های مخاطب
  // =============================================
  static async getContactActivities(req, res) {
    try {
      const { id } = req.params;
      const { limit = 20 } = req.query;
      
      const activities = await ContactService.getContactActivities(id, parseInt(limit));
      
      res.json({
        success: true,
        data: activities,
        message: 'تاریخچه فعالیت‌های مخاطب با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت تاریخچه فعالیت‌ها:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت آمار مخاطبین
  // =============================================
  static async getContactStats(req, res) {
    try {
      const stats = await ContactService.getContactStats();
      res.json({
        success: true,
        data: stats,
        message: 'آمار مخاطبین با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت آمار مخاطبین:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = ContactController;
// backend/src/modules/crm/controllers/contractController.js
const ContractService = require('../services/contractService');
const logAudit = require('../../../utils/auditLogger');

class ContractController {

  // =============================================
  // دریافت لیست قراردادها
  // =============================================
  static async getContracts(req, res) {
    try {
      const { status, owner, account, search, page, limit } = req.query;
      
      const result = await ContractService.getContracts({
        status,
        owner: owner || req.user.id,
        account,
        search,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: 'لیست قراردادها با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت قراردادها:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت یک قرارداد با ID
  // =============================================
  static async getContractById(req, res) {
    try {
      const contract = await ContractService.getContractById(req.params.id);
      if (!contract) {
        return res.status(404).json({
          success: false,
          error: 'قرارداد یافت نشد',
        });
      }
      res.json({
        success: true,
        data: contract,
        message: 'اطلاعات قرارداد با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت قرارداد:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // ایجاد قرارداد جدید
  // =============================================
  static async createContract(req, res) {
    try {
      const contract = await ContractService.createContract(req.body, req.user.id);
      
      await logAudit(req, 'CREATE', 'CRM_CONTRACT', {
        contractId: contract._id,
        name: contract.name,
        account: contract.account,
        amount: contract.value?.amount,
      });
      
      res.status(201).json({
        success: true,
        data: contract,
        message: 'قرارداد با موفقیت ایجاد شد',
      });
    } catch (error) {
      console.error('❌ خطا در ایجاد قرارداد:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // ویرایش قرارداد
  // =============================================
  static async updateContract(req, res) {
    try {
      const contract = await ContractService.updateContract(req.params.id, req.body);
      
      await logAudit(req, 'UPDATE', 'CRM_CONTRACT', {
        contractId: contract._id,
        name: contract.name,
        changes: req.body,
      });
      
      res.json({
        success: true,
        data: contract,
        message: 'قرارداد با موفقیت ویرایش شد',
      });
    } catch (error) {
      console.error('❌ خطا در ویرایش قرارداد:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // حذف قرارداد
  // =============================================
  static async deleteContract(req, res) {
    try {
      await ContractService.deleteContract(req.params.id);
      
      await logAudit(req, 'DELETE', 'CRM_CONTRACT', {
        contractId: req.params.id,
      });
      
      res.json({
        success: true,
        message: 'قرارداد با موفقیت حذف شد',
      });
    } catch (error) {
      console.error('❌ خطا در حذف قرارداد:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // فعال‌سازی قرارداد
  // =============================================
  static async activateContract(req, res) {
    try {
      const contract = await ContractService.activateContract(req.params.id);
      
      await logAudit(req, 'UPDATE', 'CRM_CONTRACT', {
        contractId: contract._id,
        action: 'activate',
      });
      
      res.json({
        success: true,
        data: contract,
        message: 'قرارداد با موفقیت فعال شد',
      });
    } catch (error) {
      console.error('❌ خطا در فعال‌سازی قرارداد:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // تمدید قرارداد
  // =============================================
  static async renewContract(req, res) {
    try {
      const { newEndDate, note } = req.body;
      
      if (!newEndDate) {
        return res.status(400).json({
          success: false,
          error: 'تاریخ پایان جدید الزامی است',
        });
      }
      
      const contract = await ContractService.renewContract(
        req.params.id,
        new Date(newEndDate),
        note || ''
      );
      
      await logAudit(req, 'UPDATE', 'CRM_CONTRACT', {
        contractId: contract._id,
        action: 'renew',
        newEndDate,
      });
      
      res.json({
        success: true,
        data: contract,
        message: 'قرارداد با موفقیت تمدید شد',
      });
    } catch (error) {
      console.error('❌ خطا در تمدید قرارداد:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // لغو قرارداد
  // =============================================
  static async cancelContract(req, res) {
    try {
      const { reason } = req.body;
      const contract = await ContractService.cancelContract(req.params.id, reason || '');
      
      await logAudit(req, 'UPDATE', 'CRM_CONTRACT', {
        contractId: contract._id,
        action: 'cancel',
        reason,
      });
      
      res.json({
        success: true,
        data: contract,
        message: 'قرارداد با موفقیت لغو شد',
      });
    } catch (error) {
      console.error('❌ خطا در لغو قرارداد:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت قراردادهای در حال انقضا
  // =============================================
  static async getExpiringContracts(req, res) {
    try {
      const { days = 30 } = req.query;
      const contracts = await ContractService.getExpiringContracts(parseInt(days));
      
      res.json({
        success: true,
        data: contracts,
        message: 'قراردادهای در حال انقضا با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت قراردادهای در حال انقضا:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // دریافت آمار قراردادها
  // =============================================
  static async getContractStats(req, res) {
    try {
      const stats = await ContractService.getContractStats();
      res.json({
        success: true,
        data: stats,
        message: 'آمار قراردادها با موفقیت دریافت شد',
      });
    } catch (error) {
      console.error('❌ خطا در دریافت آمار قراردادها:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = ContractController;
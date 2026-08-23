// backend/src/modules/crm/controllers/crmController.js
const CrmService = require('../services/crmService');
const logAudit = require('../../../utils/auditLogger');

class CrmController {

  // =============================================
  // سرنخ‌ها (Leads)
  // =============================================

  static async getLeads(req, res) {
    try {
      const { status, assignedTo, search, page, limit } = req.query;
      const result = await CrmService.getLeads({
        status,
        assignedTo: assignedTo || req.user.id,
        search,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getLeadById(req, res) {
    try {
      const lead = await CrmService.getLeadById(req.params.id);
      if (!lead) {
        return res.status(404).json({ success: false, error: 'سرنخ یافت نشد' });
      }
      res.json({ success: true, data: lead });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async createLead(req, res) {
    try {
      const lead = await CrmService.createLead(req.body, req.user.id);
      await logAudit(req, 'CREATE', 'CRM_LEAD', { leadId: lead._id });
      res.status(201).json({ success: true, data: lead });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async updateLead(req, res) {
    try {
      const lead = await CrmService.updateLead(req.params.id, req.body);
      await logAudit(req, 'UPDATE', 'CRM_LEAD', { leadId: lead._id });
      res.json({ success: true, data: lead });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async deleteLead(req, res) {
    try {
      await CrmService.deleteLead(req.params.id);
      await logAudit(req, 'DELETE', 'CRM_LEAD', { leadId: req.params.id });
      res.json({ success: true, message: 'سرنخ با موفقیت حذف شد' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async getLeadStats(req, res) {
    try {
      const stats = await CrmService.getLeadStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async convertLead(req, res) {
    try {
      const lead = await CrmService.getLeadById(req.params.id);
      if (!lead) {
        return res.status(404).json({ success: false, error: 'سرنخ یافت نشد' });
      }

      const { accountData } = req.body;
      const result = await lead.convertToAccount(accountData);
      await logAudit(req, 'UPDATE', 'CRM_LEAD', {
        leadId: lead._id,
        action: 'convert',
        accountId: result.account._id,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // =============================================
  // شرکت‌ها (Accounts)
  // =============================================

  static async getAccounts(req, res) {
    try {
      const { tier, owner, search, page, limit } = req.query;
      const result = await CrmService.getAccounts({
        tier,
        owner: owner || req.user.id,
        search,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getAccountById(req, res) {
    try {
      const account = await CrmService.getAccountById(req.params.id);
      if (!account) {
        return res.status(404).json({ success: false, error: 'شرکت یافت نشد' });
      }
      res.json({ success: true, data: account });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async createAccount(req, res) {
    try {
      const account = await CrmService.createAccount(req.body, req.user.id);
      await logAudit(req, 'CREATE', 'CRM_ACCOUNT', { accountId: account._id });
      res.status(201).json({ success: true, data: account });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async updateAccount(req, res) {
    try {
      const account = await CrmService.updateAccount(req.params.id, req.body);
      await logAudit(req, 'UPDATE', 'CRM_ACCOUNT', { accountId: account._id });
      res.json({ success: true, data: account });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async deleteAccount(req, res) {
    try {
      await CrmService.deleteAccount(req.params.id);
      await logAudit(req, 'DELETE', 'CRM_ACCOUNT', { accountId: req.params.id });
      res.json({ success: true, message: 'شرکت با موفقیت حذف شد' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // =============================================
  // مخاطبین (Contacts)
  // =============================================

  static async getContacts(req, res) {
    try {
      const { account, owner, page, limit } = req.query;
      const result = await CrmService.getContacts({
        account,
        owner: owner || req.user.id,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getContactById(req, res) {
    try {
      const contact = await CrmService.getContactById(req.params.id);
      if (!contact) {
        return res.status(404).json({ success: false, error: 'مخاطب یافت نشد' });
      }
      res.json({ success: true, data: contact });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async createContact(req, res) {
    try {
      const contact = await CrmService.createContact(req.body, req.user.id);
      await logAudit(req, 'CREATE', 'CRM_CONTACT', { contactId: contact._id });
      res.status(201).json({ success: true, data: contact });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async updateContact(req, res) {
    try {
      const contact = await CrmService.updateContact(req.params.id, req.body);
      await logAudit(req, 'UPDATE', 'CRM_CONTACT', { contactId: contact._id });
      res.json({ success: true, data: contact });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async deleteContact(req, res) {
    try {
      await CrmService.deleteContact(req.params.id);
      await logAudit(req, 'DELETE', 'CRM_CONTACT', { contactId: req.params.id });
      res.json({ success: true, message: 'مخاطب با موفقیت حذف شد' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // =============================================
  // فرصت‌ها (Opportunities)
  // =============================================

  static async getOpportunities(req, res) {
    try {
      const { stage, owner, account, page, limit } = req.query;
      const result = await CrmService.getOpportunities({
        stage,
        owner: owner || req.user.id,
        account,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getOpportunityById(req, res) {
    try {
      const opportunity = await CrmService.getOpportunityById(req.params.id);
      if (!opportunity) {
        return res.status(404).json({ success: false, error: 'فرصت یافت نشد' });
      }
      res.json({ success: true, data: opportunity });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async createOpportunity(req, res) {
    try {
      const opportunity = await CrmService.createOpportunity(req.body, req.user.id);
      await logAudit(req, 'CREATE', 'CRM_OPPORTUNITY', { opportunityId: opportunity._id });
      res.status(201).json({ success: true, data: opportunity });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async updateOpportunity(req, res) {
    try {
      const opportunity = await CrmService.updateOpportunity(req.params.id, req.body);
      await logAudit(req, 'UPDATE', 'CRM_OPPORTUNITY', { opportunityId: opportunity._id });
      res.json({ success: true, data: opportunity });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async deleteOpportunity(req, res) {
    try {
      await CrmService.deleteOpportunity(req.params.id);
      await logAudit(req, 'DELETE', 'CRM_OPPORTUNITY', { opportunityId: req.params.id });
      res.json({ success: true, message: 'فرصت با موفقیت حذف شد' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async changeOpportunityStage(req, res) {
    try {
      const { stage, note } = req.body;
      const opportunity = await CrmService.changeOpportunityStage(
        req.params.id,
        stage,
        note || ''
      );
      await logAudit(req, 'UPDATE', 'CRM_OPPORTUNITY', {
        opportunityId: opportunity._id,
        action: 'change_stage',
        stage,
      });
      res.json({ success: true, data: opportunity });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // =============================================
  // قراردادها (Contracts)
  // =============================================

  static async getContracts(req, res) {
    try {
      const { status, owner, account, page, limit } = req.query;
      const result = await CrmService.getContracts({
        status,
        owner: owner || req.user.id,
        account,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getContractById(req, res) {
    try {
      const contract = await CrmService.getContractById(req.params.id);
      if (!contract) {
        return res.status(404).json({ success: false, error: 'قرارداد یافت نشد' });
      }
      res.json({ success: true, data: contract });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async createContract(req, res) {
    try {
      const contract = await CrmService.createContract(req.body, req.user.id);
      await logAudit(req, 'CREATE', 'CRM_CONTRACT', { contractId: contract._id });
      res.status(201).json({ success: true, data: contract });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async updateContract(req, res) {
    try {
      const contract = await CrmService.updateContract(req.params.id, req.body);
      await logAudit(req, 'UPDATE', 'CRM_CONTRACT', { contractId: contract._id });
      res.json({ success: true, data: contract });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async deleteContract(req, res) {
    try {
      await CrmService.deleteContract(req.params.id);
      await logAudit(req, 'DELETE', 'CRM_CONTRACT', { contractId: req.params.id });
      res.json({ success: true, message: 'قرارداد با موفقیت حذف شد' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async activateContract(req, res) {
    try {
      const contract = await CrmService.activateContract(req.params.id);
      await logAudit(req, 'UPDATE', 'CRM_CONTRACT', {
        contractId: contract._id,
        action: 'activate',
      });
      res.json({ success: true, data: contract });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async renewContract(req, res) {
    try {
      const { newEndDate } = req.body;
      const contract = await CrmService.renewContract(req.params.id, newEndDate);
      await logAudit(req, 'UPDATE', 'CRM_CONTRACT', {
        contractId: contract._id,
        action: 'renew',
      });
      res.json({ success: true, data: contract });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // =============================================
  // داشبورد CRM
  // =============================================

  static async getDashboard(req, res) {
    try {
      const [leadStats, opportunityStats, contractStats] = await Promise.all([
        CrmService.getLeadStats(),
        CrmService.getOpportunityStats(),
        CrmService.getContractStats(),
      ]);

      // دریافت سرنخ‌های اخیر
      const recentLeads = await CrmService.getLeads({
        limit: 5,
        assignedTo: req.user.id,
      });

      // دریافت فرصت‌های در حال انجام
      const activeOpportunities = await CrmService.getOpportunities({
        stage: { $nin: ['closed_won', 'closed_lost'] },
        owner: req.user.id,
        limit: 5,
      });

      res.json({
        success: true,
        data: {
          leadStats,
          opportunityStats,
          contractStats,
          recentLeads: recentLeads.data,
          activeOpportunities: activeOpportunities.data,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = CrmController;
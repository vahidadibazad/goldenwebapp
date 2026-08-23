// backend/src/modules/crm/services/crmService.js
const Lead = require('../models/Lead');
const Account = require('../models/Account');
const Contact = require('../models/Contact');
const Opportunity = require('../models/Opportunity');
const Contract = require('../models/Contract');
const CacheService = require('../../../services/cacheService');

class CrmService {

  // =============================================
  // مدیریت سرنخ‌ها
  // =============================================

  static async createLead(data, userId) {
    const lead = new Lead({
      ...data,
      createdBy: userId,
      assignedTo: data.assignedTo || userId,
      assignedAt: new Date(),
    });
    await lead.save();
    await CacheService.clearModule('crm:leads:');
    return lead;
  }

  static async getLeads(options = {}) {
    const { status, assignedTo, search, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    const filter = {};

    if (status) filter.leadStatus = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) {
      filter.$text = { $search: search };
    }

    let query = Lead.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'fullName username')
      .populate('createdBy', 'fullName username');

    if (search) {
      query = query.sort({ score: { $meta: 'textScore' } });
    }

    const [data, total] = await Promise.all([
      query.lean(),
      Lead.countDocuments(filter),
    ]);

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  static async getLeadById(id) {
    return Lead.findById(id)
      .populate('assignedTo', 'fullName username')
      .populate('createdBy', 'fullName username')
      .lean();
  }

  static async updateLead(id, data) {
    const lead = await Lead.findByIdAndUpdate(id, data, { new: true });
    if (!lead) throw new Error('سرنخ یافت نشد');
    await CacheService.clearModule('crm:leads:');
    return lead;
  }

  static async deleteLead(id) {
    const lead = await Lead.findByIdAndDelete(id);
    if (!lead) throw new Error('سرنخ یافت نشد');
    await CacheService.clearModule('crm:leads:');
    return lead;
  }

  static async getLeadStats() {
    const cacheKey = 'crm:leads:stats';
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const stats = await Lead.getStats();
    await CacheService.set(cacheKey, stats, 300);
    return stats;
  }

  // =============================================
  // مدیریت شرکت‌ها
  // =============================================

  static async createAccount(data, userId) {
    const account = new Account({
      ...data,
      createdBy: userId,
      owner: data.owner || userId,
    });
    await account.save();
    await CacheService.clearModule('crm:accounts:');
    return account;
  }

  static async getAccounts(options = {}) {
    const { tier, owner, search, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    const filter = { isActive: true };

    if (tier) filter.tier = tier;
    if (owner) filter.owner = owner;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
      ];
    }

    const data = await Account.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .populate('owner', 'fullName username')
      .populate('createdBy', 'fullName username')
      .lean();

    const total = await Account.countDocuments(filter);

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  static async getAccountById(id) {
    return Account.findById(id)
      .populate('owner', 'fullName username')
      .populate('createdBy', 'fullName username')
      .lean();
  }

  static async updateAccount(id, data) {
    const account = await Account.findByIdAndUpdate(id, data, { new: true });
    if (!account) throw new Error('شرکت یافت نشد');
    await CacheService.clearModule('crm:accounts:');
    return account;
  }

  static async deleteAccount(id) {
    const account = await Account.findByIdAndDelete(id);
    if (!account) throw new Error('شرکت یافت نشد');
    await CacheService.clearModule('crm:accounts:');
    return account;
  }

  // =============================================
  // مدیریت مخاطبین
  // =============================================

  static async createContact(data, userId) {
    const contact = new Contact({
      ...data,
      createdBy: userId,
      owner: data.owner || userId,
    });
    await contact.save();
    await CacheService.clearModule('crm:contacts:');
    return contact;
  }

  static async getContacts(options = {}) {
    const { account, owner, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    const filter = { isActive: true };

    if (account) filter.account = account;
    if (owner) filter.owner = owner;

    const data = await Contact.find(filter)
      .sort({ firstName: 1, lastName: 1 })
      .skip(skip)
      .limit(limit)
      .populate('account', 'name')
      .populate('owner', 'fullName username')
      .lean();

    const total = await Contact.countDocuments(filter);

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  // =============================================
  // مدیریت فرصت‌ها
  // =============================================

  static async createOpportunity(data, userId) {
    const opportunity = new Opportunity({
      ...data,
      createdBy: userId,
      owner: data.owner || userId,
    });
    await opportunity.save();
    await CacheService.clearModule('crm:opportunities:');
    return opportunity;
  }

  static async getOpportunities(options = {}) {
    const { stage, owner, account, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    const filter = { isActive: true };

    if (stage) filter.stage = stage;
    if (owner) filter.owner = owner;
    if (account) filter.account = account;

    const data = await Opportunity.find(filter)
      .sort({ closeDate: 1 })
      .skip(skip)
      .limit(limit)
      .populate('account', 'name')
      .populate('owner', 'fullName username')
      .populate('contact', 'firstName lastName')
      .lean();

    const total = await Opportunity.countDocuments(filter);

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  // =============================================
  // مدیریت قراردادها
  // =============================================

  static async createContract(data, userId) {
    const contract = new Contract({
      ...data,
      createdBy: userId,
      owner: data.owner || userId,
    });
    await contract.save();
    await CacheService.clearModule('crm:contracts:');
    return contract;
  }

  static async getContracts(options = {}) {
    const { status, owner, account, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    const filter = {};

    if (status) filter.status = status;
    if (owner) filter.owner = owner;
    if (account) filter.account = account;

    const data = await Contract.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('account', 'name')
      .populate('owner', 'fullName username')
      .lean();

    const total = await Contract.countDocuments(filter);

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }
}

module.exports = CrmService;
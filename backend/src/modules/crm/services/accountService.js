// backend/src/modules/crm/services/accountService.js
const Account = require('../models/Account');
const Contact = require('../models/Contact');
const Opportunity = require('../models/Opportunity');
const Contract = require('../models/Contract');
const CacheService = require('../../../services/cacheService');

class AccountService {

  // =============================================
  // ایجاد شرکت جدید
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

  // =============================================
  // دریافت لیست شرکت‌ها
  // =============================================
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
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      Account.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .populate('owner', 'fullName username')
        .populate('createdBy', 'fullName username')
        .lean(),
      Account.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // =============================================
  // دریافت یک شرکت با ID
  // =============================================
  static async getAccountById(id) {
    const cacheKey = `crm:account:${id}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const account = await Account.findById(id)
      .populate('owner', 'fullName username')
      .populate('createdBy', 'fullName username')
      .lean();

    if (account) {
      await CacheService.set(cacheKey, account, 3600);
    }
    return account;
  }

  // =============================================
  // ویرایش شرکت
  // =============================================
  static async updateAccount(id, data) {
    const account = await Account.findByIdAndUpdate(id, data, { new: true });
    if (!account) throw new Error('شرکت یافت نشد');
    await CacheService.delete(`crm:account:${id}`);
    await CacheService.clearModule('crm:accounts:');
    return account;
  }

  // =============================================
  // حذف شرکت
  // =============================================
  static async deleteAccount(id) {
    const account = await Account.findByIdAndDelete(id);
    if (!account) throw new Error('شرکت یافت نشد');
    
    // حذف مخاطبین مرتبط
    await Contact.deleteMany({ account: id });
    
    // حذف فرصت‌های مرتبط
    await Opportunity.deleteMany({ account: id });
    
    // حذف قراردادهای مرتبط
    await Contract.deleteMany({ account: id });
    
    await CacheService.delete(`crm:account:${id}`);
    await CacheService.clearModule('crm:accounts:');
    await CacheService.clearModule('crm:contacts:');
    await CacheService.clearModule('crm:opportunities:');
    await CacheService.clearModule('crm:contracts:');
    return account;
  }

  // =============================================
  // دریافت مخاطبین یک شرکت
  // =============================================
  static async getAccountContacts(accountId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Contact.find({ account: accountId, isActive: true })
        .sort({ firstName: 1, lastName: 1 })
        .skip(skip)
        .limit(limit)
        .populate('owner', 'fullName username')
        .lean(),
      Contact.countDocuments({ account: accountId, isActive: true }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // =============================================
  // دریافت فرصت‌های یک شرکت
  // =============================================
  static async getAccountOpportunities(accountId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Opportunity.find({ account: accountId, isActive: true })
        .sort({ closeDate: 1 })
        .skip(skip)
        .limit(limit)
        .populate('owner', 'fullName username')
        .lean(),
      Opportunity.countDocuments({ account: accountId, isActive: true }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // =============================================
  // دریافت قراردادهای یک شرکت
  // =============================================
  static async getAccountContracts(accountId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Contract.find({ account: accountId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('owner', 'fullName username')
        .lean(),
      Contract.countDocuments({ account: accountId }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // =============================================
  // دریافت آمار شرکت‌ها
  // =============================================
  static async getAccountStats() {
    const cacheKey = 'crm:accounts:stats';
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const stats = await Account.getStats();
    await CacheService.set(cacheKey, stats, 300);
    return stats;
  }
}

module.exports = AccountService;
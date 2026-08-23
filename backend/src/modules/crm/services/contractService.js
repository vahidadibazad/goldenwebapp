// backend/src/modules/crm/services/contractService.js
const Contract = require('../models/Contract');
const Account = require('../models/Account');
const Opportunity = require('../models/Opportunity');
const CacheService = require('../../../services/cacheService');

class ContractService {

  // =============================================
  // ایجاد قرارداد جدید
  // =============================================
  static async createContract(data, userId) {
    // بررسی وجود شرکت
    const account = await Account.findById(data.accountId);
    if (!account) {
      throw new Error('شرکت مورد نظر یافت نشد');
    }

    // اگر فرصت مرتبط وجود دارد، بررسی کن
    if (data.opportunityId) {
      const opportunity = await Opportunity.findById(data.opportunityId);
      if (!opportunity) {
        throw new Error('فرصت مورد نظر یافت نشد');
      }
    }

    const contract = new Contract({
      ...data,
      account: data.accountId,
      opportunity: data.opportunityId || null,
      createdBy: userId,
      owner: data.owner || userId,
    });
    await contract.save();
    await CacheService.clearModule('crm:contracts:');
    return contract;
  }

  // =============================================
  // دریافت لیست قراردادها
  // =============================================
  static async getContracts(options = {}) {
    const { status, owner, account, search, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    const filter = {};

    if (status) filter.status = status;
    if (owner) filter.owner = owner;
    if (account) filter.account = account;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { contractNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      Contract.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('account', 'name tier')
        .populate('opportunity', 'name')
        .populate('owner', 'fullName username')
        .lean(),
      Contract.countDocuments(filter),
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
  // دریافت یک قرارداد با ID
  // =============================================
  static async getContractById(id) {
    const cacheKey = `crm:contract:${id}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const contract = await Contract.findById(id)
      .populate('account', 'name tier industry')
      .populate('opportunity', 'name stage')
      .populate('owner', 'fullName username')
      .populate('createdBy', 'fullName username')
      .lean();

    if (contract) {
      await CacheService.set(cacheKey, contract, 3600);
    }
    return contract;
  }

  // =============================================
  // ویرایش قرارداد
  // =============================================
  static async updateContract(id, data) {
    const contract = await Contract.findByIdAndUpdate(id, data, { new: true });
    if (!contract) throw new Error('قرارداد یافت نشد');
    await CacheService.delete(`crm:contract:${id}`);
    await CacheService.clearModule('crm:contracts:');
    return contract;
  }

  // =============================================
  // حذف قرارداد
  // =============================================
  static async deleteContract(id) {
    const contract = await Contract.findByIdAndDelete(id);
    if (!contract) throw new Error('قرارداد یافت نشد');
    await CacheService.delete(`crm:contract:${id}`);
    await CacheService.clearModule('crm:contracts:');
    return contract;
  }

  // =============================================
  // فعال‌سازی قرارداد
  // =============================================
  static async activateContract(id) {
    const contract = await Contract.findById(id);
    if (!contract) throw new Error('قرارداد یافت نشد');
    await contract.activate();
    await CacheService.delete(`crm:contract:${id}`);
    await CacheService.clearModule('crm:contracts:');
    return contract;
  }

  // =============================================
  // تمدید قرارداد
  // =============================================
  static async renewContract(id, newEndDate, note = '') {
    const contract = await Contract.findById(id);
    if (!contract) throw new Error('قرارداد یافت نشد');
    await contract.renew(newEndDate);
    await CacheService.delete(`crm:contract:${id}`);
    await CacheService.clearModule('crm:contracts:');
    return contract;
  }

  // =============================================
  // لغو قرارداد
  // =============================================
  static async cancelContract(id, reason = '') {
    const contract = await Contract.findById(id);
    if (!contract) throw new Error('قرارداد یافت نشد');
    await contract.cancel();
    await CacheService.delete(`crm:contract:${id}`);
    await CacheService.clearModule('crm:contracts:');
    return contract;
  }

  // =============================================
  // دریافت قراردادهای در حال انقضا
  // =============================================
  static async getExpiringContracts(days = 30) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    
    return Contract.find({
      status: 'active',
      endDate: { $lte: date },
    })
      .populate('account', 'name')
      .populate('owner', 'fullName username')
      .sort({ endDate: 1 })
      .lean();
  }

  // =============================================
  // دریافت آمار قراردادها
  // =============================================
  static async getContractStats() {
    const cacheKey = 'crm:contracts:stats';
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const stats = await Contract.getStats();
    await CacheService.set(cacheKey, stats, 300);
    return stats;
  }
}

module.exports = ContractService;
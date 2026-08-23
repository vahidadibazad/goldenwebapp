// backend/src/modules/crm/services/opportunityService.js
const Opportunity = require('../models/Opportunity');
const Account = require('../models/Account');
const Contact = require('../models/Contact');
const CacheService = require('../../../services/cacheService');

class OpportunityService {

  // =============================================
  // ایجاد فرصت جدید
  // =============================================
  static async createOpportunity(data, userId) {
    // بررسی وجود شرکت
    const account = await Account.findById(data.accountId);
    if (!account) {
      throw new Error('شرکت مورد نظر یافت نشد');
    }

    // اگر مخاطب مرتبط وجود دارد، بررسی کن
    if (data.contactId) {
      const contact = await Contact.findById(data.contactId);
      if (!contact) {
        throw new Error('مخاطب مورد نظر یافت نشد');
      }
    }

    const opportunity = new Opportunity({
      ...data,
      account: data.accountId,
      contact: data.contactId || null,
      createdBy: userId,
      owner: data.owner || userId,
    });
    await opportunity.save();
    await CacheService.clearModule('crm:opportunities:');
    return opportunity;
  }

  // =============================================
  // دریافت لیست فرصت‌ها
  // =============================================
  static async getOpportunities(options = {}) {
    const { stage, owner, account, search, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    const filter = { isActive: true };

    if (stage) filter.stage = stage;
    if (owner) filter.owner = owner;
    if (account) filter.account = account;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { opportunityNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      Opportunity.find(filter)
        .sort({ closeDate: 1 })
        .skip(skip)
        .limit(limit)
        .populate('account', 'name tier')
        .populate('contact', 'firstName lastName')
        .populate('owner', 'fullName username')
        .lean(),
      Opportunity.countDocuments(filter),
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
  // دریافت یک فرصت با ID
  // =============================================
  static async getOpportunityById(id) {
    const cacheKey = `crm:opportunity:${id}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const opportunity = await Opportunity.findById(id)
      .populate('account', 'name tier industry')
      .populate('contact', 'firstName lastName')
      .populate('owner', 'fullName username')
      .populate('createdBy', 'fullName username')
      .lean();

    if (opportunity) {
      await CacheService.set(cacheKey, opportunity, 3600);
    }
    return opportunity;
  }

  // =============================================
  // ویرایش فرصت
  // =============================================
  static async updateOpportunity(id, data) {
    const opportunity = await Opportunity.findByIdAndUpdate(id, data, { new: true });
    if (!opportunity) throw new Error('فرصت یافت نشد');
    await CacheService.delete(`crm:opportunity:${id}`);
    await CacheService.clearModule('crm:opportunities:');
    return opportunity;
  }

  // =============================================
  // حذف فرصت
  // =============================================
  static async deleteOpportunity(id) {
    const opportunity = await Opportunity.findByIdAndDelete(id);
    if (!opportunity) throw new Error('فرصت یافت نشد');
    await CacheService.delete(`crm:opportunity:${id}`);
    await CacheService.clearModule('crm:opportunities:');
    return opportunity;
  }

  // =============================================
  // تغییر مرحله فرصت
  // =============================================
  static async changeOpportunityStage(id, stage, note = '') {
    const opportunity = await Opportunity.findById(id);
    if (!opportunity) throw new Error('فرصت یافت نشد');
    await opportunity.changeStage(stage, note);
    await CacheService.delete(`crm:opportunity:${id}`);
    await CacheService.clearModule('crm:opportunities:');
    return opportunity;
  }

  // =============================================
  // بستن فرصت (برنده/بازنده)
  // =============================================
  static async closeOpportunity(id, result, note = '') {
    const opportunity = await Opportunity.findById(id);
    if (!opportunity) throw new Error('فرصت یافت نشد');
    
    const stage = result === 'won' ? 'closed_won' : 'closed_lost';
    await opportunity.close(stage, note);
    
    await CacheService.delete(`crm:opportunity:${id}`);
    await CacheService.clearModule('crm:opportunities:');
    return opportunity;
  }

  // =============================================
  // دریافت آمار فرصت‌ها
  // =============================================
  static async getOpportunityStats() {
    const cacheKey = 'crm:opportunities:stats';
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const stats = await Opportunity.getStats();
    await CacheService.set(cacheKey, stats, 300);
    return stats;
  }
}

module.exports = OpportunityService;
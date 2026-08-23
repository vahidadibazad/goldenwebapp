const Lead = require('../models/Lead');
const CacheService = require('../../../shared/services/cacheService');

class LeadService {

  // =============================================
  // ایجاد سرنخ جدید
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

  // =============================================
  // دریافت لیست سرنخ‌ها
  // =============================================
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
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // =============================================
  // دریافت یک سرنخ با ID
  // =============================================
  static async getLeadById(id) {
    const cacheKey = `crm:lead:${id}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const lead = await Lead.findById(id)
      .populate('assignedTo', 'fullName username')
      .populate('createdBy', 'fullName username')
      .lean();

    if (lead) {
      await CacheService.set(cacheKey, lead, 3600);
    }
    return lead;
  }

  // =============================================
  // ویرایش سرنخ
  // =============================================
  static async updateLead(id, data) {
    const lead = await Lead.findByIdAndUpdate(id, data, { new: true });
    if (!lead) throw new Error('سرنخ یافت نشد');
    await CacheService.delete(`crm:lead:${id}`);
    await CacheService.clearModule('crm:leads:');
    return lead;
  }

  // =============================================
  // حذف سرنخ
  // =============================================
  static async deleteLead(id) {
    const lead = await Lead.findByIdAndDelete(id);
    if (!lead) throw new Error('سرنخ یافت نشد');
    await CacheService.delete(`crm:lead:${id}`);
    await CacheService.clearModule('crm:leads:');
    return lead;
  }

  // =============================================
  // تخصیص سرنخ به کاربر
  // =============================================
  static async assignLead(id, userId) {
    const lead = await Lead.findById(id);
    if (!lead) throw new Error('سرنخ یافت نشد');
    await lead.assign(userId);
    await CacheService.delete(`crm:lead:${id}`);
    await CacheService.clearModule('crm:leads:');
    return lead;
  }

  // =============================================
  // دریافت آمار سرنخ‌ها
  // =============================================
  static async getLeadStats() {
    const cacheKey = 'crm:leads:stats';
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const stats = await Lead.getStats();
    await CacheService.set(cacheKey, stats, 300);
    return stats;
  }
}

module.exports = LeadService;
const Opportunity = require('../models/Opportunity');
const CacheService = require('../../../shared/services/cacheService');

class PipelineService {

  // =============================================
  // دریافت خط لوله فروش
  // =============================================
  static async getPipeline(userId, options = {}) {
    const { account, page = 1, limit = 50 } = options;
    const filter = { owner: userId, isActive: true };
    if (account) filter.account = account;

    const skip = (page - 1) * limit;

    const opportunities = await Opportunity.find(filter)
      .populate('account', 'name')
      .populate('contact', 'firstName lastName')
      .sort({ closeDate: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // گروه‌بندی بر اساس مرحله
    const pipeline = {
      discovery: [],
      qualification: [],
      proposal: [],
      negotiation: [],
      closed_won: [],
      closed_lost: [],
    };

    opportunities.forEach(opp => {
      if (pipeline[opp.stage]) {
        pipeline[opp.stage].push(opp);
      }
    });

    // محاسبه مجموع ارزش هر مرحله
    const stageValues = {};
    Object.keys(pipeline).forEach(stage => {
      stageValues[stage] = pipeline[stage].reduce((sum, opp) => sum + (opp.amount || 0), 0);
    });

    return {
      pipeline,
      stageValues,
      totalOpportunities: opportunities.length,
      totalValue: opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0),
    };
  }

  // =============================================
  // حرکت فرصت به مرحله بعد
  // =============================================
  static async moveToNextStage(opportunityId, userId) {
    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) throw new Error('فرصت یافت نشد');

    const stages = ['discovery', 'qualification', 'proposal', 'negotiation', 'closed_won'];
    const currentIndex = stages.indexOf(opportunity.stage);
    
    if (currentIndex === -1 || currentIndex === stages.length - 1) {
      throw new Error('فرصت در آخرین مرحله است');
    }

    const nextStage = stages[currentIndex + 1];
    await opportunity.changeStage(nextStage, `انتقال خودکار به ${nextStage}`);
    
    await CacheService.delete(`crm:opportunity:${opportunityId}`);
    await CacheService.clearModule('crm:pipeline:');
    
    return opportunity;
  }

  // =============================================
  // حرکت فرصت به مرحله خاص
  // =============================================
  static async moveToStage(opportunityId, targetStage, userId, note = '') {
    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) throw new Error('فرصت یافت نشد');

    const validStages = ['discovery', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    if (!validStages.includes(targetStage)) {
      throw new Error('مرحله نامعتبر است');
    }

    await opportunity.changeStage(targetStage, note);
    
    await CacheService.delete(`crm:opportunity:${opportunityId}`);
    await CacheService.clearModule('crm:pipeline:');
    
    return opportunity;
  }

  // =============================================
  // دریافت آمار خط لوله
  // =============================================
  static async getPipelineStats(userId) {
    const cacheKey = `crm:pipeline:stats:${userId}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const stats = await Opportunity.aggregate([
      { $match: { owner: userId, isActive: true } },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
        },
      },
    ]);

    const result = {
      stages: {},
      totals: {
        count: 0,
        amount: 0,
      },
    };

    stats.forEach(item => {
      result.stages[item._id] = {
        count: item.count,
        amount: item.totalAmount,
        avgAmount: Math.round(item.avgAmount || 0),
      };
      result.totals.count += item.count;
      result.totals.amount += item.totalAmount || 0;
    });

    // محاسبه نرخ تبدیل
    const won = stats.find(s => s._id === 'closed_won');
    const lost = stats.find(s => s._id === 'closed_lost');
    const totalClosed = (won?.count || 0) + (lost?.count || 0);
    result.conversionRate = totalClosed > 0 ? Math.round((won?.count || 0) / totalClosed * 100) : 0;

    await CacheService.set(cacheKey, result, 300);
    return result;
  }
}

module.exports = PipelineService;
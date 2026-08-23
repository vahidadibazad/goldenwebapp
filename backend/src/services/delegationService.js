const User = require('../models/User');
const Letter = require('../models/Letter');
const Referral = require('../models/Referral');

class DelegationService {

  // =============================================
  // ۱. ایجاد تفویض اختیار
  // =============================================
  static async createDelegation(userId, data) {
    const { targetUserId, startDate, endDate, permissions = ['view'] } = data;

    const user = await User.findById(userId);
    if (!user) throw new Error('کاربر یافت نشد');

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) throw new Error('کاربر مقصد یافت نشد');

    // بررسی همپوشانی تفویض‌های قبلی
    const existing = user.substitutes.find(s => 
      s.user.toString() === targetUserId && 
      s.isActive &&
      ((s.startDate <= startDate && s.endDate >= startDate) ||
       (s.startDate <= endDate && s.endDate >= endDate))
    );

    if (existing) {
      throw new Error('این کاربر قبلاً برای این بازه زمانی تفویض شده است');
    }

    user.substitutes.push({
      user: targetUserId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: true,
      permissions,
      createdBy: userId,
    });

    await user.save();
    return user.substitutes[user.substitutes.length - 1];
  }

  // =============================================
  // ۲. دریافت تفویض‌های فعال یک کاربر
  // =============================================
  static async getActiveDelegations(userId) {
    const now = new Date();
    const user = await User.findById(userId)
      .populate('substitutes.user', 'fullName username email');

    if (!user) throw new Error('کاربر یافت نشد');

    return user.substitutes.filter(s => 
      s.isActive && 
      s.startDate <= now && 
      s.endDate >= now
    );
  }

  // =============================================
  // ۳. لغو تفویض اختیار
  // =============================================
  static async cancelDelegation(userId, delegationId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('کاربر یافت نشد');

    const delegation = user.substitutes.id(delegationId);
    if (!delegation) throw new Error('تفویض یافت نشد');

    delegation.isActive = false;
    await user.save();

    return delegation;
  }

  // =============================================
  // ۴. دریافت نامه‌های تفویض شده به یک کاربر
  // =============================================
  static async getDelegatedLetters(userId) {
    const now = new Date();
    
    // پیدا کردن کاربرانی که به این کاربر تفویض کرده‌اند
    const users = await User.find({
      'substitutes.user': userId,
      'substitutes.isActive': true,
      'substitutes.startDate': { $lte: now },
      'substitutes.endDate': { $gte: now },
    });

    const userIds = users.map(u => u._id);

    if (userIds.length === 0) return [];

    // دریافت نامه‌هایی که به این کاربران ارجاع شده
    const referrals = await Referral.find({
      to: { $in: userIds },
      status: 'pending',
    })
      .populate('letter', 'subject number letterType')
      .populate('from', 'fullName username');

    return referrals;
  }

  // =============================================
  // ۵. بررسی دسترسی تفویضی
  // =============================================
  static async checkDelegatedPermission(userId, permission) {
    const now = new Date();
    
    const user = await User.findOne({
      'substitutes.user': userId,
      'substitutes.isActive': true,
      'substitutes.startDate': { $lte: now },
      'substitutes.endDate': { $gte: now },
      'substitutes.permissions': { $in: [permission, 'all'] },
    });

    return !!user;
  }
}

module.exports = DelegationService;
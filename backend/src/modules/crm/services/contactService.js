// backend/src/modules/crm/services/contactService.js
const Contact = require('../models/Contact');
const Account = require('../models/Account');
const CacheService = require('../../../services/cacheService');

class ContactService {

  // =============================================
  // ایجاد مخاطب جدید
  // =============================================
  static async createContact(data, userId) {
    // بررسی وجود شرکت
    const account = await Account.findById(data.accountId);
    if (!account) {
      throw new Error('شرکت مورد نظر یافت نشد');
    }

    const contact = new Contact({
      ...data,
      account: data.accountId,
      createdBy: userId,
      owner: data.owner || userId,
    });
    await contact.save();
    await CacheService.clearModule('crm:contacts:');
    return contact;
  }

  // =============================================
  // دریافت لیست مخاطبین
  // =============================================
  static async getContacts(options = {}) {
    const { account, owner, search, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    const filter = { isActive: true };

    if (account) filter.account = account;
    if (owner) filter.owner = owner;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      Contact.find(filter)
        .sort({ firstName: 1, lastName: 1 })
        .skip(skip)
        .limit(limit)
        .populate('account', 'name tier')
        .populate('owner', 'fullName username')
        .lean(),
      Contact.countDocuments(filter),
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
  // دریافت یک مخاطب با ID
  // =============================================
  static async getContactById(id) {
    const cacheKey = `crm:contact:${id}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const contact = await Contact.findById(id)
      .populate('account', 'name tier industry')
      .populate('owner', 'fullName username')
      .populate('createdBy', 'fullName username')
      .lean();

    if (contact) {
      await CacheService.set(cacheKey, contact, 3600);
    }
    return contact;
  }

  // =============================================
  // ویرایش مخاطب
  // =============================================
  static async updateContact(id, data) {
    const contact = await Contact.findByIdAndUpdate(id, data, { new: true });
    if (!contact) throw new Error('مخاطب یافت نشد');
    await CacheService.delete(`crm:contact:${id}`);
    await CacheService.clearModule('crm:contacts:');
    return contact;
  }

  // =============================================
  // حذف مخاطب
  // =============================================
  static async deleteContact(id) {
    const contact = await Contact.findByIdAndDelete(id);
    if (!contact) throw new Error('مخاطب یافت نشد');
    await CacheService.delete(`crm:contact:${id}`);
    await CacheService.clearModule('crm:contacts:');
    return contact;
  }

  // =============================================
  // دریافت تاریخچه فعالیت‌های مخاطب
  // =============================================
  static async getContactActivities(contactId, limit = 20) {
    const contact = await Contact.findById(contactId);
    if (!contact) throw new Error('مخاطب یافت نشد');

    // در صورت وجود مدل Activity، از آن استفاده می‌کنیم
    // فعلاً یک آرایه خالی برمی‌گردانیم
    return {
      data: [],
      message: 'تاریخچه فعالیت‌ها در حال توسعه است',
    };
  }

  // =============================================
  // دریافت آمار مخاطبین
  // =============================================
  static async getContactStats() {
    const cacheKey = 'crm:contacts:stats';
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const [total, active, byAccount] = await Promise.all([
      Contact.countDocuments(),
      Contact.countDocuments({ isActive: true }),
      Contact.aggregate([
        {
          $group: {
            _id: '$account',
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'accounts',
            localField: '_id',
            foreignField: '_id',
            as: 'accountInfo',
          },
        },
        {
          $unwind: {
            path: '$accountInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            accountName: '$accountInfo.name',
            count: 1,
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const result = {
      total,
      active,
      inactive: total - active,
      byAccount,
    };

    await CacheService.set(cacheKey, result, 300);
    return result;
  }
}

module.exports = ContactService;
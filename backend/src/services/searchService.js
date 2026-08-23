// backend/src/services/searchService.js
const Letter = require('../models/Letter');
const Hardware = require('../models/hardware');
const Document = require('../models/Document');
const Credential = require('../models/Credential');
const User = require('../models/User');

/**
 * سرویس جستجوی پیشرفته
 * پشتیبانی از Full-Text Search و فیلترهای ترکیبی
 */
class SearchService {

  // =============================================
  // ۱. جستجوی جامع در همه ماژول‌ها
  // =============================================
  static async globalSearch(query, userId, options = {}) {
    const {
      modules = ['letters', 'hardware', 'documents', 'credentials', 'users'],
      limit = 20,
      page = 1,
    } = options;

    const results = {};

    // جستجو در نامه‌ها
    if (modules.includes('letters')) {
      results.letters = await this.searchLetters(query, userId, { limit, page });
    }

    // جستجو در اموال
    if (modules.includes('hardware')) {
      results.hardware = await this.searchHardware(query, userId, { limit, page });
    }

    // جستجو در اسناد
    if (modules.includes('documents')) {
      results.documents = await this.searchDocuments(query, userId, { limit, page });
    }

    // جستجو در رمزها
    if (modules.includes('credentials')) {
      results.credentials = await this.searchCredentials(query, userId, { limit, page });
    }

    // جستجو در کاربران (فقط ادمین)
    if (modules.includes('users')) {
      const isAdmin = userId.role?.name === 'admin';
      if (isAdmin) {
        results.users = await this.searchUsers(query, { limit, page });
      }
    }

    // جمع‌آوری آمار
    const totalResults = Object.values(results).reduce((sum, module) => {
      return sum + (module?.data?.length || 0);
    }, 0);

    return {
      query,
      totalResults,
      results,
    };
  }

  // =============================================
  // ۲. جستجوی پیشرفته در نامه‌ها
  // =============================================
  static async searchLetters(query, userId, options = {}) {
    const {
      letterType,
      status,
      priority,
      classification,
      fromDate,
      toDate,
      secretariat,
      sender,
      receiver,
      department,
      limit = 20,
      page = 1,
    } = options;

    const searchParams = {
      query,
      letterType,
      status,
      priority,
      classification,
      fromDate,
      toDate,
      secretariat,
      sender,
      receiver,
      department,
      limit,
      page,
    };

    // محدودیت دسترسی (کاربر فقط نامه‌های خود را ببیند)
    const isAdmin = userId.role?.name === 'admin';
    if (!isAdmin) {
      searchParams.$or = [
        { sender: userId._id },
        { receiver: userId._id },
        { registeredBy: userId._id },
        { 'referrals.to': userId._id },
      ];
    }

    return Letter.advancedSearch(searchParams);
  }

  // =============================================
  // ۳. جستجو در اموال
  // =============================================
  static async searchHardware(query, userId, options = {}) {
    const { limit = 20, page = 1 } = options;

    const filter = {};
    if (query) {
      filter.$text = { $search: query };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const data = await Hardware.find(filter)
      .populate('category', 'name')
      .populate('assignedTo', 'fullName username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Hardware.countDocuments(filter);

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // =============================================
  // ۴. جستجو در اسناد
  // =============================================
  static async searchDocuments(query, userId, options = {}) {
    const { limit = 20, page = 1 } = options;

    const filter = {};
    if (query) {
      filter.$text = { $search: query };
    }

    // محدودیت دسترسی
    const isAdmin = userId.role?.name === 'admin';
    if (!isAdmin) {
      filter.$or = [
        { uploadedBy: userId._id },
        { accessLevel: 'public' },
        { department: userId.department || 'All' },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const data = await Document.find(filter)
      .populate('uploadedBy', 'fullName username')
      .populate('department', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Document.countDocuments(filter);

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // =============================================
  // ۵. جستجو در رمزها
  // =============================================
  static async searchCredentials(query, userId, options = {}) {
    const { limit = 20, page = 1 } = options;

    const filter = {};
    if (query) {
      filter.$text = { $search: query };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const data = await Credential.find(filter)
      .populate('hardware', 'name serialNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Credential.countDocuments(filter);

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // =============================================
  // ۶. جستجو در کاربران
  // =============================================
  static async searchUsers(query, options = {}) {
    const { limit = 20, page = 1 } = options;

    const filter = {};
    if (query) {
      filter.$text = { $search: query };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const data = await User.find(filter)
      .select('-password')
      .populate('role', 'name label')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // =============================================
  // ۷. پیشنهادات جستجو (Autocomplete)
  // =============================================
  static async getSuggestions(query, userId, options = {}) {
    const { limit = 10 } = options;

    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim();

    // جستجو در نامه‌ها (فقط شماره و موضوع)
    const letterSuggestions = await Letter.find({
      $text: { $search: searchTerm },
    })
    .select('number subject')
    .limit(Math.ceil(limit / 2))
    .lean();

    // جستجو در اموال (فقط نام)
    const hardwareSuggestions = await Hardware.find({
      $text: { $search: searchTerm },
    })
    .select('name serialNumber')
    .limit(Math.ceil(limit / 2))
    .lean();

    // ترکیب نتایج
    const suggestions = [
      ...letterSuggestions.map(item => ({
        label: item.subject || item.number,
        value: item.subject || item.number,
        type: 'letter',
        id: item._id,
      })),
      ...hardwareSuggestions.map(item => ({
        label: item.name,
        value: item.name,
        type: 'hardware',
        id: item._id,
      })),
    ];

    return suggestions.slice(0, limit);
  }
}

module.exports = SearchService;
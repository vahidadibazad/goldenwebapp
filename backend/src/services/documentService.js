// backend/src/services/documentService.js
const Document = require('../models/Document');
const CacheService = require('./cacheService');

class DocumentService {

  // =============================================
  // ✅ دریافت لیست اسناد با بهینه‌سازی
  // =============================================
  static async getDocuments(filter = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const cacheKey = `documents:list:${JSON.stringify({ filter, page, limit })}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const [data, total] = await Promise.all([
      Document.find(filter)
        .select('title description fileType category tags accessLevel department uploadedBy createdAt')
        .populate('uploadedBy', 'username fullName')
        .populate('department', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Document.countDocuments(filter)
    ]);

    const result = {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    await CacheService.set(cacheKey, result, 300);

    return result;
  }

  // =============================================
  // ✅ دریافت یک سند با ID
  // =============================================
  static async getDocumentById(id) {
    const cacheKey = `document:${id}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const document = await Document.findById(id)
      .select('-__v')
      .populate('uploadedBy', 'username fullName email')
      .populate('department', 'name code')
      .lean();

    if (document) {
      await CacheService.set(cacheKey, document, 3600);
    }

    return document;
  }

  // =============================================
  // ✅ دریافت آمار اسناد با Aggregation
  // =============================================
  static async getDocumentStats() {
    const cacheKey = 'documents:stats';
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const [total, archived, byType, byFileType] = await Promise.all([
      Document.countDocuments(),
      Document.countDocuments({ isArchived: true }),
      Document.aggregate([
        {
          $group: {
            _id: '$documentType',
            count: { $sum: 1 }
          }
        }
      ]),
      Document.aggregate([
        {
          $group: {
            _id: '$fileType',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const result = {
      total,
      archived,
      active: total - archived,
      byType,
      byFileType,
    };

    await CacheService.set(cacheKey, result, 600);

    return result;
  }

  // =============================================
  // ✅ جستجوی اسناد
  // =============================================
  static async searchDocuments(query, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const filter = {
      $text: {
        $search: query,
        $caseSensitive: false,
        $diacriticSensitive: false
      }
    };

    const [data, total] = await Promise.all([
      Document.find(filter)
        .select('title description fileType category tags accessLevel uploadedBy createdAt')
        .populate('uploadedBy', 'username fullName')
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .lean(),
      Document.countDocuments(filter)
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = DocumentService;
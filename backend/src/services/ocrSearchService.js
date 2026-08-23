const OCRService = require('./ocrService');
const ElasticsearchService = require('./elasticsearchService');
const Document = require('../models/Document');
const CacheService = require('./cacheService');

class OCRSearchService {

  // =============================================
  // ۱. پردازش و ایندکس‌سازی یک سند
  // =============================================
  static async processAndIndexDocument(documentId) {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('سند یافت نشد');
      }

      // بررسی اینکه قبلاً OCR نشده باشد
      if (document.ocrText && document.ocrProcessed) {
        console.log(`ℹ️ سند ${document.title} قبلاً OCR شده است`);
        return document;
      }

      // پردازش OCR
      const result = await OCRService.processDocument(document.filePath, document.title);

      if (!result.success) {
        throw new Error(result.error);
      }

      // به‌روزرسانی سند
      document.ocrText = result.text;
      document.ocrKeywords = result.keywords;
      document.ocrStats = result.stats;
      document.ocrLanguage = result.language;
      document.ocrConfidence = result.confidence;
      document.ocrProcessed = true;
      document.ocrProcessedAt = new Date();

      await document.save();

      // ایندکس‌سازی در Elasticsearch (اگر فعال باشد)
      try {
        await ElasticsearchService.indexDocument('documents', document._id, {
          id: document._id,
          title: document.title,
          description: document.description,
          fileType: document.fileType,
          category: document.category,
          tags: document.tags,
          accessLevel: document.accessLevel,
          department: document.department,
          uploadedBy: document.uploadedBy,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
          ocrText: result.text,
          ocrKeywords: result.keywords.map(k => k.word),
          suggest: document.title,
        });
      } catch (esError) {
        console.warn('⚠️ خطا در ایندکس‌سازی Elasticsearch:', esError.message);
      }

      // پاک کردن کش
      await CacheService.delete(`document:${documentId}`);
      await CacheService.clearModule('document:list');

      return document;

    } catch (error) {
      console.error('❌ خطا در پردازش OCR:', error);
      throw error;
    }
  }

  // =============================================
  // ۲. جستجوی OCR در اسناد
  // =============================================
  static async searchOCR(query, filters = {}, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;

      // جستجو در Elasticsearch با OCR Text
      let result;
      try {
        result = await ElasticsearchService.search('documents', query, {
          filters,
          from: (page - 1) * limit,
          size: limit,
          highlight: true,
          fields: ['title^3', 'ocrText^2', 'description', 'tags'],
        });
      } catch (esError) {
        console.warn('⚠️ خطا در جستجوی Elasticsearch، استفاده از جستجوی MongoDB:', esError.message);
        // Fallback به جستجوی MongoDB
        const mongoResult = await Document.find({
          ocrText: { $regex: query, $options: 'i' },
          ...filters,
        })
          .populate('uploadedBy', 'fullName username')
          .limit(limit)
          .skip((page - 1) * limit);

        return {
          hits: mongoResult.map(doc => ({
            id: doc._id,
            source: doc,
            score: 1,
          })),
          total: await Document.countDocuments({
            ocrText: { $regex: query, $options: 'i' },
            ...filters,
          }),
          took: 0,
        };
      }

      // اضافه کردن اطلاعات OCR به نتایج
      const enrichedHits = await Promise.all(result.hits.map(async (hit) => {
        const doc = await Document.findById(hit.id).select('ocrText ocrKeywords ocrStats ocrConfidence');
        return {
          ...hit,
          ocr: {
            text: doc?.ocrText?.substring(0, 500),
            keywords: doc?.ocrKeywords,
            confidence: doc?.ocrConfidence,
          },
        };
      }));

      return {
        ...result,
        hits: enrichedHits,
      };

    } catch (error) {
      console.error('❌ خطا در جستجوی OCR:', error);
      throw error;
    }
  }

  // =============================================
  // ۳. جستجوی درون متنی (با هایلایت)
  // =============================================
  static async searchInText(query, documentId) {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('سند یافت نشد');
      }

      if (!document.ocrText) {
        return {
          success: true,
          results: [],
          message: 'این سند OCR نشده است',
        };
      }

      // جستجوی عبارت در متن OCR
      const lines = document.ocrText.split('\n');
      const results = [];

      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            line: index + 1,
            text: line,
            highlighted: line.replace(
              new RegExp(query, 'gi'),
              (match) => `<mark>${match}</mark>`
            ),
          });
        }
      });

      return {
        success: true,
        results,
        total: results.length,
      };

    } catch (error) {
      console.error('❌ خطا در جستجوی درون متنی:', error);
      throw error;
    }
  }

  // =============================================
  // ۴. پردازش دسته‌ای اسناد
  // =============================================
  static async batchProcessDocuments(documentIds) {
    const results = [];
    for (const id of documentIds) {
      try {
        const result = await this.processAndIndexDocument(id);
        results.push({ id, success: true, result });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }
    return results;
  }

  // =============================================
  // ۵. پردازش همه اسناد بدون OCR
  // =============================================
  static async processAllUnprocessedDocuments() {
    const documents = await Document.find({
      $or: [
        { ocrProcessed: { $ne: true } },
        { ocrProcessed: { $exists: false } },
      ],
    });

    console.log(`📝 پردازش ${documents.length} سند بدون OCR...`);

    const results = [];
    for (const doc of documents) {
      try {
        const result = await this.processAndIndexDocument(doc._id);
        results.push({ id: doc._id, success: true });
        console.log(`✅ سند ${doc.title} پردازش شد`);
      } catch (error) {
        results.push({ id: doc._id, success: false, error: error.message });
        console.error(`❌ خطا در پردازش سند ${doc.title}:`, error.message);
      }
    }

    return results;
  }

  // =============================================
  // ۶. دریافت آمار OCR
  // =============================================
  static async getOCRStats() {
    const total = await Document.countDocuments();
    const processed = await Document.countDocuments({ ocrProcessed: true });
    const pending = total - processed;

    const languageStats = await Document.aggregate([
      { $match: { ocrProcessed: true } },
      {
        $group: {
          _id: '$ocrLanguage',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$ocrConfidence' },
        },
      },
    ]);

    return {
      total,
      processed,
      pending,
      languageStats,
      averageConfidence: languageStats.length > 0
        ? languageStats.reduce((sum, s) => sum + s.avgConfidence, 0) / languageStats.length
        : 0,
    };
  }

  // =============================================
  // ۷. حذف داده‌های OCR یک سند
  // =============================================
  static async clearOCR(documentId) {
    const document = await Document.findById(documentId);
    if (!document) {
      throw new Error('سند یافت نشد');
    }

    document.ocrText = undefined;
    document.ocrKeywords = undefined;
    document.ocrStats = undefined;
    document.ocrLanguage = undefined;
    document.ocrConfidence = undefined;
    document.ocrProcessed = false;
    document.ocrProcessedAt = undefined;

    await document.save();

    // به‌روزرسانی Elasticsearch
    try {
      await ElasticsearchService.updateDocument('documents', document._id, {
        ocrText: '',
        ocrKeywords: [],
      });
    } catch (esError) {
      console.warn('⚠️ خطا در به‌روزرسانی Elasticsearch:', esError.message);
    }

    return document;
  }
}

module.exports = OCRSearchService;
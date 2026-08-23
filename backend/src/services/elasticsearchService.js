const { esClient } = require('../config/elasticsearch');
const logger = require('../utils/logger');

/**
 * سرویس جستجوی پیشرفته با Elasticsearch
 * پشتیبانی از: جستجوی Full-Text، Autocomplete، فیلترها، امتیازدهی
 */
class ElasticsearchService {

  // =============================================
  // ۱. ایندکس کردن یک سند
  // =============================================
  static async indexDocument(index, id, document) {
    try {
      const result = await esClient.index({
        index,
        id: id.toString(),
        document: {
          ...document,
          indexedAt: new Date().toISOString(),
        },
      });
      
      logger.debug(`✅ سند ${id} در ایندکس ${index} ایندکس شد`);
      return result;
    } catch (error) {
      logger.error(`❌ خطا در ایندکس کردن سند ${id}:`, error.message);
      throw error;
    }
  }

  // =============================================
  // ۲. ایندکس کردن چند سند (Bulk)
  // =============================================
  static async bulkIndex(index, documents) {
    try {
      const body = documents.flatMap(doc => [
        { index: { _index: index, _id: doc.id.toString() } },
        doc,
      ]);

      const result = await esClient.bulk({ body });
      
      logger.debug(`✅ ${documents.length} سند در ایندکس ${index} ایندکس شد`);
      return result;
    } catch (error) {
      logger.error(`❌ خطا در ایندکس کردن دسته‌ای:`, error.message);
      throw error;
    }
  }

  // =============================================
  // ۳. جستجوی اصلی
  // =============================================
  static async search(index, query, options = {}) {
    try {
      const {
        fields = ['*'],
        filters = {},
        sort = [],
        from = 0,
        size = 20,
        highlight = true,
        fuzzy = true,
      } = options;

      // ساخت کوئری جستجو
      const searchBody = {
        query: this.buildQuery(query, filters, fuzzy),
        from,
        size,
        ...(sort.length > 0 && { sort }),
      };

      // هایلایت کردن نتایج
      if (highlight) {
        searchBody.highlight = {
          fields: {
            '*': {
              fragment_size: 150,
              number_of_fragments: 3,
              pre_tags: ['<mark>'],
              post_tags: ['</mark>'],
            },
          },
        };
      }

      // اجرای جستجو
      const result = await esClient.search({
        index,
        body: searchBody,
      });

      // پردازش نتایج
      const hits = result.hits.hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        source: hit._source,
        highlight: hit.highlight || {},
      }));

      return {
        total: result.hits.total.value,
        hits,
        took: result.took,
        aggregations: result.aggregations || {},
      };

    } catch (error) {
      logger.error(`❌ خطا در جستجو:`, error.message);
      throw error;
    }
  }

  // =============================================
  // ۴. ساخت کوئری جستجو
  // =============================================
  static buildQuery(query, filters = {}, fuzzy = true) {
    const must = [];
    const filter = [];
    const should = [];

    // =============================================
    // جستجوی اصلی با Full-Text
    // =============================================
    if (query && query.trim().length > 0) {
      const searchFields = ['title^3', 'subject^3', 'content^2', 'description^2', 'tags^2', 'name^3', 'fullName^2'];
      
      must.push({
        multi_match: {
          query: query.trim(),
          fields: searchFields,
          type: 'best_fields',
          fuzziness: fuzzy ? 'AUTO' : 0,
          operator: 'or',
          minimum_should_match: '50%',
        },
      });

      // جستجوی پیشنهادی (برای تکمیل خودکار)
      should.push({
        match_phrase_prefix: {
          'title': {
            query: query.trim(),
            boost: 2,
          },
        },
      });
    }

    // =============================================
    // فیلترها
    // =============================================
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          filter.push({ terms: { [key]: value } });
        } else if (typeof value === 'boolean' || typeof value === 'number') {
          filter.push({ term: { [key]: value } });
        } else if (key === 'dateRange' && value.from && value.to) {
          filter.push({
            range: {
              [value.field || 'createdAt']: {
                gte: value.from,
                lte: value.to,
              },
            },
          });
        } else {
          filter.push({ term: { [key]: value } });
        }
      }
    }

    return {
      bool: {
        must,
        should,
        filter,
        minimum_should_match: 1,
      },
    };
  }

  // =============================================
  // ۵. جستجوی پیشنهادی (Autocomplete)
  // =============================================
  static async autocomplete(index, query, options = {}) {
    try {
      const {
        field = 'title',
        size = 10,
        filters = {},
      } = options;

      const response = await esClient.search({
        index,
        body: {
          query: {
            bool: {
              must: [
                {
                  match_phrase_prefix: {
                    [field]: {
                      query: query.trim(),
                      boost: 5,
                    },
                  },
                },
              ],
              filter: Object.entries(filters)
                .filter(([_, v]) => v !== undefined && v !== null && v !== '')
                .map(([key, value]) => ({ term: { [key]: value } })),
            },
          },
          size,
          sort: [{ _score: 'desc' }],
        },
      });

      return response.hits.hits.map(hit => ({
        id: hit._id,
        value: hit._source[field],
        label: hit._source[field],
        source: hit._source,
        score: hit._score,
      }));

    } catch (error) {
      logger.error(`❌ خطا در جستجوی پیشنهادی:`, error.message);
      return [];
    }
  }

  // =============================================
  // ۶. دریافت پیشنهادات جستجو
  // =============================================
  static async getSuggestions(index, query, options = {}) {
    try {
      const { size = 5, filters = {} } = options;

      const response = await esClient.search({
        index,
        body: {
          suggest: {
            suggestions: {
              prefix: query.trim(),
              completion: {
                field: 'suggest',
                size,
                fuzzy: {
                  fuzziness: 'AUTO',
                },
              },
            },
          },
          query: {
            bool: {
              filter: Object.entries(filters)
                .filter(([_, v]) => v !== undefined && v !== null && v !== '')
                .map(([key, value]) => ({ term: { [key]: value } })),
            },
          },
        },
      });

      const suggestions = response.suggest?.suggestions?.[0]?.options || [];
      return suggestions.map(s => ({
        text: s.text,
        score: s.score,
        source: s._source,
      }));

    } catch (error) {
      logger.error(`❌ خطا در دریافت پیشنهادات:`, error.message);
      return [];
    }
  }

  // =============================================
  // ۷. حذف سند از ایندکس
  // =============================================
  static async deleteDocument(index, id) {
    try {
      const result = await esClient.delete({
        index,
        id: id.toString(),
      });
      
      logger.debug(`🗑️ سند ${id} از ایندکس ${index} حذف شد`);
      return result;
    } catch (error) {
      if (error.meta?.statusCode === 404) {
        logger.warn(`⚠️ سند ${id} در ایندکس ${index} وجود ندارد`);
        return null;
      }
      logger.error(`❌ خطا در حذف سند ${id}:`, error.message);
      throw error;
    }
  }

  // =============================================
  // ۸. به‌روزرسانی سند
  // =============================================
  static async updateDocument(index, id, document) {
    try {
      const result = await esClient.update({
        index,
        id: id.toString(),
        doc: {
          ...document,
          updatedAt: new Date().toISOString(),
        },
      });
      
      logger.debug(`✅ سند ${id} در ایندکس ${index} به‌روزرسانی شد`);
      return result;
    } catch (error) {
      logger.error(`❌ خطا در به‌روزرسانی سند ${id}:`, error.message);
      throw error;
    }
  }

  // =============================================
  // ۹. دریافت آمار ایندکس
  // =============================================
  static async getIndexStats(index) {
    try {
      const stats = await esClient.indices.stats({ index });
      const count = await esClient.count({ index });
      
      return {
        total: count.count,
        size: stats.indices[index]?.total?.store?.size_in_bytes || 0,
        docs: stats.indices[index]?.total?.docs?.count || 0,
      };
    } catch (error) {
      logger.error(`❌ خطا در دریافت آمار ایندکس:`, error.message);
      return { total: 0, size: 0, docs: 0 };
    }
  }

  // =============================================
  // ۱۰. حذف همه اسناد یک ایندکس
  // =============================================
  static async deleteAllDocuments(index) {
    try {
      const result = await esClient.deleteByQuery({
        index,
        body: { query: { match_all: {} } },
      });
      
      logger.debug(`🗑️ ${result.deleted} سند از ایندکس ${index} حذف شد`);
      return result;
    } catch (error) {
      logger.error(`❌ خطا در حذف اسناد ایندکس ${index}:`, error.message);
      throw error;
    }
  }
}

module.exports = ElasticsearchService;
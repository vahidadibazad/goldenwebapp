/**
 * بهینه‌سازی کوئری‌های MongoDB
 * استفاده از lean() و select() برای کاهش مصرف حافظه
 */
class QueryOptimizer {

  // =============================================
  // ۱. بهینه‌سازی کوئری لیست
  // =============================================
  static async optimizeListQuery(Model, filter = {}, options = {}) {
    const {
      select = '-__v',
      populate = [],
      sort = { createdAt: -1 },
      limit = 20,
      page = 1,
      lean = true,
    } = options;

    const skip = (page - 1) * limit;

    let query = Model.find(filter)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // populateها
    for (const pop of populate) {
      if (typeof pop === 'string') {
        query = query.populate(pop);
      } else {
        query = query.populate(pop);
      }
    }

    // استفاده از lean برای بهبود عملکرد
    if (lean) {
      query = query.lean();
    }

    const [data, total] = await Promise.all([
      query.exec(),
      Model.countDocuments(filter),
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
  // ۲. بهینه‌سازی کوئری یک آیتم
  // =============================================
  static async optimizeGetById(Model, id, options = {}) {
    const {
      select = '-__v',
      populate = [],
      lean = true,
    } = options;

    let query = Model.findById(id).select(select);

    for (const pop of populate) {
      if (typeof pop === 'string') {
        query = query.populate(pop);
      } else {
        query = query.populate(pop);
      }
    }

    if (lean) {
      query = query.lean();
    }

    return query.exec();
  }

  // =============================================
  // ۳. بهینه‌سازی کوئری با Aggregation
  // =============================================
  static async optimizeAggregation(Model, pipeline, options = {}) {
    const {
      allowDiskUse = true,
      hint = {},
    } = options;

    const aggregation = Model.aggregate(pipeline);

    if (allowDiskUse) {
      aggregation.allowDiskUse(true);
    }

    if (Object.keys(hint).length > 0) {
      aggregation.hint(hint);
    }

    return aggregation.exec();
  }

  // =============================================
  // ۴. بهینه‌سازی کوئری جستجو
  // =============================================
  static async optimizeSearch(Model, searchFields, query, options = {}) {
    const {
      limit = 20,
      page = 1,
      select = '-__v',
      populate = [],
      sort = { score: { $meta: 'textScore' } },
    } = options;

    const skip = (page - 1) * limit;

    const filter = {
      $text: {
        $search: query,
        $caseSensitive: false,
        $diacriticSensitive: false,
      },
    };

    let findQuery = Model.find(filter)
      .select({
        ...select,
        score: { $meta: 'textScore' },
      })
      .sort(sort)
      .skip(skip)
      .limit(limit);

    for (const pop of populate) {
      findQuery = findQuery.populate(pop);
    }

    const [data, total] = await Promise.all([
      findQuery.lean().exec(),
      Model.countDocuments(filter),
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
}

module.exports = QueryOptimizer;
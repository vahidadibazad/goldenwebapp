// backend/src/services/paginationService.js

/**
 * سرویس صفحه‌بندی با Cursor-based (برای داده‌های بزرگ)
 * به‌جای offset/limit که در داده‌های بزرگ کند می‌شود
 */
class PaginationService {

  // =============================================
  // ۱. صفحه‌بندی با Cursor (بر اساس _id)
  // =============================================
  static async paginateWithCursor(Model, filter = {}, options = {}) {
    const {
      limit = 20,
      cursor = null,        // آخرین _id از صفحه قبلی
      sort = { _id: -1 },   // مرتب‌سازی بر اساس _id
      select = '',
      populate = [],
      lean = true,
    } = options;

    // ساخت فیلتر با cursor
    const queryFilter = { ...filter };
    if (cursor) {
      queryFilter._id = { $lt: cursor };
    }

    // اجرای کوئری
    let query = Model.find(queryFilter)
      .sort(sort)
      .limit(limit + 1);  // +1 برای تشخیص وجود صفحه بعدی

    if (select) query = query.select(select);
    if (lean) query = query.lean();

    for (const pop of populate) {
      query = query.populate(pop);
    }

    const results = await query.exec();

    // تشخیص وجود صفحه بعدی
    const hasNextPage = results.length > limit;
    const data = hasNextPage ? results.slice(0, limit) : results;
    const nextCursor = data.length > 0 ? data[data.length - 1]._id : null;

    return {
      data,
      pagination: {
        limit,
        hasNextPage,
        nextCursor,
        total: data.length,
      }
    };
  }

  // =============================================
  // ۲. صفحه‌بندی با Cursor بر اساس createdAt
  // =============================================
  static async paginateWithDate(Model, filter = {}, options = {}) {
    const {
      limit = 20,
      cursor = null,        // تاریخ آخرین آیتم از صفحه قبلی
      sort = { createdAt: -1 },
      select = '',
      populate = [],
      lean = true,
    } = options;

    const queryFilter = { ...filter };
    if (cursor) {
      queryFilter.createdAt = { $lt: new Date(cursor) };
    }

    let query = Model.find(queryFilter)
      .sort(sort)
      .limit(limit + 1);

    if (select) query = query.select(select);
    if (lean) query = query.lean();

    for (const pop of populate) {
      query = query.populate(pop);
    }

    const results = await query.exec();

    const hasNextPage = results.length > limit;
    const data = hasNextPage ? results.slice(0, limit) : results;
    const nextCursor = data.length > 0 ? data[data.length - 1].createdAt : null;

    return {
      data,
      pagination: {
        limit,
        hasNextPage,
        nextCursor,
        total: data.length,
      }
    };
  }

  // =============================================
  // ۳. دریافت اطلاعات برای صفحه‌بندی در فرانت‌اند
  // =============================================
  static getPaginationInfo(data, hasNextPage, nextCursor) {
    return {
      items: data,
      hasMore: hasNextPage,
      nextCursor: nextCursor,
    };
  }
}

module.exports = PaginationService;
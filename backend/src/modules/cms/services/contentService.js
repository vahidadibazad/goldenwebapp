// backend/src/modules/cms/services/contentService.js
const Entry = require('../../../models/Entry');
const ContentType = require('../models/ContentType');
const Category = require('../../../models/Category');
const CacheService = require('../../../services/cacheService');
const mongoose = require('mongoose');

class ContentService {

  // =============================================
  // مدیریت انواع محتوا
  // =============================================

  static async createContentType(data, userId) {
    const contentType = new ContentType({
      ...data,
      createdBy: userId,
    });
    await contentType.save();
    await CacheService.clearModule('cms:content_types:');
    return contentType;
  }

  static async getContentTypes(active = true) {
    const cacheKey = `cms:content_types:${active}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const types = await ContentType.find({ isActive: active })
      .sort({ name: 1 })
      .lean();

    await CacheService.set(cacheKey, types, 3600);
    return types;
  }

  static async getContentTypeByApiName(apiName) {
    const cacheKey = `cms:content_type:${apiName}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const type = await ContentType.findOne({ apiName, isActive: true }).lean();
    if (type) {
      await CacheService.set(cacheKey, type, 3600);
    }
    return type;
  }

  static async getContentTypeById(id) {
    const cacheKey = `cms:content_type:id:${id}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const type = await ContentType.findById(id).lean();
    if (type) {
      await CacheService.set(cacheKey, type, 3600);
    }
    return type;
  }

  static async updateContentType(id, data) {
    const type = await ContentType.findByIdAndUpdate(id, data, { new: true });
    if (!type) throw new Error('نوع محتوا یافت نشد');
    await CacheService.delete(`cms:content_type:${type.apiName}`);
    await CacheService.delete(`cms:content_type:id:${id}`);
    await CacheService.clearModule('cms:content_types:');
    return type;
  }

  static async deleteContentType(id) {
    const type = await ContentType.findByIdAndDelete(id);
    if (!type) throw new Error('نوع محتوا یافت نشد');
    
    // حذف همه ورودی‌های این نوع محتوا
    await Entry.deleteMany({ contentType: id });
    
    await CacheService.delete(`cms:content_type:${type.apiName}`);
    await CacheService.delete(`cms:content_type:id:${id}`);
    await CacheService.clearModule('cms:content_types:');
    await CacheService.clearModule('cms:entries:');
    return type;
  }

  // =============================================
  // مدیریت ورودی‌ها (Entries)
  // =============================================

  static async createEntry(data, userId) {
    const { contentType, ...entryData } = data;
    
    // بررسی وجود نوع محتوا
    const contentTypeDoc = await ContentType.findById(contentType);
    if (!contentTypeDoc) {
      throw new Error('نوع محتوا یافت نشد');
    }

    const entry = new Entry({
      ...entryData,
      contentType,
      createdBy: userId,
      updatedBy: userId,
    });

    await entry.save();
    await CacheService.clearModule('cms:entries:');
    return entry;
  }

  static async getEntries(contentTypeId, options = {}) {
    const { locale = 'fa', status = 'published', page = 1, limit = 20, search = '' } = options;
    
    const cacheKey = `cms:entries:${contentTypeId}:${locale}:${status}:${page}:${limit}:${search}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const skip = (page - 1) * limit;
    const filter = { contentType: contentTypeId, locale };
    if (status !== 'all') filter.status = status;
    
    if (search) {
      filter.$text = { $search: search };
    }

    let query = Entry.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'fullName username')
      .populate('updatedBy', 'fullName username')
      .populate('publishedBy', 'fullName username')
      .populate('contentType', 'name apiName')
      .populate('categories', 'name slug')
      .populate('tags', 'name slug');

    if (search) {
      query = query.sort({ score: { $meta: 'textScore' } });
    }

    const [data, total] = await Promise.all([
      query.lean(),
      Entry.countDocuments(filter),
    ]);

    const result = {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    await CacheService.set(cacheKey, result, 120);
    return result;
  }

  static async getEntryById(id) {
    const cacheKey = `cms:entry:${id}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const entry = await Entry.findById(id)
      .populate('contentType', 'name apiName fields')
      .populate('createdBy', 'fullName username')
      .populate('updatedBy', 'fullName username')
      .populate('publishedBy', 'fullName username')
      .populate('categories', 'name slug')
      .populate('tags', 'name slug')
      .lean();

    if (entry) {
      await CacheService.set(cacheKey, entry, 3600);
    }
    return entry;
  }

  static async getEntryBySlug(slug, locale = 'fa') {
    const cacheKey = `cms:entry:slug:${slug}:${locale}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const entry = await Entry.findOne({ slug, locale })
      .populate('contentType', 'name apiName fields')
      .populate('createdBy', 'fullName username')
      .populate('updatedBy', 'fullName username')
      .populate('publishedBy', 'fullName username')
      .populate('categories', 'name slug')
      .populate('tags', 'name slug')
      .lean();

    if (entry) {
      await CacheService.set(cacheKey, entry, 3600);
    }
    return entry;
  }

  static async updateEntry(id, data, userId) {
    const entry = await Entry.findById(id);
    if (!entry) throw new Error('ورودی یافت نشد');

    // بررسی اینکه آیا وضعیت تغییر کرده
    const oldStatus = entry.status;
    
    Object.assign(entry, data);
    entry.updatedBy = userId;
    
    // اگر وضعیت به published تغییر کرده، زمان انتشار را ثبت کن
    if (data.status === 'published' && oldStatus !== 'published') {
      entry.publishedAt = new Date();
      entry.publishedBy = userId;
    }
    
    await entry.save();

    await CacheService.delete(`cms:entry:${id}`);
    await CacheService.delete(`cms:entry:slug:${entry.slug}:${entry.locale}`);
    await CacheService.clearModule('cms:entries:');
    return entry;
  }

  static async publishEntry(id, userId) {
    const entry = await Entry.findById(id);
    if (!entry) throw new Error('ورودی یافت نشد');
    await entry.publish(userId);
    await CacheService.delete(`cms:entry:${id}`);
    await CacheService.delete(`cms:entry:slug:${entry.slug}:${entry.locale}`);
    await CacheService.clearModule('cms:entries:');
    return entry;
  }

  static async archiveEntry(id) {
    const entry = await Entry.findById(id);
    if (!entry) throw new Error('ورودی یافت نشد');
    await entry.archive();
    await CacheService.delete(`cms:entry:${id}`);
    await CacheService.delete(`cms:entry:slug:${entry.slug}:${entry.locale}`);
    await CacheService.clearModule('cms:entries:');
    return entry;
  }

  static async deleteEntry(id) {
    const entry = await Entry.findByIdAndDelete(id);
    if (!entry) throw new Error('ورودی یافت نشد');
    await CacheService.delete(`cms:entry:${id}`);
    await CacheService.delete(`cms:entry:slug:${entry.slug}:${entry.locale}`);
    await CacheService.clearModule('cms:entries:');
    return entry;
  }

  // =============================================
  // جستجوی محتوا
  // =============================================

  static async searchEntries(query, options = {}) {
    const { contentType, status = 'published', page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const filter = {
      status,
      $text: { $search: query },
    };

    if (contentType) {
      filter.contentType = contentType;
    }

    const [data, total] = await Promise.all([
      Entry.find(filter)
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .populate('contentType', 'name apiName')
        .populate('createdBy', 'fullName username')
        .populate('categories', 'name slug')
        .populate('tags', 'name slug')
        .lean(),
      Entry.countDocuments(filter),
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
  // دریافت ورودی‌های مرتبط
  // =============================================

  static async getRelatedEntries(entryId, contentTypeId, limit = 5) {
    const cacheKey = `cms:entries:related:${entryId}:${contentTypeId}:${limit}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const entries = await Entry.find({
      _id: { $ne: entryId },
      contentType: contentTypeId,
      status: 'published',
    })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .populate('createdBy', 'fullName username')
      .populate('categories', 'name slug')
      .populate('tags', 'name slug')
      .lean();

    await CacheService.set(cacheKey, entries, 3600);
    return entries;
  }

  // =============================================
  // دریافت آمار محتوا
  // =============================================

  static async getContentStats() {
    const cacheKey = 'cms:content:stats';
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const [total, published, draft, archived, byType] = await Promise.all([
      Entry.countDocuments(),
      Entry.countDocuments({ status: 'published' }),
      Entry.countDocuments({ status: 'draft' }),
      Entry.countDocuments({ status: 'archived' }),
      Entry.aggregate([
        {
          $group: {
            _id: '$contentType',
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'contenttypes',
            localField: '_id',
            foreignField: '_id',
            as: 'typeInfo',
          },
        },
        {
          $unwind: {
            path: '$typeInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            contentType: '$typeInfo.name',
            count: 1,
          },
        },
      ]),
    ]);

    const result = {
      total,
      published,
      draft,
      archived,
      byType,
    };

    await CacheService.set(cacheKey, result, 300);
    return result;
  }

  // =============================================
  // مدیریت دسته‌بندی‌ها
  // =============================================

  static async createCategory(data, userId) {
    const category = new Category({ ...data, createdBy: userId });
    await category.save();
    await CacheService.clearModule('cms:categories:');
    return category;
  }

  static async getCategories() {
    const cacheKey = 'cms:categories:tree';
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const tree = await Category.getTree();
    await CacheService.set(cacheKey, tree, 3600);
    return tree;
  }

  static async getCategoryById(id) {
    const cacheKey = `cms:category:${id}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const category = await Category.findById(id).lean();
    if (category) {
      await CacheService.set(cacheKey, category, 3600);
    }
    return category;
  }

  static async getCategoryBySlug(slug) {
    const cacheKey = `cms:category:slug:${slug}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const category = await Category.findOne({ slug }).lean();
    if (category) {
      await CacheService.set(cacheKey, category, 3600);
    }
    return category;
  }

  static async updateCategory(id, data) {
    const category = await Category.findByIdAndUpdate(id, data, { new: true });
    if (!category) throw new Error('دسته‌بندی یافت نشد');
    await CacheService.delete(`cms:category:${id}`);
    await CacheService.delete(`cms:category:slug:${category.slug}`);
    await CacheService.clearModule('cms:categories:');
    return category;
  }

  static async deleteCategory(id) {
    const category = await Category.findByIdAndDelete(id);
    if (!category) throw new Error('دسته‌بندی یافت نشد');
    
    // حذف دسته‌بندی از تمام ورودی‌ها
    await Entry.updateMany(
      { categories: id },
      { $pull: { categories: id } }
    );
    
    await CacheService.delete(`cms:category:${id}`);
    await CacheService.delete(`cms:category:slug:${category.slug}`);
    await CacheService.clearModule('cms:categories:');
    return category;
  }
}

module.exports = ContentService;

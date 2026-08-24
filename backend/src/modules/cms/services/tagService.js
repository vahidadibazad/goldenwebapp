// backend/src/modules/cms/services/tagService.js
const Tag = require('../models/Tag');
const Entry = require('../../../models/Entry');
const CacheService = require('../../../services/cacheService');

class TagService {

  // =============================================
  // مدیریت برچسب‌ها
  // =============================================

  static async createTag(data, userId) {
    const tag = new Tag({
      ...data,
      createdBy: userId,
    });
    await tag.save();
    await CacheService.clearModule('cms:tags:');
    return tag;
  }

  static async getTags(options = {}) {
    const { active = true, popular = false, limit = 20, search = '' } = options;
    
    const cacheKey = `cms:tags:${JSON.stringify(options)}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    let query = {};
    if (active) query.isActive = true;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    let tagsQuery = Tag.find(query);
    if (popular) {
      tagsQuery = tagsQuery.sort({ usageCount: -1 });
    } else {
      tagsQuery = tagsQuery.sort({ name: 1 });
    }

    const tags = await tagsQuery.limit(limit).lean();

    await CacheService.set(cacheKey, tags, 600);
    return tags;
  }

  static async getTagById(id) {
    const cacheKey = `cms:tag:${id}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const tag = await Tag.findById(id).lean();
    if (tag) {
      await CacheService.set(cacheKey, tag, 3600);
    }
    return tag;
  }

  static async getTagBySlug(slug) {
    return Tag.findOne({ slug, isActive: true }).lean();
  }

  static async updateTag(id, data) {
    const tag = await Tag.findByIdAndUpdate(id, data, { new: true });
    if (!tag) throw new Error('برچسب یافت نشد');
    await CacheService.delete(`cms:tag:${id}`);
    await CacheService.clearModule('cms:tags:');
    return tag;
  }

  static async deleteTag(id) {
    // حذف برچسب از تمام ورودی‌ها
    await Entry.updateMany(
      { tags: id },
      { $pull: { tags: id } }
    );
    const tag = await Tag.findByIdAndDelete(id);
    if (!tag) throw new Error('برچسب یافت نشد');
    await CacheService.delete(`cms:tag:${id}`);
    await CacheService.clearModule('cms:tags:');
    return tag;
  }

  static async getEntriesByTag(tagId, options = {}) {
    const { page = 1, limit = 20, status = 'published' } = options;
    const skip = (page - 1) * limit;

    const filter = { tags: tagId };
    if (status !== 'all') filter.status = status;

    const [entries, total] = await Promise.all([
      Entry.find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'fullName username')
        .populate('contentType', 'name apiName')
        .lean(),
      Entry.countDocuments(filter),
    ]);

    return {
      data: entries,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  // =============================================
  // مدیریت برچسب‌های ورودی
  // =============================================

  static async assignTagsToEntry(entryId, tagIds) {
    const entry = await Entry.findById(entryId);
    if (!entry) throw new Error('ورودی یافت نشد');

    // حذف برچسب‌های قبلی
    const oldTags = entry.tags || [];
    for (const oldTagId of oldTags) {
      await Tag.findByIdAndUpdate(oldTagId, { $inc: { usageCount: -1 } });
    }

    // افزودن برچسب‌های جدید
    entry.tags = tagIds;
    await entry.save();

    // افزایش تعداد استفاده
    for (const tagId of tagIds) {
      await Tag.findByIdAndUpdate(tagId, { $inc: { usageCount: 1 } });
    }

    await CacheService.delete(`cms:entry:${entryId}`);
    await CacheService.clearModule('cms:entries:');
    return entry;
  }

  static async getPopularTags(limit = 10) {
    return Tag.getPopular(limit);
  }
}

module.exports = TagService;

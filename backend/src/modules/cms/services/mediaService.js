// backend/src/modules/cms/services/mediaService.js
const Media = require('../models/Media');
const Category = require('../../../models/Category');
const Tag = require('../models/Tag');
const CacheService = require('../../../services/cacheService');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

class MediaService {

  // =============================================
  // آپلود فایل
  // =============================================

  static async uploadFile(file, data, userId) {
    const {
      title,
      category,
      tags = [],
      accessLevel = 'public',
      altText = '',
      description = '',
      allowedRoles = [],
    } = data;

    // تشخیص نوع فایل
    const mediaType = this._getMediaType(file.mimetype);

    // ایجاد رکورد در دیتابیس
    const media = new Media({
      title: title || file.originalname,
      fileName: file.filename,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      mediaType,
      uploadedBy: userId,
      category: category || null,
      tags: tags || [],
      accessLevel: accessLevel || 'public',
      altText: altText || '',
      description: description || '',
      allowedRoles: allowedRoles || [],
    });

    // اگر تصویر است، اطلاعات اضافی استخراج کن
    if (mediaType === 'image') {
      await this._processImage(file.path, media);
    }

    await media.save();

    // آپدیت برچسب‌ها
    if (tags && tags.length > 0) {
      await this._updateTagUsage(tags, 1);
    }

    // پاک کردن کش
    await CacheService.clearModule('cms:media:');

    return media;
  }

  // =============================================
  // دریافت فایل‌ها
  // =============================================

  static async getMedia(options = {}) {
    const {
      mediaType,
      status = 'published',
      category,
      tag,
      search,
      page = 1,
      limit = 20,
    } = options;

    const skip = (page - 1) * limit;
    const filter = {};

    if (mediaType) filter.mediaType = mediaType;
    if (status !== 'all') filter.status = status;
    if (category) filter.category = category;
    if (tag) filter.tags = tag;

    if (search) {
      filter.$text = { $search: search };
    }

    let query = Media.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'fullName username')
      .populate('category', 'name slug')
      .populate('tags', 'name slug');

    if (search) {
      query = query.sort({ score: { $meta: 'textScore' } });
    }

    const [data, total] = await Promise.all([
      query.lean(),
      Media.countDocuments(filter),
    ]);

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  static async getMediaById(id) {
    const cacheKey = `cms:media:${id}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const media = await Media.findById(id)
      .populate('uploadedBy', 'fullName username')
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .lean();

    if (media) {
      await CacheService.set(cacheKey, media, 3600);
    }
    return media;
  }

  static async getMediaStats() {
    const cacheKey = 'cms:media:stats';
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const stats = await Media.getStats();
    await CacheService.set(cacheKey, stats, 300);
    return stats;
  }

  // =============================================
  // مدیریت فایل‌ها
  // =============================================

  static async updateMedia(id, data, userId) {
    const media = await Media.findById(id);
    if (!media) throw new Error('فایل یافت نشد');

    const { title, category, tags, accessLevel, altText, description, allowedRoles } = data;

    if (title) media.title = title;
    if (category !== undefined) media.category = category || null;
    if (tags) {
      // کاهش تعداد استفاده برچسب‌های قبلی
      if (media.tags && media.tags.length > 0) {
        await this._updateTagUsage(media.tags, -1);
      }
      media.tags = tags;
      // افزایش تعداد استفاده برچسب‌های جدید
      if (tags.length > 0) {
        await this._updateTagUsage(tags, 1);
      }
    }
    if (accessLevel) media.accessLevel = accessLevel;
    if (altText !== undefined) media.altText = altText;
    if (description !== undefined) media.description = description;
    if (allowedRoles) media.allowedRoles = allowedRoles;

    await media.save();

    await CacheService.delete(`cms:media:${id}`);
    await CacheService.clearModule('cms:media:');

    return media;
  }

  static async deleteMedia(id) {
    const media = await Media.findById(id);
    if (!media) throw new Error('فایل یافت نشد');

    // حذف فایل فیزیکی
    try {
      if (fs.existsSync(media.filePath)) {
        fs.unlinkSync(media.filePath);
      }
      // حذف تامب‌نیل‌ها
      if (media.imageInfo?.thumbnail) {
        const thumbPath = path.join(path.dirname(media.filePath), media.imageInfo.thumbnail);
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
      }
      if (media.imageInfo?.medium) {
        const mediumPath = path.join(path.dirname(media.filePath), media.imageInfo.medium);
        if (fs.existsSync(mediumPath)) fs.unlinkSync(mediumPath);
      }
      if (media.imageInfo?.large) {
        const largePath = path.join(path.dirname(media.filePath), media.imageInfo.large);
        if (fs.existsSync(largePath)) fs.unlinkSync(largePath);
      }
    } catch (error) {
      console.warn('⚠️ خطا در حذف فایل فیزیکی:', error.message);
    }

    // کاهش تعداد استفاده برچسب‌ها
    if (media.tags && media.tags.length > 0) {
      await this._updateTagUsage(media.tags, -1);
    }

    await Media.findByIdAndDelete(id);

    await CacheService.delete(`cms:media:${id}`);
    await CacheService.clearModule('cms:media:');

    return media;
  }

  // =============================================
  // توابع کمکی
  // =============================================

  static _getMediaType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('excel')) return 'document';
    return 'other';
  }

  static async _processImage(filePath, media) {
    try {
      const metadata = await sharp(filePath).metadata();
      media.imageInfo.width = metadata.width || 0;
      media.imageInfo.height = metadata.height || 0;

      // تولید تامب‌نیل‌ها
      const dir = path.dirname(filePath);
      const ext = path.extname(filePath);
      const baseName = path.basename(filePath, ext);

      // تامب‌نیل (150x150)
      const thumbName = `${baseName}-thumb${ext}`;
      await sharp(filePath)
        .resize(150, 150, { fit: 'cover' })
        .toFile(path.join(dir, thumbName));
      media.imageInfo.thumbnail = thumbName;

      // اندازه متوسط (400x400)
      const mediumName = `${baseName}-medium${ext}`;
      await sharp(filePath)
        .resize(400, 400, { fit: 'inside' })
        .toFile(path.join(dir, mediumName));
      media.imageInfo.medium = mediumName;

      // اندازه بزرگ (800x800)
      const largeName = `${baseName}-large${ext}`;
      await sharp(filePath)
        .resize(800, 800, { fit: 'inside' })
        .toFile(path.join(dir, largeName));
      media.imageInfo.large = largeName;

      // استخراج رنگ غالب
      const { dominant } = await sharp(filePath).stats();
      if (dominant) {
        media.imageInfo.dominantColor = `rgb(${dominant.r}, ${dominant.g}, ${dominant.b})`;
      }

    } catch (error) {
      console.warn('⚠️ خطا در پردازش تصویر:', error.message);
    }
  }

  static async _updateTagUsage(tagIds, delta) {
    try {
      await Tag.updateMany(
        { _id: { $in: tagIds } },
        { $inc: { usageCount: delta } }
      );
    } catch (error) {
      console.warn('⚠️ خطا در به‌روزرسانی برچسب‌ها:', error.message);
    }
  }
}

module.exports = MediaService;

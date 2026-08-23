// backend/src/services/letterService.js
const Letter = require('../models/Letter');
const CacheService = require('./cacheService');
const mongoose = require('mongoose');

class LetterService {

  // =============================================
  // ✅ دریافت لیست نامه‌ها با بهینه‌سازی کامل
  // =============================================
  static async getLetters(filter = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    // ✅ ایجاد کلید کش بر اساس پارامترها
    const cacheKey = `letters:list:${JSON.stringify({ filter, page, limit })}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // ✅ استفاده از lean() و select() برای کاهش مصرف حافظه
    const [data, total] = await Promise.all([
      Letter.find(filter)
        .select('number subject letterType status priority sender receiver letterDate createdAt updatedAt')
        .populate('sender', 'username fullName')
        .populate('receiver', 'username fullName')
        .populate('secretariat', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Letter.countDocuments(filter)
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

    // ✅ ذخیره در کش به مدت ۲ دقیقه
    await CacheService.set(cacheKey, result, 120);

    return result;
  }

  // =============================================
  // ✅ دریافت یک نامه با ID
  // =============================================
  static async getLetterById(id) {
    const cacheKey = `letter:${id}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const letter = await Letter.findById(id)
      .select('-__v')
      .populate('sender', 'username fullName email')
      .populate('receiver', 'username fullName email')
      .populate('secretariat', 'name code')
      .populate('registeredBy', 'username fullName')
      .populate('referrals', 'from to status type dueDate')
      .populate('signatures', 'signer signedAt status')
      .lean();

    if (letter) {
      await CacheService.set(cacheKey, letter, 3600);
    }

    return letter;
  }

  // =============================================
  // ✅ دریافت آمار نامه‌ها با Aggregation Pipeline
  // =============================================
  static async getLetterStats(secretariatId = null) {
    const cacheKey = `letters:stats:${secretariatId || 'all'}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const filter = {};
    if (secretariatId) {
      filter.secretariat = new mongoose.Types.ObjectId(secretariatId);
    }

    // ✅ استفاده از Aggregation Pipeline با یک مرحله
    const stats = await Letter.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      draft: 0,
      registered: 0,
      in_review: 0,
      approved: 0,
      rejected: 0,
      signed: 0,
      archived: 0,
      total: 0,
    };

    stats.forEach(item => {
      if (item._id && result[item._id] !== undefined) {
        result[item._id] = item.count;
        result.total += item.count;
      }
    });

    await CacheService.set(cacheKey, result, 300);

    return result;
  }

  // =============================================
  // ✅ جستجوی نامه‌ها با Full-Text
  // =============================================
  static async searchLetters(query, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const filter = {
      $text: {
        $search: query,
        $caseSensitive: false,
        $diacriticSensitive: false
      }
    };

    const [data, total] = await Promise.all([
      Letter.find(filter)
        .select('number subject letterType status priority sender receiver letterDate')
        .populate('sender', 'username fullName')
        .populate('receiver', 'username fullName')
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .lean(),
      Letter.countDocuments(filter)
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

  // =============================================
  // ✅ دریافت نامه‌های در انتظار برای یک کاربر
  // =============================================
  static async getPendingLetters(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const filter = {
      'referrals.to': userId,
      'referrals.status': 'pending',
    };

    const [data, total] = await Promise.all([
      Letter.find(filter)
        .select('number subject letterType status priority sender receiver letterDate dueDate')
        .populate('sender', 'username fullName')
        .populate('receiver', 'username fullName')
        .populate('referrals', 'from to status type dueDate')
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Letter.countDocuments(filter)
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

module.exports = LetterService;
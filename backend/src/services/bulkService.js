// backend/src/services/bulkService.js
const Letter = require('../models/Letter');
const Hardware = require('../models/hardware');
const Document = require('../models/Document');
const CacheService = require('./cacheService');

class BulkService {

  // =============================================
  // ✅ حذف دسته‌جمعی نامه‌ها
  // =============================================
  static async deleteLetters(letterIds, userId) {
    if (!letterIds || letterIds.length === 0) {
      return { deletedCount: 0 };
    }

    const filter = {
      _id: { $in: letterIds },
      registeredBy: userId,
      status: 'draft'  // فقط پیش‌نویس‌ها
    };

    const result = await Letter.deleteMany(filter);
    
    // پاک کردن کش
    await CacheService.clearModule('letter:');
    
    return { 
      deletedCount: result.deletedCount,
      totalRequested: letterIds.length 
    };
  }

  // =============================================
  // ✅ تغییر وضعیت دسته‌جمعی نامه‌ها
  // =============================================
  static async updateLetterStatus(letterIds, status, userId, comment = '') {
    if (!letterIds || letterIds.length === 0) {
      return { modifiedCount: 0 };
    }

    const result = await Letter.updateMany(
      { _id: { $in: letterIds } },
      {
        $set: { 
          status,
          updatedAt: new Date()
        },
        $push: {
          trackingHistory: {
            status,
            user: userId,
            comment: comment || `تغییر وضعیت به ${status}`,
            timestamp: new Date()
          }
        }
      }
    );

    // پاک کردن کش
    await CacheService.clearModule('letter:');

    return {
      modifiedCount: result.modifiedCount,
      totalRequested: letterIds.length
    };
  }

  // =============================================
  // ✅ بایگانی دسته‌جمعی نامه‌ها
  // =============================================
  static async archiveLetters(letterIds, userId) {
    if (!letterIds || letterIds.length === 0) {
      return { modifiedCount: 0 };
    }

    const result = await Letter.updateMany(
      { _id: { $in: letterIds } },
      {
        $set: {
          isArchived: true,
          archivedAt: new Date(),
          archivedBy: userId,
          status: 'archived'
        },
        $push: {
          trackingHistory: {
            status: 'archived',
            user: userId,
            comment: 'بایگانی دسته‌جمعی',
            timestamp: new Date()
          }
        }
      }
    );

    // پاک کردن کش
    await CacheService.clearModule('letter:');

    return {
      modifiedCount: result.modifiedCount,
      totalRequested: letterIds.length
    };
  }

  // =============================================
  // ✅ حذف دسته‌جمعی اموال
  // =============================================
  static async deleteHardware(ids, userId) {
    if (!ids || ids.length === 0) {
      return { deletedCount: 0 };
    }

    const result = await Hardware.deleteMany({
      _id: { $in: ids }
    });

    await CacheService.clearModule('hardware:');

    return {
      deletedCount: result.deletedCount,
      totalRequested: ids.length
    };
  }

  // =============================================
  // ✅ تغییر وضعیت دسته‌جمعی اموال
  // =============================================
  static async updateHardwareStatus(ids, status) {
    if (!ids || ids.length === 0) {
      return { modifiedCount: 0 };
    }

    const result = await Hardware.updateMany(
      { _id: { $in: ids } },
      { $set: { status, updatedAt: new Date() } }
    );

    await CacheService.clearModule('hardware:');

    return {
      modifiedCount: result.modifiedCount,
      totalRequested: ids.length
    };
  }

  // =============================================
  // ✅ حذف دسته‌جمعی اسناد
  // =============================================
  static async deleteDocuments(ids, userId) {
    if (!ids || ids.length === 0) {
      return { deletedCount: 0 };
    }

    const result = await Document.deleteMany({
      _id: { $in: ids },
      uploadedBy: userId
    });

    await CacheService.clearModule('document:');

    return {
      deletedCount: result.deletedCount,
      totalRequested: ids.length
    };
  }
}

module.exports = BulkService;
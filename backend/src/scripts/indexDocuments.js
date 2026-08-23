const mongoose = require('mongoose');
require('dotenv').config();
const logger = require('../utils/logger');
const { 
  checkConnection, 
  reindexAll,
  checkAllIndexes 
} = require('../utils/elasticsearchIndexes');
const ElasticsearchService = require('../services/elasticsearchService');

// =============================================
// ✅ ثبت همه مدل‌ها قبل از استفاده
// =============================================
const Category = require('../models/Category');
const Department = require('../models/Department');
const Role = require('../models/Role');
const Letter = require('../models/Letter');
const Hardware = require('../models/hardware');
const Document = require('../models/Document');
const Credential = require('../models/Credential');
const User = require('../models/User');

// =============================================
// ✅ تابع تبدیل تاریخ شمسی به میلادی
// =============================================
const convertPersianDateToGregorian = (persianDate) => {
  if (!persianDate) return null;
  
  // اگر تاریخ میلادی است
  if (persianDate instanceof Date) return persianDate;
  if (typeof persianDate === 'string' && persianDate.includes('T')) return new Date(persianDate);
  
  // اگر تاریخ شمسی است (فرمت: 1403/05/01)
  if (typeof persianDate === 'string' && /^\d{4}\/\d{2}\/\d{2}$/.test(persianDate)) {
    try {
      // استفاده از moment-jalaali برای تبدیل
      const moment = require('moment-jalaali');
      const gregorian = moment(persianDate, 'jYYYY/jMM/jDD').toDate();
      return gregorian;
    } catch (error) {
      console.warn(`⚠️ خطا در تبدیل تاریخ ${persianDate}:`, error.message);
      return null;
    }
  }
  
  return null;
};

// =============================================
// ✅ تابع تبدیل تاریخ‌های یک شیء
// =============================================
const convertDates = (obj, dateFields = []) => {
  const result = { ...obj };
  for (const field of dateFields) {
    if (result[field]) {
      const converted = convertPersianDateToGregorian(result[field]);
      if (converted) {
        result[field] = converted;
      } else {
        delete result[field];
      }
    }
  }
  return result;
};

// =============================================
// ایندکس‌سازی نامه‌ها
// =============================================
const indexLetters = async () => {
  logger.info('📝 ایندکس‌سازی نامه‌ها...');
  try {
    const letters = await Letter.find()
      .populate('sender', 'fullName username')
      .populate('receiver', 'fullName username')
      .populate('secretariat', 'name code')
      .lean();

    let count = 0;
    for (const letter of letters) {
      try {
        const doc = {
          id: letter._id,
          number: letter.number,
          subject: letter.subject,
          content: letter.content,
          summary: letter.summary,
          letterType: letter.letterType,
          status: letter.status,
          priority: letter.priority,
          classification: letter.classification,
          senderName: letter.sender?.fullName || letter.senderName,
          receiverName: letter.receiver?.fullName || letter.receiverName,
          sender: letter.sender?._id,
          receiver: letter.receiver?._id,
          secretariat: letter.secretariat?._id,
          registeredBy: letter.registeredBy,
          letterDate: letter.letterDate,
          dueDate: letter.dueDate,
          createdAt: letter.createdAt,
          updatedAt: letter.updatedAt,
          suggest: letter.subject || letter.number,
        };
        
        // تبدیل تاریخ‌ها
        const converted = convertDates(doc, ['letterDate', 'dueDate', 'createdAt', 'updatedAt']);
        
        await ElasticsearchService.indexDocument('letters', letter._id, converted);
        count++;
      } catch (error) {
        logger.error(`❌ خطا در ایندکس‌سازی نامه ${letter._id}:`, error.message);
      }
    }
    logger.success(`✅ ${count} نامه ایندکس شد`);
    return count;
  } catch (error) {
    logger.error('❌ خطا در دریافت نامه‌ها:', error.message);
    return 0;
  }
};

// =============================================
// ایندکس‌سازی اموال
// =============================================
const indexHardware = async () => {
  logger.info('📝 ایندکس‌سازی اموال...');
  try {
    const hardware = await Hardware.find()
      .populate('category', 'name')
      .lean();

    let count = 0;
    for (const item of hardware) {
      try {
        const doc = {
          id: item._id,
          name: item.name,
          serialNumber: item.serialNumber,
          category: item.category?.name,
          status: item.status,
          description: item.description,
          assignedTo: item.assignedTo,
          price: item.price,
          purchaseDate: item.purchaseDate,
          warrantyExpire: item.warrantyExpire,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          suggest: item.name + ' ' + item.serialNumber,
        };
        
        // ✅ تبدیل تاریخ‌های شمسی به میلادی
        const converted = convertDates(doc, ['purchaseDate', 'warrantyExpire', 'createdAt', 'updatedAt']);
        
        await ElasticsearchService.indexDocument('hardware', item._id, converted);
        count++;
      } catch (error) {
        logger.error(`❌ خطا در ایندکس‌سازی اموال ${item._id}:`, error.message);
      }
    }
    logger.success(`✅ ${count} اموال ایندکس شد`);
    return count;
  } catch (error) {
    logger.error('❌ خطا در دریافت اموال:', error.message);
    return 0;
  }
};

// =============================================
// ایندکس‌سازی اسناد
// =============================================
const indexDocuments = async () => {
  logger.info('📝 ایندکس‌سازی اسناد...');
  try {
    const documents = await Document.find()
      .populate('uploadedBy', 'fullName username')
      .lean();

    let count = 0;
    for (const doc of documents) {
      try {
        // ✅ بررسی Department - اگر "All" بود، null بگذار
        let departmentId = null;
        if (doc.department && doc.department !== 'All') {
          try {
            const dept = await Department.findById(doc.department);
            if (dept) departmentId = doc.department;
          } catch (e) {
            // اگر Department پیدا نشد، null بگذار
          }
        }

        const esDoc = {
          id: doc._id,
          title: doc.title,
          description: doc.description,
          fileType: doc.fileType,
          category: doc.category,
          tags: doc.tags,
          accessLevel: doc.accessLevel,
          department: departmentId,
          uploadedBy: doc.uploadedBy?._id,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          suggest: doc.title,
        };
        
        await ElasticsearchService.indexDocument('documents', doc._id, esDoc);
        count++;
      } catch (error) {
        logger.error(`❌ خطا در ایندکس‌سازی سند ${doc._id}:`, error.message);
      }
    }
    logger.success(`✅ ${count} سند ایندکس شد`);
    return count;
  } catch (error) {
    logger.error('❌ خطا در دریافت اسناد:', error.message);
    return 0;
  }
};

// =============================================
// ایندکس‌سازی رمزها
// =============================================
const indexCredentials = async () => {
  logger.info('📝 ایندکس‌سازی رمزها...');
  try {
    const credentials = await Credential.find().lean();

    let count = 0;
    for (const cred of credentials) {
      try {
        await ElasticsearchService.indexDocument('credentials', cred._id, {
          id: cred._id,
          systemName: cred.systemName,
          username: cred.username,
          accessLevel: cred.accessLevel,
          description: cred.description,
          hardware: cred.hardware,
          createdAt: cred.createdAt,
          updatedAt: cred.updatedAt,
          suggest: cred.systemName + ' ' + cred.username,
        });
        count++;
      } catch (error) {
        logger.error(`❌ خطا در ایندکس‌سازی رمز ${cred._id}:`, error.message);
      }
    }
    logger.success(`✅ ${count} رمز ایندکس شد`);
    return count;
  } catch (error) {
    logger.error('❌ خطا در دریافت رمزها:', error.message);
    return 0;
  }
};

// =============================================
// ایندکس‌سازی کاربران
// =============================================
const indexUsers = async () => {
  logger.info('📝 ایندکس‌سازی کاربران...');
  try {
    const users = await User.find()
      .populate('role', 'name label')
      .lean();

    let count = 0;
    for (const user of users) {
      try {
        await ElasticsearchService.indexDocument('users', user._id, {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role?.name,
          department: user.department === 'All' ? null : user.department,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          suggest: user.fullName + ' ' + user.username,
        });
        count++;
      } catch (error) {
        logger.error(`❌ خطا در ایندکس‌سازی کاربر ${user._id}:`, error.message);
      }
    }
    logger.success(`✅ ${count} کاربر ایندکس شد`);
    return count;
  } catch (error) {
    logger.error('❌ خطا در دریافت کاربران:', error.message);
    return 0;
  }
};

// =============================================
// تابع اصلی
// =============================================
const indexAllDocuments = async () => {
  try {
    logger.title('🚀 شروع ایندکس‌سازی اولیه');

    // ۱. اتصال به Elasticsearch
    const connected = await checkConnection();
    if (!connected) {
      logger.error('❌ اتصال به Elasticsearch برقرار نشد');
      logger.info('💡 مطمئن شوید Elasticsearch در حال اجراست:');
      logger.info('   http://localhost:9200');
      process.exit(1);
    }

    // ۲. اتصال به MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/goldenweb');
    logger.success('✅ متصل به MongoDB');

    // ۳. بررسی ایندکس‌های موجود
    await checkAllIndexes();

    // ۴. ایجاد/بازسازی ایندکس‌ها
    await reindexAll();

    // ۵. ایندکس‌سازی داده‌ها
    const results = {
      letters: await indexLetters(),
      hardware: await indexHardware(),
      documents: await indexDocuments(),
      credentials: await indexCredentials(),
      users: await indexUsers(),
    };

    logger.divider();
    logger.title('✅ ایندکس‌سازی با موفقیت انجام شد');
    logger.info(`📊 نامه‌ها: ${results.letters}`);
    logger.info(`📊 اموال: ${results.hardware}`);
    logger.info(`📊 اسناد: ${results.documents}`);
    logger.info(`📊 رمزها: ${results.credentials}`);
    logger.info(`📊 کاربران: ${results.users}`);
    logger.divider();

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    logger.error('❌ خطا:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// اجرا
if (require.main === module) {
  indexAllDocuments();
}

module.exports = indexAllDocuments;
const { createIndex, reindex, esClient, checkConnection } = require('../config/elasticsearch');
const logger = require('./logger');

// =============================================
// تعریف ایندکس‌ها و Mapping آنها
// =============================================
const INDEXES = {
  letters: {
    name: 'letters',
    mappings: {
      properties: {
        id: { type: 'keyword' },
        number: { type: 'keyword' },
        subject: { type: 'text', analyzer: 'persian_analyzer', fields: { keyword: { type: 'keyword' } } },
        content: { type: 'text', analyzer: 'persian_analyzer' },
        summary: { type: 'text', analyzer: 'persian_analyzer' },
        letterType: { type: 'keyword' },
        status: { type: 'keyword' },
        priority: { type: 'keyword' },
        classification: { type: 'keyword' },
        senderName: { type: 'text', analyzer: 'persian_analyzer' },
        receiverName: { type: 'text', analyzer: 'persian_analyzer' },
        sender: { type: 'keyword' },
        receiver: { type: 'keyword' },
        secretariat: { type: 'keyword' },
        registeredBy: { type: 'keyword' },
        letterDate: { type: 'date' },
        dueDate: { type: 'date' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
        tags: { type: 'keyword' },
        suggest: { type: 'completion' },
      },
    },
  },

  hardware: {
    name: 'hardware',
    mappings: {
      properties: {
        id: { type: 'keyword' },
        name: { type: 'text', analyzer: 'persian_analyzer', fields: { keyword: { type: 'keyword' } } },
        serialNumber: { type: 'keyword' },
        category: { type: 'keyword' },
        status: { type: 'keyword' },
        description: { type: 'text', analyzer: 'persian_analyzer' },
        assignedTo: { type: 'keyword' },
        price: { type: 'float' },
        purchaseDate: { type: 'date' },
        warrantyExpire: { type: 'date' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
        suggest: { type: 'completion' },
      },
    },
  },

  documents: {
    name: 'documents',
    mappings: {
      properties: {
        id: { type: 'keyword' },
        title: { type: 'text', analyzer: 'persian_analyzer', fields: { keyword: { type: 'keyword' } } },
        description: { type: 'text', analyzer: 'persian_analyzer' },
        fileType: { type: 'keyword' },
        category: { type: 'keyword' },
        tags: { type: 'keyword' },
        accessLevel: { type: 'keyword' },
        department: { type: 'keyword' },
        uploadedBy: { type: 'keyword' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
        suggest: { type: 'completion' },
      },
    },
  },

  credentials: {
    name: 'credentials',
    mappings: {
      properties: {
        id: { type: 'keyword' },
        systemName: { type: 'text', analyzer: 'persian_analyzer', fields: { keyword: { type: 'keyword' } } },
        username: { type: 'keyword' },
        accessLevel: { type: 'keyword' },
        description: { type: 'text', analyzer: 'persian_analyzer' },
        hardware: { type: 'keyword' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
        suggest: { type: 'completion' },
      },
    },
  },

  users: {
    name: 'users',
    mappings: {
      properties: {
        id: { type: 'keyword' },
        username: { type: 'keyword' },
        fullName: { type: 'text', analyzer: 'persian_analyzer', fields: { keyword: { type: 'keyword' } } },
        email: { type: 'keyword' },
        role: { type: 'keyword' },
        department: { type: 'keyword' },
        isActive: { type: 'boolean' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
        suggest: { type: 'completion' },
      },
    },
  },
};

// =============================================
// تابع ایجاد همه ایندکس‌ها
// =============================================
const createAllIndexes = async () => {
  const results = [];
  for (const [key, config] of Object.entries(INDEXES)) {
    const result = await createIndex(config.name, config.mappings);
    results.push({ key, success: result });
    if (result) {
      logger.success(`✅ ایندکس ${config.name} با موفقیت ایجاد شد`);
    }
  }
  return results;
};

// =============================================
// تابع بازسازی همه ایندکس‌ها
// =============================================
const reindexAll = async () => {
  const results = [];
  for (const [key, config] of Object.entries(INDEXES)) {
    try {
      await esClient.indices.delete({ index: config.name });
      logger.info(`🗑️ ایندکس ${config.name} حذف شد`);
    } catch (e) {
      // ایندکس وجود نداشت
      logger.info(`ℹ️ ایندکس ${config.name} وجود نداشت`);
    }
    const result = await createIndex(config.name, config.mappings);
    results.push({ key, success: result });
    if (result) {
      logger.success(`✅ ایندکس ${config.name} با موفقیت بازسازی شد`);
    }
  }
  return results;
};

// =============================================
// تابع بررسی وجود ایندکس‌ها
// =============================================
const checkAllIndexes = async () => {
  const results = [];
  for (const [key, config] of Object.entries(INDEXES)) {
    try {
      const exists = await esClient.indices.exists({ index: config.name });
      results.push({ key, exists });
      logger.info(`📊 ایندکس ${config.name}: ${exists ? 'موجود' : 'وجود ندارد'}`);
    } catch (error) {
      logger.error(`❌ خطا در بررسی ایندکس ${config.name}:`, error.message);
      results.push({ key, exists: false, error: error.message });
    }
  }
  return results;
};

module.exports = {
  INDEXES,
  createAllIndexes,
  reindexAll,
  checkAllIndexes,
  checkConnection,
};
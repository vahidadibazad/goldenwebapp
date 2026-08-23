const { Client } = require('@elastic/elasticsearch');

// =============================================
// تنظیمات اتصال به Elasticsearch
// =============================================
const elasticConfig = {
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  // ✅ تنظیم نسخه برای سازگاری با Elasticsearch 8.x
  compatibilityMode: true,
  requestTimeout: 30000,
  maxRetries: 3,
  // تنظیمات اضافی برای نسخه 8.x
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
};

// ایجاد کلاینت
const esClient = new Client(elasticConfig);

// =============================================
// تابع تست اتصال
// =============================================
const checkConnection = async () => {
  try {
    const health = await esClient.cluster.health();
    console.log('✅ Elasticsearch متصل شد:', health.cluster_name);
    return true;
  } catch (error) {
    console.error('❌ خطا در اتصال به Elasticsearch:', error.message);
    return false;
  }
};

// =============================================
// تابع ایجاد ایندکس
// =============================================
const createIndex = async (indexName, mappings) => {
  try {
    const exists = await esClient.indices.exists({ index: indexName });
    
    if (!exists) {
      await esClient.indices.create({
        index: indexName,
        body: {
          settings: {
            analysis: {
              analyzer: {
                persian_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'stop', 'arabic_normalization', 'persian_normalization']
                }
              },
              normalizer: {
                persian_normalizer: {
                  type: 'custom',
                  filter: ['lowercase', 'arabic_normalization', 'persian_normalization']
                }
              }
            }
          },
          mappings
        }
      });
      console.log(`✅ ایندکس ${indexName} ایجاد شد`);
    } else {
      console.log(`ℹ️ ایندکس ${indexName} قبلاً وجود دارد`);
    }
    return true;
  } catch (error) {
    console.error(`❌ خطا در ایجاد ایندکس ${indexName}:`, error.message);
    return false;
  }
};

// =============================================
// تابع حذف ایندکس
// =============================================
const deleteIndex = async (indexName) => {
  try {
    await esClient.indices.delete({ index: indexName });
    console.log(`🗑️ ایندکس ${indexName} حذف شد`);
    return true;
  } catch (error) {
    console.error(`❌ خطا در حذف ایندکس ${indexName}:`, error.message);
    return false;
  }
};

// =============================================
// تابع بازسازی ایندکس
// =============================================
const reindex = async (indexName, mappings) => {
  await deleteIndex(indexName);
  return createIndex(indexName, mappings);
};

// =============================================
// تابع بررسی وجود ایندکس
// =============================================
const indexExists = async (indexName) => {
  try {
    return await esClient.indices.exists({ index: indexName });
  } catch (error) {
    return false;
  }
};

module.exports = {
  esClient,
  checkConnection,
  createIndex,
  deleteIndex,
  reindex,
  indexExists,
  elasticConfig,
};
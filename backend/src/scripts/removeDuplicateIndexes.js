// backend/src/scripts/removeDuplicateIndexes.js
const mongoose = require('mongoose');
require('dotenv').config();

const removeDuplicateIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/goldenweb');
    console.log('✅ متصل به دیتابیس');

    const db = mongoose.connection.db;

    // =============================================
    // ۱. حذف ایندکس‌های تکراری از letters
    // =============================================
    try {
      const indexes = await db.collection('letters').indexes();
      for (const idx of indexes) {
        if (idx.name === 'number_1' || idx.name === 'number_unique') {
          await db.collection('letters').dropIndex(idx.name);
          console.log(`🗑️ ایندکس ${idx.name} از letters حذف شد`);
        }
      }
    } catch (e) {
      console.log('ℹ️ خطا در letters:', e.message);
    }

    // =============================================
    // ۲. حذف ایندکس‌های تکراری از users
    // =============================================
    try {
      const indexes = await db.collection('users').indexes();
      for (const idx of indexes) {
        if (idx.name === 'username_1' || idx.name === 'email_1') {
          await db.collection('users').dropIndex(idx.name);
          console.log(`🗑️ ایندکس ${idx.name} از users حذف شد`);
        }
      }
    } catch (e) {
      console.log('ℹ️ خطا در users:', e.message);
    }

    // =============================================
    // ۳. حذف ایندکس‌های تکراری از documents
    // =============================================
    try {
      const indexes = await db.collection('documents').indexes();
      for (const idx of indexes) {
        if (idx.name === 'letterNumber_1' || idx.name === 'letterNumber_unique') {
          await db.collection('documents').dropIndex(idx.name);
          console.log(`🗑️ ایندکس ${idx.name} از documents حذف شد`);
        }
      }
    } catch (e) {
      console.log('ℹ️ خطا در documents:', e.message);
    }

    // =============================================
    // ۴. نمایش ایندکس‌های نهایی
    // =============================================
    console.log('\n📋 ایندکس‌های نهایی letters:');
    const lettersIndexes = await db.collection('letters').indexes();
    console.log(lettersIndexes.map(i => i.name));

    console.log('\n📋 ایندکس‌های نهایی users:');
    const usersIndexes = await db.collection('users').indexes();
    console.log(usersIndexes.map(i => i.name));

    console.log('\n📋 ایندکس‌های نهایی documents:');
    const documentsIndexes = await db.collection('documents').indexes();
    console.log(documentsIndexes.map(i => i.name));

    await mongoose.disconnect();
    console.log('\n✅ اتمام عملیات');
    process.exit(0);

  } catch (error) {
    console.error('❌ خطا:', error);
    process.exit(1);
  }
};

removeDuplicateIndexes();
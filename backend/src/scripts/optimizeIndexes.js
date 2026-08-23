const mongoose = require('mongoose');
require('dotenv').config();

const optimizeIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ متصل به دیتابیس');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    for (const collection of collections) {
      const name = collection.name;
      const indexes = await db.collection(name).indexes();
      
      console.log(`\n📋 ایندکس‌های ${name}:`);
      
      for (const idx of indexes) {
        // حذف ایندکس‌های اضافی
        if (idx.name.includes('_1') && idx.name !== '_id_') {
          console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
        }
        
        // بررسی ایندکس‌های تکراری
        const keys = Object.keys(idx.key).sort().join(',');
        const duplicates = indexes.filter(i => 
          Object.keys(i.key).sort().join(',') === keys && i.name !== idx.name
        );
        
        if (duplicates.length > 0) {
          console.log(`⚠️ ایندکس تکراری: ${idx.name}`);
          // await db.collection(name).dropIndex(idx.name);
          // console.log(`🗑️ ایندکس ${idx.name} حذف شد`);
        }
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ بررسی ایندکس‌ها کامل شد');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطا:', error);
    process.exit(1);
  }
};

optimizeIndexes();
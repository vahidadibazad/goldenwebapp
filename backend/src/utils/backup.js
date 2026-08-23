// backend/src/utils/backup.js

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const backupDir = path.join(__dirname, '../../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// =============================================
// ✅ پشتیبان‌گیری با نام فایل
// =============================================
const backupDatabase = async () => {
  try {
    console.log('🔄 شروع پشتیبان‌گیری...');
    
    // دریافت لیست کالکشن‌ها
    const collections = await mongoose.connection.db.listCollections().toArray();
    const backupData = {};
    let totalDocuments = 0;

    for (const collection of collections) {
      const name = collection.name;
      // به‌جز collections سیستمی
      if (name.startsWith('system.')) continue;
      
      const data = await mongoose.connection.db.collection(name).find({}).toArray();
      backupData[name] = data;
      totalDocuments += data.length;
      console.log(`📊 ${name}: ${data.length} سند`);
    }

    // تولید نام فایل
    const date = new Date();
    const dateStr = 
      String(date.getFullYear()) + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0') + '_' +
      String(date.getHours()).padStart(2, '0') + '-' +
      String(date.getMinutes()).padStart(2, '0');
    
    const fileName = `backup-${dateStr}.json`;
    const backupPath = path.join(backupDir, fileName);

    // ذخیره فایل
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

    const fileSize = (fs.statSync(backupPath).size / 1024 / 1024).toFixed(2);
    
    console.log(`✅ پشتیبان‌گیری موفق: ${fileName}`);
    console.log(`📊 تعداد کالکشن‌ها: ${collections.length}`);
    console.log(`📊 تعداد اسناد: ${totalDocuments}`);
    console.log(`📊 حجم فایل: ${fileSize} MB`);

    return {
      success: true,
      fileName,
      filePath: backupPath,
      collections: collections.length,
      documents: totalDocuments,
      size: fileSize,
    };
  } catch (error) {
    console.error(`❌ خطا در پشتیبان‌گیری: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = backupDatabase;
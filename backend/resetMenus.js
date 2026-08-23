const mongoose = require('mongoose');
const MenuItem = require('./src/models/MenuItem');
require('dotenv').config();

const resetMenus = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/goldenweb');
    console.log('✅ متصل به MongoDB');

    // حذف همه منوها
    const result = await MenuItem.deleteMany({});
    console.log(`🗑️ ${result.deletedCount} آیتم منو حذف شد`);

    console.log('🔄 ری‌استارت بک‌اند تا سیدر منوها اجرا شود...');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطا:', error);
    process.exit(1);
  }
};

resetMenus();
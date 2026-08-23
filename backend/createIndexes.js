const mongoose = require('mongoose');
const Hardware = require('./src/models/hardware');
const Document = require('./src/models/Document');
const Credential = require('./src/models/Credential');
require('dotenv').config();

const createIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ متصل به MongoDB');

    // ایجاد ایندکس‌ها
    await Hardware.createIndexes();
    console.log('✅ ایندکس Hardware ایجاد شد');

    await Document.createIndexes();
    console.log('✅ ایندکس Document ایجاد شد');

    await Credential.createIndexes();
    console.log('✅ ایندکس Credential ایجاد شد');

    console.log('🎉 همه ایندکس‌ها با موفقیت ایجاد شدند');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطا:', error);
    process.exit(1);
  }
};

createIndexes();
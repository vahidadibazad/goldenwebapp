const mongoose = require('mongoose');
const Hardware = require('./src/models/hardware');
const Document = require('./src/models/Document');
const Credential = require('./src/models/Credential');
require('dotenv').config();

const resetIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ متصل به MongoDB');

    // حذف ایندکس‌های قدیمی
    console.log('🗑️ حذف ایندکس‌های قدیمی...');
    
    try {
      await Hardware.collection.dropIndex('hardware_text_index');
    } catch (e) { console.log('⚠️ ایندکس Hardware وجود نداشت'); }
    
    try {
      await Document.collection.dropIndex('document_text_index');
    } catch (e) { console.log('⚠️ ایندکس Document وجود نداشت'); }
    
    try {
      await Credential.collection.dropIndex('credential_text_index');
    } catch (e) { console.log('⚠️ ایندکس Credential وجود نداشت'); }

    // ایجاد ایندکس‌های جدید
    console.log('🔄 ایجاد ایندکس‌های جدید...');
    await Hardware.createIndexes();
    console.log('✅ ایندکس Hardware ایجاد شد');
    await Document.createIndexes();
    console.log('✅ ایندکس Document ایجاد شد');
    await Credential.createIndexes();
    console.log('✅ ایندکس Credential ایجاد شد');

    // نمایش لیست ایندکس‌ها
    console.log('\n📋 لیست ایندکس‌های Hardware:');
    console.log(await Hardware.collection.indexes());
    
    console.log('\n📋 لیست ایندکس‌های Document:');
    console.log(await Document.collection.indexes());
    
    console.log('\n📋 لیست ایندکس‌های Credential:');
    console.log(await Credential.collection.indexes());

    console.log('\n🎉 همه ایندکس‌ها با موفقیت بازسازی شدند');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطا:', error);
    process.exit(1);
  }
};

resetIndexes();
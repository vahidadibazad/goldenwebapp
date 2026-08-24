// backend/fixAdminRole.js
const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect('mongodb://127.0.0.1:27017/goldenweb')
  .then(async () => {
    console.log('✅ متصل به MongoDB');

    // پیدا کردن کاربر admin
    const user = await User.findOne({ username: 'admin' });
    
    if (!user) {
      console.log('❌ کاربر admin یافت نشد');
      process.exit(0);
    }

    console.log('👤 کاربر پیدا شد:', user.username);
    console.log('📋 نقش فعلی:', user.role);

    // تغییر نقش به admin
    user.role = 'admin';
    await user.save();

    console.log('✅ نقش کاربر به admin تغییر یافت');
    console.log('📋 نقش جدید:', user.role);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ خطا:', err);
    process.exit(1);
  });
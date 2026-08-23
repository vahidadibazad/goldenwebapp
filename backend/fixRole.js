const mongoose = require('mongoose');
const User = require('./src/models/User');
const Role = require('./src/models/Role');
require('dotenv').config();

const fixRole = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // پیدا کردن نقش admin
    const adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) {
      console.log('❌ نقش admin یافت نشد!');
      process.exit(1);
    }
    
    console.log('✅ نقش admin پیدا شد:', adminRole._id);
    
    // به‌روزرسانی کاربر admin
    const user = await User.findOne({ username: 'admin' });
    if (!user) {
      console.log('❌ کاربر admin یافت نشد!');
      process.exit(1);
    }
    
    user.role = adminRole._id;
    await user.save();
    
    console.log('✅ نقش admin به کاربر اختصاص داده شد');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطا:', error);
    process.exit(1);
  }
};

fixRole();
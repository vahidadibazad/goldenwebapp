// backend/fixUser.js
const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const fixUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // حذف همه‌ی کاربران
    await User.deleteMany({});
    console.log('✅ همه‌ی کاربران حذف شدند');
    
    // هش کردن رمز عبور
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Secpass@121', salt);
    
    // ایجاد کاربر جدید
    const user = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      fullName: 'مدیر سیستم',
      password: hashedPassword,
      isActive: true,
    });
    
    console.log('✅ کاربر admin ساخته شد:', user);
    process.exit(0);
  } catch (error) {
    console.error('❌ خطا:', error);
    process.exit(1);
  }
};

fixUser();
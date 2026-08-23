const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Role = require('./src/models/Role');
require('dotenv').config();

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ متصل به دیتابیس');

    // پیدا کردن نقش admin
    const adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) {
      console.log('❌ نقش admin یافت نشد!');
      process.exit(1);
    }

    // حذف کاربر admin قبلی
    await User.deleteOne({ username: 'admin' });
    console.log('🗑️ کاربر admin قبلی حذف شد');

    // هش کردن رمز عبور
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Secpass@121', salt);

    // ایجاد کاربر جدید
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      fullName: 'مدیر سیستم',
      password: hashedPassword,
      role: adminRole._id,
      isActive: true,
    });

    console.log('✅ کاربر admin جدید ایجاد شد:');
    console.log(`   👤 نام کاربری: admin`);
    console.log(`   🔑 رمز عبور: Secpass@121`);
    console.log(`   🆔 شناسه: ${adminUser._id}`);

    await mongoose.disconnect();
    console.log('✅ اتمام عملیات');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطا:', error);
    process.exit(1);
  }
};

resetAdmin();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Role = require('./src/models/Role');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ متصل به دیتابیس');

    // 1. پیدا کردن نقش admin
    let adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) {
      console.log('⚠️ نقش admin پیدا نشد، ایجاد می‌شود...');
      adminRole = await Role.create({
        name: 'admin',
        label: 'مدیر کل',
        description: 'دسترسی کامل',
        isSystem: true,
        permissions: [],
      });
      console.log('✅ نقش admin ایجاد شد');
    }

    // 2. حذف کاربر admin قبلی (اگر وجود دارد)
    await User.deleteOne({ username: 'admin' });
    console.log('🗑️ کاربر admin قبلی حذف شد');

    // 3. ایجاد کاربر admin جدید
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      fullName: 'مدیر سیستم',
      password: hashedPassword,
      role: adminRole._id,
      isActive: true,
    });

    console.log('✅ کاربر admin با موفقیت ایجاد شد:');
    console.log(`   👤 نام کاربری: admin`);
    console.log(`   🔑 رمز عبور: 123456`);
    console.log(`   📧 ایمیل: admin@example.com`);
    console.log(`   🆔 شناسه: ${adminUser._id}`);

    await mongoose.disconnect();
    console.log('✅ اتمام عملیات');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطا:', error.message);
    process.exit(1);
  }
};

createAdmin();
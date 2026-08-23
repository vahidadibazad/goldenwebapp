// backend/src/utils/createIndexes.js
const mongoose = require('mongoose');
require('dotenv').config();

const createIndexes = async () => {
  try {
    console.log('🔄 اتصال به MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/goldenweb');
    console.log('✅ متصل به MongoDB');

    const db = mongoose.connection.db;

    // =============================================
    // ۱. ایندکس‌های نامه‌ها (بیشترین تراکنش)
    // =============================================
    console.log('\n📝 ایجاد ایندکس‌های Letters...');
    
    try {
      await db.collection('letters').createIndex(
        { secretariat: 1, status: 1, createdAt: -1 },
        { name: 'idx_letters_secretariat_status_date' }
      );
      console.log('  ✅ idx_letters_secretariat_status_date');
    } catch (e) { console.log('  ⚠️', e.message); }

    try {
      await db.collection('letters').createIndex(
        { sender: 1, receiver: 1, createdAt: -1 },
        { name: 'idx_letters_sender_receiver_date' }
      );
      console.log('  ✅ idx_letters_sender_receiver_date');
    } catch (e) { console.log('  ⚠️', e.message); }

    try {
      await db.collection('letters').createIndex(
        { number: 1, letterType: 1 },
        { name: 'idx_letters_number_type' }
      );
      console.log('  ✅ idx_letters_number_type');
    } catch (e) { console.log('  ⚠️', e.message); }

    try {
      await db.collection('letters').createIndex(
        { status: 1, priority: 1, dueDate: 1 },
        { name: 'idx_letters_status_priority_due' }
      );
      console.log('  ✅ idx_letters_status_priority_due');
    } catch (e) { console.log('  ⚠️', e.message); }

    // =============================================
    // ۲. ایندکس‌های ارجاعات
    // =============================================
    console.log('\n📝 ایجاد ایندکس‌های Referrals...');
    
    try {
      await db.collection('referrals').createIndex(
        { to: 1, status: 1, dueDate: 1 },
        { name: 'idx_referrals_to_status_due' }
      );
      console.log('  ✅ idx_referrals_to_status_due');
    } catch (e) { console.log('  ⚠️', e.message); }

    try {
      await db.collection('referrals').createIndex(
        { letter: 1, status: 1 },
        { name: 'idx_referrals_letter_status' }
      );
      console.log('  ✅ idx_referrals_letter_status');
    } catch (e) { console.log('  ⚠️', e.message); }

    try {
      await db.collection('referrals').createIndex(
        { from: 1, to: 1, createdAt: -1 },
        { name: 'idx_referrals_from_to_date' }
      );
      console.log('  ✅ idx_referrals_from_to_date');
    } catch (e) { console.log('  ⚠️', e.message); }

    // =============================================
    // ۳. ایندکس‌های اموال
    // =============================================
    console.log('\n📝 ایجاد ایندکس‌های Hardware...');
    
    try {
      await db.collection('hardware').createIndex(
        { status: 1, category: 1, assignedTo: 1 },
        { name: 'idx_hardware_status_category_assigned' }
      );
      console.log('  ✅ idx_hardware_status_category_assigned');
    } catch (e) { console.log('  ⚠️', e.message); }

    try {
      await db.collection('hardware').createIndex(
        { serialNumber: 1 },
        { name: 'idx_hardware_serial' }
      );
      console.log('  ✅ idx_hardware_serial');
    } catch (e) { console.log('  ⚠️', e.message); }

    // =============================================
    // ۴. ایندکس‌های تیکت‌ها
    // =============================================
    console.log('\n📝 ایجاد ایندکس‌های Tickets...');
    
    try {
      await db.collection('tickets').createIndex(
        { status: 1, priority: 1, assignedTo: 1 },
        { name: 'idx_tickets_status_priority_assigned' }
      );
      console.log('  ✅ idx_tickets_status_priority_assigned');
    } catch (e) { console.log('  ⚠️', e.message); }

    try {
      await db.collection('tickets').createIndex(
        { requester: 1, createdAt: -1 },
        { name: 'idx_tickets_requester_date' }
      );
      console.log('  ✅ idx_tickets_requester_date');
    } catch (e) { console.log('  ⚠️', e.message); }

    // =============================================
    // ۵. ایندکس‌های اسناد
    // =============================================
    console.log('\n📝 ایجاد ایندکس‌های Documents...');
    
    try {
      await db.collection('documents').createIndex(
        { uploadedBy: 1, accessLevel: 1, createdAt: -1 },
        { name: 'idx_documents_uploader_access_date' }
      );
      console.log('  ✅ idx_documents_uploader_access_date');
    } catch (e) { console.log('  ⚠️', e.message); }

    try {
      await db.collection('documents').createIndex(
        { category: 1, fileType: 1 },
        { name: 'idx_documents_category_filetype' }
      );
      console.log('  ✅ idx_documents_category_filetype');
    } catch (e) { console.log('  ⚠️', e.message); }

    // =============================================
    // ۶. ایندکس‌های کاربران
    // =============================================
    console.log('\n📝 ایجاد ایندکس‌های Users...');
    
    try {
      await db.collection('users').createIndex(
        { departmentId: 1, isActive: 1 },
        { name: 'idx_users_department_active' }
      );
      console.log('  ✅ idx_users_department_active');
    } catch (e) { console.log('  ⚠️', e.message); }

    try {
      await db.collection('users').createIndex(
        { role: 1, isActive: 1 },
        { name: 'idx_users_role_active' }
      );
      console.log('  ✅ idx_users_role_active');
    } catch (e) { console.log('  ⚠️', e.message); }

    // =============================================
    // ۷. ایندکس‌های بایگانی
    // =============================================
    console.log('\n📝 ایجاد ایندکس‌های Archives...');
    
    try {
      await db.collection('archives').createIndex(
        { secretariat: 1, type: 1, isActive: 1 },
        { name: 'idx_archives_secretariat_type_active' }
      );
      console.log('  ✅ idx_archives_secretariat_type_active');
    } catch (e) { console.log('  ⚠️', e.message); }

    // =============================================
    // ۸. ایندکس‌های دبیرخانه
    // =============================================
    console.log('\n📝 ایجاد ایندکس‌های Secretariats...');
    
    try {
      await db.collection('secretariats').createIndex(
        { type: 1, isActive: 1 },
        { name: 'idx_secretariats_type_active' }
      );
      console.log('  ✅ idx_secretariats_type_active');
    } catch (e) { console.log('  ⚠️', e.message); }

    // =============================================
    // ۹. ایندکس‌های واحدها
    // =============================================
    console.log('\n📝 ایجاد ایندکس‌های Departments...');
    
    try {
      await db.collection('departments').createIndex(
        { parent: 1, level: 1, isActive: 1 },
        { name: 'idx_departments_parent_level_active' }
      );
      console.log('  ✅ idx_departments_parent_level_active');
    } catch (e) { console.log('  ⚠️', e.message); }

    // =============================================
    // نمایش لیست نهایی ایندکس‌ها
    // =============================================
    console.log('\n📋 لیست نهایی ایندکس‌ها:');
    const collections = await db.listCollections().toArray();
    for (const coll of collections) {
      const indexes = await db.collection(coll.name).indexes();
      const customIndexes = indexes.filter(idx => idx.name !== '_id_');
      if (customIndexes.length > 0) {
        console.log(`\n📁 ${coll.name}:`);
        customIndexes.forEach(idx => {
          console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
        });
      }
    }

    console.log('\n✅ همه ایندکس‌ها با موفقیت ایجاد شدند');
    await mongoose.disconnect();
    console.log('✅ اتمام عملیات');
    process.exit(0);

  } catch (error) {
    console.error('❌ خطا:', error.message);
    process.exit(1);
  }
};

createIndexes();
const EnumValue = require('../models/EnumValue');

const enumData = [
  // =============================================
  // انواع نامه
  // =============================================
  { group: 'letter_type', key: 'incoming', label: 'ورودی', color: '#1677ff', icon: '📥', order: 1, isSystem: true },
  { group: 'letter_type', key: 'outgoing', label: 'خروجی', color: '#52c41a', icon: '📤', order: 2, isSystem: true },
  { group: 'letter_type', key: 'internal', label: 'داخلی', color: '#faad14', icon: '📋', order: 3, isSystem: true },
  
  // =============================================
  // وضعیت نامه
  // =============================================
  { group: 'letter_status', key: 'draft', label: 'پیش‌نویس', color: '#8c8c8c', icon: '📝', order: 1, isSystem: true },
  { group: 'letter_status', key: 'pending', label: 'در انتظار', color: '#faad14', icon: '⏳', order: 2, isSystem: true },
  { group: 'letter_status', key: 'approved', label: 'تایید شده', color: '#52c41a', icon: '✅', order: 3, isSystem: true },
  { group: 'letter_status', key: 'rejected', label: 'رد شده', color: '#ff4d4f', icon: '❌', order: 4, isSystem: true },
  { group: 'letter_status', key: 'archived', label: 'بایگانی شده', color: '#8c8c8c', icon: '📦', order: 5, isSystem: true },
  
  // =============================================
  // وضعیت اموال
  // =============================================
  { group: 'hardware_status', key: 'active', label: 'فعال', color: '#52c41a', icon: '✅', order: 1, isSystem: true },
  { group: 'hardware_status', key: 'in_stock', label: 'در انبار', color: '#faad14', icon: '📦', order: 2, isSystem: true },
  { group: 'hardware_status', key: 'repair', label: 'در تعمیر', color: '#ff4d4f', icon: '🔧', order: 3, isSystem: true },
  { group: 'hardware_status', key: 'archived', label: 'بایگانی', color: '#8c8c8c', icon: '📁', order: 4, isSystem: true },
  { group: 'hardware_status', key: 'disposed', label: 'اسقاط', color: '#8c8c8c', icon: '🗑️', order: 5, isSystem: true },
  
  // =============================================
  // وضعیت تیکت
  // =============================================
  { group: 'ticket_status', key: 'open', label: 'باز', color: '#faad14', icon: '🟡', order: 1, isSystem: true },
  { group: 'ticket_status', key: 'in_progress', label: 'در حال بررسی', color: '#1677ff', icon: '🔵', order: 2, isSystem: true },
  { group: 'ticket_status', key: 'resolved', label: 'حل شده', color: '#52c41a', icon: '🟢', order: 3, isSystem: true },
  { group: 'ticket_status', key: 'closed', label: 'بسته', color: '#8c8c8c', icon: '⚪', order: 4, isSystem: true },
  
  // =============================================
  // اولویت تیکت
  // =============================================
  { group: 'ticket_priority', key: 'low', label: 'کم', color: '#8c8c8c', icon: '⬇️', order: 1, isSystem: true },
  { group: 'ticket_priority', key: 'medium', label: 'متوسط', color: '#faad14', icon: '➡️', order: 2, isSystem: true },
  { group: 'ticket_priority', key: 'high', label: 'بالا', color: '#ff4d4f', icon: '⬆️', order: 3, isSystem: true },
  { group: 'ticket_priority', key: 'urgent', label: 'فوری', color: '#ff4d4f', icon: '🔴', order: 4, isSystem: true },
  
  // =============================================
  // سطح دسترسی
  // =============================================
  { group: 'access_level', key: 'public', label: 'عمومی', color: '#52c41a', icon: '🌐', order: 1, isSystem: true },
  { group: 'access_level', key: 'restricted', label: 'محدود', color: '#faad14', icon: '🔒', order: 2, isSystem: true },
  { group: 'access_level', key: 'confidential', label: 'محرمانه', color: '#ff4d4f', icon: '🔐', order: 3, isSystem: true },
  
  // =============================================
  // نوع فایل
  // =============================================
  { group: 'file_type', key: 'pdf', label: 'PDF', color: '#ff4d4f', icon: '📄', order: 1, isSystem: true },
  { group: 'file_type', key: 'image', label: 'تصویر', color: '#52c41a', icon: '🖼️', order: 2, isSystem: true },
  { group: 'file_type', key: 'office', label: 'آفیس', color: '#1677ff', icon: '📊', order: 3, isSystem: true },
  { group: 'file_type', key: 'other', label: 'سایر', color: '#8c8c8c', icon: '📁', order: 4, isSystem: true },
  
  // =============================================
  // سطح دسترسی رمزها
  // =============================================
  { group: 'credential_level', key: 'admin', label: 'مدیر', color: '#ff4d4f', icon: '👑', order: 1, isSystem: true },
  { group: 'credential_level', key: 'network', label: 'شبکه', color: '#1677ff', icon: '🌐', order: 2, isSystem: true },
  { group: 'credential_level', key: 'support', label: 'پشتیبانی', color: '#52c41a', icon: '🛠️', order: 3, isSystem: true },
  { group: 'credential_level', key: 'all', label: 'همه', color: '#8c8c8c', icon: '👥', order: 4, isSystem: true },
  
  // =============================================
  // اقدامات لاگ
  // =============================================
  { group: 'audit_action', key: 'CREATE', label: 'ایجاد', color: '#52c41a', icon: '➕', order: 1, isSystem: true },
  { group: 'audit_action', key: 'UPDATE', label: 'ویرایش', color: '#1677ff', icon: '✏️', order: 2, isSystem: true },
  { group: 'audit_action', key: 'DELETE', label: 'حذف', color: '#ff4d4f', icon: '🗑️', order: 3, isSystem: true },
  { group: 'audit_action', key: 'LOGIN', label: 'ورود', color: '#52c41a', icon: '🔑', order: 4, isSystem: true },
  { group: 'audit_action', key: 'LOGOUT', label: 'خروج', color: '#8c8c8c', icon: '🚪', order: 5, isSystem: true },
  
  // =============================================
  // ماژول‌های لاگ
  // =============================================
  { group: 'audit_module', key: 'HARDWARE', label: 'اموال', color: '#1677ff', icon: '💻', order: 1, isSystem: true },
  { group: 'audit_module', key: 'CREDENTIAL', label: 'رمزها', color: '#faad14', icon: '🔐', order: 2, isSystem: true },
  { group: 'audit_module', key: 'DOCUMENT', label: 'اسناد', color: '#52c41a', icon: '📄', order: 3, isSystem: true },
  { group: 'audit_module', key: 'TICKET', label: 'تیکت', color: '#722ed1', icon: '🎫', order: 4, isSystem: true },
  { group: 'audit_module', key: 'USER', label: 'کاربران', color: '#13c2c2', icon: '👤', order: 5, isSystem: true },
  { group: 'audit_module', key: 'LETTER', label: 'نامه', color: '#1677ff', icon: '✉️', order: 6, isSystem: true },
  { group: 'audit_module', key: 'AUTH', label: 'احراز هویت', color: '#faad14', icon: '🔑', order: 7, isSystem: true },
];

const seedEnumValues = async () => {
  try {
    console.log('🔄 شروع ایجاد مقادیر Enum...');
    
    for (const item of enumData) {
      await EnumValue.findOneAndUpdate(
        { group: item.group, key: item.key },
        item,
        { upsert: true, returnDocument: 'after' }
      );
    }
    
    console.log(`✅ ${enumData.length} مقدار Enum با موفقیت ایجاد شدند`);
    return { success: true, count: enumData.length };
  } catch (error) {
    console.error('❌ خطا در ایجاد مقادیر Enum:', error.message);
    throw error;
  }
};

module.exports = seedEnumValues;
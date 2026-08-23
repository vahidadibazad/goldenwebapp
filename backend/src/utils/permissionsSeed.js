const Permission = require('../models/Permission');

const permissions = [
  // =============================================
  // ✅ مجوزهای موجود (دست نخورده)
  // =============================================
  
  // ---------- اموال (Hardware) ----------
  { name: 'view_hardware', label: 'مشاهده اموال', module: 'hardware' },
  { name: 'create_hardware', label: 'ثبت اموال', module: 'hardware' },
  { name: 'edit_hardware', label: 'ویرایش اموال', module: 'hardware' },
  { name: 'delete_hardware', label: 'حذف اموال', module: 'hardware' },

  // ---------- رمزها (Credential) ----------
  { name: 'view_credential', label: 'مشاهده رمزها', module: 'credential' },
  { name: 'create_credential', label: 'ثبت رمز', module: 'credential' },
  { name: 'edit_credential', label: 'ویرایش رمز', module: 'credential' },
  { name: 'delete_credential', label: 'حذف رمز', module: 'credential' },

  // ---------- اسناد (Document) ----------
  { name: 'view_document', label: 'مشاهده اسناد', module: 'document' },
  { name: 'upload_document', label: 'آپلود سند', module: 'document' },
  { name: 'edit_document', label: 'ویرایش سند', module: 'document' },
  { name: 'delete_document', label: 'حذف سند', module: 'document' },
  { name: 'view_confidential', label: 'مشاهده اسناد محرمانه', module: 'document' },
  { name: 'view_restricted', label: 'مشاهده اسناد محدود', module: 'document' },

  // ---------- تیکت‌ها (Ticket) ----------
  { name: 'view_ticket', label: 'مشاهده تیکت‌ها', module: 'ticket' },
  { name: 'create_ticket', label: 'ثبت تیکت', module: 'ticket' },
  { name: 'edit_ticket', label: 'ویرایش تیکت', module: 'ticket' },
  { name: 'delete_ticket', label: 'حذف تیکت', module: 'ticket' },

  // ---------- کاربران (User) ----------
  { name: 'view_user', label: 'مشاهده کاربران', module: 'user' },
  { name: 'create_user', label: 'ثبت کاربر', module: 'user' },
  { name: 'edit_user', label: 'ویرایش کاربر', module: 'user' },
  { name: 'delete_user', label: 'حذف کاربر', module: 'user' },

  // ---------- دسته‌بندی‌ها (Category) ----------
  { name: 'view_category', label: 'مشاهده دسته‌بندی‌ها', module: 'category' },
  { name: 'create_category', label: 'ثبت دسته‌بندی', module: 'category' },
  { name: 'edit_category', label: 'ویرایش دسته‌بندی', module: 'category' },
  { name: 'delete_category', label: 'حذف دسته‌بندی', module: 'category' },

  // ---------- تاریخچه (Audit) ----------
  { name: 'view_audit', label: 'مشاهده تاریخچه', module: 'audit' },

  // ---------- نقش‌ها و مجوزها (Role & Permission) ----------
  { name: 'manage_roles', label: 'مدیریت نقش‌ها', module: 'role' },
  { name: 'manage_permissions', label: 'مدیریت مجوزها', module: 'permission' },

  // =============================================
  // ✅ مجوزهای جدید - نامه‌ها (Letter)
  // =============================================
  { 
    name: 'view_letters', 
    label: 'مشاهده نامه‌ها', 
    module: 'letter',
    description: 'دسترسی به لیست و جزئیات نامه‌ها'
  },
  { 
    name: 'create_letter', 
    label: 'ثبت نامه', 
    module: 'letter',
    description: 'ایجاد نامه جدید'
  },
  { 
    name: 'edit_letter', 
    label: 'ویرایش نامه', 
    module: 'letter',
    description: 'ویرایش نامه‌های موجود'
  },
  { 
    name: 'delete_letter', 
    label: 'حذف نامه', 
    module: 'letter',
    description: 'حذف نامه‌ها'
  },
  { 
    name: 'sign_letter', 
    label: 'امضای نامه', 
    module: 'letter',
    description: 'امضای دیجیتال نامه‌ها'
  },
  { 
    name: 'approve_letter', 
    label: 'تایید نامه', 
    module: 'letter',
    description: 'تایید نهایی نامه‌ها'
  },
  { 
    name: 'forward_letter', 
    label: 'ارجاع نامه', 
    module: 'letter',
    description: 'ارجاع نامه به واحد یا شخص دیگر'
  },
  { 
    name: 'archive_letter', 
    label: 'بایگانی نامه', 
    module: 'letter',
    description: 'بایگانی نامه‌ها'
  },

  // =============================================
  // ✅ مجوزهای جدید - گردش کار (Workflow)
  // =============================================
  { 
    name: 'manage_workflow', 
    label: 'مدیریت گردش کار', 
    module: 'workflow',
    description: 'ایجاد، ویرایش و حذف گردش‌های کاری'
  },
  { 
    name: 'view_workflow', 
    label: 'مشاهده گردش کار', 
    module: 'workflow',
    description: 'مشاهده گردش‌های کاری و وضعیت آنها'
  },
  { 
    name: 'approve_workflow', 
    label: 'تایید گردش کار', 
    module: 'workflow',
    description: 'تایید مراحل گردش کار'
  },
  { 
    name: 'reject_workflow', 
    label: 'رد گردش کار', 
    module: 'workflow',
    description: 'رد مراحل گردش کار'
  },
  { 
    name: 'assign_workflow', 
    label: 'اختصاص گردش کار', 
    module: 'workflow',
    description: 'اختصاص گردش کار به کاربران'
  },

  // =============================================
  // ✅ مجوزهای جدید - واحدها (Department)
  // =============================================
  { 
    name: 'manage_departments', 
    label: 'مدیریت واحدها', 
    module: 'department',
    description: 'ایجاد، ویرایش و حذف واحدهای سازمانی'
  },
  { 
    name: 'view_departments', 
    label: 'مشاهده واحدها', 
    module: 'department',
    description: 'مشاهده واحدهای سازمانی'
  },

  // =============================================
  // ✅ مجوزهای جدید - امضا (Signature)
  // =============================================
  { 
    name: 'manage_signatures', 
    label: 'مدیریت امضاها', 
    module: 'signature',
    description: 'مدیریت امضای دیجیتال کاربران'
  },
  { 
    name: 'view_signatures', 
    label: 'مشاهده امضاها', 
    module: 'signature',
    description: 'مشاهده تاریخچه امضاها'
  },
  { 
    name: 'request_signature', 
    label: 'درخواست امضا', 
    module: 'signature',
    description: 'درخواست امضا از کاربران دیگر'
  },

  // =============================================
  // ✅ مجوزهای جدید - مدیریت سازمانی
  // =============================================
  { 
    name: 'manage_organization', 
    label: 'مدیریت سازمانی', 
    module: 'organization',
    description: 'مدیریت ساختار سازمانی و تنظیمات کلان'
  },

  // =============================================
  // ✅ مجوزهای جدید - اخطارها (Reminder)
  // =============================================
  { 
    name: 'manage_reminders', 
    label: 'مدیریت اخطارها', 
    module: 'reminder',
    description: 'مدیریت تنظیمات و زمان‌بندی اخطارها'
  },
  { 
    name: 'view_reminders', 
    label: 'مشاهده اخطارها', 
    module: 'reminder',
    description: 'مشاهده اخطارها و تاریخچه آنها'
  },

  // =============================================
  // ✅ مجوزهای جدید - گزارش‌ها (Report)
  // =============================================
  { 
    name: 'view_reports', 
    label: 'مشاهده گزارش‌ها', 
    module: 'report',
    description: 'دسترسی به گزارش‌های مدیریتی'
  },
  { 
    name: 'export_reports', 
    label: 'خروجی گزارش‌ها', 
    module: 'report',
    description: 'خروجی گرفتن از گزارش‌ها (Excel, PDF)'
  },
];

// =============================================
// ✅ تابع سیدر
// =============================================
const seedPermissions = async () => {
  try {
    console.log('🔄 شروع ایجاد مجوزها...');
    
    for (const perm of permissions) {
      await Permission.findOneAndUpdate(
        { name: perm.name },
        perm,
        { upsert: true, returnDocument: 'after' }
      );
    }
    
    console.log(`✅ ${permissions.length} مجوز با موفقیت ایجاد/به‌روزرسانی شدند`);
    return { success: true, count: permissions.length };
  } catch (error) {
    console.error('❌ خطا در ایجاد مجوزها:', error.message);
    throw error;
  }
};

module.exports = { permissions, seedPermissions };
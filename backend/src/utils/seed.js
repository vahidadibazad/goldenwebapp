// backend/src/utils/seed.js
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const User = require('../models/User');
const EnumValue = require('../models/EnumValue');
const SystemSetting = require('../models/SystemSetting');
const MenuItem = require('../models/MenuItem');
const bcrypt = require('bcryptjs');

// =============================================
// لیست کامل مجوزهای سیستم
// =============================================
const PERMISSIONS = [
  // ========== اموال (Hardware) ==========
  { name: 'view_hardware', label: 'مشاهده اموال', module: 'hardware' },
  { name: 'create_hardware', label: 'ثبت اموال', module: 'hardware' },
  { name: 'edit_hardware', label: 'ویرایش اموال', module: 'hardware' },
  { name: 'delete_hardware', label: 'حذف اموال', module: 'hardware' },
  { name: 'assign_hardware', label: 'تخصیص اموال', module: 'hardware' },

  // ========== رمزها (Credential) ==========
  { name: 'view_credential', label: 'مشاهده رمزها', module: 'credential' },
  { name: 'create_credential', label: 'ثبت رمز', module: 'credential' },
  { name: 'edit_credential', label: 'ویرایش رمز', module: 'credential' },
  { name: 'delete_credential', label: 'حذف رمز', module: 'credential' },

  // ========== اسناد (Document) ==========
  { name: 'view_document', label: 'مشاهده اسناد', module: 'document' },
  { name: 'upload_document', label: 'آپلود سند', module: 'document' },
  { name: 'edit_document', label: 'ویرایش سند', module: 'document' },
  { name: 'delete_document', label: 'حذف سند', module: 'document' },
  { name: 'view_confidential_document', label: 'مشاهده اسناد محرمانه', module: 'document' },
  { name: 'view_restricted_document', label: 'مشاهده اسناد محدود', module: 'document' },

  // ========== تیکت‌ها (Ticket) ==========
  { name: 'view_ticket', label: 'مشاهده تیکت‌ها', module: 'ticket' },
  { name: 'create_ticket', label: 'ثبت تیکت', module: 'ticket' },
  { name: 'edit_ticket', label: 'ویرایش تیکت', module: 'ticket' },
  { name: 'delete_ticket', label: 'حذف تیکت', module: 'ticket' },
  { name: 'assign_ticket', label: 'اختصاص تیکت', module: 'ticket' },
  { name: 'resolve_ticket', label: 'حل تیکت', module: 'ticket' },

  // ========== کاربران (User) ==========
  { name: 'view_user', label: 'مشاهده کاربران', module: 'user' },
  { name: 'create_user', label: 'ثبت کاربر', module: 'user' },
  { name: 'edit_user', label: 'ویرایش کاربر', module: 'user' },
  { name: 'delete_user', label: 'حذف کاربر', module: 'user' },
  { name: 'activate_user', label: 'فعال/غیرفعال کردن کاربر', module: 'user' },

  // ========== دسته‌بندی‌ها (Category) ==========
  { name: 'view_category', label: 'مشاهده دسته‌بندی‌ها', module: 'category' },
  { name: 'create_category', label: 'ثبت دسته‌بندی', module: 'category' },
  { name: 'edit_category', label: 'ویرایش دسته‌بندی', module: 'category' },
  { name: 'delete_category', label: 'حذف دسته‌بندی', module: 'category' },

  // ========== تاریخچه (Audit) ==========
  { name: 'view_audit', label: 'مشاهده تاریخچه', module: 'audit' },
  { name: 'export_audit', label: 'خروجی تاریخچه', module: 'audit' },

  // ========== نقش‌ها و مجوزها (Role & Permission) ==========
  { name: 'manage_roles', label: 'مدیریت نقش‌ها', module: 'role' },
  { name: 'manage_permissions', label: 'مدیریت مجوزها', module: 'permission' },

  // ========== واحدها (Department) ==========
  { name: 'view_departments', label: 'مشاهده واحدها', module: 'department' },
  { name: 'manage_departments', label: 'مدیریت واحدها', module: 'department' },
  { name: 'delete_department', label: 'حذف واحد', module: 'department' },

  // ========== نامه‌ها (Letter) ==========
  { name: 'view_letters', label: 'مشاهده نامه‌ها', module: 'letter' },
  { name: 'create_letter', label: 'ثبت نامه', module: 'letter' },
  { name: 'edit_letter', label: 'ویرایش نامه', module: 'letter' },
  { name: 'delete_letter', label: 'حذف نامه', module: 'letter' },
  { name: 'sign_letter', label: 'امضای نامه', module: 'letter' },
  { name: 'approve_letter', label: 'تایید نامه', module: 'letter' },
  { name: 'reject_letter', label: 'رد نامه', module: 'letter' },
  { name: 'forward_letter', label: 'ارجاع نامه', module: 'letter' },
  { name: 'archive_letter', label: 'بایگانی نامه', module: 'letter' },

  // ========== گردش کار (Workflow) ==========
  { name: 'view_workflow', label: 'مشاهده گردش کار', module: 'workflow' },
  { name: 'manage_workflow', label: 'مدیریت گردش کار', module: 'workflow' },
  { name: 'delete_workflow', label: 'حذف گردش کار', module: 'workflow' },
  { name: 'approve_workflow', label: 'تایید گردش کار', module: 'workflow' },
  { name: 'reject_workflow', label: 'رد گردش کار', module: 'workflow' },
  { name: 'assign_workflow', label: 'اختصاص گردش کار', module: 'workflow' },

  // ========== امضا (Signature) ==========
  { name: 'view_signatures', label: 'مشاهده امضاها', module: 'signature' },
  { name: 'manage_signatures', label: 'مدیریت امضاها', module: 'signature' },
  { name: 'request_signature', label: 'درخواست امضا', module: 'signature' },
  { name: 'verify_signature', label: 'تایید امضا', module: 'signature' },
  { name: 'reject_signature', label: 'رد امضا', module: 'signature' },

  // ========== دبیرخانه (Secretariat) ==========
  { name: 'view_secretariats', label: 'مشاهده دبیرخانه‌ها', module: 'secretariat' },
  { name: 'manage_secretariats', label: 'مدیریت دبیرخانه‌ها', module: 'secretariat' },
  { name: 'delete_secretariat', label: 'حذف دبیرخانه', module: 'secretariat' },

  // ========== بایگانی (Archive) ==========
  { name: 'view_archives', label: 'مشاهده بایگانی', module: 'archive' },
  { name: 'manage_archives', label: 'مدیریت بایگانی', module: 'archive' },
  { name: 'delete_archive', label: 'حذف بایگانی', module: 'archive' },
  { name: 'move_to_archive', label: 'انتقال به بایگانی', module: 'archive' },

  // ========== گزارشات (Report) ==========
  { name: 'view_reports', label: 'مشاهده گزارشات', module: 'report' },
  { name: 'create_report', label: 'ایجاد گزارش', module: 'report' },
  { name: 'edit_report', label: 'ویرایش گزارش', module: 'report' },
  { name: 'delete_report', label: 'حذف گزارش', module: 'report' },
  { name: 'export_report', label: 'خروجی گزارش', module: 'report' },
  { name: 'generate_report', label: 'تولید گزارش', module: 'report' },

  // ========== اخطارها (Reminder) ==========
  { name: 'view_reminders', label: 'مشاهده اخطارها', module: 'reminder' },
  { name: 'manage_reminders', label: 'مدیریت اخطارها', module: 'reminder' },
  { name: 'send_reminder', label: 'ارسال اخطار', module: 'reminder' },

  // ========== داشبورد (Dashboard) ==========
  { name: 'view_dashboard', label: 'مشاهده داشبورد', module: 'dashboard' },
  { name: 'customize_dashboard', label: 'سفارشی‌سازی داشبورد', module: 'dashboard' },

  // ========== تنظیمات سیستم (Settings) ==========
  { name: 'view_settings', label: 'مشاهده تنظیمات', module: 'settings' },
  { name: 'manage_settings', label: 'مدیریت تنظیمات', module: 'settings' },

  // ========== وب‌هوک (Webhook) ==========
  { name: 'view_webhooks', label: 'مشاهده وب‌هوک‌ها', module: 'webhook' },
  { name: 'manage_webhooks', label: 'مدیریت وب‌هوک‌ها', module: 'webhook' },
  { name: 'delete_webhook', label: 'حذف وب‌هوک', module: 'webhook' },

  // ========== یکپارچه‌سازی (Integration) ==========
  { name: 'manage_integrations', label: 'مدیریت یکپارچه‌سازی', module: 'integration' },

  // ========== فکس (Fax) ==========
  { name: 'view_fax', label: 'مشاهده فکس', module: 'fax' },
  { name: 'send_fax', label: 'ارسال فکس', module: 'fax' },
  { name: 'delete_fax', label: 'حذف فکس', module: 'fax' },

  // ========== ایمیل (Email) ==========
  { name: 'manage_email', label: 'مدیریت ایمیل', module: 'email' },
];

// =============================================
// لیست نقش‌های پیش‌فرض
// =============================================
const ROLES = [
  {
    name: 'admin',
    label: 'مدیر کل',
    description: 'دسترسی کامل به تمام بخش‌های سیستم',
    isSystem: true,
    permissionNames: PERMISSIONS.map((p) => p.name),
  },
  {
    name: 'office_manager',
    label: 'مدیر اداری',
    description: 'مدیریت مکاتبات، گردش کار و امضاها',
    isSystem: true,
    permissionNames: [
      'view_letters', 'create_letter', 'edit_letter', 'delete_letter',
      'sign_letter', 'approve_letter', 'reject_letter', 'forward_letter', 'archive_letter',
      'view_workflow', 'approve_workflow', 'reject_workflow', 'assign_workflow',
      'view_signatures', 'request_signature', 'verify_signature',
      'view_secretariats', 'view_archives', 'move_to_archive',
      'view_reports', 'export_report', 'generate_report',
      'view_reminders', 'send_reminder',
      'view_dashboard', 'view_departments', 'view_hardware',
      'view_document', 'upload_document', 'view_ticket', 'create_ticket', 'view_user',
    ],
  },
  {
    name: 'department_manager',
    label: 'مدیر واحد',
    description: 'مدیریت واحد خود و تایید درخواست‌ها',
    isSystem: true,
    permissionNames: [
      'view_hardware', 'assign_hardware',
      'view_document', 'upload_document',
      'view_ticket', 'create_ticket', 'resolve_ticket',
      'view_user', 'view_departments',
      'view_letters', 'create_letter', 'edit_letter',
      'sign_letter', 'approve_letter', 'reject_letter', 'forward_letter',
      'view_workflow', 'approve_workflow', 'reject_workflow',
      'view_signatures', 'request_signature',
      'view_archives', 'view_reports', 'view_reminders', 'view_dashboard',
    ],
  },
  {
    name: 'office_staff',
    label: 'کارمند اداری',
    description: 'ثبت و پیگیری نامه‌ها',
    isSystem: true,
    permissionNames: [
      'view_hardware', 'view_document', 'upload_document',
      'view_ticket', 'create_ticket', 'view_departments',
      'view_letters', 'create_letter', 'edit_letter', 'forward_letter',
      'view_workflow', 'view_signatures', 'request_signature',
      'view_archives', 'view_reports', 'view_reminders', 'view_dashboard',
    ],
  },
  {
    name: 'network_manager',
    label: 'مدیر شبکه',
    description: 'مدیریت رمزها و تجهیزات شبکه',
    isSystem: true,
    permissionNames: [
      'view_hardware', 'create_hardware', 'edit_hardware', 'assign_hardware',
      'view_credential', 'create_credential', 'edit_credential', 'delete_credential',
      'view_document', 'upload_document',
      'view_ticket', 'create_ticket', 'resolve_ticket',
      'view_departments', 'view_letters', 'view_reports', 'view_dashboard',
    ],
  },
  {
    name: 'support',
    label: 'پشتیبانی',
    description: 'مدیریت تیکت‌ها و مشاهده اموال',
    isSystem: true,
    permissionNames: [
      'view_hardware', 'view_document', 'upload_document',
      'view_ticket', 'create_ticket', 'edit_ticket', 'delete_ticket', 'assign_ticket', 'resolve_ticket',
      'view_user', 'view_category', 'view_departments',
      'view_letters', 'view_reports', 'view_dashboard',
    ],
  },
  {
    name: 'user',
    label: 'کاربر عادی',
    description: 'مشاهده اموال و ثبت تیکت',
    isSystem: true,
    permissionNames: [
      'view_hardware', 'view_document', 'view_ticket', 'create_ticket',
      'view_departments', 'view_letters', 'view_dashboard',
    ],
  },
];

// =============================================
// مقادیر Enum
// =============================================
const ENUM_VALUES = [
  // انواع نامه
  { group: 'letter_type', key: 'incoming', label: 'ورودی', color: '#1677ff', icon: '📥', order: 1, isSystem: true },
  { group: 'letter_type', key: 'outgoing', label: 'خروجی', color: '#52c41a', icon: '📤', order: 2, isSystem: true },
  { group: 'letter_type', key: 'internal', label: 'داخلی', color: '#faad14', icon: '📋', order: 3, isSystem: true },

  // وضعیت نامه
  { group: 'letter_status', key: 'draft', label: 'پیش‌نویس', color: '#8c8c8c', icon: '📝', order: 1, isSystem: true },
  { group: 'letter_status', key: 'registered', label: 'ثبت شده', color: '#1677ff', icon: '📋', order: 2, isSystem: true },
  { group: 'letter_status', key: 'in_review', label: 'در جریان بررسی', color: '#faad14', icon: '🔄', order: 3, isSystem: true },
  { group: 'letter_status', key: 'approved', label: 'تایید شده', color: '#52c41a', icon: '✅', order: 4, isSystem: true },
  { group: 'letter_status', key: 'rejected', label: 'رد شده', color: '#ff4d4f', icon: '❌', order: 5, isSystem: true },
  { group: 'letter_status', key: 'signed', label: 'امضا شده', color: '#722ed1', icon: '✍️', order: 6, isSystem: true },
  { group: 'letter_status', key: 'archived', label: 'بایگانی شده', color: '#8c8c8c', icon: '📦', order: 7, isSystem: true },

  // وضعیت اموال
  { group: 'hardware_status', key: 'active', label: 'فعال', color: '#52c41a', icon: '✅', order: 1, isSystem: true },
  { group: 'hardware_status', key: 'in_stock', label: 'در انبار', color: '#faad14', icon: '📦', order: 2, isSystem: true },
  { group: 'hardware_status', key: 'repair', label: 'در تعمیر', color: '#ff4d4f', icon: '🔧', order: 3, isSystem: true },
  { group: 'hardware_status', key: 'archived', label: 'بایگانی', color: '#8c8c8c', icon: '📁', order: 4, isSystem: true },
  { group: 'hardware_status', key: 'disposed', label: 'اسقاط', color: '#8c8c8c', icon: '🗑️', order: 5, isSystem: true },

  // وضعیت تیکت
  { group: 'ticket_status', key: 'open', label: 'باز', color: '#faad14', icon: '🟡', order: 1, isSystem: true },
  { group: 'ticket_status', key: 'in_progress', label: 'در حال بررسی', color: '#1677ff', icon: '🔵', order: 2, isSystem: true },
  { group: 'ticket_status', key: 'resolved', label: 'حل شده', color: '#52c41a', icon: '🟢', order: 3, isSystem: true },
  { group: 'ticket_status', key: 'closed', label: 'بسته', color: '#8c8c8c', icon: '⚪', order: 4, isSystem: true },

  // اولویت
  { group: 'ticket_priority', key: 'low', label: 'کم', color: '#8c8c8c', icon: '⬇️', order: 1, isSystem: true },
  { group: 'ticket_priority', key: 'medium', label: 'متوسط', color: '#faad14', icon: '➡️', order: 2, isSystem: true },
  { group: 'ticket_priority', key: 'high', label: 'بالا', color: '#ff4d4f', icon: '⬆️', order: 3, isSystem: true },
  { group: 'ticket_priority', key: 'urgent', label: 'فوری', color: '#ff4d4f', icon: '🔴', order: 4, isSystem: true },

  // سطح دسترسی
  { group: 'access_level', key: 'public', label: 'عمومی', color: '#52c41a', icon: '🌐', order: 1, isSystem: true },
  { group: 'access_level', key: 'restricted', label: 'محدود', color: '#faad14', icon: '🔒', order: 2, isSystem: true },
  { group: 'access_level', key: 'confidential', label: 'محرمانه', color: '#ff4d4f', icon: '🔐', order: 3, isSystem: true },

  // نوع فایل
  { group: 'file_type', key: 'pdf', label: 'PDF', color: '#ff4d4f', icon: '📄', order: 1, isSystem: true },
  { group: 'file_type', key: 'image', label: 'تصویر', color: '#52c41a', icon: '🖼️', order: 2, isSystem: true },
  { group: 'file_type', key: 'office', label: 'آفیس', color: '#1677ff', icon: '📊', order: 3, isSystem: true },
  { group: 'file_type', key: 'other', label: 'سایر', color: '#8c8c8c', icon: '📁', order: 4, isSystem: true },

  // سطح دسترسی رمزها
  { group: 'credential_level', key: 'admin', label: 'مدیر', color: '#ff4d4f', icon: '👑', order: 1, isSystem: true },
  { group: 'credential_level', key: 'network', label: 'شبکه', color: '#1677ff', icon: '🌐', order: 2, isSystem: true },
  { group: 'credential_level', key: 'support', label: 'پشتیبانی', color: '#52c41a', icon: '🛠️', order: 3, isSystem: true },
  { group: 'credential_level', key: 'all', label: 'همه', color: '#8c8c8c', icon: '👥', order: 4, isSystem: true },

  // اقدامات لاگ
  { group: 'audit_action', key: 'CREATE', label: 'ایجاد', color: '#52c41a', icon: '➕', order: 1, isSystem: true },
  { group: 'audit_action', key: 'UPDATE', label: 'ویرایش', color: '#1677ff', icon: '✏️', order: 2, isSystem: true },
  { group: 'audit_action', key: 'DELETE', label: 'حذف', color: '#ff4d4f', icon: '🗑️', order: 3, isSystem: true },
  { group: 'audit_action', key: 'LOGIN', label: 'ورود', color: '#52c41a', icon: '🔑', order: 4, isSystem: true },
  { group: 'audit_action', key: 'LOGOUT', label: 'خروج', color: '#8c8c8c', icon: '🚪', order: 5, isSystem: true },

  // ماژول‌های لاگ
  { group: 'audit_module', key: 'HARDWARE', label: 'اموال', color: '#1677ff', icon: '💻', order: 1, isSystem: true },
  { group: 'audit_module', key: 'CREDENTIAL', label: 'رمزها', color: '#faad14', icon: '🔐', order: 2, isSystem: true },
  { group: 'audit_module', key: 'DOCUMENT', label: 'اسناد', color: '#52c41a', icon: '📄', order: 3, isSystem: true },
  { group: 'audit_module', key: 'TICKET', label: 'تیکت', color: '#722ed1', icon: '🎫', order: 4, isSystem: true },
  { group: 'audit_module', key: 'USER', label: 'کاربران', color: '#13c2c2', icon: '👤', order: 5, isSystem: true },
  { group: 'audit_module', key: 'LETTER', label: 'نامه', color: '#1677ff', icon: '✉️', order: 6, isSystem: true },
  { group: 'audit_module', key: 'AUTH', label: 'احراز هویت', color: '#faad14', icon: '🔑', order: 7, isSystem: true },
];

// =============================================
// آیتم‌های منو
// =============================================
const MENU_ITEMS = [
  { key: 'dashboard', label: 'داشبورد', icon: 'DashboardOutlined', path: '/', order: 1, showInSidebar: true, isSystem: true },
  { key: 'hardware', label: 'اموال', icon: 'AppstoreOutlined', path: '/hardware', order: 10, showInSidebar: true, isSystem: true },
  { key: 'credentials', label: 'رمزها', icon: 'SafetyOutlined', path: '/credentials', order: 11, showInSidebar: true, isSystem: true },
  { key: 'documents', label: 'اسناد', icon: 'FileTextOutlined', path: '/documents', order: 12, showInSidebar: true, isSystem: true },
  { key: 'tickets', label: 'تیکت‌ها', icon: 'TagOutlined', path: '/tickets', order: 13, showInSidebar: true, isSystem: true },
  { key: 'tickets_new', label: 'تیکت جدید', icon: 'PlusOutlined', path: '/tickets/new', order: 14, showInSidebar: true, isSystem: true },
  { key: 'letters_inbox', label: 'صندوق ورودی', icon: 'InboxOutlined', path: '/letters/inbox', order: 20, showInSidebar: true, isSystem: true },
  { key: 'letters_outbox', label: 'صندوق خروجی', icon: 'ExportOutlined', path: '/letters/outbox', order: 21, showInSidebar: true, isSystem: true },
  { key: 'letters_pending', label: 'در انتظار تایید', icon: 'ClockCircleOutlined', path: '/letters/pending', order: 22, showInSidebar: true, isSystem: true },
  { key: 'letters_new', label: 'نامه جدید', icon: 'PlusOutlined', path: '/letters/new', order: 23, showInSidebar: true, isSystem: true },
  { key: 'secretariats', label: 'دبیرخانه‌ها', icon: 'BankOutlined', path: '/secretariats', order: 30, showInSidebar: true, isSystem: true },
  { key: 'correspondence', label: 'نامه‌ها', icon: 'FileTextOutlined', path: '/correspondence', order: 31, showInSidebar: true, isSystem: true },
  { key: 'archive', label: 'بایگانی', icon: 'FolderOutlined', path: '/archive', order: 32, showInSidebar: true, isSystem: true },
  { key: 'reports', label: 'گزارشات', icon: 'AuditOutlined', path: '/reports', order: 33, showInSidebar: true, isSystem: true },
  { key: 'departments', label: 'واحدها', icon: 'ApartmentOutlined', path: '/departments', order: 40, showInSidebar: true, isSystem: true },
  { key: 'workflow', label: 'گردش کار', icon: 'ShareAltOutlined', path: '/workflow', order: 41, showInSidebar: true, isSystem: true },
  { key: 'signatures', label: 'امضاها', icon: 'SignatureOutlined', path: '/signatures', order: 42, showInSidebar: true, isSystem: true },
  { key: 'fax', label: 'فکس', icon: 'PhoneOutlined', path: '/fax', order: 43, showInSidebar: true, isSystem: true },
  { key: 'webhooks', label: 'وب‌هوک', icon: 'GlobalOutlined', path: '/webhooks', order: 44, showInSidebar: true, isSystem: true },
  { key: 'email_inbox', label: 'دریافت ایمیل', icon: 'InboxOutlined', path: '/email/inbox', order: 45, showInSidebar: true, isSystem: true },
  { key: 'email_settings', label: 'تنظیمات ایمیل', icon: 'SettingOutlined', path: '/email/settings', order: 46, showInSidebar: true, isSystem: true },
  { key: 'users', label: 'کاربران', icon: 'TeamOutlined', path: '/users', order: 50, showInSidebar: true, isSystem: true },
  { key: 'roles', label: 'نقش‌ها', icon: 'SafetyCertificateOutlined', path: '/roles', order: 51, showInSidebar: true, isSystem: true },
  { key: 'settings', label: 'تنظیمات سیستم', icon: 'SettingOutlined', path: '/settings', order: 52, showInSidebar: true, isSystem: true },
  { key: 'audit', label: 'تاریخچه', icon: 'AuditOutlined', path: '/audit', order: 53, showInSidebar: true, isSystem: true },
];

// =============================================
// تنظیمات سیستم پیش‌فرض
// =============================================
const SYSTEM_SETTINGS = [
  { key: 'site_title', value: 'سامانه یکپارچه مدیریت سازمانی', type: 'string', group: 'general', label: 'عنوان سایت', isSystem: true },
  { key: 'company_name', value: 'سازمان نمونه', type: 'string', group: 'general', label: 'نام سازمان', isSystem: true },
  { key: 'copyright', value: 'تمامی حقوق محفوظ است', type: 'string', group: 'general', label: 'متن کپی‌رایت', isSystem: true },
  { key: 'version', value: '2.0.0', type: 'string', group: 'general', label: 'نسخه سیستم', isSystem: true },
  { key: 'primary_color', value: '#1677ff', type: 'color', group: 'appearance', label: 'رنگ اصلی', isSystem: true },
  { key: 'default_theme', value: 'light', type: 'string', group: 'appearance', label: 'تم پیش‌فرض', isSystem: true },
  { key: 'maxLoginAttempts', value: 5, type: 'number', group: 'security', label: 'حداکثر تلاش برای ورود', isSystem: true },
  { key: 'sessionTimeout', value: 60, type: 'number', group: 'security', label: 'زمان نشست (دقیقه)', isSystem: true },
];

// =============================================
// تابع اصلی سیدر
// =============================================
const seedDatabase = async () => {
  console.log('🔄 شروع فرآیند سیدر...');

  try {
    // =============================================
    // ۱. ایجاد مجوزها
    // =============================================
    console.log('📝 ایجاد مجوزها...');
    const createdPermissions = {};

    for (const permData of PERMISSIONS) {
      const perm = await Permission.findOneAndUpdate(
        { name: permData.name },
        permData,
        { upsert: true, new: true }
      );
      createdPermissions[permData.name] = perm._id;
    }
    console.log(`✅ ${Object.keys(createdPermissions).length} مجوز ایجاد شد`);

    // =============================================
    // ۲. ایجاد نقش‌ها
    // =============================================
    console.log('📝 ایجاد نقش‌ها...');
    const createdRoles = {};

    for (const roleData of ROLES) {
      const permissionIds = roleData.permissionNames
        .map((name) => createdPermissions[name])
        .filter((id) => id);

      const role = await Role.findOneAndUpdate(
        { name: roleData.name },
        {
          name: roleData.name,
          label: roleData.label,
          description: roleData.description,
          isSystem: roleData.isSystem,
          permissions: permissionIds,
        },
        { upsert: true, new: true }
      );
      createdRoles[roleData.name] = role._id;
    }
    console.log(`✅ ${Object.keys(createdRoles).length} نقش ایجاد شد`);

    // =============================================
    // ۳. ایجاد مقادیر Enum
    // =============================================
    console.log('📝 ایجاد مقادیر Enum...');
    for (const item of ENUM_VALUES) {
      await EnumValue.findOneAndUpdate(
        { group: item.group, key: item.key },
        item,
        { upsert: true, new: true }
      );
    }
    console.log(`✅ ${ENUM_VALUES.length} مقدار Enum ایجاد شد`);

    // =============================================
    // ۴. ایجاد آیتم‌های منو
    // =============================================
    console.log('📝 ایجاد آیتم‌های منو...');
    for (const item of MENU_ITEMS) {
      await MenuItem.findOneAndUpdate(
        { key: item.key },
        item,
        { upsert: true, new: true }
      );
    }
    console.log(`✅ ${MENU_ITEMS.length} آیتم منو ایجاد شد`);

    // =============================================
    // ۵. ایجاد تنظیمات سیستم
    // =============================================
    console.log('📝 ایجاد تنظیمات سیستم...');
    for (const setting of SYSTEM_SETTINGS) {
      await SystemSetting.findOneAndUpdate(
        { key: setting.key },
        setting,
        { upsert: true, new: true }
      );
    }
    console.log(`✅ ${SYSTEM_SETTINGS.length} تنظیمات سیستم ایجاد شد`);

    // =============================================
    // ۶. ایجاد کاربر ادمین
    // =============================================
    console.log('📝 ایجاد کاربر ادمین...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    const adminUser = await User.findOneAndUpdate(
      { username: 'admin' },
      {
        username: 'admin',
        email: 'admin@example.com',
        fullName: 'مدیر سیستم',
        password: hashedPassword,
        role: createdRoles.admin,
        isActive: true,
      },
      { upsert: true, new: true }
    );
    console.log(`✅ کاربر ادمین ایجاد شد: ${adminUser.username}`);

    console.log('🎉 فرآیند سیدر با موفقیت انجام شد');
    return {
      success: true,
      permissions: Object.keys(createdPermissions).length,
      roles: Object.keys(createdRoles).length,
      enums: ENUM_VALUES.length,
      menuItems: MENU_ITEMS.length,
      settings: SYSTEM_SETTINGS.length,
    };
  } catch (error) {
    console.error('❌ خطا در سیدر:', error.message);
    throw error;
  }
};

// اگر فایل به‌صورت مستقیم اجرا شود
if (require.main === module) {
  const mongoose = require('mongoose');
  require('dotenv').config();

  mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/goldenweb')
    .then(async () => {
      console.log('✅ متصل به MongoDB');
      await seedDatabase();
      await mongoose.disconnect();
      console.log('✅ اتصال به دیتابیس قطع شد');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ خطا:', err);
      process.exit(1);
    });
}

module.exports = seedDatabase;
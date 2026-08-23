const roles = [
  // =============================================
  // ✅ نقش ادمین (Admin) - دسترسی کامل به همه مجوزها
  // =============================================
  {
    name: 'admin',
    label: 'مدیر کل',
    description: 'دسترسی کامل به تمام بخش‌های سیستم',
    isSystem: true,
    permissionNames: [
      // Hardware
      'view_hardware', 'create_hardware', 'edit_hardware', 'delete_hardware', 'assign_hardware',
      // Credential
      'view_credential', 'create_credential', 'edit_credential', 'delete_credential',
      // Document
      'view_document', 'upload_document', 'edit_document', 'delete_document',
      'view_confidential_document', 'view_restricted_document',
      // Ticket
      'view_ticket', 'create_ticket', 'edit_ticket', 'delete_ticket', 'assign_ticket', 'resolve_ticket',
      // User
      'view_user', 'create_user', 'edit_user', 'delete_user', 'activate_user',
      // Category
      'view_category', 'create_category', 'edit_category', 'delete_category',
      // Audit
      'view_audit', 'export_audit',
      // Role & Permission
      'manage_roles', 'manage_permissions',
      // Department
      'view_departments', 'manage_departments', 'delete_department',
      // Letter
      'view_letters', 'create_letter', 'edit_letter', 'delete_letter',
      'sign_letter', 'approve_letter', 'reject_letter', 'forward_letter', 'archive_letter',
      // Workflow
      'view_workflow', 'manage_workflow', 'delete_workflow',
      'approve_workflow', 'reject_workflow', 'assign_workflow',
      // Signature
      'view_signatures', 'manage_signatures', 'request_signature', 'verify_signature', 'reject_signature',
      // Secretariat
      'view_secretariats', 'manage_secretariats', 'delete_secretariat',
      // Archive
      'view_archives', 'manage_archives', 'delete_archive', 'move_to_archive',
      // Report
      'view_reports', 'create_report', 'edit_report', 'delete_report', 'export_report', 'generate_report',
      // Reminder
      'view_reminders', 'manage_reminders', 'send_reminder',
      // Dashboard
      'view_dashboard', 'customize_dashboard',
      // Settings
      'view_settings', 'manage_settings',
      // Webhook
      'view_webhooks', 'manage_webhooks', 'delete_webhook',
      // Integration
      'manage_integrations',
    ],
  },

  // =============================================
  // ✅ نقش مدیر اداری (Office Manager)
  // =============================================
  {
    name: 'office_manager',
    label: 'مدیر اداری',
    description: 'مدیریت مکاتبات، گردش کار و امضاها',
    isSystem: true,
    permissionNames: [
      // Hardware
      'view_hardware',
      // Document
      'view_document', 'upload_document', 'edit_document',
      // Ticket
      'view_ticket', 'create_ticket',
      // User
      'view_user',
      // Department
      'view_departments',
      // Letter - دسترسی کامل به نامه‌ها
      'view_letters', 'create_letter', 'edit_letter',
      'sign_letter', 'approve_letter', 'reject_letter', 'forward_letter', 'archive_letter',
      // Workflow
      'view_workflow', 'approve_workflow', 'reject_workflow', 'assign_workflow',
      // Signature
      'view_signatures', 'request_signature', 'verify_signature',
      // Secretariat
      'view_secretariats',
      // Archive
      'view_archives', 'move_to_archive',
      // Report
      'view_reports', 'export_report', 'generate_report',
      // Reminder
      'view_reminders', 'send_reminder',
      // Dashboard
      'view_dashboard',
    ],
  },

  // =============================================
  // ✅ نقش مدیر واحد (Department Manager)
  // =============================================
  {
    name: 'department_manager',
    label: 'مدیر واحد',
    description: 'مدیریت واحد خود و تایید درخواست‌ها',
    isSystem: true,
    permissionNames: [
      // Hardware
      'view_hardware', 'assign_hardware',
      // Document
      'view_document', 'upload_document',
      // Ticket
      'view_ticket', 'create_ticket', 'resolve_ticket',
      // User
      'view_user',
      // Department
      'view_departments',
      // Letter
      'view_letters', 'create_letter', 'edit_letter',
      'sign_letter', 'approve_letter', 'reject_letter', 'forward_letter',
      // Workflow
      'view_workflow', 'approve_workflow', 'reject_workflow',
      // Signature
      'view_signatures', 'request_signature',
      // Archive
      'view_archives',
      // Report
      'view_reports',
      // Reminder
      'view_reminders',
      // Dashboard
      'view_dashboard',
    ],
  },

  // =============================================
  // ✅ نقش کارمند اداری (Office Staff)
  // =============================================
  {
    name: 'office_staff',
    label: 'کارمند اداری',
    description: 'ثبت و پیگیری نامه‌ها',
    isSystem: true,
    permissionNames: [
      // Hardware
      'view_hardware',
      // Document
      'view_document', 'upload_document',
      // Ticket
      'view_ticket', 'create_ticket',
      // Department
      'view_departments',
      // Letter
      'view_letters', 'create_letter', 'edit_letter', 'forward_letter',
      // Workflow
      'view_workflow',
      // Signature
      'view_signatures', 'request_signature',
      // Archive
      'view_archives',
      // Report
      'view_reports',
      // Reminder
      'view_reminders',
      // Dashboard
      'view_dashboard',
    ],
  },

  // =============================================
  // ✅ نقش مدیر شبکه (Network Manager)
  // =============================================
  {
    name: 'network_manager',
    label: 'مدیر شبکه',
    description: 'مدیریت رمزها و تجهیزات شبکه',
    isSystem: true,
    permissionNames: [
      // Hardware
      'view_hardware', 'create_hardware', 'edit_hardware', 'assign_hardware',
      // Credential - دسترسی کامل به رمزها
      'view_credential', 'create_credential', 'edit_credential', 'delete_credential',
      // Document
      'view_document', 'upload_document',
      // Ticket
      'view_ticket', 'create_ticket', 'resolve_ticket',
      // Department
      'view_departments',
      // Letter
      'view_letters',
      // Report
      'view_reports',
      // Dashboard
      'view_dashboard',
    ],
  },

  // =============================================
  // ✅ نقش پشتیبانی (Support)
  // =============================================
  {
    name: 'support',
    label: 'پشتیبانی',
    description: 'مدیریت تیکت‌ها و مشاهده اموال',
    isSystem: true,
    permissionNames: [
      // Hardware
      'view_hardware',
      // Document
      'view_document', 'upload_document',
      // Ticket - دسترسی کامل به تیکت‌ها
      'view_ticket', 'create_ticket', 'edit_ticket', 'delete_ticket', 'assign_ticket', 'resolve_ticket',
      // User
      'view_user',
      // Category
      'view_category',
      // Department
      'view_departments',
      // Letter
      'view_letters',
      // Report
      'view_reports',
      // Dashboard
      'view_dashboard',
    ],
  },

  // =============================================
  // ✅ نقش کاربر عادی (User)
  // =============================================
  {
    name: 'user',
    label: 'کاربر عادی',
    description: 'مشاهده اموال و ثبت تیکت',
    isSystem: true,
    permissionNames: [
      // Hardware
      'view_hardware',
      // Document
      'view_document',
      // Ticket
      'view_ticket', 'create_ticket',
      // Department
      'view_departments',
      // Letter
      'view_letters',
      // Dashboard
      'view_dashboard',
    ],
  },
];

// =============================================
// ✅ تابع سیدر نقش‌ها
// =============================================
const seedRoles = async (getPermissionId) => {
  try {
    console.log('🔄 شروع ایجاد/به‌روزرسانی نقش‌ها...');
    console.log(`📋 تعداد نقش‌ها: ${roles.length}`);
    
    const Role = require('../models/Role');
    let createdCount = 0;
    let updatedCount = 0;

    for (const roleData of roles) {
      const permissionIds = roleData.permissionNames
        .map(name => getPermissionId(name))
        .filter(id => id);

      const result = await Role.findOneAndUpdate(
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

      const isNew = result.createdAt === result.updatedAt;
      if (isNew) {
        createdCount++;
      } else {
        updatedCount++;
      }
    }

    console.log(`✅ ${createdCount} نقش جدید ایجاد شد`);
    console.log(`✅ ${updatedCount} نقش به‌روزرسانی شد`);
    console.log(`✅ مجموع: ${roles.length} نقش`);

    return { success: true, total: roles.length, created: createdCount, updated: updatedCount };
  } catch (error) {
    console.error('❌ خطا در ایجاد نقش‌ها:', error.message);
    throw error;
  }
};

module.exports = { roles, seedRoles };
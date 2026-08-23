// backend/src/utils/seedPermissions.js
const Permission = require('../models/Permission');

// =============================================
// ✅ لیست کامل مجوزها با عناوین کاملاً فارسی (۱۱۶ مجوز)
// =============================================
const permissions = [
  // =============================================
  // ۱. اموال (Hardware) - ۵ مجوز
  // =============================================
  { 
    name: 'view_hardware', 
    label: 'مشاهده اموال', 
    module: 'hardware',
    description: 'دسترسی به لیست و جزئیات اموال'
  },
  { 
    name: 'create_hardware', 
    label: 'ثبت اموال', 
    module: 'hardware',
    description: 'ایجاد اموال جدید'
  },
  { 
    name: 'edit_hardware', 
    label: 'ویرایش اموال', 
    module: 'hardware',
    description: 'ویرایش اطلاعات اموال'
  },
  { 
    name: 'delete_hardware', 
    label: 'حذف اموال', 
    module: 'hardware',
    description: 'حذف اموال از سیستم'
  },
  { 
    name: 'assign_hardware', 
    label: 'تخصیص اموال', 
    module: 'hardware',
    description: 'تخصیص اموال به کاربران'
  },

  // =============================================
  // ۲. رمزها (Credential) - ۴ مجوز
  // =============================================
  { 
    name: 'view_credential', 
    label: 'مشاهده رمزها', 
    module: 'credential',
    description: 'دسترسی به لیست و جزئیات رمزها'
  },
  { 
    name: 'create_credential', 
    label: 'ثبت رمز', 
    module: 'credential',
    description: 'ایجاد رمز جدید'
  },
  { 
    name: 'edit_credential', 
    label: 'ویرایش رمز', 
    module: 'credential',
    description: 'ویرایش اطلاعات رمز'
  },
  { 
    name: 'delete_credential', 
    label: 'حذف رمز', 
    module: 'credential',
    description: 'حذف رمز از سیستم'
  },

  // =============================================
  // ۳. اسناد (Document) - ۶ مجوز
  // =============================================
  { 
    name: 'view_document', 
    label: 'مشاهده اسناد', 
    module: 'document',
    description: 'دسترسی به لیست و جزئیات اسناد'
  },
  { 
    name: 'upload_document', 
    label: 'آپلود سند', 
    module: 'document',
    description: 'آپلود سند جدید'
  },
  { 
    name: 'edit_document', 
    label: 'ویرایش سند', 
    module: 'document',
    description: 'ویرایش اطلاعات سند'
  },
  { 
    name: 'delete_document', 
    label: 'حذف سند', 
    module: 'document',
    description: 'حذف سند از سیستم'
  },
  { 
    name: 'view_confidential_document', 
    label: 'مشاهده اسناد محرمانه', 
    module: 'document',
    description: 'دسترسی به اسناد با سطح محرمانه'
  },
  { 
    name: 'view_restricted_document', 
    label: 'مشاهده اسناد محدود', 
    module: 'document',
    description: 'دسترسی به اسناد با سطح محدود'
  },

  // =============================================
  // ۴. تیکت‌ها (Ticket) - ۶ مجوز
  // =============================================
  { 
    name: 'view_ticket', 
    label: 'مشاهده تیکت‌ها', 
    module: 'ticket',
    description: 'دسترسی به لیست و جزئیات تیکت‌ها'
  },
  { 
    name: 'create_ticket', 
    label: 'ثبت تیکت', 
    module: 'ticket',
    description: 'ایجاد تیکت جدید'
  },
  { 
    name: 'edit_ticket', 
    label: 'ویرایش تیکت', 
    module: 'ticket',
    description: 'ویرایش اطلاعات تیکت'
  },
  { 
    name: 'delete_ticket', 
    label: 'حذف تیکت', 
    module: 'ticket',
    description: 'حذف تیکت از سیستم'
  },
  { 
    name: 'assign_ticket', 
    label: 'اختصاص تیکت', 
    module: 'ticket',
    description: 'اختصاص تیکت به کاربر'
  },
  { 
    name: 'resolve_ticket', 
    label: 'حل تیکت', 
    module: 'ticket',
    description: 'تغییر وضعیت تیکت به حل‌شده'
  },

  // =============================================
  // ۵. کاربران (User) - ۵ مجوز
  // =============================================
  { 
    name: 'view_user', 
    label: 'مشاهده کاربران', 
    module: 'user',
    description: 'دسترسی به لیست و جزئیات کاربران'
  },
  { 
    name: 'create_user', 
    label: 'ثبت کاربر', 
    module: 'user',
    description: 'ایجاد کاربر جدید'
  },
  { 
    name: 'edit_user', 
    label: 'ویرایش کاربر', 
    module: 'user',
    description: 'ویرایش اطلاعات کاربر'
  },
  { 
    name: 'delete_user', 
    label: 'حذف کاربر', 
    module: 'user',
    description: 'حذف کاربر از سیستم'
  },
  { 
    name: 'activate_user', 
    label: 'فعال/غیرفعال کردن کاربر', 
    module: 'user',
    description: 'تغییر وضعیت فعال بودن کاربر'
  },

  // =============================================
  // ۶. دسته‌بندی‌ها (Category) - ۴ مجوز
  // =============================================
  { 
    name: 'view_category', 
    label: 'مشاهده دسته‌بندی‌ها', 
    module: 'category',
    description: 'دسترسی به لیست دسته‌بندی‌ها'
  },
  { 
    name: 'create_category', 
    label: 'ثبت دسته‌بندی', 
    module: 'category',
    description: 'ایجاد دسته‌بندی جدید'
  },
  { 
    name: 'edit_category', 
    label: 'ویرایش دسته‌بندی', 
    module: 'category',
    description: 'ویرایش اطلاعات دسته‌بندی'
  },
  { 
    name: 'delete_category', 
    label: 'حذف دسته‌بندی', 
    module: 'category',
    description: 'حذف دسته‌بندی از سیستم'
  },

  // =============================================
  // ۷. تاریخچه (Audit) - ۲ مجوز
  // =============================================
  { 
    name: 'view_audit', 
    label: 'مشاهده تاریخچه', 
    module: 'audit',
    description: 'دسترسی به تاریخچه عملیات'
  },
  { 
    name: 'export_audit', 
    label: 'خروجی تاریخچه', 
    module: 'audit',
    description: 'خروجی گرفتن از تاریخچه'
  },

  // =============================================
  // ۸. نقش‌ها و مجوزها (Role & Permission) - ۲ مجوز
  // =============================================
  { 
    name: 'manage_roles', 
    label: 'مدیریت نقش‌ها', 
    module: 'role',
    description: 'ایجاد، ویرایش و حذف نقش‌ها'
  },
  { 
    name: 'manage_permissions', 
    label: 'مدیریت مجوزها', 
    module: 'permission',
    description: 'ایجاد، ویرایش و حذف مجوزها'
  },

  // =============================================
  // ۹. واحدها (Department) - ۳ مجوز
  // =============================================
  { 
    name: 'view_departments', 
    label: 'مشاهده واحدها', 
    module: 'department',
    description: 'دسترسی به لیست واحدهای سازمانی'
  },
  { 
    name: 'manage_departments', 
    label: 'مدیریت واحدها', 
    module: 'department',
    description: 'ایجاد، ویرایش واحدها'
  },
  { 
    name: 'delete_department', 
    label: 'حذف واحد', 
    module: 'department',
    description: 'حذف واحد از سیستم'
  },

  // =============================================
  // ۱۰. نامه‌ها (Letter) - ۱۱ مجوز
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
    description: 'ویرایش اطلاعات نامه'
  },
  { 
    name: 'delete_letter', 
    label: 'حذف نامه', 
    module: 'letter',
    description: 'حذف نامه از سیستم'
  },
  { 
    name: 'sign_letter', 
    label: 'امضای نامه', 
    module: 'letter',
    description: 'امضای دیجیتال نامه'
  },
  { 
    name: 'approve_letter', 
    label: 'تایید نامه', 
    module: 'letter',
    description: 'تایید نهایی نامه'
  },
  { 
    name: 'reject_letter', 
    label: 'رد نامه', 
    module: 'letter',
    description: 'رد نامه'
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
    description: 'بایگانی نامه'
  },
  { 
    name: 'register_letter', 
    label: 'ثبت رسمی نامه', 
    module: 'letter',
    description: 'ثبت نامه در سامانه'
  },
  { 
    name: 'review_letter', 
    label: 'پاراف نامه', 
    module: 'letter',
    description: 'بررسی و پاراف نامه'
  },

  // =============================================
  // ۱۱. گردش کار (Workflow) - ۶ مجوز
  // =============================================
  { 
    name: 'view_workflow', 
    label: 'مشاهده گردش کار', 
    module: 'workflow',
    description: 'دسترسی به گردش‌های کاری و وضعیت آنها'
  },
  { 
    name: 'manage_workflow', 
    label: 'مدیریت گردش کار', 
    module: 'workflow',
    description: 'ایجاد، ویرایش و حذف گردش‌های کاری'
  },
  { 
    name: 'delete_workflow', 
    label: 'حذف گردش کار', 
    module: 'workflow',
    description: 'حذف گردش کار از سیستم'
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
  // ۱۲. امضا (Signature) - ۵ مجوز
  // =============================================
  { 
    name: 'view_signatures', 
    label: 'مشاهده امضاها', 
    module: 'signature',
    description: 'دسترسی به تاریخچه امضاها'
  },
  { 
    name: 'manage_signatures', 
    label: 'مدیریت امضاها', 
    module: 'signature',
    description: 'مدیریت امضای دیجیتال کاربران'
  },
  { 
    name: 'request_signature', 
    label: 'درخواست امضا', 
    module: 'signature',
    description: 'درخواست امضا از کاربران دیگر'
  },
  { 
    name: 'verify_signature', 
    label: 'تایید امضا', 
    module: 'signature',
    description: 'تایید صحت امضا'
  },
  { 
    name: 'reject_signature', 
    label: 'رد امضا', 
    module: 'signature',
    description: 'رد امضا'
  },

  // =============================================
  // ۱۳. دبیرخانه (Secretariat) - ۳ مجوز
  // =============================================
  { 
    name: 'view_secretariats', 
    label: 'مشاهده دبیرخانه‌ها', 
    module: 'secretariat',
    description: 'دسترسی به لیست دبیرخانه‌ها'
  },
  { 
    name: 'manage_secretariats', 
    label: 'مدیریت دبیرخانه‌ها', 
    module: 'secretariat',
    description: 'ایجاد، ویرایش دبیرخانه‌ها'
  },
  { 
    name: 'delete_secretariat', 
    label: 'حذف دبیرخانه', 
    module: 'secretariat',
    description: 'حذف دبیرخانه از سیستم'
  },

  // =============================================
  // ۱۴. آرشیو (Archive) - ۴ مجوز
  // =============================================
  { 
    name: 'view_archives', 
    label: 'مشاهده آرشیو', 
    module: 'archive',
    description: 'دسترسی به آرشیوها'
  },
  { 
    name: 'manage_archives', 
    label: 'مدیریت آرشیو', 
    module: 'archive',
    description: 'ایجاد، ویرایش آرشیوها'
  },
  { 
    name: 'delete_archive', 
    label: 'حذف آرشیو', 
    module: 'archive',
    description: 'حذف آرشیو از سیستم'
  },
  { 
    name: 'move_to_archive', 
    label: 'انتقال به آرشیو', 
    module: 'archive',
    description: 'انتقال اسناد به آرشیو'
  },

  // =============================================
  // ۱۵. گزارشات (Report) - ۶ مجوز
  // =============================================
  { 
    name: 'view_reports', 
    label: 'مشاهده گزارشات', 
    module: 'report',
    description: 'دسترسی به گزارش‌های مدیریتی'
  },
  { 
    name: 'create_report', 
    label: 'ایجاد گزارش', 
    module: 'report',
    description: 'ایجاد گزارش جدید'
  },
  { 
    name: 'edit_report', 
    label: 'ویرایش گزارش', 
    module: 'report',
    description: 'ویرایش اطلاعات گزارش'
  },
  { 
    name: 'delete_report', 
    label: 'حذف گزارش', 
    module: 'report',
    description: 'حذف گزارش از سیستم'
  },
  { 
    name: 'export_report', 
    label: 'خروجی گزارش', 
    module: 'report',
    description: 'خروجی گرفتن از گزارش‌ها (Excel, PDF)'
  },
  { 
    name: 'generate_report', 
    label: 'تولید گزارش', 
    module: 'report',
    description: 'تولید و اجرای گزارش'
  },

  // =============================================
  // ۱۶. اخطارها (Reminder) - ۳ مجوز
  // =============================================
  { 
    name: 'view_reminders', 
    label: 'مشاهده اخطارها', 
    module: 'reminder',
    description: 'دسترسی به اخطارها و تاریخچه آنها'
  },
  { 
    name: 'manage_reminders', 
    label: 'مدیریت اخطارها', 
    module: 'reminder',
    description: 'مدیریت تنظیمات و زمان‌بندی اخطارها'
  },
  { 
    name: 'send_reminder', 
    label: 'ارسال اخطار', 
    module: 'reminder',
    description: 'ارسال اخطار به کاربران'
  },

  // =============================================
  // ۱۷. داشبورد (Dashboard) - ۲ مجوز
  // =============================================
  { 
    name: 'view_dashboard', 
    label: 'مشاهده داشبورد', 
    module: 'dashboard',
    description: 'دسترسی به داشبورد اصلی'
  },
  { 
    name: 'customize_dashboard', 
    label: 'سفارشی‌سازی داشبورد', 
    module: 'dashboard',
    description: 'تغییر چیدمان و ویجت‌های داشبورد'
  },

  // =============================================
  // ۱۸. تنظیمات (Settings) - ۲ مجوز
  // =============================================
  { 
    name: 'view_settings', 
    label: 'مشاهده تنظیمات', 
    module: 'settings',
    description: 'دسترسی به صفحه تنظیمات سیستم'
  },
  { 
    name: 'manage_settings', 
    label: 'مدیریت تنظیمات', 
    module: 'settings',
    description: 'تغییر تنظیمات سیستم'
  },

  // =============================================
  // ۱۹. وب‌هوک (Webhook) - ۳ مجوز
  // =============================================
  { 
    name: 'view_webhooks', 
    label: 'مشاهده وب‌هوک‌ها', 
    module: 'webhook',
    description: 'دسترسی به لیست وب‌هوک‌ها'
  },
  { 
    name: 'manage_webhooks', 
    label: 'مدیریت وب‌هوک‌ها', 
    module: 'webhook',
    description: 'ایجاد، ویرایش وب‌هوک‌ها'
  },
  { 
    name: 'delete_webhook', 
    label: 'حذف وب‌هوک', 
    module: 'webhook',
    description: 'حذف وب‌هوک از سیستم'
  },

  // =============================================
  // ۲۰. یکپارچه‌سازی (Integration) - ۱ مجوز
  // =============================================
  { 
    name: 'manage_integrations', 
    label: 'مدیریت یکپارچه‌سازی', 
    module: 'integration',
    description: 'مدیریت اتصال به سیستم‌های خارجی'
  },

  // =============================================
  // ۲۱. فکس (Fax) - ۳ مجوز
  // =============================================
  { 
    name: 'view_fax', 
    label: 'مشاهده فکس', 
    module: 'fax',
    description: 'دسترسی به لیست فکس‌ها'
  },
  { 
    name: 'send_fax', 
    label: 'ارسال فکس', 
    module: 'fax',
    description: 'ارسال فکس جدید'
  },
  { 
    name: 'delete_fax', 
    label: 'حذف فکس', 
    module: 'fax',
    description: 'حذف فکس از سیستم'
  },

  // =============================================
  // ۲۲. ایمیل (Email) - ۱ مجوز
  // =============================================
  { 
    name: 'manage_email', 
    label: 'مدیریت ایمیل', 
    module: 'email',
    description: 'مدیریت تنظیمات ایمیل'
  },

  // =============================================
  // ۲۳. ارجاعات (Referral) - ۳ مجوز
  // =============================================
  { 
    name: 'view_referrals', 
    label: 'مشاهده ارجاعات', 
    module: 'referral',
    description: 'دسترسی به لیست ارجاعات'
  },
  { 
    name: 'create_referral', 
    label: 'ایجاد ارجاع', 
    module: 'referral',
    description: 'ارجاع نامه به کاربر دیگر'
  },
  { 
    name: 'action_referral', 
    label: 'اقدام روی ارجاع', 
    module: 'referral',
    description: 'ثبت اقدام روی ارجاع دریافتی'
  },

  // =============================================
  // ۲۴. شماره‌گذاری (Letter Numbering) - ۲ مجوز
  // =============================================
  { 
    name: 'view_numbering', 
    label: 'مشاهده الگوهای شماره‌گذاری', 
    module: 'numbering',
    description: 'دسترسی به لیست الگوها'
  },
  { 
    name: 'manage_numbering', 
    label: 'مدیریت شماره‌گذاری', 
    module: 'numbering',
    description: 'ایجاد، ویرایش الگوهای شماره‌گذاری'
  },

  // =============================================
  // ۲۵. OCR و جستجو (OCR & Search) - ۲ مجوز
  // =============================================
  { 
    name: 'view_ocr_results', 
    label: 'مشاهده نتایج OCR', 
    module: 'ocr',
    description: 'دسترسی به نتایج جستجوی OCR'
  },
  { 
    name: 'process_ocr', 
    label: 'پردازش OCR', 
    module: 'ocr',
    description: 'اجرای OCR روی اسناد'
  },

  // =============================================
  // ۲۶. تفویض اختیار (Delegation) - ۲ مجوز
  // =============================================
  { 
    name: 'manage_delegation', 
    label: 'مدیریت تفویض اختیار', 
    module: 'delegation',
    description: 'ایجاد، لغو تفویض اختیار'
  },
  { 
    name: 'view_delegation', 
    label: 'مشاهده تفویض‌ها', 
    module: 'delegation',
    description: 'مشاهده تفویض‌های فعال'
  },

  // =============================================
  // ۲۷. CMS (مدیریت محتوا) - ۲۰ مجوز
  // =============================================
  // محتوا
  { 
    name: 'cms.view_content', 
    label: 'مشاهده محتوا', 
    module: 'cms',
    description: 'دسترسی به لیست و جزئیات محتوا'
  },
  { 
    name: 'cms.create_content', 
    label: 'ثبت محتوا', 
    module: 'cms',
    description: 'ایجاد محتوای جدید'
  },
  { 
    name: 'cms.edit_content', 
    label: 'ویرایش محتوا', 
    module: 'cms',
    description: 'ویرایش اطلاعات محتوا'
  },
  { 
    name: 'cms.delete_content', 
    label: 'حذف محتوا', 
    module: 'cms',
    description: 'حذف محتوا از سیستم'
  },
  { 
    name: 'cms.publish_content', 
    label: 'انتشار محتوا', 
    module: 'cms',
    description: 'انتشار محتوا در وب‌سایت'
  },

  // صفحات
  { 
    name: 'cms.view_pages', 
    label: 'مشاهده صفحات', 
    module: 'cms',
    description: 'دسترسی به لیست صفحات'
  },
  { 
    name: 'cms.create_pages', 
    label: 'ثبت صفحه', 
    module: 'cms',
    description: 'ایجاد صفحه جدید'
  },
  { 
    name: 'cms.edit_pages', 
    label: 'ویرایش صفحه', 
    module: 'cms',
    description: 'ویرایش اطلاعات صفحه'
  },
  { 
    name: 'cms.delete_pages', 
    label: 'حذف صفحه', 
    module: 'cms',
    description: 'حذف صفحه از سیستم'
  },

  // نوشته‌ها
  { 
    name: 'cms.view_posts', 
    label: 'مشاهده نوشته‌ها', 
    module: 'cms',
    description: 'دسترسی به لیست نوشته‌ها'
  },
  { 
    name: 'cms.create_posts', 
    label: 'ثبت نوشته', 
    module: 'cms',
    description: 'ایجاد نوشته جدید'
  },
  { 
    name: 'cms.edit_posts', 
    label: 'ویرایش نوشته', 
    module: 'cms',
    description: 'ویرایش اطلاعات نوشته'
  },
  { 
    name: 'cms.delete_posts', 
    label: 'حذف نوشته', 
    module: 'cms',
    description: 'حذف نوشته از سیستم'
  },

  // کامنت‌ها
  { 
    name: 'cms.view_comments', 
    label: 'مشاهده کامنت‌ها', 
    module: 'cms',
    description: 'دسترسی به لیست کامنت‌ها'
  },
  { 
    name: 'cms.approve_comments', 
    label: 'تایید کامنت', 
    module: 'cms',
    description: 'تایید کامنت‌های در انتظار'
  },
  { 
    name: 'cms.delete_comments', 
    label: 'حذف کامنت', 
    module: 'cms',
    description: 'حذف کامنت از سیستم'
  },

  // فایل‌ها (Media)
  { 
    name: 'cms.view_media', 
    label: 'مشاهده فایل‌ها', 
    module: 'cms',
    description: 'دسترسی به لیست فایل‌ها'
  },
  { 
    name: 'cms.upload_media', 
    label: 'آپلود فایل', 
    module: 'cms',
    description: 'آپلود فایل جدید'
  },
  { 
    name: 'cms.edit_media', 
    label: 'ویرایش فایل', 
    module: 'cms',
    description: 'ویرایش اطلاعات فایل'
  },
  { 
    name: 'cms.delete_media', 
    label: 'حذف فایل', 
    module: 'cms',
    description: 'حذف فایل از سیستم'
  },

  // محصولات (E-Commerce)
  { 
    name: 'cms.view_products', 
    label: 'مشاهده محصولات', 
    module: 'cms',
    description: 'دسترسی به لیست محصولات'
  },
  { 
    name: 'cms.create_products', 
    label: 'ثبت محصول', 
    module: 'cms',
    description: 'ایجاد محصول جدید'
  },
  { 
    name: 'cms.edit_products', 
    label: 'ویرایش محصول', 
    module: 'cms',
    description: 'ویرایش اطلاعات محصول'
  },
  { 
    name: 'cms.delete_products', 
    label: 'حذف محصول', 
    module: 'cms',
    description: 'حذف محصول از سیستم'
  },

  // سفارشات (Orders)
  { 
    name: 'cms.view_orders', 
    label: 'مشاهده سفارشات', 
    module: 'cms',
    description: 'دسترسی به لیست سفارشات'
  },
  { 
    name: 'cms.edit_orders', 
    label: 'ویرایش سفارش', 
    module: 'cms',
    description: 'ویرایش اطلاعات سفارش'
  },
  { 
    name: 'cms.process_orders', 
    label: 'پردازش سفارش', 
    module: 'cms',
    description: 'تغییر وضعیت و پردازش سفارشات'
  },

  // =============================================
  // ۲۸. CRM (مدیریت ارتباط با مشتریان) - ۲۰ مجوز
  // =============================================
  // سرنخ‌ها (Leads)
  { 
    name: 'crm.view_leads', 
    label: 'مشاهده سرنخ‌ها', 
    module: 'crm',
    description: 'دسترسی به لیست سرنخ‌ها'
  },
  { 
    name: 'crm.create_leads', 
    label: 'ثبت سرنخ', 
    module: 'crm',
    description: 'ایجاد سرنخ جدید'
  },
  { 
    name: 'crm.edit_leads', 
    label: 'ویرایش سرنخ', 
    module: 'crm',
    description: 'ویرایش اطلاعات سرنخ'
  },
  { 
    name: 'crm.delete_leads', 
    label: 'حذف سرنخ', 
    module: 'crm',
    description: 'حذف سرنخ از سیستم'
  },
  { 
    name: 'crm.assign_leads', 
    label: 'تخصیص سرنخ', 
    module: 'crm',
    description: 'تخصیص سرنخ به کاربر'
  },
  { 
    name: 'crm.convert_leads', 
    label: 'تبدیل سرنخ', 
    module: 'crm',
    description: 'تبدیل سرنخ به مشتری'
  },

  // شرکت‌ها (Accounts)
  { 
    name: 'crm.view_accounts', 
    label: 'مشاهده شرکت‌ها', 
    module: 'crm',
    description: 'دسترسی به لیست شرکت‌ها'
  },
  { 
    name: 'crm.create_accounts', 
    label: 'ثبت شرکت', 
    module: 'crm',
    description: 'ایجاد شرکت جدید'
  },
  { 
    name: 'crm.edit_accounts', 
    label: 'ویرایش شرکت', 
    module: 'crm',
    description: 'ویرایش اطلاعات شرکت'
  },
  { 
    name: 'crm.delete_accounts', 
    label: 'حذف شرکت', 
    module: 'crm',
    description: 'حذف شرکت از سیستم'
  },

  // مخاطبین (Contacts)
  { 
    name: 'crm.view_contacts', 
    label: 'مشاهده مخاطبین', 
    module: 'crm',
    description: 'دسترسی به لیست مخاطبین'
  },
  { 
    name: 'crm.create_contacts', 
    label: 'ثبت مخاطب', 
    module: 'crm',
    description: 'ایجاد مخاطب جدید'
  },
  { 
    name: 'crm.edit_contacts', 
    label: 'ویرایش مخاطب', 
    module: 'crm',
    description: 'ویرایش اطلاعات مخاطب'
  },
  { 
    name: 'crm.delete_contacts', 
    label: 'حذف مخاطب', 
    module: 'crm',
    description: 'حذف مخاطب از سیستم'
  },

  // فرصت‌ها (Opportunities)
  { 
    name: 'crm.view_opportunities', 
    label: 'مشاهده فرصت‌ها', 
    module: 'crm',
    description: 'دسترسی به لیست فرصت‌ها'
  },
  { 
    name: 'crm.create_opportunities', 
    label: 'ثبت فرصت', 
    module: 'crm',
    description: 'ایجاد فرصت جدید'
  },
  { 
    name: 'crm.edit_opportunities', 
    label: 'ویرایش فرصت', 
    module: 'crm',
    description: 'ویرایش اطلاعات فرصت'
  },
  { 
    name: 'crm.delete_opportunities', 
    label: 'حذف فرصت', 
    module: 'crm',
    description: 'حذف فرصت از سیستم'
  },
  { 
    name: 'crm.move_opportunity', 
    label: 'تغییر مرحله فرصت', 
    module: 'crm',
    description: 'تغییر مرحله فروش فرصت'
  },

  // قراردادها (Contracts)
  { 
    name: 'crm.view_contracts', 
    label: 'مشاهده قراردادها', 
    module: 'crm',
    description: 'دسترسی به لیست قراردادها'
  },
  { 
    name: 'crm.create_contracts', 
    label: 'ثبت قرارداد', 
    module: 'crm',
    description: 'ایجاد قرارداد جدید'
  },
  { 
    name: 'crm.edit_contracts', 
    label: 'ویرایش قرارداد', 
    module: 'crm',
    description: 'ویرایش اطلاعات قرارداد'
  },
  { 
    name: 'crm.delete_contracts', 
    label: 'حذف قرارداد', 
    module: 'crm',
    description: 'حذف قرارداد از سیستم'
  },

  // گزارشات CRM
  { 
    name: 'crm.view_reports', 
    label: 'مشاهده گزارشات CRM', 
    module: 'crm',
    description: 'دسترسی به گزارشات CRM'
  },
  { 
    name: 'crm.export_reports', 
    label: 'خروجی گزارشات CRM', 
    module: 'crm',
    description: 'خروجی گرفتن از گزارشات CRM'
  },
  { 
    name: 'crm.create_reports', 
    label: 'ایجاد گزارش CRM', 
    module: 'crm',
    description: 'ایجاد گزارش جدید در CRM'
  },

  // تنظیمات CRM
  { 
    name: 'crm.manage_settings', 
    label: 'مدیریت تنظیمات CRM', 
    module: 'crm',
    description: 'مدیریت تنظیمات ماژول CRM'
  },
];

// =============================================
// ✅ تابع سیدر با حذف مجوزهای اضافی
// =============================================
const seedPermissions = async () => {
  try {
    console.log('🔄 شروع ایجاد/به‌روزرسانی مجوزها...');
    console.log(`📋 تعداد مجوزها در لیست جدید: ${permissions.length}`);
    
    // =============================================
    // ✅ ۱. پاک کردن مجوزهایی که در لیست جدید نیستند
    // =============================================
    const currentNames = permissions.map(p => p.name);
    const deleteResult = await Permission.deleteMany({ 
      name: { $nin: currentNames } 
    });
    console.log(`🗑️ ${deleteResult.deletedCount} مجوز اضافی حذف شدند`);
    
    // =============================================
    // ✅ ۲. ایجاد یا به‌روزرسانی مجوزها
    // =============================================
    let createdCount = 0;
    let updatedCount = 0;

    for (const perm of permissions) {
      const result = await Permission.findOneAndUpdate(
        { name: perm.name },
        perm,
        { 
          upsert: true, 
          returnDocument: 'after',
          setDefaultsOnInsert: true,
        }
      );
      
      const isNew = result.createdAt.getTime() === result.updatedAt.getTime();
      if (isNew) {
        createdCount++;
      } else {
        updatedCount++;
      }
    }
    
    console.log(`✅ ${createdCount} مجوز جدید ایجاد شد`);
    console.log(`✅ ${updatedCount} مجوز به‌روزرسانی شد`);
    console.log(`✅ مجموع نهایی: ${permissions.length} مجوز در دیتابیس`);
    
    return { 
      success: true, 
      total: permissions.length, 
      created: createdCount, 
      updated: updatedCount,
      deleted: deleteResult.deletedCount,
    };
  } catch (error) {
    console.error('❌ خطا در ایجاد مجوزها:', error.message);
    throw error;
  }
};

// =============================================
// ✅ export به‌صورت صحیح
// =============================================
module.exports = { permissions, seedPermissions };
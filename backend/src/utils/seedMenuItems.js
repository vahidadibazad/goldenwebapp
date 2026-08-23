const MenuItem = require('../models/MenuItem');

const menuData = [
  // =============================================
  // سطح ۰: آیتم‌های اصلی (بدون والد)
  // =============================================
  {
    key: 'dashboard',
    label: 'داشبورد',
    icon: 'DashboardOutlined',
    path: '/',
    parent: null,
    order: 1,
    showInSidebar: true,
    isSystem: true,
  },
  {
    key: 'resources',
    label: 'مدیریت منابع',
    icon: 'DatabaseOutlined',
    path: '',
    parent: null,
    order: 10,
    showInSidebar: true,
    isSystem: true,
  },
  {
    key: 'letters',
    label: 'مکاتبات اداری',
    icon: 'MailOutlined',
    path: '',
    parent: null,
    order: 20,
    showInSidebar: true,
    isSystem: true,
  },
  {
    key: 'correspondence_system',
    label: 'سیستم مکاتبات',
    icon: 'BankOutlined',
    path: '',
    parent: null,
    order: 30,
    showInSidebar: true,
    isSystem: true,
  },
  {
    key: 'organization',
    label: 'مدیریت سازمانی',
    icon: 'TeamOutlined',
    path: '',
    parent: null,
    order: 40,
    showInSidebar: true,
    isSystem: true,
  },
  {
    key: 'system',
    label: 'مدیریت سیستم',
    icon: 'ToolOutlined',
    path: '',
    parent: null,
    order: 50,
    showInSidebar: true,
    isSystem: true,
  },

  // =============================================
  // سطح ۱: زیرمجموعه‌های مدیریت منابع
  // =============================================
  {
    key: 'hardware',
    label: 'اموال',
    icon: 'AppstoreOutlined',
    path: '/hardware',
    parent: 'resources',
    order: 11,
    showInSidebar: true,
    isSystem: true,
  },
  {
    key: 'credentials',
    label: 'رمزها',
    icon: 'SafetyOutlined',
    path: '/credentials',
    parent: 'resources',
    order: 12,
    showInSidebar: true,
    isSystem: true,
  },
  {
    key: 'documents',
    label: 'اسناد',
    icon: 'FileTextOutlined',
    path: '/documents',
    parent: 'resources',
    order: 13,
    showInSidebar: true,
    isSystem: true,
  },

  // =============================================
  // سطح ۱: زیرمجموعه‌های مکاتبات اداری
  // =============================================
  {
    key: 'letters_inbox',
    label: 'صندوق ورودی',
    icon: 'InboxOutlined',
    path: '/letters/inbox',
    parent: 'letters',
    order: 21,
    showInSidebar: true,
    isSystem: true,
  },
  {
    key: 'letters_outbox',
    label: 'صندوق خروجی',
    icon: 'ExportOutlined',
    path: '/letters/outbox',
    parent: 'letters',
    order: 22,
    showInSidebar: true,
    isSystem: true,
  },
  {
    key: 'letters_pending',
    label: 'در انتظار تایید',
    icon: 'ClockCircleOutlined',
    path: '/letters/pending',
    parent: 'letters',
    order: 23,
    showInSidebar: true,
    isSystem: true,
  },
  {
    key: 'letters_new',
    label: 'نامه جدید',
    icon: 'PlusOutlined',
    path: '/letters/new',
    parent: 'letters',
    order: 24,
    showInSidebar: true,
    isSystem: true,
  },

  // =============================================
  // سطح ۱: زیرمجموعه‌های سیستم مکاتبات
  // =============================================
  {
    key: 'secretariats',
    label: 'دبیرخانه‌ها',
    icon: 'BankOutlined',
    path: '/secretariats',
    parent: 'correspondence_system',
    order: 31,
    showInSidebar: true,
    isSystem: true,
  },
  {
    key: 'correspondence',
    label: 'نامه‌ها',
    icon: 'FileTextOutlined',
    path: '/correspondence',
    parent: 'correspondence_system',
    order: 32,
    showInSidebar: true,
    isSystem: true,
  },
  {
    key: 'archive',
    label: 'بایگانی',
    icon: 'FolderOutlined',
    path: '/archive',
    parent: 'correspondence_system',
    order: 33,
    showInSidebar: true,
    isSystem: true,
  },
  {
    key: 'reports',
    label: 'گزارشات',
    icon: 'AuditOutlined',
    path: '/reports',
    parent: 'correspondence_system',
    order: 34,
    showInSidebar: true,
    isSystem: true,
  },

  // =============================================
  // سطح ۱: زیرمجموعه‌های مدیریت سازمانی
  // =============================================
  {
    key: 'departments',
    label: 'واحدها',
    icon: 'ApartmentOutlined',
    path: '/departments',
    parent: 'organization',
    order: 41,
    showInSidebar: true,
    isSystem: true,
  },
  {
    key: 'workflow',
    label: 'گردش کار',
    icon: 'ShareAltOutlined',
    path: '/workflow',
    parent: 'organization',
    order: 42,
    showInSidebar: true,
    isSystem: true,
  },
  {
    key: 'signatures',
    label: 'امضاها',
    icon: 'SignatureOutlined',
    path: '/signatures',
    parent: 'organization',
    order: 43,
    showInSidebar: true,
    isSystem: true,
  },

  // =============================================
  // سطح ۱: زیرمجموعه‌های مدیریت سیستم
  // =============================================
  {
    key: 'users',
    label: 'کاربران',
    icon: 'TeamOutlined',
    path: '/users',
    parent: 'system',
    order: 51,
    showInSidebar: true,
    isSystem: true,
  },
  {
    key: 'roles',
    label: 'نقش‌ها',
    icon: 'SafetyCertificateOutlined',
    path: '/roles',
    parent: 'system',
    order: 52,
    showInSidebar: true,
    isSystem: true,
  },
  {
    key: 'settings',
    label: 'تنظیمات سیستم',
    icon: 'SettingOutlined',
    path: '/settings',
    parent: 'system',
    order: 53,
    showInSidebar: true,
    isSystem: true,
  },
  {
    key: 'audit',
    label: 'تاریخچه',
    icon: 'AuditOutlined',
    path: '/audit',
    parent: 'system',
    order: 54,
    showInSidebar: true,
    isSystem: true,
  },
];

const seedMenuItems = async () => {
  try {
    console.log('🔄 شروع ایجاد آیتم‌های منو...');

    // ۱. ابتدا همه آیتم‌ها را ایجاد کن (بدون parent)
    for (const item of menuData) {
      await MenuItem.findOneAndUpdate(
        { key: item.key },
        { 
          ...item,
          parent: null, // ابتدا null
        },
        { upsert: true }
      );
    }

    // ۲. سپس ارتباط والد-فرزندی را برقرار کن
    for (const item of menuData) {
      if (item.parent) {
        const child = await MenuItem.findOne({ key: item.key });
        const parent = await MenuItem.findOne({ key: item.parent });
        if (child && parent) {
          child.parent = parent._id;
          await child.save();
        }
      }
    }

    console.log(`✅ ${menuData.length} آیتم منو با موفقیت ایجاد شدند`);
    return { success: true, count: menuData.length };
  } catch (error) {
    console.error('❌ خطا در ایجاد آیتم‌های منو:', error.message);
    throw error;
  }
};

module.exports = seedMenuItems;
// =============================================
// پالت رنگ واحد سیستم
// =============================================
export const COLORS = {
  // رنگ‌های اصلی
  primary: '#1677ff',
  success: '#52c41a',
  warning: '#faad14',
  danger: '#ff4d4f',
  info: '#1677ff',
  purple: '#722ed1',
  cyan: '#13c2c2',
  pink: '#eb2f96',

  // وضعیت‌ها (Hardware)
  hardwareStatus: {
    active: '#52c41a',
    in_stock: '#faad14',
    repair: '#ff4d4f',
    archived: '#8c8c8c',
    disposed: '#8c8c8c',
  },

  // وضعیت‌ها (Ticket)
  ticketStatus: {
    open: '#faad14',
    in_progress: '#1677ff',
    resolved: '#52c41a',
    closed: '#8c8c8c',
  },

  // وضعیت‌ها (User)
  userStatus: {
    active: '#52c41a',
    inactive: '#ff4d4f',
  },

  // سطوح خاکستری
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e8e8e8',
    300: '#d9d9d9',
    400: '#bfbfbf',
    500: '#8c8c8c',
    600: '#595959',
    700: '#434343',
    800: '#262626',
    900: '#1f1f1f',
  },

  // رنگ‌های پس‌زمینه برای تگ‌های وضعیت
  statusBg: {
    active: '#f6ffed',
    in_stock: '#fffbe6',
    repair: '#fff2f0',
    archived: '#f5f5f5',
    disposed: '#f5f5f5',
    open: '#fffbe6',
    in_progress: '#e6f7ff',
    resolved: '#f6ffed',
    closed: '#f5f5f5',
  },

  // رنگ‌های حاشیه برای تگ‌های وضعیت
  statusBorder: {
    active: '#b7eb8f',
    in_stock: '#ffe58f',
    repair: '#ffccc7',
    archived: '#d9d9d9',
    disposed: '#d9d9d9',
    open: '#ffe58f',
    in_progress: '#91d5ff',
    resolved: '#b7eb8f',
    closed: '#d9d9d9',
  },
};

// =============================================
// توابع کمکی برای دریافت رنگ وضعیت
// =============================================
export const getStatusColor = (status, type = 'hardware') => {
  const map = {
    hardware: COLORS.hardwareStatus,
    ticket: COLORS.ticketStatus,
    user: COLORS.userStatus,
  };
  return map[type]?.[status] || COLORS.gray[500];
};

export const getStatusBg = (status) => {
  return COLORS.statusBg[status] || COLORS.gray[100];
};

export const getStatusBorder = (status) => {
  return COLORS.statusBorder[status] || COLORS.gray[300];
};

export const getStatusLabel = (status, type = 'hardware') => {
  const labels = {
    hardware: {
      active: 'فعال',
      in_stock: 'در انبار',
      repair: 'در تعمیر',
      archived: 'بایگانی',
      disposed: 'اسقاط',
    },
    ticket: {
      open: 'باز',
      in_progress: 'در حال بررسی',
      resolved: 'حل شده',
      closed: 'بسته',
    },
    user: {
      active: 'فعال',
      inactive: 'غیرفعال',
    },
  };
  return labels[type]?.[status] || status;
};

// =============================================
// کلاس‌های CSS برای تگ‌های وضعیت
// =============================================
export const getStatusClassName = (status) => {
  return `status-tag-${status}`;
};
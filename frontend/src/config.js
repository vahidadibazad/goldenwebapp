// frontend/src/config.js
// =============================================
// تنظیمات متمرکز و پویای سیستم
// =============================================

// =============================================
// دریافت آدرس کامل API به‌صورت پویا
// =============================================
export const getApiBaseUrl = () => {
  // دریافت آدرس فعلی مرورگر
  const { protocol, hostname, port } = window.location;
  
  // اگر در حالت توسعه هستیم
  if (import.meta.env.DEV) {
    // ✅ اگر با IP عمومی یا شبکه وارد شده‌ایم، از همان IP استفاده کن
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:3000/api`;
    }
    // در غیر این صورت از localhost استفاده کن
    return 'http://localhost:3000/api';
  }
  
  // در حالت تولید از آدرس فعلی استفاده کن
  return `${protocol}//${hostname}:3000/api`;
};

// =============================================
// دریافت آدرس Socket.IO به‌صورت پویا
// =============================================
export const getSocketUrl = () => {
  const apiBaseUrl = getApiBaseUrl();
  let socketUrl = apiBaseUrl.replace('/api', '');
  
  // اگر آدرس با // شروع شد، اصلاح کن
  if (socketUrl.startsWith('//')) {
    socketUrl = `${window.location.protocol}${socketUrl}`;
  }
  
  // اطمینان از اینکه آدرس با http:// یا https:// شروع می‌شود
  if (!socketUrl.startsWith('http://') && !socketUrl.startsWith('https://')) {
    socketUrl = `http://${socketUrl}`;
  }
  
  return socketUrl;
};

// =============================================
// توابع مدیریت IP سرور (برای تنظیم دستی)
// =============================================
export const getServerIP = () => {
  return localStorage.getItem('serverIP') || window.location.hostname;
};

export const setServerIP = (ip) => {
  localStorage.setItem('serverIP', ip);
  window.location.reload();
};

// =============================================
// تنظیمات دیگر سیستم
// =============================================
export const CONFIG = {
  APP_NAME: 'مدیریت فناوری اطلاعات',
  VERSION: '2.0.0',
  PORT: 3000,
};
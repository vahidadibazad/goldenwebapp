// frontend/src/components/Layout.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Layout as AntLayout, Menu, Button, Avatar, Dropdown, Space, Typography, Badge, Popover, List, Tag, Input, Modal, Card, Spin, Empty, Tooltip, Drawer } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  SafetyOutlined,
  FileTextOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  FolderOutlined,
  AuditOutlined,
  ProfileOutlined,
  KeyOutlined,
  BulbOutlined,
  BellOutlined,
  SearchOutlined,
  DatabaseOutlined,
  ToolOutlined,
  SafetyCertificateOutlined,
  PoweroffOutlined,
  SunOutlined,
  MoonOutlined,
  DownOutlined,
  MailOutlined,
  InboxOutlined,
  ExportOutlined,
  ApartmentOutlined,
  ShareAltOutlined,
  SignatureOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  BankOutlined,
  PhoneOutlined,
  GlobalOutlined,
  ApiOutlined,
  TagOutlined,
  NumberOutlined,
  ScanOutlined,
  SwapOutlined,
  AreaChartOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { toPersianDate } from '../utils/dateHelper';
import { COLORS } from '../styles/theme';
import OnlineUsers from './OnlineUsers';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

// =============================================
// هوک تم
// =============================================
function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);
  return { isDark, toggleTheme };
}

// =============================================
// دریافت عنوان صفحه
// =============================================
const getPageTitle = (path) => {
  const titles = {
    '/': 'داشبورد',
    '/hardware': 'مدیریت اموال',
    '/hardware/new': 'ثبت اموال جدید',
    '/credentials': 'مدیریت رمزها',
    '/credentials/new': 'ثبت رمز جدید',
    '/documents': 'مدیریت اسناد',
    '/documents/upload': 'آپلود سند جدید',
    '/tickets': 'مدیریت تیکت‌ها',
    '/tickets/new': 'ثبت تیکت جدید',
    '/users': 'مدیریت کاربران',
    '/users/new': 'ثبت کاربر جدید',
    '/roles': 'مدیریت نقش‌ها',
    '/roles/new': 'ثبت نقش جدید',
    '/audit': 'تاریخچه عملیات',
    '/settings': 'تنظیمات سیستم',
    '/profile': 'پروفایل کاربری',
    '/change-password': 'تغییر رمز عبور',
    '/departments': 'مدیریت واحدها',
    '/secretariats': 'مدیریت دبیرخانه‌ها',
    '/correspondence': 'مدیریت نامه‌ها',
    '/archive': 'مدیریت بایگانی',
    '/reports': 'مدیریت گزارشات',
    '/reports/new': 'ایجاد گزارش جدید',
    '/letters/dashboard': 'کارتابل من',
    '/letters/inbox': 'صندوق ورودی',
    '/letters/outbox': 'صندوق خروجی',
    '/letters/pending': 'نامه‌های در انتظار',
    '/letters/new': 'نامه جدید',
    '/workflow': 'مدیریت گردش کار',
    '/workflow/new': 'گردش کار جدید',
    '/signatures': 'مدیریت امضاها',
    '/signatures/pad/:id': 'پنل امضا',
    '/fax': 'مدیریت فکس',
    '/fax/new': 'ارسال فکس جدید',
    '/webhooks': 'مدیریت وب‌هوک',
    '/webhooks/new': 'وب‌هوک جدید',
    '/email/settings': 'تنظیمات ایمیل',
    '/email/inbox': 'دریافت ایمیل‌ها',
    '/categories/hardware': 'دسته‌بندی اموال',
    '/categories/document': 'دسته‌بندی اسناد',
    '/categories/credential': 'دسته‌بندی رمزها',
    '/letter-numbering': 'شماره‌گذاری نامه‌ها',
    '/ocr-search': 'جستجوی OCR',
    '/delegation': 'تفویض اختیار',
    '/referrals': 'مدیریت ارجاعات',
    '/referrals/:id': 'جزئیات ارجاع',
    '/dashboard/organization': 'کارتابل سازمانی',
    '/analytics': 'داشبورد تحلیلی',
  };
  if (titles[path]) return titles[path];
  const basePath = '/' + path.split('/')[1];
  if (titles[basePath]) return titles[basePath];
  return 'مدیریت سیستم';
};

// =============================================
// کامپوننت اصلی Layout
// =============================================
function Layout({ children }) {
  const { user, logout } = useAuth();
  const { isConnected, onlineUsers } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(() => window.innerWidth <= 480);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [siteTitle, setSiteTitle] = useState('سیستم یکپارچه مدیریت اطلاعات');
  const [copyright, setCopyright] = useState('تمامی حقوق محفوظ است');
  const [companyName, setCompanyName] = useState('');
  const [version, setVersion] = useState('2.0.0');
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const debounceTimer = useRef(null);

  // =============================================
  // ✅ تابع خروج از سیستم - نسخه نهایی
  // =============================================
  const handleLogout = () => {
    try {
      // ۱. خروج از سیستم (پاک کردن توکن و داده‌ها)
      logout();
      
      // ۲. پاک کردن همه داده‌های localStorage (امنیت بیشتر)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('permissions');
      localStorage.removeItem('theme');
      
      // ۳. پاک کردن sessionStorage
      sessionStorage.clear();
      
      // ۴. هدایت به صفحه لاگین با replace (جلوگیری از بازگشت با دکمه back)
      navigate('/login', { replace: true });
      
    } catch (error) {
      console.error('خطا در خروج از سیستم:', error);
      // اگر خطا رخ داد، مستقیماً به لاگین برو
      window.location.href = '/login';
    }
  };

  // =============================================
  // منوی کاربر
  // =============================================
  const userMenu = [
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: <Link to="/profile">پروفایل</Link>,
    },
    {
      key: 'change-password',
      icon: <KeyOutlined />,
      label: <Link to="/change-password">تغییر رمز</Link>,
    },
    {
      key: 'divider',
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined style={{ color: COLORS.danger }} />,
      label: 'خروج از سیستم',
      onClick: handleLogout,
      danger: true,
    },
  ];

  // =============================================
  // ✅ تابع مدیریت باز و بسته شدن منوها (Accordion Mode)
  // =============================================
  const handleOpenChange = (keys) => {
    // فقط آخرین منوی باز شده را نگه دار (Accordion Mode)
    const latestOpenKey = keys.length > 0 ? [keys[keys.length - 1]] : [];
    setOpenKeys(latestOpenKey);
  };

  // =============================================
  // دریافت اعلان‌ها
  // =============================================
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
    } catch (error) {
      console.error('خطا در دریافت اعلان‌ها:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.data?.count || 0);
    } catch (error) {
      console.error('خطا در دریافت تعداد اعلان‌ها:', error);
    }
  };

  // =============================================
  // علامت‌گذاری اعلان
  // =============================================
  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('خطا در علامت‌گذاری اعلان:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('خطا در علامت‌گذاری همه:', error);
    }
  };

  // =============================================
  // محتوای پاپ‌اور اعلان‌ها
  // =============================================
  const notificationContent = (
    <div style={{ width: isMobile ? '92vw' : 380, maxHeight: 420, overflow: 'auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        padding: '12px 16px', 
        borderBottom: '1px solid var(--border-color)', 
        background: 'var(--bg-secondary)', 
        borderRadius: '12px 12px 0 0' 
      }}>
        <strong style={{ fontSize: isMobile ? '13px' : '15px' }}>📬 اعلان‌ها</strong>
        <Space size="small">
          {unreadCount > 0 && (
            <Button type="link" size="small" onClick={markAllAsRead} style={{ padding: 0 }}>
              همه را خواندم
            </Button>
          )}
          <Button type="link" size="small" onClick={fetchNotifications} style={{ padding: 0 }}>
            ↻
          </Button>
        </Space>
      </div>
      <List
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item
            style={{ 
              background: item.isRead ? 'transparent' : 'rgba(22, 119, 255, 0.04)', 
              cursor: 'pointer', 
              padding: '12px 16px', 
              borderBottom: '1px solid var(--border-color)', 
              transition: 'all 0.2s ease' 
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.background = item.isRead ? 'transparent' : 'rgba(22, 119, 255, 0.04)'}
            onClick={() => { 
              if (!item.isRead) markAsRead(item._id); 
              if (item.link) navigate(item.link); 
              setPopoverOpen(false); 
            }}
          >
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ 
                  fontWeight: item.isRead ? 'normal' : 'bold', 
                  fontSize: isMobile ? '13px' : '14px' 
                }}>
                  {item.title}
                </span>
                {!item.isRead && (
                  <Tag color="blue" style={{ fontSize: '11px', padding: '0 8px' }}>
                    جدید
                  </Tag>
                )}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {item.message}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {toPersianDate(item.createdAt)}
              </div>
            </div>
          </List.Item>
        )}
        locale={{ 
          emptyText: (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>📭</div>
              <Text type="secondary">هیچ اعلانی وجود ندارد</Text>
            </div>
          ) 
        }}
      />
    </div>
  );

  // =============================================
  // دریافت تنظیمات
  // =============================================
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        const data = res.data.data || {};
        if (data.siteTitle) setSiteTitle(data.siteTitle);
        if (data.copyright) setCopyright(data.copyright);
        if (data.companyName) setCompanyName(data.companyName);
        if (data.version) setVersion(data.version);
      } catch (error) {
        console.error('خطا در دریافت تنظیمات:', error);
      }
    };
    fetchSettings();

    const handleSettingsUpdate = (event) => {
      if (event.detail?.siteTitle) setSiteTitle(event.detail.siteTitle);
      if (event.detail?.copyright) setCopyright(event.detail.copyright);
      if (event.detail?.companyName) setCompanyName(event.detail.companyName);
      if (event.detail?.version) setVersion(event.detail.version);
    };
    window.addEventListener('settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('settings-updated', handleSettingsUpdate);
  }, []);

  // =============================================
  // دریافت اعلان‌ها با useEffect
  // =============================================
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // =============================================
  // ریسپانسیو
  // =============================================
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsPhone(width <= 480);
      if (width > 768) {
        setDrawerOpen(false);
        document.body.classList.remove('no-scroll');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // =============================================
  // جستجو
  // =============================================
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await api.get(`/search/global?q=${encodeURIComponent(query)}`);
      setSearchResults(res.data.data || []);
    } catch (error) {
      console.error('خطا در جستجو:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!value.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    debounceTimer.current = setTimeout(() => performSearch(value), 500);
  };

  useEffect(() => {
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, []);

  // =============================================
  // دریافت منوها از دیتابیس
  // =============================================
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const res = await api.get('/menu/items');
        const menuData = res.data.data || [];
        if (menuData.length > 0) {
          setMenuItems(convertMenuItems(menuData));
        } else {
          setMenuItems(getDefaultMenuItems());
        }
      } catch (error) {
        console.error('خطا در دریافت منوها:', error);
        setMenuItems(getDefaultMenuItems());
      } finally {
        setLoadingMenu(false);
      }
    };
    fetchMenuItems();
  }, []);

  // =============================================
  // منوی پیش‌فرض
  // =============================================
  const getDefaultMenuItems = () => {
    return [
      {
        key: 'dashboard',
        icon: <DashboardOutlined style={{ color: COLORS.primary }} />,
        label: <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>داشبورد</Link>,
      },
      // ... سایر آیتم‌های منو
    ];
  };

  // =============================================
  // تبدیل منوها
  // =============================================
  const convertMenuItems = (items, parentId = null) => {
    const result = [];
    const currentLevelItems = items.filter(item => {
      const itemParentId = item.parent ? item.parent._id?.toString() || item.parent.toString() : null;
      return itemParentId === parentId;
    });

    currentLevelItems.sort((a, b) => (a.order || 0) - (b.order || 0));

    for (const item of currentLevelItems) {
      if (item.isActive === false) continue;
      const children = convertMenuItems(items, item._id.toString());
      const icon = getIconComponent(item.icon);

      let menuItem = {
        key: item.key,
        icon: icon,
        label: item.label,
      };

      if (item.path && item.path.trim() !== '') {
        menuItem.label = (
          <Link to={item.path} style={{ color: 'inherit', textDecoration: 'none' }}>
            {item.label}
          </Link>
        );
      }

      if (children.length > 0) {
        menuItem.children = children;
      }

      result.push(menuItem);
    }

    return result;
  };

  // =============================================
  // دریافت آیکون
  // =============================================
  const getIconComponent = (iconName) => {
    const icons = {
      'DashboardOutlined': <DashboardOutlined />,
      'AppstoreOutlined': <AppstoreOutlined />,
      'SafetyOutlined': <SafetyOutlined />,
      'FileTextOutlined': <FileTextOutlined />,
      'UserOutlined': <UserOutlined />,
      'SettingOutlined': <SettingOutlined />,
      'TeamOutlined': <TeamOutlined />,
      'FolderOutlined': <FolderOutlined />,
      'AuditOutlined': <AuditOutlined />,
      'MailOutlined': <MailOutlined />,
      'InboxOutlined': <InboxOutlined />,
      'ExportOutlined': <ExportOutlined />,
      'ApartmentOutlined': <ApartmentOutlined />,
      'ShareAltOutlined': <ShareAltOutlined />,
      'SignatureOutlined': <SignatureOutlined />,
      'PlusOutlined': <PlusOutlined />,
      'DatabaseOutlined': <DatabaseOutlined />,
      'ToolOutlined': <ToolOutlined />,
      'SafetyCertificateOutlined': <SafetyCertificateOutlined />,
      'SunOutlined': <SunOutlined />,
      'MoonOutlined': <MoonOutlined />,
      'DownOutlined': <DownOutlined />,
      'BellOutlined': <BellOutlined />,
      'SearchOutlined': <SearchOutlined />,
      'ProfileOutlined': <ProfileOutlined />,
      'KeyOutlined': <KeyOutlined />,
      'MenuFoldOutlined': <MenuFoldOutlined />,
      'MenuUnfoldOutlined': <MenuUnfoldOutlined />,
      'LogoutOutlined': <LogoutOutlined />,
      'BankOutlined': <BankOutlined />,
      'ClockCircleOutlined': <ClockCircleOutlined />,
      'PhoneOutlined': <PhoneOutlined />,
      'GlobalOutlined': <GlobalOutlined />,
      'ApiOutlined': <ApiOutlined />,
      'TagOutlined': <TagOutlined />,
      'NumberOutlined': <NumberOutlined />,
      'ScanOutlined': <ScanOutlined />,
      'SwapOutlined': <SwapOutlined />,
      'AreaChartOutlined': <AreaChartOutlined />,
      'BarChartOutlined': <BarChartOutlined />,
    };
    return icons[iconName] || <FileTextOutlined />;
  };

  // =============================================
  // محتوای سایدبار
  // =============================================
  const renderSidebarContent = () => (
    <>
      <div style={{
        padding: '16px 20px',
        color: 'white',
        fontSize: '16px',
        fontWeight: 'bold',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minHeight: '64px',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '24px' }}>🏢</span>
        {!collapsed && (
          <span style={{
            fontSize: '15px',
            background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '700'
          }}>
            {siteTitle}
          </span>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {loadingMenu ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            openKeys={openKeys}
            onOpenChange={handleOpenChange}
            items={menuItems}
            style={{ background: 'transparent', borderRight: 'none' }}
          />
        )}
      </div>

      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          style={{
            color: 'white',
            width: '100%',
            justifyContent: 'center',
            padding: '8px',
            fontSize: '16px',
            borderRadius: '10px',
            transition: 'all 0.3s ease',
            background: 'rgba(255,255,255,0.05)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          {collapsed ? 'باز کردن' : 'بستن'}
        </Button>
      </div>
    </>
  );

  // =============================================
  // بررسی صفحه لاگین
  // =============================================
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)' }}>{children}</div>;
  }

  // =============================================
  // رندر اصلی
  // =============================================
  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="dark"
          width={260}
          trigger={null}
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'hidden',
            background: 'rgba(30, 41, 59, 0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {renderSidebarContent()}
        </Sider>
      )}

      <Drawer
        placement="right"
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          document.body.classList.remove('no-scroll');
        }}
        size="75%"
        styles={{
          body: { padding: 0, background: 'rgba(30, 41, 59, 0.95)' },
          header: { display: 'none' }
        }}
        closable={false}
        maskClosable={true}
        style={{ background: 'transparent' }}
      >
        {renderSidebarContent()}
      </Drawer>

      <AntLayout style={{ display: 'flex', flexDirection: 'column' }}>
        <Header style={{
          background: 'var(--bg-primary)',
          padding: isMobile ? '0 8px' : '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          height: isMobile ? '48px' : '64px',
          transition: 'all 0.3s ease',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
            <Button
              type="text"
              icon={isMobile ? <MenuUnfoldOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
              onClick={isMobile ? () => {
                const newState = !drawerOpen;
                setDrawerOpen(newState);
                if (newState) {
                  document.body.classList.add('no-scroll');
                } else {
                  document.body.classList.remove('no-scroll');
                }
              } : () => setCollapsed(!collapsed)}
              style={{
                fontSize: isMobile ? '16px' : '18px',
                color: 'var(--text-secondary)',
                padding: '4px 8px',
                height: isMobile ? '32px' : '40px',
                width: isMobile ? '32px' : '40px',
                borderRadius: '10px'
              }}
            />
            <Text strong style={{
              fontSize: isMobile ? '13px' : '16px',
              color: 'var(--text-primary)',
              display: isMobile ? 'none' : 'block'
            }}>
              {getPageTitle(location.pathname)}
            </Text>
            {isMobile && (
              <Text strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                {getPageTitle(location.pathname)}
              </Text>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px' }}>
            <Tooltip title={isConnected ? 'اتصال برقرار است' : 'در حال اتصال...'} placement="bottom">
              <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: isConnected ? '#52c41a' : '#ff4d4f',
                marginRight: isMobile ? 0 : 4,
                display: 'inline-block',
                animation: isConnected ? 'none' : 'pulse 1.5s infinite',
              }} />
            </Tooltip>

            {!isPhone && <OnlineUsers />}

            <Tooltip title={isDark ? 'حالت روشن' : 'حالت تاریک'} placement="bottom">
              <Button
                type="text"
                icon={isDark ? <SunOutlined style={{ color: COLORS.warning, fontSize: isMobile ? '16px' : '20px' }} /> : <MoonOutlined style={{ color: COLORS.primary, fontSize: isMobile ? '16px' : '20px' }} />}
                onClick={toggleTheme}
                style={{
                  height: isMobile ? '32px' : '40px',
                  width: isMobile ? '32px' : '40px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                className="theme-toggle"
              />
            </Tooltip>

            <Tooltip title="جستجوی پیشرفته" placement="bottom">
              <Button
                type="text"
                icon={<SearchOutlined style={{ fontSize: isMobile ? '16px' : '18px', color: 'var(--text-secondary)' }} />}
                onClick={() => setSearchModalOpen(true)}
                style={{
                  height: isMobile ? '32px' : '40px',
                  width: isMobile ? '32px' : '40px',
                  borderRadius: '10px'
                }}
              />
            </Tooltip>

            <Popover
              content={notificationContent}
              title={null}
              trigger="click"
              open={popoverOpen}
              onOpenChange={setPopoverOpen}
              placement="bottomRight"
              overlayStyle={{ padding: 0, borderRadius: '12px' }}
            >
              <Badge count={unreadCount} size="small" offset={[-2, 6]} style={{ background: COLORS.danger }}>
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: isMobile ? '16px' : '18px', color: 'var(--text-secondary)' }} />}
                  className={unreadCount > 0 ? 'bell-animation' : ''}
                  style={{
                    height: isMobile ? '32px' : '40px',
                    width: isMobile ? '32px' : '40px',
                    borderRadius: '10px'
                  }}
                />
              </Badge>
            </Popover>

            <Dropdown menu={{ items: userMenu }} placement="bottomRight" trigger={['click']}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '4px' : '10px',
                cursor: 'pointer',
                padding: isMobile ? '4px 6px' : '4px 12px 4px 8px',
                borderRadius: '10px',
                transition: 'all 0.3s ease',
                height: isMobile ? '32px' : '44px',
                border: '1px solid transparent',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
              >
                <Avatar icon={<UserOutlined />} style={{
                  background: COLORS.primary,
                  boxShadow: '0 2px 8px rgba(22, 119, 255, 0.3)',
                  width: isMobile ? 24 : 32,
                  height: isMobile ? 24 : 32
                }} />
                <div style={{ display: isMobile ? 'none' : 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <Text strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{user?.fullName || user?.username || 'کاربر'}</Text>
                  <Text type="secondary" style={{ fontSize: '11px' }}>{user?.role?.label || 'کاربر عادی'}</Text>
                </div>
                <DownOutlined style={{ fontSize: '12px', color: 'var(--text-muted)' }} />
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{
          margin: isMobile ? '8px' : '20px 24px',
          padding: isMobile ? '8px' : '24px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius)',
          flex: 1,
          minHeight: isMobile ? 'calc(100vh - 100px)' : 'calc(100vh - 180px)',
          transition: 'all 0.3s ease',
        }}>
          {children}
        </Content>

        <footer className="app-footer" style={{
          background: 'var(--bg-primary)',
          borderTop: '1px solid var(--border-color)',
          padding: isMobile ? '8px 12px' : '16px 24px',
          marginTop: 'auto',
          transition: 'all 0.3s ease',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: isMobile ? 'center' : 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: isMobile ? '4px' : '8px',
            flexDirection: isMobile ? 'column' : 'row',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: isMobile ? '11px' : '13px', color: 'var(--text-secondary)' }}>
              {copyright} © {new Date().getFullYear()} - {companyName || 'سازمان'}
            </div>
            <div style={{ display: 'flex', gap: isMobile ? '8px' : '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <a href="/help" style={{ fontSize: isMobile ? '11px' : '13px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'all 0.3s ease', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.primary; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >❓ راهنما</a>
              <a href="/contact" style={{ fontSize: isMobile ? '11px' : '13px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'all 0.3s ease', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.primary; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >📞 تماس با ما</a>
              <span style={{
                fontSize: isMobile ? '10px' : '12px',
                color: 'var(--text-secondary)',
                opacity: 0.6,
                padding: '2px 8px',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                fontFamily: 'monospace',
              }}>نسخه {version}</span>
            </div>
          </div>
        </footer>
      </AntLayout>

      {/* مودال جستجو */}
      <Modal
        title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><SearchOutlined style={{ color: COLORS.primary }} /><span>جستجوی هوشمند</span></div>}
        open={searchModalOpen}
        onCancel={() => { setSearchModalOpen(false); setSearchResults([]); setSearchQuery(''); setSearchLoading(false); }}
        footer={null}
        width={isMobile ? '92%' : 700}
        destroyOnHidden={true}
        style={{ top: isMobile ? 30 : 60 }}
        className={isMobile ? "ant-modal-fullscreen-mobile" : ""}
      >
        <Input.Search
          placeholder="تایپ کنید..."
          size="large"
          value={searchQuery}
          onChange={handleSearchChange}
          loading={searchLoading}
          autoFocus
          enterButton={<SearchOutlined />}
          style={{ marginBottom: 16 }}
        />
        {searchLoading && <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /><div style={{ marginTop: 16, color: 'var(--text-secondary)' }}>در حال جستجو...</div></div>}
        {!searchLoading && searchQuery.trim() && searchResults.length === 0 && <div style={{ textAlign: 'center', padding: 40 }}><Empty description="نتیجه‌ای یافت نشد" /></div>}
        {!searchLoading && searchResults.length > 0 && <div style={{ marginTop: 8, maxHeight: 400, overflow: 'auto' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 12, padding: '4px 12px', background: 'var(--bg-secondary)', borderRadius: '6px', display: 'inline-block' }}>{searchResults.length} نتیجه</div>
          {searchResults.map((item, index) => (
            <Card key={index} size="small" style={{ marginBottom: 8, borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s ease' }} hoverable
              onClick={() => {
                if (item._type === 'hardware' && item._id) navigate(`/hardware/${item._id}`);
                else if (item._type === 'credential' && item._id) navigate(`/credentials/${item._id}`);
                else if (item._type === 'document' && item._id) navigate(`/documents`);
                else if (item._type === 'letter' && item._id) navigate(`/letters/${item._id}`);
                setSearchModalOpen(false);
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = COLORS.primary}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '14px' }}>{item.title || item.name || item.systemName}</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.description || item.serialNumber || item.username || '-'}</div>
                  {item.tags && item.tags.length > 0 && <div style={{ marginTop: '4px' }}>{item.tags.slice(0, 3).map(tag => <Tag key={tag} size="small" style={{ fontSize: '11px' }}>{tag}</Tag>)}{item.tags.length > 3 && <Tag size="small" style={{ fontSize: '11px' }}>+{item.tags.length - 3}</Tag>}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <Tag color={item._type === 'hardware' ? 'blue' : item._type === 'credential' ? 'orange' : item._type === 'letter' ? 'purple' : 'green'} style={{ fontSize: '11px' }}>
                    {item._type === 'hardware' ? '💻' : item._type === 'credential' ? '🔐' : item._type === 'letter' ? '✉️' : '📄'}
                  </Tag>
                  <Space size="small">
                    <Tag color={item._score > 70 ? 'green' : item._score > 40 ? 'gold' : 'red'}>⭐ {item._score}%</Tag>
                    {item._matchType && <Tag color="purple" style={{ fontSize: '10px' }}>{item._matchType}</Tag>}
                  </Space>
                </div>
              </div>
            </Card>
          ))}
        </div>}
      </Modal>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        .ant-menu-dark .ant-menu-item-selected {
          background: rgba(22, 119, 255, 0.25) !important;
          border-left: 3px solid var(--color-primary) !important;
          border-radius: 0 8px 8px 0 !important;
        }
        .ant-menu-dark .ant-menu-item:hover {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        .ant-menu-dark .ant-menu-submenu-title:hover {
          background: rgba(255, 255, 255, 0.05) !important;
        }
      `}</style>
    </AntLayout>
  );
}

export default Layout;
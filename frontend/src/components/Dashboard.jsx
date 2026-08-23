// frontend/src/components/Dashboard.jsx
import { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Typography, Spin, Tag, Button, Empty, message, Space, Badge } from 'antd';
import {
  AppstoreOutlined,
  SafetyOutlined,
  FileTextOutlined,
  ProjectOutlined,
  TeamOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  PlusOutlined,
  MailOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SignatureOutlined,
  PhoneOutlined,
  UserOutlined,
  EyeOutlined,
  SendOutlined,
  TeamOutlined as TeamIcon,
  NumberOutlined,
  ScanOutlined,
  SwapOutlined,
  ShareAltOutlined,
  BarChartOutlined,
  AreaChartOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import letterService from '../services/letterService';
import { toPersianDate } from '../utils/dateHelper';
import { toPersianNumber, toPersianPrice } from '../utils/numberHelper';
import { COLORS } from '../styles/theme';
import LetterStatusBadge from './letters/LetterStatusBadge';

const { Title, Text } = Typography;

// =============================================
// کامپوننت انیمیشن شمارش اعداد
// =============================================
function AnimatedNumber({ value, duration = 1500, isPrice = false }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    const currentRef = elementRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const startTime = Date.now();
    const startValue = 0;
    const endValue = value;
    const updateNumber = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(startValue + (endValue - startValue) * eased);
      setDisplayValue(current);
      if (progress < 1) requestAnimationFrame(updateNumber);
      else setDisplayValue(endValue);
    };
    requestAnimationFrame(updateNumber);
  }, [isVisible, value, duration]);

  const formattedValue = isPrice 
    ? toPersianPrice(displayValue)
    : toPersianNumber(displayValue);

  return <span ref={elementRef}>{formattedValue}</span>;
}

// =============================================
// کامپوننت کارت آماری
// =============================================
function StatCard({ title, value, icon, color, bg, iconBg, loading, subtitle, onClick, isPrice = false }) {
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  
  useEffect(() => {
    const handleResize = () => {
      setIsPhone(window.innerWidth <= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Card 
      className="stat-card" 
      loading={loading} 
      style={{ 
        borderTop: `3px solid ${color}`, 
        borderRadius: 'var(--radius)', 
        cursor: onClick ? 'pointer' : 'default', 
        height: '100%', 
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
        minHeight: isPhone ? '70px' : '90px' 
      }}
      styles={{ body: { padding: isPhone ? '8px 12px' : '12px 16px' } }}
      onClick={onClick} 
      hoverable
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: isPhone ? '6px' : '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text type="secondary" style={{ 
            fontSize: isPhone ? '10px' : '12px', 
            fontWeight: '500', 
            display: 'block', 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis' 
          }}>{title}</Text>
          <div style={{ 
            fontSize: isPhone ? '16px' : '22px', 
            fontWeight: '700', 
            marginTop: '0px', 
            color: 'var(--text-primary)', 
            lineHeight: 1.2 
          }}>
            {loading ? (
              <span style={{ opacity: 0.3 }}>•••</span>
            ) : (
              <AnimatedNumber value={typeof value === 'number' ? value : 0} isPrice={isPrice} />
            )}
          </div>
          {subtitle && <div style={{ fontSize: isPhone ? '9px' : '11px', color: 'var(--text-muted)', marginTop: '0px' }}>{subtitle}</div>}
        </div>
        <div style={{ 
          fontSize: isPhone ? '18px' : '24px', 
          color: color, 
          background: iconBg || bg, 
          padding: isPhone ? '6px' : '8px', 
          borderRadius: '10px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minWidth: isPhone ? '32px' : '40px', 
          minHeight: isPhone ? '32px' : '40px', 
          flexShrink: 0 
        }}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

// =============================================
// کامپوننت اسکلتون
// =============================================
function StatCardSkeleton() {
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  
  useEffect(() => {
    const handleResize = () => setIsPhone(window.innerWidth <= 480);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Card className="stat-card" style={{ 
      borderRadius: 'var(--radius)', 
      height: '100%', 
      minHeight: isPhone ? '70px' : '90px' 
    }} 
      styles={{ body: { padding: isPhone ? '8px 12px' : '12px 16px' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ height: '12px', background: 'var(--bg-secondary)', borderRadius: '4px', width: '60%', marginBottom: '6px' }} />
          <div style={{ height: '20px', background: 'var(--bg-secondary)', borderRadius: '4px', width: '40%' }} />
        </div>
        <div style={{ width: '40px', height: '40px', background: 'var(--bg-secondary)', borderRadius: '10px', flexShrink: 0 }} />
      </div>
    </Card>
  );
}

// =============================================
// کامپوننت اصلی Dashboard
// =============================================
function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  
  const [stats, setStats] = useState({
    hardware: 0,
    credentials: 0,
    documents: 0,
    tickets: 0,
    users: 0,
    letters: 0,
    inactiveUsers: 0,
    openTickets: 0,
    inProgressTickets: 0,
    activeHardware: 0,
    totalValue: 0,
    letterStats: {
      draft: 0,
      registered: 0,
      in_review: 0,
      approved: 0,
      rejected: 0,
      signed: 0,
      archived: 0,
    },
    recentLetters: [],
    recentTickets: [],
    recentHardware: [],
    recentActivities: [],
  });

  // =============================================
  // دریافت داده‌ها
  // =============================================
  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    
    try {
      const [hardwareRes, credRes, docRes, ticketRes, userRes] = await Promise.all([
        api.get('/hardware').catch(() => ({ data: { data: [] } })),
        api.get('/credentials').catch(() => ({ data: { data: [] } })),
        api.get('/documents').catch(() => ({ data: { data: [] } })),
        api.get('/tickets').catch(() => ({ data: { data: [] } })),
        api.get('/auth/users').catch(() => ({ data: { data: [] } })),
      ]);

      const hardware = hardwareRes.data.data || [];
      const tickets = ticketRes.data.data || [];
      const users = userRes.data.data || [];

      let letterStats = {};
      let recentLetters = [];
      try {
        const statsRes = await letterService.getSimpleStats();
        letterStats = statsRes.data.data || {};
        
        const recentLettersRes = await letterService.getAll({ limit: 5, page: 1 });
        recentLetters = recentLettersRes.data.data || [];
      } catch (e) {
        console.warn('⚠️ خطا در دریافت آمار نامه‌ها:', e.message);
        letterStats = {
          draft: 0,
          registered: 0,
          in_review: 0,
          approved: 0,
          rejected: 0,
          signed: 0,
          archived: 0,
          total: 0,
          today: 0,
          byType: { incoming: 0, outgoing: 0, internal: 0 }
        };
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const inactiveUsers = users.filter(u => u.isActive && (!u.lastLogin || new Date(u.lastLogin) < thirtyDaysAgo));

      const totalValue = hardware.reduce((sum, h) => sum + (h.price || 0), 0);

      let recentActivities = [];
      try {
        const activitiesRes = await api.get('/audit', { params: { limit: 5 } });
        recentActivities = activitiesRes.data.data || [];
      } catch (e) {
        console.warn('⚠️ خطا در دریافت فعالیت‌ها:', e.message);
      }

      setStats({
        hardware: hardware.length,
        credentials: credRes.data.data?.length || 0,
        documents: docRes.data.data?.length || 0,
        tickets: tickets.length,
        users: users.length,
        letters: letterStats.total || 0,
        inactiveUsers: inactiveUsers.length,
        openTickets: tickets.filter(t => t.status === 'open').length,
        inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
        activeHardware: hardware.filter(h => h.status === 'active').length,
        totalValue,
        letterStats: {
          draft: letterStats.draft || 0,
          registered: letterStats.registered || 0,
          in_review: letterStats.in_review || 0,
          approved: letterStats.approved || 0,
          rejected: letterStats.rejected || 0,
          signed: letterStats.signed || 0,
          archived: letterStats.archived || 0,
        },
        recentLetters: recentLetters.slice(0, 5),
        recentTickets: tickets.slice(0, 5),
        recentHardware: hardware.slice(0, 5),
        recentActivities: recentActivities.slice(0, 5),
      });

    } catch (error) {
      console.error('خطا در دریافت آمار:', error);
      message.error('خطا در دریافت آمار داشبورد');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => fetchData(false);

  // =============================================
  // کارت‌های آماری
  // =============================================
  const statConfigs = [
    { 
      title: 'نامه‌ها', 
      value: stats.letters, 
      icon: <MailOutlined />, 
      color: COLORS.primary, 
      bg: 'rgba(22, 119, 255, 0.08)', 
      iconBg: 'rgba(22, 119, 255, 0.15)', 
      subtitle: `${toPersianNumber(stats.letterStats.in_review)} در انتظار`,
      onClick: () => navigate('/letters/inbox'),
    },
    { 
      title: 'اموال', 
      value: stats.hardware, 
      icon: <AppstoreOutlined />, 
      color: COLORS.primary, 
      bg: 'rgba(22, 119, 255, 0.08)', 
      iconBg: 'rgba(22, 119, 255, 0.15)', 
      subtitle: `${toPersianNumber(stats.activeHardware)} فعال`,
      onClick: () => navigate('/hardware'),
    },
    { 
      title: 'تیکت‌ها', 
      value: stats.tickets, 
      icon: <ProjectOutlined />, 
      color: COLORS.purple, 
      bg: 'rgba(114, 46, 209, 0.08)', 
      iconBg: 'rgba(114, 46, 209, 0.15)', 
      subtitle: `${toPersianNumber(stats.openTickets)} باز`,
      onClick: () => navigate('/tickets'),
    },
    { 
      title: 'کاربران', 
      value: stats.users, 
      icon: <TeamOutlined />, 
      color: COLORS.cyan, 
      bg: 'rgba(19, 194, 194, 0.08)', 
      iconBg: 'rgba(19, 194, 194, 0.15)', 
      subtitle: `${toPersianNumber(stats.users - stats.inactiveUsers)} فعال`,
      onClick: () => navigate('/users'),
    },
    { 
      title: 'اسناد', 
      value: stats.documents, 
      icon: <FileTextOutlined />, 
      color: COLORS.success, 
      bg: 'rgba(82, 196, 26, 0.08)', 
      iconBg: 'rgba(82, 196, 26, 0.15)', 
      onClick: () => navigate('/documents'),
    },
    { 
      title: 'ارزش کل', 
      value: stats.totalValue, 
      icon: <DatabaseOutlined />, 
      color: COLORS.pink, 
      bg: 'rgba(235, 47, 150, 0.08)', 
      iconBg: 'rgba(235, 47, 150, 0.15)', 
      subtitle: 'تومان',
      onClick: () => navigate('/hardware'),
      isPrice: true,
    },
  ];

  // =============================================
  // وضعیت نامه‌ها
  // =============================================
  const letterStatusItems = [
    { key: 'draft', label: 'پیش‌نویس', count: stats.letterStats.draft, color: '#8c8c8c', icon: '📝' },
    { key: 'registered', label: 'ثبت شده', count: stats.letterStats.registered, color: '#1677ff', icon: '📋' },
    { key: 'in_review', label: 'در بررسی', count: stats.letterStats.in_review, color: '#faad14', icon: '🔄' },
    { key: 'approved', label: 'تأیید شده', count: stats.letterStats.approved, color: '#52c41a', icon: '✅' },
    { key: 'rejected', label: 'رد شده', count: stats.letterStats.rejected, color: '#ff4d4f', icon: '❌' },
    { key: 'signed', label: 'امضا شده', count: stats.letterStats.signed, color: '#722ed1', icon: '✍️' },
    { key: 'archived', label: 'بایگانی', count: stats.letterStats.archived, color: '#8c8c8c', icon: '📁' },
  ];

  // =============================================
  // بارگذاری
  // =============================================
  if (loading) {
    return (
      <div style={{ padding: '20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: '12px' }}>
          <div><div style={{ height: isMobile ? '24px' : '32px', width: '150px', background: 'var(--bg-secondary)', borderRadius: '6px' }} /></div>
          <div style={{ height: isMobile ? '32px' : '40px', width: '80px', background: 'var(--bg-secondary)', borderRadius: '10px' }} />
        </div>
        <Row gutter={[isPhone ? 4 : 8, isPhone ? 4 : 8]}>
          {Array.from({ length: 6 }).map((_, i) => (<Col key={i} xs={12} sm={12} md={8} lg={8} xl={8}><StatCardSkeleton /></Col>))}
        </Row>
        <Row gutter={[isPhone ? 4 : 8, isPhone ? 4 : 8]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}><Card style={{ borderRadius: 'var(--radius)', height: 200 }}><Spin /></Card></Col>
          <Col xs={24} lg={12}><Card style={{ borderRadius: 'var(--radius)', height: 200 }}><Spin /></Card></Col>
        </Row>
      </div>
    );
  }

  // =============================================
  // رندر اصلی
  // =============================================
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <Title level={isMobile ? 4 : 2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 داشبورد
            <Tag color="blue" style={{ fontSize: isMobile ? '10px' : '13px' }}>
              {new Date().toLocaleDateString('fa-IR')}
            </Tag>
          </Title>
          <Text type="secondary" style={{ fontSize: isMobile ? '11px' : '14px' }}>
            خلاصه وضعیت سیستم مدیریت یکپارچه
          </Text>
        </div>
        <Space wrap>
          <Button 
            icon={<ReloadOutlined spin={refreshing} />} 
            onClick={handleRefresh} 
            loading={refreshing} 
            size={isMobile ? 'small' : 'large'}
          >
            {isMobile ? '' : 'بروزرسانی'}
          </Button>
        </Space>
      </div>

      <Row gutter={[isPhone ? 4 : 8, isPhone ? 4 : 8]}>
        {statConfigs.map((config, index) => (
          <Col key={index} xs={12} sm={12} md={8} lg={8} xl={8}>
            <StatCard {...config} loading={loading} isPrice={config.isPrice || false} />
          </Col>
        ))}
      </Row>

      {stats.inactiveUsers > 0 && (
        <Card style={{ marginTop: 12, borderColor: COLORS.warning, background: 'rgba(250, 173, 20, 0.05)', borderRadius: 'var(--radius)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <WarningOutlined style={{ color: COLORS.warning, fontSize: isMobile ? '18px' : '24px' }} />
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
              <Text strong style={{ color: COLORS.warning, fontSize: isMobile ? '12px' : '14px' }}>
                ⚠️ {toPersianNumber(stats.inactiveUsers)} کاربر غیرفعال
              </Text>
              <Text type="secondary" style={{ fontSize: isMobile ? '10px' : '13px' }}>
                بیش از ۳۰ روز است وارد نشده‌اند
              </Text>
            </div>
            <Button type="link" onClick={() => navigate('/users')} size="small">مشاهده</Button>
          </div>
        </Card>
      )}

      <Card style={{ marginTop: 12, borderRadius: 'var(--radius)' }} 
        title={
          <Space>
            <MailOutlined style={{ color: COLORS.primary }} />
            <span>وضعیت نامه‌ها</span>
            <Badge count={stats.letters} style={{ background: COLORS.primary }} />
          </Space>
        }
        extra={<Button type="link" onClick={() => navigate('/letters/inbox')} size="small">مشاهده همه</Button>}
      >
        <Row gutter={[isPhone ? 4 : 8, isPhone ? 4 : 8]}>
          {letterStatusItems.map((item) => (
            <Col key={item.key} xs={12} sm={6} md={3}>
              <Card size="small" style={{ borderRight: `3px solid ${item.color}`, borderRadius: 8, cursor: 'pointer', textAlign: 'center' }}
                styles={{ body: { padding: isPhone ? '4px 8px' : '8px 12px' } }}
                onClick={() => navigate('/letters/inbox')}
              >
                <div style={{ fontSize: isPhone ? '20px' : '28px' }}>{item.icon}</div>
                <div style={{ fontSize: isPhone ? '14px' : '20px', fontWeight: 700, color: item.color }}>
                  {toPersianNumber(item.count)}
                </div>
                <div style={{ fontSize: isPhone ? '9px' : '11px', color: 'var(--text-muted)' }}>
                  {item.label}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={[isPhone ? 4 : 8, isPhone ? 4 : 8]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={8}>
          <Card title={<span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: isMobile ? '13px' : '16px' }}>
            <MailOutlined style={{ color: COLORS.primary }} /> نامه‌های اخیر
          </span>}
            extra={<Button type="link" onClick={() => navigate('/letters/inbox')} size="small">همه</Button>}
            style={{ height: '100%', borderRadius: 'var(--radius)' }}
            styles={{ body: { padding: isMobile ? '8px' : '24px' } }}
          >
            {stats.recentLetters.length === 0 ? (
              <Empty description="هیچ نامه‌ای ثبت نشده" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              stats.recentLetters.map((item) => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '6px 0' : '10px 0', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={() => navigate(`/letters/${item._id}`)}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: '500', fontSize: isMobile ? '12px' : '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? '80px' : '150px' }}>
                      {item.subject}
                    </div>
                    <div style={{ fontSize: isMobile ? '9px' : '12px', color: 'var(--text-muted)' }}>
                      {toPersianDate(item.createdAt)}
                    </div>
                  </div>
                  <LetterStatusBadge status={item.status} size="small" />
                </div>
              ))
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={<span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: isMobile ? '13px' : '16px' }}>
            <ProjectOutlined style={{ color: COLORS.purple }} /> تیکت‌های اخیر
          </span>}
            extra={<Button type="link" onClick={() => navigate('/tickets')} size="small">همه</Button>}
            style={{ height: '100%', borderRadius: 'var(--radius)' }}
            styles={{ body: { padding: isMobile ? '8px' : '24px' } }}
          >
            {stats.recentTickets.length === 0 ? (
              <Empty description="هیچ تیکتی ثبت نشده" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              stats.recentTickets.map((item) => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '6px 0' : '10px 0', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={() => navigate(`/tickets/${item._id}`)}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: '500', fontSize: isMobile ? '12px' : '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? '80px' : '150px' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: isMobile ? '9px' : '12px', color: 'var(--text-muted)' }}>
                      {toPersianDate(item.createdAt)}
                    </div>
                  </div>
                  <Tag color={item.status === 'open' ? 'warning' : item.status === 'in_progress' ? 'processing' : item.status === 'resolved' ? 'success' : 'default'}>
                    {item.status === 'open' ? 'باز' : item.status === 'in_progress' ? 'بررسی' : item.status === 'resolved' ? 'حل' : 'بسته'}
                  </Tag>
                </div>
              ))
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={<span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: isMobile ? '13px' : '16px' }}>
            <EyeOutlined style={{ color: COLORS.orange }} /> فعالیت‌های اخیر
          </span>}
            extra={<Button type="link" onClick={() => navigate('/audit')} size="small">همه</Button>}
            style={{ height: '100%', borderRadius: 'var(--radius)' }}
            styles={{ body: { padding: isMobile ? '8px' : '24px' } }}
          >
            {stats.recentActivities.length === 0 ? (
              <Empty description="هیچ فعالیتی ثبت نشده" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              stats.recentActivities.map((item) => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '6px 0' : '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: '500', fontSize: isMobile ? '12px' : '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? '80px' : '150px' }}>
                      {item.action || 'عملیات'}
                    </div>
                    <div style={{ fontSize: isMobile ? '9px' : '12px', color: 'var(--text-muted)' }}>
                      {item.fullName || item.username || 'سیستم'} • {toPersianDate(item.createdAt)}
                    </div>
                  </div>
                  <Tag color={item.action === 'CREATE' ? 'success' : item.action === 'UPDATE' ? 'processing' : 'default'}>
                    {item.action || 'نامشخص'}
                  </Tag>
                </div>
              ))
            )}
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 12, borderRadius: 'var(--radius)' }} title={isMobile ? '🚀 سریع' : '🚀 اقدامات سریع'}>
        <Space wrap size={[isPhone ? 2 : 4, 4]}>
          <Button type="primary" icon={<PlusOutlined />} size={isPhone ? "small" : isMobile ? "middle" : "middle"} 
            onClick={() => navigate('/letters/new')} style={{ fontSize: isPhone ? "11px" : "14px" }}>
            {isPhone ? 'نامه' : isMobile ? 'نامه جدید' : 'ثبت نامه جدید'}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} size={isPhone ? "small" : isMobile ? "middle" : "middle"} 
            onClick={() => navigate('/hardware/new')} style={{ fontSize: isPhone ? "11px" : "14px" }}>
            {isPhone ? 'اموال' : isMobile ? 'ثبت اموال' : 'ثبت اموال جدید'}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} size={isPhone ? "small" : isMobile ? "middle" : "middle"} 
            onClick={() => navigate('/tickets/new')} style={{ fontSize: isPhone ? "11px" : "14px" }}>
            {isPhone ? 'تیکت' : isMobile ? 'ثبت تیکت' : 'ثبت تیکت جدید'}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} size={isPhone ? "small" : isMobile ? "middle" : "middle"} 
            onClick={() => navigate('/users/new')} style={{ fontSize: isPhone ? "11px" : "14px" }}>
            {isPhone ? 'کاربر' : isMobile ? 'ثبت کاربر' : 'ثبت کاربر جدید'}
          </Button>
          {/* ✅ دکمه جدید: کارتابل سازمانی */}
          <Button 
            type="default" 
            icon={<TeamIcon />} 
            size={isPhone ? "small" : isMobile ? "middle" : "middle"} 
            onClick={() => navigate('/dashboard/organization')} 
            style={{ fontSize: isPhone ? "11px" : "14px" }}
          >
            {isPhone ? 'سازمانی' : isMobile ? 'کارتابل سازمانی' : 'کارتابل سازمانی'}
          </Button>
          {/* ✅ دکمه جدید: داشبورد تحلیلی */}
          <Button 
            type="default" 
            icon={<AreaChartOutlined />} 
            size={isPhone ? "small" : isMobile ? "middle" : "middle"} 
            onClick={() => navigate('/analytics')} 
            style={{ fontSize: isPhone ? "11px" : "14px" }}
          >
            {isPhone ? 'تحلیلی' : isMobile ? 'داشبورد تحلیلی' : 'داشبورد تحلیلی'}
          </Button>
        </Space>
      </Card>

      <style>{`
        .stat-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-hover) !important;
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
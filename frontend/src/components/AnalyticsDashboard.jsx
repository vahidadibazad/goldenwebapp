import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Spin,
  Empty,
  Select,
  DatePicker,
  Button,
  Space,
  Badge,
  Tag,
  Progress,
  List,
  Avatar,
  Divider,
  message,
  App,
  Tooltip,
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  AreaChartOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UserOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  FallOutlined,
  MinusOutlined,
  ClearOutlined, // ✅ اضافه شد
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toPersianDate } from '../utils/dateHelper';
import { COLORS } from '../styles/theme';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

function AnalyticsDashboard() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: {
      totalLetters: 0,
      totalArchived: 0,
      totalPending: 0,
      totalOverdue: 0,
      totalReferrals: 0,
    },
    dailyStats: [],
    byType: [],
    byStatus: [],
    byReferralStatus: [],
    topUsers: [],
    period: {
      from: null,
      to: null,
      days: 30,
    },
  });
  const [filters, setFilters] = useState({
    days: 30,
    dateRange: [],
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsPhone(window.innerWidth <= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // =============================================
  // دریافت داده‌ها
  // =============================================
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.days) params.append('days', filters.days);
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.append('fromDate', filters.dateRange[0].toISOString());
        params.append('toDate', filters.dateRange[1].toISOString());
      }

      const res = await api.get(`/dashboard/analytics?${params.toString()}`);
      setData(res.data.data || {});
    } catch (error) {
      console.error('❌ خطا در دریافت اطلاعات:', error);
      message.error('خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  // =============================================
  // کارت‌های آماری کلی
  // =============================================
  const overviewStats = [
    {
      title: 'کل نامه‌ها',
      value: data.overview?.totalLetters || 0,
      icon: <FileTextOutlined />,
      color: COLORS.primary,
      change: '+12%',
      trend: 'up',
    },
    {
      title: 'در انتظار بررسی',
      value: data.overview?.totalPending || 0,
      icon: <ClockCircleOutlined />,
      color: COLORS.warning,
      change: '-5%',
      trend: 'down',
    },
    {
      title: 'معوق',
      value: data.overview?.totalOverdue || 0,
      icon: <ExclamationCircleOutlined />,
      color: COLORS.danger,
      change: '+8%',
      trend: 'up',
    },
    {
      title: 'ارجاعات',
      value: data.overview?.totalReferrals || 0,
      icon: <UserOutlined />,
      color: COLORS.purple,
      change: '+3%',
      trend: 'up',
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" description="در حال بارگذاری..." />
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* هدر */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <Title level={isPhone ? 4 : isMobile ? 3 : 2} style={{ margin: 0 }}>
          📊 داشبورد تحلیلی
          <Tag color="purple" style={{ marginRight: 8, fontSize: isPhone ? '10px' : '13px' }}>
            {data.period?.days || 30} روز گذشته
          </Tag>
        </Title>
        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
            size={isPhone ? 'small' : 'middle'}
          >
            بروزرسانی
          </Button>
          <Button
            icon={<DownloadOutlined />}
            size={isPhone ? 'small' : 'middle'}
          >
            خروجی
          </Button>
        </Space>
      </div>

      {/* فیلترها */}
      <Card style={{ borderRadius: 'var(--radius)', marginBottom: 16 }}>
        <Row gutter={[8, 8]} align="middle">
          <Col xs={24} md={8}>
            <Select
              value={filters.days}
              onChange={(value) => setFilters({ ...filters, days: value })}
              style={{ width: '100%' }}
              size={isPhone ? 'small' : 'middle'}
            >
              <Option value={7}>۷ روز گذشته</Option>
              <Option value={15}>۱۵ روز گذشته</Option>
              <Option value={30}>۳۰ روز گذشته</Option>
              <Option value={60}>۶۰ روز گذشته</Option>
              <Option value={90}>۹۰ روز گذشته</Option>
            </Select>
          </Col>
          <Col xs={24} md={14}>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates || [] })}
              placeholder={['از تاریخ', 'تا تاریخ']}
              size={isPhone ? 'small' : 'middle'}
              style={{ width: '100%' }}
              format="YYYY/MM/DD"
            />
          </Col>
          <Col xs={24} md={2}>
            <Button
              icon={<ClearOutlined />}
              onClick={() => setFilters({ days: 30, dateRange: [] })}
              size={isPhone ? 'small' : 'middle'}
              block
            >
              پاک
            </Button>
          </Col>
        </Row>
      </Card>

      {/* آمار کلی */}
      <Row gutter={[isPhone ? 4 : 8, isPhone ? 4 : 8]} style={{ marginBottom: 16 }}>
        {overviewStats.map((stat, index) => (
          <Col key={index} xs={12} sm={6}>
            <Card
              className="stat-card"
              style={{
                borderTop: `3px solid ${stat.color}`,
                borderRadius: 'var(--radius)',
                height: '100%',
              }}
              styles={{ body: { padding: isPhone ? '8px 12px' : '12px 16px' } }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: isPhone ? '6px' : '10px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: isPhone ? '10px' : '12px',
                      fontWeight: '500',
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {stat.title}
                  </Text>
                  <div
                    style={{
                      fontSize: isPhone ? '18px' : '24px',
                      fontWeight: '700',
                      marginTop: '0px',
                      color: 'var(--text-primary)',
                      lineHeight: 1.2,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ fontSize: isPhone ? '10px' : '12px', marginTop: '2px' }}>
                    <Tag
                      color={stat.trend === 'up' ? 'success' : stat.trend === 'down' ? 'error' : 'default'}
                      style={{ fontSize: isPhone ? '9px' : '11px' }}
                    >
                      {stat.trend === 'up' ? <RiseOutlined /> : stat.trend === 'down' ? <FallOutlined /> : <MinusOutlined />}
                      {stat.change}
                    </Tag>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: isPhone ? '18px' : '24px',
                    color: stat.color,
                    background: 'rgba(22, 119, 255, 0.08)',
                    padding: isPhone ? '6px' : '8px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: isPhone ? '32px' : '40px',
                    minHeight: isPhone ? '32px' : '40px',
                    flexShrink: 0,
                  }}
                >
                  {stat.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* نمودارها و آمار */}
      <Row gutter={[isPhone ? 4 : 8, isPhone ? 4 : 8]}>
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <BarChartOutlined style={{ color: COLORS.primary }} />
                <span>آمار روزانه نامه‌ها</span>
              </Space>
            }
            style={{ borderRadius: 'var(--radius)', height: '100%' }}
          >
            {data.dailyStats && data.dailyStats.length > 0 ? (
              data.dailyStats.map((item, index) => {
                const percent = data.overview?.totalLetters > 0 
                  ? Math.round((item.count / data.overview.totalLetters) * 100) 
                  : 0;
                return (
                  <div key={index} style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: isPhone ? '11px' : '13px',
                        marginBottom: 2,
                      }}
                    >
                      <span>{toPersianDate(`${item._id.year}-${item._id.month}-${item._id.day}`)}</span>
                      <span>
                        <Badge count={item.count} style={{ background: COLORS.primary }} />
                      </span>
                    </div>
                    <Progress
                      percent={percent}
                      showInfo={false}
                      strokeColor={{
                        '0%': COLORS.primary,
                        '100%': COLORS.success,
                      }}
                      size="small"
                    />
                  </div>
                );
              })
            ) : (
              <Empty description="داده‌ای موجود نیست" />
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <PieChartOutlined style={{ color: COLORS.purple }} />
                <span>توزیع بر اساس نوع</span>
              </Space>
            }
            style={{ borderRadius: 'var(--radius)', height: '100%' }}
          >
            {data.byType && data.byType.length > 0 ? (
              data.byType.map((item) => {
                const total = data.overview?.totalLetters || 1;
                const percent = Math.round((item.count / total) * 100);
                const colors = {
                  incoming: COLORS.blue,
                  outgoing: COLORS.green,
                  internal: COLORS.orange,
                };
                const labels = {
                  incoming: 'وارده',
                  outgoing: 'صادره',
                  internal: 'داخلی',
                };
                return (
                  <div key={item._id} style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: isPhone ? '11px' : '13px',
                        marginBottom: 2,
                      }}
                    >
                      <span>
                        <Tag color={colors[item._id] || 'default'}>
                          {labels[item._id] || item._id}
                        </Tag>
                      </span>
                      <span>
                        <Badge count={item.count} style={{ background: colors[item._id] || COLORS.primary }} />
                        <Text type="secondary" style={{ marginLeft: 8, fontSize: isPhone ? '10px' : '12px' }}>
                          ({percent}%)
                        </Text>
                      </span>
                    </div>
                    <Progress
                      percent={percent}
                      showInfo={false}
                      strokeColor={colors[item._id] || COLORS.primary}
                      size="small"
                    />
                  </div>
                );
              })
            ) : (
              <Empty description="داده‌ای موجود نیست" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[isPhone ? 4 : 8, isPhone ? 4 : 8]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <AreaChartOutlined style={{ color: COLORS.success }} />
                <span>وضعیت ارجاعات</span>
              </Space>
            }
            style={{ borderRadius: 'var(--radius)', height: '100%' }}
          >
            {data.byReferralStatus && data.byReferralStatus.length > 0 ? (
              data.byReferralStatus.map((item) => {
                const total = data.overview?.totalReferrals || 1;
                const percent = Math.round((item.count / total) * 100);
                const colors = {
                  pending: COLORS.warning,
                  read: COLORS.blue,
                  actioned: COLORS.success,
                  rejected: COLORS.danger,
                  forwarded: COLORS.purple,
                };
                const labels = {
                  pending: 'در انتظار',
                  read: 'مطالعه شده',
                  actioned: 'اقدام شده',
                  rejected: 'رد شده',
                  forwarded: 'ارجاع مجدد',
                };
                return (
                  <div key={item._id} style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: isPhone ? '11px' : '13px',
                        marginBottom: 2,
                      }}
                    >
                      <span>
                        <Tag color={colors[item._id] || 'default'}>
                          {labels[item._id] || item._id}
                        </Tag>
                      </span>
                      <span>
                        <Badge count={item.count} style={{ background: colors[item._id] || COLORS.primary }} />
                        <Text type="secondary" style={{ marginLeft: 8, fontSize: isPhone ? '10px' : '12px' }}>
                          ({percent}%)
                        </Text>
                      </span>
                    </div>
                    <Progress
                      percent={percent}
                      showInfo={false}
                      strokeColor={colors[item._id] || COLORS.primary}
                      size="small"
                    />
                  </div>
                );
              })
            ) : (
              <Empty description="داده‌ای موجود نیست" />
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <UserOutlined style={{ color: COLORS.orange }} />
                <span>برترین کاربران</span>
              </Space>
            }
            style={{ borderRadius: 'var(--radius)', height: '100%' }}
          >
            {data.topUsers && data.topUsers.length > 0 ? (
              <List
                dataSource={data.topUsers}
                renderItem={(item, index) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: index < 3 ? COLORS.primary : COLORS.gray[400],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: 12,
                          }}
                        >
                          {index + 1}
                        </div>
                      }
                      title={item.user?.fullName || item.user?.username || 'نامشخص'}
                      description={`${item.count} نامه ثبت شده`}
                    />
                    <Badge
                      count={item.count}
                      style={{
                        background: index === 0 ? COLORS.warning : index === 1 ? COLORS.gray[500] : COLORS.orange,
                      }}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="داده‌ای موجود نیست" />
            )}
          </Card>
        </Col>
      </Row>

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

export default AnalyticsDashboard;
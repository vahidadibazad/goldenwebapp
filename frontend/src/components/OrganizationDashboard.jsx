import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tabs,
  Tag,
  Button,
  Space,
  Typography,
  Badge,
  Spin,
  Empty,
  Select,
  DatePicker,
  Avatar,
  message,
  App,
  Progress,
} from 'antd';
import {
  InboxOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  UserOutlined,
  TeamOutlined,
  BarChartOutlined,
  DownloadOutlined,
  ReloadOutlined,
  FilterOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { toPersianDate } from '../utils/dateHelper';
import { COLORS } from '../styles/theme';
import LetterStatusBadge from './letters/LetterStatusBadge';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

function OrganizationDashboard() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLetters: 0,
    pendingLetters: 0,
    approvedLetters: 0,
    rejectedLetters: 0,
    archivedLetters: 0,
    byDepartment: [],
    byType: [],
    byStatus: [],
  });
  const [recentLetters, setRecentLetters] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    dateRange: [],
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  const [departments, setDepartments] = useState([]);

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
      const [statsRes, lettersRes, usersRes, deptRes] = await Promise.all([
        api.get('/dashboard/organization/stats'),
        api.get('/dashboard/organization/letters', { params: filters }),
        api.get('/dashboard/organization/top-users'),
        api.get('/departments'),
      ]);

      setStats(statsRes.data.data || {});
      setRecentLetters(lettersRes.data.data || []);
      setTopUsers(usersRes.data.data || []);
      setDepartments(deptRes.data.data || []);
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
  // ستون‌های نامه‌های اخیر
  // =============================================
  const letterColumns = [
    {
      title: 'نامه',
      dataIndex: 'subject',
      key: 'subject',
      render: (text, record) => (
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {record.number || 'بدون شماره'}
          </div>
          <Link to={`/letters/${record._id}`}>
            <strong>{text}</strong>
          </Link>
        </div>
      ),
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <LetterStatusBadge status={status} size="small" />,
    },
    {
      title: 'واحد',
      dataIndex: 'department',
      key: 'department',
      render: (dept) => dept?.name || '—',
    },
    {
      title: 'تاریخ',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => toPersianDate(date),
    },
    {
      title: 'عملیات',
      key: 'action',
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/letters/${record._id}`)}
          size="small"
        />
      ),
    },
  ];

  // =============================================
  // ستون‌های کاربران برتر
  // =============================================
  const userColumns = [
    {
      title: 'کاربر',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          {text || record.username}
        </Space>
      ),
    },
    {
      title: 'نامه‌های ثبت شده',
      dataIndex: 'count',
      key: 'count',
      render: (count) => <Badge count={count} style={{ background: COLORS.primary }} />,
    },
    {
      title: 'میانگین زمان پاسخ',
      dataIndex: 'avgResponseTime',
      key: 'avgResponseTime',
      render: (time) => time ? `${time} ساعت` : '—',
    },
  ];

  // =============================================
  // کارت‌های آماری
  // =============================================
  const statCards = [
    {
      title: 'کل نامه‌ها',
      value: stats.totalLetters || 0,
      icon: <FileTextOutlined />,
      color: COLORS.primary,
      bg: 'rgba(22, 119, 255, 0.08)',
      onClick: () => navigate('/correspondence'),
    },
    {
      title: 'در انتظار بررسی',
      value: stats.pendingLetters || 0,
      icon: <ClockCircleOutlined />,
      color: COLORS.warning,
      bg: 'rgba(250, 173, 20, 0.08)',
      onClick: () => navigate('/letters/pending'),
    },
    {
      title: 'تایید شده',
      value: stats.approvedLetters || 0,
      icon: <CheckCircleOutlined />,
      color: COLORS.success,
      bg: 'rgba(82, 196, 26, 0.08)',
      onClick: () => navigate('/letters/inbox'),
    },
    {
      title: 'بایگانی شده',
      value: stats.archivedLetters || 0,
      icon: <InboxOutlined />,
      color: COLORS.orange,
      bg: 'rgba(250, 173, 20, 0.08)',
      onClick: () => navigate('/archive'),
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
          🏢 کارتابل سازمانی
          <Tag color="blue" style={{ marginRight: 8, fontSize: isPhone ? '10px' : '13px' }}>
            {stats.totalLetters || 0} نامه
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

      {/* کارت‌های آماری */}
      <Row gutter={[isPhone ? 4 : 8, isPhone ? 4 : 8]} style={{ marginBottom: 16 }}>
        {statCards.map((stat, index) => (
          <Col key={index} xs={12} sm={6}>
            <Card
              className="stat-card"
              style={{
                borderTop: `3px solid ${stat.color}`,
                borderRadius: 'var(--radius)',
                cursor: stat.onClick ? 'pointer' : 'default',
                height: '100%',
              }}
              styles={{ body: { padding: isPhone ? '8px 12px' : '12px 16px' } }}
              onClick={stat.onClick}
              hoverable
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
                </div>
                <div
                  style={{
                    fontSize: isPhone ? '18px' : '24px',
                    color: stat.color,
                    background: stat.bg,
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

      {/* فیلترها */}
      <Card style={{ borderRadius: 'var(--radius)', marginBottom: 16 }}>
        <Row gutter={[8, 8]} align="middle">
          <Col xs={24} md={8}>
            <Select
              placeholder="واحد سازمانی"
              value={filters.department}
              onChange={(value) => setFilters({ ...filters, department: value })}
              style={{ width: '100%' }}
              allowClear
              size={isPhone ? 'small' : 'middle'}
            >
              {departments.map((d) => (
                <Option key={d._id} value={d._id}>
                  {d.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={8}>
            <Select
              placeholder="وضعیت"
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              style={{ width: '100%' }}
              allowClear
              size={isPhone ? 'small' : 'middle'}
            >
              <Option value="draft">پیش‌نویس</Option>
              <Option value="registered">ثبت شده</Option>
              <Option value="in_review">در بررسی</Option>
              <Option value="approved">تایید شده</Option>
              <Option value="rejected">رد شده</Option>
              <Option value="signed">امضا شده</Option>
              <Option value="archived">بایگانی</Option>
            </Select>
          </Col>
          <Col xs={24} md={8}>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates || [] })}
              placeholder={['از تاریخ', 'تا تاریخ']}
              size={isPhone ? 'small' : 'middle'}
              style={{ width: '100%' }}
              format="YYYY/MM/DD"
            />
          </Col>
        </Row>
        <div style={{ marginTop: 8 }}>
          <Button
            icon={<ClearOutlined />}
            onClick={() => setFilters({ department: '', status: '', dateRange: [] })}
            size={isPhone ? 'small' : 'middle'}
          >
            پاک کردن فیلترها
          </Button>
        </div>
      </Card>

      {/* تب‌ها - با استفاده از items */}
      <Tabs
        defaultActiveKey="1"
        size={isMobile ? 'small' : 'middle'}
        items={[
          {
            key: '1',
            label: (
              <span>
                <FileTextOutlined /> نامه‌های اخیر
              </span>
            ),
            children: (
              <Card style={{ borderRadius: 'var(--radius)' }}>
                {recentLetters.length > 0 ? (
                  <Table
                    columns={letterColumns}
                    dataSource={recentLetters}
                    rowKey="_id"
                    scroll={{ x: isPhone ? 400 : isMobile ? 600 : 800 }}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: !isPhone,
                      showTotal: (total) => `تعداد ${total} نامه`,
                      size: isPhone ? 'small' : 'default',
                    }}
                    size={isPhone ? 'small' : 'middle'}
                    locale={{
                      emptyText: 'هیچ نامه‌ای یافت نشد',
                    }}
                  />
                ) : (
                  <Empty description="هیچ نامه‌ای یافت نشد" />
                )}
              </Card>
            ),
          },
          {
            key: '2',
            label: (
              <span>
                <TeamOutlined /> کاربران برتر
              </span>
            ),
            children: (
              <Card style={{ borderRadius: 'var(--radius)' }}>
                {topUsers.length > 0 ? (
                  <Table
                    columns={userColumns}
                    dataSource={topUsers}
                    rowKey="_id"
                    scroll={{ x: isPhone ? 400 : isMobile ? 600 : 800 }}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: !isPhone,
                      size: isPhone ? 'small' : 'default',
                    }}
                    size={isPhone ? 'small' : 'middle'}
                    locale={{
                      emptyText: 'هیچ کاربری یافت نشد',
                    }}
                  />
                ) : (
                  <Empty description="هیچ کاربری یافت نشد" />
                )}
              </Card>
            ),
          },
          {
            key: '3',
            label: (
              <span>
                <BarChartOutlined /> آمار وضعیت
              </span>
            ),
            children: (
              <Row gutter={[isPhone ? 4 : 8, isPhone ? 4 : 8]}>
                <Col xs={24} md={12}>
                  <Card title="بر اساس نوع" style={{ borderRadius: 'var(--radius)' }}>
                    {stats.byType?.length > 0 ? (
                      stats.byType.map((item) => (
                        <div
                          key={item._id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 0',
                            borderBottom: '1px solid var(--border-color)',
                          }}
                        >
                          <Tag color={item._id === 'incoming' ? 'blue' : item._id === 'outgoing' ? 'green' : 'orange'}>
                            {item._id === 'incoming' ? 'وارده' : item._id === 'outgoing' ? 'صادره' : 'داخلی'}
                          </Tag>
                          <Badge count={item.count} style={{ background: COLORS.primary }} />
                        </div>
                      ))
                    ) : (
                      <Empty description="داده‌ای موجود نیست" />
                    )}
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card title="بر اساس وضعیت" style={{ borderRadius: 'var(--radius)' }}>
                    {stats.byStatus?.length > 0 ? (
                      stats.byStatus.map((item) => (
                        <div
                          key={item._id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 0',
                            borderBottom: '1px solid var(--border-color)',
                          }}
                        >
                          <LetterStatusBadge status={item._id} size="small" />
                          <Badge count={item.count} style={{ background: COLORS.primary }} />
                        </div>
                      ))
                    ) : (
                      <Empty description="داده‌ای موجود نیست" />
                    )}
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]}
      />

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

export default OrganizationDashboard;
// frontend/src/pages/crm/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Spin,
  Empty,
  Button,
  Space,
  Badge,
  Tag,
  List,
  Avatar,
  Progress,
  Tabs,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  FileTextOutlined,
  RiseOutlined,
  FallOutlined,
  MinusOutlined,
  PlusOutlined,
  EyeOutlined,
  ReloadOutlined,
  LineChartOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import { useCrm } from '../../context/CrmContext';
import { COLORS } from '../../styles/theme';
import { toPersianPrice } from '../../utils/numberHelper';

const { Title, Text } = Typography;

function CrmDashboard() {
  const navigate = useNavigate();
  const { dashboard, stats, loading, fetchDashboard, fetchStats } = useCrm();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboard(), fetchStats()]);
    setRefreshing(false);
  };

  // کارت‌های آماری
  const statCards = [
    {
      title: 'سرنخ‌ها',
      value: stats?.leads?.total || 0,
      icon: <UserOutlined />,
      color: COLORS.primary,
      bg: 'rgba(22, 119, 255, 0.08)',
      change: '+12%',
      trend: 'up',
      onClick: () => navigate('/crm/leads'),
    },
    {
      title: 'شرکت‌ها',
      value: stats?.accounts?.active || 0,
      icon: <TeamOutlined />,
      color: COLORS.success,
      bg: 'rgba(82, 196, 26, 0.08)',
      change: '+5%',
      trend: 'up',
      onClick: () => navigate('/crm/accounts'),
    },
    {
      title: 'فرصت‌ها',
      value: stats?.opportunities?.total || 0,
      icon: <DollarOutlined />,
      color: COLORS.warning,
      bg: 'rgba(250, 173, 20, 0.08)',
      change: '+8%',
      trend: 'up',
      onClick: () => navigate('/crm/opportunities'),
    },
    {
      title: 'قراردادها',
      value: stats?.contracts?.active || 0,
      icon: <FileTextOutlined />,
      color: COLORS.purple,
      bg: 'rgba(114, 46, 209, 0.08)',
      change: '+3%',
      trend: 'up',
      onClick: () => navigate('/crm/contracts'),
    },
  ];

  // وضعیت سرنخ‌ها
  const leadStatusItems = [
    { key: 'new', label: 'جدید', count: stats?.leads?.new || 0, color: COLORS.blue },
    { key: 'contacted', label: 'تماس گرفته شده', count: stats?.leads?.contacted || 0, color: COLORS.orange },
    { key: 'working', label: 'در حال پیگیری', count: stats?.leads?.working || 0, color: COLORS.purple },
    { key: 'qualified', label: 'واجد شرایط', count: stats?.leads?.qualified || 0, color: COLORS.success },
    { key: 'converted', label: 'تبدیل شده', count: stats?.leads?.converted || 0, color: COLORS.cyan },
    { key: 'lost', label: 'از دست رفته', count: stats?.leads?.lost || 0, color: COLORS.danger },
  ];

  // مراحل فرصت‌ها
  const opportunityStages = [
    { key: 'discovery', label: 'کشف', count: stats?.opportunities?.discovery || 0, color: COLORS.blue },
    { key: 'qualification', label: 'صلاحیت‌سنجی', count: stats?.opportunities?.qualification || 0, color: COLORS.orange },
    { key: 'proposal', label: 'پیشنهاد', count: stats?.opportunities?.proposal || 0, color: COLORS.purple },
    { key: 'negotiation', label: 'مذاکره', count: stats?.opportunities?.negotiation || 0, color: COLORS.warning },
    { key: 'won', label: 'برنده', count: stats?.opportunities?.won || 0, color: COLORS.success },
    { key: 'lost', label: 'بازنده', count: stats?.opportunities?.lost || 0, color: COLORS.danger },
  ];

  if (loading && !dashboard) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="در حال بارگذاری داشبورد..." />
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
        <div>
          <Title level={2} style={{ margin: 0 }}>
            📊 داشبورد CRM
          </Title>
          <Text type="secondary">خلاصه وضعیت فروش و ارتباط با مشتریان</Text>
        </div>
        <Space wrap>
          <Button
            icon={<ReloadOutlined spin={refreshing} />}
            onClick={handleRefresh}
            loading={refreshing}
          >
            بروزرسانی
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/crm/leads/new')}
          >
            سرنخ جدید
          </Button>
        </Space>
      </div>

      {/* کارت‌های آماری */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((stat, index) => (
          <Col key={index} xs={12} sm={12} md={6}>
            <Card
              className="stat-card"
              style={{
                borderTop: `3px solid ${stat.color}`,
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                height: '100%',
              }}
              styles={{ body: { padding: '16px' } }}
              onClick={stat.onClick}
              hoverable
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      display: 'block',
                    }}
                  >
                    {stat.title}
                  </Text>
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      marginTop: '4px',
                      color: 'var(--text-primary)',
                      lineHeight: 1.2,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '2px' }}>
                    <Tag
                      color={stat.trend === 'up' ? 'success' : stat.trend === 'down' ? 'error' : 'default'}
                      style={{ fontSize: '11px' }}
                    >
                      {stat.trend === 'up' ? <RiseOutlined /> : stat.trend === 'down' ? <FallOutlined /> : <MinusOutlined />}
                      {stat.change}
                    </Tag>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    color: stat.color,
                    background: stat.bg,
                    padding: '8px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '40px',
                    minHeight: '40px',
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

      {/* وضعیت سرنخ‌ها و مراحل فرصت‌ها */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title="📋 وضعیت سرنخ‌ها"
            style={{ borderRadius: 'var(--radius)', height: '100%' }}
            extra={<Button type="link" onClick={() => navigate('/crm/leads')}>مشاهده همه</Button>}
          >
            {leadStatusItems.map((item) => {
              const total = stats?.leads?.total || 1;
              const percent = Math.round((item.count / total) * 100);
              return (
                <div key={item.key} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      marginBottom: 2,
                    }}
                  >
                    <span>{item.label}</span>
                    <span>
                      <Badge count={item.count} style={{ background: item.color }} />
                      <Text type="secondary" style={{ marginLeft: 8, fontSize: '12px' }}>
                        ({percent}%)
                      </Text>
                    </span>
                  </div>
                  <Progress
                    percent={percent}
                    showInfo={false}
                    strokeColor={item.color}
                    size="small"
                  />
                </div>
              );
            })}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="📈 مراحل فرصت‌ها"
            style={{ borderRadius: 'var(--radius)', height: '100%' }}
            extra={<Button type="link" onClick={() => navigate('/crm/opportunities')}>مشاهده همه</Button>}
          >
            {opportunityStages.map((item) => {
              const total = stats?.opportunities?.total || 1;
              const percent = Math.round((item.count / total) * 100);
              return (
                <div key={item.key} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      marginBottom: 2,
                    }}
                  >
                    <span>{item.label}</span>
                    <span>
                      <Badge count={item.count} style={{ background: item.color }} />
                      <Text type="secondary" style={{ marginLeft: 8, fontSize: '12px' }}>
                        ({percent}%)
                      </Text>
                    </span>
                  </div>
                  <Progress
                    percent={percent}
                    showInfo={false}
                    strokeColor={item.color}
                    size="small"
                  />
                </div>
              );
            })}
          </Card>
        </Col>
      </Row>

      {/* سرنخ‌های اخیر و فرصت‌های فعال */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card
            title="🆕 سرنخ‌های اخیر"
            style={{ borderRadius: 'var(--radius)', height: '100%' }}
            extra={<Button type="link" onClick={() => navigate('/crm/leads')}>مشاهده همه</Button>}
          >
            {dashboard?.recentLeads?.length === 0 ? (
              <Empty description="هیچ سرنخی ثبت نشده است" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                dataSource={dashboard?.recentLeads || []}
                renderItem={(item) => (
                  <List.Item
                    style={{ cursor: 'pointer', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}
                    onClick={() => navigate(`/crm/leads/${item._id}`)}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} style={{ background: COLORS.primary }} />}
                      title={
                        <Space>
                          <span>{item.firstName} {item.lastName}</span>
                          <Tag color={item.rating === 'hot' ? 'red' : item.rating === 'warm' ? 'orange' : 'blue'}>
                            {item.rating === 'hot' ? '🔥 داغ' : item.rating === 'warm' ? '🌤️ گرم' : '❄️ سرد'}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space size="large">
                          <span>{item.company || 'بدون شرکت'}</span>
                          <Tag color={item.leadStatus === 'new' ? 'blue' : item.leadStatus === 'contacted' ? 'orange' : item.leadStatus === 'qualified' ? 'green' : 'default'}>
                            {item.leadStatus === 'new' ? 'جدید' : item.leadStatus === 'contacted' ? 'تماس' : item.leadStatus === 'qualified' ? 'واجد شرایط' : item.leadStatus}
                          </Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="⚡ فرصت‌های فعال"
            style={{ borderRadius: 'var(--radius)', height: '100%' }}
            extra={<Button type="link" onClick={() => navigate('/crm/opportunities')}>مشاهده همه</Button>}
          >
            {dashboard?.activeOpportunities?.length === 0 ? (
              <Empty description="هیچ فرصت فعالی وجود ندارد" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                dataSource={dashboard?.activeOpportunities || []}
                renderItem={(item) => (
                  <List.Item
                    style={{ cursor: 'pointer', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}
                    onClick={() => navigate(`/crm/opportunities/${item._id}`)}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<DollarOutlined />} style={{ background: COLORS.warning }} />}
                      title={
                        <Space>
                          <span>{item.name}</span>
                          <Tag color="blue">{item.account?.name || 'بدون شرکت'}</Tag>
                        </Space>
                      }
                      description={
                        <Space size="large">
                          <span>مبلغ: {toPersianPrice(item.amount)}</span>
                          <Tag color={
                            item.stage === 'discovery' ? 'blue' :
                            item.stage === 'qualification' ? 'orange' :
                            item.stage === 'proposal' ? 'purple' :
                            item.stage === 'negotiation' ? 'gold' :
                            'default'
                          }>
                            {item.stage === 'discovery' ? 'کشف' :
                             item.stage === 'qualification' ? 'صلاحیت‌سنجی' :
                             item.stage === 'proposal' ? 'پیشنهاد' :
                             item.stage === 'negotiation' ? 'مذاکره' :
                             item.stage}
                          </Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
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

export default CrmDashboard;



// src/components/letters/LetterDashboard.jsx
import { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  List, 
  Tag, 
  Button, 
  Space, 
  Spin, 
  Typography,
  Badge,
  Empty,
} from 'antd';
import { 
  InboxOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import letterService from '../../services/letterService';
import LetterStatusBadge from './LetterStatusBadge';
import { toPersianDate } from '../../utils/dateHelper';

const { Title, Text } = Typography;

function LetterDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState({
    pendingReviews: [],
    myLetters: [],
    receivedLetters: [],
    stats: {},
    overdueCount: 0,
    totalPending: 0,
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    
    try {
      const res = await letterService.getDashboard();
      setDashboard(res.data.data);
    } catch (error) {
      console.error('خطا در دریافت کارتابل:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => fetchDashboard(false);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16, color: '#999' }}>در حال بارگذاری کارتابل...</p>
      </div>
    );
  }

  const stats = [
    { 
      title: 'در انتظار پاراف/امضا', 
      value: dashboard.totalPending, 
      icon: <ClockCircleOutlined />, 
      color: '#faad14',
      bg: 'rgba(250, 173, 20, 0.08)',
      onClick: () => navigate('/letters/pending'),
    },
    { 
      title: 'نامه‌های معوق', 
      value: dashboard.overdueCount, 
      icon: <CloseCircleOutlined />, 
      color: '#ff4d4f',
      bg: 'rgba(255, 77, 79, 0.08)',
      onClick: () => navigate('/letters/pending?overdue=true'),
    },
    { 
      title: 'نامه‌های ثبت شده', 
      value: dashboard.stats?.registered || 0, 
      icon: <FileTextOutlined />, 
      color: '#1677ff',
      bg: 'rgba(22, 119, 255, 0.08)',
      onClick: () => navigate('/letters/outbox'),
    },
    { 
      title: 'نامه‌های بایگانی', 
      value: dashboard.stats?.archived || 0, 
      icon: <InboxOutlined />, 
      color: '#8c8c8c',
      bg: 'rgba(140, 140, 140, 0.08)',
      onClick: () => navigate('/letters/inbox?archived=true'),
    },
  ];

  return (
    <div className="fade-in">
      {/* هدر */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            📋 کارتابل من
          </Title>
          <Text type="secondary">
            وضعیت نامه‌های در انتظار اقدام شما
          </Text>
        </div>
        <Space>
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
            onClick={() => navigate('/letters/new')}
          >
            نامه جدید
          </Button>
        </Space>
      </div>

      {/* آمار */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, index) => (
          <Col key={index} xs={12} sm={12} md={6}>
            <Card 
              hoverable 
              onClick={stat.onClick}
              style={{ 
                borderTop: `3px solid ${stat.color}`,
                cursor: 'pointer',
                borderRadius: 12,
                height: '100%',
              }}
              bodyStyle={{ padding: '16px 20px' }}
            >
              <Statistic
                title={
                  <span style={{ fontSize: 14, color: '#666' }}>
                    {stat.title}
                  </span>
                }
                value={stat.value}
                prefix={
                  <span style={{ color: stat.color, marginLeft: 8 }}>
                    {stat.icon}
                  </span>
                }
                valueStyle={{ 
                  color: stat.color, 
                  fontSize: 24,
                  fontWeight: 600,
                }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* نامه‌های در انتظار پاراف/امضا */}
      <Card 
        title={
          <Space>
            <span>📋 در انتظار اقدام</span>
            <Badge 
              count={dashboard.pendingReviews.length} 
              style={{ background: '#faad14' }}
            />
          </Space>
        }
        style={{ marginBottom: 16, borderRadius: 12 }}
        extra={
          <Button 
            type="link" 
            onClick={() => navigate('/letters/pending')}
          >
            مشاهده همه
          </Button>
        }
      >
        {dashboard.pendingReviews.length === 0 ? (
          <Empty 
            description="هیچ نامه‌ای در انتظار اقدام نیست" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '20px 0' }}
          />
        ) : (
          <List
            dataSource={dashboard.pendingReviews}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button 
                    type="primary" 
                    size="small" 
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/letters/${item.letter?._id || item._id}`)}
                  >
                    مشاهده
                  </Button>,
                ]}
                style={{ 
                  padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <List.Item.Meta
                  title={
                    <Space wrap>
                      <span style={{ fontWeight: 500 }}>
                        {item.letter?.subject || 'بدون موضوع'}
                      </span>
                      <LetterStatusBadge 
                        status={item.letter?.status || item.status} 
                        size="small" 
                      />
                      <Tag 
                        color={item.type === 'review' ? 'blue' : 'purple'}
                        style={{ borderRadius: 12 }}
                      >
                        {item.type === 'review' ? '📋 پاراف' : '✍️ امضا'}
                      </Tag>
                      {item.priority === 'urgent' && (
                        <Tag color="red" style={{ borderRadius: 12 }}>
                          🔴 فوری
                        </Tag>
                      )}
                    </Space>
                  }
                  description={
                    <Space size="large" wrap>
                      <span>
                        از: {item.from?.fullName || item.from?.username || 'نامشخص'}
                      </span>
                      <span>
                        شماره: {item.letter?.number || '---'}
                      </span>
                      {item.dueDate && (
                        <span style={{ 
                          color: new Date(item.dueDate) < new Date() ? '#ff4d4f' : '#52c41a',
                        }}>
                          {new Date(item.dueDate) < new Date() ? '⏰' : '📅'} 
                          سررسید: {toPersianDate(item.dueDate)}
                        </span>
                      )}
                      <span style={{ color: '#999', fontSize: 12 }}>
                        {toPersianDate(item.createdAt)}
                      </span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* نامه‌های اخیر */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card 
            title="📤 نامه‌های ارسالی من"
            style={{ borderRadius: 12, height: '100%' }}
            extra={
              <Button type="link" onClick={() => navigate('/letters/outbox')}>
                مشاهده همه
              </Button>
            }
          >
            {dashboard.myLetters?.length === 0 ? (
              <Empty 
                description="هیچ نامه‌ای ارسال نکرده‌اید" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: '10px 0' }}
              />
            ) : (
              <List
                dataSource={dashboard.myLetters.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item
                    onClick={() => navigate(`/letters/${item._id}`)}
                    style={{ 
                      cursor: 'pointer', 
                      padding: '10px 0',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <List.Item.Meta
                      title={
                        <Space wrap>
                          <span style={{ fontWeight: 500 }}>{item.subject}</span>
                          <LetterStatusBadge status={item.status} size="small" />
                        </Space>
                      }
                      description={
                        <Space size="large">
                          <span>شماره: {item.number || '---'}</span>
                          <span style={{ color: '#999' }}>
                            {toPersianDate(item.createdAt)}
                          </span>
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
            title="📥 نامه‌های دریافتی"
            style={{ borderRadius: 12, height: '100%' }}
            extra={
              <Button type="link" onClick={() => navigate('/letters/inbox')}>
                مشاهده همه
              </Button>
            }
          >
            {dashboard.receivedLetters?.length === 0 ? (
              <Empty 
                description="هیچ نامه‌ای دریافت نکرده‌اید" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: '10px 0' }}
              />
            ) : (
              <List
                dataSource={dashboard.receivedLetters.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item
                    onClick={() => navigate(`/letters/${item._id}`)}
                    style={{ 
                      cursor: 'pointer', 
                      padding: '10px 0',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <List.Item.Meta
                      title={
                        <Space wrap>
                          <span style={{ fontWeight: 500 }}>{item.subject}</span>
                          <LetterStatusBadge status={item.status} size="small" />
                        </Space>
                      }
                      description={
                        <Space size="large">
                          <span>از: {item.sender?.fullName || item.senderName || 'نامشخص'}</span>
                          <span style={{ color: '#999' }}>
                            {toPersianDate(item.createdAt)}
                          </span>
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
    </div>
  );
}

export default LetterDashboard;
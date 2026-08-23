import { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Descriptions,
  Spin,
  Button,
  Tag,
  message,
  Space,
  Row,
  Col,
  Divider,
  Avatar,
  List,
  Statistic,
  Badge,
  App,
  Tabs,
  Table,
} from 'antd';
import {
  RollbackOutlined,
  EditOutlined,
  UserOutlined,
  BankOutlined,
  TeamOutlined,
  FileTextOutlined,
  ApartmentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { toPersianDate } from '../utils/dateHelper';
import { COLORS } from '../styles/theme';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

function SecretariatDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
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
  // دریافت اطلاعات
  // =============================================
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/secretariats/${id}`);
      setData(res.data.data);
      setStats(res.data.data.stats || {});
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      navigate('/secretariats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="در حال بارگذاری..." />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
          <Title level={4}>دبیرخانه یافت نشد</Title>
          <Button onClick={() => navigate('/secretariats')}>بازگشت</Button>
        </div>
      </Card>
    );
  }

  const typeMap = {
    main: { color: 'blue', label: 'اصلی' },
    sub: { color: 'green', label: 'فرعی' },
    temporary: { color: 'orange', label: 'موقت' },
  };

  const typeInfo = typeMap[data.type] || { color: 'default', label: data.type };

  return (
    <div className="fade-in">
      <Card style={{ borderRadius: 'var(--radius)' }}>
        {/* هدر */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <Title level={isPhone ? 4 : isMobile ? 3 : 2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <BankOutlined style={{ color: COLORS.primary }} />
              {data.name}
              <Tag color={typeInfo.color} style={{ fontSize: isPhone ? '10px' : '13px' }}>
                {typeInfo.label}
              </Tag>
              <Tag color={data.isActive ? 'success' : 'error'} style={{ fontSize: isPhone ? '10px' : '13px' }}>
                {data.isActive ? 'فعال' : 'غیرفعال'}
              </Tag>
            </Title>
            <Text type="secondary" style={{ fontSize: isPhone ? '12px' : '14px' }}>
              کد: {data.code}
            </Text>
          </div>
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/secretariats/edit/${data._id}`)}
            >
              ویرایش
            </Button>
            <Button icon={<RollbackOutlined />} onClick={() => navigate('/secretariats')}>
              بازگشت
            </Button>
          </Space>
        </div>

        {/* آمار */}
        <Row gutter={[isPhone ? 4 : 8, isPhone ? 4 : 8]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRight: `3px solid ${COLORS.primary}` }}>
              <Statistic
                title="کل نامه‌ها"
                value={stats.totalLetters || 0}
                prefix={<FileTextOutlined style={{ color: COLORS.primary }} />}
                valueStyle={{ fontSize: isPhone ? '16px' : '20px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRight: `3px solid ${COLORS.warning}` }}>
              <Statistic
                title="در انتظار"
                value={stats.pendingLetters || 0}
                prefix={<ClockCircleOutlined style={{ color: COLORS.warning }} />}
                valueStyle={{ fontSize: isPhone ? '16px' : '20px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRight: `3px solid ${COLORS.success}` }}>
              <Statistic
                title="امروز"
                value={stats.todayLetters || 0}
                prefix={<CheckCircleOutlined style={{ color: COLORS.success }} />}
                valueStyle={{ fontSize: isPhone ? '16px' : '20px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRight: `3px solid ${COLORS.orange}` }}>
              <Statistic
                title="کارمندان"
                value={data.staff?.length || 0}
                prefix={<TeamOutlined style={{ color: COLORS.orange }} />}
                valueStyle={{ fontSize: isPhone ? '16px' : '20px' }}
              />
            </Card>
          </Col>
        </Row>

        {/* اطلاعات اصلی */}
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="middle">
          <Descriptions.Item label="نام دبیرخانه">{data.name}</Descriptions.Item>
          <Descriptions.Item label="کد">{data.code}</Descriptions.Item>
          <Descriptions.Item label="نوع">
            <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="مدیر">
            <Space>
              <Avatar icon={<UserOutlined />} size="small" />
              {data.manager?.fullName || data.manager?.username || 'نامشخص'}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="دبیرخانه والد">
            {data.parent ? (
              <Link to={`/secretariats/${data.parent._id}`}>
                {data.parent.name}
              </Link>
            ) : (
              <Text type="secondary">—</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="وضعیت">
            <Tag color={data.isActive ? 'success' : 'error'}>
              {data.isActive ? 'فعال' : 'غیرفعال'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="تاریخ ایجاد">{toPersianDate(data.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="آخرین بروزرسانی">{toPersianDate(data.updatedAt)}</Descriptions.Item>
        </Descriptions>

        {/* واحدهای تحت پوشش */}
        {data.departments && data.departments.length > 0 && (
          <>
            <Divider>🏢 واحدهای تحت پوشش</Divider>
            <List
              dataSource={data.departments}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<ApartmentOutlined style={{ fontSize: 20, color: COLORS.primary }} />}
                    title={item.name}
                    description={item.code}
                  />
                </List.Item>
              )}
            />
          </>
        )}

        {/* کارمندان */}
        {data.staff && data.staff.length > 0 && (
          <>
            <Divider>👥 کارمندان دبیرخانه</Divider>
            <List
              dataSource={data.staff}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={item.fullName || item.username}
                    description={item.position || 'کارمند'}
                  />
                </List.Item>
              )}
            />
          </>
        )}

        {/* تنظیمات */}
        {data.settings && (
          <>
            <Divider>⚙️ تنظیمات</Divider>
            <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="small">
              <Descriptions.Item label="شماره‌گذاری خودکار">
                <Tag color={data.settings.autoNumbering ? 'success' : 'default'}>
                  {data.settings.autoNumbering ? 'فعال' : 'غیرفعال'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="نیاز به امضا">
                <Tag color={data.settings.requireSignature ? 'success' : 'default'}>
                  {data.settings.requireSignature ? 'فعال' : 'غیرفعال'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="حداکثر سطح ارجاع">
                {data.settings.maxReferralLevel || 5}
              </Descriptions.Item>
              <Descriptions.Item label="اولویت پیش‌فرض">
                <Tag color={data.settings.defaultPriority === 'urgent' ? 'red' : data.settings.defaultPriority === 'high' ? 'orange' : 'blue'}>
                  {data.settings.defaultPriority === 'urgent' ? 'فوری' : data.settings.defaultPriority === 'high' ? 'بالا' : data.settings.defaultPriority === 'medium' ? 'متوسط' : 'کم'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Card>
    </div>
  );
}

export default SecretariatDetail;
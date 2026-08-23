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
  Statistic,
  Table,
  App,
  Tabs,
  Badge,
} from 'antd';
import {
  RollbackOutlined,
  EditOutlined,
  FolderOutlined,
  FileTextOutlined,
  UserOutlined,
  BankOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { toPersianDate } from '../utils/dateHelper';
import { COLORS } from '../styles/theme';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

function ArchiveDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [letters, setLetters] = useState([]);
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
      const res = await api.get(`/archives/${id}`);
      setData(res.data.data);
      setLetters(res.data.data.letters || []);
      setStats(res.data.data.stats || {});
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      navigate('/archive');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  // =============================================
  // ستون‌های نامه‌ها
  // =============================================
  const letterColumns = [
    {
      title: 'شماره و موضوع',
      dataIndex: 'subject',
      key: 'subject',
      render: (text, record) => (
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {record.number || 'بدون شماره'}
          </div>
          <strong>{text}</strong>
        </div>
      ),
    },
    {
      title: 'نوع',
      dataIndex: 'letterType',
      key: 'letterType',
      render: (type) => {
        const map = {
          incoming: { color: 'blue', label: 'وارده' },
          outgoing: { color: 'green', label: 'صادره' },
          internal: { color: 'orange', label: 'داخلی' },
        };
        const info = map[type] || { color: 'default', label: type };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'تاریخ',
      dataIndex: 'letterDate',
      key: 'letterDate',
      render: (date) => toPersianDate(date),
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const map = {
          draft: 'پیش‌نویس',
          registered: 'ثبت شده',
          in_review: 'در بررسی',
          approved: 'تایید شده',
          rejected: 'رد شده',
          signed: 'امضا شده',
          archived: 'بایگانی شده',
        };
        const colors = {
          draft: 'default',
          registered: 'processing',
          in_review: 'warning',
          approved: 'success',
          rejected: 'error',
          signed: 'purple',
          archived: 'default',
        };
        return <Tag color={colors[status] || 'default'}>{map[status] || status}</Tag>;
      },
    },
  ];

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
          <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
          <Title level={4}>بایگانی یافت نشد</Title>
          <Button onClick={() => navigate('/archive')}>بازگشت</Button>
        </div>
      </Card>
    );
  }

  const typeMap = {
    active: { color: 'green', label: 'جاری' },
    semi_active: { color: 'orange', label: 'نیمه‌جاری' },
    inactive: { color: 'default', label: 'راکد' },
    digital: { color: 'blue', label: 'دیجیتال' },
  };

  const typeInfo = typeMap[data.type] || { color: 'default', label: data.type };

  const categoryMap = {
    general: 'عمومی',
    financial: 'مالی',
    legal: 'حقوقی',
    personnel: 'پرسنلی',
    technical: 'فنی',
    other: 'سایر',
  };

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
              <FolderOutlined style={{ color: COLORS.primary }} />
              {data.name}
              <Tag color={typeInfo.color} style={{ fontSize: isPhone ? '10px' : '13px' }}>
                {typeInfo.label}
              </Tag>
              <Tag color={data.isActive ? 'success' : 'error'} style={{ fontSize: isPhone ? '10px' : '13px' }}>
                {data.isActive ? 'فعال' : 'غیرفعال'}
              </Tag>
            </Title>
            <Text type="secondary" style={{ fontSize: isPhone ? '12px' : '14px' }}>
              کد: {data.code} • دسته‌بندی: {categoryMap[data.category] || data.category}
            </Text>
          </div>
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/archive/edit/${data._id}`)}
            >
              ویرایش
            </Button>
            <Button icon={<RollbackOutlined />} onClick={() => navigate('/archive')}>
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
            <Card size="small" style={{ borderRight: `3px solid ${COLORS.blue}` }}>
              <Statistic
                title="حجم کل"
                value={stats.totalSize || 0}
                suffix="KB"
                valueStyle={{ fontSize: isPhone ? '16px' : '20px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRight: `3px solid ${COLORS.orange}` }}>
              <Statistic
                title="سطح"
                value={data.level || 0}
                prefix={<FolderOutlined style={{ color: COLORS.orange }} />}
                valueStyle={{ fontSize: isPhone ? '16px' : '20px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRight: `3px solid ${COLORS.success}` }}>
              <Statistic
                title="آخرین بروزرسانی"
                value={data.stats?.lastUpdate ? toPersianDate(data.stats.lastUpdate) : '—'}
                valueStyle={{ fontSize: isPhone ? '12px' : '14px' }}
              />
            </Card>
          </Col>
        </Row>

        {/* اطلاعات اصلی */}
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="middle">
          <Descriptions.Item label="نام بایگانی">{data.name}</Descriptions.Item>
          <Descriptions.Item label="کد">{data.code}</Descriptions.Item>
          <Descriptions.Item label="نوع">
            <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="دسته‌بندی">{categoryMap[data.category] || data.category}</Descriptions.Item>
          <Descriptions.Item label="دبیرخانه">
            <Space>
              <BankOutlined />
              {data.secretariat?.name || 'نامشخص'}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="مسئول">
            <Space>
              <UserOutlined />
              {data.manager?.fullName || data.manager?.username || 'نامشخص'}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="بایگانی والد">
            {data.parent ? (
              <Link to={`/archive/${data.parent._id}`}>
                {data.parent.name}
              </Link>
            ) : (
              <Text type="secondary">—</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="محدوده زمانی">
            {data.yearFrom && data.yearTo ? `${data.yearFrom} - ${data.yearTo}` : 'نامحدود'}
          </Descriptions.Item>
          <Descriptions.Item label="وضعیت">
            <Tag color={data.isActive ? 'success' : 'error'}>
              {data.isActive ? 'فعال' : 'غیرفعال'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="تاریخ ایجاد">{toPersianDate(data.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="آخرین بروزرسانی">{toPersianDate(data.updatedAt)}</Descriptions.Item>
        </Descriptions>

        {/* نامه‌های بایگانی */}
        {letters.length > 0 && (
          <>
            <Divider>📄 نامه‌های بایگانی شده</Divider>
            <Table
              columns={letterColumns}
              dataSource={letters}
              rowKey="_id"
              scroll={{ x: isPhone ? 400 : isMobile ? 600 : 800 }}
              pagination={{ pageSize: 10 }}
              size={isPhone ? 'small' : 'middle'}
            />
          </>
        )}

        {/* تنظیمات */}
        {data.settings && (
          <>
            <Divider>⚙️ تنظیمات</Divider>
            <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="small">
              <Descriptions.Item label="مجاز به حذف">
                <Tag color={data.settings.allowDelete ? 'success' : 'default'}>
                  {data.settings.allowDelete ? 'فعال' : 'غیرفعال'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="مجاز به ویرایش">
                <Tag color={data.settings.allowEdit ? 'success' : 'default'}>
                  {data.settings.allowEdit ? 'فعال' : 'غیرفعال'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="نیاز به تایید">
                <Tag color={data.settings.requireApproval ? 'success' : 'default'}>
                  {data.settings.requireApproval ? 'فعال' : 'غیرفعال'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="دوره نگهداری">
                {data.settings.retentionPeriod || 365} روز
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Card>
    </div>
  );
}

export default ArchiveDetail;
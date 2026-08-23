// src/components/webhooks/WebhookList.jsx
import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Card,
  Input,
  Space,
  Tag,
  message,
  Popconfirm,
  Typography,
  Tooltip,
  Row,
  Col,
  Switch,
  Modal,
  Form,
  Select,
  App,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import webhookService from '../../services/webhookService';
import { COLORS } from '../../styles/theme';

const { Title, Text } = Typography;
const { Option } = Select;

// =============================================
// رویدادهای پشتیبانی‌شده
// =============================================
const EVENT_OPTIONS = [
  { value: 'letter.created', label: 'نامه ایجاد شد', icon: '📄' },
  { value: 'letter.updated', label: 'نامه ویرایش شد', icon: '✏️' },
  { value: 'letter.registered', label: 'نامه ثبت شد', icon: '📋' },
  { value: 'letter.approved', label: 'نامه تأیید شد', icon: '✅' },
  { value: 'letter.rejected', label: 'نامه رد شد', icon: '❌' },
  { value: 'letter.signed', label: 'نامه امضا شد', icon: '✍️' },
  { value: 'letter.archived', label: 'نامه بایگانی شد', icon: '📁' },
  { value: 'referral.created', label: 'ارجاع ایجاد شد', icon: '📤' },
  { value: 'referral.actioned', label: 'ارجاع اقدام شد', icon: '✅' },
  { value: 'signature.created', label: 'درخواست امضا', icon: '🔐' },
  { value: 'signature.verified', label: 'امضا تأیید شد', icon: '✅' },
  { value: 'fax.received', label: 'فکس دریافت شد', icon: '📠' },
  { value: 'fax.sent', label: 'فکس ارسال شد', icon: '📤' },
  { value: 'email.received', label: 'ایمیل دریافت شد', icon: '📧' },
  { value: 'email.sent', label: 'ایمیل ارسال شد', icon: '📨' },
  { value: 'report.generated', label: 'گزارش تولید شد', icon: '📊' },
  { value: 'user.created', label: 'کاربر ایجاد شد', icon: '👤' },
  { value: 'user.updated', label: 'کاربر ویرایش شد', icon: '✏️' },
  { value: 'system.error', label: 'خطای سیستم', icon: '⚠️' },
  { value: 'system.backup', label: 'پشتیبان‌گیری', icon: '💾' },
];

function WebhookList() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  const [stats, setStats] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [form] = Form.useForm();

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
      const [listRes, statsRes] = await Promise.all([
        webhookService.getAll(),
        webhookService.getStats(),
      ]);
      setData(listRes.data.data || []);
      setStats(statsRes.data.data || {});
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =============================================
  // حذف وب‌هوک
  // =============================================
  const handleDelete = async (id) => {
    try {
      await webhookService.delete(id);
      message.success('وب‌هوک با موفقیت حذف شد');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در حذف');
    }
  };

  // =============================================
  // تست وب‌هوک
  // =============================================
  const handleTest = async (id) => {
    try {
      const res = await webhookService.test(id);
      message.success('تست وب‌هوک با موفقیت انجام شد');
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در تست وب‌هوک');
    }
  };

  // =============================================
  // تغییر وضعیت
  // =============================================
  const handleToggle = async (id, currentStatus) => {
    try {
      await webhookService.update(id, { 'settings.active': !currentStatus });
      message.success(`وب‌هوک ${!currentStatus ? 'فعال' : 'غیرفعال'} شد`);
      fetchData();
    } catch (error) {
      message.error('خطا در تغییر وضعیت');
    }
  };

  // =============================================
  // ستون‌های جدول
  // =============================================
  const columns = [
    {
      title: 'نام',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: record.settings?.active ? COLORS.success : COLORS.gray[400],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
            }}
          >
            <ApiOutlined />
          </div>
          <div>
            <strong>{text}</strong>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {record.url}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'رویدادها',
      dataIndex: 'events',
      key: 'events',
      render: (events) => (
        <Space size={[4, 4]} wrap>
          {events?.slice(0, 3).map((event) => {
            const option = EVENT_OPTIONS.find((e) => e.value === event);
            return (
              <Tag key={event} color="blue" style={{ fontSize: isPhone ? '9px' : '12px' }}>
                {option?.icon} {option?.label || event}
              </Tag>
            );
          })}
          {events?.length > 3 && (
            <Tag color="default" style={{ fontSize: isPhone ? '9px' : '12px' }}>
              +{events.length - 3}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'وضعیت',
      dataIndex: 'settings',
      key: 'settings',
      render: (settings) => (
        <Tag color={settings?.active ? 'success' : 'error'}>
          {settings?.active ? 'فعال' : 'غیرفعال'}
        </Tag>
      ),
    },
    {
      title: 'درخواست‌ها',
      key: 'stats',
      render: (_, record) => (
        <Space size="small">
          <Tag color="blue">{record.stats?.totalCalls || 0}</Tag>
          <Tag color="success">{record.stats?.successfulCalls || 0}</Tag>
          <Tag color="error">{record.stats?.failedCalls || 0}</Tag>
        </Space>
      ),
    },
    {
      title: 'عملیات',
      key: 'action',
      fixed: 'right',
      width: isPhone ? 120 : 200,
      render: (_, record) => (
        <Space size={isPhone ? 2 : 4}>
          <Tooltip title="ویرایش" placement="top">
            <Link to={`/webhooks/edit/${record._id}`}>
              <Button
                type="text"
                icon={<EditOutlined />}
                size={isPhone ? 'small' : 'middle'}
                style={{ color: COLORS.warning }}
                className="action-btn"
              />
            </Link>
          </Tooltip>
          <Tooltip title="تست" placement="top">
            <Button
              type="text"
              icon={<CheckCircleOutlined />}
              size={isPhone ? 'small' : 'middle'}
              style={{ color: COLORS.success }}
              onClick={() => handleTest(record._id)}
            />
          </Tooltip>
          <Tooltip title="فعال/غیرفعال" placement="top">
            <Switch
              size="small"
              checked={record.settings?.active}
              onChange={() => handleToggle(record._id, record.settings?.active)}
            />
          </Tooltip>
          <Tooltip title="حذف" placement="top">
            <Popconfirm
              title="آیا از حذف این وب‌هوک اطمینان دارید؟"
              onConfirm={() => handleDelete(record._id)}
              okText="بله"
              cancelText="خیر"
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                size={isPhone ? 'small' : 'middle'}
                style={{ color: COLORS.danger }}
                className="action-btn"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredData = data.filter(
    (item) =>
      item.name.includes(search) ||
      item.url.includes(search)
  );

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
          🔗 مدیریت وب‌هوک‌ها
          <Tag color="blue" style={{ marginRight: 8 }}>
            {data.length} وب‌هوک
          </Tag>
        </Title>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            بروزرسانی
          </Button>
          <Link to="/webhooks/new">
            <Button type="primary" icon={<PlusOutlined />}>
              {isPhone ? 'جدید' : 'وب‌هوک جدید'}
            </Button>
          </Link>
        </Space>
      </div>

      {/* آمار */}
      <Row gutter={[isPhone ? 4 : 8, isPhone ? 4 : 8]} style={{ marginBottom: 12 }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRight: `3px solid ${COLORS.primary}` }}>
            <Statistic title="کل وب‌هوک‌ها" value={stats.total || 0} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRight: `3px solid ${COLORS.success}` }}>
            <Statistic title="فعال" value={stats.active || 0} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRight: `3px solid ${COLORS.danger}` }}>
            <Statistic title="غیرفعال" value={stats.inactive || 0} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRight: `3px solid ${COLORS.orange}` }}>
            <Statistic title="درخواست‌ها" value={stats.totalCalls || 0} />
          </Card>
        </Col>
      </Row>

      {/* کارت اصلی */}
      <Card style={{ borderRadius: 'var(--radius)' }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder="جستجوی وب‌هوک‌ها..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="_id"
          loading={loading}
          scroll={{ x: isPhone ? 400 : isMobile ? 600 : 1000 }}
          pagination={{
            showSizeChanger: !isPhone,
            showQuickJumper: !isPhone,
            showTotal: (total) => `تعداد ${total} وب‌هوک`,
            pageSizeOptions: ['10', '20', '50'],
          }}
          locale={{
            emptyText: (
              <div style={{ padding: '40px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🔗</div>
                <Text type="secondary">هیچ وب‌هوکی تعریف نشده است</Text>
                <br />
                <Link to="/webhooks/new">
                  <Button type="primary" style={{ marginTop: 16 }} icon={<PlusOutlined />}>
                    ایجاد اولین وب‌هوک
                  </Button>
                </Link>
              </div>
            ),
          }}
        />
      </Card>

      <style>{`
        .action-btn {
          transition: all 0.3s ease !important;
          border-radius: 8px !important;
        }
        .action-btn:hover {
          transform: scale(1.15) !important;
          background: var(--bg-secondary) !important;
        }
        .ant-table-cell {
          vertical-align: middle !important;
        }
      `}</style>
    </div>
  );
}

export default WebhookList;
// frontend/src/components/signatures/SignatureList.jsx
import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Card,
  Input,
  Space,
  Tag,
  message,
  Typography,
  Tooltip,
  Row,
  Col,
  Badge,
  Tabs,
  Avatar,
  Modal,
  Form,
  Select,
  App,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  SignatureOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  PlusOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import signatureService from '../../services/signatureService';
import api from '../../services/api';
import { toPersianDate } from '../../utils/dateHelper';
import { COLORS } from '../../styles/theme';

const { Title, Text } = Typography;
const { Option } = Select;

// تنظیمات وضعیت امضا
const SIGNATURE_STATUS = {
  pending: { color: 'default', label: 'در انتظار', icon: <ClockCircleOutlined /> },
  otp_sent: { color: 'processing', label: 'OTP ارسال شد', icon: <SendOutlined /> },
  otp_verified: { color: 'processing', label: 'OTP تأیید شد', icon: <CheckCircleOutlined /> },
  signed: { color: 'purple', label: 'امضا شده', icon: <SignatureOutlined /> },
  verified: { color: 'success', label: 'تأیید شده', icon: <CheckCircleOutlined /> },
  rejected: { color: 'error', label: 'رد شده', icon: <CloseCircleOutlined /> },
  expired: { color: 'default', label: 'منقضی شده', icon: <ClockCircleOutlined /> },
};

const getStatusInfo = (status) => {
  return SIGNATURE_STATUS[status] || SIGNATURE_STATUS.pending;
};

function SignatureList() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [pendingData, setPendingData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [letters, setLetters] = useState([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsPhone(window.innerWidth <= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // دریافت کاربران
  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data.data || []);
    } catch (error) {
      console.error('خطا در دریافت کاربران:', error);
    }
  };

  // دریافت داده‌ها
  const fetchData = async () => {
    setLoading(true);
    try {
      const pendingRes = await signatureService.getPending();
      setPendingData(pendingRes.data.data || []);
      setHistoryData([]);
      await fetchUsers();
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      console.error('❌ خطا در fetchData:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // درخواست امضا جدید
  const handleRequestSignature = async (values) => {
    try {
      await signatureService.request({
        targetId: values.letterId,
        targetType: 'Document',
        signerId: values.signerId,
        message: values.message || '',
        type: 'both',
      });
      message.success('درخواست امضا با موفقیت ثبت شد');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ثبت درخواست امضا');
    }
  };

  // ستون‌های جدول در انتظار
  const pendingColumns = [
    {
      title: 'نامه',
      dataIndex: 'letter',
      key: 'letter',
      width: isPhone ? 150 : 250,
      render: (letter, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: COLORS.warning,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
              flexShrink: 0,
            }}
          >
            <FileTextOutlined />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {record.letter?.number || 'بدون شماره'}
            </div>
            <strong
              style={{
                fontSize: isPhone ? '13px' : '14px',
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: isPhone ? '80px' : isMobile ? '120px' : '200px',
              }}
            >
              {record.letter?.subject || 'بدون عنوان'}
            </strong>
          </div>
        </div>
      ),
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      width: isPhone ? 80 : 130,
      render: (status) => {
        const info = getStatusInfo(status);
        return (
          <Tag
            color={info.color}
            icon={info.icon}
            style={{ borderRadius: 12, fontSize: isPhone ? '10px' : '13px' }}
          >
            {info.label}
          </Tag>
        );
      },
    },
    {
      title: 'تاریخ',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: isPhone ? 80 : 130,
      render: (date) => (
        <span style={{ fontSize: isPhone ? '10px' : '13px' }}>
          {toPersianDate(date)}
        </span>
      ),
    },
    {
      title: 'عملیات',
      key: 'action',
      fixed: 'right',
      width: isPhone ? 80 : 120,
      render: (_, record) => (
        <Space size={isPhone ? 2 : 4}>
          <Tooltip title="شروع امضا" placement="top">
            <Button
              type="primary"
              icon={<SignatureOutlined />}
              size={isPhone ? 'small' : 'middle'}
              onClick={() => navigate(`/signatures/pad/${record._id}`)}
              disabled={record.status === 'signed' || record.status === 'verified' || record.status === 'rejected'}
            >
              {isPhone ? '' : 'امضا'}
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ستون‌های جدول تاریخچه
  const historyColumns = [
    {
      title: 'نامه',
      dataIndex: ['letter', 'subject'],
      key: 'subject',
      render: (text) => text || 'بدون عنوان',
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const info = getStatusInfo(status);
        return (
          <Tag
            color={info.color}
            icon={info.icon}
            style={{ borderRadius: 12 }}
          >
            {info.label}
          </Tag>
        );
      },
    },
    {
      title: 'تاریخ امضا',
      dataIndex: 'signedAt',
      key: 'signedAt',
      render: (date) => date ? toPersianDate(date) : '-',
    },
  ];

  // آمار
  const pendingCount = pendingData.filter(
    (p) => p.status !== 'signed' && p.status !== 'verified' && p.status !== 'rejected'
  ).length;

  const expiredCount = pendingData.filter(
    (p) => p.expiresAt && new Date(p.expiresAt) < new Date()
  ).length;

  // فیلتر
  const filteredPending = pendingData.filter(
    (item) =>
      item.letter?.subject?.includes(search) ||
      item.letter?.number?.includes(search)
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
          ✍️ مدیریت امضاها
          <Badge
            count={pendingCount}
            style={{
              background: COLORS.warning,
              marginRight: 8,
              fontSize: isPhone ? 10 : 12,
            }}
          />
          {expiredCount > 0 && (
            <Badge
              count={`${expiredCount} منقضی`}
              style={{
                background: COLORS.danger,
                marginRight: 4,
                fontSize: isPhone ? 10 : 12,
              }}
            />
          )}
        </Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
          >
            بروزرسانی
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            {isPhone ? 'درخواست' : 'درخواست امضا'}
          </Button>
        </Space>
      </div>

      {/* کارت اصلی */}
      <Card style={{ borderRadius: 'var(--radius)' }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder="جستجو در امضاها..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              size={isPhone ? 'small' : 'middle'}
            />
          </Col>
        </Row>

        {/* ✅ Tabs با `items` به‌جای TabPane */}
        <Tabs
          defaultActiveKey="pending"
          items={[
            {
              key: 'pending',
              label: (
                <span>
                  <ClockCircleOutlined />
                  در انتظار
                  <Badge
                    count={pendingCount}
                    style={{
                      background: COLORS.warning,
                      marginRight: 4,
                      fontSize: 10,
                    }}
                  />
                </span>
              ),
              children: (
                <Table
                  columns={pendingColumns}
                  dataSource={filteredPending}
                  rowKey="_id"
                  loading={loading}
                  scroll={{ x: isPhone ? 400 : isMobile ? 600 : 1000 }}
                  pagination={{
                    showSizeChanger: !isPhone,
                    showQuickJumper: !isPhone,
                    showTotal: (total) => `تعداد ${total} درخواست`,
                    pageSizeOptions: ['10', '20', '50'],
                    size: isPhone ? 'small' : 'default',
                  }}
                  locale={{
                    emptyText: (
                      <div style={{ padding: '40px 0' }}>
                        <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
                        <Text type="secondary">هیچ درخواست امضای در انتظاری وجود ندارد</Text>
                      </div>
                    ),
                  }}
                />
              ),
            },
            {
              key: 'history',
              label: (
                <span>
                  <CheckCircleOutlined />
                  تاریخچه
                </span>
              ),
              children: (
                <Table
                  columns={historyColumns}
                  dataSource={historyData}
                  rowKey="_id"
                  loading={loading}
                  scroll={{ x: isPhone ? 400 : isMobile ? 600 : 1000 }}
                  pagination={{
                    showSizeChanger: !isPhone,
                    showQuickJumper: !isPhone,
                    showTotal: (total) => `تعداد ${total} امضا`,
                    pageSizeOptions: ['10', '20', '50'],
                    size: isPhone ? 'small' : 'default',
                  }}
                  locale={{
                    emptyText: (
                      <div style={{ padding: '40px 0' }}>
                        <div style={{ fontSize: 48, marginBottom: 8 }}>📭</div>
                        <Text type="secondary">هیچ امضایی ثبت نشده است</Text>
                      </div>
                    ),
                  }}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* مودال درخواست امضا */}
      <Modal
        title="📝 درخواست امضا"
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        okText="ارسال درخواست"
        cancelText="انصراف"
        width={isPhone ? '95%' : 500}
      >
        <Form form={form} layout="vertical" onFinish={handleRequestSignature}>
          <Form.Item
            name="letterId"
            label="نامه"
            rules={[{ required: true, message: 'لطفاً نامه را انتخاب کنید' }]}
          >
            <Select
              placeholder="انتخاب نامه"
              showSearch
              optionFilterProp="children"
            >
              {/* لیست نامه‌ها باید از API گرفته شود */}
            </Select>
          </Form.Item>

          <Form.Item
            name="signerId"
            label="امضاکننده"
            rules={[{ required: true, message: 'لطفاً امضاکننده را انتخاب کنید' }]}
          >
            <Select
              placeholder="انتخاب امضاکننده"
              showSearch
              optionFilterProp="children"
            >
              {users.map((u) => (
                <Option key={u._id} value={u._id}>
                  {u.fullName || u.username}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="message" label="پیام">
            <Input.TextArea rows={3} placeholder="پیام خود را وارد کنید..." />
          </Form.Item>

          <Text type="secondary" style={{ fontSize: 12 }}>
            💡 پس از ارسال درخواست، امضاکننده کد OTP دریافت کرده و می‌تواند امضا را تکمیل کند.
          </Text>
        </Form>
      </Modal>
    </div>
  );
}

export default SignatureList;
import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  message,
  Popconfirm,
  Typography,
  Tooltip,
  Row,
  Col,
  Modal,
  Form,
  Select,
  DatePicker,
  Switch,
  App,
  Badge,
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SwapOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import { toPersianDate } from '../utils/dateHelper';
import { COLORS } from '../styles/theme';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

function DelegationManager() {
  const { message } = App.useApp();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [form] = Form.useForm();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  const [delegatedLetters, setDelegatedLetters] = useState([]);
  const [letterModalVisible, setLetterModalVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsPhone(window.innerWidth <= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // =============================================
  // دریافت کاربران
  // =============================================
  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data.data || []);
    } catch (error) {
      console.error('خطا در دریافت کاربران:', error);
    }
  };

  // =============================================
  // دریافت تفویض‌ها
  // =============================================
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/delegation/active');
      setData(res.data.data || []);
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // دریافت نامه‌های تفویض شده
  // =============================================
  const fetchDelegatedLetters = async () => {
    try {
      const res = await api.get('/delegation/letters');
      setDelegatedLetters(res.data.data || []);
    } catch (error) {
      message.error('خطا در دریافت نامه‌های تفویض شده');
    }
  };

  useEffect(() => {
    fetchData();
    fetchUsers();
    fetchDelegatedLetters();
  }, []);

  // =============================================
  // ایجاد تفویض جدید
  // =============================================
  const handleCreate = () => {
    form.resetFields();
    form.setFieldsValue({
      permissions: ['view'],
      isActive: true,
    });
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // تبدیل تاریخ‌ها
      const payload = {
        targetUserId: values.targetUserId,
        startDate: values.dateRange[0].toISOString(),
        endDate: values.dateRange[1].toISOString(),
        permissions: values.permissions || ['view'],
        reason: values.reason || '',
      };

      await api.post('/delegation', payload);
      message.success('تفویض اختیار با موفقیت ایجاد شد');
      setModalVisible(false);
      form.resetFields();
      fetchData();
      fetchDelegatedLetters();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ایجاد تفویض');
    }
  };

  // =============================================
  // لغو تفویض
  // =============================================
  const handleCancel = async (id) => {
    try {
      await api.delete(`/delegation/${id}`);
      message.success('تفویض اختیار با موفقیت لغو شد');
      fetchData();
      fetchDelegatedLetters();
    } catch (error) {
      message.error('خطا در لغو تفویض');
    }
  };

  // =============================================
  // ستون‌های جدول
  // =============================================
  const permissionLabels = {
    view: 'مشاهده',
    action: 'اقدام',
    sign: 'امضا',
    approve: 'تایید',
    all: 'همه',
  };

  const permissionColors = {
    view: 'blue',
    action: 'green',
    sign: 'purple',
    approve: 'orange',
    all: 'red',
  };

  const columns = [
    {
      title: 'کاربر جانشین',
      dataIndex: 'user',
      key: 'user',
      render: (user) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Avatar icon={<UserOutlined />} style={{ background: COLORS.primary }} />
          <div>
            <strong>{user?.fullName || user?.username || 'نامشخص'}</strong>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {user?.username || ''}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'بازه زمانی',
      key: 'dateRange',
      render: (_, record) => (
        <div>
          <div>
            <ClockCircleOutlined style={{ color: 'var(--text-muted)', marginLeft: 4 }} />
            <span style={{ fontSize: isPhone ? '10px' : '13px' }}>
              از {toPersianDate(record.startDate)}
            </span>
          </div>
          <div>
            <ClockCircleOutlined style={{ color: 'var(--text-muted)', marginLeft: 4 }} />
            <span style={{ fontSize: isPhone ? '10px' : '13px' }}>
              تا {toPersianDate(record.endDate)}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'مجوزها',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions) => (
        <Space size={[4, 4]} wrap>
          {permissions?.map((p) => (
            <Tag key={p} color={permissionColors[p] || 'default'} style={{ borderRadius: 12 }}>
              {permissionLabels[p] || p}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'وضعیت',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => {
        const now = new Date();
        const isExpired = !isActive;
        return (
          <Tag
            color={isExpired ? 'error' : 'success'}
            icon={isExpired ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
            style={{ borderRadius: 12 }}
          >
            {isExpired ? 'منقضی شده' : 'فعال'}
          </Tag>
        );
      },
    },
    {
      title: 'عملیات',
      key: 'action',
      fixed: 'right',
      width: isPhone ? 80 : 120,
      render: (_, record) => (
        <Tooltip title="لغو تفویض">
          <Popconfirm
            title="آیا از لغو این تفویض اطمینان دارید؟"
            onConfirm={() => handleCancel(record._id)}
            okText="بله"
            cancelText="خیر"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size={isPhone ? 'small' : 'middle'}
              className="action-btn"
            />
          </Popconfirm>
        </Tooltip>
      ),
    },
  ];

  // =============================================
  // ستون‌های نامه‌های تفویض شده
  // =============================================
  const letterColumns = [
    {
      title: 'نامه',
      dataIndex: ['letter', 'subject'],
      key: 'subject',
      render: (text, record) => (
        <div>
          <strong>{text || 'بدون عنوان'}</strong>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            شماره: {record.letter?.number || '---'}
          </div>
        </div>
      ),
    },
    {
      title: 'فرستنده',
      dataIndex: ['from', 'fullName'],
      key: 'from',
      render: (text) => text || 'نامشخص',
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'pending' ? 'warning' : 'success'} style={{ borderRadius: 12 }}>
          {status === 'pending' ? 'در انتظار' : 'اقدام شده'}
        </Tag>
      ),
    },
    {
      title: 'سررسید',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => date ? toPersianDate(date) : 'نامحدود',
    },
  ];

  return (
    <div className="fade-in">
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
          🔄 تفویض اختیار
          <Badge
            count={data.filter(d => d.isActive).length}
            style={{
              background: COLORS.success,
              marginRight: 8,
              fontSize: isPhone ? 10 : 12,
            }}
          />
          <Badge
            count={delegatedLetters.length}
            style={{
              background: COLORS.warning,
              marginRight: 4,
              fontSize: isPhone ? 10 : 12,
            }}
            title="نامه‌های تفویض شده"
          />
        </Title>
        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchData();
              fetchDelegatedLetters();
            }}
            loading={loading}
            size={isPhone ? 'small' : 'middle'}
          >
            بروزرسانی
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size={isPhone ? 'small' : 'middle'}
          >
            {isPhone ? 'جدید' : 'تفویض جدید'}
          </Button>
        </Space>
      </div>

      {/* نامه‌های تفویض شده */}
      {delegatedLetters.length > 0 && (
        <Card
          title={
            <Space>
              <SwapOutlined style={{ color: COLORS.warning }} />
              <span>نامه‌های تفویض شده به شما</span>
              <Badge count={delegatedLetters.length} style={{ background: COLORS.warning }} />
            </Space>
          }
          style={{ borderRadius: 'var(--radius)', marginBottom: 16 }}
          size={isPhone ? 'small' : 'default'}
        >
          <Table
            columns={letterColumns}
            dataSource={delegatedLetters}
            rowKey="_id"
            scroll={{ x: isPhone ? 400 : isMobile ? 600 : 800 }}
            pagination={{
              pageSize: 5,
              showSizeChanger: !isPhone,
              size: isPhone ? 'small' : 'default',
            }}
            size={isPhone ? 'small' : 'middle'}
            locale={{
              emptyText: 'هیچ نامه‌ای به شما تفویض نشده است',
            }}
          />
        </Card>
      )}

      {/* تفویض‌های فعال */}
      <Card
        title={
          <Space>
            <SwapOutlined style={{ color: COLORS.primary }} />
            <span>تفویض‌های فعال</span>
            <Badge
              count={data.filter(d => d.isActive).length}
              style={{ background: COLORS.success }}
            />
          </Space>
        }
        style={{ borderRadius: 'var(--radius)' }}
        size={isPhone ? 'small' : 'default'}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder={isPhone ? '🔍 جستجو...' : 'جستجوی تفویض‌ها...'}
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              size={isPhone ? 'small' : 'middle'}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={data.filter(item =>
            item.user?.fullName?.includes(search) ||
            item.user?.username?.includes(search)
          )}
          rowKey="_id"
          loading={loading}
          scroll={{ x: isPhone ? 400 : isMobile ? 600 : 1000 }}
          pagination={{
            showSizeChanger: !isPhone,
            showQuickJumper: !isPhone,
            showTotal: (total) => `تعداد ${total} تفویض`,
            pageSizeOptions: ['10', '20', '50'],
            size: isPhone ? 'small' : 'default',
          }}
          locale={{
            emptyText: (
              <div style={{ padding: isPhone ? '30px 0' : '60px 0' }}>
                <div style={{ fontSize: isPhone ? '32px' : '64px', marginBottom: 8 }}>🔄</div>
                <Text type="secondary" style={{ fontSize: isPhone ? '13px' : '16px' }}>
                  هیچ تفویض اختیاری فعال نیست
                </Text>
                <br />
                <Button
                  type="primary"
                  style={{ marginTop: isPhone ? '12px' : '20px' }}
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                  size={isPhone ? 'small' : 'large'}
                >
                  {isPhone ? 'اولین تفویض' : 'ایجاد تفویض جدید'}
                </Button>
              </div>
            ),
          }}
        />
      </Card>

      {/* مودال ایجاد تفویض */}
      <Modal
        title="🔄 تفویض اختیار جدید"
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={isPhone ? '95%' : 550}
        okText="ایجاد"
        cancelText="انصراف"
        className={isMobile ? 'ant-modal-fullscreen-mobile' : ''}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="targetUserId"
            label="کاربر جانشین"
            rules={[{ required: true, message: 'کاربر جانشین را انتخاب کنید' }]}
          >
            <Select
              placeholder="انتخاب کاربر جانشین"
              showSearch
              optionFilterProp="children"
              size={isPhone ? 'small' : 'middle'}
            >
              {users
                .filter(u => u._id !== JSON.parse(localStorage.getItem('user') || '{}')?._id)
                .map((u) => (
                  <Option key={u._id} value={u._id}>
                    {u.fullName || u.username} ({u.username})
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="بازه زمانی"
            rules={[{ required: true, message: 'بازه زمانی را انتخاب کنید' }]}
          >
            <RangePicker
              format="YYYY/MM/DD"
              style={{ width: '100%' }}
              size={isPhone ? 'small' : 'middle'}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item
            name="permissions"
            label="مجوزها"
            rules={[{ required: true, message: 'حداقل یک مجوز انتخاب کنید' }]}
          >
            <Select
              mode="multiple"
              placeholder="انتخاب مجوزها"
              size={isPhone ? 'small' : 'middle'}
            >
              <Option value="view">مشاهده</Option>
              <Option value="action">اقدام</Option>
              <Option value="sign">امضا</Option>
              <Option value="approve">تایید</Option>
              <Option value="all">همه (دسترسی کامل)</Option>
            </Select>
          </Form.Item>

          <Form.Item name="reason" label="دلیل تفویض">
            <Input.TextArea
              rows={2}
              placeholder="دلیل تفویض اختیار (اختیاری)"
              size={isPhone ? 'small' : 'middle'}
            />
          </Form.Item>

          <Alert
            message="نکته مهم"
            description="کاربر جانشین در بازه زمانی مشخص شده، به جای شما می‌تواند اقدامات مربوط به نامه‌ها را انجام دهد."
            type="info"
            showIcon
          />
        </Form>
      </Modal>

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
        @media (max-width: 768px) {
          .ant-table { font-size: 12px !important; }
          .ant-table-thead > tr > th,
          .ant-table-tbody > tr > td {
            padding: 6px 8px !important;
          }
        }
        @media (max-width: 480px) {
          .ant-table { font-size: 11px !important; }
          .ant-table-thead > tr > th,
          .ant-table-tbody > tr > td {
            padding: 4px 6px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default DelegationManager;
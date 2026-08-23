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
  Select,
  DatePicker,
  Modal,
  Form,
  App,
  Avatar,
  Dropdown,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  SendOutlined,
  UserOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  ClearOutlined,
  MoreOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toPersianDate } from '../utils/dateHelper';
import { COLORS } from '../styles/theme';
import LetterStatusBadge from './letters/LetterStatusBadge';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// =============================================
// تنظیمات وضعیت ارجاع
// =============================================
const REFERRAL_STATUS = {
  pending: { color: 'warning', label: 'در انتظار', icon: <ClockCircleOutlined /> },
  read: { color: 'processing', label: 'مطالعه شده', icon: <EyeOutlined /> },
  actioned: { color: 'success', label: 'اقدام شده', icon: <CheckOutlined /> },
  rejected: { color: 'error', label: 'رد شده', icon: <CloseOutlined /> },
  forwarded: { color: 'purple', label: 'ارجاع مجدد', icon: <SendOutlined /> },
};

const getStatusInfo = (status) => {
  return REFERRAL_STATUS[status] || REFERRAL_STATUS.pending;
};

function ReferralList() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    priority: '',
    dateRange: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [stats, setStats] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [form] = Form.useForm();
  const [actionLoading, setActionLoading] = useState(false);

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
  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.append('fromDate', filters.dateRange[0].toISOString());
        params.append('toDate', filters.dateRange[1].toISOString());
      }
      params.append('page', page);
      params.append('limit', pageSize);

      const res = await api.get(`/referrals/my?${params.toString()}`);
      setData(res.data.data || []);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: res.data.pagination?.total || 0,
      });

      // دریافت آمار
      const statsRes = await api.get('/referrals/stats');
      setStats(statsRes.data.data || {});
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, filters]);

  // =============================================
  // ثبت اقدام روی ارجاع
  // =============================================
  const handleAction = async (id, action, comment = '') => {
    setActionLoading(true);
    try {
      await api.patch(`/referrals/${id}/${action}`, { comment });
      message.success('اقدام با موفقیت ثبت شد');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ثبت اقدام');
    } finally {
      setActionLoading(false);
    }
  };

  // =============================================
  // ارجاع مجدد
  // =============================================
  const handleForward = async (id, values) => {
    setActionLoading(true);
    try {
      await api.post(`/referrals/${id}/forward`, values);
      message.success('ارجاع مجدد با موفقیت انجام شد');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ارجاع مجدد');
    } finally {
      setActionLoading(false);
    }
  };

  // =============================================
  // باز کردن مودال اقدام
  // =============================================
  const openActionModal = (record, type) => {
    setSelectedReferral(record);
    form.resetFields();
    form.setFieldsValue({ type });
    setModalVisible(true);
  };

  // =============================================
  // ستون‌های جدول
  // =============================================
  const columns = [
    {
      title: 'نامه',
      dataIndex: ['letter', 'subject'],
      key: 'subject',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: COLORS.primary,
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
              {text || 'بدون عنوان'}
            </strong>
          </div>
        </div>
      ),
    },
    {
      title: 'نوع ارجاع',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const map = {
          review: { color: 'blue', label: 'پاراف', icon: '📋' },
          approve: { color: 'green', label: 'تایید', icon: '✅' },
          sign: { color: 'purple', label: 'امضا', icon: '✍️' },
          inform: { color: 'orange', label: 'اطلاع', icon: '📢' },
          forward: { color: 'cyan', label: 'ارجاع', icon: '🔄' },
        };
        const info = map[type] || { color: 'default', label: type };
        return (
          <Tag color={info.color} style={{ borderRadius: 12, fontSize: isPhone ? '10px' : '13px' }}>
            {info.icon} {info.label}
          </Tag>
        );
      },
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
            style={{ borderRadius: 12, fontSize: isPhone ? '10px' : '13px' }}
          >
            {info.label}
          </Tag>
        );
      },
    },
    {
      title: 'فرستنده',
      dataIndex: 'from',
      key: 'from',
      render: (from) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: isPhone ? '10px' : '13px' }}>
          <Avatar icon={<UserOutlined />} size="small" />
          {from?.fullName || from?.username || 'نامشخص'}
        </span>
      ),
    },
    {
      title: 'سررسید',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => {
        if (!date) return <Tag color="default">نامحدود</Tag>;
        const isOverdue = new Date(date) < new Date();
        return (
          <Tag color={isOverdue ? 'error' : 'success'} style={{ borderRadius: 12 }}>
            {isOverdue ? '⚠️ ' : ''}
            {toPersianDate(date)}
          </Tag>
        );
      },
    },
    {
      title: 'عملیات',
      key: 'action',
      fixed: 'right',
      width: isPhone ? 100 : 180,
      render: (_, record) => {
        const isPending = record.status === 'pending' || record.status === 'read';
        const isActionable = record.type === 'review' || record.type === 'approve' || record.type === 'sign';

        return (
          <Space size={isPhone ? 2 : 4}>
            <Tooltip title="مشاهده" placement="top">
              <Button
                type="text"
                icon={<EyeOutlined />}
                size={isPhone ? 'small' : 'middle'}
                style={{ color: COLORS.primary }}
                onClick={() => navigate(`/referrals/${record._id}`)}
                className="action-btn"
              />
            </Tooltip>
            {isPending && isActionable && (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'action',
                      label: 'ثبت اقدام',
                      icon: <CheckOutlined />,
                      onClick: () => openActionModal(record, 'action'),
                    },
                    {
                      key: 'forward',
                      label: 'ارجاع مجدد',
                      icon: <SendOutlined />,
                      onClick: () => openActionModal(record, 'forward'),
                    },
                  ],
                }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Button
                  type="primary"
                  size={isPhone ? 'small' : 'middle'}
                  icon={<MoreOutlined />}
                >
                  {isPhone ? '' : 'اقدام'}
                </Button>
              </Dropdown>
            )}
          </Space>
        );
      },
    },
  ];

  // =============================================
  // آمار وضعیت‌ها
  // =============================================
  const statusCounts = {
    pending: data.filter((d) => d.status === 'pending').length,
    read: data.filter((d) => d.status === 'read').length,
    actioned: data.filter((d) => d.status === 'actioned').length,
    rejected: data.filter((d) => d.status === 'rejected').length,
    forwarded: data.filter((d) => d.status === 'forwarded').length,
  };

  const filteredData = data.filter(
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
          📋 مدیریت ارجاعات
          <Badge
            count={data.filter((d) => d.status === 'pending' || d.status === 'read').length}
            style={{
              background: COLORS.warning,
              marginRight: 8,
              fontSize: isPhone ? 10 : 12,
            }}
          />
          {stats.overdue > 0 && (
            <Badge
              count={`${stats.overdue} معوق`}
              style={{
                background: COLORS.danger,
                marginRight: 4,
                fontSize: isPhone ? 10 : 12,
              }}
            />
          )}
        </Title>
        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchData(pagination.current, pagination.pageSize)}
            loading={loading}
            size={isPhone ? 'small' : 'middle'}
          >
            بروزرسانی
          </Button>
        </Space>
      </div>

      {/* آمار وضعیت‌ها */}
      <Row gutter={[isPhone ? 4 : 8, isPhone ? 4 : 8]} style={{ marginBottom: 12 }}>
        {Object.entries(statusCounts).map(([status, count]) => {
          const info = getStatusInfo(status);
          return (
            <Col key={status} xs={12} sm={6} md={4}>
              <Card
                size="small"
                style={{
                  borderRight: `3px solid ${info.color}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
                styles={{ body: { padding: isPhone ? '4px 8px' : '8px 12px' } }}
                onClick={() => setFilters({ ...filters, status: status !== filters.status ? status : '' })}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text type="secondary" style={{ fontSize: isPhone ? '9px' : '11px' }}>
                    {info.icon} {info.label}
                  </Text>
                  <Badge
                    count={count}
                    style={{
                      background: info.color,
                      fontSize: isPhone ? 8 : 10,
                    }}
                  />
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* کارت اصلی */}
      <Card style={{ borderRadius: 'var(--radius)' }}>
        {/* جستجو و فیلتر */}
        <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder={isPhone ? '🔍 جستجو...' : 'جستجو بر اساس شماره، موضوع...'}
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              size={isPhone ? 'small' : 'middle'}
            />
          </Col>
          <Col xs={24} md={12} lg={16}>
            <Space wrap style={{ gap: '4px' }}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setShowFilters(!showFilters)}
                type={showFilters ? 'primary' : 'default'}
                size={isPhone ? 'small' : 'middle'}
              >
                {!isPhone && 'فیلترها'}
              </Button>
              <Button
                icon={<ClearOutlined />}
                onClick={() => setFilters({ status: '', type: '', priority: '', dateRange: [] })}
                size={isPhone ? 'small' : 'middle'}
              >
                {!isPhone && 'پاک کردن'}
              </Button>
            </Space>
          </Col>
        </Row>

        {/* فیلترهای پیشرفته */}
        {showFilters && (
          <div
            style={{
              padding: isPhone ? '8px' : '12px',
              background: 'var(--bg-secondary)',
              borderRadius: 10,
              marginBottom: 12,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              alignItems: 'center',
            }}
          >
            <Text strong style={{ fontSize: isPhone ? '11px' : '13px' }}>
              فیلتر:
            </Text>
            <Select
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              placeholder="وضعیت"
              style={{ width: isPhone ? '90px' : '110px' }}
              allowClear
              size={isPhone ? 'small' : 'middle'}
            >
              {Object.entries(REFERRAL_STATUS).map(([key, value]) => (
                <Option key={key} value={key}>
                  {value.icon} {value.label}
                </Option>
              ))}
            </Select>
            <Select
              value={filters.type}
              onChange={(value) => setFilters({ ...filters, type: value })}
              placeholder="نوع"
              style={{ width: isPhone ? '90px' : '110px' }}
              allowClear
              size={isPhone ? 'small' : 'middle'}
            >
              <Option value="review">📋 پاراف</Option>
              <Option value="approve">✅ تایید</Option>
              <Option value="sign">✍️ امضا</Option>
              <Option value="inform">📢 اطلاع</Option>
              <Option value="forward">🔄 ارجاع</Option>
            </Select>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates || [] })}
              placeholder={['از تاریخ', 'تا تاریخ']}
              size={isPhone ? 'small' : 'middle'}
              style={{ width: isPhone ? '180px' : '220px' }}
              format="YYYY/MM/DD"
            />
          </div>
        )}

        {/* جدول */}
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="_id"
          loading={loading}
          scroll={{ x: isPhone ? 400 : isMobile ? 600 : 1000 }}
          pagination={{
            ...pagination,
            showSizeChanger: !isPhone,
            showQuickJumper: !isPhone,
            showTotal: (total) => `تعداد ${total} ارجاع`,
            pageSizeOptions: ['10', '20', '50'],
            onChange: (page, pageSize) => fetchData(page, pageSize),
            size: isPhone ? 'small' : 'default',
          }}
          size={isPhone ? 'small' : 'middle'}
          locale={{
            emptyText: (
              <div style={{ padding: isPhone ? '30px 0' : '60px 0' }}>
                <div style={{ fontSize: isPhone ? '32px' : '64px', marginBottom: 8 }}>📭</div>
                <Text type="secondary" style={{ fontSize: isPhone ? '13px' : '16px' }}>
                  هیچ ارجاعی برای شما ثبت نشده است
                </Text>
              </div>
            ),
          }}
        />
      </Card>

      {/* مودال اقدام روی ارجاع */}
      <Modal
        title="اقدام روی ارجاع"
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setSelectedReferral(null);
        }}
        okText="ثبت اقدام"
        cancelText="انصراف"
        okButtonProps={{ loading: actionLoading }}
        width={isPhone ? '95%' : 450}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            if (values.type === 'forward') {
              handleForward(selectedReferral?._id, values);
            } else {
              handleAction(selectedReferral?._id, 'action', values.comment);
            }
          }}
        >
          <Form.Item name="type" hidden>
            <Input />
          </Form.Item>

          {form.getFieldValue('type') === 'forward' ? (
            <>
              <Form.Item
                name="to"
                label="کاربر مقصد"
                rules={[{ required: true, message: 'کاربر مقصد را انتخاب کنید' }]}
              >
                <Select
                  placeholder="انتخاب کاربر"
                  showSearch
                  optionFilterProp="children"
                >
                  {/* اینجا باید لیست کاربران از API گرفته شود */}
                </Select>
              </Form.Item>
              <Form.Item name="message" label="پیام">
                <Input.TextArea rows={2} placeholder="پیام ارجاع" />
              </Form.Item>
            </>
          ) : (
            <Form.Item name="comment" label="توضیحات">
              <Input.TextArea rows={3} placeholder="توضیحات خود را وارد کنید..." />
            </Form.Item>
          )}

          <Text type="secondary" style={{ fontSize: 12 }}>
            💡 با ثبت اقدام، وضعیت ارجاع به روزرسانی می‌شود.
          </Text>
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

export default ReferralList;
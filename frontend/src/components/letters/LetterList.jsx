// frontend/src/components/letters/LetterList.jsx
import { useState, useEffect, useCallback } from 'react';
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
  Select,
  Badge,
  DatePicker,
  App,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  FilterOutlined,
  ClearOutlined,
  UserOutlined,
  FileTextOutlined,
  CheckOutlined,
  CloseOutlined,
  SendOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  NumberOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import letterService from '../../services/letterService';
import { toPersianDate } from '../../utils/dateHelper';
import { COLORS } from '../../styles/theme';
import LetterStatusBadge, { getStatusInfo } from './LetterStatusBadge';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// =============================================
// تنظیمات فیلترها
// =============================================
const FILTER_OPTIONS = {
  letterType: [
    { value: 'incoming', label: 'ورودی', icon: '📥' },
    { value: 'outgoing', label: 'خروجی', icon: '📤' },
    { value: 'internal', label: 'داخلی', icon: '📋' },
  ],
  priority: [
    { value: 'low', label: 'کم', color: '#8c8c8c' },
    { value: 'medium', label: 'متوسط', color: '#faad14' },
    { value: 'high', label: 'بالا', color: '#ff4d4f' },
    { value: 'urgent', label: 'فوری', color: '#ff4d4f' },
  ],
};

function LetterList({
  type = 'all',
  title = 'لیست نامه‌ها',
  showFilters = true,
  showActions = true,
  showBulkActions = true,
}) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // =============================================
  // State
  // =============================================
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    letterType: '',
    priority: '',
    classification: '',
    secretariat: '',
    dateRange: [],
  });
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [stats, setStats] = useState({
    draft: 0,
    registered: 0,
    in_review: 0,
    approved: 0,
    rejected: 0,
    signed: 0,
    archived: 0,
    total: 0,
    today: 0,
    byType: {
      incoming: 0,
      outgoing: 0,
      internal: 0,
    }
  });

  // =============================================
  // دریافت داده‌ها
  // =============================================
  const fetchData = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        ...(search && { search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.letterType && { letterType: filters.letterType }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.secretariat && { secretariat: filters.secretariat }),
      };

      if (filters.dateRange && filters.dateRange.length === 2) {
        params.fromDate = filters.dateRange[0].toISOString();
        params.toDate = filters.dateRange[1].toISOString();
      }

      let response;
      switch (type) {
        case 'inbox':
          params.receiver = 'me';
          response = await letterService.getAll(params);
          break;
        case 'outbox':
          params.sender = 'me';
          response = await letterService.getAll(params);
          break;
        case 'pending':
          response = await letterService.getPending();
          break;
        default:
          response = await letterService.getAll(params);
          break;
      }

      const result = response.data.data || [];
      setData(result);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: response.data.pagination?.total || result.length || 0,
      });

      try {
        const statsRes = await letterService.getStats();
        if (statsRes.data && statsRes.data.data) {
          setStats(statsRes.data.data);
        }
      } catch (statsError) {
        console.warn('⚠️ خطا در دریافت آمار، استفاده از مقادیر پیش‌فرض:', statsError.message);
      }

    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      console.error('❌ خطا در fetchData:', error);
    } finally {
      setLoading(false);
    }
  }, [search, filters, type, message]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // =============================================
  // ریسپانسیو
  // =============================================
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsPhone(window.innerWidth <= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // =============================================
  // هندلرها
  // =============================================
  const handleTableChange = (pagination) => {
    fetchData(pagination.current, pagination.pageSize);
  };

  const handleDelete = async (id) => {
    try {
      await letterService.delete(id);
      message.success('نامه با موفقیت حذف شد');
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در حذف');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      await Promise.all(
        selectedRowKeys.map((id) => letterService.delete(id))
      );
      message.success(`${selectedRowKeys.length} نامه با موفقیت حذف شد`);
      setSelectedRowKeys([]);
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('خطا در حذف گروهی');
    }
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      letterType: '',
      priority: '',
      classification: '',
      secretariat: '',
      dateRange: [],
    });
    setSearch('');
  };

  const handleStatusAction = async (id, action, comment = '') => {
    try {
      switch (action) {
        case 'register':
          await letterService.register(id, comment);
          message.success('نامه با موفقیت ثبت شد');
          break;
        case 'approve':
          await letterService.approveReview(id, comment);
          message.success('نامه با موفقیت تأیید شد');
          break;
        case 'reject':
          await letterService.rejectReview(id, comment);
          message.success('نامه با موفقیت رد شد');
          break;
        case 'archive':
          await letterService.archive(id, 'active', comment);
          message.success('نامه با موفقیت بایگانی شد');
          break;
        default:
          return;
      }
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در انجام عملیات');
    }
  };

  // =============================================
  // ستون‌های جدول
  // =============================================
  const columns = [
    {
      title: 'شماره و عنوان',
      dataIndex: 'number',
      key: 'number',
      width: isPhone ? 150 : 250,
      render: (number, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: getStatusInfo(record.status).color || COLORS.gray[400],
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
              {number || 'بدون شماره'}
            </div>
            <strong
              style={{
                fontSize: isPhone ? '13px' : '14px',
                color: 'var(--text-primary)',
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: isPhone ? '80px' : isMobile ? '120px' : '200px',
              }}
            >
              {record.subject}
            </strong>
          </div>
        </div>
      ),
      sorter: (a, b) => (a.subject || '').localeCompare(b.subject || ''),
    },
    {
      title: 'نوع',
      dataIndex: 'letterType',
      key: 'letterType',
      width: isPhone ? 60 : 100,
      render: (type) => {
        const info = FILTER_OPTIONS.letterType.find((t) => t.value === type);
        return (
          <Tag style={{ borderRadius: 12, fontSize: isPhone ? '10px' : '13px' }}>
            {info?.icon || '📄'} {info?.label || type}
          </Tag>
        );
      },
      filters: FILTER_OPTIONS.letterType.map((t) => ({ text: t.label, value: t.value })),
      onFilter: (value, record) => record.letterType === value,
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      width: isPhone ? 80 : 130,
      render: (status) => <LetterStatusBadge status={status} size={isPhone ? 'small' : 'default'} />,
    },
    {
      title: 'اولویت',
      dataIndex: 'priority',
      key: 'priority',
      width: isPhone ? 60 : 100,
      render: (priority) => {
        const info = FILTER_OPTIONS.priority.find((p) => p.value === priority);
        return (
          <Tag
            color={info?.color || 'default'}
            style={{
              borderRadius: 12,
              fontSize: isPhone ? '10px' : '13px',
              fontWeight: priority === 'urgent' ? 600 : 400,
            }}
          >
            {info?.label || priority}
          </Tag>
        );
      },
      filters: FILTER_OPTIONS.priority.map((p) => ({ text: p.label, value: p.value })),
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: 'فرستنده/گیرنده',
      key: 'sender',
      width: isPhone ? 80 : 150,
      render: (_, record) => {
        const name =
          type === 'inbox' || type === 'pending'
            ? record.sender?.fullName || record.senderName || '-'
            : record.receiver?.fullName || record.receiverName || '-';
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: isPhone ? '10px' : '13px' }}>
            <UserOutlined style={{ color: 'var(--text-muted)' }} />
            {name}
          </span>
        );
      },
    },
    {
      title: 'تاریخ',
      dataIndex: 'letterDate',
      key: 'letterDate',
      className: isPhone ? 'hide-mobile' : '',
      width: isPhone ? 80 : 130,
      render: (date) => (
        <span
          style={{
            direction: 'ltr',
            display: 'inline-block',
            fontFamily: 'monospace',
            fontSize: isPhone ? '10px' : '13px',
          }}
        >
          {toPersianDate(date)}
        </span>
      ),
      sorter: (a, b) => new Date(a.letterDate) - new Date(b.letterDate),
    },
    {
      title: 'عملیات',
      key: 'action',
      fixed: 'right',
      width: isPhone ? 80 : isMobile ? 120 : 200,
      render: (_, record) => {
        const status = record.status;

        return (
          <Space size={isPhone ? 2 : 4}>
            {/* مشاهده */}
            <Tooltip title="مشاهده" placement="top">
              <Link to={`/letters/${record._id}`}>
                <Button
                  type="text"
                  icon={<EyeOutlined />}
                  size={isPhone ? 'small' : 'middle'}
                  style={{ color: COLORS.primary }}
                  className="action-btn"
                />
              </Link>
            </Tooltip>

            {/* ویرایش (فقط پیش‌نویس) */}
            {status === 'draft' && (
              <Tooltip title="ویرایش" placement="top">
                <Link to={`/letters/edit/${record._id}`}>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    size={isPhone ? 'small' : 'middle'}
                    style={{ color: COLORS.warning }}
                    className="action-btn"
                  />
                </Link>
              </Tooltip>
            )}

            {/* ثبت نامه (پیش‌نویس) */}
            {status === 'draft' && (
              <Tooltip title="ثبت نامه" placement="top">
                <Popconfirm
                  title="آیا از ثبت این نامه اطمینان دارید؟"
                  onConfirm={() => handleStatusAction(record._id, 'register')}
                  okText="بله"
                  cancelText="خیر"
                >
                  <Button
                    type="text"
                    icon={<SendOutlined />}
                    size={isPhone ? 'small' : 'middle'}
                    style={{ color: COLORS.success }}
                    className="action-btn"
                  />
                </Popconfirm>
              </Tooltip>
            )}

            {/* تأیید/رد (در جریان بررسی) */}
            {status === 'in_review' && (
              <>
                <Tooltip title="تأیید" placement="top">
                  <Popconfirm
                    title="آیا از تأیید این نامه اطمینان دارید؟"
                    onConfirm={() => handleStatusAction(record._id, 'approve')}
                    okText="بله"
                    cancelText="خیر"
                  >
                    <Button
                      type="text"
                      icon={<CheckOutlined />}
                      size={isPhone ? 'small' : 'middle'}
                      style={{ color: COLORS.success }}
                      className="action-btn"
                    />
                  </Popconfirm>
                </Tooltip>
                <Tooltip title="رد" placement="top">
                  <Popconfirm
                    title="آیا از رد این نامه اطمینان دارید؟"
                    onConfirm={() => handleStatusAction(record._id, 'reject')}
                    okText="بله"
                    cancelText="خیر"
                  >
                    <Button
                      type="text"
                      icon={<CloseOutlined />}
                      size={isPhone ? 'small' : 'middle'}
                      style={{ color: COLORS.danger }}
                      className="action-btn"
                    />
                  </Popconfirm>
                </Tooltip>
              </>
            )}

            {/* بایگانی (امضا شده) */}
            {status === 'signed' && (
              <Tooltip title="بایگانی" placement="top">
                <Popconfirm
                  title="آیا از بایگانی این نامه اطمینان دارید؟"
                  onConfirm={() => handleStatusAction(record._id, 'archive')}
                  okText="بله"
                  cancelText="خیر"
                >
                  <Button
                    type="text"
                    icon={<InboxOutlined />}
                    size={isPhone ? 'small' : 'middle'}
                    style={{ color: COLORS.cyan }}
                    className="action-btn"
                  />
                </Popconfirm>
              </Tooltip>
            )}

            {/* حذف (فقط پیش‌نویس) */}
            {status === 'draft' && (
              <Tooltip title="حذف" placement="top">
                <Popconfirm
                  title="آیا از حذف این نامه اطمینان دارید؟"
                  onConfirm={() => handleDelete(record._id)}
                  okText="بله"
                  cancelText="خیر"
                  placement="left"
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
            )}
          </Space>
        );
      },
    },
  ];

  // =============================================
  // انتخاب‌های گروهی
  // =============================================
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys) => setSelectedRowKeys(selectedRowKeys),
    selections: !isPhone
      ? [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE]
      : undefined,
  };

  // =============================================
  // آمار وضعیت‌ها
  // =============================================
  const statusCounts = {
    draft: data.filter((d) => d.status === 'draft').length,
    registered: data.filter((d) => d.status === 'registered').length,
    in_review: data.filter((d) => d.status === 'in_review').length,
    approved: data.filter((d) => d.status === 'approved').length,
    rejected: data.filter((d) => d.status === 'rejected').length,
    signed: data.filter((d) => d.status === 'signed').length,
    archived: data.filter((d) => d.status === 'archived').length,
  };

  // =============================================
  // Render
  // =============================================
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
          <Title level={isPhone ? 4 : isMobile ? 3 : 2} style={{ margin: 0 }}>
            {title}
            <Badge
              count={data.length}
              style={{
                background: COLORS.primary,
                marginRight: 8,
                fontSize: isPhone ? 10 : 12,
              }}
            />
          </Title>
        </div>
        <Space wrap size={[4, 4]}>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchData(pagination.current, pagination.pageSize)}
            loading={loading}
            size={isPhone ? 'small' : isMobile ? 'middle' : 'middle'}
          >
            {!isPhone && 'بروزرسانی'}
          </Button>
          {/* ✅ دکمه جدید: شماره‌گذاری نامه‌ها */}
          {hasPermission('admin') && (
            <Button
              icon={<NumberOutlined />}
              onClick={() => navigate('/letter-numbering')}
              size={isPhone ? 'small' : isMobile ? 'middle' : 'middle'}
            >
              {isPhone ? 'شماره‌گذاری' : isMobile ? 'شماره‌گذاری' : 'شماره‌گذاری نامه‌ها'}
            </Button>
          )}
          {showActions && (
            <Link to="/letters/new">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size={isPhone ? 'small' : isMobile ? 'middle' : 'large'}
              >
                {isPhone ? 'جدید' : isMobile ? 'افزودن' : 'نامه جدید'}
              </Button>
            </Link>
          )}
        </Space>
      </div>

      {/* آمار وضعیت‌ها */}
      <Row gutter={[isPhone ? 4 : 8, isPhone ? 4 : 8]} style={{ marginBottom: 12 }}>
        {Object.entries(statusCounts).map(([status, count]) => {
          const info = getStatusInfo(status);
          return (
            <Col key={status} xs={12} sm={6} md={3}>
              <Card
                size="small"
                style={{
                  borderRight: `3px solid ${info.color}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
                styles={{
                  body: {
                    padding: isPhone ? '4px 8px' : '8px 12px',
                  }
                }}
                onClick={() => setFilters({ ...filters, status })}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    type="secondary"
                    style={{ fontSize: isPhone ? '9px' : '11px' }}
                  >
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
      <Card
        style={{
          borderRadius: 'var(--radius)',
        }}
        styles={{
          body: {
            padding: isPhone ? '2px 0' : '4px 0',
          }
        }}
      >
        {/* جستجو و فیلتر */}
        <Row gutter={[8, 8]} style={{ marginBottom: 12, padding: '0 4px' }}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder={isPhone ? '🔍 جستجو...' : '🔍 جستجو بر اساس شماره، موضوع...'}
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size={isPhone ? 'small' : isMobile ? 'middle' : 'large'}
              allowClear
              style={{ borderRadius: 10 }}
            />
          </Col>
          <Col xs={24} md={12} lg={16}>
            <Space wrap style={{ gap: '4px' }}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                type={showFilterDrawer ? 'primary' : 'default'}
                size={isPhone ? 'small' : isMobile ? 'middle' : 'middle'}
              >
                {!isPhone && 'فیلترها'}
              </Button>

              {/* عملیات گروهی */}
              {showBulkActions && selectedRowKeys.length > 0 && !isPhone && (
                <Popconfirm
                  title={`حذف ${selectedRowKeys.length} نامه؟`}
                  onConfirm={handleBulkDelete}
                  okText="بله"
                  cancelText="خیر"
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    size={isMobile ? 'small' : 'middle'}
                  >
                    {isMobile ? `(${selectedRowKeys.length})` : `حذف (${selectedRowKeys.length})`}
                  </Button>
                </Popconfirm>
              )}

              <Button
                icon={<ClearOutlined />}
                onClick={clearFilters}
                size={isPhone ? 'small' : isMobile ? 'middle' : 'middle'}
              >
                {!isPhone && 'پاک کردن'}
              </Button>
            </Space>
          </Col>
        </Row>

        {/* فیلترهای پیشرفته */}
        {showFilterDrawer && (
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
              style={{ width: isPhone ? '90px' : isMobile ? '110px' : '150px' }}
              allowClear
              size={isPhone ? 'small' : 'middle'}
            >
              {Object.entries(getStatusInfo()).map(([key, value]) => (
                <Option key={key} value={key}>
                  {value.icon} {value.label}
                </Option>
              ))}
            </Select>
            <Select
              value={filters.letterType}
              onChange={(value) => setFilters({ ...filters, letterType: value })}
              placeholder="نوع"
              style={{ width: isPhone ? '90px' : isMobile ? '110px' : '150px' }}
              allowClear
              size={isPhone ? 'small' : 'middle'}
            >
              {FILTER_OPTIONS.letterType.map((t) => (
                <Option key={t.value} value={t.value}>
                  {t.icon} {t.label}
                </Option>
              ))}
            </Select>
            <Select
              value={filters.priority}
              onChange={(value) => setFilters({ ...filters, priority: value })}
              placeholder="اولویت"
              style={{ width: isPhone ? '90px' : isMobile ? '110px' : '150px' }}
              allowClear
              size={isPhone ? 'small' : 'middle'}
            >
              {FILTER_OPTIONS.priority.map((p) => (
                <Option key={p.value} value={p.value}>
                  {p.label}
                </Option>
              ))}
            </Select>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates || [] })}
              placeholder={['از تاریخ', 'تا تاریخ']}
              size={isPhone ? 'small' : 'middle'}
              style={{ width: isPhone ? '180px' : isMobile ? '200px' : '220px' }}
              format="YYYY/MM/DD"
            />
            {(filters.status || filters.letterType || filters.priority || filters.dateRange.length > 0) && (
              <Button
                size="small"
                onClick={() =>
                  setFilters({
                    status: '',
                    letterType: '',
                    priority: '',
                    classification: '',
                    secretariat: '',
                    dateRange: [],
                  })
                }
                type="text"
                style={{ color: COLORS.danger, fontSize: isPhone ? '10px' : '12px' }}
              >
                ✖
              </Button>
            )}
          </div>
        )}

        {/* جدول */}
        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
          rowSelection={rowSelection}
          rowClassName={(record) => `table-row-${record.status}`}
          className="custom-table"
          pagination={{
            ...pagination,
            showSizeChanger: !isPhone,
            showQuickJumper: !isPhone,
            showTotal: (total) => (isPhone ? `${total}` : `تعداد ${total} نامه`),
            pageSizeOptions: ['10', '20', '50', '100'],
            placement: 'bottom',
            style: { marginTop: 12 },
            size: isPhone ? 'small' : 'default',
            itemRender: (current, type, originalElement) => {
              if (type === 'prev') return <Button size={isPhone ? 'small' : 'middle'}>‹</Button>;
              if (type === 'next') return <Button size={isPhone ? 'small' : 'middle'}>›</Button>;
              return originalElement;
            },
          }}
          onChange={handleTableChange}
          scroll={{ x: isPhone ? 400 : isMobile ? 600 : 1200 }}
          style={{ borderRadius: 'var(--radius)' }}
          size={isPhone ? 'small' : 'middle'}
          locale={{
            emptyText: (
              <div style={{ padding: isPhone ? '30px 0' : '60px 0' }}>
                <div style={{ fontSize: isPhone ? '32px' : '64px', marginBottom: '8px' }}>📭</div>
                <Text type="secondary" style={{ fontSize: isPhone ? '13px' : '16px' }}>
                  هیچ نامه‌ای وجود ندارد
                </Text>
                {showActions && (
                  <><br /><Link to="/letters/new">
                    <Button
                      type="primary"
                      style={{ marginTop: isPhone ? '12px' : '20px' }}
                      icon={<PlusOutlined />}
                      size={isPhone ? 'small' : 'large'}
                    >
                      {isPhone ? 'اولین نامه' : 'ایجاد اولین نامه'}
                    </Button>
                  </Link></>
                )}
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
        .hide-mobile {
          display: table-cell !important;
        }
        .table-row-draft {
          background: rgba(140, 140, 140, 0.05);
        }
        .table-row-registered {
          background: rgba(22, 119, 255, 0.05);
        }
        .table-row-in_review {
          background: rgba(250, 173, 20, 0.05);
        }
        .table-row-approved {
          background: rgba(82, 196, 26, 0.05);
        }
        .table-row-rejected {
          background: rgba(255, 77, 79, 0.05);
        }
        .table-row-signed {
          background: rgba(114, 46, 209, 0.05);
        }
        .table-row-archived {
          background: rgba(140, 140, 140, 0.03);
        }
        @media (max-width: 768px) {
          .hide-mobile {
            display: none !important;
          }
          .ant-table {
            font-size: 12px !important;
          }
          .ant-table-thead > tr > th,
          .ant-table-tbody > tr > td {
            padding: 6px 8px !important;
          }
        }
        @media (max-width: 480px) {
          .hide-mobile {
            display: none !important;
          }
          .ant-table {
            font-size: 11px !important;
          }
          .ant-table-thead > tr > th,
          .ant-table-tbody > tr > td {
            padding: 4px 6px !important;
          }
          .ant-pagination-item {
            min-width: 24px !important;
            height: 24px !important;
            line-height: 22px !important;
            font-size: 11px !important;
          }
          .ant-pagination-prev .ant-pagination-item-link,
          .ant-pagination-next .ant-pagination-item-link {
            font-size: 11px !important;
            padding: 0 4px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default LetterList;
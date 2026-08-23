// frontend/src/components/cms/CommentsList.jsx
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
  Avatar,
  Modal,
  Form,
  Rate,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  FilterOutlined,
  ClearOutlined,
  UserOutlined,
  CheckOutlined,
  CloseOutlined,
  InboxOutlined,
  WarningOutlined,
  RestOutlined,
  LikeOutlined,
  DislikeOutlined,
  CommentOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import cmsService from '../../services/cmsService';
import { toPersianDate } from '../../utils/dateHelper';
import { COLORS } from '../../styles/theme';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

function CommentsList() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    entry: '',
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
  const [selectedComment, setSelectedComment] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [replyForm] = Form.useForm();

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
  const fetchData = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        ...(search && { search }),
        ...(filters.status && { status: filters.status }),
      };

      if (filters.dateRange && filters.dateRange.length === 2) {
        params.fromDate = filters.dateRange[0].toISOString();
        params.toDate = filters.dateRange[1].toISOString();
      }

      // دریافت لیست کامنت‌ها
      const res = await cmsService.getPendingComments(pageSize);
      setData(res.data.data || []);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: res.data.data?.length || 0,
      });

      // دریافت آمار
      const statsRes = await cmsService.getCommentStats();
      setStats(statsRes.data.data || {});
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      console.error('❌ خطا در fetchData:', error);
    } finally {
      setLoading(false);
    }
  }, [search, filters, message]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // =============================================
  // عملیات کامنت‌ها
  // =============================================
  const handleApprove = async (id) => {
    try {
      await cmsService.approveComment(id);
      message.success('کامنت با موفقیت تأیید شد');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در تأیید');
    }
  };

  const handleTrash = async (id) => {
    try {
      await cmsService.trashComment(id);
      message.success('کامنت به زباله‌دان منتقل شد');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در انتقال به زباله‌دان');
    }
  };

  const handleMarkAsSpam = async (id) => {
    try {
      await cmsService.markAsSpam(id);
      message.success('کامنت به عنوان اسپم علامت‌گذاری شد');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در علامت‌گذاری اسپم');
    }
  };

  const handleRestore = async (id) => {
    try {
      await cmsService.restoreComment(id);
      message.success('کامنت با موفقیت بازیابی شد');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در بازیابی');
    }
  };

  const handleDelete = async (id) => {
    try {
      await cmsService.deleteComment(id);
      message.success('کامنت با موفقیت حذف شد');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در حذف');
    }
  };

  const handleViewDetail = (record) => {
    setSelectedComment(record);
    setDetailModalVisible(true);
  };

  const handleReply = (record) => {
    setSelectedComment(record);
    replyForm.resetFields();
    setReplyModalVisible(true);
  };

  const handleReplySubmit = async () => {
    try {
      const values = await replyForm.validateFields();
      await cmsService.createComment({
        entryId: selectedComment.entry._id,
        content: values.content,
        parentId: selectedComment._id,
        authorName: 'مدیر سیستم',
        authorEmail: 'admin@system.com',
      });
      message.success('پاسخ با موفقیت ثبت شد');
      setReplyModalVisible(false);
      replyForm.resetFields();
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ثبت پاسخ');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedRowKeys.length === 0) {
      message.warning('لطفاً حداقل یک کامنت انتخاب کنید');
      return;
    }

    try {
      const promises = selectedRowKeys.map(id => {
        switch (action) {
          case 'approve': return cmsService.approveComment(id);
          case 'trash': return cmsService.trashComment(id);
          case 'spam': return cmsService.markAsSpam(id);
          case 'delete': return cmsService.deleteComment(id);
          default: return null;
        }
      });

      await Promise.all(promises);
      message.success(`${selectedRowKeys.length} کامنت با موفقیت ${action === 'approve' ? 'تأیید' : action === 'trash' ? 'به زباله‌دان منتقل' : action === 'spam' ? 'اسپم' : 'حذف'} شد`);
      setSelectedRowKeys([]);
      fetchData();
    } catch (error) {
      message.error('خطا در عملیات گروهی');
    }
  };

  const clearFilters = () => {
    setFilters({ status: '', entry: '', dateRange: [] });
    setSearch('');
  };

  // =============================================
  // ستون‌های جدول
  // =============================================
  const getStatusInfo = (status) => {
    const map = {
      pending: { color: 'warning', label: 'در انتظار', icon: <ClockCircleOutlined /> },
      approved: { color: 'success', label: 'تأیید شده', icon: <CheckOutlined /> },
      spam: { color: 'red', label: 'اسپم', icon: <WarningOutlined /> },
      trash: { color: 'default', label: 'زباله‌دان', icon: <DeleteOutlined /> },
    };
    return map[status] || map.pending;
  };

  const columns = [
    {
      title: 'کامنت',
      dataIndex: 'content',
      key: 'content',
      width: isPhone ? 150 : 300,
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <Avatar
            icon={<UserOutlined />}
            src={record.user?.avatar}
            style={{ background: COLORS.primary, flexShrink: 0 }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: '500', fontSize: isPhone ? '12px' : '14px' }}>
              {record.author?.name || record.user?.fullName || 'ناشناس'}
            </div>
            <div
              style={{
                fontSize: isPhone ? '12px' : '13px',
                color: 'var(--text-secondary)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                maxHeight: '40px',
              }}
            >
              {text}
            </div>
            {record.entry && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 4 }}>
                <FileTextOutlined /> {record.entry?.data?.title || record.entry?.metaData?.title || 'بدون عنوان'}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      width: isPhone ? 80 : 120,
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
      filters: [
        { text: 'در انتظار', value: 'pending' },
        { text: 'تأیید شده', value: 'approved' },
        { text: 'اسپم', value: 'spam' },
        { text: 'زباله‌دان', value: 'trash' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'رأی',
      dataIndex: 'votes',
      key: 'votes',
      width: isPhone ? 60 : 100,
      render: (votes) => (
        <Space size={4}>
          <Badge
            count={votes?.up || 0}
            style={{ background: COLORS.success }}
          />
          <Badge
            count={votes?.down || 0}
            style={{ background: COLORS.danger }}
          />
        </Space>
      ),
    },
    {
      title: 'تاریخ',
      dataIndex: 'createdAt',
      key: 'createdAt',
      className: isPhone ? 'hide-mobile' : '',
      width: isPhone ? 80 : 130,
      render: (date) => (
        <span style={{ fontSize: isPhone ? '10px' : '13px' }}>
          {toPersianDate(date)}
        </span>
      ),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'عملیات',
      key: 'action',
      fixed: 'right',
      width: isPhone ? 120 : isMobile ? 180 : 280,
      render: (_, record) => {
        const status = record.status;

        return (
          <Space size={isPhone ? 2 : 4} wrap>
            <Tooltip title="مشاهده" placement="top">
              <Button
                type="text"
                icon={<EyeOutlined />}
                size={isPhone ? 'small' : 'middle'}
                style={{ color: COLORS.primary }}
                onClick={() => handleViewDetail(record)}
                className="action-btn"
              />
            </Tooltip>

            <Tooltip title="پاسخ" placement="top">
              <Button
                type="text"
                icon={<CommentOutlined />}
                size={isPhone ? 'small' : 'middle'}
                style={{ color: COLORS.cyan }}
                onClick={() => handleReply(record)}
                className="action-btn"
              />
            </Tooltip>

            {status === 'pending' && (
              <Tooltip title="تأیید" placement="top">
                <Button
                  type="text"
                  icon={<CheckOutlined />}
                  size={isPhone ? 'small' : 'middle'}
                  style={{ color: COLORS.success }}
                  onClick={() => handleApprove(record._id)}
                  className="action-btn"
                />
              </Tooltip>
            )}

            {status === 'pending' && (
              <Tooltip title="اسپم" placement="top">
                <Button
                  type="text"
                  icon={<WarningOutlined />}
                  size={isPhone ? 'small' : 'middle'}
                  style={{ color: COLORS.orange }}
                  onClick={() => handleMarkAsSpam(record._id)}
                  className="action-btn"
                />
              </Tooltip>
            )}

            {status !== 'trash' && status !== 'deleted' && (
              <Tooltip title="زباله‌دان" placement="top">
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  size={isPhone ? 'small' : 'middle'}
                  style={{ color: COLORS.gray[500] }}
                  onClick={() => handleTrash(record._id)}
                  className="action-btn"
                />
              </Tooltip>
            )}

            {status === 'trash' && (
              <Tooltip title="بازیابی" placement="top">
                <Button
                  type="text"
                  icon={<RestOutlined />}
                  size={isPhone ? 'small' : 'middle'}
                  style={{ color: COLORS.primary }}
                  onClick={() => handleRestore(record._id)}
                  className="action-btn"
                />
              </Tooltip>
            )}

            {(status === 'trash' || status === 'spam') && (
              <Tooltip title="حذف دائمی" placement="top">
                <Popconfirm
                  title="آیا از حذف دائمی این کامنت اطمینان دارید؟"
                  onConfirm={() => handleDelete(record._id)}
                  okText="بله"
                  cancelText="خیر"
                  placement="left"
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
            )}
          </Space>
        );
      },
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys) => setSelectedRowKeys(selectedRowKeys),
    selections: !isPhone
      ? [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE]
      : undefined,
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
            💬 مدیریت کامنت‌ها
            <Badge
              count={stats.pending || 0}
              style={{
                background: COLORS.warning,
                marginRight: 8,
                fontSize: isPhone ? 10 : 12,
              }}
              title="کامنت‌های در انتظار تایید"
            />
            <Badge
              count={data.length}
              style={{
                background: COLORS.primary,
                marginRight: 4,
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

          {selectedRowKeys.length > 0 && !isPhone && (
            <>
              <Button
                icon={<CheckOutlined />}
                onClick={() => handleBulkAction('approve')}
                style={{ color: COLORS.success }}
              >
                تأیید ({selectedRowKeys.length})
              </Button>
              <Button
                icon={<WarningOutlined />}
                onClick={() => handleBulkAction('spam')}
                style={{ color: COLORS.orange }}
              >
                اسپم ({selectedRowKeys.length})
              </Button>
              <Button
                icon={<DeleteOutlined />}
                onClick={() => handleBulkAction('trash')}
                style={{ color: COLORS.gray[500] }}
              >
                زباله‌دان ({selectedRowKeys.length})
              </Button>
              <Popconfirm
                title={`حذف ${selectedRowKeys.length} کامنت؟`}
                onConfirm={() => handleBulkAction('delete')}
                okText="بله"
                cancelText="خیر"
              >
                <Button
                  danger
                  icon={<CloseOutlined />}
                >
                  حذف ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      </div>

      {/* آمار وضعیت‌ها */}
      <Row gutter={[isPhone ? 4 : 8, isPhone ? 4 : 8]} style={{ marginBottom: 12 }}>
        <Col xs={12} sm={6}>
          <Card
            size="small"
            style={{ borderRight: `3px solid ${COLORS.warning}` }}
            styles={{ body: { padding: isPhone ? '4px 8px' : '8px 12px' } }}
            onClick={() => setFilters({ ...filters, status: 'pending' })}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary" style={{ fontSize: isPhone ? '9px' : '11px' }}>⏳ در انتظار</Text>
              <Badge count={stats.pending || 0} style={{ background: COLORS.warning }} />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            size="small"
            style={{ borderRight: `3px solid ${COLORS.success}` }}
            styles={{ body: { padding: isPhone ? '4px 8px' : '8px 12px' } }}
            onClick={() => setFilters({ ...filters, status: 'approved' })}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary" style={{ fontSize: isPhone ? '9px' : '11px' }}>✅ تأیید شده</Text>
              <Badge count={stats.approved || 0} style={{ background: COLORS.success }} />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            size="small"
            style={{ borderRight: `3px solid ${COLORS.danger}` }}
            styles={{ body: { padding: isPhone ? '4px 8px' : '8px 12px' } }}
            onClick={() => setFilters({ ...filters, status: 'spam' })}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary" style={{ fontSize: isPhone ? '9px' : '11px' }}>🛑 اسپم</Text>
              <Badge count={stats.spam || 0} style={{ background: COLORS.danger }} />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            size="small"
            style={{ borderRight: `3px solid ${COLORS.gray[500]}` }}
            styles={{ body: { padding: isPhone ? '4px 8px' : '8px 12px' } }}
            onClick={() => setFilters({ ...filters, status: 'trash' })}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary" style={{ fontSize: isPhone ? '9px' : '11px' }}>🗑️ زباله‌دان</Text>
              <Badge count={stats.trash || 0} style={{ background: COLORS.gray[500] }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* کارت اصلی */}
      <Card style={{ borderRadius: 'var(--radius)' }}>
        {/* جستجو و فیلتر */}
        <Row gutter={[8, 8]} style={{ marginBottom: 12, padding: '0 4px' }}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder={isPhone ? '🔍 جستجو...' : '🔍 جستجو در کامنت‌ها...'}
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
                onClick={() => setShowFilters(!showFilters)}
                type={showFilters ? 'primary' : 'default'}
                size={isPhone ? 'small' : isMobile ? 'middle' : 'middle'}
              >
                {!isPhone && 'فیلترها'}
              </Button>

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
              style={{ width: isPhone ? '90px' : isMobile ? '110px' : '150px' }}
              allowClear
              size={isPhone ? 'small' : 'middle'}
            >
              <Option value="pending">در انتظار</Option>
              <Option value="approved">تأیید شده</Option>
              <Option value="spam">اسپم</Option>
              <Option value="trash">زباله‌دان</Option>
            </Select>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates || [] })}
              placeholder={['از تاریخ', 'تا تاریخ']}
              size={isPhone ? 'small' : 'middle'}
              style={{ width: isPhone ? '180px' : isMobile ? '200px' : '220px' }}
              format="YYYY/MM/DD"
            />
            {(filters.status || filters.dateRange.length > 0) && (
              <Button
                size="small"
                onClick={() =>
                  setFilters({
                    status: '',
                    entry: '',
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
          className="custom-table"
          pagination={{
            ...pagination,
            showSizeChanger: !isPhone,
            showQuickJumper: !isPhone,
            showTotal: (total) => (isPhone ? `${total}` : `تعداد ${total} کامنت`),
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
          onChange={(pagination) => fetchData(pagination.current, pagination.pageSize)}
          scroll={{ x: isPhone ? 400 : isMobile ? 600 : 1200 }}
          style={{ borderRadius: 'var(--radius)' }}
          size={isPhone ? 'small' : 'middle'}
          locale={{
            emptyText: (
              <div style={{ padding: isPhone ? '30px 0' : '60px 0' }}>
                <div style={{ fontSize: isPhone ? '32px' : '64px', marginBottom: '8px' }}>💬</div>
                <Text type="secondary" style={{ fontSize: isPhone ? '13px' : '16px' }}>
                  هیچ کامنتی وجود ندارد
                </Text>
              </div>
            ),
          }}
        />
      </Card>

      {/* ============================================= */}
      {/* ✅ مودال مشاهده جزئیات کامنت */}
      {/* ============================================= */}
      <Modal
        title="📋 جزئیات کامنت"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            بستن
          </Button>,
        ]}
        width={isPhone ? '95%' : 600}
        className={isMobile ? 'ant-modal-fullscreen-mobile' : ''}
      >
        {selectedComment && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 16 }}>
              <Avatar icon={<UserOutlined />} size={48} style={{ background: COLORS.primary }} />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 16 }}>
                  {selectedComment.author?.name || selectedComment.user?.fullName || 'ناشناس'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {selectedComment.author?.email || selectedComment.user?.email || 'ایمیل نامشخص'}
                </div>
              </div>
              <Tag color={getStatusInfo(selectedComment.status).color} style={{ marginRight: 'auto' }}>
                {getStatusInfo(selectedComment.status).label}
              </Tag>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <Text strong>متن کامنت:</Text>
              <div style={{ marginTop: 8, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                {selectedComment.content}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : '1fr 1fr', gap: 8 }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>نوشته مرتبط:</Text>
                <div>
                  <Link to={`/cms/posts/edit/${selectedComment.entry?._id}`}>
                    {selectedComment.entry?.data?.title || selectedComment.entry?.metaData?.title || 'بدون عنوان'}
                  </Link>
                </div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>تاریخ:</Text>
                <div>{toPersianDate(selectedComment.createdAt)}</div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>آی‌پی:</Text>
                <div>{selectedComment.author?.ip || '—'}</div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>مرورگر:</Text>
                <div>{selectedComment.author?.userAgent || '—'}</div>
              </div>
            </div>

            {selectedComment.votes && (selectedComment.votes.up > 0 || selectedComment.votes.down > 0) && (
              <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <Text strong>رأی‌ها:</Text>
                <Space size="large" style={{ marginLeft: 16 }}>
                  <span><LikeOutlined style={{ color: COLORS.success }} /> {selectedComment.votes.up}</span>
                  <span><DislikeOutlined style={{ color: COLORS.danger }} /> {selectedComment.votes.down}</span>
                </Space>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ============================================= */}
      {/* ✅ مودال پاسخ به کامنت */}
      {/* ============================================= */}
      <Modal
        title="💬 پاسخ به کامنت"
        open={replyModalVisible}
        onOk={handleReplySubmit}
        onCancel={() => {
          setReplyModalVisible(false);
          replyForm.resetFields();
        }}
        okText="ارسال پاسخ"
        cancelText="انصراف"
        width={isPhone ? '95%' : 500}
        className={isMobile ? 'ant-modal-fullscreen-mobile' : ''}
      >
        <Form form={replyForm} layout="vertical">
          <Form.Item
            name="content"
            label="متن پاسخ"
            rules={[{ required: true, message: 'متن پاسخ را وارد کنید' }]}
          >
            <TextArea rows={4} placeholder="متن پاسخ خود را وارد کنید..." />
          </Form.Item>

          <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              پاسخ به: <strong>{selectedComment?.author?.name || selectedComment?.user?.fullName || 'ناشناس'}</strong>
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              متن کامنت: {selectedComment?.content?.substring(0, 100)}...
            </Text>
          </div>
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
        .hide-mobile {
          display: table-cell !important;
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

export default CommentsList;
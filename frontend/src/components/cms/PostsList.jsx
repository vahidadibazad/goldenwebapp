// frontend/src/components/cms/PostsList.jsx
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
  FileTextOutlined,
  CheckOutlined,
  CloseOutlined,
  InboxOutlined,
  SendOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import cmsService from '../../services/cmsService';
import { toPersianDate } from '../../utils/dateHelper';
import { COLORS } from '../../styles/theme';
import moment from 'moment-jalaali';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

function PostsList() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    locale: '',
    dateRange: [],
    category: '',
    tag: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

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
  const fetchCategoriesAndTags = async () => {
    try {
      const [catRes, tagRes] = await Promise.all([
        cmsService.getCategories(),
        cmsService.getTags({ limit: 100 }),
      ]);
      setCategories(catRes.data.data || []);
      setTags(tagRes.data.data || []);
    } catch (error) {
      console.error('❌ خطا در دریافت دسته‌بندی‌ها و برچسب‌ها:', error);
    }
  };

  const fetchData = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      // دریافت ContentType برای Posts
      const typesRes = await cmsService.getContentTypes();
      const postType = typesRes.data.data.find(t => t.apiName === 'posts');

      if (!postType) {
        setData([]);
        setLoading(false);
        return;
      }

      const params = {
        contentType: postType._id,
        page,
        limit: pageSize,
        ...(search && { search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.locale && { locale: filters.locale }),
        ...(filters.category && { category: filters.category }),
        ...(filters.tag && { tag: filters.tag }),
      };

      if (filters.dateRange && filters.dateRange.length === 2) {
        params.fromDate = filters.dateRange[0].toISOString();
        params.toDate = filters.dateRange[1].toISOString();
      }

      const res = await cmsService.getEntries(params);
      setData(res.data.data || []);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: res.data.pagination?.total || 0,
      });
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      console.error('❌ خطا در fetchData:', error);
    } finally {
      setLoading(false);
    }
  }, [search, filters, message]);

  useEffect(() => {
    fetchData();
    fetchCategoriesAndTags();
  }, [fetchData]);

  // =============================================
  // عملیات
  // =============================================
  const handleDelete = async (id) => {
    try {
      await cmsService.deleteEntry(id);
      message.success('نوشته با موفقیت حذف شد');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در حذف');
    }
  };

  const handlePublish = async (id) => {
    try {
      await cmsService.publishEntry(id);
      message.success('نوشته با موفقیت منتشر شد');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در انتشار');
    }
  };

  const handleArchive = async (id) => {
    try {
      await cmsService.archiveEntry(id);
      message.success('نوشته با موفقیت بایگانی شد');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در بایگانی');
    }
  };

  const clearFilters = () => {
    setFilters({ status: '', locale: '', dateRange: [], category: '', tag: '' });
    setSearch('');
  };

  // =============================================
  // ستون‌های جدول
  // =============================================
  const getStatusInfo = (status) => {
    const map = {
      draft: { color: 'default', label: 'پیش‌نویس', icon: <EditOutlined /> },
      published: { color: 'success', label: 'منتشر شده', icon: <CheckOutlined /> },
      archived: { color: 'default', label: 'بایگانی شده', icon: <InboxOutlined /> },
    };
    return map[status] || map.draft;
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c._id === categoryId);
    return cat?.name || '—';
  };

  const getTagNames = (tagIds) => {
    if (!tagIds || tagIds.length === 0) return '—';
    const names = tagIds.map(id => {
      const tag = tags.find(t => t._id === id);
      return tag?.name;
    }).filter(Boolean);
    return names.join('، ');
  };

  const columns = [
    {
      title: 'نوشته',
      dataIndex: 'data',
      key: 'title',
      render: (data, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: record.status === 'published' ? COLORS.success : COLORS.gray[400],
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
              {data?.title || 'بدون عنوان'}
            </strong>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              توسط {record.createdBy?.fullName || 'نامشخص'} • {toPersianDate(record.createdAt)}
            </div>
          </div>
        </div>
      ),
      sorter: (a, b) => (a.data?.title || '').localeCompare(b.data?.title || ''),
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
      filters: [
        { text: 'پیش‌نویس', value: 'draft' },
        { text: 'منتشر شده', value: 'published' },
        { text: 'بایگانی شده', value: 'archived' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'دسته‌بندی',
      dataIndex: 'categories',
      key: 'categories',
      width: isPhone ? 80 : 130,
      render: (categories) => {
        if (!categories || categories.length === 0) return '—';
        return (
          <Space wrap size={[4, 4]}>
            {categories.slice(0, 2).map(cat => (
              <Tag key={cat._id || cat} color="blue" style={{ fontSize: isPhone ? '9px' : '12px' }}>
                {getCategoryName(cat._id || cat)}
              </Tag>
            ))}
            {categories.length > 2 && (
              <Tag color="default" style={{ fontSize: isPhone ? '9px' : '12px' }}>
                +{categories.length - 2}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'برچسب‌ها',
      dataIndex: 'tags',
      key: 'tags',
      className: isPhone ? 'hide-mobile' : '',
      width: isPhone ? 80 : 130,
      render: (tags) => {
        if (!tags || tags.length === 0) return '—';
        const tagNames = tags.map(id => {
          const tag = tags.find(t => t._id === id);
          return tag?.name;
        }).filter(Boolean);
        return tagNames.join('، ');
      },
    },
    {
      title: 'بازدید',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: isPhone ? 60 : 80,
      render: (count) => <Badge count={count || 0} style={{ background: COLORS.primary }} />,
    },
    {
      title: 'تاریخ انتشار',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      className: isPhone ? 'hide-mobile' : '',
      width: isPhone ? 80 : 130,
      render: (date) => (
        <span style={{ fontSize: isPhone ? '10px' : '13px' }}>
          {date ? toPersianDate(date) : '—'}
        </span>
      ),
      sorter: (a, b) => new Date(a.publishedAt || a.createdAt) - new Date(b.publishedAt || b.createdAt),
    },
    {
      title: 'عملیات',
      key: 'action',
      fixed: 'right',
      width: isPhone ? 100 : isMobile ? 140 : 220,
      render: (_, record) => {
        const status = record.status;

        return (
          <Space size={isPhone ? 2 : 4}>
            <Tooltip title="مشاهده" placement="top">
              <Link to={`/posts/${record.slug}`} target="_blank">
                <Button
                  type="text"
                  icon={<EyeOutlined />}
                  size={isPhone ? 'small' : 'middle'}
                  style={{ color: COLORS.primary }}
                  className="action-btn"
                />
              </Link>
            </Tooltip>

            <Tooltip title="ویرایش" placement="top">
              <Link to={`/cms/posts/edit/${record._id}`}>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  size={isPhone ? 'small' : 'middle'}
                  style={{ color: COLORS.warning }}
                  className="action-btn"
                />
              </Link>
            </Tooltip>

            {status === 'draft' && (
              <Tooltip title="انتشار" placement="top">
                <Popconfirm
                  title="آیا از انتشار این نوشته اطمینان دارید؟"
                  onConfirm={() => handlePublish(record._id)}
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

            {status === 'published' && (
              <Tooltip title="بایگانی" placement="top">
                <Popconfirm
                  title="آیا از بایگانی این نوشته اطمینان دارید؟"
                  onConfirm={() => handleArchive(record._id)}
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

            {(status === 'draft' || status === 'archived') && (
              <Tooltip title="حذف" placement="top">
                <Popconfirm
                  title="آیا از حذف این نوشته اطمینان دارید؟"
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
            📝 مدیریت نوشته‌ها
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
          <Link to="/cms/posts/new">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size={isPhone ? 'small' : isMobile ? 'middle' : 'large'}
            >
              {isPhone ? 'جدید' : isMobile ? 'افزودن' : 'نوشته جدید'}
            </Button>
          </Link>
        </Space>
      </div>

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
              placeholder={isPhone ? '🔍 جستجو...' : '🔍 جستجو بر اساس عنوان...'}
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
              <Option value="draft">پیش‌نویس</Option>
              <Option value="published">منتشر شده</Option>
              <Option value="archived">بایگانی</Option>
            </Select>
            <Select
              value={filters.locale}
              onChange={(value) => setFilters({ ...filters, locale: value })}
              placeholder="زبان"
              style={{ width: isPhone ? '90px' : isMobile ? '110px' : '150px' }}
              allowClear
              size={isPhone ? 'small' : 'middle'}
            >
              <Option value="fa">🇮🇷 فارسی</Option>
              <Option value="en">🇬🇧 انگلیسی</Option>
              <Option value="ar">🇸🇦 عربی</Option>
            </Select>
            <Select
              value={filters.category}
              onChange={(value) => setFilters({ ...filters, category: value })}
              placeholder="دسته‌بندی"
              style={{ width: isPhone ? '90px' : isMobile ? '110px' : '150px' }}
              allowClear
              size={isPhone ? 'small' : 'middle'}
            >
              {categories.map(cat => (
                <Option key={cat._id} value={cat._id}>
                  {cat.icon} {cat.name}
                </Option>
              ))}
            </Select>
            <Select
              value={filters.tag}
              onChange={(value) => setFilters({ ...filters, tag: value })}
              placeholder="برچسب"
              style={{ width: isPhone ? '90px' : isMobile ? '110px' : '150px' }}
              allowClear
              size={isPhone ? 'small' : 'middle'}
            >
              {tags.map(tag => (
                <Option key={tag._id} value={tag._id}>
                  {tag.icon} {tag.name}
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
            {(filters.status || filters.locale || filters.category || filters.tag || filters.dateRange.length > 0) && (
              <Button
                size="small"
                onClick={() =>
                  setFilters({
                    status: '',
                    locale: '',
                    dateRange: [],
                    category: '',
                    tag: '',
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
            showTotal: (total) => (isPhone ? `${total}` : `تعداد ${total} نوشته`),
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
                <div style={{ fontSize: isPhone ? '32px' : '64px', marginBottom: '8px' }}>📝</div>
                <Text type="secondary" style={{ fontSize: isPhone ? '13px' : '16px' }}>
                  هیچ نوشته‌ای وجود ندارد
                </Text>
                <br />
                <Link to="/cms/posts/new">
                  <Button
                    type="primary"
                    style={{ marginTop: isPhone ? '12px' : '20px' }}
                    icon={<PlusOutlined />}
                    size={isPhone ? 'small' : 'large'}
                  >
                    {isPhone ? 'اولین نوشته' : 'ایجاد اولین نوشته'}
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

export default PostsList;
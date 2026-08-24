// frontend/src/pages/crm/AccountsList.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  TeamOutlined,
  BankOutlined,
  UserOutlined,
} from '@ant-design/icons';
import crmService from "../../services/crmService";
import { toPersianDate } from '../../utils/dateHelper';
import { COLORS } from '../../styles/theme';

const { Title, Text } = Typography;
const { Option } = Select;

function AccountsList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    tier: '',
    type: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    fetchData();
  }, [search, filters]);

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        search: search || undefined,
        ...filters,
      };
      const res = await crmService.getAccounts(params);
      setData(res.data.data || []);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: res.data.pagination?.total || 0,
      });
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await crmService.deleteAccount(id);
      message.success('شرکت با موفقیت حذف شد');
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('خطا در حذف');
    }
  };

  const clearFilters = () => {
    setFilters({ tier: '', type: '' });
    setSearch('');
  };

  const getTierTag = (tier) => {
    const map = {
      platinum: { color: 'gold', label: 'پلاتینیوم' },
      gold: { color: 'gold', label: 'طلایی' },
      silver: { color: 'silver', label: 'نقره‌ای' },
      bronze: { color: '#cd7f32', label: 'برنزی' },
      normal: { color: 'default', label: 'عادی' },
    };
    return map[tier] || { color: 'default', label: tier };
  };

  const getTypeTag = (type) => {
    const map = {
      customer: { color: 'blue', label: 'مشتری' },
      partner: { color: 'green', label: 'شریک' },
      competitor: { color: 'red', label: 'رقبا' },
      vendor: { color: 'orange', label: 'تامین‌کننده' },
      other: { color: 'default', label: 'سایر' },
    };
    return map[type] || { color: 'default', label: type };
  };

  const columns = [
    {
      title: 'شرکت',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Avatar icon={<BankOutlined />} style={{ background: COLORS.primary }} />
          <div>
            <strong>{text}</strong>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {record.industry || 'صنعت نامشخص'}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'سطح',
      dataIndex: 'tier',
      key: 'tier',
      render: (tier) => {
        const info = getTierTag(tier);
        return <Tag color={info.color}>{info.label}</Tag>;
      },
      filters: [
        { text: 'پلاتینیوم', value: 'platinum' },
        { text: 'طلایی', value: 'gold' },
        { text: 'نقره‌ای', value: 'silver' },
        { text: 'برنزی', value: 'bronze' },
        { text: 'عادی', value: 'normal' },
      ],
      onFilter: (value, record) => record.tier === value,
    },
    {
      title: 'نوع',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const info = getTypeTag(type);
        return <Tag color={info.color}>{info.label}</Tag>;
      },
      filters: [
        { text: 'مشتری', value: 'customer' },
        { text: 'شریک', value: 'partner' },
        { text: 'رقبا', value: 'competitor' },
        { text: 'تامین‌کننده', value: 'vendor' },
        { text: 'سایر', value: 'other' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'تماس‌ها',
      dataIndex: 'contacts',
      key: 'contacts',
      render: (contacts) => (
        <Badge count={contacts?.length || 0} style={{ background: COLORS.primary }} />
      ),
    },
    {
      title: 'فرصت‌ها',
      dataIndex: 'opportunities',
      key: 'opportunities',
      render: (opportunities) => (
        <Badge count={opportunities?.length || 0} style={{ background: COLORS.warning }} />
      ),
    },
    {
      title: 'مالک',
      dataIndex: 'owner',
      key: 'owner',
      render: (owner) => owner?.fullName || owner?.username || '-',
    },
    {
      title: 'عملیات',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="مشاهده">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/crm/accounts/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="ویرایش">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/crm/accounts/edit/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="حذف">
            <Popconfirm
              title="آیا از حذف این شرکت اطمینان دارید؟"
              onConfirm={() => handleDelete(record._id)}
              okText="بله"
              cancelText="خیر"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys) => setSelectedRowKeys(selectedRowKeys),
  };

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
        <Title level={2} style={{ margin: 0 }}>
          🏢 مدیریت شرکت‌ها
          <Badge
            count={data.length}
            style={{ background: COLORS.primary, marginRight: 8 }}
          />
        </Title>
        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchData(pagination.current, pagination.pageSize)}
            loading={loading}
          >
            بروزرسانی
          </Button>
          <Link to="/crm/accounts/new">
            <Button type="primary" icon={<PlusOutlined />}>
              شرکت جدید
            </Button>
          </Link>
        </Space>
      </div>

      {/* کارت اصلی */}
      <Card style={{ borderRadius: 'var(--radius)' }}>
        {/* جستجو و فیلتر */}
        <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder="جستجو بر اساس نام، صنعت..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={12} lg={16}>
            <Space wrap>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setShowFilters(!showFilters)}
                type={showFilters ? 'primary' : 'default'}
              >
                فیلترها
              </Button>
              <Button icon={<ClearOutlined />} onClick={clearFilters}>
                پاک کردن
              </Button>
            </Space>
          </Col>
        </Row>

        {/* فیلترهای پیشرفته */}
        {showFilters && (
          <div
            style={{
              padding: '12px',
              background: 'var(--bg-secondary)',
              borderRadius: 10,
              marginBottom: 12,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <Text strong>فیلتر:</Text>
            <Select
              value={filters.tier}
              onChange={(value) => setFilters({ ...filters, tier: value })}
              placeholder="سطح"
              style={{ width: 130 }}
              allowClear
            >
              <Option value="platinum">پلاتینیوم</Option>
              <Option value="gold">طلایی</Option>
              <Option value="silver">نقره‌ای</Option>
              <Option value="bronze">برنزی</Option>
              <Option value="normal">عادی</Option>
            </Select>
            <Select
              value={filters.type}
              onChange={(value) => setFilters({ ...filters, type: value })}
              placeholder="نوع"
              style={{ width: 120 }}
              allowClear
            >
              <Option value="customer">مشتری</Option>
              <Option value="partner">شریک</Option>
              <Option value="competitor">رقبا</Option>
              <Option value="vendor">تامین‌کننده</Option>
              <Option value="other">سایر</Option>
            </Select>
          </div>
        )}

        {/* جدول */}
        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `تعداد ${total} شرکت`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={(pagination) => fetchData(pagination.current, pagination.pageSize)}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
}

export default AccountsList;



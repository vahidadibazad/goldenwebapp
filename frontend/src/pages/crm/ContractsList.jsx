// frontend/src/pages/crm/ContractsList.jsx
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
  Dropdown,
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
  MoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import crmService from '../../services/crmService';
import { toPersianDate } from '../../utils/dateHelper';
import { toPersianPrice } from '../../utils/numberHelper';
import { COLORS } from '../../styles/theme';

const { Title, Text } = Typography;
const { Option } = Select;

function ContractsList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    account: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    fetchAccounts();
    fetchData();
  }, [search, filters]);

  const fetchAccounts = async () => {
    try {
      const res = await crmService.getAccounts({ limit: 100 });
      setAccounts(res.data.data || []);
    } catch (error) {
      console.error('خطا در دریافت شرکت‌ها:', error);
    }
  };

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        search: search || undefined,
        ...filters,
      };
      const res = await crmService.getContracts(params);
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
      await crmService.deleteContract(id);
      message.success('قرارداد با موفقیت حذف شد');
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('خطا در حذف');
    }
  };

  const handleActivate = async (id) => {
    try {
      await crmService.activateContract(id);
      message.success('قرارداد با موفقیت فعال شد');
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('خطا در فعال‌سازی');
    }
  };

  const clearFilters = () => {
    setFilters({ status: '', account: '' });
    setSearch('');
  };

  const getStatusTag = (status) => {
    const map = {
      draft: { color: 'default', label: 'پیش‌نویس', icon: <FileTextOutlined /> },
      active: { color: 'success', label: 'فعال', icon: <CheckCircleOutlined /> },
      expired: { color: 'error', label: 'منقضی', icon: <ExclamationCircleOutlined /> },
      cancelled: { color: 'default', label: 'لغو شده', icon: <CloseOutlined /> },
      completed: { color: 'green', label: 'تکمیل شده', icon: <CheckOutlined /> },
    };
    return map[status] || { color: 'default', label: status };
  };

  const columns = [
    {
      title: 'قرارداد',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <strong>{text}</strong>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {record.contractNumber || 'بدون شماره'}
          </div>
        </div>
      ),
    },
    {
      title: 'شرکت',
      dataIndex: ['account', 'name'],
      key: 'account',
      render: (text) => text || '-',
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const info = getStatusTag(status);
        return (
          <Tag color={info.color} icon={info.icon} style={{ borderRadius: 12 }}>
            {info.label}
          </Tag>
        );
      },
      filters: [
        { text: 'پیش‌نویس', value: 'draft' },
        { text: 'فعال', value: 'active' },
        { text: 'منقضی', value: 'expired' },
        { text: 'لغو شده', value: 'cancelled' },
        { text: 'تکمیل شده', value: 'completed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'مبلغ',
      dataIndex: ['value', 'amount'],
      key: 'amount',
      render: (amount) => toPersianPrice(amount || 0),
      sorter: (a, b) => (a.value?.amount || 0) - (b.value?.amount || 0),
    },
    {
      title: 'مدت',
      key: 'duration',
      render: (_, record) => {
        const start = record.startDate ? toPersianDate(record.startDate) : '-';
        const end = record.endDate ? toPersianDate(record.endDate) : '-';
        return `${start} → ${end}`;
      },
    },
    {
      title: 'تمدید',
      dataIndex: 'autoRenew',
      key: 'autoRenew',
      render: (autoRenew) => (
        <Tag color={autoRenew ? 'green' : 'default'}>
          {autoRenew ? '✅ خودکار' : 'دستی'}
        </Tag>
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
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="مشاهده">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/crm/contracts/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="ویرایش">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/crm/contracts/edit/${record._id}`)}
            />
          </Tooltip>
          {record.status === 'draft' && (
            <Tooltip title="فعال‌سازی">
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleActivate(record._id)}
                size="small"
              >
                فعال
              </Button>
            </Tooltip>
          )}
          {(record.status === 'draft' || record.status === 'expired' || record.status === 'cancelled') && (
            <Tooltip title="حذف">
              <Popconfirm
                title="آیا از حذف این قرارداد اطمینان دارید؟"
                onConfirm={() => handleDelete(record._id)}
                okText="بله"
                cancelText="خیر"
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
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
          📄 مدیریت قراردادها
          <Badge
            count={data.length}
            style={{ background: COLORS.purple, marginRight: 8 }}
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
          <Link to="/crm/contracts/new">
            <Button type="primary" icon={<PlusOutlined />}>
              قرارداد جدید
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
              placeholder="جستجو بر اساس نام، شماره..."
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
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              placeholder="وضعیت"
              style={{ width: 140 }}
              allowClear
            >
              <Option value="draft">پیش‌نویس</Option>
              <Option value="active">فعال</Option>
              <Option value="expired">منقضی</Option>
              <Option value="cancelled">لغو شده</Option>
              <Option value="completed">تکمیل شده</Option>
            </Select>
            <Select
              value={filters.account}
              onChange={(value) => setFilters({ ...filters, account: value })}
              placeholder="شرکت"
              style={{ width: 150 }}
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {accounts.map((a) => (
                <Option key={a._id} value={a._id}>{a.name}</Option>
              ))}
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
            showTotal: (total) => `تعداد ${total} قرارداد`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={(pagination) => fetchData(pagination.current, pagination.pageSize)}
          scroll={{ x: 1400 }}
        />
      </Card>
    </div>
  );
}

export default ContractsList;



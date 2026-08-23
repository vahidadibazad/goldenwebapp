// frontend/src/pages/crm/OpportunitiesList.jsx
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
  Progress,
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
  DollarOutlined,
  CheckOutlined,
  CloseOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import crmService from '../../services/crmService';
import { toPersianDate } from '../../utils/dateHelper';
import { toPersianPrice } from '../../utils/numberHelper';
import { COLORS } from '../../styles/theme';

const { Title, Text } = Typography;
const { Option } = Select;

function OpportunitiesList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    stage: '',
    owner: '',
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
      const res = await crmService.getOpportunities(params);
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
      await crmService.deleteOpportunity(id);
      message.success('فرصت با موفقیت حذف شد');
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('خطا در حذف');
    }
  };

  const handleChangeStage = async (id, stage) => {
    try {
      await crmService.changeOpportunityStage(id, stage);
      message.success('مرحله فرصت با موفقیت تغییر کرد');
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('خطا در تغییر مرحله');
    }
  };

  const handleCloseWon = async (id) => {
    try {
      await crmService.closeWon(id);
      message.success('فرصت با موفقیت بسته شد (برنده)');
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('خطا در بستن فرصت');
    }
  };

  const handleCloseLost = async (id) => {
    try {
      await crmService.closeLost(id);
      message.success('فرصت با موفقیت بسته شد (بازنده)');
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('خطا در بستن فرصت');
    }
  };

  const clearFilters = () => {
    setFilters({ stage: '', owner: '', account: '' });
    setSearch('');
  };

  const getStageTag = (stage) => {
    const map = {
      discovery: { color: 'blue', label: 'کشف' },
      qualification: { color: 'orange', label: 'صلاحیت‌سنجی' },
      proposal: { color: 'purple', label: 'پیشنهاد' },
      negotiation: { color: 'gold', label: 'مذاکره' },
      closed_won: { color: 'green', label: '✅ برنده' },
      closed_lost: { color: 'red', label: '❌ بازنده' },
    };
    return map[stage] || { color: 'default', label: stage };
  };

  const getProbabilityColor = (probability) => {
    if (probability >= 70) return 'success';
    if (probability >= 40) return 'warning';
    return 'default';
  };

  const columns = [
    {
      title: 'فرصت',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <strong>{text}</strong>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {record.account?.name || 'بدون شرکت'}
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
      title: 'مرحله',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage) => {
        const info = getStageTag(stage);
        return <Tag color={info.color}>{info.label}</Tag>;
      },
      filters: [
        { text: 'کشف', value: 'discovery' },
        { text: 'صلاحیت‌سنجی', value: 'qualification' },
        { text: 'پیشنهاد', value: 'proposal' },
        { text: 'مذاکره', value: 'negotiation' },
        { text: 'برنده', value: 'closed_won' },
        { text: 'بازنده', value: 'closed_lost' },
      ],
      onFilter: (value, record) => record.stage === value,
    },
    {
      title: 'احتمال',
      dataIndex: 'probability',
      key: 'probability',
      render: (probability) => (
        <Progress
          percent={probability || 0}
          size="small"
          status={getProbabilityColor(probability)}
          format={(percent) => `${percent}%`}
        />
      ),
    },
    {
      title: 'مبلغ',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => toPersianPrice(amount || 0),
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
    },
    {
      title: 'تاریخ بسته شدن',
      dataIndex: 'closeDate',
      key: 'closeDate',
      render: (date) => date ? toPersianDate(date) : '-',
      sorter: (a, b) => new Date(a.closeDate) - new Date(b.closeDate),
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
      render: (_, record) => {
        const isClosed = record.stage === 'closed_won' || record.stage === 'closed_lost';
        
        return (
          <Space size="small">
            <Tooltip title="مشاهده">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/crm/opportunities/${record._id}`)}
              />
            </Tooltip>
            <Tooltip title="ویرایش">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => navigate(`/crm/opportunities/edit/${record._id}`)}
              />
            </Tooltip>
            {!isClosed && (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'stage',
                      label: 'تغییر مرحله',
                      children: [
                        { key: 'discovery', label: 'کشف', onClick: () => handleChangeStage(record._id, 'discovery') },
                        { key: 'qualification', label: 'صلاحیت‌سنجی', onClick: () => handleChangeStage(record._id, 'qualification') },
                        { key: 'proposal', label: 'پیشنهاد', onClick: () => handleChangeStage(record._id, 'proposal') },
                        { key: 'negotiation', label: 'مذاکره', onClick: () => handleChangeStage(record._id, 'negotiation') },
                      ],
                    },
                    {
                      key: 'close',
                      label: 'بستن فرصت',
                      children: [
                        { key: 'won', label: 'برنده ✅', onClick: () => handleCloseWon(record._id) },
                        { key: 'lost', label: 'بازنده ❌', onClick: () => handleCloseLost(record._id) },
                      ],
                    },
                    {
                      key: 'delete',
                      label: 'حذف',
                      icon: <DeleteOutlined />,
                      danger: true,
                      onClick: () => handleDelete(record._id),
                    },
                  ],
                }}
                trigger={['click']}
              >
                <Button type="text" icon={<MoreOutlined />} />
              </Dropdown>
            )}
            {isClosed && (
              <Tooltip title="حذف">
                <Popconfirm
                  title="آیا از حذف این فرصت اطمینان دارید؟"
                  onConfirm={() => handleDelete(record._id)}
                  okText="بله"
                  cancelText="خیر"
                >
                  <Button type="text" danger icon={<DeleteOutlined />} />
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
          💰 مدیریت فرصت‌ها
          <Badge
            count={data.length}
            style={{ background: COLORS.warning, marginRight: 8 }}
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
          <Link to="/crm/opportunities/new">
            <Button type="primary" icon={<PlusOutlined />}>
              فرصت جدید
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
              placeholder="جستجو بر اساس نام، شرکت..."
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
              value={filters.stage}
              onChange={(value) => setFilters({ ...filters, stage: value })}
              placeholder="مرحله"
              style={{ width: 140 }}
              allowClear
            >
              <Option value="discovery">کشف</Option>
              <Option value="qualification">صلاحیت‌سنجی</Option>
              <Option value="proposal">پیشنهاد</Option>
              <Option value="negotiation">مذاکره</Option>
              <Option value="closed_won">برنده</Option>
              <Option value="closed_lost">بازنده</Option>
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
            showTotal: (total) => `تعداد ${total} فرصت`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={(pagination) => fetchData(pagination.current, pagination.pageSize)}
          scroll={{ x: 1400 }}
        />
      </Card>
    </div>
  );
}

export default OpportunitiesList;



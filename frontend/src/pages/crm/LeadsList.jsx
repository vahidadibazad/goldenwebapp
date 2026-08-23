// frontend/src/pages/crm/LeadsList.jsx
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
  Dropdown,
  Modal,
  Form,
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
  MailOutlined,
  PhoneOutlined,
  MoreOutlined,
  CheckOutlined,
  CloseOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import crmService from '../../services/crmService';
import { toPersianDate } from '../../utils/dateHelper';
import { COLORS } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

function LeadsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    rating: '',
    source: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignForm] = Form.useForm();
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchData();
  }, [search, filters]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data.data || []);
    } catch (error) {
      console.error('خطا در دریافت کاربران:', error);
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
      const res = await crmService.getLeads(params);
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
      await crmService.deleteLead(id);
      message.success('سرنخ با موفقیت حذف شد');
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('خطا در حذف');
    }
  };

  const handleConvert = async (id) => {
    try {
      // اینجا می‌توان مودال برای وارد کردن اطلاعات شرکت باز کرد
      await crmService.convertLead(id, {
        name: 'شرکت جدید',
        industry: 'فناوری اطلاعات',
      });
      message.success('سرنخ با موفقیت به مشتری تبدیل شد');
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('خطا در تبدیل سرنخ');
    }
  };

  const handleAssign = async (values) => {
    try {
      await crmService.assignLead(selectedLead, values.userId);
      message.success('سرنخ با موفقیت تخصیص داده شد');
      setAssignModalVisible(false);
      assignForm.resetFields();
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('خطا در تخصیص سرنخ');
    }
  };

  const clearFilters = () => {
    setFilters({ status: '', rating: '', source: '' });
    setSearch('');
  };

  const getStatusTag = (status) => {
    const map = {
      new: { color: 'blue', label: 'جدید' },
      contacted: { color: 'orange', label: 'تماس گرفته شده' },
      working: { color: 'purple', label: 'در حال پیگیری' },
      qualified: { color: 'green', label: 'واجد شرایط' },
      converted: { color: 'cyan', label: 'تبدیل شده' },
      lost: { color: 'red', label: 'از دست رفته' },
    };
    return map[status] || { color: 'default', label: status };
  };

  const getRatingTag = (rating) => {
    const map = {
      hot: { color: 'red', label: '🔥 داغ' },
      warm: { color: 'orange', label: '🌤️ گرم' },
      cold: { color: 'blue', label: '❄️ سرد' },
    };
    return map[rating] || { color: 'default', label: rating };
  };

  const getSourceTag = (source) => {
    const map = {
      website: 'وب‌سایت',
      referral: 'معرفی',
      cold_call: 'تماس سرد',
      email: 'ایمیل',
      social: 'شبکه اجتماعی',
      ad: 'تبلیغات',
      event: 'رویداد',
      partner: 'شریک',
      other: 'سایر',
    };
    return map[source] || source;
  };

  const columns = [
    {
      title: 'سرنخ',
      dataIndex: 'firstName',
      key: 'name',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Avatar icon={<UserOutlined />} style={{ background: COLORS.primary }} />
          <div>
            <strong>{record.firstName} {record.lastName}</strong>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {record.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'شرکت',
      dataIndex: 'company',
      key: 'company',
      render: (text) => text || '-',
    },
    {
      title: 'وضعیت',
      dataIndex: 'leadStatus',
      key: 'status',
      render: (status) => {
        const info = getStatusTag(status);
        return <Tag color={info.color}>{info.label}</Tag>;
      },
      filters: [
        { text: 'جدید', value: 'new' },
        { text: 'تماس گرفته شده', value: 'contacted' },
        { text: 'در حال پیگیری', value: 'working' },
        { text: 'واجد شرایط', value: 'qualified' },
        { text: 'تبدیل شده', value: 'converted' },
        { text: 'از دست رفته', value: 'lost' },
      ],
      onFilter: (value, record) => record.leadStatus === value,
    },
    {
      title: 'امتیاز',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => {
        const info = getRatingTag(rating);
        return <Tag color={info.color}>{info.label}</Tag>;
      },
      filters: [
        { text: 'داغ', value: 'hot' },
        { text: 'گرم', value: 'warm' },
        { text: 'سرد', value: 'cold' },
      ],
      onFilter: (value, record) => record.rating === value,
    },
    {
      title: 'منبع',
      dataIndex: 'leadSource',
      key: 'source',
      render: (source) => getSourceTag(source),
    },
    {
      title: 'تخصیص به',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (assignedTo) => assignedTo?.fullName || assignedTo?.username || '-',
    },
    {
      title: 'تاریخ',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => toPersianDate(date),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'عملیات',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="مشاهده">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/crm/leads/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="ویرایش">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/crm/leads/edit/${record._id}`)}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'convert',
                  label: 'تبدیل به مشتری',
                  icon: <CheckOutlined />,
                  onClick: () => handleConvert(record._id),
                },
                {
                  key: 'assign',
                  label: 'تخصیص به کاربر',
                  icon: <UserAddOutlined />,
                  onClick: () => {
                    setSelectedLead(record._id);
                    setAssignModalVisible(true);
                  },
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
          👤 مدیریت سرنخ‌ها
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
          <Link to="/crm/leads/new">
            <Button type="primary" icon={<PlusOutlined />}>
              سرنخ جدید
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
              placeholder="جستجو بر اساس نام، ایمیل، شرکت..."
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
              style={{ width: 150 }}
              allowClear
            >
              <Option value="new">جدید</Option>
              <Option value="contacted">تماس گرفته شده</Option>
              <Option value="working">در حال پیگیری</Option>
              <Option value="qualified">واجد شرایط</Option>
              <Option value="converted">تبدیل شده</Option>
              <Option value="lost">از دست رفته</Option>
            </Select>
            <Select
              value={filters.rating}
              onChange={(value) => setFilters({ ...filters, rating: value })}
              placeholder="امتیاز"
              style={{ width: 120 }}
              allowClear
            >
              <Option value="hot">🔥 داغ</Option>
              <Option value="warm">🌤️ گرم</Option>
              <Option value="cold">❄️ سرد</Option>
            </Select>
            <Select
              value={filters.source}
              onChange={(value) => setFilters({ ...filters, source: value })}
              placeholder="منبع"
              style={{ width: 130 }}
              allowClear
            >
              <Option value="website">وب‌سایت</Option>
              <Option value="referral">معرفی</Option>
              <Option value="cold_call">تماس سرد</Option>
              <Option value="email">ایمیل</Option>
              <Option value="social">شبکه اجتماعی</Option>
              <Option value="ad">تبلیغات</Option>
              <Option value="event">رویداد</Option>
              <Option value="partner">شریک</Option>
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
            showTotal: (total) => `تعداد ${total} سرنخ`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={(pagination) => fetchData(pagination.current, pagination.pageSize)}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* مودال تخصیص سرنخ */}
      <Modal
        title="تخصیص سرنخ به کاربر"
        open={assignModalVisible}
        onOk={() => assignForm.submit()}
        onCancel={() => {
          setAssignModalVisible(false);
          assignForm.resetFields();
        }}
        okText="تخصیص"
        cancelText="انصراف"
      >
        <Form form={assignForm} onFinish={handleAssign} layout="vertical">
          <Form.Item
            name="userId"
            label="کاربر"
            rules={[{ required: true, message: 'کاربر را انتخاب کنید' }]}
          >
            <Select placeholder="انتخاب کاربر" showSearch optionFilterProp="children">
              {users.map((u) => (
                <Option key={u._id} value={u._id}>
                  {u.fullName || u.username}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default LeadsList;



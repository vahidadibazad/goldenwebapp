import { useState, useEffect } from 'react';
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
  Modal,
  Form,
  Select,
  Switch,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  TeamOutlined,
  BankOutlined,
  UserOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

function SecretariatList() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsPhone(window.innerWidth <= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data.data || []);
    } catch (error) {
      console.error('خطا در دریافت کاربران:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data.data || []);
    } catch (error) {
      console.error('خطا در دریافت واحدها:', error);
    }
  };

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('page', page);
      params.append('limit', pageSize);
      const res = await api.get(`/secretariats?${params.toString()}`);
      setData(res.data.data || []);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: res.data.total || res.data.data?.length || 0,
      });
    } catch (error) {
      message.error('خطا در دریافت دبیرخانه‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchUsers();
    fetchDepartments();
  }, [search]);

  const handleTableChange = (pagination) => {
    fetchData(pagination.current, pagination.pageSize);
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    // ✅ استفاده از setTimeout برای اطمینان از رندر شدن فرم
    setTimeout(() => {
      form.setFieldsValue({
        name: record.name,
        code: record.code,
        type: record.type || 'main',
        parent: record.parent?._id || record.parent || null,
        manager: record.manager?._id || record.manager || null,
        staff: record.staff?.map(s => s._id || s) || [],
        departments: record.departments?.map(d => d._id || d) || [],
        isActive: record.isActive !== undefined ? record.isActive : true,
        settings: record.settings || {},
      });
    }, 0);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/secretariats/${id}`);
      message.success('دبیرخانه با موفقیت حذف شد');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در حذف');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingId) {
        await api.put(`/secretariats/${editingId}`, values);
        message.success('دبیرخانه با موفقیت ویرایش شد');
      } else {
        await api.post('/secretariats', values);
        message.success('دبیرخانه با موفقیت ایجاد شد');
      }
      
      setModalVisible(false);
      form.resetFields();
      setEditingId(null);
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ذخیره');
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    // ✅ فقط اگر فرم موجود باشد، reset کن
    if (form) {
      form.resetFields();
    }
    setEditingId(null);
  };

  // ✅ تابع باز کردن مودال برای ایجاد جدید
  const openCreateModal = () => {
    setEditingId(null);
    // ✅ استفاده از setTimeout برای اطمینان از رندر شدن فرم
    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({
        type: 'main',
        isActive: true,
      });
    }, 0);
    setModalVisible(true);
  };

  const getTypeTag = (type) => {
    const map = {
      main: { color: 'blue', label: 'اصلی' },
      sub: { color: 'green', label: 'فرعی' },
      temporary: { color: 'orange', label: 'موقت' },
    };
    return map[type] || { color: 'default', label: type };
  };

  const columns = [
    {
      title: 'دبیرخانه',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: record.type === 'main' ? '#1677ff' : '#52c41a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
            }}
          >
            <BankOutlined />
          </div>
          <div>
            <strong>{text}</strong>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              کد: {record.code}
            </div>
          </div>
        </div>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
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
        { text: 'اصلی', value: 'main' },
        { text: 'فرعی', value: 'sub' },
        { text: 'موقت', value: 'temporary' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'مدیر',
      dataIndex: 'manager',
      key: 'manager',
      render: (manager) => {
        if (!manager) return '-';
        return manager.fullName || manager.username || '-';
      },
    },
    {
      title: 'کارمندان',
      dataIndex: 'staff',
      key: 'staff',
      render: (staff) => (
        <Badge count={staff?.length || 0} style={{ background: '#1677ff' }} />
      ),
    },
    {
      title: 'نامه‌ها',
      dataIndex: 'stats',
      key: 'stats',
      render: (stats) => (
        <Space>
          <Tag color="blue">{stats?.totalLetters || 0}</Tag>
          <Tag color="orange">{stats?.pendingLetters || 0}</Tag>
        </Space>
      ),
    },
    {
      title: 'وضعیت',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? 'فعال' : 'غیرفعال'}
        </Tag>
      ),
      filters: [
        { text: 'فعال', value: true },
        { text: 'غیرفعال', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: 'عملیات',
      key: 'action',
      fixed: 'right',
      width: isPhone ? 120 : 180,
      render: (_, record) => (
        <Space size={isPhone ? 2 : 4}>
          <Tooltip title="ویرایش">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ color: '#faad14' }}
              className="action-btn"
            />
          </Tooltip>
          <Tooltip title="حذف">
            <Popconfirm
              title="آیا از حذف این دبیرخانه اطمینان دارید؟"
              onConfirm={() => handleDelete(record._id)}
              okText="بله"
              cancelText="خیر"
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                style={{ color: '#ff4d4f' }}
                className="action-btn"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredData = data.filter(item =>
    item.name.includes(search) ||
    item.code.includes(search)
  );

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
          🏢 مدیریت دبیرخانه‌ها
          <Tag color="blue" style={{ marginRight: 8 }}>
            {data.length} دبیرخانه
          </Tag>
        </Title>
        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchData(pagination.current, pagination.pageSize)}
            loading={loading}
          >
            بروزرسانی
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            {isPhone ? 'جدید' : 'دبیرخانه جدید'}
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 'var(--radius)' }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder="جستجوی دبیرخانه‌ها..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
        </Row>

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
            showTotal: (total) => `تعداد ${total} دبیرخانه`,
            pageSizeOptions: ['10', '20', '50'],
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
            },
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* ============================================= */}
      {/* ✅ مودال فرم با اتصال صحیح form */}
      {/* ============================================= */}
      <Modal
        title={editingId ? '✏️ ویرایش دبیرخانه' : '➕ دبیرخانه جدید'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={isPhone ? '95%' : 600}
        okText={editingId ? 'ویرایش' : 'افزودن'}
        cancelText="انصراف"
        className={isMobile ? 'ant-modal-fullscreen-mobile' : ''}
        destroyOnHidden
        afterOpenChange={(open) => {
          // ✅ وقتی مودال باز می‌شود، فرم را ریست کن
          if (open && !editingId) {
            setTimeout(() => {
              form.resetFields();
              form.setFieldsValue({
                type: 'main',
                isActive: true,
              });
            }, 0);
          }
        }}
      >
        {/* ✅ اینجا form به Form متصل شده است */}
        <Form form={form} layout="vertical">
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="نام دبیرخانه"
                rules={[{ required: true, message: 'نام دبیرخانه الزامی است' }]}
              >
                <Input placeholder="مثلاً: دبیرخانه مرکزی" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="code"
                label="کد دبیرخانه"
                rules={[
                  { required: true, message: 'کد دبیرخانه الزامی است' },
                  { pattern: /^[A-Z0-9]+$/, message: 'فقط حروف بزرگ و اعداد' }
                ]}
              >
                <Input placeholder="مثلاً: SEC-001" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="type" label="نوع" initialValue="main">
                <Select>
                  <Option value="main">اصلی</Option>
                  <Option value="sub">فرعی</Option>
                  <Option value="temporary">موقت</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="parent" label="دبیرخانه والد">
                <Select placeholder="انتخاب دبیرخانه والد" allowClear>
                  {data.map(d => (
                    <Option key={d._id} value={d._id}>
                      {d.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="manager" label="مدیر دبیرخانه">
            <Select placeholder="انتخاب مدیر" allowClear showSearch>
              {users.map(u => (
                <Option key={u._id} value={u._id}>
                  {u.fullName || u.username}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="staff" label="کارمندان">
            <Select
              mode="multiple"
              placeholder="انتخاب کارمندان"
              allowClear
              showSearch
            >
              {users.map(u => (
                <Option key={u._id} value={u._id}>
                  {u.fullName || u.username}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="departments" label="واحدهای تحت پوشش">
            <Select
              mode="multiple"
              placeholder="انتخاب واحدها"
              allowClear
              showSearch
            >
              {departments.map(d => (
                <Option key={d._id} value={d._id}>
                  {d.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="isActive" label="فعال" valuePropName="checked">
            <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" defaultChecked />
          </Form.Item>
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
      `}</style>
    </div>
  );
}

export default SecretariatList;
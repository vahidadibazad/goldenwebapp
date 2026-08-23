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
  Switch,
  Modal,
  Form,
  Select,
  ColorPicker,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  TeamOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { departmentService } from '../../services/letterApi';
import { COLORS } from '../../styles/theme';

const { Title, Text } = Typography;
const { Option } = Select;

function DepartmentList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
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

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await departmentService.getAll();
      const departments = res.data.data || [];
      setData(departments);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: departments.length,
      });
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (record) => {
    setEditingId(record._id);
    // ✅ استفاده از setTimeout برای اطمینان از رندر شدن فرم
    setTimeout(() => {
      form.setFieldsValue({
        name: record.name,
        code: record.code,
        description: record.description,
        parent: record.parent?._id || record.parent || null,
        manager: record.manager?._id || record.manager || null,
        color: record.color || '#1677ff',
        icon: record.icon || '🏢',
        isActive: record.isActive,
      });
    }, 0);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await departmentService.delete(id);
      message.success('واحد با موفقیت حذف شد');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در حذف');
    }
  };

  const handleToggle = async (id) => {
    try {
      await departmentService.toggle(id);
      message.success('وضعیت واحد تغییر کرد');
      fetchData();
    } catch (error) {
      message.error('خطا در تغییر وضعیت');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingId) {
        await departmentService.update(editingId, values);
        message.success('واحد با موفقیت ویرایش شد');
      } else {
        await departmentService.create(values);
        message.success('واحد با موفقیت ایجاد شد');
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
        isActive: true,
        color: '#1677ff',
        icon: '🏢',
      });
    }, 0);
    setModalVisible(true);
  };

  const columns = [
    {
      title: 'واحد',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{record.icon || '🏢'}</span>
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
      title: 'سطح',
      dataIndex: 'level',
      key: 'level',
      render: (level) => (
        <Tag color={level === 0 ? 'blue' : level === 1 ? 'green' : 'orange'}>
          {level === 0 ? 'اصلی' : level === 1 ? 'زیرمجموعه' : 'فرعی'}
        </Tag>
      ),
      filters: [
        { text: 'اصلی', value: 0 },
        { text: 'زیرمجموعه', value: 1 },
        { text: 'فرعی', value: 2 },
      ],
      onFilter: (value, record) => record.level === value,
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
              style={{ color: COLORS.warning }}
              className="action-btn"
            />
          </Tooltip>
          <Tooltip title="فعال/غیرفعال">
            <Switch
              size="small"
              checked={record.isActive}
              onChange={() => handleToggle(record._id)}
            />
          </Tooltip>
          <Tooltip title="حذف">
            <Popconfirm
              title="آیا از حذف این واحد اطمینان دارید؟"
              onConfirm={() => handleDelete(record._id)}
              okText="بله"
              cancelText="خیر"
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                style={{ color: COLORS.danger }}
                className="action-btn"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // فیلتر بر اساس جستجو
  const filteredData = data.filter(item =>
    item.name.includes(search) ||
    item.code.includes(search) ||
    item.description?.includes(search)
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
          🏢 مدیریت واحدها
          <Tag color="blue" style={{ marginRight: 8 }}>
            {data.length} واحد
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
            {isPhone ? 'جدید' : 'واحد جدید'}
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 'var(--radius)' }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder="جستجوی واحدها..."
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
            showTotal: (total) => `تعداد ${total} واحد`,
            pageSizeOptions: ['10', '20', '50'],
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
            },
          }}
        />
      </Card>

      {/* ============================================= */}
      {/* ✅ مودال فرم با اتصال صحیح form */}
      {/* ============================================= */}
      <Modal
        title={editingId ? '✏️ ویرایش واحد' : '➕ واحد جدید'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={isPhone ? '95%' : 550}
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
                isActive: true,
                color: '#1677ff',
                icon: '🏢',
              });
            }, 0);
          }
        }}
      >
        {/* ✅ اینجا form به Form متصل شده است */}
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="نام واحد"
            rules={[{ required: true, message: 'نام واحد الزامی است' }]}
          >
            <Input placeholder="مثلاً: فناوری اطلاعات" />
          </Form.Item>

          <Form.Item
            name="code"
            label="کد واحد"
            rules={[
              { required: true, message: 'کد واحد الزامی است' },
              { pattern: /^[^\s]+$/, message: 'کد نباید شامل فاصله باشد' }
            ]}
          >
            <Input placeholder="مثلاً: IT" />
          </Form.Item>

          <Form.Item name="description" label="توضیحات">
            <Input.TextArea rows={2} placeholder="توضیحات واحد" />
          </Form.Item>

          <Form.Item name="parent" label="واحد والد">
            <Select placeholder="انتخاب واحد والد" allowClear>
              {data.map(d => (
                <Option key={d._id} value={d._id}>
                  {d.icon} {d.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="color" label="رنگ">
            <ColorPicker />
          </Form.Item>

          <Form.Item name="icon" label="آیکون">
            <Input placeholder="مثلاً: 🏢" maxLength={2} />
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

export default DepartmentList;
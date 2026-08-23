import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Button, Card, Form, Input, Select, ColorPicker, Popconfirm, Space, Typography, Tag, Tooltip, Row, Col, message } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  FolderOutlined,
  FileTextOutlined,
  SafetyOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import { toPersianNumber } from '../utils/numberHelper';
import { COLORS } from '../styles/theme';

const { Title, Text } = Typography;
const { Option } = Select;

function CategoryManager() {
  const { module } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);

  const moduleOptions = [
    { value: 'hardware', label: 'اموال', icon: <AppstoreOutlined /> },
    { value: 'document', label: 'اسناد', icon: <FileTextOutlined /> },
    { value: 'credential', label: 'رمزها', icon: <SafetyOutlined /> },
  ];

  const moduleLabels = {
    hardware: { label: 'اموال', icon: <AppstoreOutlined />, color: COLORS.primary },
    document: { label: 'اسناد', icon: <FileTextOutlined />, color: COLORS.success },
    credential: { label: 'رمزها', icon: <SafetyOutlined />, color: COLORS.warning },
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/categories/${module}`);
      setCategories(res.data.data || []);
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [module]);

  const onFinish = async (values) => {
    try {
      const payload = { 
        ...values, 
        module, 
        color: values.color?.toHex?.() || '#64748b' 
      };
      
      if (editingId) {
        await api.put(`/categories/${editingId}`, payload);
        message.success('دسته‌بندی با موفقیت ویرایش شد');
      } else {
        await api.post('/categories', payload);
        message.success('دسته‌بندی با موفقیت ثبت شد');
      }
      form.resetFields();
      setEditingId(null);
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ثبت');
    }
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      color: record.color || '#64748b',
      icon: record.icon || '📁',
    });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      message.success('دسته‌بندی با موفقیت حذف شد');
      fetchData();
    } catch (error) {
      message.error('خطا در حذف');
    }
  };

  const columns = [
    {
      title: 'آیکون',
      dataIndex: 'icon',
      key: 'icon',
      render: (icon) => <span style={{ fontSize: 24 }}>{icon || '📁'}</span>,
      width: 80,
    },
    {
      title: 'نام دسته‌بندی',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong style={{ fontSize: '14px' }}>{text}</strong>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'رنگ',
      dataIndex: 'color',
      key: 'color',
      render: (color) => (
        <div style={{ 
          width: 32, 
          height: 32, 
          borderRadius: '50%', 
          background: color || '#64748b',
          border: '2px solid var(--border-color)',
        }} />
      ),
    },
    {
      title: 'ماژول',
      dataIndex: 'module',
      key: 'module',
      render: (mod) => {
        const info = moduleLabels[mod] || { label: mod || 'عمومی', color: COLORS.gray[500] };
        return (
          <Tag color={info.color} icon={info.icon} style={{ padding: '4px 12px', borderRadius: '20px' }}>
            {info.label}
          </Tag>
        );
      },
    },
    {
      title: 'توضیحات',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || <span style={{ color: 'var(--text-muted)' }}>—</span>,
    },
    {
      title: 'عملیات',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="ویرایش" placement="top">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              style={{ color: COLORS.warning }}
              onClick={() => handleEdit(record)}
              className="action-btn"
            />
          </Tooltip>
          <Tooltip title="حذف" placement="top">
            <Popconfirm 
              title="آیا از حذف این دسته‌بندی اطمینان دارید؟" 
              onConfirm={() => handleDelete(record._id)}
              okText="بله، حذف کن"
              cancelText="لغو"
              placement="left"
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

  const currentModule = moduleLabels[module] || { label: module, icon: <FolderOutlined /> };

  return (
    <div className="fade-in">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            📂 مدیریت دسته‌بندی {currentModule.label}
            <Tag color={currentModule.color} style={{ fontSize: '14px', padding: '2px 12px' }}>
              {categories.length} دسته‌بندی
            </Tag>
          </Title>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            {currentModule.icon} {currentModule.label} - مدیریت دسته‌بندی‌های این ماژول
          </Text>
        </div>
        <Space wrap>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchData}
            loading={loading}
          >
            بروزرسانی
          </Button>
          <Button onClick={() => navigate('/')}>
            بازگشت به داشبورد
          </Button>
        </Space>
      </div>

      {/* ============================================= */}
      {/* ✅ اصلاح: فرم با Select ساده */}
      {/* ============================================= */}
      <Card style={{ borderRadius: 'var(--radius)', marginBottom: 16 }}>
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Row gutter={[16, 0]} align="bottom">
            <Col xs={24} md={6}>
              <Form.Item 
                name="name" 
                label="نام دسته‌بندی" 
                rules={[{ required: true, message: 'نام را وارد کنید' }]}
              >
                <Input placeholder="مثلاً: سرور، لپ‌تاپ" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item name="icon" label="آیکون">
                <Input placeholder="📁" size="large" maxLength={2} style={{ textAlign: 'center', fontSize: 20 }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item name="color" label="رنگ">
                <ColorPicker 
                  presets={[
                    { label: 'پیشنهادی', colors: ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2'] }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="description" label="توضیحات">
                <Input placeholder="توضیحات اختیاری" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={2}>
              <Form.Item label=" ">
                <Space>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    icon={editingId ? <EditOutlined /> : <PlusOutlined />}
                    size="large"
                  >
                    {editingId ? 'ویرایش' : 'افزودن'}
                  </Button>
                  {editingId && (
                    <Button 
                      onClick={() => { 
                        form.resetFields(); 
                        setEditingId(null); 
                      }}
                      size="large"
                    >
                      لغو
                    </Button>
                  )}
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* جدول */}
      <Card style={{ borderRadius: 'var(--radius)' }}>
        <Table 
          columns={columns} 
          dataSource={categories} 
          rowKey="_id" 
          loading={loading}
          className="custom-table"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `تعداد ${toPersianNumber(total)} دسته‌بندی`,
            pageSizeOptions: ['10', '20', '50', '100'],
            defaultPageSize: 10,
            placement: ['bottomCenter'],
            style: { marginTop: 16 },
            itemRender: (current, type, originalElement) => {
              if (type === 'prev') {
                return <Button size="small">قبلی</Button>;
              }
              if (type === 'next') {
                return <Button size="small">بعدی</Button>;
              }
              return originalElement;
            },
          }}
          scroll={{ x: 800 }}
          style={{ borderRadius: 'var(--radius)' }}
          locale={{
            emptyText: (
              <div style={{ padding: '60px 0' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>📂</div>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  هیچ دسته‌بندی برای {currentModule.label} تعریف نشده است
                </Text>
                <br />
                <Button 
                  type="primary" 
                  style={{ marginTop: '20px' }} 
                  icon={<PlusOutlined />} 
                  size="large"
                  onClick={() => document.querySelector('form input')?.focus()}
                >
                  ایجاد اولین دسته‌بندی
                </Button>
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
      `}</style>
    </div>
  );
}

export default CategoryManager;
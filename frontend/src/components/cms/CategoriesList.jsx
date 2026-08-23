// frontend/src/components/cms/CategoriesList.jsx
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
  ColorPicker,
  App,
  TreeSelect,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  FilterOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import cmsService from '../../services/cmsService';
import { COLORS } from '../../styles/theme';

const { Title, Text } = Typography;
const { TextArea } = Input;

function CategoriesList() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [data, setData] = useState([]);
  const [flatData, setFlatData] = useState([]);
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

  // =============================================
  // دریافت داده‌ها
  // =============================================
  const flattenCategories = (categories, parentPath = '') => {
    let result = [];
    categories.forEach(cat => {
      const path = parentPath ? `${parentPath} / ${cat.name}` : cat.name;
      result.push({
        ...cat,
        path,
        children: cat.children || [],
        originalChildren: cat.children || [],
      });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, path));
      }
    });
    return result;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await cmsService.getCategories();
      const categories = res.data.data || [];
      setData(categories);
      const flat = flattenCategories(categories);
      setFlatData(flat);
      setPagination({
        current: 1,
        pageSize: 10,
        total: flat.length,
      });
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      console.error('❌ خطا در fetchData:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =============================================
  // عملیات
  // =============================================
  const handleEdit = (record) => {
    setEditingId(record._id);
    form.setFieldsValue({
      name: record.name,
      slug: record.slug,
      description: record.description,
      parent: record.parent || null,
      icon: record.icon || '📁',
      color: record.color || '#1677ff',
      order: record.order || 0,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await cmsService.deleteCategory(id);
      message.success('دسته‌بندی با موفقیت حذف شد');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در حذف');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingId) {
        await cmsService.updateCategory(editingId, values);
        message.success('دسته‌بندی با موفقیت ویرایش شد');
      } else {
        await cmsService.createCategory(values);
        message.success('دسته‌بندی با موفقیت ایجاد شد');
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
    form.resetFields();
    setEditingId(null);
  };

  const openCreateModal = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      icon: '📁',
      color: '#1677ff',
      order: 0,
    });
    setModalVisible(true);
  };

  // =============================================
  // ستون‌های جدول
  // =============================================
  const columns = [
    {
      title: 'دسته‌بندی',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: record.color || COLORS.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              flexShrink: 0,
            }}
          >
            {record.icon || '📁'}
          </div>
          <div>
            <strong
              style={{
                fontSize: isPhone ? '13px' : '14px',
                color: 'var(--text-primary)',
              }}
            >
              {text}
            </strong>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              مسیر: {record.path || record.name}
            </div>
          </div>
        </div>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'اسلاگ',
      dataIndex: 'slug',
      key: 'slug',
      render: (slug) => (
        <code style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px' }}>
          {slug}
        </code>
      ),
    },
    {
      title: 'زیردسته‌ها',
      dataIndex: 'children',
      key: 'children',
      render: (children) => (
        <Tag color="blue" style={{ borderRadius: 12 }}>
          {children?.length || 0} زیردسته
        </Tag>
      ),
    },
    {
      title: 'ترتیب',
      dataIndex: 'order',
      key: 'order',
      render: (order) => order || 0,
      sorter: (a, b) => (a.order || 0) - (b.order || 0),
    },
    {
      title: 'عملیات',
      key: 'action',
      fixed: 'right',
      width: isPhone ? 120 : 160,
      render: (_, record) => (
        <Space size={isPhone ? 2 : 4}>
          <Tooltip title="ویرایش" placement="top">
            <Button
              type="text"
              icon={<EditOutlined />}
              size={isPhone ? 'small' : 'middle'}
              style={{ color: COLORS.warning }}
              onClick={() => handleEdit(record)}
              className="action-btn"
            />
          </Tooltip>
          <Tooltip title="حذف" placement="top">
            <Popconfirm
              title="آیا از حذف این دسته‌بندی اطمینان دارید؟"
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
        </Space>
      ),
    },
  ];

  // فیلتر بر اساس جستجو
  const filteredData = flatData.filter(
    (item) =>
      item.name.includes(search) ||
      item.slug.includes(search) ||
      item.description?.includes(search)
  );

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
        <Title level={isPhone ? 4 : isMobile ? 3 : 2} style={{ margin: 0 }}>
          📂 مدیریت دسته‌بندی‌ها
          <Tag color="blue" style={{ marginRight: 8, fontSize: isPhone ? '10px' : '13px' }}>
            {flatData.length} دسته‌بندی
          </Tag>
        </Title>
        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
            size={isPhone ? 'small' : 'middle'}
          >
            {!isPhone && 'بروزرسانی'}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
            size={isPhone ? 'small' : 'middle'}
          >
            {isPhone ? 'جدید' : 'دسته‌بندی جدید'}
          </Button>
        </Space>
      </div>

      {/* کارت اصلی */}
      <Card style={{ borderRadius: 'var(--radius)' }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder={isPhone ? '🔍 جستجو...' : 'جستجوی دسته‌بندی‌ها...'}
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              size={isPhone ? 'small' : 'middle'}
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
            showTotal: (total) => `تعداد ${total} دسته‌بندی`,
            pageSizeOptions: ['10', '20', '50'],
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
            },
            size: isPhone ? 'small' : 'default',
          }}
          locale={{
            emptyText: (
              <div style={{ padding: isPhone ? '30px 0' : '60px 0' }}>
                <div style={{ fontSize: isPhone ? '32px' : '64px', marginBottom: 8 }}>📂</div>
                <Text type="secondary" style={{ fontSize: isPhone ? '13px' : '16px' }}>
                  هیچ دسته‌بندی وجود ندارد
                </Text>
                <br />
                <Button
                  type="primary"
                  style={{ marginTop: isPhone ? '12px' : '20px' }}
                  icon={<PlusOutlined />}
                  onClick={openCreateModal}
                  size={isPhone ? 'small' : 'large'}
                >
                  {isPhone ? 'اولین دسته‌بندی' : 'ایجاد اولین دسته‌بندی'}
                </Button>
              </div>
            ),
          }}
        />
      </Card>

      {/* ============================================= */}
      {/* ✅ مودال فرم دسته‌بندی */}
      {/* ============================================= */}
      <Modal
        title={editingId ? '✏️ ویرایش دسته‌بندی' : '➕ دسته‌بندی جدید'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={isPhone ? '95%' : 550}
        okText={editingId ? 'ویرایش' : 'افزودن'}
        cancelText="انصراف"
        className={isMobile ? 'ant-modal-fullscreen-mobile' : ''}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={[16, 0]}>
            <Col xs={24} md={16}>
              <Form.Item
                name="name"
                label="نام دسته‌بندی"
                rules={[{ required: true, message: 'نام دسته‌بندی الزامی است' }]}
              >
                <Input placeholder="مثلاً: اخبار، مقالات، آموزش" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="icon"
                label="آیکون"
                rules={[{ required: true, message: 'آیکون الزامی است' }]}
              >
                <Input placeholder="📁" maxLength={2} style={{ textAlign: 'center', fontSize: 20 }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="slug"
            label="اسلاگ"
            rules={[
              { required: true, message: 'اسلاگ الزامی است' },
              { pattern: /^[a-z0-9-]+$/, message: 'فقط حروف کوچک، اعداد و خط تیره' },
            ]}
          >
            <Input placeholder="مثلاً: news, articles, tutorials" />
          </Form.Item>

          <Form.Item name="description" label="توضیحات">
            <TextArea rows={2} placeholder="توضیحات دسته‌بندی (اختیاری)" />
          </Form.Item>

          <Form.Item name="parent" label="دسته‌بندی والد">
            <TreeSelect
              placeholder="انتخاب دسته‌بندی والد"
              allowClear
              treeData={data.map(cat => ({
                title: cat.name,
                value: cat._id,
                children: cat.children?.map(sub => ({
                  title: sub.name,
                  value: sub._id,
                })) || [],
              }))}
              treeDefaultExpandAll
            />
          </Form.Item>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="color" label="رنگ">
                <ColorPicker
                  presets={[
                    { label: 'پیشنهادی', colors: ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96'] }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="order" label="ترتیب">
                <Input type="number" min={0} placeholder="۰" />
              </Form.Item>
            </Col>
          </Row>
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
        @media (max-width: 768px) {
          .ant-table { font-size: 12px !important; }
          .ant-table-thead > tr > th,
          .ant-table-tbody > tr > td {
            padding: 6px 8px !important;
          }
        }
        @media (max-width: 480px) {
          .ant-table { font-size: 11px !important; }
          .ant-table-thead > tr > th,
          .ant-table-tbody > tr > td {
            padding: 4px 6px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default CategoriesList;
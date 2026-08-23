// frontend/src/components/LetterNumberingList.jsx
import { useState, useEffect, useRef } from 'react';
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
  InputNumber,
  Switch,
  App,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  NumberOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import { COLORS } from '../styles/theme';

const { Title, Text } = Typography;
const { Option } = Select;

function LetterNumberingList() {
  const { message } = App.useApp();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  const formRef = useRef(null);
  const [secretariats, setSecretariats] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsPhone(window.innerWidth <= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // دریافت دبیرخانه‌ها
  const fetchSecretariats = async () => {
    try {
      const res = await api.get('/secretariats');
      setSecretariats(res.data.data || []);
    } catch (error) {
      console.error('خطا در دریافت دبیرخانه‌ها:', error);
    }
  };

  // دریافت داده‌ها
  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await api.get('/letter-numbering');
      const items = res.data.data || [];
      setData(items);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: items.length,
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
    fetchSecretariats();
  }, []);

  const handleCreate = () => {
    setEditingId(null);
    setModalVisible(true);
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.resetFields();
        formRef.current.setFieldsValue({
          letterType: 'incoming',
          format: '{type}-{year}-{month}-{seq}',
          separator: '-',
          seqLength: 4,
          isActive: true,
        });
      }
    }, 100);
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    setModalVisible(true);
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.setFieldsValue({
          name: record.name,
          code: record.code,
          letterType: record.letterType,
          format: record.format,
          separator: record.separator,
          seqLength: record.seqLength,
          secretariat: record.secretariat?._id || null,
          isActive: record.isActive,
        });
      }
    }, 100);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/letter-numbering/${id}`);
      message.success('الگوی شماره‌گذاری با موفقیت حذف شد');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در حذف');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingId) {
        await api.put(`/letter-numbering/${editingId}`, values);
        message.success('الگوی شماره‌گذاری با موفقیت ویرایش شد');
      } else {
        await api.post('/letter-numbering', values);
        message.success('الگوی شماره‌گذاری با موفقیت ایجاد شد');
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

  const handleGenerateSample = async () => {
    try {
      const values = await form.validateFields();
      const res = await api.post('/letter-numbering/generate', {
        letterType: values.letterType,
        secretariatId: values.secretariat || secretariats[0]?._id,
      });
      message.success(`شماره نمونه: ${res.data.data.number}`);
    } catch (error) {
      message.error('خطا در تولید شماره نمونه');
    }
  };

  const typeLabels = {
    incoming: 'وارده',
    outgoing: 'صادره',
    internal: 'داخلی',
  };

  const typeColors = {
    incoming: 'blue',
    outgoing: 'green',
    internal: 'orange',
  };

  const columns = [
    {
      title: 'نام الگو',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: record.isActive ? COLORS.primary : COLORS.gray[400],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
            }}
          >
            <NumberOutlined />
          </div>
          <div>
            <strong style={{ fontSize: isPhone ? '13px' : '14px' }}>
              {text}
            </strong>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              کد: {record.code}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'نوع نامه',
      dataIndex: 'letterType',
      key: 'letterType',
      render: (type) => (
        <Tag color={typeColors[type] || 'default'} style={{ borderRadius: 12 }}>
          {typeLabels[type] || type}
        </Tag>
      ),
      filters: [
        { text: 'وارده', value: 'incoming' },
        { text: 'صادره', value: 'outgoing' },
        { text: 'داخلی', value: 'internal' },
      ],
      onFilter: (value, record) => record.letterType === value,
    },
    {
      title: 'فرمت',
      dataIndex: 'format',
      key: 'format',
      render: (format) => (
        <code
          style={{
            background: 'var(--bg-secondary)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: isPhone ? '10px' : '12px',
          }}
        >
          {format}
        </code>
      ),
    },
    {
      title: 'دبیرخانه',
      dataIndex: 'secretariat',
      key: 'secretariat',
      render: (secretariat) => secretariat?.name || 'همه',
    },
    {
      title: 'وضعیت',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag
          color={isActive ? 'success' : 'error'}
          icon={isActive ? <CheckOutlined /> : <CloseOutlined />}
          style={{ borderRadius: 12 }}
        >
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
              title="آیا از حذف این الگو اطمینان دارید؟"
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

  const filteredData = data.filter(
    (item) =>
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
          🔢 مدیریت شماره‌گذاری نامه‌ها
          <Tag color="blue" style={{ marginRight: 8, fontSize: isPhone ? '10px' : '13px' }}>
            {data.length} الگو
          </Tag>
        </Title>
        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchData(pagination.current, pagination.pageSize)}
            loading={loading}
            size={isPhone ? 'small' : 'middle'}
          >
            {!isPhone && 'بروزرسانی'}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size={isPhone ? 'small' : 'middle'}
          >
            {isPhone ? 'جدید' : 'الگوی جدید'}
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 'var(--radius)' }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder={isPhone ? '🔍 جستجو...' : 'جستجوی الگوها...'}
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
            showTotal: (total) => `تعداد ${total} الگو`,
            pageSizeOptions: ['10', '20', '50'],
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
            },
            size: isPhone ? 'small' : 'default',
          }}
          locale={{
            emptyText: (
              <div style={{ padding: isPhone ? '30px 0' : '60px 0' }}>
                <div style={{ fontSize: isPhone ? '32px' : '64px', marginBottom: 8 }}>🔢</div>
                <Text type="secondary" style={{ fontSize: isPhone ? '13px' : '16px' }}>
                  هیچ الگوی شماره‌گذاری تعریف نشده است
                </Text>
                <br />
                <Button
                  type="primary"
                  style={{ marginTop: isPhone ? '12px' : '20px' }}
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                  size={isPhone ? 'small' : 'large'}
                >
                  {isPhone ? 'اولین الگو' : 'تعریف اولین الگو'}
                </Button>
              </div>
            ),
          }}
        />
      </Card>

      <Modal
        title={editingId ? '✏️ ویرایش الگوی شماره‌گذاری' : '➕ الگوی جدید'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={isPhone ? '95%' : 600}
        okText={editingId ? 'ویرایش' : 'افزودن'}
        cancelText="انصراف"
        className={isMobile ? 'ant-modal-fullscreen-mobile' : ''}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="نام الگو"
                rules={[{ required: true, message: 'نام الگو الزامی است' }]}
              >
                <Input placeholder="مثلاً: شماره‌گذاری استاندارد" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="code"
                label="کد الگو"
                rules={[
                  { required: true, message: 'کد الگو الزامی است' },
                  { pattern: /^[A-Z0-9_]+$/, message: 'فقط حروف بزرگ، اعداد و زیرخط' },
                ]}
              >
                <Input placeholder="مثلاً: STD_IN" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="letterType"
                label="نوع نامه"
                rules={[{ required: true, message: 'نوع نامه را انتخاب کنید' }]}
              >
                <Select placeholder="انتخاب نوع نامه">
                  <Option value="incoming">وارده</Option>
                  <Option value="outgoing">صادره</Option>
                  <Option value="internal">داخلی</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="secretariat" label="دبیرخانه">
                <Select placeholder="انتخاب دبیرخانه" allowClear>
                  {secretariats.map((s) => (
                    <Option key={s._id} value={s._id}>
                      {s.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="format"
            label="فرمت شماره‌گذاری"
            rules={[{ required: true, message: 'فرمت را وارد کنید' }]}
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                متغیرها: {'{type}'}, {'{year}'}, {'{month}'}, {'{day}'}, {'{seq}'}, {'{department}'}, {'{secretariat}'}
              </Text>
            }
          >
            <Input placeholder="مثلاً: {type}-{year}-{month}-{seq}" />
          </Form.Item>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={8}>
              <Form.Item name="separator" label="جداکننده">
                <Input placeholder="-" maxLength={1} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="seqLength" label="طول شماره سریال">
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="isActive" label="فعال" valuePropName="checked">
                <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" defaultChecked />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Button type="dashed" onClick={handleGenerateSample}>
              تولید شماره نمونه
            </Button>
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

export default LetterNumberingList;
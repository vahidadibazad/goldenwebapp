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
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CopyOutlined,
  EyeOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { workflowService } from '../../services/letterApi';
import api from '../../services/api'; // ✅ اضافه شد
import { COLORS } from '../../styles/theme';

const { Title, Text } = Typography;
const { Option } = Select;

function WorkflowList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  const [filterType, setFilterType] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [copyingId, setCopyingId] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsPhone(window.innerWidth <= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterType) params.type = filterType;

      const res = await workflowService.getAll(params);
      setData(res.data.data || []);
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, filterType]);

  const handleDelete = async (id) => {
    try {
      await workflowService.delete(id);
      message.success('گردش کار با موفقیت حذف شد');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در حذف');
    }
  };

  const handleCopy = (id) => {
    setCopyingId(id);
    form.resetFields();
    setModalVisible(true);
  };

  const handleCopyConfirm = async () => {
    try {
      const values = await form.validateFields();
      await workflowService.duplicate(copyingId, { name: values.name });
      message.success('گردش کار با موفقیت کپی شد');
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در کپی');
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await workflowService.update(id, { isActive: !currentStatus });
      message.success(`گردش کار ${!currentStatus ? 'فعال' : 'غیرفعال'} شد`);
      fetchData();
    } catch (error) {
      message.error('خطا در تغییر وضعیت');
    }
  };

  const typeColors = {
    leave: 'green',
    mission: 'blue',
    letter: 'purple',
    purchase: 'orange',
    contract: 'red',
    custom: 'default',
  };

  const typeLabels = {
    leave: 'مرخصی',
    mission: 'ماموریت',
    letter: 'نامه اداری',
    purchase: 'خرید',
    contract: 'قرارداد',
    custom: 'سفارشی',
  };

  const columns = [
    {
      title: 'نام گردش کار',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: record.isSystem ? COLORS.primary : COLORS.gray[400],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
            }}
          >
            <ShareAltOutlined />
          </div>
          <div>
            <strong>{text}</strong>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {record.description || 'بدون توضیحات'}
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
      render: (type) => (
        <Tag color={typeColors[type] || 'default'}>{typeLabels[type] || type}</Tag>
      ),
      filters: [
        { text: 'مرخصی', value: 'leave' },
        { text: 'ماموریت', value: 'mission' },
        { text: 'نامه اداری', value: 'letter' },
        { text: 'خرید', value: 'purchase' },
        { text: 'قرارداد', value: 'contract' },
        { text: 'سفارشی', value: 'custom' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'مراحل',
      dataIndex: 'steps',
      key: 'steps',
      render: (steps) => (
        <Tag color="blue" style={{ fontSize: isPhone ? '10px' : '13px' }}>
          {steps?.length || 0} مرحله
        </Tag>
      ),
    },
    {
      title: 'وضعیت',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive, record) => (
        <Space>
          <Tag color={isActive ? 'success' : 'error'}>
            {isActive ? 'فعال' : 'غیرفعال'}
          </Tag>
          {record.isSystem && (
            <Tag color="gold" style={{ fontSize: '10px' }}>
              سیستمی
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'تاریخ ایجاد',
      dataIndex: 'createdAt',
      key: 'createdAt',
      className: isPhone ? 'hide-mobile' : '',
      render: (date) => (
        <span
          style={{
            direction: 'ltr',
            fontFamily: 'monospace',
            fontSize: isPhone ? '10px' : '13px',
          }}
        >
          {new Date(date).toLocaleDateString('fa-IR')}
        </span>
      ),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'عملیات',
      key: 'action',
      fixed: 'right',
      width: isPhone ? 140 : 220,
      render: (_, record) => (
        <Space size={isPhone ? 2 : 4} wrap>
          <Tooltip title="مشاهده">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size={isPhone ? 'small' : 'middle'}
              style={{ color: COLORS.primary }}
              onClick={() => navigate(`/workflow/${record._id}`)}
              className="action-btn"
            />
          </Tooltip>
          {!record.isSystem && (
            <>
              <Tooltip title="ویرایش">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  size={isPhone ? 'small' : 'middle'}
                  style={{ color: COLORS.warning }}
                  onClick={() => navigate(`/workflow/edit/${record._id}`)}
                  className="action-btn"
                />
              </Tooltip>
              <Tooltip title="کپی">
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  size={isPhone ? 'small' : 'middle'}
                  style={{ color: COLORS.cyan }}
                  onClick={() => handleCopy(record._id)}
                  className="action-btn"
                />
              </Tooltip>
              <Tooltip title="فعال/غیرفعال">
                <Switch
                  size="small"
                  checked={record.isActive}
                  onChange={() => handleToggle(record._id, record.isActive)}
                />
              </Tooltip>
              <Tooltip title="حذف">
                <Popconfirm
                  title="آیا از حذف این گردش کار اطمینان دارید؟"
                  onConfirm={() => handleDelete(record._id)}
                  okText="بله"
                  cancelText="خیر"
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
            </>
          )}
        </Space>
      ),
    },
  ];

  const filteredData = data.filter(
    (item) => item.name.includes(search) || item.description?.includes(search)
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
          🔄 مدیریت گردش‌های کاری
          <Tag color="purple" style={{ marginRight: 8 }}>
            {data.length} گردش کار
          </Tag>
        </Title>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            بروزرسانی
          </Button>
          <Link to="/workflow/new">
            <Button type="primary" icon={<PlusOutlined />}>
              {isPhone ? 'جدید' : 'گردش کار جدید'}
            </Button>
          </Link>
        </Space>
      </div>

      <Card style={{ borderRadius: 'var(--radius)' }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder="جستجوی گردش‌های کاری..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Select
              placeholder="فیلتر بر اساس نوع"
              style={{ width: '100%' }}
              allowClear
              value={filterType}
              onChange={setFilterType}
            >
              <Option value="leave">مرخصی</Option>
              <Option value="mission">ماموریت</Option>
              <Option value="letter">نامه اداری</Option>
              <Option value="purchase">خرید</Option>
              <Option value="contract">قرارداد</Option>
              <Option value="custom">سفارشی</Option>
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="_id"
          loading={loading}
          scroll={{ x: isPhone ? 400 : isMobile ? 600 : 1000 }}
          pagination={{
            showSizeChanger: !isPhone,
            showQuickJumper: !isPhone,
            showTotal: (total) => `تعداد ${total} گردش کار`,
            pageSizeOptions: ['10', '20', '50'],
          }}
        />
      </Card>

      <Modal
        title="کپی گردش کار"
        open={modalVisible}
        onOk={handleCopyConfirm}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        okText="کپی"
        cancelText="انصراف"
        width={isPhone ? '95%' : 450}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="نام جدید"
            rules={[{ required: true, message: 'نام جدید را وارد کنید' }]}
          >
            <Input placeholder="مثلاً: گردش کار جدید (کپی)" />
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 12 }}>
            💡 با کپی کردن، یک گردش کار جدید با همان مراحل و قوانین ایجاد می‌شود
          </Text>
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
        }
      `}</style>
    </div>
  );
}

export default WorkflowList;
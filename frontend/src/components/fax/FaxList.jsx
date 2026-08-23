// src/components/fax/FaxList.jsx
import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Card,
  Input,
  Space,
  Tag,
  message,
  Typography,
  Tooltip,
  Row,
  Col,
  Badge,
  Tabs,
  Select,
  DatePicker,
  Modal,
  Form,
  Upload,
  App,
  Progress,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  PlusOutlined,
  SendOutlined,
  InboxOutlined,
  FileTextOutlined,
  PhoneOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import faxService from '../../services/faxService';
import { toPersianDate } from '../../utils/dateHelper';
import { COLORS } from '../../styles/theme';
import LetterStatusBadge from '../letters/LetterStatusBadge';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// =============================================
// تنظیمات وضعیت فکس
// =============================================
const FAX_STATUS = {
  pending: { color: 'default', label: 'در انتظار', icon: <ClockCircleOutlined /> },
  processing: { color: 'processing', label: 'در حال پردازش', icon: <SendOutlined /> },
  sent: { color: 'success', label: 'ارسال شده', icon: <CheckCircleOutlined /> },
  received: { color: 'success', label: 'دریافت شده', icon: <InboxOutlined /> },
  failed: { color: 'error', label: 'ناموفق', icon: <CloseCircleOutlined /> },
  cancelled: { color: 'default', label: 'لغو شده', icon: <CloseCircleOutlined /> },
};

const getStatusInfo = (status) => {
  return FAX_STATUS[status] || FAX_STATUS.pending;
};

function FaxList() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    direction: '',
    status: '',
    dateRange: [],
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [stats, setStats] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);

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
  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        ...(search && { search }),
        ...(filters.direction && { direction: filters.direction }),
        ...(filters.status && { status: filters.status }),
      };

      if (filters.dateRange && filters.dateRange.length === 2) {
        params.fromDate = filters.dateRange[0].toISOString();
        params.toDate = filters.dateRange[1].toISOString();
      }

      const [faxRes, statsRes] = await Promise.all([
        faxService.getAll(params),
        faxService.getStats(),
      ]);

      setData(faxRes.data.data?.data || []);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: faxRes.data.data?.pagination?.total || 0,
      });
      setStats(statsRes.data.data || {});
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      console.error('❌ خطا در fetchData:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, filters]);

  // =============================================
  // ارسال فکس
  // =============================================
  const handleSendFax = async (values) => {
    if (fileList.length === 0) {
      message.error('لطفاً یک فایل انتخاب کنید');
      return;
    }

    setUploading(true);
    try {
      await faxService.send({
        faxNumber: values.faxNumber,
        letterId: values.letterId || '',
        file: fileList[0].originFileObj,
        provider: values.provider || 'internal',
      });
      message.success('فکس با موفقیت ارسال شد');
      setModalVisible(false);
      form.resetFields();
      setFileList([]);
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ارسال فکس');
    } finally {
      setUploading(false);
    }
  };

  // =============================================
  // لغو فکس
  // =============================================
  const handleCancelFax = async (id) => {
    try {
      await faxService.cancel(id);
      message.success('فکس با موفقیت لغو شد');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در لغو فکس');
    }
  };

  // =============================================
  // دانلود فکس
  // =============================================
  const handleDownload = async (id, fileName) => {
    try {
      const res = await faxService.download(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'فکس.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('خطا در دانلود فایل');
    }
  };

  // =============================================
  // ستون‌های جدول
  // =============================================
  const columns = [
    {
      title: 'شماره',
      dataIndex: 'faxNumber',
      key: 'faxNumber',
      width: isPhone ? 100 : 150,
      render: (text) => (
        <Tag icon={<PhoneOutlined />} color="blue" style={{ borderRadius: 12 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: 'نوع',
      dataIndex: 'direction',
      key: 'direction',
      width: isPhone ? 60 : 100,
      render: (direction) => (
        <Tag
          color={direction === 'incoming' ? 'green' : 'blue'}
          style={{ borderRadius: 12 }}
        >
          {direction === 'incoming' ? '📥 دریافتی' : '📤 ارسالی'}
        </Tag>
      ),
      filters: [
        { text: 'دریافتی', value: 'incoming' },
        { text: 'ارسالی', value: 'outgoing' },
      ],
      onFilter: (value, record) => record.direction === value,
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      width: isPhone ? 80 : 130,
      render: (status) => {
        const info = getStatusInfo(status);
        return (
          <Tag
            color={info.color}
            icon={info.icon}
            style={{ borderRadius: 12, fontSize: isPhone ? '10px' : '13px' }}
          >
            {info.label}
          </Tag>
        );
      },
    },
    {
      title: 'تاریخ',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: isPhone ? 80 : 130,
      render: (date) => (
        <span style={{ fontSize: isPhone ? '10px' : '13px' }}>
          {toPersianDate(date)}
        </span>
      ),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'عملیات',
      key: 'action',
      fixed: 'right',
      width: isPhone ? 100 : 160,
      render: (_, record) => (
        <Space size={isPhone ? 2 : 4}>
          <Tooltip title="مشاهده" placement="top">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size={isPhone ? 'small' : 'middle'}
              style={{ color: COLORS.primary }}
              onClick={() => navigate(`/fax/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="دانلود" placement="top">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              size={isPhone ? 'small' : 'middle'}
              style={{ color: COLORS.success }}
              onClick={() => handleDownload(record._id, record.fileName)}
            />
          </Tooltip>
          {(record.status === 'pending' || record.status === 'processing') && (
            <Tooltip title="لغو" placement="top">
              <Button
                type="text"
                danger
                icon={<CloseCircleOutlined />}
                size={isPhone ? 'small' : 'middle'}
                onClick={() => handleCancelFax(record._id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // =============================================
  // آمار
  // =============================================
  const statusCounts = {
    pending: data.filter((d) => d.status === 'pending').length,
    processing: data.filter((d) => d.status === 'processing').length,
    sent: data.filter((d) => d.status === 'sent').length,
    received: data.filter((d) => d.status === 'received').length,
    failed: data.filter((d) => d.status === 'failed').length,
    cancelled: data.filter((d) => d.status === 'cancelled').length,
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
        <Title level={isPhone ? 4 : isMobile ? 3 : 2} style={{ margin: 0 }}>
          📠 مدیریت فکس
          <Badge
            count={data.length}
            style={{
              background: COLORS.primary,
              marginRight: 8,
              fontSize: isPhone ? 10 : 12,
            }}
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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              setFileList([]);
              setModalVisible(true);
            }}
          >
            {isPhone ? 'ارسال' : 'ارسال فکس'}
          </Button>
        </Space>
      </div>

      {/* آمار وضعیت‌ها */}
      <Row gutter={[isPhone ? 4 : 8, isPhone ? 4 : 8]} style={{ marginBottom: 12 }}>
        {Object.entries(statusCounts).map(([status, count]) => {
          const info = getStatusInfo(status);
          return (
            <Col key={status} xs={12} sm={6} md={4}>
              <Card
                size="small"
                style={{
                  borderRight: `3px solid ${info.color}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
                bodyStyle={{ padding: isPhone ? '4px 8px' : '8px 12px' }}
                onClick={() => setFilters({ ...filters, status })}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    type="secondary"
                    style={{ fontSize: isPhone ? '9px' : '11px' }}
                  >
                    {info.icon} {info.label}
                  </Text>
                  <Badge
                    count={count}
                    style={{
                      background: info.color,
                      fontSize: isPhone ? 8 : 10,
                    }}
                  />
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* کارت اصلی */}
      <Card style={{ borderRadius: 'var(--radius)' }}>
        {/* جستجو و فیلتر */}
        <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder={isPhone ? '🔍 جستجو...' : '🔍 جستجو بر اساس شماره فکس...'}
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              size={isPhone ? 'small' : 'middle'}
            />
          </Col>
          <Col xs={24} md={12} lg={16}>
            <Space wrap>
              <Select
                value={filters.direction}
                onChange={(value) => setFilters({ ...filters, direction: value })}
                placeholder="نوع"
                style={{ width: isPhone ? '90px' : '120px' }}
                allowClear
                size={isPhone ? 'small' : 'middle'}
              >
                <Option value="incoming">📥 دریافتی</Option>
                <Option value="outgoing">📤 ارسالی</Option>
              </Select>
              <RangePicker
                value={filters.dateRange}
                onChange={(dates) => setFilters({ ...filters, dateRange: dates || [] })}
                placeholder={['از تاریخ', 'تا تاریخ']}
                size={isPhone ? 'small' : 'middle'}
                style={{ width: isPhone ? '180px' : '220px' }}
                format="YYYY/MM/DD"
              />
              {(filters.direction || filters.status || filters.dateRange.length > 0) && (
                <Button
                  size="small"
                  onClick={() =>
                    setFilters({
                      direction: '',
                      status: '',
                      dateRange: [],
                    })
                  }
                  type="text"
                  style={{ color: COLORS.danger }}
                >
                  ✖
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        {/* جدول */}
        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: !isPhone,
            showQuickJumper: !isPhone,
            showTotal: (total) => `تعداد ${total} فکس`,
            pageSizeOptions: ['10', '20', '50'],
            onChange: (page, pageSize) => {
              fetchData(page, pageSize);
            },
            size: isPhone ? 'small' : 'default',
          }}
          scroll={{ x: isPhone ? 400 : isMobile ? 600 : 1000 }}
          style={{ borderRadius: 'var(--radius)' }}
          size={isPhone ? 'small' : 'middle'}
          locale={{
            emptyText: (
              <div style={{ padding: '40px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>📠</div>
                <Text type="secondary">هیچ فکسی ارسال یا دریافت نشده است</Text>
              </div>
            ),
          }}
        />
      </Card>

      {/* مودال ارسال فکس */}
      <Modal
        title="📤 ارسال فکس"
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setFileList([]);
        }}
        okText="ارسال"
        cancelText="انصراف"
        okButtonProps={{ loading: uploading }}
        width={isPhone ? '95%' : 500}
        className={isMobile ? 'ant-modal-fullscreen-mobile' : ''}
      >
        <Form form={form} layout="vertical" onFinish={handleSendFax}>
          <Form.Item
            name="faxNumber"
            label="شماره فکس گیرنده"
            rules={[
              { required: true, message: 'شماره فکس را وارد کنید' },
              { pattern: /^[0-9]+$/, message: 'فقط اعداد مجاز است' },
            ]}
          >
            <Input placeholder="مثلاً: 02112345678" size="large" />
          </Form.Item>

          <Form.Item
            name="provider"
            label="سرویس دهنده"
            initialValue="internal"
          >
            <Select size="large">
              <Option value="internal">داخلی</Option>
              <Option value="external_api">سرویس خارجی</Option>
            </Select>
          </Form.Item>

          <Form.Item label="فایل فکس" required>
            <Upload
              beforeUpload={(file) => {
                const isLt20M = file.size / 1024 / 1024 < 20;
                if (!isLt20M) {
                  message.error('حجم فایل باید کمتر از ۲۰ مگابایت باشد');
                  return false;
                }
                setFileList([file]);
                return false;
              }}
              fileList={fileList}
              onRemove={() => setFileList([])}
              maxCount={1}
              accept=".pdf,.tiff,.tif,.jpg,.jpeg,.png"
            >
              <Button icon={<UploadOutlined />}>انتخاب فایل</Button>
            </Upload>
            {fileList.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Tag color="green">
                  {fileList[0].name} ({(fileList[0].size / 1024).toFixed(1)} KB)
                </Tag>
              </div>
            )}
            <Text type="secondary" style={{ fontSize: 12 }}>
              فرمت‌های مجاز: PDF, TIFF, JPEG, PNG (حداکثر ۲۰ مگابایت)
            </Text>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default FaxList;
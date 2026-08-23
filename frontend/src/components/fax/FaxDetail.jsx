// src/components/fax/FaxDetail.jsx
import { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Descriptions,
  Spin,
  Button,
  Tag,
  message,
  Space,
  Row,
  Col,
  Divider,
  Timeline,
  App,
  Badge,
  Avatar,
  Image,
  Modal,
} from 'antd';
import {
  RollbackOutlined,
  DownloadOutlined,
  PhoneOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  InboxOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import faxService from '../../services/faxService';
import { toPersianDate } from '../../utils/dateHelper';
import { COLORS } from '../../styles/theme';

const { Title, Text } = Typography;

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

function FaxDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsPhone(window.innerWidth <= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // =============================================
  // دریافت اطلاعات
  // =============================================
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await faxService.getById(id);
      setData(res.data.data);
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      navigate('/fax');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  // =============================================
  // دانلود
  // =============================================
  const handleDownload = async () => {
    try {
      const res = await faxService.download(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = data?.fileName || 'فکس.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('خطا در دانلود فایل');
    }
  };

  // =============================================
  // پیش‌نمایش
  // =============================================
  const handlePreview = async () => {
    try {
      const res = await faxService.download(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      setPreviewFile(url);
      setPreviewVisible(true);
    } catch (error) {
      message.error('خطا در نمایش فایل');
    }
  };

  // =============================================
  // لغو فکس
  // =============================================
  const handleCancel = async () => {
    Modal.confirm({
      title: 'لغو فکس',
      content: 'آیا از لغو این فکس اطمینان دارید؟',
      okText: 'بله، لغو کن',
      cancelText: 'انصراف',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await faxService.cancel(id);
          message.success('فکس با موفقیت لغو شد');
          fetchData();
        } catch (error) {
          message.error('خطا در لغو فکس');
        }
      },
    });
  };

  // =============================================
  // بارگذاری
  // =============================================
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="در حال بارگذاری..." />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📠</div>
          <Title level={4}>فکس یافت نشد</Title>
          <Button onClick={() => navigate('/fax')}>بازگشت</Button>
        </div>
      </Card>
    );
  }

  const statusInfo = getStatusInfo(data.status);

  // =============================================
  // Render
  // =============================================
  return (
    <div className="fade-in">
      <Card style={{ borderRadius: 'var(--radius)' }}>
        {/* هدر */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <Title level={isPhone ? 4 : isMobile ? 3 : 2} style={{ margin: 0 }}>
              📠 جزئیات فکس
            </Title>
            <Space size="middle" style={{ marginTop: 4 }}>
              <Tag icon={<PhoneOutlined />} color="blue" style={{ borderRadius: 12 }}>
                {data.faxNumber}
              </Tag>
              <Tag
                color={data.direction === 'incoming' ? 'green' : 'blue'}
                style={{ borderRadius: 12 }}
              >
                {data.direction === 'incoming' ? '📥 دریافتی' : '📤 ارسالی'}
              </Tag>
              <Tag
                color={statusInfo.color}
                icon={statusInfo.icon}
                style={{ borderRadius: 12 }}
              >
                {statusInfo.label}
              </Tag>
            </Space>
          </div>
          <Space>
            <Button icon={<RollbackOutlined />} onClick={() => navigate('/fax')}>
              بازگشت
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
            >
              دانلود
            </Button>
            <Button
              icon={<EyeOutlined />}
              onClick={handlePreview}
            >
              پیش‌نمایش
            </Button>
            {(data.status === 'pending' || data.status === 'processing') && (
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={handleCancel}
              >
                لغو فکس
              </Button>
            )}
          </Space>
        </div>

        {/* اطلاعات اصلی */}
        <Descriptions
          bordered
          column={{ xs: 1, sm: 2, md: 3 }}
          size="middle"
          style={{ marginBottom: 16 }}
        >
          <Descriptions.Item label="شماره فکس">
            <Tag icon={<PhoneOutlined />} color="blue">
              {data.faxNumber}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="شماره فرستنده">
            {data.senderNumber || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="تعداد صفحات">
            <Badge count={data.pages || 1} style={{ background: COLORS.primary }} />
          </Descriptions.Item>
          <Descriptions.Item label="نام فایل">
            <FileTextOutlined /> {data.fileName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="حجم فایل">
            {data.fileSize ? `${(data.fileSize / 1024).toFixed(1)} KB` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="سرویس دهنده">
            <Tag color="purple">{data.provider || 'داخلی'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="تاریخ ارسال/دریافت">
            {toPersianDate(data.sentAt || data.receivedAt || data.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="وضعیت">
            <Tag color={statusInfo.color} icon={statusInfo.icon}>
              {statusInfo.label}
            </Tag>
          </Descriptions.Item>
          {data.errorMessage && (
            <Descriptions.Item label="پیام خطا" span={3}>
              <Text type="danger">{data.errorMessage}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>

        {/* نامه مرتبط */}
        {data.letter && (
          <>
            <Divider>📄 نامه مرتبط</Divider>
            <Card size="small" style={{ background: 'var(--bg-secondary)', borderRadius: 12 }}>
              <Row gutter={[16, 8]}>
                <Col xs={24} md={8}>
                  <Text type="secondary">شماره:</Text>
                  <div>
                    <Link to={`/letters/${data.letter._id}`}>
                      <Tag color="blue">{data.letter.number || 'بدون شماره'}</Tag>
                    </Link>
                  </div>
                </Col>
                <Col xs={24} md={16}>
                  <Text type="secondary">موضوع:</Text>
                  <div>
                    <Link to={`/letters/${data.letter._id}`}>
                      <Text strong>{data.letter.subject}</Text>
                    </Link>
                  </div>
                </Col>
              </Row>
            </Card>
          </>
        )}

        {/* تاریخچه */}
        {data.trackingHistory && data.trackingHistory.length > 0 && (
          <>
            <Divider>📋 تاریخچه</Divider>
            <Timeline
              style={{ marginTop: 8 }}
              items={data.trackingHistory.map((item, index) => ({
                key: index,
                color: item.status === 'failed' ? 'red' : 'blue',
                children: (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <div>
                      <Tag color={item.status === 'failed' ? 'red' : 'blue'}>
                        {item.status === 'sent' ? 'ارسال شد' :
                         item.status === 'received' ? 'دریافت شد' :
                         item.status === 'failed' ? 'ناموفق' :
                         item.status === 'cancelled' ? 'لغو شد' :
                         item.status}
                      </Tag>
                      {item.comment && (
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          {item.comment}
                        </Text>
                      )}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {toPersianDate(item.timestamp)}
                    </Text>
                  </div>
                ),
              }))}
            />
          </>
        )}

        {/* اطلاعات فنی */}
        <Divider>🔧 اطلاعات فنی</Divider>
        <Descriptions size="small" column={2}>
          <Descriptions.Item label="شناسه">
            <code style={{ fontSize: 12 }}>{data._id}</code>
          </Descriptions.Item>
          <Descriptions.Item label="تعداد تلاش‌ها">
            {data.retryCount || 0} از {data.maxRetries || 3}
          </Descriptions.Item>
          <Descriptions.Item label="ایجاد شده در">
            {toPersianDate(data.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="آخرین بروزرسانی">
            {toPersianDate(data.updatedAt)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* مودال پیش‌نمایش */}
      <Modal
        open={previewVisible}
        title="پیش‌نمایش فکس"
        onCancel={() => {
          setPreviewVisible(false);
          setPreviewFile(null);
        }}
        footer={[
          <Button key="download" type="primary" onClick={handleDownload}>
            دانلود
          </Button>,
          <Button key="close" onClick={() => {
            setPreviewVisible(false);
            setPreviewFile(null);
          }}>
            بستن
          </Button>,
        ]}
        width="90%"
        className={isMobile ? 'ant-modal-fullscreen-mobile' : ''}
        styles={{ body: { padding: isPhone ? 8 : 16 } }}
      >
        {previewFile && (
          <div style={{ textAlign: 'center' }}>
            <iframe
              src={previewFile}
              style={{
                width: '100%',
                height: '70vh',
                border: 'none',
                borderRadius: 8,
              }}
              title="پیش‌نمایش فکس"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default FaxDetail;
// src/components/email/EmailInbox.jsx
import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  message,
  Typography,
  Tooltip,
  Row,
  Col,
  Badge,
  Avatar,
  App,
  Modal,
  Tabs,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  InboxOutlined,
  MailOutlined,
  UserOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  FileTextOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import emailService from '../../services/emailService';
import { toPersianDate } from '../../utils/dateHelper';
import { COLORS } from '../../styles/theme';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

function EmailInbox() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsPhone(window.innerWidth <= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // =============================================
  // دریافت ایمیل‌ها
  // =============================================
  const fetchEmails = async () => {
    setLoading(true);
    try {
      // اینجا باید سرویس دریافت ایمیل‌ها را صدا بزنید
      // const res = await emailService.getInbox();
      // setEmails(res.data.data || []);
      setEmails([]);
    } catch (error) {
      message.error('خطا در دریافت ایمیل‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  // =============================================
  // دریافت خودکار
  // =============================================
  const handleReceiveNow = async () => {
    try {
      message.loading({ content: 'در حال دریافت ایمیل‌ها...', key: 'receive' });
      // const res = await emailService.receiveNow();
      // setEmails([...res.data.data, ...emails]);
      message.success({ content: 'ایمیل‌ها با موفقیت دریافت شدند', key: 'receive' });
    } catch (error) {
      message.error({ content: 'خطا در دریافت ایمیل‌ها', key: 'receive' });
    }
  };

  // =============================================
  // مشاهده ایمیل
  // =============================================
  const handleViewEmail = (record) => {
    setSelectedEmail(record);
    setModalVisible(true);
  };

  // =============================================
  // ستون‌های جدول
  // =============================================
  const columns = [
    {
      title: 'فرستنده',
      dataIndex: 'from',
      key: 'from',
      render: (from) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          <span>{from}</span>
        </Space>
      ),
    },
    {
      title: 'موضوع',
      dataIndex: 'subject',
      key: 'subject',
      render: (text, record) => (
        <span style={{ fontWeight: record.isRead ? 'normal' : 'bold' }}>
          {text}
        </span>
      ),
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const map = {
          new: { color: 'blue', label: 'جدید' },
          read: { color: 'green', label: 'خوانده شده' },
          replied: { color: 'purple', label: 'پاسخ داده شده' },
          forwarded: { color: 'orange', label: 'ارجاع شده' },
        };
        const info = map[status] || { color: 'default', label: status };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'تاریخ',
      dataIndex: 'receivedAt',
      key: 'receivedAt',
      render: (date) => (
        <span style={{ fontSize: isPhone ? '10px' : '13px' }}>
          {toPersianDate(date)}
        </span>
      ),
      sorter: (a, b) => new Date(a.receivedAt) - new Date(b.receivedAt),
    },
    {
      title: 'عملیات',
      key: 'action',
      fixed: 'right',
      width: isPhone ? 60 : 100,
      render: (_, record) => (
        <Tooltip title="مشاهده">
          <Button
            type="text"
            icon={<EyeOutlined />}
            size={isPhone ? 'small' : 'middle'}
            style={{ color: COLORS.primary }}
            onClick={() => handleViewEmail(record)}
          />
        </Tooltip>
      ),
    },
  ];

  // =============================================
  // فیلتر
  // =============================================
  const filteredData = emails.filter(
    (item) =>
      item.subject?.includes(search) ||
      item.from?.includes(search)
  );

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
          📥 دریافت ایمیل‌ها
          <Badge
            count={emails.filter(e => e.status === 'new').length}
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
            onClick={fetchEmails}
            loading={loading}
          >
            بروزرسانی
          </Button>
          <Button
            type="primary"
            icon={<InboxOutlined />}
            onClick={handleReceiveNow}
          >
            دریافت خودکار
          </Button>
          <Button
            icon={<MailOutlined />}
            onClick={() => navigate('/email/settings')}
          >
            تنظیمات
          </Button>
        </Space>
      </div>

      {/* کارت اصلی */}
      <Card style={{ borderRadius: 'var(--radius)' }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder="جستجو در ایمیل‌ها..."
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
            showSizeChanger: !isPhone,
            showQuickJumper: !isPhone,
            showTotal: (total) => `تعداد ${total} ایمیل`,
            pageSizeOptions: ['10', '20', '50'],
            size: isPhone ? 'small' : 'default',
          }}
          locale={{
            emptyText: (
              <div style={{ padding: '40px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>📭</div>
                <Text type="secondary">هیچ ایمیلی دریافت نشده است</Text>
                <br />
                <Button
                  type="primary"
                  style={{ marginTop: 16 }}
                  icon={<InboxOutlined />}
                  onClick={handleReceiveNow}
                >
                  دریافت ایمیل‌ها
                </Button>
              </div>
            ),
          }}
        />
      </Card>

      {/* مودال مشاهده ایمیل */}
      <Modal
        title={selectedEmail?.subject || 'مشاهده ایمیل'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            بستن
          </Button>,
          selectedEmail?.attachments?.length > 0 && (
            <Button key="download" type="primary" icon={<DownloadOutlined />}>
              دانلود پیوست‌ها
            </Button>
          ),
        ]}
        width={isPhone ? '95%' : 700}
        className={isMobile ? 'ant-modal-fullscreen-mobile' : ''}
      >
        {selectedEmail && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Row gutter={[16, 8]}>
                <Col span={24}>
                  <Text type="secondary">از:</Text>
                  <Text strong style={{ marginLeft: 8 }}>
                    {selectedEmail.from}
                  </Text>
                </Col>
                <Col span={24}>
                  <Text type="secondary">به:</Text>
                  <Text strong style={{ marginLeft: 8 }}>
                    {selectedEmail.to}
                  </Text>
                </Col>
                <Col span={24}>
                  <Text type="secondary">تاریخ:</Text>
                  <Text style={{ marginLeft: 8 }}>
                    {toPersianDate(selectedEmail.receivedAt)}
                  </Text>
                </Col>
                <Col span={24}>
                  <Text type="secondary">وضعیت:</Text>
                  <Tag color={selectedEmail.status === 'new' ? 'blue' : 'green'} style={{ marginLeft: 8 }}>
                    {selectedEmail.status === 'new' ? 'جدید' : 'خوانده شده'}
                  </Tag>
                </Col>
              </Row>
            </div>

            <Divider />

            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {selectedEmail.body || 'متن ایمیل'}
            </div>

            {selectedEmail.attachments?.length > 0 && (
              <>
                <Divider>📎 پیوست‌ها</Divider>
                <Space wrap>
                  {selectedEmail.attachments.map((att, index) => (
                    <Tag key={index} icon={<FileTextOutlined />} color="blue">
                      {att.filename}
                    </Tag>
                  ))}
                </Space>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default EmailInbox;
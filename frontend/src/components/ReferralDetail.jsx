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
  Avatar,
  Badge,
  Modal,
  Form,
  Input,
  Select,
  Alert,
} from 'antd';
import {
  RollbackOutlined,
  CheckOutlined,
  CloseOutlined,
  SendOutlined,
  UserOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { toPersianDate } from '../utils/dateHelper';
import { COLORS } from '../styles/theme';
import LetterStatusBadge from './letters/LetterStatusBadge';

const { Title, Text } = Typography;
const { Option } = Select;

// =============================================
// تنظیمات وضعیت ارجاع
// =============================================
const REFERRAL_STATUS = {
  pending: { color: 'warning', label: 'در انتظار', icon: <ClockCircleOutlined /> },
  read: { color: 'processing', label: 'مطالعه شده', icon: <EyeOutlined /> },
  actioned: { color: 'success', label: 'اقدام شده', icon: <CheckOutlined /> },
  rejected: { color: 'error', label: 'رد شده', icon: <CloseOutlined /> },
  forwarded: { color: 'purple', label: 'ارجاع مجدد', icon: <SendOutlined /> },
};

const getStatusInfo = (status) => {
  return REFERRAL_STATUS[status] || REFERRAL_STATUS.pending;
};

function ReferralDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);

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
      const [refRes, usersRes] = await Promise.all([
        api.get(`/referrals/${id}`),
        api.get('/auth/users'),
      ]);
      setData(refRes.data.data);
      setUsers(usersRes.data.data || []);
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      navigate('/referrals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  // =============================================
  // ثبت اقدام
  // =============================================
  const handleAction = async (values) => {
    setActionLoading(true);
    try {
      if (modalType === 'forward') {
        await api.post(`/referrals/${id}/forward`, {
          to: values.to,
          message: values.message || '',
        });
        message.success('ارجاع مجدد با موفقیت انجام شد');
      } else {
        await api.patch(`/referrals/${id}/action`, {
          comment: values.comment || '',
        });
        message.success('اقدام با موفقیت ثبت شد');
      }
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ثبت اقدام');
    } finally {
      setActionLoading(false);
    }
  };

  // =============================================
  // علامت‌گذاری به عنوان مطالعه شده
  // =============================================
  const handleMarkAsRead = async () => {
    try {
      await api.patch(`/referrals/${id}/read`);
      message.success('ارجاع به عنوان مطالعه شده علامت‌گذاری شد');
      fetchData();
    } catch (error) {
      message.error('خطا در علامت‌گذاری');
    }
  };

  // =============================================
  // باز کردن مودال
  // =============================================
  const openModal = (type) => {
    setModalType(type);
    form.resetFields();
    setModalVisible(true);
  };

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
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <Title level={4}>ارجاع یافت نشد</Title>
          <Button onClick={() => navigate('/referrals')}>بازگشت</Button>
        </div>
      </Card>
    );
  }

  const statusInfo = getStatusInfo(data.status);
  const isPending = data.status === 'pending' || data.status === 'read';
  const isActionable = data.type === 'review' || data.type === 'approve' || data.type === 'sign';

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
              📋 جزئیات ارجاع
            </Title>
            <Space size="middle" style={{ marginTop: 4, flexWrap: 'wrap' }}>
              <Tag color={statusInfo.color} icon={statusInfo.icon} style={{ borderRadius: 12 }}>
                {statusInfo.label}
              </Tag>
              <Tag color={data.type === 'review' ? 'blue' : data.type === 'approve' ? 'green' : data.type === 'sign' ? 'purple' : 'orange'} style={{ borderRadius: 12 }}>
                {data.type === 'review' ? '📋 پاراف' : data.type === 'approve' ? '✅ تایید' : data.type === 'sign' ? '✍️ امضا' : '📢 اطلاع'}
              </Tag>
              {data.priority === 'urgent' && (
                <Tag color="red" style={{ borderRadius: 12 }}>
                  🔴 فوری
                </Tag>
              )}
              {data.dueDate && new Date(data.dueDate) < new Date() && data.status !== 'actioned' && (
                <Tag color="red" style={{ borderRadius: 12 }}>
                  ⏰ سررسید گذشته
                </Tag>
              )}
            </Space>
          </div>
          <Space>
            <Button icon={<RollbackOutlined />} onClick={() => navigate('/referrals')}>
              بازگشت
            </Button>
            {isPending && isActionable && (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => openModal('action')}
              >
                ثبت اقدام
              </Button>
            )}
            {isPending && (
              <Button
                icon={<SendOutlined />}
                onClick={() => openModal('forward')}
              >
                ارجاع مجدد
              </Button>
            )}
            {data.status === 'pending' && (
              <Button
                icon={<EyeOutlined />}
                onClick={handleMarkAsRead}
              >
                مطالعه شد
              </Button>
            )}
          </Space>
        </div>

        {/* اطلاعات اصلی */}
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="middle" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="نامه مرتبط">
            <Link to={`/letters/${data.letter?._id}`}>
              <Space>
                <FileTextOutlined />
                {data.letter?.subject || 'بدون عنوان'}
                <Tag color="blue">{data.letter?.number || '---'}</Tag>
              </Space>
            </Link>
          </Descriptions.Item>
          <Descriptions.Item label="ارجاع‌دهنده">
            <Space>
              <Avatar icon={<UserOutlined />} size="small" />
              {data.from?.fullName || data.from?.username || 'نامشخص'}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="گیرنده ارجاع">
            <Space>
              <Avatar icon={<UserOutlined />} size="small" />
              {data.to?.fullName || data.to?.username || 'نامشخص'}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="تاریخ ارجاع">{toPersianDate(data.sentAt)}</Descriptions.Item>
          <Descriptions.Item label="تاریخ خواندن">{data.readAt ? toPersianDate(data.readAt) : '—'}</Descriptions.Item>
          <Descriptions.Item label="تاریخ اقدام">{data.actionedAt ? toPersianDate(data.actionedAt) : '—'}</Descriptions.Item>
          <Descriptions.Item label="سررسید" span={2}>
            {data.dueDate ? (
              <Tag color={new Date(data.dueDate) < new Date() ? 'error' : 'success'}>
                {toPersianDate(data.dueDate)}
                {new Date(data.dueDate) < new Date() && ' (منقضی)'}
              </Tag>
            ) : (
              <Tag color="default">نامحدود</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="اولویت">
            <Tag color={data.priority === 'urgent' ? 'red' : data.priority === 'high' ? 'orange' : data.priority === 'medium' ? 'blue' : 'green'}>
              {data.priority === 'urgent' ? 'فوری' : data.priority === 'high' ? 'بالا' : data.priority === 'medium' ? 'متوسط' : 'کم'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        {/* پیام ارجاع */}
        {data.message && (
          <Card
            size="small"
            title="💬 پیام ارجاع"
            style={{ marginBottom: 16, background: 'var(--bg-secondary)', borderRadius: 12 }}
          >
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {data.message}
            </div>
          </Card>
        )}

        {/* توضیحات اقدام */}
        {data.comment && (
          <Card
            size="small"
            title="📝 توضیحات اقدام"
            style={{ marginBottom: 16, background: 'var(--bg-secondary)', borderRadius: 12 }}
          >
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {data.comment}
            </div>
          </Card>
        )}

        {/* تاریخچه */}
        {data.history && data.history.length > 0 && (
          <>
            <Divider>📋 تاریخچه</Divider>
            <Timeline
              style={{ marginTop: 8 }}
              items={data.history.map((item, index) => {
                const status = getStatusInfo(item.status);
                return {
                  key: index,
                  color: status.color,
                  dot: status.icon,
                  children: (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <div>
                        <Tag color={status.color} style={{ borderRadius: 12 }}>
                          {status.label}
                        </Tag>
                        {item.user && (
                          <Space size={4}>
                            <Avatar size="small" icon={<UserOutlined />} />
                            <Text style={{ fontSize: 13 }}>
                              {item.user?.fullName || item.user?.username || 'سیستم'}
                            </Text>
                          </Space>
                        )}
                        {item.comment && (
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                              {item.comment}
                            </Text>
                          </div>
                        )}
                      </div>
                      <div style={{ color: '#999', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        <ClockCircleOutlined style={{ marginLeft: 4 }} />
                        {toPersianDate(item.timestamp)}
                      </div>
                    </div>
                  ),
                };
              })}
            />
          </>
        )}

        {/* مودال اقدام */}
        <Modal
          title={modalType === 'forward' ? '🔄 ارجاع مجدد' : '✅ ثبت اقدام'}
          open={modalVisible}
          onOk={() => form.submit()}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
          }}
          okText={modalType === 'forward' ? 'ارجاع' : 'ثبت'}
          cancelText="انصراف"
          okButtonProps={{ loading: actionLoading }}
          width={isPhone ? '95%' : 450}
        >
          <Form form={form} layout="vertical" onFinish={handleAction}>
            {modalType === 'forward' ? (
              <Form.Item
                name="to"
                label="کاربر مقصد"
                rules={[{ required: true, message: 'کاربر مقصد را انتخاب کنید' }]}
              >
                <Select
                  placeholder="انتخاب کاربر"
                  showSearch
                  optionFilterProp="children"
                  size="large"
                >
                  {users
                    .filter((u) => u._id !== data.to?._id)
                    .map((u) => (
                      <Option key={u._id} value={u._id}>
                        {u.fullName || u.username}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            ) : (
              <Form.Item name="comment" label="توضیحات">
                <Input.TextArea rows={3} placeholder="توضیحات خود را وارد کنید..." size="large" />
              </Form.Item>
            )}
            <Alert
              message="نکته مهم"
              description={modalType === 'forward' 
                ? 'با ارجاع مجدد، این ارجاع به کاربر جدید منتقل می‌شود.'
                : 'با ثبت اقدام، وضعیت ارجاع به "اقدام شده" تغییر می‌کند.'
              }
              type="info"
              showIcon
            />
          </Form>
        </Modal>
      </Card>
    </div>
  );
}

export default ReferralDetail;
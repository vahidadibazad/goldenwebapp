// frontend/src/components/letters/LetterDetail.jsx
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
  Timeline,
  Divider,
  Steps,
  Modal,
  Form,
  Input,
  App,
  Tabs,
  Badge,
  Avatar,
  Tooltip,
  Dropdown,
  Select,
} from 'antd';
import {
  RollbackOutlined,
  CheckOutlined,
  CloseOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  SendOutlined,
  SignatureOutlined,
  InboxOutlined,
  ExportOutlined,
  MoreOutlined,
  PlusOutlined,
  PaperClipOutlined,
  CommentOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toPersianDate } from '../../utils/dateHelper';
import { COLORS } from '../../styles/theme';
import letterService from '../../services/letterService';
import signatureService from '../../services/signatureService';
import LetterStatusBadge, { getStatusInfo } from './LetterStatusBadge';
import LetterTimeline from './LetterTimeline';
import LetterMemos from './LetterMemos';
import LetterAttachments from './LetterAttachments';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Step } = Steps;
const { TabPane } = Tabs;
const { Option } = Select;

// =============================================
// تنظیمات ثابت
// =============================================
const PRIORITY_CONFIG = {
  low: { color: '#8c8c8c', label: 'کم' },
  medium: { color: '#faad14', label: 'متوسط' },
  high: { color: '#ff4d4f', label: 'بالا' },
  urgent: { color: '#ff4d4f', label: 'فوری' },
};

const CLASSIFICATION_CONFIG = {
  normal: { color: '#52c41a', label: 'عادی' },
  confidential: { color: '#faad14', label: 'محرمانه' },
  secret: { color: '#ff4d4f', label: 'سری' },
  top_secret: { color: '#722ed1', label: 'بسیار سری' },
};

function LetterDetail() {
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
  const [memos, setMemos] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [signatures, setSignatures] = useState([]);
  const [users, setUsers] = useState([]);

  // =============================================
  // دریافت اطلاعات
  // =============================================
  const fetchData = async () => {
    setLoading(true);
    try {
      const [letterRes, memosRes, attachmentsRes, signaturesRes, usersRes] = await Promise.all([
        letterService.getById(id),
        letterService.getMemos(id).catch(() => ({ data: { data: [] } })),
        letterService.getAttachments(id).catch(() => ({ data: { data: [] } })),
        signatureService.getByLetter(id).catch(() => ({ data: { data: [] } })),
        api.get('/auth/users').catch(() => ({ data: { data: [] } })),
      ]);

      setData(letterRes.data.data);
      setMemos(memosRes.data.data || []);
      setAttachments(attachmentsRes.data.data || []);
      setSignatures(signaturesRes.data.data || []);
      setUsers(usersRes.data.data || []);
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      navigate('/letters/inbox');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  // =============================================
  // مدیریت یادداشت‌ها
  // =============================================
  const handleAddMemo = async (content) => {
    try {
      const res = await letterService.addMemo(id, { content });
      setMemos([...memos, res.data.data]);
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteMemo = async (memoId) => {
    try {
      await letterService.deleteMemo(memoId);
      setMemos(memos.filter((m) => m._id !== memoId));
    } catch (error) {
      throw error;
    }
  };

  const handleEditMemo = async (memoId, content) => {
    try {
      await letterService.updateMemo(memoId, { content });
      setMemos(memos.map((m) => (m._id === memoId ? { ...m, content } : m)));
    } catch (error) {
      throw error;
    }
  };

  // =============================================
  // مدیریت پیوست‌ها
  // =============================================
  const handleUploadAttachment = async (file) => {
    try {
      const res = await letterService.addAttachment(id, file);
      setAttachments([...attachments, res.data.data]);
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await letterService.deleteAttachment(attachmentId);
      setAttachments(attachments.filter((att) => att._id !== attachmentId));
    } catch (error) {
      throw error;
    }
  };

  const handleDownloadAttachment = async (attachmentId, fileName) => {
    try {
      const res = await letterService.downloadAttachment(attachmentId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw error;
    }
  };

  // =============================================
  // اقدامات روی نامه
  // =============================================
  const handleAction = async (action, values = {}) => {
    setActionLoading(true);
    try {
      switch (action) {
        case 'register':
          await letterService.register(id, values.comment);
          message.success('نامه با موفقیت ثبت شد');
          break;
        case 'approve':
          await letterService.approveReview(id, values.comment);
          message.success('نامه با موفقیت تأیید شد');
          break;
        case 'reject':
          await letterService.rejectReview(id, values.comment);
          message.success('نامه با موفقیت رد شد');
          break;
        case 'archive':
          await letterService.archive(id, 'active', values.comment);
          message.success('نامه با موفقیت بایگانی شد');
          break;
        case 'send_review':
          await letterService.sendForReview(id, values.reviewerId, values.comment);
          message.success('نامه برای پاراف ارسال شد');
          break;
        case 'send_sign':
          await letterService.sendForSign(id, values.signerId, values.comment);
          message.success('نامه برای امضا ارسال شد');
          break;
        default:
          throw new Error('عملیات نامعتبر');
      }
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در انجام عملیات');
    } finally {
      setActionLoading(false);
    }
  };

  const showModal = (type) => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      handleAction(modalType, values);
    });
  };

  // =============================================
  // منوی عملیات
  // =============================================
  const getActionMenu = () => {
    const status = data?.status;
    const items = [];

    if (status === 'draft') {
      items.push({
        key: 'register',
        label: 'ثبت نامه',
        icon: <SendOutlined />,
        onClick: () => showModal('register'),
      });
      items.push({
        key: 'edit',
        label: 'ویرایش',
        icon: <EditOutlined />,
        onClick: () => navigate(`/letters/edit/${id}`),
      });
    }

    if (status === 'registered') {
      items.push({
        key: 'send_review',
        label: 'ارسال برای پاراف',
        icon: <SendOutlined />,
        onClick: () => showModal('send_review'),
      });
    }

    if (status === 'in_review') {
      items.push({
        key: 'approve',
        label: 'تأیید',
        icon: <CheckOutlined />,
        onClick: () => showModal('approve'),
      });
      items.push({
        key: 'reject',
        label: 'رد',
        icon: <CloseOutlined />,
        danger: true,
        onClick: () => showModal('reject'),
      });
    }

    if (status === 'approved') {
      items.push({
        key: 'send_sign',
        label: 'ارسال برای امضا',
        icon: <SignatureOutlined />,
        onClick: () => showModal('send_sign'),
      });
    }

    if (status === 'signed') {
      items.push({
        key: 'archive',
        label: 'بایگانی',
        icon: <InboxOutlined />,
        onClick: () => showModal('archive'),
      });
    }

    return items;
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <Title level={4}>نامه یافت نشد</Title>
          <Button onClick={() => navigate('/letters/inbox')}>بازگشت</Button>
        </div>
      </Card>
    );
  }

  const statusInfo = getStatusInfo(data.status);
  const priorityInfo = PRIORITY_CONFIG[data.priority] || PRIORITY_CONFIG.medium;
  const classificationInfo = CLASSIFICATION_CONFIG[data.classification] || CLASSIFICATION_CONFIG.normal;

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
          <div style={{ flex: 1, minWidth: 0 }}>
            <Title level={isPhone ? 4 : isMobile ? 3 : 2} style={{ margin: 0 }}>
              {data.subject}
            </Title>
            <Space size="middle" style={{ marginTop: 4, flexWrap: 'wrap' }}>
              <Tag color="blue" style={{ borderRadius: 12 }}>
                {data.number || 'بدون شماره'}
              </Tag>
              <LetterStatusBadge status={data.status} />
              <Tag color={priorityInfo.color} style={{ borderRadius: 12 }}>
                {priorityInfo.label}
              </Tag>
              <Tag color={classificationInfo.color} style={{ borderRadius: 12 }}>
                {classificationInfo.label}
              </Tag>
              <Tag color="default" style={{ borderRadius: 12 }}>
                {data.letterType === 'incoming' ? '📥 ورودی' : data.letterType === 'outgoing' ? '📤 خروجی' : '📋 داخلی'}
              </Tag>
            </Space>
          </div>
          <Space>
            <Button icon={<RollbackOutlined />} onClick={() => navigate(-1)}>
              بازگشت
            </Button>
            {/* ✅ دکمه جدید: مدیریت ارجاعات */}
            <Button
              icon={<ShareAltOutlined />}
              onClick={() => navigate('/referrals')}
              size={isPhone ? 'small' : 'middle'}
            >
              {isPhone ? '' : 'مدیریت ارجاعات'}
            </Button>
            {getActionMenu().length > 0 && (
              <Dropdown
                menu={{ items: getActionMenu() }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Button type="primary" icon={<MoreOutlined />}>
                  عملیات
                </Button>
              </Dropdown>
            )}
          </Space>
        </div>

        {/* اطلاعات اصلی */}
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="middle" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="فرستنده">
            <Space>
              <Avatar icon={<UserOutlined />} />
              {data.sender?.fullName || data.senderName || 'نامشخص'}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="گیرنده">
            <Space>
              <Avatar icon={<UserOutlined />} />
              {data.receiver?.fullName || data.receiverName || 'نامشخص'}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="دبیرخانه">
            {data.secretariat?.name || 'نامشخص'}
          </Descriptions.Item>
          <Descriptions.Item label="تاریخ نامه">{toPersianDate(data.letterDate)}</Descriptions.Item>
          <Descriptions.Item label="تاریخ دریافت">{toPersianDate(data.receiveDate) || '-'}</Descriptions.Item>
          <Descriptions.Item label="تاریخ سررسید">
            {data.dueDate ? toPersianDate(data.dueDate) : <Tag color="default">نامحدود</Tag>}
          </Descriptions.Item>
        </Descriptions>

        {/* متن نامه */}
        <Card
          size="small"
          title="📄 متن نامه"
          style={{ marginBottom: 16, background: 'var(--bg-secondary)', borderRadius: 12 }}
        >
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
            {data.content || 'متن نامه وارد نشده است'}
          </div>
        </Card>

        {/* تب‌ها */}
        <Tabs defaultActiveKey="1" style={{ marginTop: 8 }}>
          <TabPane tab="📋 تاریخچه گردش کار" key="1">
            <LetterTimeline history={data.trackingHistory} />
          </TabPane>

          <TabPane tab={`📎 پیوست‌ها (${attachments.length})`} key="2">
            <LetterAttachments
              attachments={attachments}
              onUpload={handleUploadAttachment}
              onDelete={handleDeleteAttachment}
              onDownload={handleDownloadAttachment}
            />
          </TabPane>

          <TabPane tab={`💬 یادداشت‌ها (${memos.length})`} key="3">
            <LetterMemos
              memos={memos}
              onAdd={handleAddMemo}
              onDelete={handleDeleteMemo}
              onEdit={handleEditMemo}
              currentUser={JSON.parse(localStorage.getItem('user') || '{}')}
            />
          </TabPane>

          <TabPane tab={`✍️ امضاها (${signatures.length})`} key="4">
            {signatures.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Text type="secondary">هیچ امضایی ثبت نشده است</Text>
              </div>
            ) : (
              signatures.map((sig, index) => (
                <Card key={index} size="small" style={{ marginBottom: 8, borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <Avatar icon={<UserOutlined />} />
                      <div>
                        <div>{sig.signer?.fullName || sig.signer?.username || 'نامشخص'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {toPersianDate(sig.signedAt)}
                        </div>
                      </div>
                    </Space>
                    <Tag color={sig.status === 'verified' ? 'success' : sig.status === 'signed' ? 'processing' : 'warning'}>
                      {sig.status === 'verified' ? '✅ تأیید شده' : sig.status === 'signed' ? '✍️ امضا شده' : '⏳ در انتظار'}
                    </Tag>
                  </div>
                  {sig.imageSignature?.url && (
                    <div style={{ marginTop: 8 }}>
                      <img
                        src={sig.imageSignature.url}
                        alt="امضا"
                        style={{ maxHeight: 60, border: '1px solid #f0f0f0', borderRadius: 4 }}
                      />
                    </div>
                  )}
                </Card>
              ))
            )}
          </TabPane>
        </Tabs>
      </Card>

      {/* Modal عملیات */}
      <Modal
        title={
          modalType === 'register' ? 'ثبت نامه' :
          modalType === 'approve' ? 'تأیید نامه' :
          modalType === 'reject' ? 'رد نامه' :
          modalType === 'archive' ? 'بایگانی نامه' :
          modalType === 'send_review' ? 'ارسال برای پاراف' :
          modalType === 'send_sign' ? 'ارسال برای امضا' :
          'عملیات'
        }
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        okText={modalType === 'reject' ? 'رد' : 'تأیید'}
        cancelText="انصراف"
        okButtonProps={{ loading: actionLoading, danger: modalType === 'reject' }}
        width={isPhone ? '95%' : 500}
      >
        <Form form={form} layout="vertical">
          {(modalType === 'send_review' || modalType === 'send_sign') && (
            <Form.Item
              name={modalType === 'send_review' ? 'reviewerId' : 'signerId'}
              label={modalType === 'send_review' ? 'انتخاب پاراف‌کننده' : 'انتخاب امضاکننده'}
              rules={[{ required: true, message: 'لطفاً یک کاربر انتخاب کنید' }]}
            >
              <Select
                placeholder={modalType === 'send_review' ? 'پاراف‌کننده را انتخاب کنید' : 'امضاکننده را انتخاب کنید'}
                showSearch
                optionFilterProp="children"
                size="large"
              >
                {users.map((u) => (
                  <Option key={u._id} value={u._id}>
                    {u.fullName || u.username}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="comment"
            label="توضیحات"
            rules={[
              {
                required: modalType === 'reject',
                message: 'در صورت رد، توضیحات الزامی است',
              },
            ]}
          >
            <Input.TextArea rows={3} placeholder="توضیحات خود را وارد کنید..." />
          </Form.Item>

          {modalType === 'reject' && (
            <Text type="danger" style={{ fontSize: 12 }}>
              * توضیحات برای رد نامه الزامی است
            </Text>
          )}
        </Form>
      </Modal>
    </div>
  );
}

export default LetterDetail;
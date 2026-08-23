// frontend/src/components/letters/LetterForm.jsx
import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Typography,
  message,
  Spin,
  Space,
  DatePicker,
  Row,
  Col,
  Divider,
  Tag,
  Alert,
  App,
  Switch,
  Upload,
  Tabs,
} from 'antd';
import {
  SaveOutlined,
  RollbackOutlined,
  UploadOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  PlusOutlined,
  DeleteOutlined,
  PaperClipOutlined,
  SendOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import letterService from '../../services/letterService';
import { departmentService } from '../../services/letterApi';
import api from '../../services/api';
import LetterStatusBadge from './LetterStatusBadge';
import LetterAttachments from './LetterAttachments';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// =============================================
// تنظیمات اولیه
// =============================================
const LETTER_TYPES = [
  { value: 'incoming', label: 'ورودی', icon: '📥' },
  { value: 'outgoing', label: 'خروجی', icon: '📤' },
  { value: 'internal', label: 'داخلی', icon: '📋' },
];

const PRIORITIES = [
  { value: 'low', label: 'کم', color: '#8c8c8c' },
  { value: 'medium', label: 'متوسط', color: '#faad14' },
  { value: 'high', label: 'بالا', color: '#ff4d4f' },
  { value: 'urgent', label: 'فوری', color: '#ff4d4f' },
];

const CLASSIFICATIONS = [
  { value: 'normal', label: 'عادی', color: '#52c41a' },
  { value: 'confidential', label: 'محرمانه', color: '#faad14' },
  { value: 'secret', label: 'سری', color: '#ff4d4f' },
  { value: 'top_secret', label: 'بسیار سری', color: '#722ed1' },
];

function LetterForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [secretariats, setSecretariats] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  const [letterData, setLetterData] = useState(null);
  const [activeTab, setActiveTab] = useState('1');

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
      const [usersRes, deptRes, secretariatRes] = await Promise.all([
        api.get('/auth/users'),
        departmentService.getAll(),
        api.get('/secretariats'),
      ]);

      setUsers(usersRes.data.data || []);
      setDepartments(deptRes.data.data || []);
      setSecretariats(secretariatRes.data.data || []);

      if (id) {
        const letterRes = await letterService.getById(id);
        const letter = letterRes.data.data;
        setLetterData(letter);

        form.setFieldsValue({
          subject: letter.subject,
          content: letter.content,
          summary: letter.summary,
          letterType: letter.letterType,
          letterDate: letter.letterDate ? dayjs(letter.letterDate) : null,
          receiveDate: letter.receiveDate ? dayjs(letter.receiveDate) : null,
          dueDate: letter.dueDate ? dayjs(letter.dueDate) : null,
          priority: letter.priority || 'medium',
          classification: letter.classification || 'normal',
          secretariat: letter.secretariat?._id || letter.secretariat,
          sender: letter.sender?._id || letter.sender,
          senderName: letter.senderName || '',
          senderOrganization: letter.senderOrganization || '',
          senderDepartment: letter.senderDepartment?._id || letter.senderDepartment,
          receiver: letter.receiver?._id || letter.receiver,
          receiverName: letter.receiverName || '',
          receiverOrganization: letter.receiverOrganization || '',
          receiverDepartment: letter.receiverDepartment?._id || letter.receiverDepartment,
        });

        setAttachments(letter.attachments || []);
      }
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      console.error('❌ خطا در fetchData:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleUploadAttachment = async (file) => {
    try {
      message.success(`فایل "${file.name}" با موفقیت آپلود شد`);
    } catch (error) {
      message.error('خطا در آپلود فایل');
      throw error;
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      setAttachments(attachments.filter((att) => att._id !== attachmentId));
      message.success('پیوست با موفقیت حذف شد');
    } catch (error) {
      message.error('خطا در حذف پیوست');
    }
  };

  const handleDownloadAttachment = async (attachmentId, fileName) => {
    try {
      message.success(`دانلود "${fileName}" شروع شد`);
    } catch (error) {
      message.error('خطا در دانلود فایل');
    }
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        letterDate: values.letterDate?.toISOString(),
        receiveDate: values.receiveDate?.toISOString(),
        dueDate: values.dueDate?.toISOString(),
        attachments: attachments.map((att) => att._id),
      };

      let response;
      if (id) {
        response = await letterService.update(id, payload);
        message.success('نامه با موفقیت ویرایش شد');
      } else {
        response = await letterService.create(payload);
        message.success('نامه با موفقیت ثبت شد');
      }

      navigate(`/letters/${response.data.data._id}`);
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ثبت نامه');
      console.error('❌ خطا در onFinish:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendForReview = async () => {
    try {
      const values = await form.validateFields();
      if (!id) {
        message.error('ابتدا نامه را ثبت کنید');
        return;
      }

      await letterService.sendForReview(id, 'USER_ID', 'ارسال برای پاراف');
      message.success('نامه برای پاراف ارسال شد');
      navigate(`/letters/${id}`);
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ارسال برای پاراف');
    }
  };

  // ✅ آیتم‌های تب‌ها
  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <FileTextOutlined /> اطلاعات اصلی
        </span>
      ),
      children: (
        <>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={16}>
              <Form.Item
                name="subject"
                label="موضوع نامه"
                rules={[{ required: true, message: 'موضوع نامه الزامی است' }]}
              >
                <Input placeholder="موضوع نامه را وارد کنید" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="letterType"
                label="نوع نامه"
                rules={[{ required: true, message: 'نوع نامه را انتخاب کنید' }]}
              >
                <Select placeholder="انتخاب نوع نامه" size="large">
                  {LETTER_TYPES.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="letterDate"
                label="تاریخ نامه"
                rules={[{ required: true, message: 'تاریخ نامه را انتخاب کنید' }]}
              >
                <DatePicker
                  placeholder="انتخاب تاریخ"
                  size="large"
                  style={{ width: '100%' }}
                  format="YYYY/MM/DD"
                  suffixIcon={<CalendarOutlined />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="dueDate" label="تاریخ سررسید">
                <DatePicker
                  placeholder="انتخاب تاریخ سررسید"
                  size="large"
                  style={{ width: '100%' }}
                  format="YYYY/MM/DD"
                  suffixIcon={<CalendarOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="priority" label="اولویت">
                <Select placeholder="انتخاب اولویت" size="large">
                  {PRIORITIES.map((p) => (
                    <Option key={p.value} value={p.value}>
                      <Tag color={p.color} style={{ borderRadius: 12 }}>
                        {p.label}
                      </Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="classification" label="سطح دسترسی">
                <Select placeholder="انتخاب سطح دسترسی" size="large">
                  {CLASSIFICATIONS.map((c) => (
                    <Option key={c.value} value={c.value}>
                      <Tag color={c.color} style={{ borderRadius: 12 }}>
                        {c.label}
                      </Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="secretariat" label="دبیرخانه">
            <Select placeholder="انتخاب دبیرخانه" size="large" allowClear>
              {secretariats.map((s) => (
                <Option key={s._id} value={s._id}>
                  {s.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="content" label="متن نامه">
            <TextArea rows={8} placeholder="متن کامل نامه را وارد کنید" size="large" />
          </Form.Item>

          <Form.Item name="summary" label="خلاصه">
            <TextArea rows={3} placeholder="خلاصه نامه (اختیاری)" size="large" />
          </Form.Item>
        </>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <UserOutlined /> فرستنده و گیرنده
        </span>
      ),
      children: (
        <>
          <Divider orientation="right">👤 فرستنده</Divider>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="sender" label="کاربر فرستنده">
                <Select
                  placeholder="انتخاب کاربر"
                  allowClear
                  size="large"
                  showSearch
                  optionFilterProp="children"
                >
                  {users.map((u) => (
                    <Option key={u._id} value={u._id}>
                      {u.fullName || u.username}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="senderName" label="نام فرستنده (دستی)">
                <Input placeholder="نام فرستنده" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="senderOrganization" label="سازمان فرستنده">
                <Input placeholder="سازمان فرستنده" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="senderDepartment" label="واحد فرستنده">
                <Select placeholder="انتخاب واحد" allowClear size="large">
                  {departments.map((d) => (
                    <Option key={d._id} value={d._id}>
                      {d.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="right">👤 گیرنده</Divider>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="receiver" label="کاربر گیرنده">
                <Select
                  placeholder="انتخاب کاربر"
                  allowClear
                  size="large"
                  showSearch
                  optionFilterProp="children"
                >
                  {users.map((u) => (
                    <Option key={u._id} value={u._id}>
                      {u.fullName || u.username}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="receiverName" label="نام گیرنده (دستی)">
                <Input placeholder="نام گیرنده" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="receiverOrganization" label="سازمان گیرنده">
                <Input placeholder="سازمان گیرنده" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="receiverDepartment" label="واحد گیرنده">
                <Select placeholder="انتخاب واحد" allowClear size="large">
                  {departments.map((d) => (
                    <Option key={d._id} value={d._id}>
                      {d.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="receiveDate" label="تاریخ دریافت">
            <DatePicker
              placeholder="انتخاب تاریخ دریافت"
              size="large"
              style={{ width: '100%' }}
              format="YYYY/MM/DD"
              suffixIcon={<CalendarOutlined />}
            />
          </Form.Item>
        </>
      ),
    },
    {
      key: '3',
      label: (
        <span>
          <PaperClipOutlined /> پیوست‌ها ({attachments.length})
        </span>
      ),
      children: (
        <>
          {id ? (
            <LetterAttachments
              attachments={attachments}
              onUpload={handleUploadAttachment}
              onDelete={handleDeleteAttachment}
              onDownload={handleDownloadAttachment}
            />
          ) : (
            <Alert
              message="ابتدا نامه را ثبت کنید"
              description="برای آپلود پیوست، ابتدا نامه را ثبت کنید سپس پیوست‌ها را اضافه کنید"
              type="info"
              showIcon
            />
          )}
        </>
      ),
    },
  ];

  if (loading) {
    return (
      <Card style={{ borderRadius: 'var(--radius)' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>در حال بارگذاری...</div>
        </div>
      </Card>
    );
  }

  const isDraft = letterData?.status === 'draft' || !id;
  const isRegistered = letterData?.status === 'registered';
  const isInReview = letterData?.status === 'in_review';

  return (
    <div className="fade-in">
      <Card style={{ borderRadius: 'var(--radius)' }}>
        {/* هدر */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <Title level={isPhone ? 4 : isMobile ? 3 : 2} style={{ margin: 0 }}>
              {id ? '✏️ ویرایش نامه' : '➕ ثبت نامه جدید'}
            </Title>
            {id && letterData && (
              <Space style={{ marginTop: 4 }}>
                <Text type="secondary">شماره: {letterData.number || '---'}</Text>
                <LetterStatusBadge status={letterData.status} />
                {letterData.priority === 'urgent' && (
                  <Tag color="red" style={{ borderRadius: 12 }}>
                    🔴 فوری
                  </Tag>
                )}
                {letterData.classification !== 'normal' && (
                  <Tag color="purple" style={{ borderRadius: 12 }}>
                    🔐 {CLASSIFICATIONS.find((c) => c.value === letterData.classification)?.label}
                  </Tag>
                )}
              </Space>
            )}
          </div>
          <Space>
            <Button icon={<RollbackOutlined />} onClick={() => navigate(-1)}>
              بازگشت
            </Button>
            {id && isDraft && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => form.submit()}
                loading={submitting}
              >
                ذخیره
              </Button>
            )}
            {id && isRegistered && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendForReview}
              >
                ارسال برای پاراف
              </Button>
            )}
          </Space>
        </div>

        {/* هشدار وضعیت */}
        {id && !isDraft && (
          <Alert
            message={`نامه در وضعیت "${letterData?.getStatusLabel?.() || letterData?.status}" می‌باشد`}
            description="فقط نامه‌های در وضعیت پیش‌نویس قابل ویرایش هستند"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            letterType: 'incoming',
            priority: 'medium',
            classification: 'normal',
          }}
          disabled={id && !isDraft}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
          />

          <Divider />

          <Form.Item>
            <Space size="middle" wrap>
              {(!id || isDraft) && (
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={submitting}
                  size="large"
                >
                  {id ? 'ذخیره تغییرات' : 'ثبت نامه'}
                </Button>
              )}
              {id && isDraft && (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendForReview}
                  size="large"
                  style={{ background: '#52c41a' }}
                >
                  ثبت و ارسال برای پاراف
                </Button>
              )}
              <Button
                icon={<RollbackOutlined />}
                onClick={() => navigate(-1)}
                size="large"
              >
                بازگشت
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default LetterForm;
// src/components/webhooks/WebhookForm.jsx
import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  message,
  Spin,
  Space,
  Select,
  Switch,
  InputNumber,
  Divider,
  Row,
  Col,
  Tag,
  Alert,
  App,
} from 'antd';
import {
  SaveOutlined,
  RollbackOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import webhookService from '../../services/webhookService';

const { Title, Text } = Typography;
const { Option } = Select;

// =============================================
// رویدادهای پشتیبانی‌شده
// =============================================
const EVENT_OPTIONS = [
  { value: 'letter.created', label: 'نامه ایجاد شد', icon: '📄' },
  { value: 'letter.updated', label: 'نامه ویرایش شد', icon: '✏️' },
  { value: 'letter.registered', label: 'نامه ثبت شد', icon: '📋' },
  { value: 'letter.approved', label: 'نامه تأیید شد', icon: '✅' },
  { value: 'letter.rejected', label: 'نامه رد شد', icon: '❌' },
  { value: 'letter.signed', label: 'نامه امضا شد', icon: '✍️' },
  { value: 'letter.archived', label: 'نامه بایگانی شد', icon: '📁' },
  { value: 'referral.created', label: 'ارجاع ایجاد شد', icon: '📤' },
  { value: 'referral.actioned', label: 'ارجاع اقدام شد', icon: '✅' },
  { value: 'signature.created', label: 'درخواست امضا', icon: '🔐' },
  { value: 'signature.verified', label: 'امضا تأیید شد', icon: '✅' },
  { value: 'fax.received', label: 'فکس دریافت شد', icon: '📠' },
  { value: 'fax.sent', label: 'فکس ارسال شد', icon: '📤' },
  { value: 'email.received', label: 'ایمیل دریافت شد', icon: '📧' },
  { value: 'email.sent', label: 'ایمیل ارسال شد', icon: '📨' },
  { value: 'report.generated', label: 'گزارش تولید شد', icon: '📊' },
  { value: 'user.created', label: 'کاربر ایجاد شد', icon: '👤' },
  { value: 'user.updated', label: 'کاربر ویرایش شد', icon: '✏️' },
  { value: 'system.error', label: 'خطای سیستم', icon: '⚠️' },
  { value: 'system.backup', label: 'پشتیبان‌گیری', icon: '💾' },
];

// =============================================
// روش‌های احراز هویت
// =============================================
const AUTH_TYPES = [
  { value: 'none', label: 'بدون احراز هویت' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'api_key', label: 'API Key' },
];

function WebhookForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authType, setAuthType] = useState('none');
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
  // دریافت اطلاعات
  // =============================================
  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await webhookService.getById(id);
      const data = res.data.data;
      form.setFieldsValue({
        name: data.name,
        url: data.url,
        events: data.events,
        authType: data.auth?.type || 'none',
        authUsername: data.auth?.username || '',
        authPassword: data.auth?.password || '',
        authToken: data.auth?.token || '',
        authApiKey: data.auth?.apiKey || '',
        authApiKeyHeader: data.auth?.apiKeyHeader || 'X-API-Key',
        retryCount: data.settings?.retryCount || 3,
        retryDelay: data.settings?.retryDelay || 1000,
        timeout: data.settings?.timeout || 5000,
        active: data.settings?.active !== undefined ? data.settings.active : true,
      });
      setAuthType(data.auth?.type || 'none');
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      navigate('/webhooks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // =============================================
  // ذخیره
  // =============================================
  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name,
        url: values.url,
        events: values.events,
        auth: {
          type: values.authType || 'none',
          username: values.authUsername || '',
          password: values.authPassword || '',
          token: values.authToken || '',
          apiKey: values.authApiKey || '',
          apiKeyHeader: values.authApiKeyHeader || 'X-API-Key',
        },
        settings: {
          retryCount: values.retryCount || 3,
          retryDelay: values.retryDelay || 1000,
          timeout: values.timeout || 5000,
          active: values.active !== undefined ? values.active : true,
        },
      };

      if (id) {
        await webhookService.update(id, payload);
        message.success('وب‌هوک با موفقیت ویرایش شد');
      } else {
        await webhookService.create(payload);
        message.success('وب‌هوک با موفقیت ایجاد شد');
      }
      navigate('/webhooks');
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ذخیره');
    } finally {
      setSubmitting(false);
    }
  };

  // =============================================
  // بارگذاری
  // =============================================
  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>در حال بارگذاری...</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="fade-in">
      <Card style={{ borderRadius: 'var(--radius)' }}>
        <Title level={isPhone ? 4 : isMobile ? 3 : 2} style={{ marginBottom: 24 }}>
          {id ? '✏️ ویرایش وب‌هوک' : '➕ وب‌هوک جدید'}
        </Title>

        <Alert
          message="وب‌هوک چیست؟"
          description="وب‌هوک به سیستم‌های خارجی اجازه می‌دهد تا رویدادهای سیستم را دریافت کنند. با ایجاد وب‌هوک، می‌توانید سیستم خود را با سایر سرویس‌ها یکپارچه کنید."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="نام وب‌هوک"
                rules={[{ required: true, message: 'نام وب‌هوک را وارد کنید' }]}
              >
                <Input placeholder="مثلاً: ارسال به تلگرام" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="url"
                label="آدرس وب‌هوک"
                rules={[{ required: true, message: 'آدرس وب‌هوک را وارد کنید' }]}
              >
                <Input placeholder="https://example.com/webhook" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="events"
            label="رویدادها"
            rules={[{ required: true, message: 'حداقل یک رویداد انتخاب کنید' }]}
          >
            <Select
              mode="multiple"
              placeholder="انتخاب رویدادها"
              size="large"
              optionFilterProp="children"
              maxTagCount="responsive"
            >
              {EVENT_OPTIONS.map((event) => (
                <Option key={event.value} value={event.value}>
                  {event.icon} {event.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider>🔐 تنظیمات احراز هویت</Divider>

          <Form.Item name="authType" label="نوع احراز هویت" initialValue="none">
            <Select size="large" onChange={setAuthType}>
              {AUTH_TYPES.map((type) => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {authType === 'basic' && (
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item name="authUsername" label="نام کاربری">
                  <Input placeholder="نام کاربری" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="authPassword" label="رمز عبور">
                  <Input.Password placeholder="رمز عبور" size="large" />
                </Form.Item>
              </Col>
            </Row>
          )}

          {authType === 'bearer' && (
            <Form.Item name="authToken" label="توکن">
              <Input.TextArea rows={2} placeholder="توکن Bearer" size="large" />
            </Form.Item>
          )}

          {authType === 'api_key' && (
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item name="authApiKey" label="کلید API">
                  <Input placeholder="API Key" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="authApiKeyHeader" label="نام هدر" initialValue="X-API-Key">
                  <Input placeholder="X-API-Key" size="large" />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Divider>⚙️ تنظیمات پیشرفته</Divider>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={8}>
              <Form.Item name="retryCount" label="تعداد تلاش مجدد" initialValue={3}>
                <InputNumber min={0} max={10} style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="retryDelay" label="تأخیر بین تلاش‌ها (میلی‌ثانیه)" initialValue={1000}>
                <InputNumber min={100} max={10000} step={100} style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="timeout" label="زمان انتظار (میلی‌ثانیه)" initialValue={5000}>
                <InputNumber min={1000} max={30000} step={500} style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="active" label="فعال" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space size="middle">
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={submitting}
                size="large"
              >
                {id ? 'ویرایش' : 'ایجاد'}
              </Button>
              <Button
                icon={<RollbackOutlined />}
                onClick={() => navigate('/webhooks')}
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

export default WebhookForm;
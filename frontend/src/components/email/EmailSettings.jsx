// src/components/email/EmailSettings.jsx
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
  Switch,
  Divider,
  Row,
  Col,
  Alert,
  App,
  Tag,
  InputNumber,
} from 'antd';
import {
  SaveOutlined,
  RollbackOutlined,
  MailOutlined,
  LockOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import emailService from '../../services/emailService';
import api from '../../services/api';

const { Title, Text } = Typography;

function EmailSettings() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
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
  // دریافت تنظیمات
  // =============================================
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await emailService.getSettings();
      const data = res.data.data || {};
      form.setFieldsValue({
        smtpHost: data.smtpHost || '',
        smtpPort: data.smtpPort || 587,
        smtpUser: data.smtpUser || '',
        smtpPass: data.smtpPass || '',
        smtpSecure: data.smtpSecure || false,
        imapHost: data.imapHost || '',
        imapPort: data.imapPort || 993,
        imapUser: data.imapUser || '',
        imapPass: data.imapPass || '',
        imapSecure: data.imapSecure || true,
        autoReceive: data.autoReceive || false,
        receiveInterval: data.receiveInterval || 5,
        defaultSubject: data.defaultSubject || '',
        signature: data.signature || '',
      });
    } catch (error) {
      message.error('خطا در دریافت تنظیمات ایمیل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // =============================================
  // ذخیره تنظیمات
  // =============================================
  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      await emailService.updateSettings(values);
      message.success('تنظیمات ایمیل با موفقیت ذخیره شد');
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ذخیره تنظیمات');
    } finally {
      setSubmitting(false);
    }
  };

  // =============================================
  // تست اتصال
  // =============================================
  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await emailService.testConnection();
      setTestResult({ success: true, message: 'اتصال با موفقیت برقرار شد' });
      message.success('اتصال با موفقیت برقرار شد');
    } catch (error) {
      setTestResult({ success: false, message: error.response?.data?.error || 'خطا در اتصال' });
      message.error(error.response?.data?.error || 'خطا در اتصال');
    } finally {
      setTesting(false);
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
          <div style={{ marginTop: 16 }}>در حال بارگذاری تنظیمات...</div>
        </div>
      </Card>
    );
  }

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
          <Title level={isPhone ? 4 : isMobile ? 3 : 2} style={{ margin: 0 }}>
            ✉️ تنظیمات ایمیل
          </Title>
          <Space>
            <Button
              icon={<RollbackOutlined />}
              onClick={() => navigate(-1)}
            >
              بازگشت
            </Button>
          </Space>
        </div>

        <Alert
          message="تنظیمات اتصال به ایمیل"
          description="برای اتصال به سرویس ایمیل سازمانی، تنظیمات SMTP و IMAP را وارد کنید."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* تست اتصال */}
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<GlobalOutlined />}
              onClick={handleTestConnection}
              loading={testing}
            >
              تست اتصال
            </Button>
            {testResult && (
              <Tag
                color={testResult.success ? 'success' : 'error'}
                icon={testResult.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              >
                {testResult.message}
              </Tag>
            )}
          </Space>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* ============================================= */}
          {/* تنظیمات SMTP (ارسال) */}
          {/* ============================================= */}
          <Divider orientation="right">📤 تنظیمات SMTP (ارسال ایمیل)</Divider>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="smtpHost"
                label="آدرس سرور SMTP"
                rules={[{ required: true, message: 'آدرس سرور SMTP را وارد کنید' }]}
              >
                <Input placeholder="smtp.gmail.com" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="smtpPort"
                label="پورت SMTP"
                rules={[{ required: true, message: 'پورت SMTP را وارد کنید' }]}
              >
                <InputNumber min={1} max={65535} style={{ width: '100%' }} size="large" placeholder="587" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="smtpUser"
                label="نام کاربری SMTP"
                rules={[{ required: true, message: 'نام کاربری SMTP را وارد کنید' }]}
              >
                <Input prefix={<MailOutlined />} placeholder="user@example.com" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="smtpPass"
                label="رمز عبور SMTP"
                rules={[{ required: true, message: 'رمز عبور SMTP را وارد کنید' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="رمز عبور" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="smtpSecure" label="اتصال امن (SSL/TLS)" valuePropName="checked" initialValue={false}>
            <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" />
          </Form.Item>

          {/* ============================================= */}
          {/* تنظیمات IMAP (دریافت) */}
          {/* ============================================= */}
          <Divider orientation="right">📥 تنظیمات IMAP (دریافت ایمیل)</Divider>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="imapHost"
                label="آدرس سرور IMAP"
                rules={[{ required: true, message: 'آدرس سرور IMAP را وارد کنید' }]}
              >
                <Input placeholder="imap.gmail.com" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="imapPort"
                label="پورت IMAP"
                rules={[{ required: true, message: 'پورت IMAP را وارد کنید' }]}
              >
                <InputNumber min={1} max={65535} style={{ width: '100%' }} size="large" placeholder="993" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="imapUser"
                label="نام کاربری IMAP"
                rules={[{ required: true, message: 'نام کاربری IMAP را وارد کنید' }]}
              >
                <Input prefix={<MailOutlined />} placeholder="user@example.com" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="imapPass"
                label="رمز عبور IMAP"
                rules={[{ required: true, message: 'رمز عبور IMAP را وارد کنید' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="رمز عبور" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="imapSecure" label="اتصال امن (SSL/TLS)" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" />
          </Form.Item>

          {/* ============================================= */}
          {/* تنظیمات دریافت خودکار */}
          {/* ============================================= */}
          <Divider orientation="right">⚙️ تنظیمات دریافت خودکار</Divider>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="autoReceive" label="دریافت خودکار ایمیل‌ها" valuePropName="checked">
                <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="receiveInterval" label="فاصله زمانی بررسی (دقیقه)" initialValue={5}>
                <InputNumber min={1} max={60} style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
          </Row>

          {/* ============================================= */}
          {/* تنظیمات پیشرفته */}
          {/* ============================================= */}
          <Divider orientation="right">📝 تنظیمات پیشرفته</Divider>

          <Form.Item name="defaultSubject" label="موضوع پیش‌فرض برای ایمیل‌های دریافتی">
            <Input placeholder="ایمیل دریافتی - {subject}" size="large" />
          </Form.Item>

          <Form.Item name="signature" label="امضای پیش‌فرض">
            <Input.TextArea rows={3} placeholder="با احترام، ..." size="large" />
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
                ذخیره تنظیمات
              </Button>
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

export default EmailSettings;
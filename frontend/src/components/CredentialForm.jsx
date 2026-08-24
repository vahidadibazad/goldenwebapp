// frontend/src/components/CredentialForm.jsx
import { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, Typography, Spin, App } from 'antd';
import { SaveOutlined, RollbackOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const { Title } = Typography;
const { Option } = Select;

function CredentialForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp(); // ✅ اصلاح شده
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hardwareOptions, setHardwareOptions] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    api
      .get('/hardware')
      .then((res) => setHardwareOptions(res.data.data || []))
      .catch(() => message.error('خطا در دریافت لیست سخت‌افزارها'));

    if (id) {
      setLoading(true);
      api
        .get(`/credentials/${id}`)
        .then((res) => {
          const data = res.data.data;
          form.setFieldsValue({
            systemName: data.systemName,
            username: data.username,
            password: data.password,
            link: data.link || '',
            hardware: data.hardware?._id || data.hardware || null,
            accessLevel: data.accessLevel || 'all',
            description: data.description || '',
          });
        })
        .catch(() => message.error('خطا در دریافت اطلاعات'))
        .finally(() => setLoading(false));
    }
  }, [id, form, message]);

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      if (id) {
        await api.put(`/credentials/${id}`, values);
        message.success('رمز با موفقیت ویرایش شد');
      } else {
        await api.post('/credentials', values);
        message.success('رمز با موفقیت ثبت شد');
      }
      navigate('/credentials');
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ثبت');
    } finally {
      setSubmitting(false);
    }
  };

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
        <Title level={2} style={{ marginBottom: 24 }}>
          {id ? '✏️ ویرایش رمز عبور' : '➕ ثبت رمز عبور جدید'}
        </Title>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? 8 : 16,
            }}
          >
            <Form.Item
              name="systemName"
              label="نام سیستم"
              rules={[{ required: true, message: 'نام سیستم را وارد کنید' }]}
            >
              <Input placeholder="نام سیستم" size={isMobile ? 'small' : 'middle'} />
            </Form.Item>

            <Form.Item
              name="username"
              label="نام کاربری"
              rules={[{ required: true, message: 'نام کاربری را وارد کنید' }]}
            >
              <Input placeholder="نام کاربری" size={isMobile ? 'small' : 'middle'} />
            </Form.Item>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? 8 : 16,
            }}
          >
            <Form.Item
              name="password"
              label="رمز عبور"
              rules={[{ required: true, message: 'رمز عبور را وارد کنید' }]}
            >
              <Input.Password placeholder="رمز عبور" size={isMobile ? 'small' : 'middle'} />
            </Form.Item>

            <Form.Item name="link" label="لینک دسترسی">
              <Input placeholder="https://example.com" size={isMobile ? 'small' : 'middle'} />
            </Form.Item>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? 8 : 16,
            }}
          >
            <Form.Item name="hardware" label="سخت‌افزار مرتبط">
              <Select placeholder="انتخاب سخت‌افزار (اختیاری)" size={isMobile ? 'small' : 'middle'} allowClear>
                {hardwareOptions.map((h) => (
                  <Option key={h._id} value={h._id}>
                    {h.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="accessLevel"
              label="سطح دسترسی"
              rules={[{ required: true, message: 'سطح دسترسی را انتخاب کنید' }]}
            >
              <Select placeholder="انتخاب سطح دسترسی" size={isMobile ? 'small' : 'middle'}>
                <Option value="admin">مدیران</Option>
                <Option value="network">مدیران شبکه</Option>
                <Option value="support">پشتیبانی</Option>
                <Option value="all">همه</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="description" label="توضیحات">
            <Input.TextArea rows={3} placeholder="توضیحات اختیاری" size={isMobile ? 'small' : 'middle'} />
          </Form.Item>

          <Form.Item style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={submitting}
                size={isMobile ? 'small' : 'middle'}
              >
                {id ? 'ویرایش' : 'ثبت'}
              </Button>
              <Button
                icon={<RollbackOutlined />}
                onClick={() => navigate('/credentials')}
                size={isMobile ? 'small' : 'middle'}
              >
                بازگشت
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default CredentialForm;
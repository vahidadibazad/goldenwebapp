import { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { SaveOutlined, RollbackOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const { Title } = Typography;

function ChangePassword() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('رمز عبور جدید و تأیید آن مطابقت ندارند');
      return;
    }

    setSubmitting(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('رمز عبور با موفقیت تغییر کرد');
      navigate('/');
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در تغییر رمز');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <Title level={2}>🔑 تغییر رمز عبور</Title>
      
      {/* ============================================= */}
      {/* ✅ اصلاح: فرم با Input ساده */}
      {/* ============================================= */}
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 500 }}>
        <Form.Item name="currentPassword" label="رمز عبور فعلی" rules={[{ required: true, message: 'رمز فعلی را وارد کنید' }]}>
          <Input.Password placeholder="رمز عبور فعلی" />
        </Form.Item>

        <Form.Item name="newPassword" label="رمز عبور جدید" rules={[{ required: true, message: 'رمز جدید را وارد کنید' }]}>
          <Input.Password placeholder="رمز عبور جدید (حداقل ۶ کاراکتر)" />
        </Form.Item>

        <Form.Item name="confirmPassword" label="تأیید رمز عبور" rules={[{ required: true, message: 'رمز را تأیید کنید' }]}>
          <Input.Password placeholder="رمز عبور جدید را دوباره وارد کنید" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting}>
            تغییر رمز عبور
          </Button>
          <Button style={{ marginRight: 8 }} icon={<RollbackOutlined />} onClick={() => navigate('/')}>
            بازگشت
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default ChangePassword;
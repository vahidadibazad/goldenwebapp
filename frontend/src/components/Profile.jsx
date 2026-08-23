// frontend/src/components/Profile.jsx
import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, message, Spin, Space, App } from 'antd';
import { SaveOutlined, RollbackOutlined, SwapOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const { Title } = Typography;

function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        fullName: user.fullName,
        email: user.email,
        username: user.username,
      });
    }
  }, [user, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        fullName: values.fullName,
        email: values.email,
      };

      const res = await api.put('/auth/profile', payload);
      const updatedUser = res.data.data;
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      message.success('اطلاعات با موفقیت به‌روزرسانی شد');
      navigate('/');
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در به‌روزرسانی');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ borderRadius: 'var(--radius)' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <Title level={isPhone ? 4 : isMobile ? 3 : 2} style={{ margin: 0 }}>
          👤 پروفایل کاربری
        </Title>
        <Space>
          {/* ✅ دکمه جدید: تفویض اختیار */}
          <Button 
            icon={<SwapOutlined />} 
            onClick={() => navigate('/delegation')}
            size={isPhone ? 'small' : 'middle'}
          >
            تفویض اختیار
          </Button>
          <Button 
            icon={<RollbackOutlined />} 
            onClick={() => navigate('/')}
            size={isPhone ? 'small' : 'middle'}
          >
            بازگشت
          </Button>
        </Space>
      </div>
      
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 500 }}>
        <Form.Item 
          name="fullName" 
          label="نام کامل"
          rules={[{ required: true, message: 'نام کامل را وارد کنید' }]}
        >
          <Input placeholder="نام کامل خود را وارد کنید" size={isMobile ? 'small' : 'middle'} />
        </Form.Item>

        <Form.Item 
          name="email" 
          label="ایمیل" 
          rules={[
            { required: true, message: 'ایمیل را وارد کنید' },
            { type: 'email', message: 'ایمیل معتبر وارد کنید' }
          ]}
        >
          <Input placeholder="ایمیل خود را وارد کنید" size={isMobile ? 'small' : 'middle'} />
        </Form.Item>

        <Form.Item name="username" label="نام کاربری">
          <Input disabled style={{ background: '#f5f5f5' }} size={isMobile ? 'small' : 'middle'} />
        </Form.Item>

        <Form.Item>
          <Space size="middle">
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SaveOutlined />} 
              loading={loading}
              size={isMobile ? 'small' : 'middle'}
            >
              ذخیره تغییرات
            </Button>
            <Button 
              icon={<RollbackOutlined />} 
              onClick={() => navigate('/')}
              size={isMobile ? 'small' : 'middle'}
            >
              بازگشت
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default Profile;
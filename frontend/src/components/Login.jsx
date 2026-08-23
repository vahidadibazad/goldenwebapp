import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;

function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { user, setUser } = useAuth();

  // ✅ اگر کاربر لاگین است، به داشبورد برود
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const onFinish = async (values) => {
    if (loading) return; // جلوگیری از ارسال مجدد
    
    setLoading(true);
    try {
      const res = await api.post('/auth/login', values);
      const { user, token } = res.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      message.success('✅ ورود موفق');
      navigate('/');
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ورود');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: '16px', 
      background: 'linear-gradient(135deg, #1677ff 0%, #1677ffdd 100%)' 
    }}>
      <Card style={{ 
        width: 400, 
        maxWidth: '92%', 
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)', 
        borderRadius: 16 
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏢</div>
          <Title level={2} style={{ marginBottom: 0 }}>مدیریت IT</Title>
          <Typography.Text type="secondary">وارد حساب کاربری خود شوید</Typography.Text>
        </div>

        <Form name="login" onFinish={onFinish} size="large" layout="vertical">
          <Form.Item name="username" rules={[{ required: true, message: 'نام کاربری را وارد کنید' }]}>
            <Input prefix={<UserOutlined />} placeholder="نام کاربری" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'رمز عبور را وارد کنید' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="رمز عبور" />
          </Form.Item>
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={loading}
              disabled={loading}
            >
              ورود به سیستم
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default Login;
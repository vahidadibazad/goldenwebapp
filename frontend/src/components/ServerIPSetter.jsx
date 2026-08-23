import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { getServerIP, setServerIP, CONFIG } from '../config';

const { Title, Text } = Typography;

function ServerIPSetter() {
  const [currentIP, setCurrentIP] = useState('');

  useEffect(() => {
    setCurrentIP(getServerIP());
  }, []);

  const onFinish = (values) => {
    const newIP = values.serverIP.trim();
    if (!newIP) {
      message.error('لطفاً یک IP معتبر وارد کنید');
      return;
    }
    setServerIP(newIP);
    message.success(`آدرس IP به ${newIP} تغییر یافت. صفحه در حال بارگذاری مجدد...`);
  };

  return (
    <Card style={{ maxWidth: 500, margin: '40px auto' }}>
      <Title level={3}>⚙️ تنظیمات اتصال به سرور</Title>
      <Text type="secondary">
        آدرس IP فعلی: <strong>{currentIP || 'تعیین نشده'}</strong>
      </Text>
      <br />
      <Text type="secondary" style={{ fontSize: 12 }}>
        پورت: {CONFIG.PORT}
      </Text>

      <Form onFinish={onFinish} layout="vertical" style={{ marginTop: 20 }}>
        <Form.Item
          name="serverIP"
          label="آدرس IP سرور بک‌اند"
          rules={[{ required: true, message: 'IP سرور را وارد کنید' }]}
          initialValue={currentIP}
        >
          <Input placeholder="مثلاً: 192.168.1.100" />
        </Form.Item>

        <Button type="primary" htmlType="submit" block>
          ذخیره و بارگذاری مجدد
        </Button>
      </Form>

      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 16 }}>
        💡 پس از تغییر IP، صفحه به‌طور خودکار بارگذاری مجدد می‌شود.
      </Text>
    </Card>
  );
}

export default ServerIPSetter;
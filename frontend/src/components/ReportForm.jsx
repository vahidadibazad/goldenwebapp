import { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Select, DatePicker, Space } from 'antd';
import { SaveOutlined, RollbackOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const { Title } = Typography;
const { Option } = Select;

function ReportForm() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      await api.post('/reports', values);
      message.success('گزارش با موفقیت ایجاد شد');
      navigate('/reports');
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ایجاد گزارش');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in">
      <Card style={{ borderRadius: 'var(--radius)' }}>
        <Title level={2} style={{ marginBottom: 24 }}>
          📊 ایجاد گزارش جدید
        </Title>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="name"
            label="نام گزارش"
            rules={[{ required: true, message: 'نام گزارش را وارد کنید' }]}
          >
            <Input placeholder="مثلاً: گزارش عملکرد ماهانه" />
          </Form.Item>

          <Form.Item
            name="type"
            label="نوع گزارش"
            rules={[{ required: true, message: 'نوع گزارش را انتخاب کنید' }]}
          >
            <Select placeholder="انتخاب نوع گزارش">
              <Option value="performance">عملکرد مکاتبات</Option>
              <Option value="delay">تأخیرات</Option>
              <Option value="volume">حجم مکاتبات</Option>
              <Option value="department">عملکرد واحدها</Option>
              <Option value="user">عملکرد کاربران</Option>
              <Option value="custom">سفارشی</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="category"
            label="دسته‌بندی"
            initialValue="monthly"
          >
            <Select>
              <Option value="daily">روزانه</Option>
              <Option value="weekly">هفتگی</Option>
              <Option value="monthly">ماهانه</Option>
              <Option value="quarterly">سه‌ماهه</Option>
              <Option value="yearly">ساله</Option>
              <Option value="custom">سفارشی</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="exportFormat"
            label="فرمت خروجی"
            initialValue="excel"
          >
            <Select>
              <Option value="excel">Excel</Option>
              <Option value="pdf">PDF</Option>
              <Option value="csv">CSV</Option>
              <Option value="json">JSON</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={submitting}
              >
                ایجاد گزارش
              </Button>
              <Button
                icon={<RollbackOutlined />}
                onClick={() => navigate('/reports')}
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

export default ReportForm;
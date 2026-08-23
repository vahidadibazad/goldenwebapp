import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Typography,
  Spin,
  App, // ✅ فقط App
} from 'antd';
import { SaveOutlined, RollbackOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const { Title } = Typography;
const { Option } = Select;

function TicketForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp(); // ✅ فقط از اینجا
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    api
      .get('/auth/users')
      .then((res) => setUsers(res.data.data || []))
      .catch(() => message.error('خطا در دریافت لیست کاربران'));

    if (id) {
      setLoading(true);
      api
        .get(`/tickets/${id}`)
        .then((res) => {
          const data = res.data.data;
          form.setFieldsValue({
            title: data.title,
            description: data.description,
            priority: data.priority || 'medium',
            status: data.status || 'open',
            assignedTo: data.assignedTo?._id || data.assignedTo || null,
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
        await api.put(`/tickets/${id}`, values);
        message.success('تیکت با موفقیت ویرایش شد');
      } else {
        await api.post('/tickets', values);
        message.success('تیکت با موفقیت ثبت شد');
      }
      navigate('/tickets');
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
          {id ? '✏️ ویرایش تیکت' : '➕ ثبت تیکت جدید'}
        </Title>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="title"
            label="عنوان"
            rules={[{ required: true, message: 'عنوان را وارد کنید' }]}
          >
            <Input placeholder="عنوان تیکت" size={isMobile ? 'small' : 'middle'} />
          </Form.Item>

          <Form.Item
            name="description"
            label="شرح"
            rules={[{ required: true, message: 'شرح را وارد کنید' }]}
          >
            <Input.TextArea rows={4} placeholder="شرح کامل مشکل" size={isMobile ? 'small' : 'middle'} />
          </Form.Item>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? 8 : 16,
            }}
          >
            <Form.Item
              name="priority"
              label="اولویت"
              rules={[{ required: true, message: 'اولویت را انتخاب کنید' }]}
            >
              <Select placeholder="انتخاب اولویت" size={isMobile ? 'small' : 'middle'}>
                <Option value="low">کم</Option>
                <Option value="medium">متوسط</Option>
                <Option value="high">بالا</Option>
                <Option value="urgent">فوری</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="status"
              label="وضعیت"
              rules={[{ required: true, message: 'وضعیت را انتخاب کنید' }]}
            >
              <Select placeholder="انتخاب وضعیت" size={isMobile ? 'small' : 'middle'}>
                <Option value="open">باز</Option>
                <Option value="in_progress">در حال بررسی</Option>
                <Option value="resolved">حل شده</Option>
                <Option value="closed">بسته</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="assignedTo" label="اختصاص به">
            <Select placeholder="انتخاب کاربر (اختیاری)" size={isMobile ? 'small' : 'middle'} allowClear>
              {users.map((u) => (
                <Option key={u._id} value={u._id}>
                  {u.fullName || u.username}
                </Option>
              ))}
            </Select>
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
                onClick={() => navigate('/tickets')}
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

export default TicketForm;
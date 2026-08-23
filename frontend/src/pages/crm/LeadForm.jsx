// frontend/src/pages/crm/LeadForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Row,
  Col,
  Divider,
  App,
} from 'antd';
import {
  SaveOutlined,
  RollbackOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  BankOutlined,
} from '@ant-design/icons';
import crmService from '../../services/crmService';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

function LeadForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
    if (id) {
      fetchLead();
    }
  }, [id]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data.data || []);
    } catch (error) {
      console.error('خطا در دریافت کاربران:', error);
    }
  };

  const fetchLead = async () => {
    setLoading(true);
    try {
      const res = await crmService.getLeadById(id);
      const data = res.data.data;
      form.setFieldsValue({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        mobile: data.mobile,
        company: data.company,
        jobTitle: data.jobTitle,
        industry: data.industry,
        annualRevenue: data.annualRevenue,
        employeeCount: data.employeeCount,
        leadSource: data.leadSource,
        rating: data.rating,
        leadStatus: data.leadStatus,
        description: data.description,
        assignedTo: data.assignedTo?._id || data.assignedTo,
        tags: data.tags,
      });
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      navigate('/crm/leads');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      if (id) {
        await crmService.updateLead(id, values);
        message.success('سرنخ با موفقیت ویرایش شد');
      } else {
        await crmService.createLead(values);
        message.success('سرنخ با موفقیت ایجاد شد');
      }
      navigate('/crm/leads');
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ذخیره');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="در حال بارگذاری..." />
      </div>
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
          <Title level={2} style={{ margin: 0 }}>
            {id ? '✏️ ویرایش سرنخ' : '➕ سرنخ جدید'}
          </Title>
          <Button icon={<RollbackOutlined />} onClick={() => navigate('/crm/leads')}>
            بازگشت
          </Button>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="firstName"
                label="نام"
                rules={[{ required: true, message: 'نام الزامی است' }]}
              >
                <Input placeholder="نام" prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="lastName"
                label="نام خانوادگی"
                rules={[{ required: true, message: 'نام خانوادگی الزامی است' }]}
              >
                <Input placeholder="نام خانوادگی" prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="ایمیل"
                rules={[
                  { required: true, message: 'ایمیل الزامی است' },
                  { type: 'email', message: 'ایمیل نامعتبر است' },
                ]}
              >
                <Input placeholder="ایمیل" prefix={<MailOutlined />} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="phone" label="تلفن">
                <Input placeholder="تلفن" prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="mobile" label="موبایل">
                <Input placeholder="موبایل" prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="company" label="شرکت">
                <Input placeholder="نام شرکت" prefix={<BankOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="jobTitle" label="عنوان شغلی">
                <Input placeholder="عنوان شغلی" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="industry" label="صنعت">
                <Input placeholder="صنعت" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="annualRevenue" label="درآمد سالانه">
                <Input type="number" placeholder="درآمد سالانه" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="employeeCount" label="تعداد کارمندان">
                <Input type="number" placeholder="تعداد کارمندان" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={8}>
              <Form.Item
                name="leadSource"
                label="منبع سرنخ"
                initialValue="website"
              >
                <Select placeholder="منبع سرنخ">
                  <Option value="website">وب‌سایت</Option>
                  <Option value="referral">معرفی</Option>
                  <Option value="cold_call">تماس سرد</Option>
                  <Option value="email">ایمیل</Option>
                  <Option value="social">شبکه اجتماعی</Option>
                  <Option value="ad">تبلیغات</Option>
                  <Option value="event">رویداد</Option>
                  <Option value="partner">شریک</Option>
                  <Option value="other">سایر</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="rating" label="امتیاز" initialValue="warm">
                <Select placeholder="امتیاز">
                  <Option value="hot">🔥 داغ</Option>
                  <Option value="warm">🌤️ گرم</Option>
                  <Option value="cold">❄️ سرد</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="leadStatus" label="وضعیت" initialValue="new">
                <Select placeholder="وضعیت">
                  <Option value="new">جدید</Option>
                  <Option value="contacted">تماس گرفته شده</Option>
                  <Option value="working">در حال پیگیری</Option>
                  <Option value="qualified">واجد شرایط</Option>
                  <Option value="converted">تبدیل شده</Option>
                  <Option value="lost">از دست رفته</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="توضیحات">
            <Input.TextArea rows={3} placeholder="توضیحات" />
          </Form.Item>

          <Form.Item name="assignedTo" label="تخصیص به">
            <Select placeholder="انتخاب کاربر" allowClear showSearch optionFilterProp="children">
              {users.map((u) => (
                <Option key={u._id} value={u._id}>
                  {u.fullName || u.username}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="tags" label="برچسب‌ها">
            <Select
              mode="tags"
              placeholder="برچسب‌ها را وارد کنید"
              tokenSeparators={[',']}
            />
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
                {id ? 'ویرایش' : 'ثبت'}
              </Button>
              <Button
                icon={<RollbackOutlined />}
                onClick={() => navigate('/crm/leads')}
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

export default LeadForm;



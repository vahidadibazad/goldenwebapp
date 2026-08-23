// frontend/src/pages/crm/AccountForm.jsx
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
  BankOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import crmService from '../../services/crmService';

const { Title, Text } = Typography;
const { Option } = Select;

function AccountForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAccount();
    }
  }, [id]);

  const fetchAccount = async () => {
    setLoading(true);
    try {
      const res = await crmService.getAccountById(id);
      const data = res.data.data;
      form.setFieldsValue({
        name: data.name,
        website: data.website,
        industry: data.industry,
        type: data.type,
        tier: data.tier,
        annualRevenue: data.annualRevenue,
        employeeCount: data.employeeCount,
        phone: data.phone,
        fax: data.fax,
        email: data.email,
        description: data.description,
        tags: data.tags,
        'billingAddress.street': data.billingAddress?.street,
        'billingAddress.city': data.billingAddress?.city,
        'billingAddress.state': data.billingAddress?.state,
        'billingAddress.postalCode': data.billingAddress?.postalCode,
        'billingAddress.country': data.billingAddress?.country,
        'shippingAddress.street': data.shippingAddress?.street,
        'shippingAddress.city': data.shippingAddress?.city,
        'shippingAddress.state': data.shippingAddress?.state,
        'shippingAddress.postalCode': data.shippingAddress?.postalCode,
        'shippingAddress.country': data.shippingAddress?.country,
      });
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      navigate('/crm/accounts');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      if (id) {
        await crmService.updateAccount(id, values);
        message.success('شرکت با موفقیت ویرایش شد');
      } else {
        await crmService.createAccount(values);
        message.success('شرکت با موفقیت ایجاد شد');
      }
      navigate('/crm/accounts');
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
            {id ? '✏️ ویرایش شرکت' : '➕ شرکت جدید'}
          </Title>
          <Button icon={<RollbackOutlined />} onClick={() => navigate('/crm/accounts')}>
            بازگشت
          </Button>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="نام شرکت"
                rules={[{ required: true, message: 'نام شرکت الزامی است' }]}
              >
                <Input placeholder="نام شرکت" prefix={<BankOutlined />} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="website" label="وب‌سایت">
                <Input placeholder="https://example.com" prefix={<GlobalOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="industry" label="صنعت">
                <Input placeholder="صنعت" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="type" label="نوع شرکت" initialValue="customer">
                <Select placeholder="نوع شرکت">
                  <Option value="customer">مشتری</Option>
                  <Option value="partner">شریک</Option>
                  <Option value="competitor">رقبا</Option>
                  <Option value="vendor">تامین‌کننده</Option>
                  <Option value="other">سایر</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="tier" label="سطح" initialValue="normal">
                <Select placeholder="سطح شرکت">
                  <Option value="platinum">پلاتینیوم</Option>
                  <Option value="gold">طلایی</Option>
                  <Option value="silver">نقره‌ای</Option>
                  <Option value="bronze">برنزی</Option>
                  <Option value="normal">عادی</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="annualRevenue" label="درآمد سالانه">
                <Input type="number" placeholder="درآمد سالانه" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="employeeCount" label="تعداد کارمندان">
                <Input type="number" placeholder="تعداد کارمندان" />
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
              <Form.Item name="fax" label="فکس">
                <Input placeholder="فکس" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="email" label="ایمیل">
                <Input placeholder="ایمیل" prefix={<MailOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>📍 آدرس صورتحساب</Divider>

          <Row gutter={[16, 0]}>
            <Col xs={24}>
              <Form.Item name={['billingAddress', 'street']} label="خیابان">
                <Input placeholder="خیابان" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={8}>
              <Form.Item name={['billingAddress', 'city']} label="شهر">
                <Input placeholder="شهر" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name={['billingAddress', 'state']} label="استان">
                <Input placeholder="استان" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name={['billingAddress', 'postalCode']} label="کد پستی">
                <Input placeholder="کد پستی" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>📍 آدرس حمل و نقل</Divider>

          <Row gutter={[16, 0]}>
            <Col xs={24}>
              <Form.Item name={['shippingAddress', 'street']} label="خیابان">
                <Input placeholder="خیابان" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={8}>
              <Form.Item name={['shippingAddress', 'city']} label="شهر">
                <Input placeholder="شهر" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name={['shippingAddress', 'state']} label="استان">
                <Input placeholder="استان" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name={['shippingAddress', 'postalCode']} label="کد پستی">
                <Input placeholder="کد پستی" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="توضیحات">
            <Input.TextArea rows={3} placeholder="توضیحات" />
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
                onClick={() => navigate('/crm/accounts')}
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

export default AccountForm;



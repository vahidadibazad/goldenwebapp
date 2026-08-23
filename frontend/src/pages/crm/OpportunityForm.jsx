// frontend/src/pages/crm/OpportunityForm.jsx
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
  InputNumber,
  DatePicker,
  App,
} from 'antd';
import {
  SaveOutlined,
  RollbackOutlined,
  DollarOutlined,
  BankOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import crmService from '../../services/crmService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

function OpportunityForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    fetchAccounts();
    if (id) {
      fetchOpportunity();
    }
  }, [id]);

  const fetchAccounts = async () => {
    try {
      const res = await crmService.getAccounts({ limit: 100 });
      setAccounts(res.data.data || []);
    } catch (error) {
      console.error('خطا در دریافت شرکت‌ها:', error);
    }
  };

  const fetchContacts = async (accountId) => {
    if (!accountId) return;
    try {
      const res = await crmService.getAccountContacts(accountId);
      setContacts(res.data.data || []);
    } catch (error) {
      console.error('خطا در دریافت مخاطبین:', error);
    }
  };

  const fetchOpportunity = async () => {
    setLoading(true);
    try {
      const res = await crmService.getOpportunityById(id);
      const data = res.data.data;
      
      if (data.account) {
        await fetchContacts(data.account._id);
      }
      
      form.setFieldsValue({
        name: data.name,
        accountId: data.account?._id || data.account,
        contactId: data.contact?._id || data.contact,
        amount: data.amount,
        expectedRevenue: data.expectedRevenue,
        stage: data.stage,
        probability: data.probability,
        closeDate: data.closeDate ? dayjs(data.closeDate) : null,
        type: data.type,
        leadSource: data.leadSource,
        description: data.description,
        tags: data.tags,
      });
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      navigate('/crm/opportunities');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        closeDate: values.closeDate?.toISOString(),
      };
      
      if (id) {
        await crmService.updateOpportunity(id, payload);
        message.success('فرصت با موفقیت ویرایش شد');
      } else {
        await crmService.createOpportunity(payload);
        message.success('فرصت با موفقیت ایجاد شد');
      }
      navigate('/crm/opportunities');
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ذخیره');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccountChange = (value) => {
    fetchContacts(value);
    form.setFieldsValue({ contactId: undefined });
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
            {id ? '✏️ ویرایش فرصت' : '➕ فرصت جدید'}
          </Title>
          <Button icon={<RollbackOutlined />} onClick={() => navigate('/crm/opportunities')}>
            بازگشت
          </Button>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="نام فرصت"
                rules={[{ required: true, message: 'نام فرصت الزامی است' }]}
              >
                <Input placeholder="نام فرصت" prefix={<DollarOutlined />} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="accountId"
                label="شرکت"
                rules={[{ required: true, message: 'شرکت الزامی است' }]}
              >
                <Select
                  placeholder="انتخاب شرکت"
                  showSearch
                  optionFilterProp="children"
                  onChange={handleAccountChange}
                >
                  {accounts.map((a) => (
                    <Option key={a._id} value={a._id}>
                      <BankOutlined /> {a.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="contactId" label="مخاطب">
                <Select
                  placeholder="انتخاب مخاطب"
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {contacts.map((c) => (
                    <Option key={c._id} value={c._id}>
                      <UserOutlined /> {c.firstName} {c.lastName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="closeDate"
                label="تاریخ بسته شدن"
                rules={[{ required: true, message: 'تاریخ بسته شدن الزامی است' }]}
              >
                <DatePicker
                  placeholder="انتخاب تاریخ"
                  style={{ width: '100%' }}
                  suffixIcon={<CalendarOutlined />}
                  format="YYYY/MM/DD"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="amount"
                label="مبلغ"
                rules={[
                  { required: true, message: 'مبلغ الزامی است' },
                  { type: 'number', min: 0, message: 'مبلغ نمی‌تواند منفی باشد' },
                ]}
              >
                <InputNumber
                  placeholder="مبلغ"
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/,/g, '')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="expectedRevenue" label="درآمد مورد انتظار">
                <InputNumber
                  placeholder="درآمد مورد انتظار"
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/,/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={8}>
              <Form.Item
                name="stage"
                label="مرحله"
                initialValue="discovery"
              >
                <Select placeholder="مرحله">
                  <Option value="discovery">کشف</Option>
                  <Option value="qualification">صلاحیت‌سنجی</Option>
                  <Option value="proposal">پیشنهاد</Option>
                  <Option value="negotiation">مذاکره</Option>
                  <Option value="closed_won">برنده</Option>
                  <Option value="closed_lost">بازنده</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="probability"
                label="احتمال موفقیت (%)"
                initialValue={0}
              >
                <InputNumber
                  placeholder="۰-۱۰۰"
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="type" label="نوع" initialValue="new_business">
                <Select placeholder="نوع">
                  <Option value="new_business">کسب و کار جدید</Option>
                  <Option value="renewal">تمدید</Option>
                  <Option value="upsell">افزایش فروش</Option>
                  <Option value="cross_sell">فروش متقاطع</Option>
                </Select>
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
                onClick={() => navigate('/crm/opportunities')}
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

export default OpportunityForm;



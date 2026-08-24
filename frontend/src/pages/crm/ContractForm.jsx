// frontend/src/pages/crm/ContractForm.jsx
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
  Switch,
  App,
} from 'antd';
import {
  SaveOutlined,
  RollbackOutlined,
  FileTextOutlined,
  BankOutlined,
  CalendarOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import crmService from "../../services/crmService";
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

function ContractForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);

  useEffect(() => {
    fetchAccounts();
    fetchOpportunities();
    if (id) {
      fetchContract();
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

  const fetchOpportunities = async () => {
    try {
      const res = await crmService.getOpportunities({ limit: 100 });
      setOpportunities(res.data.data || []);
    } catch (error) {
      console.error('خطا در دریافت فرصت‌ها:', error);
    }
  };

  const fetchContract = async () => {
    setLoading(true);
    try {
      const res = await crmService.getContractById(id);
      const data = res.data.data;
      form.setFieldsValue({
        name: data.name,
        accountId: data.account?._id || data.account,
        opportunityId: data.opportunity?._id || data.opportunity,
        'value.amount': data.value?.amount,
        'value.currency': data.value?.currency,
        'value.paymentTerms': data.value?.paymentTerms,
        startDate: data.startDate ? dayjs(data.startDate) : null,
        endDate: data.endDate ? dayjs(data.endDate) : null,
        autoRenew: data.autoRenew,
        'billing.method': data.billing?.method,
        'billing.frequency': data.billing?.frequency,
        'billing.dayOfMonth': data.billing?.dayOfMonth,
        description: data.description,
        notes: data.notes,
        tags: data.tags,
        status: data.status,
      });
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      navigate('/crm/contracts');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        startDate: values.startDate?.toISOString(),
        endDate: values.endDate?.toISOString(),
      };
      
      if (id) {
        await crmService.updateContract(id, payload);
        message.success('قرارداد با موفقیت ویرایش شد');
      } else {
        await crmService.createContract(payload);
        message.success('قرارداد با موفقیت ایجاد شد');
      }
      navigate('/crm/contracts');
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
            {id ? '✏️ ویرایش قرارداد' : '➕ قرارداد جدید'}
          </Title>
          <Button icon={<RollbackOutlined />} onClick={() => navigate('/crm/contracts')}>
            بازگشت
          </Button>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="نام قرارداد"
                rules={[{ required: true, message: 'نام قرارداد الزامی است' }]}
              >
                <Input placeholder="نام قرارداد" prefix={<FileTextOutlined />} />
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
              <Form.Item name="opportunityId" label="فرصت مرتبط">
                <Select
                  placeholder="انتخاب فرصت"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {opportunities.map((o) => (
                    <Option key={o._id} value={o._id}>
                      {o.name} - {o.account?.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="status" label="وضعیت" initialValue="draft">
                <Select placeholder="وضعیت">
                  <Option value="draft">پیش‌نویس</Option>
                  <Option value="active">فعال</Option>
                  <Option value="expired">منقضی</Option>
                  <Option value="cancelled">لغو شده</Option>
                  <Option value="completed">تکمیل شده</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>💰 ارزش و شرایط</Divider>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={8}>
              <Form.Item
                name={['value', 'amount']}
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
                  prefix={<DollarOutlined />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={['value', 'currency']}
                label="واحد پول"
                initialValue="IRR"
              >
                <Select>
                  <Option value="IRR">ریال</Option>
                  <Option value="USD">دلار</Option>
                  <Option value="EUR">یورو</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={['value', 'paymentTerms']}
                label="شرایط پرداخت"
                initialValue="monthly"
              >
                <Select>
                  <Option value="monthly">ماهانه</Option>
                  <Option value="quarterly">سه‌ماهه</Option>
                  <Option value="yearly">ساله</Option>
                  <Option value="one_time">یک‌باره</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>📅 تاریخ‌ها</Divider>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="startDate"
                label="تاریخ شروع"
                rules={[{ required: true, message: 'تاریخ شروع الزامی است' }]}
              >
                <DatePicker
                  placeholder="انتخاب تاریخ شروع"
                  style={{ width: '100%' }}
                  suffixIcon={<CalendarOutlined />}
                  format="YYYY/MM/DD"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="endDate"
                label="تاریخ پایان"
                rules={[{ required: true, message: 'تاریخ پایان الزامی است' }]}
              >
                <DatePicker
                  placeholder="انتخاب تاریخ پایان"
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
                name="autoRenew"
                label="تمدید خودکار"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>💳 صورتحساب</Divider>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={8}>
              <Form.Item
                name={['billing', 'method']}
                label="روش صورتحساب"
                initialValue="invoice"
              >
                <Select>
                  <Option value="invoice">فاکتور</Option>
                  <Option value="auto_pay">پرداخت خودکار</Option>
                  <Option value="manual">دستی</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={['billing', 'frequency']}
                label="تناوب صورتحساب"
                initialValue="monthly"
              >
                <Select>
                  <Option value="monthly">ماهانه</Option>
                  <Option value="quarterly">سه‌ماهه</Option>
                  <Option value="yearly">ساله</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={['billing', 'dayOfMonth']}
                label="روز صورتحساب"
                initialValue={1}
              >
                <InputNumber
                  placeholder="۱-۳۱"
                  style={{ width: '100%' }}
                  min={1}
                  max={31}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="توضیحات">
            <Input.TextArea rows={2} placeholder="توضیحات" />
          </Form.Item>

          <Form.Item name="notes" label="یادداشت‌ها">
            <Input.TextArea rows={2} placeholder="یادداشت‌ها" />
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
                onClick={() => navigate('/crm/contracts')}
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

export default ContractForm;



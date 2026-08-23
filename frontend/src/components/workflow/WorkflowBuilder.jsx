import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Typography,
  message,
  Spin,
  Space,
  Row,
  Col,
  Divider,
  Tag,
  Tooltip,
  App,
  Switch,
  InputNumber,
  Collapse,
  Popconfirm,
} from 'antd';
import {
  SaveOutlined,
  RollbackOutlined,
  PlusOutlined,
  DeleteOutlined,
  DragOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { workflowService } from '../../services/letterApi';
import { COLORS } from '../../styles/theme';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

function WorkflowBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  const [steps, setSteps] = useState([]);
  const [conditions, setConditions] = useState([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsPhone(window.innerWidth <= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // =============================================
  // دریافت EnumValueها
  // =============================================
  const [workflowTypeOptions, setWorkflowTypeOptions] = useState([]);
  const [actorOptions, setActorOptions] = useState([
    { value: 'requester', label: 'درخواست‌دهنده' },
    { value: 'manager', label: 'مدیر' },
    { value: 'department_manager', label: 'مدیر واحد' },
    { value: 'office_manager', label: 'مدیر اداری' },
    { value: 'hr_manager', label: 'مدیر منابع انسانی' },
    { value: 'finance_manager', label: 'مدیر مالی' },
    { value: 'ceo', label: 'مدیرعامل' },
    { value: 'admin', label: 'مدیر کل' },
    { value: 'user', label: 'کاربر' },
    { value: 'custom', label: 'سفارشی' },
  ]);

  const actionOptions = [
    { value: 'submit', label: 'ثبت' },
    { value: 'review', label: 'بررسی' },
    { value: 'approve', label: 'تایید' },
    { value: 'reject', label: 'رد' },
    { value: 'sign', label: 'امضا' },
    { value: 'forward', label: 'ارجاع' },
    { value: 'archive', label: 'بایگانی' },
    { value: 'custom', label: 'سفارشی' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        setLoading(true);
        try {
          const res = await workflowService.getById(id);
          const data = res.data.data;
          form.setFieldsValue({
            name: data.name,
            type: data.type,
            description: data.description,
            isActive: data.isActive,
          });
          setSteps(data.steps || []);
          setConditions(data.conditions || []);
        } catch (error) {
          message.error('خطا در دریافت اطلاعات');
          navigate('/workflow');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [id]);

  const addStep = () => {
    const newStep = {
      id: `step_${steps.length + 1}`,
      name: '',
      description: '',
      actors: [],
      action: 'approve',
      nextSteps: [],
      optional: false,
      timeout: 0,
      reminderDays: [3, 1, 0],
      requiresSignature: false,
      requiredSignatures: 1,
      defaultMessage: '',
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (index) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };

  const addCondition = () => {
    const newCondition = {
      name: `شرط ${conditions.length + 1}`,
      description: '',
      condition: '',
      skipSteps: [],
      directStep: '',
      priority: 0,
    };
    setConditions([...conditions, newCondition]);
  };

  const removeCondition = (index) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    setConditions(newConditions);
  };

  const updateCondition = (index, field, value) => {
    const newConditions = [...conditions];
    newConditions[index][field] = value;
    setConditions(newConditions);
  };

  const onFinish = async (values) => {
    if (steps.length === 0) {
      message.error('حداقل یک مرحله برای گردش کار تعریف کنید');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...values,
        steps: steps.map(step => ({
          ...step,
          // تبدیل آرایه actors به string اگر لازم باشد
        })),
        conditions: conditions,
      };

      if (id) {
        await workflowService.update(id, payload);
        message.success('گردش کار با موفقیت ویرایش شد');
      } else {
        await workflowService.create(payload);
        message.success('گردش کار با موفقیت ایجاد شد');
      }
      navigate('/workflow');
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ذخیره');
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

  const stepOptions = steps.map((step, index) => ({
    value: step.id,
    label: step.name || `مرحله ${index + 1}`,
  }));

  return (
    <div className="fade-in">
      <Card style={{ borderRadius: 'var(--radius)' }}>
        <Title level={isPhone ? 4 : isMobile ? 3 : 2} style={{ marginBottom: 24 }}>
          {id ? '✏️ ویرایش گردش کار' : '➕ ایجاد گردش کار جدید'}
        </Title>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="نام گردش کار"
                rules={[{ required: true, message: 'نام گردش کار الزامی است' }]}
              >
                <Input placeholder="مثلاً: گردش کار مرخصی" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="type"
                label="نوع"
                rules={[{ required: true, message: 'نوع گردش کار را انتخاب کنید' }]}
              >
                <Select placeholder="انتخاب نوع" size="large">
                  <Option value="leave">مرخصی</Option>
                  <Option value="mission">ماموریت</Option>
                  <Option value="letter">نامه اداری</Option>
                  <Option value="purchase">خرید</Option>
                  <Option value="contract">قرارداد</Option>
                  <Option value="custom">سفارشی</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="توضیحات">
            <Input.TextArea rows={2} placeholder="توضیحات گردش کار" />
          </Form.Item>

          <Form.Item name="isActive" label="فعال" valuePropName="checked">
            <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" defaultChecked />
          </Form.Item>

          <Divider>📋 مراحل گردش کار</Divider>

          {steps.map((step, index) => (
            <Card
              key={index}
              size="small"
              style={{ marginBottom: 12, background: 'var(--bg-secondary)' }}
              title={
                <Space>
                  <DragOutlined style={{ color: 'var(--text-muted)' }} />
                  <span>مرحله {index + 1}</span>
                  <Tag color={step.optional ? 'orange' : 'blue'}>
                    {step.optional ? 'اختیاری' : 'اجباری'}
                  </Tag>
                  {step.requiresSignature && (
                    <Tag color="purple">نیاز به امضا</Tag>
                  )}
                </Space>
              }
              extra={
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeStep(index)}
                  disabled={steps.length === 1}
                />
              }
            >
              <Row gutter={[12, 8]}>
                <Col xs={24} md={12}>
                  <Form.Item label="شناسه مرحله">
                    <Input
                      value={step.id}
                      onChange={(e) => updateStep(index, 'id', e.target.value)}
                      placeholder="مثلاً: step_1"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="نام مرحله">
                    <Input
                      value={step.name}
                      onChange={(e) => updateStep(index, 'name', e.target.value)}
                      placeholder="مثلاً: ثبت درخواست"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[12, 8]}>
                <Col xs={24}>
                  <Form.Item label="توضیحات">
                    <Input
                      value={step.description}
                      onChange={(e) => updateStep(index, 'description', e.target.value)}
                      placeholder="توضیحات مرحله"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[12, 8]}>
                <Col xs={24} md={12}>
                  <Form.Item label="نقش‌های مجاز">
                    <Select
                      mode="multiple"
                      value={step.actors}
                      onChange={(value) => updateStep(index, 'actors', value)}
                      placeholder="انتخاب نقش‌ها"
                      style={{ width: '100%' }}
                    >
                      {actorOptions.map(opt => (
                        <Option key={opt.value} value={opt.value}>
                          {opt.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="نوع اقدام">
                    <Select
                      value={step.action}
                      onChange={(value) => updateStep(index, 'action', value)}
                      style={{ width: '100%' }}
                    >
                      {actionOptions.map(opt => (
                        <Option key={opt.value} value={opt.value}>
                          {opt.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[12, 8]}>
                <Col xs={24} md={12}>
                  <Form.Item label="مراحل بعدی">
                    <Select
                      mode="multiple"
                      value={step.nextSteps}
                      onChange={(value) => updateStep(index, 'nextSteps', value)}
                      placeholder="مراحل بعدی را انتخاب کنید"
                      style={{ width: '100%' }}
                    >
                      {stepOptions.filter((_, i) => i !== index).map(opt => (
                        <Option key={opt.value} value={opt.value}>
                          {opt.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="زمان مجاز (ساعت)">
                    <InputNumber
                      value={step.timeout}
                      onChange={(value) => updateStep(index, 'timeout', value)}
                      style={{ width: '100%' }}
                      min={0}
                      placeholder="0 = نامحدود"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[12, 8]}>
                <Col xs={24} md={8}>
                  <Form.Item label="اختیاری" valuePropName="checked">
                    <Switch
                      checked={step.optional}
                      onChange={(value) => updateStep(index, 'optional', value)}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="نیاز به امضا" valuePropName="checked">
                    <Switch
                      checked={step.requiresSignature}
                      onChange={(value) => updateStep(index, 'requiresSignature', value)}
                    />
                  </Form.Item>
                </Col>
                {step.requiresSignature && (
                  <Col xs={24} md={8}>
                    <Form.Item label="تعداد امضاهای مورد نیاز">
                      <InputNumber
                        value={step.requiredSignatures}
                        onChange={(value) => updateStep(index, 'requiredSignatures', value)}
                        style={{ width: '100%' }}
                        min={1}
                        max={10}
                      />
                    </Form.Item>
                  </Col>
                )}
              </Row>

              <Row gutter={[12, 8]}>
                <Col xs={24}>
                  <Form.Item label="پیام پیش‌فرض">
                    <Input
                      value={step.defaultMessage}
                      onChange={(e) => updateStep(index, 'defaultMessage', e.target.value)}
                      placeholder="پیامی که در این مرحله نمایش داده شود"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          ))}

          <Button
            type="dashed"
            onClick={addStep}
            icon={<PlusOutlined />}
            block
            style={{ marginBottom: 16 }}
          >
            افزودن مرحله جدید
          </Button>

          <Divider>⚙️ قوانین شرطی</Divider>

          {conditions.map((condition, index) => (
            <Card
              key={index}
              size="small"
              style={{ marginBottom: 12, background: 'var(--bg-secondary)' }}
              title={`شرط ${index + 1}: ${condition.name}`}
              extra={
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeCondition(index)}
                />
              }
            >
              <Row gutter={[12, 8]}>
                <Col xs={24} md={6}>
                  <Form.Item label="نام شرط">
                    <Input
                      value={condition.name}
                      onChange={(e) => updateCondition(index, 'name', e.target.value)}
                      placeholder="نام شرط"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item label="اولویت">
                    <InputNumber
                      value={condition.priority}
                      onChange={(value) => updateCondition(index, 'priority', value)}
                      style={{ width: '100%' }}
                      min={0}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="عبارت شرطی">
                    <Input
                      value={condition.condition}
                      onChange={(e) => updateCondition(index, 'condition', e.target.value)}
                      placeholder='مثلاً: priority === "urgent"'
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[12, 8]}>
                <Col xs={24} md={12}>
                  <Form.Item label="مراحل حذف شده">
                    <Select
                      mode="multiple"
                      value={condition.skipSteps}
                      onChange={(value) => updateCondition(index, 'skipSteps', value)}
                      placeholder="مراحلی که حذف شوند"
                      style={{ width: '100%' }}
                    >
                      {stepOptions.map(opt => (
                        <Option key={opt.value} value={opt.value}>
                          {opt.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="مرحله مستقیم">
                    <Select
                      value={condition.directStep}
                      onChange={(value) => updateCondition(index, 'directStep', value)}
                      placeholder="رفتن مستقیم به این مرحله"
                      style={{ width: '100%' }}
                      allowClear
                    >
                      {stepOptions.map(opt => (
                        <Option key={opt.value} value={opt.value}>
                          {opt.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="توضیحات">
                <Input
                  value={condition.description}
                  onChange={(e) => updateCondition(index, 'description', e.target.value)}
                  placeholder="توضیحات شرط"
                />
              </Form.Item>
            </Card>
          ))}

          <Button
            type="dashed"
            onClick={addCondition}
            icon={<PlusOutlined />}
            block
            style={{ marginBottom: 16 }}
          >
            افزودن شرط جدید
          </Button>

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
                {id ? 'ویرایش' : 'ایجاد'}
              </Button>
              <Button
                icon={<RollbackOutlined />}
                onClick={() => navigate('/workflow')}
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

export default WorkflowBuilder;
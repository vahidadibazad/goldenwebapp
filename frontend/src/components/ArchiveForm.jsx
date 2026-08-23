import { useState, useEffect } from 'react';
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
  Switch,
  Row,
  Col,
  Divider,
  App,
  InputNumber,
} from 'antd';
import {
  SaveOutlined,
  RollbackOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { COLORS } from '../styles/theme';

const { Title, Text } = Typography;
const { Option } = Select;

function ArchiveForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [secretariats, setSecretariats] = useState([]);
  const [archives, setArchives] = useState([]);
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

  // =============================================
  // دریافت داده‌ها
  // =============================================
  const fetchData = async () => {
    setLoading(true);
    try {
      const [secRes, archRes] = await Promise.all([
        api.get('/secretariats'),
        api.get('/archives'),
      ]);

      setSecretariats(secRes.data.data || []);
      setArchives(archRes.data.data || []);

      if (id) {
        const res = await api.get(`/archives/${id}`);
        const data = res.data.data;
        form.setFieldsValue({
          name: data.name,
          code: data.code,
          type: data.type || 'active',
          secretariat: data.secretariat?._id || data.secretariat,
          parent: data.parent?._id || data.parent || null,
          category: data.category || 'general',
          yearFrom: data.yearFrom,
          yearTo: data.yearTo,
          settings: data.settings || {},
          manager: data.manager?._id || data.manager,
          isActive: data.isActive !== undefined ? data.isActive : true,
        });
      }
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      navigate('/archive');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // =============================================
  // ذخیره
  // =============================================
  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      if (id) {
        await api.put(`/archives/${id}`, values);
        message.success('بایگانی با موفقیت ویرایش شد');
      } else {
        await api.post('/archives', values);
        message.success('بایگانی با موفقیت ایجاد شد');
      }
      navigate('/archive');
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

  return (
    <div className="fade-in">
      <Card style={{ borderRadius: 'var(--radius)' }}>
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
          <Title level={isPhone ? 4 : isMobile ? 3 : 2} style={{ margin: 0 }}>
            {id ? '✏️ ویرایش بایگانی' : '📁 بایگانی جدید'}
          </Title>
          <Button icon={<RollbackOutlined />} onClick={() => navigate('/archive')}>
            بازگشت
          </Button>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="نام بایگانی"
                rules={[{ required: true, message: 'نام بایگانی الزامی است' }]}
              >
                <Input placeholder="مثلاً: بایگانی جاری ۱۴۰۳" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="code"
                label="کد بایگانی"
                rules={[
                  { required: true, message: 'کد بایگانی الزامی است' },
                  { pattern: /^[A-Z0-9-]+$/, message: 'فقط حروف بزرگ، اعداد و خط تیره' },
                ]}
              >
                <Input placeholder="مثلاً: ARCH-001" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="secretariat"
                label="دبیرخانه"
                rules={[{ required: true, message: 'دبیرخانه را انتخاب کنید' }]}
              >
                <Select placeholder="انتخاب دبیرخانه" size="large">
                  {secretariats.map((s) => (
                    <Option key={s._id} value={s._id}>
                      {s.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="type" label="نوع بایگانی" initialValue="active">
                <Select size="large">
                  <Option value="active">جاری</Option>
                  <Option value="semi_active">نیمه‌جاری</Option>
                  <Option value="inactive">راکد</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="parent" label="بایگانی والد">
                <Select placeholder="انتخاب بایگانی والد" allowClear size="large">
                  {archives
                    .filter((a) => a._id !== id)
                    .map((a) => (
                      <Option key={a._id} value={a._id}>
                        {a.name}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="category" label="دسته‌بندی" initialValue="general">
                <Select size="large">
                  <Option value="general">عمومی</Option>
                  <Option value="financial">مالی</Option>
                  <Option value="legal">حقوقی</Option>
                  <Option value="personnel">پرسنلی</Option>
                  <Option value="technical">فنی</Option>
                  <Option value="other">سایر</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="yearFrom" label="سال شروع">
                <InputNumber
                  min={1300}
                  max={1500}
                  style={{ width: '100%' }}
                  placeholder="مثلاً: 1400"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="yearTo" label="سال پایان">
                <InputNumber
                  min={1300}
                  max={1500}
                  style={{ width: '100%' }}
                  placeholder="مثلاً: 1403"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="manager"
            label="مسئول بایگانی"
            rules={[{ required: true, message: 'مسئول بایگانی را انتخاب کنید' }]}
          >
            <Select
              placeholder="انتخاب مسئول"
              showSearch
              optionFilterProp="children"
              size="large"
            >
              {/* اینجا باید لیست کاربران از API گرفته شود */}
            </Select>
          </Form.Item>

          <Divider>⚙️ تنظیمات</Divider>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={8}>
              <Form.Item name={['settings', 'allowDelete']} label="مجاز به حذف" valuePropName="checked">
                <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name={['settings', 'allowEdit']} label="مجاز به ویرایش" valuePropName="checked">
                <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" defaultChecked />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name={['settings', 'requireApproval']} label="نیاز به تایید" valuePropName="checked">
                <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" defaultChecked />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name={['settings', 'retentionPeriod']} label="دوره نگهداری (روز)" initialValue={365}>
            <InputNumber min={1} max={3650} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="isActive" label="فعال" valuePropName="checked">
            <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" defaultChecked />
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
                {id ? 'ویرایش' : 'ایجاد'}
              </Button>
              <Button
                icon={<RollbackOutlined />}
                onClick={() => navigate('/archive')}
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

export default ArchiveForm;
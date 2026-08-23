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
  Tag,
} from 'antd';
import {
  SaveOutlined,
  RollbackOutlined,
  PlusOutlined,
  DeleteOutlined,
  UserOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { COLORS } from '../styles/theme';

const { Title, Text } = Typography;
const { Option } = Select;

function SecretariatForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [secretariats, setSecretariats] = useState([]);
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
      const [usersRes, deptRes, secRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/departments'),
        api.get('/secretariats'),
      ]);

      setUsers(usersRes.data.data || []);
      setDepartments(deptRes.data.data || []);
      setSecretariats(secRes.data.data || []);

      if (id) {
        const secRes = await api.get(`/secretariats/${id}`);
        const data = secRes.data.data;
        form.setFieldsValue({
          name: data.name,
          code: data.code,
          type: data.type || 'main',
          parent: data.parent?._id || data.parent || null,
          manager: data.manager?._id || data.manager || null,
          staff: data.staff?.map((s) => s._id || s) || [],
          departments: data.departments?.map((d) => d._id || d) || [],
          settings: data.settings || {},
          isActive: data.isActive !== undefined ? data.isActive : true,
        });
      }
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      navigate('/secretariats');
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
        await api.put(`/secretariats/${id}`, values);
        message.success('دبیرخانه با موفقیت ویرایش شد');
      } else {
        await api.post('/secretariats', values);
        message.success('دبیرخانه با موفقیت ایجاد شد');
      }
      navigate('/secretariats');
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
            {id ? '✏️ ویرایش دبیرخانه' : '➕ دبیرخانه جدید'}
          </Title>
          <Button icon={<RollbackOutlined />} onClick={() => navigate('/secretariats')}>
            بازگشت
          </Button>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="نام دبیرخانه"
                rules={[{ required: true, message: 'نام دبیرخانه الزامی است' }]}
              >
                <Input placeholder="مثلاً: دبیرخانه مرکزی" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="code"
                label="کد دبیرخانه"
                rules={[
                  { required: true, message: 'کد دبیرخانه الزامی است' },
                  { pattern: /^[A-Z0-9-]+$/, message: 'فقط حروف بزرگ، اعداد و خط تیره' },
                ]}
              >
                <Input placeholder="مثلاً: SEC-001" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="type" label="نوع دبیرخانه" initialValue="main">
                <Select size="large">
                  <Option value="main">اصلی</Option>
                  <Option value="sub">فرعی</Option>
                  <Option value="temporary">موقت</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="parent" label="دبیرخانه والد">
                <Select placeholder="انتخاب دبیرخانه والد" allowClear size="large">
                  {secretariats
                    .filter((s) => s._id !== id)
                    .map((s) => (
                      <Option key={s._id} value={s._id}>
                        {s.name}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="manager"
            label="مدیر دبیرخانه"
            rules={[{ required: true, message: 'مدیر دبیرخانه را انتخاب کنید' }]}
          >
            <Select
              placeholder="انتخاب مدیر"
              showSearch
              optionFilterProp="children"
              size="large"
            >
              {users.map((u) => (
                <Option key={u._id} value={u._id}>
                  <UserOutlined /> {u.fullName || u.username}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="staff" label="کارمندان دبیرخانه">
            <Select
              mode="multiple"
              placeholder="انتخاب کارمندان"
              showSearch
              optionFilterProp="children"
              size="large"
            >
              {users.map((u) => (
                <Option key={u._id} value={u._id}>
                  <UserOutlined /> {u.fullName || u.username}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="departments" label="واحدهای تحت پوشش">
            <Select
              mode="multiple"
              placeholder="انتخاب واحدها"
              showSearch
              optionFilterProp="children"
              size="large"
            >
              {departments.map((d) => (
                <Option key={d._id} value={d._id}>
                  {d.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider>⚙️ تنظیمات</Divider>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name={['settings', 'autoNumbering']} label="شماره‌گذاری خودکار" valuePropName="checked">
                <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" defaultChecked />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={['settings', 'requireSignature']} label="نیاز به امضا" valuePropName="checked">
                <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" defaultChecked />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name={['settings', 'maxReferralLevel']} label="حداکثر سطح ارجاع">
                <Input type="number" min={1} max={10} defaultValue={5} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={['settings', 'defaultPriority']} label="اولویت پیش‌فرض" initialValue="medium">
                <Select>
                  <Option value="low">کم</Option>
                  <Option value="medium">متوسط</Option>
                  <Option value="high">بالا</Option>
                  <Option value="urgent">فوری</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

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
                onClick={() => navigate('/secretariats')}
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

export default SecretariatForm;
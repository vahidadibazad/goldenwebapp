// frontend/src/components/UserForm.jsx
import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Typography,
  message,
  Spin,
  Switch,
  Divider,
  Tag,
  App,
} from 'antd';
import {
  SaveOutlined,
  RollbackOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { COLORS } from '../styles/theme';

const { Title, Text } = Typography;
const { Option } = Select;

// =============================================
// ✅ لیست کامل عناوین ماژول‌ها (فارسی)
// =============================================
const moduleLabels = {
  // اموال
  hardware: '💻 اموال',
  // رمزها
  credential: '🔐 رمزها',
  // اسناد
  document: '📄 اسناد',
  // تیکت‌ها
  ticket: '🎫 تیکت‌ها',
  // کاربران
  user: '👥 کاربران',
  // دسته‌بندی‌ها
  category: '📂 دسته‌بندی‌ها',
  // تاریخچه
  audit: '📋 تاریخچه',
  // نقش‌ها و مجوزها
  role: '👑 نقش‌ها',
  permission: '🔑 مجوزها',
  // واحدها
  department: '🏢 واحدها',
  // نامه‌ها
  letter: '✉️ نامه‌ها',
  // گردش کار
  workflow: '🔄 گردش کار',
  // امضا
  signature: '✍️ امضا',
  // دبیرخانه
  secretariat: '🏛️ دبیرخانه',
  // آرشیو
  archive: '📁 آرشیو',
  // گزارشات
  report: '📊 گزارشات',
  // اخطارها
  reminder: '🔔 اخطارها',
  // داشبورد
  dashboard: '📊 داشبورد',
  // تنظیمات
  settings: '⚙️ تنظیمات',
  // وب‌هوک
  webhook: '🔗 وب‌هوک',
  // یکپارچه‌سازی
  integration: '🔌 یکپارچه‌سازی',
  // فکس
  fax: '📠 فکس',
  // ایمیل
  email: '✉️ ایمیل',
  // ارجاعات
  referral: '📤 ارجاعات',
  // شماره‌گذاری
  numbering: '🔢 شماره‌گذاری',
  // OCR و جستجو
  ocr: '🔍 OCR و جستجو',
  // تفویض اختیار
  delegation: '🔄 تفویض اختیار',
};

const moduleColors = {
  hardware: COLORS.primary,
  credential: COLORS.warning,
  document: COLORS.success,
  ticket: COLORS.purple,
  user: COLORS.cyan,
  category: COLORS.orange,
  audit: COLORS.pink,
  role: COLORS.danger,
  permission: COLORS.info,
  department: COLORS.blue,
  letter: COLORS.primary,
  workflow: COLORS.success,
  signature: COLORS.purple,
  secretariat: COLORS.cyan,
  archive: COLORS.orange,
  report: COLORS.pink,
  reminder: COLORS.warning,
  dashboard: COLORS.primary,
  settings: COLORS.danger,
  webhook: COLORS.info,
  integration: COLORS.success,
  fax: COLORS.blue,
  email: COLORS.cyan,
  referral: COLORS.orange,
  numbering: COLORS.purple,
  ocr: COLORS.success,
  delegation: COLORS.warning,
  other: COLORS.gray[500],
};

function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedExtraPermissions, setSelectedExtraPermissions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, permsRes, deptRes] = await Promise.all([
          api.get('/roles'),
          api.get('/roles/permissions/list'),
          api.get('/departments'),
        ]);
        setRoles(rolesRes.data.data || []);
        setAllPermissions(permsRes.data.data || []);
        setDepartments(deptRes.data.data || []);
      } catch (error) {
        message.error('خطا در دریافت اطلاعات');
      }
    };
    fetchData();
  }, [message]);

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      setLoading(true);
      api
        .get(`/auth/users/${id}`)
        .then((res) => {
          const data = res.data.data;
          form.setFieldsValue({
            username: data.username,
            email: data.email,
            fullName: data.fullName,
            role: data.role?._id || data.role || null,
            isActive: data.isActive !== undefined ? data.isActive : true,
            department: data.department || 'All',
          });
          const extraPerms = data.extraPermissions || [];
          setSelectedExtraPermissions(extraPerms.map((p) => p._id || p));
        })
        .catch(() => message.error('خطا در دریافت اطلاعات'))
        .finally(() => setLoading(false));
    }
  }, [id, form, message]);

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        extraPermissions: selectedExtraPermissions,
        department: values.department || 'All',
      };
      if (!payload.password) delete payload.password;
      if (id) {
        await api.put(`/auth/users/${id}`, payload);
        message.success('کاربر با موفقیت ویرایش شد');
      } else {
        await api.post('/auth/register', payload);
        message.success('کاربر با موفقیت ثبت شد');
      }
      navigate('/users');
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ثبت');
    } finally {
      setSubmitting(false);
    }
  };

  // گروه‌بندی مجوزها بر اساس ماژول
  const groupedPermissions = allPermissions.reduce((acc, p) => {
    const moduleKey = p.module || 'other';
    if (!acc[moduleKey]) acc[moduleKey] = [];
    acc[moduleKey].push(p);
    return acc;
  }, {});

  // مرتب‌سازی ماژول‌ها
  const sortedModules = Object.keys(groupedPermissions).sort((a, b) => {
    const order = {
      hardware: 1,
      credential: 2,
      document: 3,
      ticket: 4,
      user: 5,
      category: 6,
      audit: 7,
      role: 8,
      permission: 9,
      department: 10,
      letter: 11,
      workflow: 12,
      signature: 13,
      secretariat: 14,
      archive: 15,
      report: 16,
      reminder: 17,
      dashboard: 18,
      settings: 19,
      webhook: 20,
      integration: 21,
      fax: 22,
      email: 23,
      referral: 24,
      numbering: 25,
      ocr: 26,
      delegation: 27,
    };
    return (order[a] || 99) - (order[b] || 99);
  });

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
        <Title level={isMobile ? 3 : 2} style={{ marginBottom: 24 }}>
          {id ? '✏️ ویرایش کاربر' : '➕ ثبت کاربر جدید'}
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ isActive: true, department: 'All' }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? 8 : 16,
            }}
          >
            <Form.Item
              name="username"
              label="نام کاربری"
              rules={[{ required: true, message: 'نام کاربری را وارد کنید' }]}
            >
              <Input placeholder="نام کاربری" size={isMobile ? 'small' : 'middle'} />
            </Form.Item>

            <Form.Item
              name="email"
              label="ایمیل"
              rules={[
                { required: true, message: 'ایمیل را وارد کنید' },
                { type: 'email', message: 'ایمیل معتبر وارد کنید' },
              ]}
            >
              <Input placeholder="ایمیل" size={isMobile ? 'small' : 'middle'} />
            </Form.Item>
          </div>

          <Form.Item
            name="fullName"
            label="نام کامل"
            rules={[{ required: true, message: 'نام کامل را وارد کنید' }]}
          >
            <Input placeholder="نام کامل" size={isMobile ? 'small' : 'middle'} />
          </Form.Item>

          {!id && (
            <Form.Item
              name="password"
              label="رمز عبور"
              rules={[{ required: true, message: 'رمز عبور را وارد کنید' }]}
              extra="حداقل ۶ کاراکتر"
            >
              <Input.Password placeholder="رمز عبور" size={isMobile ? 'small' : 'middle'} />
            </Form.Item>
          )}

          <Divider titlePlacement="right">نقش و وضعیت</Divider>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? 8 : 16,
            }}
          >
            <Form.Item name="role" label="نقش">
              <Select placeholder="انتخاب نقش" allowClear size={isMobile ? 'small' : 'middle'}>
                {roles.map((r) => (
                  <Option key={r._id} value={r._id}>
                    {r.label}{' '}
                    {r.isSystem && (
                      <Tag color="blue" style={{ fontSize: 10 }}>
                        سیستمی
                      </Tag>
                    )}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="isActive" label="وضعیت" valuePropName="checked">
              <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" style={{ marginTop: 4 }} />
            </Form.Item>
          </div>

          <Divider titlePlacement="right">🏢 دپارتمان</Divider>

          <Form.Item name="department" label="دپارتمان">
            <Select placeholder="انتخاب دپارتمان" size={isMobile ? 'small' : 'middle'} allowClear>
              {departments.map((d) => (
                <Option key={d.id} value={d.id}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: d.color || '#1677ff',
                      marginLeft: 6,
                    }}
                  />
                  {d.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Text
            type="secondary"
            style={{ fontSize: 12, display: 'block', marginTop: -8, marginBottom: 16 }}
          >
            کاربر فقط به اسناد دپارتمان خود دسترسی دارد
          </Text>

          <Divider titlePlacement="right">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PlusOutlined style={{ color: COLORS.purple }} />
              مجوزهای استثنا
              <Tag color="purple" style={{ fontSize: 11 }}>
                {selectedExtraPermissions.length} مجوز
              </Tag>
            </span>
          </Divider>

          <div
            style={{
              background: 'var(--bg-secondary)',
              padding: '16px',
              borderRadius: '10px',
              marginBottom: 16,
            }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              💡 مجوزهای استثنا به کاربر اجازه می‌دهد بدون تغییر نقش، دسترسی‌های اضافی داشته باشد.
            </Text>
          </div>

          <Form.Item label="انتخاب مجوزهای استثنا">
            <Select
              mode="multiple"
              placeholder="مجوزهای اضافی را انتخاب کنید..."
              value={selectedExtraPermissions}
              onChange={setSelectedExtraPermissions}
              style={{ width: '100%' }}
              size={isMobile ? 'small' : 'middle'}
              optionFilterProp="label"
              maxTagCount="responsive"
            >
              {sortedModules.map((moduleKey) => (
                <Select.OptGroup
                  key={moduleKey}
                  label={
                    <span style={{ fontWeight: 600, color: moduleColors[moduleKey] || COLORS.gray[500] }}>
                      {moduleLabels[moduleKey] || moduleKey}
                    </span>
                  }
                >
                  {groupedPermissions[moduleKey].map((p) => (
                    <Option key={p._id} value={p._id} label={p.label}>
                      {p.label}
                    </Option>
                  ))}
                </Select.OptGroup>
              ))}
            </Select>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {selectedExtraPermissions.length === 0
                ? 'هیچ مجوز استثنایی انتخاب نشده است'
                : `${selectedExtraPermissions.length} مجوز استثنا انتخاب شده است`}
            </Text>
          </Form.Item>

          {selectedExtraPermissions.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                padding: '12px',
                background: 'var(--bg-card)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                marginBottom: 16,
              }}
            >
              {selectedExtraPermissions.map((permId) => {
                const perm = allPermissions.find((p) => p._id === permId);
                if (!perm) return null;
                return (
                  <Tag
                    key={permId}
                    closable
                    onClose={() =>
                      setSelectedExtraPermissions(
                        selectedExtraPermissions.filter((id) => id !== permId)
                      )
                    }
                    color="purple"
                    style={{ padding: '4px 12px', borderRadius: '20px' }}
                  >
                    {perm.label}
                  </Tag>
                );
              })}
            </div>
          )}

          <Divider />

          <Form.Item>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={submitting}
                size={isMobile ? 'small' : 'middle'}
              >
                {id ? 'ویرایش کاربر' : 'ثبت کاربر'}
              </Button>
              <Button
                icon={<RollbackOutlined />}
                onClick={() => navigate('/users')}
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

export default UserForm;
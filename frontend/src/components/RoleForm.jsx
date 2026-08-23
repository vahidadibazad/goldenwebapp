// frontend/src/components/RoleForm.jsx
import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Spin, Checkbox, Row, Col, App } from 'antd';
import { SaveOutlined, RollbackOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const { Title } = Typography;

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

function RoleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // دریافت لیست مجوزها
  useEffect(() => {
    api
      .get('/roles/permissions/list')
      .then((res) => {
        setPermissions(res.data.data || []);
      })
      .catch(() => message.error('خطا در دریافت مجوزها'));

    if (id) {
      setLoading(true);
      api
        .get(`/roles/${id}`)
        .then((res) => {
          const data = res.data.data;
          form.setFieldsValue({
            name: data.name,
            label: data.label,
            description: data.description,
          });
          setSelectedPermissions(data.permissions.map((p) => p._id || p));
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
        permissions: selectedPermissions,
      };

      if (id) {
        await api.put(`/roles/${id}`, payload);
        message.success('نقش با موفقیت ویرایش شد');
      } else {
        await api.post('/roles', payload);
        message.success('نقش با موفقیت ثبت شد');
      }
      navigate('/roles');
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ثبت');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePermissionChange = (permId, checked) => {
    if (checked) {
      setSelectedPermissions([...selectedPermissions, permId]);
    } else {
      setSelectedPermissions(selectedPermissions.filter((id) => id !== permId));
    }
  };

  // گروه‌بندی مجوزها بر اساس ماژول
  const groupedPermissions = permissions.reduce((acc, p) => {
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
          {id ? '✏️ ویرایش نقش' : '➕ ایجاد نقش جدید'}
        </Title>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? 8 : 16,
            }}
          >
            <Form.Item
              name="name"
              label="نام نقش"
              rules={[{ required: true, message: 'نام نقش را وارد کنید' }]}
            >
              <Input placeholder="نام نقش" size={isMobile ? 'small' : 'middle'} />
            </Form.Item>

            <Form.Item
              name="label"
              label="برچسب"
              rules={[{ required: true, message: 'برچسب را وارد کنید' }]}
            >
              <Input placeholder="برچسب نقش" size={isMobile ? 'small' : 'middle'} />
            </Form.Item>
          </div>

          <Form.Item name="description" label="توضیحات">
            <Input.TextArea rows={3} placeholder="توضیحات نقش" size={isMobile ? 'small' : 'middle'} />
          </Form.Item>

          <Form.Item label="مجوزها">
            <div
              style={{
                maxHeight: 400,
                overflowY: 'auto',
                padding: 12,
                border: '1px solid #d9d9d9',
                borderRadius: 8,
                background: 'var(--bg-secondary)',
              }}
            >
              {sortedModules.map((moduleKey) => (
                <div key={moduleKey} style={{ marginBottom: 16 }}>
                  <strong
                    style={{
                      display: 'block',
                      marginBottom: 8,
                      fontSize: 14,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {moduleLabels[moduleKey] || moduleKey}
                  </strong>
                  <Row gutter={[16, 8]}>
                    {groupedPermissions[moduleKey].map((p) => (
                      <Col key={p._id} xs={24} sm={12} md={8} lg={6}>
                        <Checkbox
                          checked={selectedPermissions.includes(p._id)}
                          onChange={(e) => handlePermissionChange(p._id, e.target.checked)}
                          style={{ fontSize: isMobile ? '12px' : '13px' }}
                        >
                          {p.label}
                        </Checkbox>
                      </Col>
                    ))}
                  </Row>
                </div>
              ))}
            </div>
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
                onClick={() => navigate('/roles')}
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

export default RoleForm;
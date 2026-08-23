// frontend/src/components/SystemSettings.jsx
import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  ColorPicker,
  Select,
  Space,
  Divider,
  Tabs,
  Upload,
  Avatar,
  Row,
  Col,
  Tag,
  Tooltip,
  App,        // ✅ این import مهم است
  Switch,
  InputNumber,
  Alert,
  Spin,
  Table,
  Popconfirm,
  // ❌ Modal را از اینجا حذف کنید (از App.useApp استفاده می‌شود)
} from 'antd';
import {
  SaveOutlined,
  RollbackOutlined,
  CloudUploadOutlined,
  GlobalOutlined,
  LoginOutlined,
  BgColorsOutlined,
  CopyrightOutlined,
  MailOutlined,
  PhoneOutlined,
  LinkOutlined,
  FileImageOutlined,
  TeamOutlined,
  SafetyOutlined,
  DatabaseOutlined,
  NotificationOutlined,
  SecurityScanOutlined,
  ApiOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { COLORS } from '../styles/theme';
import DepartmentManager from './DepartmentManager';
import moment from 'moment-jalaali';

const { Title, Text } = Typography;
const { Option } = Select;

function SystemSettings() {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();  // ✅ اضافه کردن modal
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [backupList, setBackupList] = useState([]);
  const [backupListLoading, setBackupListLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // =============================================
  // دریافت تنظیمات
  // =============================================
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        const data = res.data.data || {};
        
        setTimeout(() => {
          form.setFieldsValue({
            companyName: data.companyName || '',
            slogan: data.slogan || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            website: data.website || '',
            copyright: data.copyright || 'تمامی حقوق محفوظ است',
            primaryColor: data.primaryColor || '#1677ff',
            secondaryColor: data.secondaryColor || '#64748b',
            fontFamily: data.fontFamily || 'Vazirmatn',
            direction: data.direction || 'rtl',
            defaultTheme: data.defaultTheme || 'light',
            siteTitle: data.siteTitle || 'مدیریت IT',
            siteSubtitle: data.siteSubtitle || '',
            loginTitle: data.loginTitle || 'مدیریت IT',
            loginIcon: data.loginIcon || '🏢',
            loginSubtitle: data.loginSubtitle || 'وارد حساب کاربری خود شوید',
            maxLoginAttempts: data.maxLoginAttempts || 5,
            sessionTimeout: data.sessionTimeout || 60,
            twoFactorEnabled: data.twoFactorEnabled || false,
            notificationEmail: data.notificationEmail || '',
            notificationSms: data.notificationSms || false,
            apiRateLimit: data.apiRateLimit || 100,
            apiTimeout: data.apiTimeout || 30,
          });
        }, 0);
        
        if (data.logo) setLogoUrl(data.logo);
        if (data.favicon) setFaviconUrl(data.favicon);
      } catch (error) {
        message.error('خطا در دریافت تنظیمات');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
    fetchBackupList();
  }, [form, message]);

  // =============================================
  // دریافت لیست پشتیبان‌ها
  // =============================================
  const fetchBackupList = async () => {
    setBackupListLoading(true);
    try {
      const res = await api.get('/backup/list');
      setBackupList(res.data.data || []);
      setSelectedRowKeys([]);
    } catch (error) {
      console.error('خطا در دریافت لیست پشتیبان‌ها:', error);
    } finally {
      setBackupListLoading(false);
    }
  };

  // =============================================
  // ذخیره تنظیمات
  // =============================================
  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      await api.put('/settings', values);
      message.success('تنظیمات با موفقیت ذخیره شد');
      window.dispatchEvent(new CustomEvent('settings-updated', { detail: values }));
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ذخیره تنظیمات');
    } finally {
      setSubmitting(false);
    }
  };

  // =============================================
  // پشتیبان‌گیری دستی
  // =============================================
  const handleManualBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await api.post('/backup/manual');
      message.success('✅ پشتیبان‌گیری با موفقیت انجام شد');
      fetchBackupList();
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در پشتیبان‌گیری');
    } finally {
      setBackupLoading(false);
    }
  };

  // =============================================
  // دانلود فایل پشتیبان
  // =============================================
  const handleDownloadBackup = async (filename) => {
    try {
      const response = await api.get(`/backup/download/${filename}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('دانلود با موفقیت انجام شد');
    } catch (error) {
      message.error('خطا در دانلود فایل');
    }
  };

  // =============================================
  // حذف یک فایل پشتیبان
  // =============================================
  const handleDeleteBackup = async (filename) => {
    try {
      await api.delete(`/backup/${filename}`);
      message.success(`فایل "${filename}" با موفقیت حذف شد`);
      fetchBackupList();
    } catch (error) {
      message.error('خطا در حذف فایل');
    }
  };

  // =============================================
  // ✅ حذف چندگانه فایل‌های پشتیبان (با modal از App.useApp)
  // =============================================
  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('هیچ فایلی برای حذف انتخاب نشده است');
      return;
    }

    modal.confirm({
      title: '⚠️ حذف چندگانه',
      content: (
        <div>
          <p>آیا از حذف <strong>{selectedRowKeys.length}</strong> فایل پشتیبان اطمینان دارید؟</p>
          <p style={{ color: '#ff4d4f', fontSize: '12px' }}>
            این عملیات غیرقابل بازگشت است.
          </p>
          <div style={{ marginTop: 8 }}>
            {selectedRowKeys.map((name, index) => (
              <Tag key={index} color="red" style={{ margin: '2px' }}>
                {name}
              </Tag>
            ))}
          </div>
        </div>
      ),
      okText: 'بله، حذف کن',
      cancelText: 'انصراف',
      okButtonProps: { danger: true, loading: bulkDeleteLoading },
      onOk: async () => {
        setBulkDeleteLoading(true);
        try {
          const deletePromises = selectedRowKeys.map((filename) =>
            api.delete(`/backup/${filename}`)
          );
          
          await Promise.all(deletePromises);
          
          message.success(`${selectedRowKeys.length} فایل با موفقیت حذف شدند`);
          fetchBackupList();
        } catch (error) {
          message.error('خطا در حذف فایل‌ها');
        } finally {
          setBulkDeleteLoading(false);
        }
      },
    });
  };

  // =============================================
  // ✅ بازگردانی (Restore) از فایل موجود در سرور (با modal از App.useApp)
  // =============================================
  const handleRestoreFromServer = async (filename) => {
    modal.confirm({
      title: '⚠️ هشدار! بازگردانی پشتیبان',
      content: (
        <div>
          <p>آیا از بازگردانی این پشتیبان اطمینان دارید؟</p>
          <p style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
            تمام داده‌های فعلی سیستم حذف و با داده‌های پشتیبان جایگزین می‌شوند.
          </p>
          <p style={{ fontSize: '12px', color: '#999' }}>
            فایل: <strong>{filename}</strong>
          </p>
        </div>
      ),
      okText: 'بله، بازگردانی کن',
      cancelText: 'انصراف',
      okButtonProps: { danger: true, loading: restoreLoading },
      onOk: async () => {
        setRestoreLoading(true);
        try {
          const response = await api.get(`/backup/download/${filename}`, {
            responseType: 'blob',
          });
          
          const blob = new Blob([response.data], { type: 'application/json' });
          const restoreFormData = new FormData();
          restoreFormData.append('backupFile', blob, filename);
          
          await api.post('/backup/restore', restoreFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          
          message.success('پشتیبان با موفقیت بازگردانی شد');
          fetchBackupList();
          
          setTimeout(() => {
            modal.info({
              title: '🔄 بازگردانی کامل شد',
              content: 'برای اعمال تغییرات، صفحه را رفرش کنید.',
              okText: 'رفرش صفحه',
              onOk: () => window.location.reload(),
            });
          }, 1000);
          
        } catch (error) {
          message.error(error.response?.data?.error || 'خطا در بازگردانی');
        } finally {
          setRestoreLoading(false);
        }
      },
    });
  };

  // =============================================
  // ✅ آپلود فایل پشتیبان برای بازگردانی (با modal از App.useApp)
  // =============================================
  const restoreUploadProps = {
    beforeUpload: (file) => {
      if (!file.name.endsWith('.json')) {
        message.error('فایل باید با فرمت JSON باشد');
        return false;
      }
      
      modal.confirm({
        title: '⚠️ هشدار! بازگردانی پشتیبان',
        content: (
          <div>
            <p>آیا از بازگردانی این پشتیبان اطمینان دارید؟</p>
            <p style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
              تمام داده‌های فعلی سیستم حذف و با داده‌های پشتیبان جایگزین می‌شوند.
            </p>
            <p style={{ fontSize: '12px', color: '#999' }}>
              فایل: <strong>{file.name}</strong>
            </p>
          </div>
        ),
        okText: 'بله، بازگردانی کن',
        cancelText: 'انصراف',
        okButtonProps: { danger: true, loading: restoreLoading },
        onOk: async () => {
          setRestoreLoading(true);
          try {
            const formData = new FormData();
            formData.append('backupFile', file);
            
            await api.post('/backup/restore', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            message.success('پشتیبان با موفقیت بازگردانی شد');
            fetchBackupList();
            
            setTimeout(() => {
              modal.info({
                title: '🔄 بازگردانی کامل شد',
                content: 'برای اعمال تغییرات، صفحه را رفرش کنید.',
                okText: 'رفرش صفحه',
                onOk: () => window.location.reload(),
              });
            }, 1000);
            
          } catch (error) {
            message.error(error.response?.data?.error || 'خطا در بازگردانی');
          } finally {
            setRestoreLoading(false);
          }
        },
      });
      
      return false;
    },
    showUploadList: false,
    accept: '.json',
  };

  // =============================================
  // آپلود لوگو
  // =============================================
  const uploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('فایل باید تصویر باشد');
        return false;
      }
      const reader = new FileReader();
      reader.onload = (e) => setLogoUrl(e.target.result);
      reader.readAsDataURL(file);
      return false;
    },
    showUploadList: false,
  };

  const faviconUploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('فایل باید تصویر باشد');
        return false;
      }
      const reader = new FileReader();
      reader.onload = (e) => setFaviconUrl(e.target.result);
      reader.readAsDataURL(file);
      return false;
    },
    showUploadList: false,
  };

  // =============================================
  // ستون‌های جدول پشتیبان‌ها
  // =============================================
  const backupColumns = [
    {
      title: 'نام فایل',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Text code style={{ fontSize: '13px' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'تاریخ ایجاد',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? moment(date).format('jYYYY/jMM/jDD HH:mm') : '-',
    },
    {
      title: 'حجم',
      dataIndex: 'size',
      key: 'size',
      render: (size) => `${size} MB`,
    },
    {
      title: 'عملیات',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="دانلود">
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              size="small"
              onClick={() => handleDownloadBackup(record.name)}
            >
              دانلود
            </Button>
          </Tooltip>
          <Tooltip title="بازگردانی">
            <Button
              danger
              icon={<UploadOutlined />}
              size="small"
              onClick={() => handleRestoreFromServer(record.name)}
              loading={restoreLoading}
            >
              بازگردانی
            </Button>
          </Tooltip>
          <Tooltip title="حذف">
            <Popconfirm
              title="آیا از حذف این فایل اطمینان دارید؟"
              onConfirm={() => handleDeleteBackup(record.name)}
              okText="بله"
              cancelText="خیر"
            >
              <Button
                icon={<DeleteOutlined />}
                size="small"
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // =============================================
  // تنظیمات انتخاب چندگانه
  // =============================================
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys) => {
      setSelectedRowKeys(selectedRowKeys);
    },
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
    getCheckboxProps: (record) => ({
      disabled: false,
    }),
  };

  // =============================================
  // تب‌های تنظیمات
  // =============================================
  const tabItems = [
    // ===== تب ۱: عمومی =====
    {
      key: '1',
      label: <span><GlobalOutlined /> عمومی</span>,
      children: (
        <div style={{ maxWidth: 700 }}>
          <Alert title="اطلاعات عمومی سازمان" description="این اطلاعات در پایین صفحات و گزارشات نمایش داده می‌شود." type="info" showIcon style={{ marginBottom: 16 }} />
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="companyName" label="نام شرکت/سازمان" rules={[{ required: true }]}>
                <Input placeholder="نام شرکت/سازمان را وارد کنید" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="slogan" label="شعار سازمان">
                <Input placeholder="شعار سازمان را وارد کنید" size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="email" label="ایمیل">
                <Input prefix={<MailOutlined />} placeholder="info@example.com" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="phone" label="تلفن">
                <Input prefix={<PhoneOutlined />} placeholder="۰۲۱-۱۲۳۴۵۶۷۸" size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="آدرس">
            <Input.TextArea rows={2} placeholder="آدرس سازمان" size="large" />
          </Form.Item>
          <Form.Item name="website" label="وب‌سایت">
            <Input prefix={<LinkOutlined />} placeholder="https://example.com" size="large" />
          </Form.Item>
          <Form.Item name="copyright" label="متن کپی‌رایت">
            <Input placeholder="متن کپی‌رایت" size="large" />
          </Form.Item>
        </div>
      ),
    },
    // ===== تب ۲: ظاهر =====
    {
      key: '2',
      label: <span><BgColorsOutlined /> ظاهر</span>,
      children: (
        <div style={{ maxWidth: 700 }}>
          <Alert title="تنظیمات ظاهری" description="رنگ‌ها، فونت و جهت نمایش را تنظیم کنید." type="info" showIcon style={{ marginBottom: 16 }} />
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="primaryColor" label="رنگ اصلی">
                <ColorPicker size="large" presets={[{ label: 'پیشنهادی', colors: ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2'] }]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="secondaryColor" label="رنگ ثانویه">
                <ColorPicker size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="fontFamily" label="فونت">
                <Select size="large">
                  <Option value="Vazirmatn">Vazirmatn</Option>
                  <Option value="IRANSans">IRANSans</Option>
                  <Option value="Shabnam">Shabnam</Option>
                  <Option value="Yekan">Yekan</Option>
                  <Option value="Tanha">Tanha</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="direction" label="جهت نمایش">
                <Select size="large">
                  <Option value="rtl">راست‌چین</Option>
                  <Option value="ltr">چپ‌چین</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="defaultTheme" label="تم پیش‌فرض">
            <Select size="large">
              <Option value="light">روشن</Option>
              <Option value="dark">تاریک</Option>
            </Select>
          </Form.Item>
          <Divider>لوگو و آیکون</Divider>
          <Row gutter={[24, 0]} align="middle">
            <Col xs={24} md={12}>
              <Form.Item label="لوگو">
                <Upload {...uploadProps}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', border: '2px dashed var(--border-color)', borderRadius: '10px', cursor: 'pointer' }}>
                    {logoUrl ? <Avatar src={logoUrl} size={64} shape="square" /> : <FileImageOutlined style={{ fontSize: 32, color: 'var(--text-muted)' }} />}
                    <div>
                      <Text strong>آپلود لوگو</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>فرمت‌های PNG, JPG, SVG</Text>
                    </div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="آیکون مرورگر (Favicon)">
                <Upload {...faviconUploadProps}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', border: '2px dashed var(--border-color)', borderRadius: '10px', cursor: 'pointer' }}>
                    {faviconUrl ? <Avatar src={faviconUrl} size={32} shape="square" /> : <FileImageOutlined style={{ fontSize: 24, color: 'var(--text-muted)' }} />}
                    <div>
                      <Text strong>آپلود Favicon</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>اندازه ۳۲×۳۲ یا ۶۴×۶۴</Text>
                    </div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </div>
      ),
    },
    // ===== تب ۳: سایدبار =====
    {
      key: '3',
      label: <span><DatabaseOutlined /> سایدبار</span>,
      children: (
        <div style={{ maxWidth: 700 }}>
          <Alert title="تنظیمات سایدبار" description="عنوان و زیرعنوان سایدبار سمت چپ را تنظیم کنید." type="info" showIcon style={{ marginBottom: 16 }} />
          <Form.Item name="siteTitle" label="عنوان سایدبار" rules={[{ required: true }]}>
            <Input placeholder="عنوان سایدبار (مثلاً: مدیریت IT)" size="large" />
          </Form.Item>
          <Form.Item name="siteSubtitle" label="زیرعنوان سایدبار">
            <Input placeholder="زیرعنوان سایدبار" size="large" />
          </Form.Item>
          <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '10px', marginTop: 8 }}>
            <Text type="secondary">💡 این تنظیمات در سایدبار سمت چپ نمایش داده می‌شوند.</Text>
          </div>
        </div>
      ),
    },
    // ===== تب ۴: صفحه ورود =====
    {
      key: '4',
      label: <span><LoginOutlined /> صفحه ورود</span>,
      children: (
        <div style={{ maxWidth: 700 }}>
          <Alert title="تنظیمات صفحه ورود" description="عنوان، آیکون و زیرعنوان صفحه ورود را تنظیم کنید." type="info" showIcon style={{ marginBottom: 16 }} />
          <Form.Item name="loginTitle" label="عنوان صفحه ورود" rules={[{ required: true }]}>
            <Input placeholder="عنوان صفحه ورود (مثلاً: مدیریت IT)" size="large" />
          </Form.Item>
          <Form.Item name="loginIcon" label="آیکون صفحه ورود (Emoji)" extra={<Text type="secondary" style={{ fontSize: 12 }}>یک ایموجی ۱ یا ۲ کاراکتری وارد کنید</Text>}>
            <Input placeholder="مثلاً: 🏢 یا 🔐 یا 💻" maxLength={2} size="large" style={{ fontSize: 24, textAlign: 'center' }} />
          </Form.Item>
          <Form.Item name="loginSubtitle" label="زیرعنوان صفحه ورود">
            <Input placeholder="زیرعنوان صفحه ورود (مثلاً: وارد حساب کاربری خود شوید)" size="large" />
          </Form.Item>
        </div>
      ),
    },
    // ===== تب ۵: امنیت =====
    {
      key: '5',
      label: <span><SecurityScanOutlined /> امنیت</span>,
      children: (
        <div style={{ maxWidth: 700 }}>
          <Alert title="تنظیمات امنیتی" description="تنظیمات مربوط به امنیت سیستم را مدیریت کنید." type="warning" showIcon style={{ marginBottom: 16 }} />
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="maxLoginAttempts" label="حداکثر تلاش برای ورود">
                <InputNumber min={1} max={20} style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="sessionTimeout" label="زمان نشست (دقیقه)">
                <InputNumber min={5} max={1440} style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="twoFactorEnabled" label="فعال‌سازی تایید دو مرحله‌ای" valuePropName="checked">
            <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" />
          </Form.Item>
          <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '10px', marginTop: 8 }}>
            <Text type="secondary">🔐 با فعال‌سازی تایید دو مرحله‌ای، امنیت حساب‌ها افزایش می‌یابد.</Text>
          </div>
        </div>
      ),
    },
    // ===== تب ۶: اعلان‌ها =====
    {
      key: '6',
      label: <span><NotificationOutlined /> اعلان‌ها</span>,
      children: (
        <div style={{ maxWidth: 700 }}>
          <Alert title="تنظیمات اعلان‌ها" description="روش‌های ارسال اعلان را مدیریت کنید." type="info" showIcon style={{ marginBottom: 16 }} />
          <Form.Item name="notificationEmail" label="ایمیل برای اعلان‌ها">
            <Input prefix={<MailOutlined />} placeholder="notifications@example.com" size="large" />
          </Form.Item>
          <Form.Item name="notificationSms" label="ارسال اعلان از طریق پیامک" valuePropName="checked">
            <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" />
          </Form.Item>
          <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '10px', marginTop: 8 }}>
            <Text type="secondary">📱 برای فعال‌سازی پیامک، تنظیمات سرویس پیامک را پیکربندی کنید.</Text>
          </div>
        </div>
      ),
    },
    // ===== تب ۷: API =====
    {
      key: '7',
      label: <span><ApiOutlined /> API</span>,
      children: (
        <div style={{ maxWidth: 700 }}>
          <Alert title="تنظیمات API" description="محدودیت‌های درخواست و زمان پاسخ API را مدیریت کنید." type="info" showIcon style={{ marginBottom: 16 }} />
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="apiRateLimit" label="محدودیت درخواست در دقیقه">
                <InputNumber min={10} max={1000} style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="apiTimeout" label="زمان پاسخ (ثانیه)">
                <InputNumber min={5} max={120} style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
          </Row>
        </div>
      ),
    },
    // ===== تب ۸: دپارتمان‌ها =====
    {
      key: '8',
      label: <span><TeamOutlined /> دپارتمان‌ها</span>,
      children: (
        <div>
          <Alert title="مدیریت دپارتمان‌ها" description="دپارتمان‌ها برای دسته‌بندی کاربران و محدودیت دسترسی استفاده می‌شوند." type="info" showIcon style={{ marginBottom: 16 }} />
          <DepartmentManager />
        </div>
      ),
    },
    // ===== تب ۹: پشتیبان‌گیری =====
    {
      key: '9',
      label: <span><DatabaseOutlined /> پشتیبان‌گیری</span>,
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <Title level={4} style={{ margin: 0 }}>💾 مدیریت پشتیبان‌گیری</Title>
            <Space wrap>
              <Upload {...restoreUploadProps}>
                <Button icon={<UploadOutlined />} loading={restoreLoading}>آپلود و بازگردانی</Button>
              </Upload>
              {selectedRowKeys.length > 0 && (
                <Button danger icon={<DeleteOutlined />} onClick={handleBulkDelete} loading={bulkDeleteLoading}>
                  حذف انتخاب‌شده‌ها ({selectedRowKeys.length})
                </Button>
              )}
              <Button icon={<ReloadOutlined />} onClick={fetchBackupList} loading={backupListLoading}>بروزرسانی</Button>
              <Button type="primary" icon={<CloudUploadOutlined />} onClick={handleManualBackup} loading={backupLoading}>
                {backupLoading ? 'در حال پشتیبان‌گیری...' : 'پشتیبان‌گیری'}
              </Button>
            </Space>
          </div>

          <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Text type="secondary">📋 تعداد پشتیبان‌ها: <strong>{backupList.length}</strong></Text>
              <Text type="secondary">💾 آخرین پشتیبان: {backupList.length > 0 ? moment(backupList[0].createdAt).format('jYYYY/jMM/jDD HH:mm') : 'هیچی'}</Text>
              {selectedRowKeys.length > 0 && <Tag color="blue">{selectedRowKeys.length} فایل انتخاب شده</Tag>}
            </div>
          </Card>

          <Table
            columns={backupColumns}
            dataSource={backupList}
            rowKey="name"
            loading={backupListLoading}
            rowSelection={rowSelection}
            pagination={{ pageSize: 5 }}
            locale={{
              emptyText: (
                <div style={{ padding: '40px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>📭</div>
                  <Text type="secondary">هیچ پشتیبان‌گیری انجام نشده است</Text>
                  <br />
                  <Button type="primary" style={{ marginTop: 16 }} icon={<CloudUploadOutlined />} onClick={handleManualBackup}>اولین پشتیبان‌گیری</Button>
                </div>
              ),
            }}
          />

          <Card size="small" style={{ marginTop: 16, background: '#fffbe6', borderColor: '#ffe58f' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ⚠️ توجه: بازگردانی پشتیبان تمام داده‌های فعلی سیستم را حذف و با داده‌های پشتیبان جایگزین می‌کند. این عملیات غیرقابل بازگشت است.
            </Text>
          </Card>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" description="در حال بارگذاری تنظیمات..." />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: '12px' }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          ⚙️ تنظیمات سیستم
          <Tag color="blue" style={{ fontSize: '13px' }}>مدیریت</Tag>
        </Title>
        <Button icon={<RollbackOutlined />} onClick={() => navigate('/')}>بازگشت</Button>
      </div>

      <Card style={{ borderRadius: 'var(--radius)' }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Tabs defaultActiveKey="1" type="card" size="large" items={tabItems} />
          <Divider />
          <Form.Item>
            <Space size="middle">
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting} size="large">ذخیره تنظیمات</Button>
              <Button icon={<RollbackOutlined />} onClick={() => navigate('/')} size="large">بازگشت</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default SystemSettings;
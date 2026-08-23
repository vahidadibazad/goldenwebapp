import { useState, useEffect, useRef } from 'react';
import { Form, Input, Select, Button, Card, Typography, Upload, Spin, Tag, App, Space, DatePicker } from 'antd';
import { SaveOutlined, RollbackOutlined, UploadOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

function DocumentUpload() {
  const navigate = useNavigate();
  const { message } = App.useApp(); // ✅ فقط از App.useApp()
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [suggestedCategory, setSuggestedCategory] = useState(null);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [classifyLoading, setClassifyLoading] = useState(false);
  const titleInputRef = useRef(null);

  useEffect(() => {
    api
      .get('/categories/document')
      .then((res) => setCategories(res.data.data || []))
      .catch(() => message.error('خطا در دریافت دسته‌بندی‌ها'));
  }, [message]);

  const handleTitleChange = async (e) => {
    const title = e.target.value;
    if (title.length < 3) {
      setSuggestedCategory(null);
      setSuggestedTags([]);
      return;
    }

    setClassifyLoading(true);
    try {
      const res = await api.post('/documents/classify', { title });
      const data = res.data.data;

      setSuggestedCategory(data.category);
      setSuggestedTags(data.matchedWords || []);

      if (data.confidence === 'high') {
        form.setFieldsValue({ category: data.category });
      }

      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
        }
      }, 50);
    } catch (error) {
      console.error('خطا در دسته‌بندی:', error);
    } finally {
      setClassifyLoading(false);
    }
  };

  const onFinish = async (values) => {
    if (fileList.length === 0) {
      message.error('لطفاً یک فایل انتخاب کنید');
      return;
    }

    if (!values.title || values.title.trim() === '') {
      message.error('عنوان سند الزامی است');
      return;
    }

    if (!values.category) {
      message.error('لطفاً یک دسته‌بندی انتخاب کنید');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj);
      formData.append('title', values.title.trim());
      formData.append('description', values.description || '');
      formData.append('tags', values.tags || '');
      formData.append('category', values.category);
      formData.append('accessLevel', values.accessLevel || 'public');
      formData.append('department', values.department || 'All');

      if (values.accessExpiry) {
        formData.append('accessExpiry', values.accessExpiry.toISOString());
      }

      const response = await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (response.data.success) {
        message.success('سند با موفقیت آپلود شد');
        navigate('/documents');
      }
    } catch (error) {
      console.error('❌ خطا در آپلود:', error);
      const serverError = error.response?.data;
      if (serverError) {
        message.error(serverError.error || serverError.message || 'خطا در آپلود سند');
      } else {
        message.error(error.message || 'خطا در آپلود سند');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const uploadProps = {
    onRemove: () => setFileList([]),
    beforeUpload: (file) => {
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('حجم فایل باید کمتر از 10 مگابایت باشد');
        return false;
      }
      setFileList([file]);
      return false;
    },
    fileList,
  };

  return (
    <div className="fade-in">
      <Card style={{ borderRadius: 'var(--radius)' }}>
        <Title level={2} style={{ marginBottom: 24 }}>
          📄 آپلود سند جدید
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            accessLevel: 'public',
            department: 'All',
          }}
        >
          <Form.Item
            label="فایل"
            required
            validateStatus={fileList.length === 0 ? 'error' : 'success'}
            help={fileList.length === 0 ? 'لطفاً یک فایل انتخاب کنید' : ''}
          >
            <Upload {...uploadProps} maxCount={1}>
              <Button icon={<UploadOutlined />}>انتخاب فایل</Button>
            </Upload>
            {fileList.length > 0 && (
              <Tag color="green" style={{ marginTop: 8 }}>
                {fileList[0].name} ({(fileList[0].size / 1024).toFixed(1)} KB)
              </Tag>
            )}
          </Form.Item>

          <Form.Item
            name="title"
            label="عنوان سند"
            rules={[{ required: true, message: 'عنوان را وارد کنید' }]}
          >
            <Input
              ref={titleInputRef}
              placeholder="عنوان سند را وارد کنید"
              onChange={handleTitleChange}
              size="middle"
              suffix={classifyLoading && <Spin size="small" />}
            />
          </Form.Item>

          {suggestedCategory && (
            <div
              style={{
                padding: 12,
                background: '#e6f7ff',
                borderRadius: 8,
                marginBottom: 16,
                border: '1px solid #91d5ff',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <span>
                  💡 <strong>پیشنهاد سیستم:</strong> این سند در دسته‌ی
                  <Tag color="blue" style={{ margin: '0 8px' }}>
                    {suggestedCategory}
                  </Tag>
                  قرار می‌گیرد.
                  {suggestedTags.length > 0 && (
                    <span style={{ fontSize: 12, color: '#666' }}>
                      (کلمات کلیدی: {suggestedTags.join('، ')})
                    </span>
                  )}
                </span>
                <div>
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => {
                      form.setFieldsValue({ category: suggestedCategory });
                      setTimeout(() => {
                        if (titleInputRef.current) {
                          titleInputRef.current.focus();
                        }
                      }, 50);
                    }}
                  >
                    تأیید
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Form.Item name="description" label="توضیحات">
            <Input.TextArea rows={3} placeholder="توضیحات اختیاری" size="middle" />
          </Form.Item>

          <Form.Item name="tags" label="برچسب‌ها">
            <Input placeholder="مثلاً: گزارش، مالی، سالانه (با کاما جدا کنید)" size="middle" />
          </Form.Item>

          <Form.Item name="category" label="دسته‌بندی" rules={[{ required: true, message: 'دسته‌بندی را انتخاب کنید' }]}>
            <Select placeholder="انتخاب دسته‌بندی" size="middle">
              {categories.map((c) => (
                <Option key={c._id} value={c.name}>
                  {c.icon} {c.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div
            style={{
              background: 'var(--bg-secondary)',
              padding: '16px',
              borderRadius: '10px',
              marginBottom: 16,
            }}
          >
            <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: 12 }}>
              🔐 تنظیمات دسترسی پیشرفته
            </Text>

            <Form.Item name="accessLevel" label="سطح دسترسی">
              <Select placeholder="انتخاب سطح دسترسی" size="middle">
                <Option value="public">🌐 عمومی - همه کاربران</Option>
                <Option value="restricted">🔒 محدود - کاربران با نقش خاص</Option>
                <Option value="confidential">🔐 محرمانه - فقط مدیران</Option>
              </Select>
            </Form.Item>

            <Form.Item name="department" label="دپارتمان">
              <Select placeholder="انتخاب دپارتمان" size="middle">
                <Option value="All">همه دپارتمان‌ها</Option>
                <Option value="IT">فناوری اطلاعات (IT)</Option>
                <Option value="HR">منابع انسانی (HR)</Option>
                <Option value="Finance">مالی (Finance)</Option>
                <Option value="Marketing">بازاریابی (Marketing)</Option>
                <Option value="Sales">فروش (Sales)</Option>
                <Option value="Operations">عملیات (Operations)</Option>
              </Select>
            </Form.Item>

            <Form.Item name="accessExpiry" label="تاریخ انقضای دسترسی">
              <DatePicker
                placeholder="انتخاب تاریخ انقضا"
                size="middle"
                style={{ width: '100%' }}
                format="YYYY/MM/DD"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              اگر انتخاب نشود، دسترسی هیچ‌وقت منقضی نمی‌شود
            </Text>
          </div>

          <Form.Item>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting} size="middle">
                آپلود
              </Button>
              <Button icon={<RollbackOutlined />} onClick={() => navigate('/documents')} size="middle">
                بازگشت
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default DocumentUpload;
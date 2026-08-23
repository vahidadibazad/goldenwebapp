// frontend/src/components/cms/PageForm.jsx
import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
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
  Tabs,
  Alert,
  Upload,
  Tag,
} from 'antd';
import {
  SaveOutlined,
  RollbackOutlined,
  UploadOutlined,
  FileTextOutlined,
  GlobalOutlined,
  TagOutlined,
  EyeOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import cmsService from '../../services/cmsService';
import { toPersianDate } from '../../utils/dateHelper';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

function PageForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  const [pageData, setPageData] = useState(null);
  const [contentTypes, setContentTypes] = useState([]);
  const [activeTab, setActiveTab] = useState('1');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsPhone(window.innerWidth <= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // =============================================
  // دریافت اطلاعات
  // =============================================
  const fetchData = async () => {
    setLoading(true);
    try {
      // دریافت ContentTypes
      const typesRes = await cmsService.getContentTypes();
      const types = typesRes.data.data || [];
      setContentTypes(types);

      // پیدا کردن ContentType صفحات
      const pageType = types.find(t => t.apiName === 'pages');

      if (id) {
        const res = await cmsService.getEntryById(id);
        const data = res.data.data;
        setPageData(data);

        form.setFieldsValue({
          title: data.data?.title || '',
          content: data.data?.content || '',
          excerpt: data.data?.excerpt || '',
          status: data.status || 'draft',
          locale: data.locale || 'fa',
          isFeatured: data.isFeatured || false,
          isPinned: data.isPinned || false,
          metaTitle: data.metaData?.title || '',
          metaDescription: data.metaData?.description || '',
          metaKeywords: data.metaData?.keywords?.join(', ') || '',
          ogImage: data.metaData?.ogImage || '',
        });
      } else {
        form.setFieldsValue({
          status: 'draft',
          locale: 'fa',
          isFeatured: false,
          isPinned: false,
        });
      }
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
      navigate('/cms/pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // =============================================
  // ذخیره صفحه
  // =============================================
  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      // پیدا کردن ContentType صفحات
      const pageType = contentTypes.find(t => t.apiName === 'pages');
      if (!pageType) {
        message.error('نوع محتوای صفحات یافت نشد');
        setSubmitting(false);
        return;
      }

      const payload = {
        contentType: pageType._id,
        data: {
          title: values.title,
          content: values.content,
          excerpt: values.excerpt || '',
        },
        slug: values.title
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, ''),
        status: values.status || 'draft',
        locale: values.locale || 'fa',
        isFeatured: values.isFeatured || false,
        isPinned: values.isPinned || false,
        metaData: {
          title: values.metaTitle || '',
          description: values.metaDescription || '',
          keywords: values.metaKeywords ? values.metaKeywords.split(',').map(s => s.trim()) : [],
          ogImage: values.ogImage || '',
        },
      };

      if (id) {
        await cmsService.updateEntry(id, payload);
        message.success('صفحه با موفقیت ویرایش شد');
      } else {
        await cmsService.createEntry(payload);
        message.success('صفحه با موفقیت ایجاد شد');
      }

      navigate('/cms/pages');
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ذخیره');
      console.error('❌ خطا در onFinish:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // =============================================
  // انتشار صفحه
  // =============================================
  const handlePublish = async () => {
    try {
      if (!id) {
        message.error('ابتدا صفحه را ذخیره کنید');
        return;
      }
      await cmsService.publishEntry(id);
      message.success('صفحه با موفقیت منتشر شد');
      navigate('/cms/pages');
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در انتشار');
    }
  };

  // =============================================
  // پیش‌نمایش صفحه
  // =============================================
  const handlePreview = () => {
    const values = form.getFieldsValue();
    const slug = values.title
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '');
    window.open(`/page-preview/${slug || 'preview'}`, '_blank');
  };

  // =============================================
  // آیتم‌های تب‌ها
  // =============================================
  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <FileTextOutlined /> محتوا
        </span>
      ),
      children: (
        <>
          <Form.Item
            name="title"
            label="عنوان صفحه"
            rules={[{ required: true, message: 'عنوان صفحه الزامی است' }]}
          >
            <Input placeholder="عنوان صفحه را وارد کنید" size="large" />
          </Form.Item>

          <Form.Item
            name="content"
            label="متن صفحه"
            rules={[{ required: true, message: 'متن صفحه الزامی است' }]}
          >
            <TextArea
              rows={12}
              placeholder="متن کامل صفحه را وارد کنید..."
              size="large"
            />
          </Form.Item>

          <Form.Item name="excerpt" label="خلاصه">
            <TextArea
              rows={3}
              placeholder="خلاصه صفحه (اختیاری)"
              size="large"
            />
          </Form.Item>
        </>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <GlobalOutlined /> تنظیمات
        </span>
      ),
      children: (
        <>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="status" label="وضعیت">
                <Select size="large">
                  <Option value="draft">پیش‌نویس</Option>
                  <Option value="published">منتشر شده</Option>
                  <Option value="archived">بایگانی</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="locale" label="زبان">
                <Select size="large">
                  <Option value="fa">🇮🇷 فارسی</Option>
                  <Option value="en">🇬🇧 انگلیسی</Option>
                  <Option value="ar">🇸🇦 عربی</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="isFeatured" label="ویژه" valuePropName="checked">
                <Switch checkedChildren="بله" unCheckedChildren="خیر" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="isPinned" label="پین شده" valuePropName="checked">
                <Switch checkedChildren="بله" unCheckedChildren="خیر" />
              </Form.Item>
            </Col>
          </Row>

          {id && pageData && (
            <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                🆔 شناسه: {pageData._id}
                <br />
                📅 ایجاد: {toPersianDate(pageData.createdAt)}
                {pageData.publishedAt && (
                  <>
                    <br />
                    📅 انتشار: {toPersianDate(pageData.publishedAt)}
                  </>
                )}
                <br />
                👁️ بازدید: {pageData.viewCount || 0}
              </Text>
            </div>
          )}
        </>
      ),
    },
    {
      key: '3',
      label: (
        <span>
          <TagOutlined /> SEO
        </span>
      ),
      children: (
        <>
          <Alert
            message="تنظیمات سئو"
            description="این تنظیمات برای بهینه‌سازی صفحه در موتورهای جستجو استفاده می‌شود"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item name="metaTitle" label="عنوان سئو">
            <Input placeholder="عنوان صفحه برای موتورهای جستجو" size="large" />
          </Form.Item>

          <Form.Item name="metaDescription" label="توضیحات سئو">
            <TextArea
              rows={2}
              placeholder="توضیحات مختصر برای موتورهای جستجو (حداکثر ۱۵۰ کاراکتر)"
              size="large"
              maxLength={150}
            />
          </Form.Item>

          <Form.Item name="metaKeywords" label="کلمات کلیدی">
            <Input placeholder="کلمات کلیدی را با کاما جدا کنید" size="large" />
          </Form.Item>

          <Form.Item name="ogImage" label="تصویر Open Graph">
            <Input placeholder="آدرس تصویر برای اشتراک‌گذاری در شبکه‌های اجتماعی" size="large" />
          </Form.Item>
        </>
      ),
    },
  ];

  // =============================================
  // بارگذاری
  // =============================================
  if (loading) {
    return (
      <Card style={{ borderRadius: 'var(--radius)' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>در حال بارگذاری...</div>
        </div>
      </Card>
    );
  }

  const isDraft = pageData?.status === 'draft' || !id;

  // =============================================
  // Render
  // =============================================
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
          <Title level={isPhone ? 4 : isMobile ? 3 : 2} style={{ margin: 0 }}>
            {id ? '✏️ ویرایش صفحه' : '➕ صفحه جدید'}
          </Title>
          <Space wrap>
            <Button icon={<RollbackOutlined />} onClick={() => navigate('/cms/pages')}>
              بازگشت
            </Button>
            {id && (
              <>
                <Button
                  icon={<EyeOutlined />}
                  onClick={handlePreview}
                >
                  پیش‌نمایش
                </Button>
                {isDraft && (
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handlePublish}
                  >
                    انتشار
                  </Button>
                )}
              </>
            )}
          </Space>
        </div>

        {/* هشدار وضعیت */}
        {id && !isDraft && (
          <Alert
            message={`صفحه در وضعیت "${pageData?.status === 'published' ? 'منتشر شده' : 'بایگانی'}" می‌باشد`}
            description="فقط صفحات در وضعیت پیش‌نویس قابل ویرایش هستند"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* فرم */}
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={id && !isDraft}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
          />

          <Divider />

          {/* دکمه‌های اقدام */}
          <Form.Item>
            <Space size="middle" wrap>
              {(!id || isDraft) && (
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={submitting}
                  size="large"
                >
                  {id ? 'ذخیره تغییرات' : 'ثبت صفحه'}
                </Button>
              )}
              {id && isDraft && (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handlePublish}
                  size="large"
                  style={{ background: '#52c41a' }}
                >
                  ذخیره و انتشار
                </Button>
              )}
              <Button
                icon={<RollbackOutlined />}
                onClick={() => navigate('/cms/pages')}
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

export default PageForm;
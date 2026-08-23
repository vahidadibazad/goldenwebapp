// frontend/src/components/cms/PostForm.jsx
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
  FolderOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import cmsService from '../../services/cmsService';
import { toPersianDate } from '../../utils/dateHelper';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

function PostForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  const [postData, setPostData] = useState(null);
  const [contentTypes, setContentTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [activeTab, setActiveTab] = useState('1');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

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
      // دریافت ContentTypes, Categories, Tags
      const [typesRes, catRes, tagRes] = await Promise.all([
        cmsService.getContentTypes(),
        cmsService.getCategories(),
        cmsService.getTags({ limit: 100 }),
      ]);

      const types = typesRes.data.data || [];
      setContentTypes(types);
      setCategories(catRes.data.data || []);
      setTags(tagRes.data.data || []);

      // پیدا کردن ContentType نوشته‌ها
      const postType = types.find(t => t.apiName === 'posts');

      if (id) {
        const res = await cmsService.getEntryById(id);
        const data = res.data.data;
        setPostData(data);
        setSelectedCategories(data.categories || []);
        setSelectedTags(data.tags || []);

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
      navigate('/cms/posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // =============================================
  // ذخیره نوشته
  // =============================================
  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      // پیدا کردن ContentType نوشته‌ها
      const postType = contentTypes.find(t => t.apiName === 'posts');
      if (!postType) {
        message.error('نوع محتوای نوشته‌ها یافت نشد');
        setSubmitting(false);
        return;
      }

      const payload = {
        contentType: postType._id,
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
        categories: selectedCategories,
        tags: selectedTags,
        metaData: {
          title: values.metaTitle || '',
          description: values.metaDescription || '',
          keywords: values.metaKeywords ? values.metaKeywords.split(',').map(s => s.trim()) : [],
          ogImage: values.ogImage || '',
        },
      };

      if (id) {
        await cmsService.updateEntry(id, payload);
        message.success('نوشته با موفقیت ویرایش شد');
      } else {
        await cmsService.createEntry(payload);
        message.success('نوشته با موفقیت ایجاد شد');
      }

      navigate('/cms/posts');
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ذخیره');
      console.error('❌ خطا در onFinish:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // =============================================
  // انتشار نوشته
  // =============================================
  const handlePublish = async () => {
    try {
      if (!id) {
        message.error('ابتدا نوشته را ذخیره کنید');
        return;
      }
      await cmsService.publishEntry(id);
      message.success('نوشته با موفقیت منتشر شد');
      navigate('/cms/posts');
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در انتشار');
    }
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
            label="عنوان نوشته"
            rules={[{ required: true, message: 'عنوان نوشته الزامی است' }]}
          >
            <Input placeholder="عنوان نوشته را وارد کنید" size="large" />
          </Form.Item>

          <Form.Item
            name="content"
            label="متن نوشته"
            rules={[{ required: true, message: 'متن نوشته الزامی است' }]}
          >
            <TextArea
              rows={12}
              placeholder="متن کامل نوشته را وارد کنید..."
              size="large"
            />
          </Form.Item>

          <Form.Item name="excerpt" label="خلاصه">
            <TextArea
              rows={3}
              placeholder="خلاصه نوشته (اختیاری)"
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

          {id && postData && (
            <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                🆔 شناسه: {postData._id}
                <br />
                📅 ایجاد: {toPersianDate(postData.createdAt)}
                {postData.publishedAt && (
                  <>
                    <br />
                    📅 انتشار: {toPersianDate(postData.publishedAt)}
                  </>
                )}
                <br />
                👁️ بازدید: {postData.viewCount || 0}
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
          <FolderOutlined /> دسته‌بندی و برچسب
        </span>
      ),
      children: (
        <>
          <Form.Item label="دسته‌بندی‌ها">
            <Select
              mode="multiple"
              placeholder="انتخاب دسته‌بندی‌ها"
              value={selectedCategories}
              onChange={setSelectedCategories}
              size="large"
              style={{ width: '100%' }}
              optionFilterProp="children"
            >
              {categories.map(cat => (
                <Option key={cat._id} value={cat._id}>
                  {cat.icon} {cat.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="برچسب‌ها">
            <Select
              mode="multiple"
              placeholder="انتخاب برچسب‌ها"
              value={selectedTags}
              onChange={setSelectedTags}
              size="large"
              style={{ width: '100%' }}
              optionFilterProp="children"
            >
              {tags.map(tag => (
                <Option key={tag._id} value={tag._id}>
                  {tag.icon} {tag.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {selectedCategories.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                دسته‌بندی‌های انتخاب شده: {selectedCategories.length}
              </Text>
              <div style={{ marginTop: 4 }}>
                {selectedCategories.map(id => {
                  const cat = categories.find(c => c._id === id);
                  return cat ? (
                    <Tag key={id} color="blue" style={{ margin: 2 }}>
                      {cat.icon} {cat.name}
                    </Tag>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {selectedTags.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                برچسب‌های انتخاب شده: {selectedTags.length}
              </Text>
              <div style={{ marginTop: 4 }}>
                {selectedTags.map(id => {
                  const tag = tags.find(t => t._id === id);
                  return tag ? (
                    <Tag key={id} color="purple" style={{ margin: 2 }}>
                      {tag.icon} {tag.name}
                    </Tag>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </>
      ),
    },
    {
      key: '4',
      label: (
        <span>
          <TagOutlined /> SEO
        </span>
      ),
      children: (
        <>
          <Alert
            message="تنظیمات سئو"
            description="این تنظیمات برای بهینه‌سازی نوشته در موتورهای جستجو استفاده می‌شود"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item name="metaTitle" label="عنوان سئو">
            <Input placeholder="عنوان نوشته برای موتورهای جستجو" size="large" />
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

  const isDraft = postData?.status === 'draft' || !id;

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
            {id ? '✏️ ویرایش نوشته' : '➕ نوشته جدید'}
          </Title>
          <Space wrap>
            <Button icon={<RollbackOutlined />} onClick={() => navigate('/cms/posts')}>
              بازگشت
            </Button>
            {id && isDraft && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handlePublish}
              >
                انتشار
              </Button>
            )}
          </Space>
        </div>

        {/* هشدار وضعیت */}
        {id && !isDraft && (
          <Alert
            message={`نوشته در وضعیت "${postData?.status === 'published' ? 'منتشر شده' : 'بایگانی'}" می‌باشد`}
            description="فقط نوشته‌های در وضعیت پیش‌نویس قابل ویرایش هستند"
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
                  {id ? 'ذخیره تغییرات' : 'ثبت نوشته'}
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
                onClick={() => navigate('/cms/posts')}
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

export default PostForm;
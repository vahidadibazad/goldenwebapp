// frontend/src/pages/cms/PublicPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Spin, Typography, Divider, Tag, Button, Space, Avatar, Empty } from 'antd';
import { CalendarOutlined, UserOutlined, EyeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import cmsService from '../../services/cmsService';
import { toPersianDate } from '../../utils/dateHelper';

const { Title, Text, Paragraph } = Typography;

function PublicPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const res = await cmsService.getEntryBySlug(slug);
        setPage(res.data.data);
        setError(null);
      } catch (err) {
        console.error('❌ خطا در دریافت صفحه:', err);
        setError('صفحه مورد نظر یافت نشد');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    }
  }, [slug]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="در حال بارگذاری..." />
      </div>
    );
  }

  if (error || !page) {
    return (
      <Card style={{ borderRadius: 'var(--radius)', textAlign: 'center', padding: '40px 0' }}>
        <Empty
          image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
          description="صفحه مورد نظر یافت نشد"
        >
          <Link to="/">
            <Button type="primary">بازگشت به صفحه اصلی</Button>
          </Link>
        </Empty>
      </Card>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card style={{ borderRadius: 'var(--radius)' }}>
        {/* هدر */}ticle>
          <Link to="/">
            <Button icon={<ArrowLeftOutlined />} type="text">
              بازگشت
            </Button>
          </Link>
        </div>

        <Title level={1} style={{ marginTop: 8, marginBottom: 16 }}>
          {page.data?.title || 'بدون عنوان'}
        </Title>

        <Space size="middle" wrap style={{ marginBottom: 16 }}>
          <Tag icon={<CalendarOutlined />} color="blue">
            {toPersianDate(page.publishedAt || page.createdAt)}
          </Tag>
          {page.createdBy && (
            <Tag icon={<UserOutlined />} color="green">
              {page.createdBy.fullName || page.createdBy.username}
            </Tag>
          )}
          <Tag icon={<EyeOutlined />} color="default">
            {page.viewCount || 0} بازدید
          </Tag>
          {page.isFeatured && (
            <Tag color="gold">⭐ ویژه</Tag>
          )}
        </Space>

        <Divider />

        <div style={{ fontSize: '16px', lineHeight: '2', whiteSpace: 'pre-wrap' }}>
          {page.data?.content || 'متن صفحه وارد نشده است'}
        </div>

        {page.metaData?.description && (
          <>
            <Divider />
            <Text type="secondary" style={{ fontSize: 14 }}>
              {page.metaData.description}
            </Text>
          </>
        )}
      </Card>
    </div>
  );
}

export default PublicPage;
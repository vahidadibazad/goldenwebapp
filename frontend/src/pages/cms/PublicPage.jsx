// src/pages/cms/PublicPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Spin, Typography, Card, Breadcrumb, Divider, Tag, Button, message } from 'antd';
import { HomeOutlined, CalendarOutlined, UserOutlined, EyeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import cmsService from '../../services/cmsService';
import DOMPurify from 'dompurify';

const { Title, Paragraph, Text } = Typography;

const PublicPage = () => {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const response = await cmsService.getPageBySlug(slug);
        if (response.data && response.data.data) {
          setPage(response.data.data);
        } else {
          setError('صفحه مورد نظر یافت نشد');
        }
      } catch (err) {
        console.error('Error fetching page:', err);
        setError('خطا در دریافت اطلاعات صفحه');
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" tip="در حال بارگذاری..." />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Title level={2}>خطا</Title>
        <Paragraph>{error || 'صفحه مورد نظر وجود ندارد'}</Paragraph>
        <Link to="/">
          <Button type="primary" icon={<ArrowLeftOutlined />}>
            بازگشت به صفحه اصلی
          </Button>
        </Link>
      </div>
    );
  }

  // پاک‌سازی محتوای HTML برای امنیت
  const sanitizedContent = DOMPurify.sanitize(page.content || '');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      {/* ===== مسیر راهنما (Breadcrumb) ===== */}
      <Breadcrumb
        items={[
          {
            href: '/',
            title: (
              <span>
                <HomeOutlined /> صفحه اصلی
              </span>
            ),
          },
          {
            title: page.title || 'صفحه',
          },
        ]}
        style={{ marginBottom: '24px' }}
      />

      {/* ===== محتوای اصلی ===== */}
      <Card>
        <article>
          {/* ===== عنوان صفحه ===== */}
          <Title level={1} style={{ marginBottom: '8px' }}>
            {page.title}
          </Title>

          {/* ===== متادیتا (تاریخ، نویسنده، بازدید) ===== */}
          {(page.createdAt || page.author || page.views) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', color: '#888' }}>
              {page.createdAt && (
                <span>
                  <CalendarOutlined /> انتشار: {new Date(page.createdAt).toLocaleDateString('fa-IR')}
                </span>
              )}
              {page.author && (
                <span>
                  <UserOutlined /> نویسنده: {page.author}
                </span>
              )}
              {page.views !== undefined && (
                <span>
                  <EyeOutlined /> بازدید: {page.views}
                </span>
              )}
            </div>
          )}

          <Divider />

          {/* ===== برچسب‌ها (Tags) ===== */}
          {page.tags && page.tags.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              {page.tags.map((tag) => (
                <Tag key={tag} color="blue">
                  {tag}
                </Tag>
              ))}
            </div>
          )}

          {/* ===== تصویر شاخص ===== */}
          {page.featuredImage && (
            <div style={{ marginBottom: '24px' }}>
              <img
                src={page.featuredImage}
                alt={page.title}
                style={{
                  width: '100%',
                  maxHeight: '400px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                }}
              />
            </div>
          )}

          {/* ===== محتوای اصلی (HTML امن) ===== */}
          <div
            className="page-content"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            style={{
              fontSize: '16px',
              lineHeight: '1.8',
              textAlign: 'justify',
            }}
          />

          <Divider />

          {/* ===== دکمه بازگشت ===== */}
          <Link to="/">
            <Button icon={<ArrowLeftOutlined />}>بازگشت به صفحه اصلی</Button>
          </Link>
        </article>
      </Card>
    </div>
  );
};

export default PublicPage;
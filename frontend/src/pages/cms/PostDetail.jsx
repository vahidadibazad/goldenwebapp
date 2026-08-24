// frontend/src/pages/cms/PostDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Spin, Typography, Divider, Tag, Button, Space, Avatar, Empty, Row, Col, Form, Input, message } from 'antd';
import { CalendarOutlined, UserOutlined, EyeOutlined, ArrowLeftOutlined, LikeOutlined, DislikeOutlined } from '@ant-design/icons';
import cmsService from '../../services/cmsService';
import { toPersianDate } from '../../utils/dateHelper';
import { useAuth } from '../../context/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

function PostDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentForm] = Form.useForm();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const res = await cmsService.getEntryBySlug(slug);
        setPost(res.data.data);
        setError(null);

        if (res.data.data._id) {
          const commentsRes = await cmsService.getComments(res.data.data._id);
          setComments(commentsRes.data.data || []);
        }
      } catch (err) {
        console.error('❌ خطا در دریافت نوشته:', err);
        setError('نوشته مورد نظر یافت نشد');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const handleCommentSubmit = async (values) => {
    if (!user) {
      message.error('برای ثبت کامنت باید وارد سیستم شوید');
      return;
    }

    setCommentLoading(true);
    try {
      const res = await cmsService.createComment({
        entryId: post._id,
        content: values.content,
        authorName: user.fullName || user.username,
        authorEmail: user.email,
      });
      setComments([res.data.data, ...comments]);
      commentForm.resetFields();
      message.success('کامنت با موفقیت ثبت شد و در انتظار تایید است');
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در ثبت کامنت');
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="در حال بارگذاری..." />
      </div>
    );
  }

  if (error || !post) {
    return (
      <Card style={{ borderRadius: 'var(--radius)', textAlign: 'center', padding: '40px 0' }}>
        <Empty
          image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
          description="نوشته مورد نظر یافت نشد"
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
        {/* هدر */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Link to="/">
            <Button icon={<ArrowLeftOutlined />} type="text">
              بازگشت
            </Button>
          </Link>
        </div>

        <Title level={1} style={{ marginTop: 8, marginBottom: 16 }}>
          {post.data?.title || 'بدون عنوان'}
        </Title>

        <Space size="middle" wrap style={{ marginBottom: 16 }}>
          <Tag icon={<CalendarOutlined />} color="blue">
            {toPersianDate(post.publishedAt || post.createdAt)}
          </Tag>
          {post.createdBy && (
            <Tag icon={<UserOutlined />} color="green">
              {post.createdBy.fullName || post.createdBy.username}
            </Tag>
          )}
          <Tag icon={<EyeOutlined />} color="default">
            {post.viewCount || 0} بازدید
          </Tag>
          {post.isFeatured && <Tag color="gold">⭐ ویژه</Tag>}
          {post.isPinned && <Tag color="red">📌 پین شده</Tag>}
          {post.categories?.map(cat => (
            <Tag key={cat._id} color="blue">{cat.name}</Tag>
          ))}
          {post.tags?.map(tag => (
            <Tag key={tag._id} color="purple">{tag.name}</Tag>
          ))}
        </Space>

        {post.data?.excerpt && (
          <Paragraph type="secondary" style={{ fontSize: 16, fontStyle: 'italic', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
            {post.data.excerpt}
          </Paragraph>
        )}

        <Divider />

        <div style={{ fontSize: '16px', lineHeight: '2', whiteSpace: 'pre-wrap' }}>
          {post.data?.content || 'متن نوشته وارد نشده است'}
        </div>

        {/* کامنت‌ها */}
        <Divider orientation="right">💬 کامنت‌ها ({comments.length})</Divider>

        {/* فرم کامنت */}
        {user ? (
          <Form form={commentForm} onFinish={handleCommentSubmit} layout="vertical">
            <Form.Item
              name="content"
              rules={[{ required: true, message: 'متن کامنت را وارد کنید' }]}
            >
              <TextArea rows={3} placeholder="نظر خود را بنویسید..." />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={commentLoading}>
              ارسال کامنت
            </Button>
          </Form>
        ) : (
          <Text type="secondary">برای ثبت کامنت <Link to="/login">وارد سیستم</Link> شوید</Text>
        )}

        <Divider style={{ margin: '16px 0' }} />

        {/* ✅ لیست کامنت‌ها با کارت (بدون Comment) */}
        {comments.length === 0 ? (
          <Text type="secondary">هنوز کامنتی ثبت نشده است</Text>
        ) : (
          comments.map(comment => (
            <Card 
              key={comment._id}
              size="small"
              style={{ marginBottom: 12, borderRadius: 8 }}
              bodyStyle={{ padding: '12px 16px' }}
            >
              <Space align="start" size="middle">
                <Avatar icon={<UserOutlined />} />
                <div>
                  <Text strong>{comment.author?.name || comment.user?.fullName || 'ناشناس'}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {toPersianDate(comment.createdAt)}
                  </Text>
                  <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                    {comment.content}
                  </Paragraph>
                </div>
              </Space>
            </Card>
          ))
        )}
      </Card>
    </div>
  );
}

export default PostDetail;
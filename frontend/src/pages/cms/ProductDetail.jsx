// frontend/src/pages/cms/ProductDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Card,
  Spin,
  Typography,
  Button,
  Space,
  Tag,
  Rate,
  Image,
  Row,
  Col,
  Divider,
  InputNumber,
  message,
  Tabs,
  Empty,
  Badge,
} from 'antd';
import {
  ArrowLeftOutlined,
  ShoppingCartOutlined,
  HeartOutlined,
  HeartFilled,
  ShareAltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import cmsService from '../../services/cmsService';
import { toPersianPrice } from '../../utils/numberHelper';
import { toPersianDate } from '../../utils/dateHelper';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await cmsService.getProductBySlug(slug);
        setProduct(res.data.data);
        
        // دریافت محصولات مرتبط
        if (res.data.data.categories?.length > 0) {
          const relatedRes = await cmsService.getProducts({
            category: res.data.data.categories[0],
            limit: 4,
          });
          setRelatedProducts(relatedRes.data.data || []);
        }
      } catch (error) {
        console.error('❌ خطا در دریافت محصول:', error);
        message.error('محصول مورد نظر یافت نشد');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const handleAddToCart = () => {
    message.success(`${product.name} با تعداد ${quantity} به سبد خرید اضافه شد`);
  };

  const handleAddToWishlist = () => {
    message.success(`${product.name} به علاقه‌مندی‌ها اضافه شد`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="در حال بارگذاری..." />
      </div>
    );
  }

  if (!product) {
    return (
      <Card style={{ borderRadius: 'var(--radius)', textAlign: 'center', padding: '40px 0' }}>
        <Empty description="محصول یافت نشد">
          <Link to="/products">
            <Button type="primary">بازگشت به لیست محصولات</Button>
          </Link>
        </Empty>
      </Card>
    );
  }

  const isInStock = product.stock > 0;
  const images = product.images || [];
  const mainImage = images[selectedImage]?.url || product.featuredImage || '';

  return (
    <div className="fade-in">
      {/* هدر */}
      <div style={{ marginBottom: 16 }}>
        <Link to="/products">
          <Button icon={<ArrowLeftOutlined />} type="text">
            بازگشت به لیست محصولات
          </Button>
        </Link>
      </div>

      <Card style={{ borderRadius: 'var(--radius)' }}>
        <Row gutter={[32, 32]}>
          {/* تصاویر */}
          <Col xs={24} md={12}>
            <div style={{ position: 'relative' }}>
              <Image
                src={mainImage || '/placeholder-image.png'}
                alt={product.name}
                style={{ width: '100%', maxHeight: 400, objectFit: 'contain', background: '#f5f5f5' }}
              />
              {product.isOnSale && (
                <Badge.Ribbon text={`${product.discountPercent}% تخفیف`} color="red" style={{ position: 'absolute', top: 0, right: 0 }} />
              )}
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto' }}>
                {images.map((img, index) => (
                  <img
                    key={index}
                    src={img.url}
                    alt={img.alt || product.name}
                    onClick={() => setSelectedImage(index)}
                    style={{
                      width: 60,
                      height: 60,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: selectedImage === index ? '2px solid #1677ff' : '1px solid #d9d9d9',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            )}
          </Col>

          {/* اطلاعات محصول */}
          <Col xs={24} md={12}>
            <Title level={3}>{product.name}</Title>
            
            <Space size="middle" wrap style={{ marginBottom: 12 }}>
              <Rate disabled defaultValue={product.averageRating || 0} allowHalf />
              <Text type="secondary">({product.ratingCount || 0} نظر)</Text>
              {product.isBestSeller && <Tag color="gold">🏆 پرفروش</Tag>}
              {product.isFeatured && <Tag color="purple">⭐ ویژه</Tag>}
              {isInStock ? (
                <Tag color="success" icon={<CheckCircleOutlined />}>موجود</Tag>
              ) : (
                <Tag color="error" icon={<ClockCircleOutlined />}>ناموجود</Tag>
              )}
            </Space>

            <div style={{ marginBottom: 16 }}>
              {product.isOnSale ? (
                <>
                  <Text delete type="secondary" style={{ fontSize: 16 }}>
                    {toPersianPrice(product.price)}
                  </Text>
                  <Text strong style={{ fontSize: 24, color: '#ff4d4f', marginLeft: 12 }}>
                    {toPersianPrice(product.salePrice)}
                  </Text>
                  <Tag color="red" style={{ marginLeft: 12 }}>
                    {product.discountPercent}% تخفیف
                  </Tag>
                </>
              ) : (
                <Text strong style={{ fontSize: 24 }}>
                  {toPersianPrice(product.price)}
                </Text>
              )}
            </div>

            <Paragraph style={{ marginBottom: 16 }}>
              {product.shortDescription || product.description?.substring(0, 200)}
            </Paragraph>

            {/* موجودی */}
            {isInStock && (
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary">موجودی: {product.stock} عدد</Text>
              </div>
            )}

            {/* انتخاب تعداد */}
            {isInStock && (
              <Space size="middle" style={{ marginBottom: 16 }}>
                <Text>تعداد:</Text>
                <InputNumber
                  min={1}
                  max={product.stock}
                  value={quantity}
                  onChange={setQuantity}
                  style={{ width: 80 }}
                />
              </Space>
            )}

            {/* دکمه‌های اقدام */}
            <Space size="middle" wrap>
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                onClick={handleAddToCart}
                disabled={!isInStock}
              >
                {isInStock ? 'افزودن به سبد خرید' : 'ناموجود'}
              </Button>
              <Button
                size="large"
                icon={<HeartOutlined />}
                onClick={handleAddToWishlist}
              >
                علاقه‌مندی
              </Button>
              <Button
                size="large"
                icon={<ShareAltOutlined />}
              >
                اشتراک‌گذاری
              </Button>
            </Space>

            <Divider />

            {/* جزئیات */}
            <Tabs defaultActiveKey="1">
              <TabPane tab="توضیحات" key="1">
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                  {product.description || 'توضیحاتی برای این محصول ثبت نشده است'}
                </div>
              </TabPane>
              <TabPane tab="ویژگی‌ها" key="2">
                {product.attributes?.length > 0 ? (
                  product.attributes.map((attr, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <Text strong>{attr.name}</Text>
                      <Text>{attr.value}</Text>
                    </div>
                  ))
                ) : (
                  <Text type="secondary">هیچ ویژگی ثبت نشده است</Text>
                )}
              </TabPane>
              <TabPane tab="نظرات" key="3">
                {product.ratings?.length > 0 ? (
                  product.ratings.map((rating, index) => (
                    <div key={index} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <Rate disabled defaultValue={rating.rating} style={{ fontSize: 12 }} />
                      <Text style={{ marginLeft: 8 }}>{rating.user?.fullName || 'کاربر'}</Text>
                      <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                        {toPersianDate(rating.createdAt)}
                      </Text>
                      {rating.comment && (
                        <div style={{ marginTop: 4 }}>{rating.comment}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <Text type="secondary">هیچ نظری ثبت نشده است</Text>
                )}
              </TabPane>
            </Tabs>
          </Col>
        </Row>
      </Card>

      {/* محصولات مرتبط */}
      {relatedProducts.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Title level={4}>محصولات مرتبط</Title>
          <Row gutter={[16, 16]}>
            {relatedProducts.filter(p => p._id !== product._id).slice(0, 4).map(p => (
              <Col key={p._id} xs={12} sm={8} md={6}>
                <Card
                  hoverable
                  cover={
                    <div style={{ height: 120, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                      {p.images?.[0]?.url ? (
                        <img src={p.images[0].url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ fontSize: 32 }}>📦</div>
                      )}
                    </div>
                  }
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <Link to={`/products/${p.slug}`}>
                    <Text strong style={{ fontSize: 12 }}>{p.name}</Text>
                    <div>
                      <Text strong style={{ fontSize: 14, color: '#1677ff' }}>
                        {toPersianPrice(p.isOnSale ? p.salePrice : p.price)}
                      </Text>
                    </div>
                  </Link>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;
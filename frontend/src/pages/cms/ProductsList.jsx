// frontend/src/pages/cms/ProductsList.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Spin,
  Typography,
  Input,
  Select,
  Button,
  Empty,
  Tag,
  Space,
  Pagination,
  Rate,
  Badge,
  message,
} from 'antd';
import {
  SearchOutlined,
  ShoppingCartOutlined,
  HeartOutlined,
  HeartFilled,
  FilterOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import cmsService from '../../services/cmsService';
import { toPersianPrice } from '../../utils/numberHelper';

const { Title, Text } = Typography;
const { Option } = Select;

function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    sort: 'newest',
    minPrice: '',
    maxPrice: '',
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [filters, pagination.current]);

  const fetchCategories = async () => {
    try {
      const res = await cmsService.getCategories();
      setCategories(res.data.data || []);
    } catch (error) {
      console.error('❌ خطا در دریافت دسته‌بندی‌ها:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
      };
      
      if (filters.minPrice) params.minPrice = parseFloat(filters.minPrice);
      if (filters.maxPrice) params.maxPrice = parseFloat(filters.maxPrice);
      
      const res = await cmsService.getProducts(params);
      setProducts(res.data.data || []);
      setPagination({
        ...pagination,
        total: res.data.pagination?.total || 0,
      });
    } catch (error) {
      message.error('خطا در دریافت محصولات');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, current: 1 });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      sort: 'newest',
      minPrice: '',
      maxPrice: '',
    });
    setPagination({ ...pagination, current: 1 });
  };

  const handleAddToCart = (product) => {
    message.success(`${product.name} به سبد خرید اضافه شد`);
    // منطق اضافه به سبد خرید
  };

  if (loading && products.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="در حال بارگذاری محصولات..." />
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* هدر */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>🛒 محصولات</Title>
        <Text type="secondary">جدیدترین محصولات را مشاهده کنید</Text>
      </div>

      {/* فیلترها */}
      <Card style={{ borderRadius: 'var(--radius)', marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Input
              placeholder="جستجو در محصولات..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              placeholder="دسته‌بندی"
              style={{ width: '100%' }}
              value={filters.category}
              onChange={(value) => handleFilterChange('category', value)}
              allowClear
            >
              {categories.map(cat => (
                <Option key={cat._id} value={cat._id}>{cat.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} md={4}>
            <Select
              placeholder="مرتب‌سازی"
              style={{ width: '100%' }}
              value={filters.sort}
              onChange={(value) => handleFilterChange('sort', value)}
            >
              <Option value="newest">جدیدترین</Option>
              <Option value="price_low">قیمت: کم به زیاد</Option>
              <Option value="price_high">قیمت: زیاد به کم</Option>
              <Option value="popular">پرفروش‌ترین</Option>
              <Option value="rating">بالاترین امتیاز</Option>
            </Select>
          </Col>
          <Col xs={12} md={4}>
            <Input
              placeholder="حداقل قیمت"
              type="number"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            />
          </Col>
          <Col xs={12} md={4}>
            <Input
              placeholder="حداکثر قیمت"
              type="number"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            />
          </Col>
          <Col xs={24}>
            <Space>
              <Button icon={<FilterOutlined />} type="primary" onClick={fetchProducts}>
                اعمال فیلتر
              </Button>
              <Button icon={<ClearOutlined />} onClick={clearFilters}>
                پاک کردن
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* لیست محصولات */}
      {products.length === 0 ? (
        <Empty description="هیچ محصولی یافت نشد" />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {products.map((product) => (
              <Col key={product._id} xs={24} sm={12} md={6} lg={6}>
                <Card
                  hoverable
                  cover={
                    <div style={{ height: 200, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                      {product.images?.[0]?.url ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ fontSize: 48 }}>📦</div>
                      )}
                    </div>
                  }
                  style={{ borderRadius: 'var(--radius)', height: '100%' }}
                  actions={[
                    <Button type="primary" icon={<ShoppingCartOutlined />} onClick={() => handleAddToCart(product)}>
                      افزودن به سبد
                    </Button>,
                  ]}
                >
                  <Link to={`/products/${product.slug}`}>
                    <div style={{ minHeight: 80 }}>
                      <Text strong style={{ fontSize: 14, display: 'block', height: 44, overflow: 'hidden' }}>
                        {product.name}
                      </Text>
                      <div style={{ marginTop: 8 }}>
                        <Rate disabled defaultValue={product.averageRating || 0} allowHalf style={{ fontSize: 12 }} />
                        <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
                          ({product.ratingCount || 0})
                        </Text>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        {product.isOnSale ? (
                          <>
                            <Text delete type="secondary" style={{ fontSize: 12 }}>
                              {toPersianPrice(product.price)}
                            </Text>
                            <Text strong style={{ fontSize: 18, color: '#ff4d4f', marginLeft: 8 }}>
                              {toPersianPrice(product.salePrice)}
                            </Text>
                            <Tag color="red" style={{ fontSize: 10 }}>تخفیف {product.discountPercent}%</Tag>
                          </>
                        ) : (
                          <Text strong style={{ fontSize: 18 }}>
                            {toPersianPrice(product.price)}
                          </Text>
                        )}
                      </div>
                      {product.stockStatus === 'out_of_stock' && (
                        <Tag color="red" style={{ marginTop: 4 }}>ناموجود</Tag>
                      )}
                      {product.isBestSeller && (
                        <Tag color="gold" style={{ marginTop: 4 }}>🏆 پرفروش</Tag>
                      )}
                      {product.isFeatured && (
                        <Tag color="purple" style={{ marginTop: 4 }}>⭐ ویژه</Tag>
                      )}
                    </div>
                  </Link>
                </Card>
              </Col>
            ))}
          </Row>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={(page) => setPagination({ ...pagination, current: page })}
              showSizeChanger
              showTotal={(total) => `تعداد ${total} محصول`}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default ProductsList;
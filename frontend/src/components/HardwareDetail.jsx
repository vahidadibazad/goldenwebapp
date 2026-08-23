import { useState, useEffect } from 'react';
import { Card, Typography, Descriptions, Spin, Button, Tag, message } from 'antd';
import { RollbackOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toPersianDate } from '../utils/dateHelper';
import { toPersianPrice } from '../utils/numberHelper';
import { COLORS } from '../styles/theme';

const { Title } = Typography;

function HardwareDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/hardware/${id}`)
      .then(res => setData(res.data.data))
      .catch(() => message.error('خطا در دریافت اطلاعات'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />;
  if (!data) return <Card><Title level={4}>آیتم یافت نشد</Title></Card>;

  const statusColor = {
    active: 'green',
    in_stock: 'orange',
    repair: 'red',
    archived: 'default',
    disposed: 'default',
  };

  const statusLabel = {
    active: 'فعال',
    in_stock: 'در انبار',
    repair: 'در تعمیر',
    archived: 'بایگانی',
    disposed: 'اسقاط',
  };

  const getCategoryName = (category) => {
    if (!category) return '-';
    if (typeof category === 'string') return category;
    if (typeof category === 'object' && category.name) return category.name;
    return '-';
  };

  const getAssignedToName = (assignedTo) => {
    if (!assignedTo) return '-';
    if (typeof assignedTo === 'string') return assignedTo;
    if (typeof assignedTo === 'object') {
      return assignedTo.fullName || assignedTo.username || assignedTo.name || '-';
    }
    return '-';
  };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>🔍 جزئیات سخت‌افزار</Title>
        <Button icon={<RollbackOutlined />} onClick={() => navigate('/hardware')}>بازگشت</Button>
      </div>

      {/* ============================================= */}
      {/* ✅ اصلاح: استفاده از Descriptions با column={2} و ترتیب صحیح */}
      {/* ============================================= */}
      <Descriptions bordered column={2} size="middle">
        {/* ردیف ۱: نام + دسته‌بندی */}
        <Descriptions.Item label="نام">{data.name}</Descriptions.Item>
        <Descriptions.Item label="دسته‌بندی">
          <Tag color="blue">{getCategoryName(data.category)}</Tag>
        </Descriptions.Item>

        {/* ردیف ۲: شماره سریال + وضعیت */}
        <Descriptions.Item label="شماره سریال">
          <code style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px' }}>
            {data.serialNumber}
          </code>
        </Descriptions.Item>
        <Descriptions.Item label="وضعیت">
          <Tag color={statusColor[data.status] || 'default'}>
            {statusLabel[data.status] || data.status}
          </Tag>
        </Descriptions.Item>

        {/* ردیف ۳: قیمت + تاریخ خرید */}
        <Descriptions.Item label="قیمت">{toPersianPrice(data.price)}</Descriptions.Item>
        <Descriptions.Item label="تاریخ خرید">{toPersianDate(data.purchaseDate)}</Descriptions.Item>

        {/* ردیف ۴: انقضای گارانتی + تخصیص به */}
        <Descriptions.Item label="انقضای گارانتی">{toPersianDate(data.warrantyExpire)}</Descriptions.Item>
        <Descriptions.Item label="تخصیص به">
          {getAssignedToName(data.assignedTo)}
        </Descriptions.Item>

        {/* ============================================= */}
        {/* ✅ ردیف ۵: توضیحات - با span={2} در یک ردیف کامل */}
        {/* ============================================= */}
        <Descriptions.Item label="توضیحات" span={2}>
          {data.description || <span style={{ color: 'var(--text-muted)' }}>—</span>}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

export default HardwareDetail;
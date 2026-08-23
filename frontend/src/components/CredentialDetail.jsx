import { useState, useEffect } from 'react';
import { Card, Typography, Descriptions, Spin, Button, Tag, message } from 'antd';
import { RollbackOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toPersianDate } from '../utils/dateHelper';

const { Title } = Typography;

function CredentialDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/credentials/${id}`)
      .then(res => setData(res.data.data))
      .catch(() => message.error('خطا در دریافت اطلاعات'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />;
  if (!data) return <Card><Title level={4}>آیتم یافت نشد</Title></Card>;

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>🔍 جزئیات رمز عبور</Title>
        <Button icon={<RollbackOutlined />} onClick={() => navigate('/credentials')}>بازگشت</Button>
      </div>

      <Descriptions bordered column={2}>
        <Descriptions.Item label="سیستم">{data.systemName}</Descriptions.Item>
        <Descriptions.Item label="نام کاربری">{data.username}</Descriptions.Item>
        <Descriptions.Item label="رمز عبور">
          <Tag color="orange">{data.password}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="لینک دسترسی">
          {data.link ? <a href={data.link} target="_blank" rel="noopener noreferrer">{data.link}</a> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="سخت‌افزار مرتبط">{data.hardware?.name || '-'}</Descriptions.Item>
        <Descriptions.Item label="سطح دسترسی">
          <Tag color={data.accessLevel === 'admin' ? 'red' : data.accessLevel === 'network' ? 'blue' : 'green'}>
            {data.accessLevel === 'admin' ? 'مدیران' : 
             data.accessLevel === 'network' ? 'مدیران شبکه' : 
             data.accessLevel === 'support' ? 'پشتیبانی' : 'همه'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="توضیحات">{data.description || '-'}</Descriptions.Item>
        <Descriptions.Item label="تاریخ ثبت">{toPersianDate(data.createdAt)}</Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

export default CredentialDetail;
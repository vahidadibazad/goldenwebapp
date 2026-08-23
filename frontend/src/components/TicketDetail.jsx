import { useState, useEffect } from 'react';
import { Card, Typography, Descriptions, Spin, Button, Tag, message } from 'antd';
import { RollbackOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toPersianDate } from '../utils/dateHelper';

const { Title } = Typography;

function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/tickets/${id}`)
      .then(res => setData(res.data.data))
      .catch(() => message.error('خطا در دریافت اطلاعات'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />;
  if (!data) return <Card><Title level={4}>آیتم یافت نشد</Title></Card>;

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>🔍 جزئیات تیکت</Title>
        <Button icon={<RollbackOutlined />} onClick={() => navigate('/tickets')}>بازگشت</Button>
      </div>

      <Descriptions bordered column={2}>
        <Descriptions.Item label="عنوان">{data.title}</Descriptions.Item>
        <Descriptions.Item label="وضعیت">
          <Tag color={data.status === 'open' ? 'orange' : data.status === 'in_progress' ? 'blue' : data.status === 'resolved' ? 'green' : 'default'}>
            {data.status === 'open' ? 'باز' : 
             data.status === 'in_progress' ? 'در حال بررسی' : 
             data.status === 'resolved' ? 'حل شده' : 'بسته'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="اولویت">
          <Tag color={data.priority === 'urgent' ? 'red' : data.priority === 'high' ? 'orange' : data.priority === 'medium' ? 'blue' : 'green'}>
            {data.priority === 'urgent' ? 'فوری' : 
             data.priority === 'high' ? 'بالا' : 
             data.priority === 'medium' ? 'متوسط' : 'کم'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="درخواست‌دهنده">{data.requester?.fullName || data.requester?.username}</Descriptions.Item>
        <Descriptions.Item label="مسئول">{data.assignedTo?.fullName || data.assignedTo?.username || '-'}</Descriptions.Item>
        <Descriptions.Item label="شرح" span={2}>{data.description}</Descriptions.Item>
        <Descriptions.Item label="تاریخ ثبت">{toPersianDate(data.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="آخرین بروزرسانی">{toPersianDate(data.updatedAt)}</Descriptions.Item>
      </Descriptions>

      {data.comments?.length > 0 && (
        <>
          <Title level={4} style={{ marginTop: 24 }}>💬 کامنت‌ها</Title>
          {data.comments.map((comment, index) => (
            <Card key={index} size="small" style={{ marginBottom: 8, background: '#f9f9f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{comment.user?.fullName || comment.user?.username}</strong>
                <span style={{ fontSize: 12, color: '#999' }}>{toPersianDate(comment.createdAt)}</span>
              </div>
              <div>{comment.text}</div>
            </Card>
          ))}
        </>
      )}
    </Card>
  );
}

export default TicketDetail;
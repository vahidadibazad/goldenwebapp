// src/components/letters/LetterTimeline.jsx
import { Timeline, Tag, Space, Typography, Empty, Avatar } from 'antd';
import { 
  UserOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  FileTextOutlined,
  SyncOutlined,
  SignatureOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { toPersianDate } from '../../utils/dateHelper';

const { Text } = Typography;

// =============================================
// تنظیمات آیکون‌های وضعیت
// =============================================
const STATUS_ICONS = {
  draft: <EditOutlined />,
  registered: <FileTextOutlined />,
  in_review: <SyncOutlined spin />,
  approved: <CheckCircleOutlined />,
  rejected: <CloseCircleOutlined />,
  signed: <SignatureOutlined />,
  archived: <FolderOutlined />,
};

const STATUS_COLORS = {
  draft: 'default',
  registered: 'blue',
  in_review: 'orange',
  approved: 'green',
  rejected: 'red',
  signed: 'purple',
  archived: 'default',
};

const STATUS_LABELS = {
  draft: 'پیش‌نویس',
  registered: 'ثبت شده',
  in_review: 'در جریان بررسی',
  approved: 'تأیید شده',
  rejected: 'رد شده',
  signed: 'امضا شده',
  archived: 'بایگانی شده',
};

// =============================================
// کامپوننت اصلی
// =============================================
function LetterTimeline({ history, loading = false }) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Text type="secondary">در حال بارگذاری تاریخچه...</Text>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Empty 
        description="هیچ فعالیتی ثبت نشده است" 
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        style={{ padding: '20px 0' }}
      />
    );
  }

  // مرتب‌سازی از قدیم به جدید
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  return (
    <Timeline
      style={{ marginTop: 8 }}
      items={sortedHistory.map((item, index) => ({
        key: index,
        color: STATUS_COLORS[item.status] || 'blue',
        dot: STATUS_ICONS[item.status] || <FileTextOutlined />,
        children: (
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 8,
              padding: '4px 0',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <Space wrap size={[8, 4]}>
                <Tag 
                  color={STATUS_COLORS[item.status] || 'blue'}
                  style={{ margin: 0 }}
                >
                  {STATUS_LABELS[item.status] || item.status}
                </Tag>
                {item.user && (
                  <Space size={4}>
                    <Avatar 
                      size="small" 
                      icon={<UserOutlined />} 
                      style={{ width: 20, height: 20, fontSize: 10 }}
                    />
                    <Text style={{ fontSize: 13 }}>
                      {item.user?.fullName || item.user?.username || 'سیستم'}
                    </Text>
                  </Space>
                )}
              </Space>
              {item.comment && (
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {item.comment}
                  </Text>
                </div>
              )}
            </div>
            <div style={{ 
              color: '#999', 
              fontSize: '12px', 
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <ClockCircleOutlined style={{ fontSize: 12 }} />
              <span>{toPersianDate(item.timestamp)}</span>
              <span style={{ margin: '0 4px' }}>|</span>
              <span>{new Date(item.timestamp).toLocaleTimeString('fa-IR')}</span>
            </div>
          </div>
        ),
      }))}
    />
  );
}

export default LetterTimeline;
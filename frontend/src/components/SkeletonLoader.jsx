import { Skeleton, Card, Row, Col } from 'antd';

// =============================================
// اسکلتون برای لیست‌ها
// =============================================
export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div style={{ padding: '16px 0' }}>
      {/* هدر جدول */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '16px',
        padding: '12px 16px',
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
      }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton.Input key={i} active size="small" style={{ flex: 1, height: 20 }} />
        ))}
      </div>
      {/* ردیف‌ها */}
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i} 
          style={{ 
            display: 'flex', 
            gap: '16px', 
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          {Array.from({ length: 6 }).map((_, j) => (
            <Skeleton.Input key={j} active size="small" style={{ flex: 1, height: 24 }} />
          ))}
        </div>
      ))}
    </div>
  );
};

// =============================================
// اسکلتون برای کارت‌های آماری
// =============================================
export const StatCardSkeleton = ({ count = 6 }) => {
  return (
    <Row gutter={[16, 16]}>
      {Array.from({ length: count }).map((_, i) => (
        <Col key={i} xs={24} sm={12} lg={4}>
          <Card className="skeleton-card">
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        </Col>
      ))}
    </Row>
  );
};

// =============================================
// اسکلتون برای صفحه جزئیات
// =============================================
export const DetailSkeleton = () => {
  return (
    <Card>
      <Skeleton active paragraph={{ rows: 6 }} />
    </Card>
  );
};

// =============================================
// اسکلتون برای فرم
// =============================================
export const FormSkeleton = () => {
  return (
    <Card>
      <Skeleton active paragraph={{ rows: 8 }} />
    </Card>
  );
};
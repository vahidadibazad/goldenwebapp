import { useState, useEffect } from 'react';
import { Table, Button, Card, Space, Tag, message, Popconfirm, Typography, Tooltip, Row, Col, Badge } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  LockOutlined,
  UnlockOutlined,
  StarOutlined,
  StarFilled,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toPersianNumber } from '../utils/numberHelper';
import { COLORS } from '../styles/theme';

const { Title, Text } = Typography;

function RoleList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await api.get(`/roles?page=${page}&limit=${pageSize}`);
      setData(res.data.data || []);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: res.data.total || res.data.data?.length || 0,
      });
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTableChange = (pagination) => {
    fetchData(pagination.current, pagination.pageSize);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/roles/${id}`);
      message.success('نقش با موفقیت حذف شد');
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در حذف');
    }
  };

  // نقش‌های سیستمی که قابل حذف نیستند
  const systemRoles = ['admin', 'support', 'network_manager', 'user'];

  const columns = [
    {
      title: 'نقش',
      dataIndex: 'label',
      key: 'label',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: 36, 
            height: 36, 
            borderRadius: '10px', 
            background: record.isSystem ? COLORS.primary : COLORS.gray[400],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '16px',
          }}>
            {record.isSystem ? <StarFilled /> : <StarOutlined />}
          </div>
          <div>
            <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{text}</strong>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {record.name}
            </div>
          </div>
        </div>
      ),
      sorter: (a, b) => a.label.localeCompare(b.label),
    },
    {
      title: 'توضیحات',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || <span style={{ color: 'var(--text-muted)' }}>—</span>,
    },
    {
      title: 'مجوزها',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions) => {
        const count = permissions?.length || 0;
        return (
          <Badge 
            count={count} 
            style={{ background: COLORS.primary }}
            title={`${count} مجوز`}
          />
        );
      },
    },
    {
      title: 'وضعیت',
      dataIndex: 'isSystem',
      key: 'isSystem',
      render: (isSystem) => (
        <Tag 
          color={isSystem ? 'blue' : 'default'}
          icon={isSystem ? <LockOutlined /> : <UnlockOutlined />}
          style={{ padding: '4px 12px', borderRadius: '20px' }}
        >
          {isSystem ? 'سیستمی' : 'کاربری'}
        </Tag>
      ),
      filters: [
        { text: 'سیستمی', value: 'true' },
        { text: 'کاربری', value: 'false' },
      ],
      onFilter: (value, record) => String(record.isSystem) === value,
    },
    {
      title: 'تاریخ ایجاد',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => {
        if (!date) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
        return (
          <span style={{ direction: 'ltr', display: 'inline-block', fontFamily: 'monospace' }}>
            {new Date(date).toLocaleDateString('fa-IR')}
          </span>
        );
      },
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'عملیات',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="ویرایش" placement="top">
            <Link to={`/roles/edit/${record._id}`}>
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                style={{ color: COLORS.warning }}
                className="action-btn"
              />
            </Link>
          </Tooltip>
          {!record.isSystem && (
            <Tooltip title="حذف" placement="top">
              <Popconfirm 
                title="آیا از حذف این نقش اطمینان دارید؟" 
                onConfirm={() => handleDelete(record._id)}
                okText="بله، حذف کن"
                cancelText="لغو"
                placement="left"
              >
                <Button 
                  type="text" 
                  icon={<DeleteOutlined />} 
                  style={{ color: COLORS.danger }}
                  className="action-btn"
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="fade-in">
      {/* هدر صفحه */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            👑 مدیریت نقش‌ها
            <Tag color="purple" style={{ fontSize: '14px', padding: '2px 12px' }}>
              {data.length} نقش
            </Tag>
          </Title>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            نقش‌های سیستمی قابل حذف نیستند
          </Text>
        </div>
        <Space wrap>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => fetchData(pagination.current, pagination.pageSize)}
            loading={loading}
          >
            بروزرسانی
          </Button>
          <Link to="/roles/new">
            <Button type="primary" icon={<PlusOutlined />} size="large">
              ایجاد نقش جدید
            </Button>
          </Link>
        </Space>
      </div>

      {/* کارت اصلی */}
      <Card style={{ borderRadius: 'var(--radius)', padding: '4px 0' }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
          className="custom-table"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `تعداد ${total} نقش`,
            pageSizeOptions: ['10', '20', '50', '100'],
            placement: ['bottomCenter'],
            style: { marginTop: 16 },
            itemRender: (current, type, originalElement) => {
              if (type === 'prev') {
                return <Button size="small">قبلی</Button>;
              }
              if (type === 'next') {
                return <Button size="small">بعدی</Button>;
              }
              return originalElement;
            },
          }}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
          style={{ borderRadius: 'var(--radius)' }}
          locale={{
            emptyText: (
              <div style={{ padding: '60px 0' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>👑</div>
                <Text type="secondary" style={{ fontSize: '16px' }}>هیچ نقشی تعریف نشده است</Text>
                <br />
                <Link to="/roles/new">
                  <Button type="primary" style={{ marginTop: '20px' }} icon={<PlusOutlined />} size="large">
                    ایجاد اولین نقش
                  </Button>
                </Link>
              </div>
            ),
          }}
        />
      </Card>

      {/* استایل دکمه‌های عملیات */}
      <style>{`
        .action-btn {
          transition: all 0.3s ease !important;
          border-radius: 8px !important;
        }
        .action-btn:hover {
          transform: scale(1.15) !important;
          background: var(--bg-secondary) !important;
        }
        .ant-table-cell {
          vertical-align: middle !important;
        }
      `}</style>
    </div>
  );
}

export default RoleList;
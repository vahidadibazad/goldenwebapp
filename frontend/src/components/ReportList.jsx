import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Card,
  Input,
  Space,
  Tag,
  message,
  Typography,
  Tooltip,
  Row,
  Col,
  Badge,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import api from '../services/api';

const { Title, Text } = Typography;

function ReportList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('page', page);
      params.append('limit', pageSize);
      const res = await api.get(`/reports?${params.toString()}`);
      setData(res.data.data || []);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: res.data.total || res.data.data?.length || 0,
      });
    } catch (error) {
      message.error('خطا در دریافت گزارش‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const getTypeTag = (type) => {
    const map = {
      performance: { color: 'blue', label: 'عملکرد' },
      delay: { color: 'orange', label: 'تأخیرات' },
      volume: { color: 'green', label: 'حجم' },
      department: { color: 'purple', label: 'واحدها' },
      user: { color: 'cyan', label: 'کاربران' },
      custom: { color: 'default', label: 'سفارشی' },
    };
    return map[type] || { color: 'default', label: type };
  };

  const getStatusTag = (status) => {
    const map = {
      draft: { color: 'default', label: 'پیش‌نویس' },
      pending: { color: 'processing', label: 'در انتظار' },
      generated: { color: 'success', label: 'تولید شده' },
      failed: { color: 'error', label: 'ناموفق' },
    };
    return map[status] || { color: 'default', label: status };
  };

  const columns = [
    {
      title: 'گزارش',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: '#1677ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
            }}
          >
            <FileTextOutlined />
          </div>
          <div>
            <strong>{text}</strong>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              کد: {record.code}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'نوع',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const info = getTypeTag(type);
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'دسته‌بندی',
      dataIndex: 'category',
      key: 'category',
      render: (category) => {
        const map = {
          daily: 'روزانه',
          weekly: 'هفتگی',
          monthly: 'ماهانه',
          quarterly: 'سه‌ماهه',
          yearly: 'ساله',
          custom: 'سفارشی',
        };
        return map[category] || category;
      },
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const info = getStatusTag(status);
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'رکوردها',
      dataIndex: 'stats',
      key: 'stats',
      render: (stats) => (
        <Badge count={stats?.totalRecords || 0} style={{ background: '#1677ff' }} />
      ),
    },
    {
      title: 'عملیات',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Tooltip title="مشاهده">
          <Link to={`/reports/${record._id}`}>
            <Button type="text" icon={<EyeOutlined />} style={{ color: '#1677ff' }} />
          </Link>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          📊 مدیریت گزارشات
          <Tag color="blue" style={{ marginRight: 8 }}>
            {data.length} گزارش
          </Tag>
        </Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchData(pagination.current, pagination.pageSize)}
            loading={loading}
          >
            بروزرسانی
          </Button>
          <Link to="/reports/new">
            <Button type="primary" icon={<PlusOutlined />}>
              گزارش جدید
            </Button>
          </Link>
        </Space>
      </div>

      <Card style={{ borderRadius: 'var(--radius)' }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder="جستجوی گزارش‌ها..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
          pagination={pagination}
          onChange={(pagination) => fetchData(pagination.current, pagination.pageSize)}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
}

export default ReportList;
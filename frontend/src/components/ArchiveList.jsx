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
  FolderOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import api from '../services/api';

const { Title, Text } = Typography;

function ArchiveList() {
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
      const res = await api.get(`/archives?${params.toString()}`);
      setData(res.data.data || []);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: res.data.total || res.data.data?.length || 0,
      });
    } catch (error) {
      message.error('خطا در دریافت بایگانی‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const getTypeTag = (type) => {
    const map = {
      active: { color: 'green', label: 'جاری' },
      semi_active: { color: 'orange', label: 'نیمه‌جاری' },
      inactive: { color: 'default', label: 'راکد' },
      digital: { color: 'blue', label: 'دیجیتال' },
    };
    return map[type] || { color: 'default', label: type };
  };

  const columns = [
    {
      title: 'بایگانی',
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
            <FolderOutlined />
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
          general: 'عمومی',
          financial: 'مالی',
          legal: 'حقوقی',
          personnel: 'پرسنلی',
          technical: 'فنی',
          other: 'سایر',
        };
        return map[category] || category;
      },
    },
    {
      title: 'نامه‌ها',
      dataIndex: 'stats',
      key: 'stats',
      render: (stats) => (
        <Badge count={stats?.totalLetters || 0} style={{ background: '#1677ff' }} />
      ),
    },
    {
      title: 'وضعیت',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? 'فعال' : 'غیرفعال'}
        </Tag>
      ),
    },
    {
      title: 'عملیات',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Tooltip title="مشاهده">
          <Link to={`/archive/${record._id}`}>
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
          🗄️ مدیریت بایگانی
          <Tag color="blue" style={{ marginRight: 8 }}>
            {data.length} بایگانی
          </Tag>
        </Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => fetchData(pagination.current, pagination.pageSize)}
          loading={loading}
        >
          بروزرسانی
        </Button>
      </div>

      <Card style={{ borderRadius: 'var(--radius)' }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder="جستجوی بایگانی‌ها..."
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

export default ArchiveList;
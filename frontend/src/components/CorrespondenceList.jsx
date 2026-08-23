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
  UserOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toPersianDate } from '../utils/dateHelper';

const { Title, Text } = Typography;

function LetterList() {
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
      const res = await api.get(`/letters?${params.toString()}`);
      setData(res.data.data || []);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: res.data.total || res.data.data?.length || 0,
      });
    } catch (error) {
      message.error('خطا در دریافت نامه‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const columns = [
    {
      title: 'شماره و عنوان',
      dataIndex: 'number',
      key: 'number',
      render: (number, record) => (
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
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {number || 'بدون شماره'}
            </div>
            <strong>{record.subject}</strong>
          </div>
        </div>
      ),
    },
    {
      title: 'نوع',
      dataIndex: 'letterType',
      key: 'letterType',
      render: (type) => {
        const map = {
          incoming: { color: 'blue', label: 'وارده' },
          outgoing: { color: 'green', label: 'صادره' },
          internal: { color: 'orange', label: 'داخلی' },
        };
        const info = map[type] || { color: 'default', label: type };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const map = {
          draft: { color: 'default', label: 'پیش‌نویس' },
          registered: { color: 'processing', label: 'ثبت شده' },
          referred: { color: 'blue', label: 'ارجاع شده' },
          read: { color: 'green', label: 'مطالعه شده' },
          actioned: { color: 'success', label: 'اقدام شده' },
          archived: { color: 'default', label: 'بایگانی شده' },
        };
        const info = map[status] || { color: 'default', label: status };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'فرستنده/گیرنده',
      key: 'sender',
      render: (_, record) => {
        const name = record.sender?.fullName || record.senderName || '-';
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserOutlined style={{ color: 'var(--text-muted)' }} />
            {name}
          </span>
        );
      },
    },
    {
      title: 'تاریخ',
      dataIndex: 'letterDate',
      key: 'letterDate',
      render: (date) => toPersianDate(date),
    },
    {
      title: 'عملیات',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Tooltip title="مشاهده">
          <Link to={`/letters/${record._id}`}>
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
          📋 مدیریت نامه‌ها
          <Tag color="blue" style={{ marginRight: 8 }}>
            {data.length} نامه
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
          <Link to="/letters/new">
            <Button type="primary" icon={<FileTextOutlined />}>
              نامه جدید
            </Button>
          </Link>
        </Space>
      </div>

      <Card style={{ borderRadius: 'var(--radius)' }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12} lg={8}>
            <Input
              placeholder="جستجوی نامه‌ها..."
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

export default LetterList;
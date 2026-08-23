import { useState, useEffect } from 'react';
import { Table, Card, Typography, message, Tag, Select, Space, Button, Tooltip, Row, Col, Badge } from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  UserOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  ClearOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import { toPersianDate } from '../utils/dateHelper';
import { toPersianNumber } from '../utils/numberHelper';
import { COLORS } from '../styles/theme';

const { Title, Text } = Typography;
const { Option } = Select;

function AuditLog() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ module: '', action: '', user: '' });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [users, setUsers] = useState([]);
  
  // =============================================
  // ✅ دریافت EnumValueها از دیتابیس
  // =============================================
  const [actionOptions, setActionOptions] = useState([]);
  const [moduleOptions, setModuleOptions] = useState([]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data.data || []);
    } catch (error) {
      console.error('خطا در دریافت کاربران:', error);
    }
  };

  // =============================================
  // ✅ دریافت EnumValueها از دیتابیس
  // =============================================
  const fetchEnumOptions = async () => {
    try {
      // دریافت اقدامات لاگ
      const actionsRes = await api.get('/enums/audit_action');
      setActionOptions(actionsRes.data.data || []);
      
      // دریافت ماژول‌های لاگ
      const modulesRes = await api.get('/enums/audit_module');
      setModuleOptions(modulesRes.data.data || []);
    } catch (error) {
      console.error('خطا در دریافت Enumها:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchEnumOptions();
  }, []);

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.module) params.append('module', filters.module);
      if (filters.action) params.append('action', filters.action);
      if (filters.user) params.append('user', filters.user);
      params.append('page', page);
      params.append('limit', 20);
      
      const res = await api.get(`/audit?${params.toString()}`);
      setData(res.data.data || []);
      setPagination({
        ...pagination,
        current: page,
        total: res.data.pagination?.total || 0,
      });
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const clearFilters = () => {
    setFilters({ module: '', action: '', user: '' });
  };

  // =============================================
  // ✅ دریافت رنگ از EnumValue
  // =============================================
  const getColorFromEnum = (value, options) => {
    const found = options.find(item => item.key === value);
    return found?.color || COLORS.gray[500];
  };

  const getLabelFromEnum = (value, options) => {
    const found = options.find(item => item.key === value);
    return found?.label || value || 'سایر';
  };

  const getIconFromEnum = (value, options) => {
    const found = options.find(item => item.key === value);
    return found?.icon || '📌';
  };

  const columns = [
    {
      title: 'کاربر',
      dataIndex: 'user',
      key: 'user',
      render: (user, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserOutlined style={{ color: 'var(--text-muted)' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.fullName || user?.fullName || user?.username || 'نامشخص'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {record.username || user?.username || '-'}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'عملیات',
      dataIndex: 'action',
      key: 'action',
      render: (action) => {
        const color = getColorFromEnum(action, actionOptions);
        const label = getLabelFromEnum(action, actionOptions);
        const icon = getIconFromEnum(action, actionOptions);
        return (
          <Tag color={color} style={{ padding: '4px 12px', borderRadius: '20px' }}>
            {icon} {label}
          </Tag>
        );
      },
    },
    {
      title: 'ماژول',
      dataIndex: 'module',
      key: 'module',
      render: (module) => {
        const color = getColorFromEnum(module, moduleOptions);
        const label = getLabelFromEnum(module, moduleOptions);
        return (
          <Tag color={color} style={{ padding: '4px 12px', borderRadius: '20px' }}>
            {label}
          </Tag>
        );
      },
    },
    {
      title: 'تغییرات',
      dataIndex: 'changes',
      key: 'changes',
      render: (changes) => {
        if (!changes || Object.keys(changes).length === 0) {
          return <span style={{ color: 'var(--text-muted)' }}>—</span>;
        }
        const entries = Object.entries(changes);
        const display = entries.slice(0, 2);
        const remaining = entries.length - 2;
        return (
          <div style={{ fontSize: '12px' }}>
            {display.map(([key, value]) => (
              <div key={key} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <Tag color="blue" style={{ fontSize: '10px', padding: '0 6px' }}>{key}</Tag>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {typeof value === 'object' ? JSON.stringify(value).slice(0, 20) : String(value).slice(0, 20)}
                </span>
              </div>
            ))}
            {remaining > 0 && (
              <Tooltip title={entries.slice(2).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ')}>
                <Tag color="default" style={{ fontSize: '10px', cursor: 'pointer' }}>
                  +{remaining} مورد
                </Tag>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      render: (ip) => (
        <Tag style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          <GlobalOutlined style={{ marginLeft: '4px' }} />
          {ip || '-'}
        </Tag>
      ),
    },
    {
      title: 'زمان',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date) => (
        <div style={{ direction: 'ltr' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '13px' }}>
            {toPersianDate(date)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            <ClockCircleOutlined style={{ marginLeft: '4px' }} />
            {new Date(date).toLocaleTimeString('fa-IR')}
          </div>
        </div>
      ),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      defaultSortOrder: 'descend',
    },
  ];

  return (
    <div className="fade-in">
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
            📋 تاریخچه عملیات
            <Tag color="blue" style={{ fontSize: '14px', padding: '2px 12px' }}>
              {toPersianNumber(pagination.total)} رکورد
            </Tag>
          </Title>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            کلیه فعالیت‌های کاربران در سیستم ثبت می‌شود
          </Text>
        </div>
        <Space wrap>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => fetchData(pagination.current)}
            loading={loading}
          >
            بروزرسانی
          </Button>
          <Button icon={<DownloadOutlined />} type="text">
            خروجی Excel
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 'var(--radius)', padding: '4px 0' }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16, padding: '0 4px' }}>
          <Col xs={24} md={8}>
            <Select
              value={filters.module}
              onChange={(value) => setFilters({ ...filters, module: value })}
              placeholder="ماژول"
              style={{ width: '100%' }}
              allowClear
              size="large"
            >
              {moduleOptions.map(option => (
                <Option key={option._id} value={option.key}>
                  {option.icon} {option.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={8}>
            <Select
              value={filters.action}
              onChange={(value) => setFilters({ ...filters, action: value })}
              placeholder="عملیات"
              style={{ width: '100%' }}
              allowClear
              size="large"
            >
              {actionOptions.map(option => (
                <Option key={option._id} value={option.key}>
                  {option.icon} {option.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={8}>
            <Select
              value={filters.user}
              onChange={(value) => setFilters({ ...filters, user: value })}
              placeholder="کاربر"
              style={{ width: '100%' }}
              allowClear
              size="large"
              showSearch
              optionFilterProp="children"
            >
              {users.map(u => (
                <Option key={u._id} value={u._id}>
                  {u.fullName || u.username}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        <div style={{ marginBottom: 16, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button 
            type="primary" 
            icon={<SearchOutlined />}
            onClick={() => fetchData(1)}
          >
            اعمال فیلتر
          </Button>
          <Button 
            icon={<ClearOutlined />}
            onClick={clearFilters}
          >
            پاک کردن فیلترها
          </Button>
          {(filters.module || filters.action || filters.user) && (
            <Badge 
              count={
                (filters.module ? 1 : 0) + 
                (filters.action ? 1 : 0) + 
                (filters.user ? 1 : 0)
              } 
              style={{ background: COLORS.primary }}
            />
          )}
        </div>

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
            showTotal: (total) => `تعداد ${toPersianNumber(total)} رکورد`,
            pageSizeOptions: ['20', '50', '100'],
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
          onChange={(pagination) => fetchData(pagination.current)}
          scroll={{ x: 1200 }}
          style={{ borderRadius: 'var(--radius)' }}
          locale={{
            emptyText: (
              <div style={{ padding: '60px 0' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
                <Text type="secondary" style={{ fontSize: '16px' }}>هیچ لاگی ثبت نشده است</Text>
              </div>
            ),
          }}
        />
      </Card>

      <style>{`
        .ant-table-cell {
          vertical-align: middle !important;
        }
        .ant-select-selector {
          borderRadius: 10px !important;
        }
      `}</style>
    </div>
  );
}

export default AuditLog;
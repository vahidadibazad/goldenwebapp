import { useState } from 'react';
import {
  Card,
  Input,
  Button,
  Typography,
  Table,
  Tag,
  Space,
  message,
  Spin,
  Row,
  Col,
  Select,
  DatePicker,
  App,
  Tooltip,
  Badge,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  FileTextOutlined,
  FolderOutlined,
  BankOutlined,
  CalendarOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import { toPersianDate } from '../utils/dateHelper';
import { COLORS } from '../styles/theme';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

function ArchiveSearch() {
  const { message } = App.useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ archives: [], letters: [] });
  const [totalLetters, setTotalLetters] = useState(0);
  const [filters, setFilters] = useState({
    secretariat: '',
    type: '',
    fromDate: null,
    toDate: null,
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);

  // =============================================
  // جستجو
  // =============================================
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      message.warning('عبارت جستجو را وارد کنید');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('q', searchQuery.trim());
      if (filters.secretariat) params.append('secretariatId', filters.secretariat);
      if (filters.type) params.append('type', filters.type);
      if (filters.fromDate) params.append('fromDate', filters.fromDate.toISOString());
      if (filters.toDate) params.append('toDate', filters.toDate.toISOString());

      const res = await api.get(`/archives/search?${params.toString()}`);
      setResults(res.data.data);
      setTotalLetters(res.data.data.totalLetters || 0);
      message.success(`${res.data.data.totalLetters || 0} نتیجه یافت شد`);
    } catch (error) {
      message.error('خطا در جستجو');
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // پاک کردن فیلترها
  // =============================================
  const clearFilters = () => {
    setSearchQuery('');
    setFilters({ secretariat: '', type: '', fromDate: null, toDate: null });
    setResults({ archives: [], letters: [] });
    setTotalLetters(0);
  };

  // =============================================
  // ستون‌های نتایج
  // =============================================
  const columns = [
    {
      title: 'نامه',
      dataIndex: 'subject',
      key: 'subject',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: COLORS.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
              flexShrink: 0,
            }}
          >
            <FileTextOutlined />
          </div>
          <div>
            <Link to={`/letters/${record._id}`}>
              <strong style={{ fontSize: isPhone ? '13px' : '14px' }}>{text}</strong>
            </Link>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {record.number || 'بدون شماره'}
            </div>
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
          draft: 'پیش‌نویس',
          registered: 'ثبت شده',
          in_review: 'در بررسی',
          approved: 'تایید شده',
          rejected: 'رد شده',
          signed: 'امضا شده',
          archived: 'بایگانی شده',
        };
        const colors = {
          draft: 'default',
          registered: 'processing',
          in_review: 'warning',
          approved: 'success',
          rejected: 'error',
          signed: 'purple',
          archived: 'default',
        };
        return <Tag color={colors[status] || 'default'}>{map[status] || status}</Tag>;
      },
    },
    {
      title: 'بایگانی',
      key: 'archive',
      render: (_, record) => (
        <Tag icon={<FolderOutlined />} color="orange">
          {record.metadata?.archiveName || 'نامشخص'}
        </Tag>
      ),
    },
    {
      title: 'تاریخ',
      dataIndex: 'letterDate',
      key: 'letterDate',
      render: (date) => (
        <span style={{ fontSize: isPhone ? '10px' : '13px' }}>
          {toPersianDate(date)}
        </span>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <Title level={isPhone ? 4 : isMobile ? 3 : 2} style={{ marginBottom: 16 }}>
        🔍 جستجوی بایگانی
      </Title>

      <Card style={{ borderRadius: 'var(--radius)', marginBottom: 16 }}>
        <Row gutter={[8, 8]}>
          <Col xs={24} md={12}>
            <Input
              placeholder={isPhone ? '🔍 جستجو...' : 'جستجو بر اساس شماره، موضوع...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPressEnter={handleSearch}
              size={isPhone ? 'small' : 'large'}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              placeholder="نوع بایگانی"
              value={filters.type}
              onChange={(value) => setFilters({ ...filters, type: value })}
              style={{ width: '100%' }}
              allowClear
              size={isPhone ? 'small' : 'large'}
            >
              <Option value="active">جاری</Option>
              <Option value="semi_active">نیمه‌جاری</Option>
              <Option value="inactive">راکد</Option>
            </Select>
          </Col>
          <Col xs={12} md={4}>
            <Select
              placeholder="دبیرخانه"
              value={filters.secretariat}
              onChange={(value) => setFilters({ ...filters, secretariat: value })}
              style={{ width: '100%' }}
              allowClear
              size={isPhone ? 'small' : 'large'}
            >
              {/* اینجا باید لیست دبیرخانه‌ها از API گرفته شود */}
            </Select>
          </Col>
          <Col xs={24} md={4}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={loading}
              size={isPhone ? 'small' : 'large'}
              block
            >
              جستجو
            </Button>
          </Col>
        </Row>

        <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
          <Col xs={24} md={12}>
            <RangePicker
              value={[filters.fromDate, filters.toDate]}
              onChange={(dates) => setFilters({
                ...filters,
                fromDate: dates?.[0] || null,
                toDate: dates?.[1] || null,
              })}
              placeholder={['از تاریخ', 'تا تاریخ']}
              size={isPhone ? 'small' : 'middle'}
              format="YYYY/MM/DD"
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={12}>
            <Button
              icon={<ClearOutlined />}
              onClick={clearFilters}
              size={isPhone ? 'small' : 'middle'}
            >
              پاک کردن فیلترها
            </Button>
          </Col>
        </Row>

        <Divider style={{ margin: '12px 0' }} />

        <Row gutter={[isPhone ? 4 : 8, isPhone ? 4 : 8]}>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRight: `3px solid ${COLORS.primary}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary" style={{ fontSize: isPhone ? '10px' : '12px' }}>
                  بایگانی‌ها
                </Text>
                <Badge count={results.archives?.length || 0} style={{ background: COLORS.primary }} />
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRight: `3px solid ${COLORS.success}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary" style={{ fontSize: isPhone ? '10px' : '12px' }}>
                  نامه‌ها
                </Text>
                <Badge count={totalLetters || 0} style={{ background: COLORS.success }} />
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRight: `3px solid ${COLORS.warning}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary" style={{ fontSize: isPhone ? '10px' : '12px' }}>
                  بایگانی‌های یافت شده
                </Text>
                <Badge count={results.archives?.length || 0} style={{ background: COLORS.warning }} />
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRight: `3px solid ${COLORS.orange}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary" style={{ fontSize: isPhone ? '10px' : '12px' }}>
                  نامه‌های یافت شده
                </Text>
                <Badge count={totalLetters || 0} style={{ background: COLORS.orange }} />
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>در حال جستجو...</div>
        </div>
      ) : results.letters?.length > 0 ? (
        <Card style={{ borderRadius: 'var(--radius)' }}>
          <Table
            columns={columns}
            dataSource={results.letters}
            rowKey="_id"
            scroll={{ x: isPhone ? 400 : isMobile ? 600 : 800 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: !isPhone,
              showTotal: (total) => `تعداد ${total} نامه`,
              size: isPhone ? 'small' : 'default',
            }}
            size={isPhone ? 'small' : 'middle'}
          />
        </Card>
      ) : searchQuery && !loading && (
        <Alert
          message="نتیجه‌ای یافت نشد"
          description="عبارت جستجو را تغییر دهید یا فیلترها را بررسی کنید"
          type="info"
          showIcon
        />
      )}
    </div>
  );
}

export default ArchiveSearch;
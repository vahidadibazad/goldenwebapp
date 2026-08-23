// frontend/src/components/OCRSearch.jsx
import { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Typography,
  Upload,
  Table,
  Tag,
  Space,
  message,
  Spin,
  Progress,
  App, // ✅ اضافه شد
  Tabs,
  Alert,
  Row,
  Col,
  Badge,
  Tooltip,
  Empty,
  Modal,
  Descriptions,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  UploadOutlined,
  FileTextOutlined,
  EyeOutlined,
  ScanOutlined,
  ReloadOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import api from '../services/api';
import { toPersianDate } from '../utils/dateHelper';
import { COLORS } from '../styles/theme';

const { Title, Text } = Typography;

function OCRSearch() {
  const { message, modal } = App.useApp(); // ✅ استفاده از App.useApp()
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [fileList, setFileList] = useState([]);
  const [stats, setStats] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 480);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchingText, setSearchingText] = useState('');
  const [textResults, setTextResults] = useState([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsPhone(window.innerWidth <= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // دریافت آمار OCR
  const fetchStats = async () => {
    try {
      const res = await api.get('/ocr/stats');
      setStats(res.data.data);
    } catch (error) {
      console.error('خطا در دریافت آمار:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // جستجوی OCR
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      message.warning('عبارت جستجو را وارد کنید');
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/ocr/search?q=${encodeURIComponent(searchQuery)}`);
      const hits = res.data.data?.hits || [];
      setResults(hits);
      message.success(`${res.data.data?.total || 0} نتیجه یافت شد`);
    } catch (error) {
      message.error('خطا در جستجو');
    } finally {
      setLoading(false);
    }
  };

  // آپلود فایل برای OCR
  const handleUpload = async (file) => {
    setUploading(true);
    setOcrProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/ocr/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setOcrProgress(percent);
        },
      });

      message.success('فایل با موفقیت آپلود و پردازش شد');
      setFileList([]);
      fetchStats();

      if (res.data.data) {
        setResults([
          {
            id: 'ocr-upload',
            source: {
              title: res.data.data.fileName,
              ocrText: res.data.data.text?.substring(0, 500),
              ocrKeywords: res.data.data.keywords,
            },
            ocr: res.data.data,
            score: res.data.data.confidence || 0,
          },
        ]);
        setSearchQuery('');
      }
    } catch (error) {
      message.error(error.response?.data?.error || 'خطا در آپلود فایل');
    } finally {
      setUploading(false);
      setOcrProgress(0);
    }
    return false;
  };

  // مشاهده جزئیات سند
  const handleViewDocument = async (record) => {
    setSelectedDoc(record);
    setModalVisible(true);
  };

  // جستجوی درون متنی
  const handleSearchInText = async () => {
    if (!searchingText.trim() || !selectedDoc) {
      return;
    }

    try {
      const res = await api.get(`/ocr/search-in-document/${selectedDoc.id}?q=${encodeURIComponent(searchingText)}`);
      setTextResults(res.data.data?.results || []);
      if (res.data.data?.results?.length === 0) {
        message.info('نتیجه‌ای یافت نشد');
      } else {
        message.success(`${res.data.data.results.length} نتیجه یافت شد`);
      }
    } catch (error) {
      message.error('خطا در جستجوی درون متنی');
    }
  };

  // ✅ پردازش همه اسناد - با modal از App.useApp()
  const handleProcessAll = () => {
    modal.confirm({
      title: 'پردازش همه اسناد',
      content: 'آیا از پردازش همه اسناد بدون OCR اطمینان دارید؟ این عملیات ممکن است زمان‌بر باشد.',
      okText: 'بله، شروع کن',
      cancelText: 'انصراف',
      onOk: async () => {
        try {
          message.loading({ content: 'در حال پردازش...', key: 'process' });
          const res = await api.post('/ocr/process-all');
          message.success({ content: `${res.data.data?.length || 0} سند پردازش شد`, key: 'process' });
          fetchStats();
        } catch (error) {
          message.error({ content: 'خطا در پردازش', key: 'process' });
        }
      },
    });
  };

  // ستون‌های جدول نتایج
  const columns = [
    {
      title: 'سند',
      dataIndex: ['source', 'title'],
      key: 'title',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: COLORS.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <FileTextOutlined />
          </div>
          <div>
            <strong style={{ fontSize: isPhone ? '12px' : '14px' }}>
              {text || 'بدون عنوان'}
            </strong>
            {record.source?.category && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {record.source.category}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'متن یافت شده',
      dataIndex: ['source', 'ocrText'],
      key: 'text',
      render: (text) => (
        <div
          style={{
            maxHeight: 60,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: isPhone ? '11px' : '13px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          {text?.substring(0, 120)}...
        </div>
      ),
    },
    {
      title: 'کلیدواژه‌ها',
      dataIndex: ['ocr', 'keywords'],
      key: 'keywords',
      render: (keywords) => (
        <Space size={[4, 4]} wrap>
          {keywords?.slice(0, 5).map((k, i) => (
            <Tag key={i} color="blue" style={{ fontSize: isPhone ? '9px' : '11px' }}>
              {k.word} ({k.count})
            </Tag>
          ))}
          {keywords?.length > 5 && (
            <Tag color="default" style={{ fontSize: isPhone ? '9px' : '11px' }}>
              +{keywords.length - 5}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'امتیاز',
      dataIndex: 'score',
      key: 'score',
      render: (score) => (
        <Tag
          color={score > 70 ? 'success' : score > 40 ? 'warning' : 'default'}
          style={{ borderRadius: 12 }}
        >
          {Math.round(score || 0)}%
        </Tag>
      ),
    },
    {
      title: 'عملیات',
      key: 'action',
      fixed: 'right',
      width: isPhone ? 60 : 80,
      render: (_, record) => (
        <Tooltip title="مشاهده جزئیات">
          <Button
            type="text"
            icon={<EyeOutlined />}
            size={isPhone ? 'small' : 'middle'}
            style={{ color: COLORS.primary }}
            onClick={() => handleViewDocument(record)}
            className="action-btn"
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="fade-in">
      {/* هدر */}
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
        <Title level={isPhone ? 4 : isMobile ? 3 : 2} style={{ margin: 0 }}>
          🔍 جستجوی هوشمند با OCR
          {stats && (
            <Badge
              count={stats.processed}
              style={{
                background: COLORS.success,
                marginRight: 8,
                fontSize: isPhone ? 10 : 12,
              }}
              title="اسناد پردازش شده"
            />
          )}
          {stats?.pending > 0 && (
            <Badge
              count={`${stats.pending} در انتظار`}
              style={{
                background: COLORS.warning,
                marginRight: 4,
                fontSize: isPhone ? 10 : 12,
              }}
            />
          )}
        </Title>
        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchStats}
            size={isPhone ? 'small' : 'middle'}
          >
            بروزرسانی
          </Button>
          {stats?.pending > 0 && (
            <Button
              type="primary"
              icon={<ScanOutlined />}
              onClick={handleProcessAll}
              size={isPhone ? 'small' : 'middle'}
            >
              {isPhone ? 'پردازش' : `پردازش ${stats.pending} سند`}
            </Button>
          )}
        </Space>
      </div>

      {/* آمار */}
      {stats && (
        <Row gutter={[isPhone ? 4 : 8, isPhone ? 4 : 8]} style={{ marginBottom: 12 }}>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRight: `3px solid ${COLORS.primary}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary" style={{ fontSize: isPhone ? '10px' : '12px' }}>
                  کل اسناد
                </Text>
                <Badge count={stats.total} style={{ background: COLORS.primary }} />
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRight: `3px solid ${COLORS.success}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary" style={{ fontSize: isPhone ? '10px' : '12px' }}>
                  پردازش شده
                </Text>
                <Badge count={stats.processed} style={{ background: COLORS.success }} />
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRight: `3px solid ${COLORS.warning}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary" style={{ fontSize: isPhone ? '10px' : '12px' }}>
                  در انتظار
                </Text>
                <Badge count={stats.pending} style={{ background: COLORS.warning }} />
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRight: `3px solid ${COLORS.purple}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary" style={{ fontSize: isPhone ? '10px' : '12px' }}>
                  دقت متوسط
                </Text>
                <Badge
                  count={`${Math.round(stats.averageConfidence || 0)}%`}
                  style={{ background: COLORS.purple }}
                />
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* ✅ Tabs با `items` به‌جای TabPane */}
      <Tabs
        defaultActiveKey="search"
        size={isMobile ? 'small' : 'middle'}
        items={[
          {
            key: 'search',
            label: (
              <span>
                <SearchOutlined /> جستجو
              </span>
            ),
            children: (
              <>
                <Card style={{ borderRadius: 'var(--radius)', marginBottom: 16 }}>
                  <Row gutter={[8, 8]}>
                    <Col xs={24} sm={18}>
                      <Input
                        placeholder="متن مورد نظر را وارد کنید..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onPressEnter={handleSearch}
                        size={isPhone ? 'small' : 'large'}
                        prefix={<SearchOutlined />}
                        allowClear
                      />
                    </Col>
                    <Col xs={24} sm={6}>
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
                  <Text type="secondary" style={{ fontSize: isPhone ? '10px' : '12px', display: 'block', marginTop: 8 }}>
                    💡 جستجو در متن اسناد (PDF، تصاویر، فایل‌های متنی)
                  </Text>
                </Card>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>در حال جستجو...</div>
                  </div>
                ) : results.length > 0 ? (
                  <Card style={{ borderRadius: 'var(--radius)' }}>
                    <Table
                      columns={columns}
                      dataSource={results}
                      rowKey="id"
                      loading={loading}
                      scroll={{ x: isPhone ? 400 : isMobile ? 600 : 1000 }}
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: !isPhone,
                        showTotal: (total) => `تعداد ${total} نتیجه`,
                        size: isPhone ? 'small' : 'default',
                      }}
                      size={isPhone ? 'small' : 'middle'}
                    />
                  </Card>
                ) : searchQuery && (
                  <Alert
                    message="نتیجه‌ای یافت نشد"
                    description="عبارت جستجو را تغییر دهید یا فایل جدید آپلود کنید"
                    type="info"
                    showIcon
                  />
                )}
              </>
            ),
          },
          {
            key: 'upload',
            label: (
              <span>
                <UploadOutlined /> آپلود و OCR
              </span>
            ),
            children: (
              <Card style={{ borderRadius: 'var(--radius)' }}>
                <Alert
                  message="آپلود فایل برای OCR"
                  description="با آپلود فایل، متن آن استخراج شده و قابل جستجو می‌شود"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                <Upload
                  beforeUpload={handleUpload}
                  fileList={fileList}
                  onChange={({ fileList }) => setFileList(fileList)}
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.tiff,.txt,.doc,.docx"
                  maxCount={1}
                  showUploadList={true}
                  disabled={uploading}
                >
                  <Button
                    icon={<UploadOutlined />}
                    loading={uploading}
                    size={isPhone ? 'small' : 'large'}
                  >
                    انتخاب فایل
                  </Button>
                </Upload>

                {uploading && (
                  <div style={{ marginTop: 16 }}>
                    <Progress percent={ocrProgress} status="active" />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      در حال پردازش فایل...
                    </Text>
                  </div>
                )}

                <div style={{ marginTop: 16 }}>
                  <Text type="secondary" style={{ fontSize: isPhone ? '10px' : '12px' }}>
                    📄 فرمت‌های پشتیبانی شده: PDF، تصاویر (JPG, PNG, GIF, TIFF)، فایل‌های متنی (TXT)، آفیس (DOC, DOCX)
                  </Text>
                </div>
              </Card>
            ),
          },
        ]}
      />

      {/* مودال مشاهده سند */}
      <Modal
        title={`📄 ${selectedDoc?.source?.title || 'جزئیات سند'}`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedDoc(null);
          setTextResults([]);
          setSearchingText('');
        }}
        footer={[
          <Button key="close" onClick={() => {
            setModalVisible(false);
            setSelectedDoc(null);
            setTextResults([]);
            setSearchingText('');
          }}>
            بستن
          </Button>,
        ]}
        width={isPhone ? '95%' : 700}
        className={isMobile ? 'ant-modal-fullscreen-mobile' : ''}
      >
        {selectedDoc && (
          <div>
            <Descriptions column={isPhone ? 1 : 2} size="small" bordered>
              <Descriptions.Item label="عنوان">
                {selectedDoc.source?.title || 'بدون عنوان'}
              </Descriptions.Item>
              <Descriptions.Item label="نوع فایل">
                <Tag color="blue">{selectedDoc.source?.fileType || 'سایر'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="دسته‌بندی">
                {selectedDoc.source?.category || 'سایر'}
              </Descriptions.Item>
              <Descriptions.Item label="امتیاز OCR">
                <Tag color={selectedDoc.score > 70 ? 'success' : 'warning'}>
                  {Math.round(selectedDoc.score || 0)}%
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="تعداد کلمات">
                {selectedDoc.ocr?.keywords?.length || 0}
              </Descriptions.Item>
              <Descriptions.Item label="زبان">
                <Tag color="purple">{selectedDoc.ocr?.language || 'نامشخص'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="تاریخ پردازش" span={2}>
                {selectedDoc.source?.createdAt 
                  ? toPersianDate(selectedDoc.source.createdAt) 
                  : 'نامشخص'}
              </Descriptions.Item>
            </Descriptions>

            <Divider>📝 کلیدواژه‌ها</Divider>
            <Space size={[4, 4]} wrap>
              {selectedDoc.ocr?.keywords?.map((k, i) => (
                <Tag key={i} color="blue" style={{ padding: '4px 12px', borderRadius: 20 }}>
                  {k.word} ({k.count})
                </Tag>
              ))}
              {(!selectedDoc.ocr?.keywords || selectedDoc.ocr.keywords.length === 0) && (
                <Text type="secondary">هیچ کلیدواژه‌ای استخراج نشده است</Text>
              )}
            </Space>

            <Divider>🔍 جستجوی درون متنی</Divider>
            <Row gutter={[8, 8]}>
              <Col xs={24} sm={18}>
                <Input
                  placeholder="متن مورد نظر را در این سند جستجو کنید..."
                  value={searchingText}
                  onChange={(e) => setSearchingText(e.target.value)}
                  onPressEnter={handleSearchInText}
                  size={isPhone ? 'small' : 'middle'}
                />
              </Col>
              <Col xs={24} sm={6}>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearchInText}
                  size={isPhone ? 'small' : 'middle'}
                  block
                >
                  جستجو
                </Button>
              </Col>
            </Row>

            {textResults.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <Text strong>{textResults.length} نتیجه یافت شد</Text>
                {textResults.map((item, index) => (
                  <Card
                    key={index}
                    size="small"
                    style={{ marginTop: 8, background: 'var(--bg-secondary)', borderRadius: 8 }}
                  >
                    <div style={{ fontSize: isPhone ? '12px' : '14px' }}>
                      <Text type="secondary">خط {item.line}: </Text>
                      <span dangerouslySetInnerHTML={{ __html: item.highlighted || item.text }} />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {searchingText && textResults.length === 0 && (
              <Alert
                message="نتیجه‌ای یافت نشد"
                description="عبارت جستجو در این سند پیدا نشد"
                type="info"
                showIcon
                style={{ marginTop: 12 }}
              />
            )}

            <Divider>📄 متن کامل OCR</Divider>
            <div
              style={{
                maxHeight: 200,
                overflow: 'auto',
                background: 'var(--bg-secondary)',
                padding: 12,
                borderRadius: 8,
                fontSize: isPhone ? '12px' : '14px',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
              }}
            >
              {selectedDoc.source?.ocrText || 'متن استخراج نشده است'}
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        .action-btn {
          transition: all 0.3s ease !important;
          border-radius: 8px !important;
        }
        .action-btn:hover {
          transform: scale(1.15) !important;
          background: var(--bg-secondary) !important;
        }
      `}</style>
    </div>
  );
}

export default OCRSearch;
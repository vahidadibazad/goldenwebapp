// src/components/letters/LetterAttachments.jsx
import { useState } from 'react';
import {
  Card,
  List,
  Button,
  Upload,
  Space,
  Typography,
  Empty,
  Tooltip,
  Popconfirm,
  message,
  Tag,
  Progress,
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileZipOutlined,
  PaperClipOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

// =============================================
// آیکون بر اساس نوع فایل
// =============================================
const getFileIcon = (fileName) => {
  const ext = fileName?.split('.').pop()?.toLowerCase() || '';
  const iconMap = {
    pdf: <FilePdfOutlined style={{ color: '#ff4d4f' }} />,
    doc: <FileWordOutlined style={{ color: '#1677ff' }} />,
    docx: <FileWordOutlined style={{ color: '#1677ff' }} />,
    xls: <FileExcelOutlined style={{ color: '#52c41a' }} />,
    xlsx: <FileExcelOutlined style={{ color: '#52c41a' }} />,
    jpg: <FileImageOutlined style={{ color: '#faad14' }} />,
    jpeg: <FileImageOutlined style={{ color: '#faad14' }} />,
    png: <FileImageOutlined style={{ color: '#faad14' }} />,
    gif: <FileImageOutlined style={{ color: '#faad14' }} />,
    zip: <FileZipOutlined style={{ color: '#722ed1' }} />,
    rar: <FileZipOutlined style={{ color: '#722ed1' }} />,
    '7z': <FileZipOutlined style={{ color: '#722ed1' }} />,
  };
  return iconMap[ext] || <FileOutlined />;
};

// =============================================
// فرمت اندازه فایل
// =============================================
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

function LetterAttachments({ 
  attachments = [], 
  loading = false,
  onUpload,
  onDelete,
  onDownload,
}) {
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);

  // =============================================
  // آپلود فایل
  // =============================================
  const handleUpload = async (file) => {
    setUploading(true);
    try {
      await onUpload(file);
      message.success(`فایل "${file.name}" با موفقیت آپلود شد`);
    } catch (error) {
      message.error('خطا در آپلود فایل');
    } finally {
      setUploading(false);
      setFileList([]);
    }
    return false;
  };

  const uploadProps = {
    beforeUpload: (file) => {
      const isLt20M = file.size / 1024 / 1024 < 20;
      if (!isLt20M) {
        message.error('حجم فایل باید کمتر از ۲۰ مگابایت باشد');
        return false;
      }
      setFileList([file]);
      handleUpload(file);
      return false;
    },
    fileList,
    showUploadList: false,
    multiple: true,
  };

  // =============================================
  // دانلود فایل
  // =============================================
  const handleDownload = async (attachment) => {
    try {
      await onDownload(attachment._id, attachment.fileName);
    } catch (error) {
      message.error('خطا در دانلود فایل');
    }
  };

  return (
    <div>
      {/* دکمه آپلود */}
      <div style={{ marginBottom: 16 }}>
        <Upload {...uploadProps}>
          <Button
            type="dashed"
            icon={<UploadOutlined />}
            loading={uploading}
            block
            style={{ borderRadius: 10, height: 48 }}
          >
            {uploading ? 'در حال آپلود...' : 'انتخاب فایل برای آپلود (حداکثر ۲۰ مگابایت)'}
          </Button>
        </Upload>
        {uploading && (
          <div style={{ marginTop: 8 }}>
            <Progress percent={100} status="active" showInfo={false} />
          </div>
        )}
      </div>

      {/* لیست پیوست‌ها */}
      <List
        loading={loading}
        dataSource={attachments}
        locale={{ emptyText: <Empty description="هیچ پیوستی برای این نامه وجود ندارد" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Tooltip title="دانلود">
                <Button
                  type="text"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload(item)}
                />
              </Tooltip>,
              <Tooltip title="حذف">
                <Popconfirm
                  title="آیا از حذف این پیوست اطمینان دارید؟"
                  onConfirm={() => onDelete(item._id)}
                  okText="بله"
                  cancelText="خیر"
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
              </Tooltip>,
            ]}
            style={{ padding: '8px 0' }}
          >
            <List.Item.Meta
              avatar={
                <div style={{ fontSize: 24 }}>
                  {getFileIcon(item.fileName || item.title)}
                </div>
              }
              title={
                <Space>
                  <Text strong>{item.title || item.fileName}</Text>
                  <Tag color="blue" style={{ fontSize: 11 }}>
                    {formatFileSize(item.fileSize || 0)}
                  </Tag>
                </Space>
              }
              description={
                <Space size="large">
                  <span>
                    <PaperClipOutlined /> آپلود شده توسط: {item.uploadedBy?.fullName || item.uploadedBy?.username || 'نامشخص'}
                  </span>
                  <span style={{ color: '#999', fontSize: 12 }}>
                    {new Date(item.createdAt).toLocaleDateString('fa-IR')}
                  </span>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
}

export default LetterAttachments;
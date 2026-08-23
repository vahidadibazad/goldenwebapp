// src/components/letters/LetterMemos.jsx
import { useState } from 'react';
import {
  Card,
  List,
  Avatar,
  Input,
  Button,
  Space,
  Typography,
  Empty,
  Tooltip,
  Popconfirm,
  message,
} from 'antd';
import {
  UserOutlined,
  SendOutlined,
  DeleteOutlined,
  EditOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { toPersianDate } from '../../utils/dateHelper';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

// =============================================
// کامپوننت داخلی برای نمایش هر یادداشت
// =============================================
const MemoItem = ({ memo, isOwner, onEdit, onDelete, onSaveEdit, onCancelEdit, isEditing, editContent, setEditContent, submitting }) => {
  if (isEditing) {
    return (
      <div style={{ padding: '8px 0' }}>
        <TextArea
          rows={2}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          style={{ borderRadius: 8 }}
        />
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <Button
            size="small"
            type="primary"
            onClick={() => onSaveEdit(memo._id)}
            loading={submitting}
          >
            ذخیره
          </Button>
          <Button size="small" onClick={onCancelEdit}>
            انصراف
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar 
            icon={<UserOutlined />} 
            size="small"
            style={{ background: '#1677ff' }}
          >
            {memo.user?.fullName?.charAt(0) || memo.user?.username?.charAt(0)}
          </Avatar>
          <Text strong style={{ fontSize: 13 }}>
            {memo.user?.fullName || memo.user?.username || 'نامشخص'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <ClockCircleOutlined /> {toPersianDate(memo.createdAt)}
          </Text>
        </div>
        {isOwner && (
          <Space size={4}>
            <Tooltip title="ویرایش">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(memo)}
              />
            </Tooltip>
            <Tooltip title="حذف">
              <Popconfirm
                title="آیا از حذف این یادداشت اطمینان دارید؟"
                onConfirm={() => onDelete(memo._id)}
                okText="بله"
                cancelText="خیر"
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          </Space>
        )}
      </div>
      <Paragraph style={{ margin: '4px 0 0 32px', whiteSpace: 'pre-wrap' }}>
        {memo.content}
      </Paragraph>
    </div>
  );
};

// =============================================
// کامپوننت اصلی
// =============================================
function LetterMemos({ 
  memos = [], 
  loading = false,
  onAdd,
  onDelete,
  onEdit,
  currentUser,
}) {
  const [newMemo, setNewMemo] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!newMemo.trim()) {
      message.error('متن یادداشت را وارد کنید');
      return;
    }

    setSubmitting(true);
    try {
      await onAdd(newMemo.trim());
      setNewMemo('');
      message.success('یادداشت با موفقیت افزوده شد');
    } catch (error) {
      message.error('خطا در افزودن یادداشت');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (memo) => {
    setEditingId(memo._id);
    setEditContent(memo.content);
  };

  const handleSaveEdit = async (id) => {
    if (!editContent.trim()) {
      message.error('متن یادداشت را وارد کنید');
      return;
    }

    setSubmitting(true);
    try {
      await onEdit(id, editContent.trim());
      setEditingId(null);
      setEditContent('');
      message.success('یادداشت با موفقیت ویرایش شد');
    } catch (error) {
      message.error('خطا در ویرایش یادداشت');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  return (
    <div>
      {/* فرم افزودن یادداشت */}
      <div style={{ marginBottom: 16 }}>
        <TextArea
          rows={3}
          value={newMemo}
          onChange={(e) => setNewMemo(e.target.value)}
          placeholder="متن یادداشت خود را وارد کنید..."
          style={{ borderRadius: 10 }}
        />
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleAdd}
            loading={submitting}
            disabled={!newMemo.trim()}
          >
            ارسال یادداشت
          </Button>
        </div>
      </div>

      {/* لیست یادداشت‌ها */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Text type="secondary">در حال بارگذاری...</Text>
        </div>
      ) : memos.length === 0 ? (
        <Empty description="هیچ یادداشتی ثبت نشده است" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          {memos.map((memo) => {
            const isOwner = currentUser?._id === memo.user?._id;
            const isEditing = editingId === memo._id;

            return (
              <MemoItem
                key={memo._id}
                memo={memo}
                isOwner={isOwner}
                isEditing={isEditing}
                editContent={editContent}
                setEditContent={setEditContent}
                submitting={submitting}
                onEdit={handleEdit}
                onDelete={onDelete}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LetterMemos;
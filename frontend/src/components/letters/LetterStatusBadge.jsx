// src/components/letters/LetterStatusBadge.jsx
import { Tag, Tooltip } from 'antd';
import {
  EditOutlined,
  FileTextOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SignatureOutlined,
  FolderOutlined,
} from '@ant-design/icons';

// =============================================
// تنظیمات وضعیت‌های ۷گانه نامه
// =============================================
export const STATUS_CONFIG = {
  draft: {
    color: 'default',
    label: 'پیش‌نویس',
    icon: <EditOutlined />,
    description: 'نامه در مرحله پیش‌نویس است و قابل ویرایش می‌باشد',
  },
  registered: {
    color: 'processing',
    label: 'ثبت شده',
    icon: <FileTextOutlined />,
    description: 'نامه ثبت شده و منتظر ارسال برای پاراف است',
  },
  in_review: {
    color: 'warning',
    label: 'در جریان بررسی',
    icon: <SyncOutlined spin />,
    description: 'نامه در دست بررسی و پاراف می‌باشد',
  },
  approved: {
    color: 'success',
    label: 'تأیید شده',
    icon: <CheckCircleOutlined />,
    description: 'نامه تأیید شده و منتظر امضا است',
  },
  rejected: {
    color: 'error',
    label: 'رد شده',
    icon: <CloseCircleOutlined />,
    description: 'نامه رد شده و نیاز به اصلاح دارد',
  },
  signed: {
    color: 'purple',
    label: 'امضا شده',
    icon: <SignatureOutlined />,
    description: 'نامه امضا شده و آماده بایگانی است',
  },
  archived: {
    color: 'default',
    label: 'بایگانی شده',
    icon: <FolderOutlined />,
    description: 'نامه بایگانی شده و قابل تغییر نیست',
  },
};

// =============================================
// دریافت اطلاعات وضعیت
// =============================================
export const getStatusInfo = (status) => {
  return STATUS_CONFIG[status] || STATUS_CONFIG.draft;
};

// =============================================
// کامپوننت اصلی
// =============================================
function LetterStatusBadge({ 
  status, 
  size = 'default', 
  showIcon = true, 
  showTooltip = true,
  className = '',
}) {
  const config = getStatusInfo(status);
  
  const badge = (
    <Tag
      color={config.color}
      icon={showIcon ? config.icon : null}
      className={`status-tag-${status} ${className}`}
      style={{
        fontSize: size === 'small' ? '11px' : size === 'large' ? '15px' : '13px',
        padding: size === 'small' ? '2px 10px' : size === 'large' ? '6px 16px' : '4px 12px',
        borderRadius: '20px',
        fontWeight: size === 'large' ? '600' : '500',
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      {config.label}
    </Tag>
  );

  if (showTooltip) {
    return (
      <Tooltip title={config.description} placement="top">
        {badge}
      </Tooltip>
    );
  }

  return badge;
}

export default LetterStatusBadge;
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // دریافت اعلان‌ها
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  // دریافت تعداد اعلان‌های خوانده‌نشده
  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.data.count);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // بازخوانی هر ۳۰ ثانیه
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // بستن dropdown با کلیک خارج از آن
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // علامت‌گذاری اعلان به عنوان خوانده‌شده
  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n =>
        n._id === id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(unreadCount - 1);
    } catch (err) {
      console.error(err);
    }
  };

  // علامت‌گذاری همه به عنوان خوانده‌شده
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    const icons = {
      ticket_created: '🎫',
      ticket_updated: '✏️',
      hardware_assigned: '💻',
      hardware_created: '➕',
      credential_shared: '🔐',
      document_uploaded: '📄'
    };
    return icons[type] || '📢';
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          fontSize: '20px',
          cursor: 'pointer',
          position: 'relative',
          padding: '4px 8px',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#dc2626',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 8px',
            fontSize: '12px',
            minWidth: '20px',
            textAlign: 'center',
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '40px',
          left: '0',
          width: '380px',
          maxHeight: '420px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          zIndex: 1000,
          border: '1px solid #e2e8f0',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
          }}>
            <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>📬 اعلان‌ها</h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#2563eb',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                همه را خواندم
              </button>
            )}
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                <p>هیچ اعلانی وجود ندارد</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => markAsRead(n._id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    background: n.isRead ? 'white' : '#f0f7ff',
                    borderRight: n.isRead ? 'none' : '4px solid #2563eb',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = n.isRead ? 'white' : '#f0f7ff';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{getIcon(n.type)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: n.isRead ? '400' : '600', fontSize: '14px', color: '#0f172a' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        {new Date(n.createdAt).toLocaleDateString('fa-IR')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
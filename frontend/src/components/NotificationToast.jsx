// frontend/src/components/NotificationToast.jsx
import React, { useEffect } from 'react';
import { message } from 'antd';
import { useSocket } from '../context/SocketContext';

const NotificationToast = () => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return; // ✅ اگر socket وجود نداشت، از اجرا خارج شو

    const handleNotification = (data) => {
      // نمایش اعلان با antd message
      message.info({
        content: data.message || 'اعلان جدید',
        duration: 5,
        style: {
          marginTop: '70px',
        },
      });
    };

    // گوش دادن به رویدادهای اعلان
    socket.on('notification', handleNotification);

    // پاکسازی هنگام unmount
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket]);

  return null; // این کامپوننت چیزی نمایش نمی‌دهد
};

export default NotificationToast;
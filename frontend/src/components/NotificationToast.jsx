import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

function NotificationToast() {
  const { notifications } = useSocket();

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      toast(latest.message, {
        icon: '🔔',
        duration: 5000,
        style: {
          borderRadius: '12px',
          background: '#1e293b',
          color: '#fff',
        },
      });
    }
  }, [notifications]);

  return null;
}

export default NotificationToast;
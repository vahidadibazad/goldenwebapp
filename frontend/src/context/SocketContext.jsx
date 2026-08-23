// frontend/src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { getSocketUrl } from '../config';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);
  const isMounted = useRef(true);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  useEffect(() => {
    isMounted.current = true;

    const token = localStorage.getItem('token');
    console.log(`🔑 توکن در SocketContext: ${token ? '✅ موجود' : '❌ ناموجود'}`);

    if (!token) {
      console.log('ℹ️ توکن یافت نشد، اتصال Socket برقرار نشد');
      return;
    }

    // ✅ استفاده از تابع getSocketUrl برای دریافت آدرس پویا
    const SOCKET_URL = getSocketUrl();
    console.log(`🔌 اتصال به Socket: ${SOCKET_URL}`);

    // ✅ تنظیمات Socket.IO با fallback به polling
    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['polling', 'websocket'],
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 30000,
      forceNew: true,
      upgrade: true,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    // =============================================
    // رویدادهای اتصال
    // =============================================

    socketInstance.on('connect', () => {
      if (isMounted.current) {
        console.log('✅ Socket متصل شد');
        setIsConnected(true);
        reconnectAttempts.current = 0;
      }
    });

    socketInstance.on('disconnect', (reason) => {
      if (isMounted.current) {
        console.log(`❌ Socket قطع شد: ${reason}`);
        setIsConnected(false);
      }
    });

    socketInstance.on('connect_error', (error) => {
      if (isMounted.current) {
        console.error('❌ خطا در اتصال Socket:', error.message);
        setIsConnected(false);
        
        // ✅ اگر WebSocket خطا داد، به polling برگرد
        if (error.message.includes('websocket') || error.message.includes('WebSocket')) {
          console.log('🔄 تلاش مجدد با transport polling...');
        }
      }
    });

    socketInstance.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 تلاش مجدد: ${attempt}/${maxReconnectAttempts}`);
      reconnectAttempts.current = attempt;
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('❌ اتصال مجدد ناموفق بود');
      if (isMounted.current) {
        setIsConnected(false);
      }
    });

    socketInstance.on('reconnect', () => {
      console.log('✅ اتصال مجدد با موفقیت انجام شد');
      if (isMounted.current) {
        setIsConnected(true);
        reconnectAttempts.current = 0;
      }
    });

    // =============================================
    // رویدادهای کاربران آنلاین
    // =============================================

    socketInstance.on('users_online', (users) => {
      if (isMounted.current) {
        console.log(`👥 ${users.length} کاربر آنلاین`);
        setOnlineUsers(users);
      }
    });

    socketInstance.on('user_online', (user) => {
      if (isMounted.current) {
        console.log(`🟢 کاربر آنلاین شد: ${user.fullName || user.username}`);
        setOnlineUsers((prev) => {
          if (prev.find((u) => u.userId === user.userId)) return prev;
          return [...prev, user];
        });
      }
    });

    socketInstance.on('user_offline', (user) => {
      if (isMounted.current) {
        console.log(`🔴 کاربر آفلاین شد: ${user.fullName || user.username}`);
        setOnlineUsers((prev) => prev.filter((u) => u.userId !== user.userId));
      }
    });

    // =============================================
    // رویدادهای اعلان‌ها
    // =============================================

    socketInstance.on('notification', (notification) => {
      if (isMounted.current) {
        console.log(`🔔 اعلان جدید: ${notification.title}`);
        setNotifications((prev) => [notification, ...prev]);
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/icons/icon-192x192.png',
          });
        }
      }
    });

    // =============================================
    // پاکسازی
    // =============================================

    return () => {
      isMounted.current = false;
      if (socketRef.current) {
        try {
          if (socketRef.current.connected) {
            socketRef.current.disconnect();
          }
          socketRef.current.removeAllListeners();
          socketRef.current = null;
          console.log('🔌 Socket پاکسازی شد');
        } catch (error) {
          console.warn('⚠️ خطا در پاکسازی Socket:', error.message);
        }
      }
    };
  }, []);

  // =============================================
  // توابع عمومی
  // =============================================

  const value = {
    socket,
    isConnected,
    onlineUsers,
    notifications,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export default SocketContext;
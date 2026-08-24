// frontend/src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const getSocketURL = () => {
  const hostname = window.location.hostname;
  const port = 3000;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:${port}`;
  }
  return `http://${hostname}:${port}`;
};

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    if (socketRef.current && socketRef.current.connected) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ توکن برای Socket یافت نشد');
      return;
    }

    const SOCKET_URL = getSocketURL();
    console.log('🔌 اتصال به Socket:', SOCKET_URL);

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: {
        token: token, // ✅ استفاده از auth به جای query
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket متصل شد');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket قطع شد');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ خطا در اتصال Socket:', error.message);
    });

    socket.on('online-users', (users) => {
      console.log('👥 کاربران آنلاین:', users);
      setOnlineUsers(users);
    });

    socket.on('user-online', (userData) => {
      console.log('🟢 کاربر آنلاین شد:', userData);
      setOnlineUsers((prev) => [...prev, userData]);
    });

    socket.on('user-offline', (userId) => {
      console.log('🔴 کاربر آفلاین شد:', userId);
      setOnlineUsers((prev) => prev.filter((u) => u.id !== userId));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, onlineUsers }}>
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
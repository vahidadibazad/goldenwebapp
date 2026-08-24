// backend/socket.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./src/models/User');

let io;
const onlineUsers = new Map();

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        console.log('❌ توکن در Socket یافت نشد');
        return next(new Error('توکن یافت نشد'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
      const user = await User.findById(decoded.id).populate('role');
      
      if (!user) {
        return next(new Error('کاربر یافت نشد'));
      }

      socket.user = user;
      socket.userId = user._id.toString();
      next();
    } catch (error) {
      console.error('❌ خطا در احراز هویت Socket:', error.message);
      next(new Error('احراز هویت ناموفق'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const userFullName = socket.user?.fullName || socket.user?.username || 'کاربر ناشناس';
    
    console.log(`🟢 کاربر متصل شد: ${userFullName} (${socket.id})`);

    // حذف سوکت قدیمی اگر وجود داشته باشد
    if (onlineUsers.has(userId)) {
      const oldSocketId = onlineUsers.get(userId);
      const oldSocket = io.sockets.sockets.get(oldSocketId);
      if (oldSocket) {
        console.log(`🔄 حذف سوکت قدیمی کاربر: ${userFullName}`);
        oldSocket.disconnect(true);
      }
      onlineUsers.delete(userId);
    }

    onlineUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);
    
    broadcastOnlineUsers();

    socket.on('disconnect', () => {
      console.log(`🔴 کاربر قطع شد: ${userFullName} (${socket.id})`);
      
      if (onlineUsers.get(userId) === socket.id) {
        onlineUsers.delete(userId);
        broadcastOnlineUsers();
      }
    });
  });

  return io;
};

const broadcastOnlineUsers = () => {
  const users = [];
  for (const [userId, socketId] of onlineUsers) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket && socket.user) {
      users.push({
        id: userId,
        username: socket.user.username,
        fullName: socket.user.fullName || socket.user.username,
      });
    }
  }
  io.emit('online-users', users);
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io راه‌اندازی نشده است');
  }
  return io;
};

module.exports = { initSocket, getIO };
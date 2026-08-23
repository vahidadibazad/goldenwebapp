const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;
const connectedUsers = new Map();

const initSocket = (server) => {
  console.log('🔄 راه‌اندازی Socket.io...');

  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    path: '/socket.io',
    pingTimeout: 60000,
    pingInterval: 25000,
    allowEIO3: true,
  });

  // میدلور احراز هویت
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        console.log('❌ توکن یافت نشد');
        return next(new Error('توکن یافت نشد'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id)
        .select('_id username fullName role')
        .populate('role', 'name label');

      if (!user) {
        console.log('❌ کاربر یافت نشد');
        return next(new Error('کاربر یافت نشد'));
      }

      socket.user = user;
      console.log(`✅ کاربر احراز هویت شد: ${user.username}`);
      next();
    } catch (error) {
      console.error('❌ خطا در احراز هویت Socket:', error.message);
      next(new Error('احراز هویت ناموفق'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`🟢 کاربر متصل شد: ${user?.fullName || user?.username || 'ناشناس'} (${socket.id})`);

    if (user) {
      // ذخیره کاربر متصل
      connectedUsers.set(user._id.toString(), {
        socketId: socket.id,
        user: user,
        connectedAt: new Date(),
      });

      // پیوستن به Room اختصاصی کاربر
      socket.join(`user:${user._id}`);
      console.log(`📌 کاربر ${user.username} به room خود پیوست`);

      // ارسال لیست کاربران آنلاین به همه
      const onlineUsersList = Array.from(connectedUsers.values()).map((item) => ({
        userId: item.user._id,
        username: item.user.username,
        fullName: item.user.fullName,
      }));
      io.emit('users_online', onlineUsersList);

      // اعلان به سایر کاربران
      socket.broadcast.emit('user_online', {
        userId: user._id,
        username: user.username,
        fullName: user.fullName,
      });
    }

    // =============================================
    // رویدادهای سفارشی
    // =============================================

    socket.on('send_message', async (data) => {
      try {
        const { receiverId, message, type = 'text' } = data;
        if (user) {
          io.to(`user:${receiverId}`).emit('new_message', {
            sender: {
              _id: user._id,
              username: user.username,
              fullName: user.fullName,
            },
            message,
            type,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error('❌ خطا در ارسال پیام:', error);
        socket.emit('error', { message: 'خطا در ارسال پیام' });
      }
    });

    socket.on('typing', (data) => {
      const { receiverId, isTyping } = data;
      if (user) {
        socket.to(`user:${receiverId}`).emit('user_typing', {
          userId: user._id,
          username: user.username,
          isTyping,
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔴 کاربر قطع شد: ${user?.fullName || user?.username || 'ناشناس'} (${socket.id})`);

      if (user) {
        connectedUsers.delete(user._id.toString());

        const updatedList = Array.from(connectedUsers.values()).map((item) => ({
          userId: item.user._id,
          username: item.user.username,
          fullName: item.user.fullName,
        }));
        io.emit('users_online', updatedList);

        io.emit('user_offline', {
          userId: user._id,
          username: user.username,
        });
      }
    });
  });

  console.log('✅ Socket.io راه‌اندازی شد');
  return io;
};

const sendNotification = (userId, notification) => {
  if (!io) {
    console.warn('⚠️ Socket.io راه‌اندازی نشده است');
    return;
  }
  io.to(`user:${userId}`).emit('notification', notification);
};

const getIO = () => io;
const getConnectedUsers = () => connectedUsers;

module.exports = { initSocket, sendNotification, getIO, getConnectedUsers };
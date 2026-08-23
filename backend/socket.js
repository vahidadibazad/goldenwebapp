// backend/socket.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./src/models/User');

let io = null;
const connectedUsers = new Map();

const initSocket = (server) => {
  console.log('🔄 راه‌اندازی Socket.io...');

  io = new Server(server, {
    cors: {
      origin: '*', // برای توسعه
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
    },
    transports: ['polling', 'websocket'],
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
        .select('_id username fullName role isActive')
        .populate('role', 'name label')
        .lean();

      if (!user) {
        console.log('❌ کاربر یافت نشد');
        return next(new Error('کاربر یافت نشد'));
      }

      if (user.isActive === false) {
        console.log(`❌ کاربر غیرفعال: ${user.username}`);
        return next(new Error('حساب کاربری غیرفعال است'));
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
      connectedUsers.set(user._id.toString(), {
        socketId: socket.id,
        user: user,
        connectedAt: new Date(),
      });

      socket.join(`user:${user._id}`);
      console.log(`📌 کاربر ${user.username} به room خود پیوست`);

      const onlineUsersList = Array.from(connectedUsers.values()).map((item) => ({
        userId: item.user._id,
        username: item.user.username,
        fullName: item.user.fullName,
      }));
      io.emit('users_online', onlineUsersList);

      socket.broadcast.emit('user_online', {
        userId: user._id,
        username: user.username,
        fullName: user.fullName,
      });
    }

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
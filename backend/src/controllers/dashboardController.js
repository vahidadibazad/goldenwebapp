// backend/src/controllers/dashboardController.js
const Letter = require('../models/Letter');
const Hardware = require('../models/hardware');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const CacheService = require('../services/cacheService');
const mongoose = require('mongoose');

class DashboardController {

  // =============================================
  // ✅ دریافت آمار داشبورد با Aggregation Pipeline
  // =============================================
  static async getDashboardStats(req, res) {
    try {
      const userId = req.user.id;
      const cacheKey = `dashboard:stats:${userId}`;
      
      // بررسی کش
      const cachedData = await CacheService.get(cacheKey);
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData,
          fromCache: true,
        });
      }

      // ✅ استفاده از Promise.all با Aggregation
      const [
        lettersCount,
        hardwareCount,
        ticketsCount,
        usersCount,
        pendingLetters,
        openTickets,
        letterStats,
        hardwareStats,
        ticketStats,
      ] = await Promise.all([
        Letter.countDocuments(),
        Hardware.countDocuments(),
        Ticket.countDocuments(),
        User.countDocuments({ isActive: true }),
        Letter.countDocuments({ status: 'registered' }),
        Ticket.countDocuments({ status: 'open' }),
        // ✅ Aggregation برای آمار نامه‌ها
        Letter.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]),
        // ✅ Aggregation برای آمار اموال
        Hardware.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]),
        // ✅ Aggregation برای آمار تیکت‌ها
        Ticket.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]),
      ]);

      // تبدیل نتایج Aggregation به Object
      const letterStatsObj = {
        draft: 0, registered: 0, in_review: 0,
        approved: 0, rejected: 0, signed: 0, archived: 0
      };
      letterStats.forEach(item => {
        if (item._id && letterStatsObj[item._id] !== undefined) {
          letterStatsObj[item._id] = item.count;
        }
      });

      const hardwareStatsObj = {
        active: 0, in_stock: 0, repair: 0, archived: 0, disposed: 0
      };
      hardwareStats.forEach(item => {
        if (item._id && hardwareStatsObj[item._id] !== undefined) {
          hardwareStatsObj[item._id] = item.count;
        }
      });

      const ticketStatsObj = {
        open: 0, in_progress: 0, resolved: 0, closed: 0
      };
      ticketStats.forEach(item => {
        if (item._id && ticketStatsObj[item._id] !== undefined) {
          ticketStatsObj[item._id] = item.count;
        }
      });

      const stats = {
        letters: lettersCount,
        hardware: hardwareCount,
        tickets: ticketsCount,
        users: usersCount,
        pendingLetters,
        openTickets,
        letterStats: letterStatsObj,
        hardwareStats: hardwareStatsObj,
        ticketStats: ticketStatsObj,
        updatedAt: new Date(),
      };

      // ذخیره در کش
      await CacheService.set(cacheKey, stats, 60);

      res.json({
        success: true,
        data: stats,
      });

    } catch (error) {
      console.error('❌ خطا در دریافت آمار:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // =============================================
  // ✅ دریافت داده‌های کارتابل با بهینه‌سازی
  // =============================================
  static async getDashboardData(req, res) {
    try {
      const userId = req.user.id;
      const cacheKey = `dashboard:data:${userId}`;
      
      const cachedData = await CacheService.get(cacheKey);
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData,
          fromCache: true,
        });
      }

      // ✅ درخواست‌های موازی با select() و lean()
      const [
        inbox,
        outbox,
        pending,
        unreadNotifications,
        recentLetters,
        recentTickets,
      ] = await Promise.all([
        Letter.find({ receiver: userId, status: 'registered' })
          .select('number subject sender letterDate')
          .populate('sender', 'username fullName')
          .limit(5)
          .lean(),
        Letter.find({ sender: userId })
          .select('number subject receiver letterDate')
          .populate('receiver', 'username fullName')
          .limit(5)
          .lean(),
        Letter.find({
          'referrals.to': userId,
          'referrals.status': 'pending'
        })
          .select('number subject sender letterDate')
          .populate('sender', 'username fullName')
          .limit(5)
          .lean(),
        Notification.countDocuments({ user: userId, isRead: false }),
        Letter.find({
          $or: [{ sender: userId }, { receiver: userId }]
        })
          .select('number subject status createdAt')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
        Ticket.find({
          $or: [{ requester: userId }, { assignedTo: userId }]
        })
          .select('title status priority createdAt')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
      ]);

      const data = {
        inbox,
        outbox,
        pending,
        unreadNotifications,
        recentLetters,
        recentTickets,
        updatedAt: new Date(),
      };

      await CacheService.set(cacheKey, data, 120);

      res.json({
        success: true,
        data,
      });

    } catch (error) {
      console.error('❌ خطا در دریافت داده‌های کارتابل:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = DashboardController;
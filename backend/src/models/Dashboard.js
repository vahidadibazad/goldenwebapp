const mongoose = require('mongoose');

const DashboardSchema = new mongoose.Schema({
  // =============================================
  // کاربر
  // =============================================
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  
  // =============================================
  // تنظیمات کارتابل
  // =============================================
  settings: {
    defaultView: {
      type: String,
      enum: ['inbox', 'outbox', 'pending', 'all'],
      default: 'inbox',
    },
    itemsPerPage: {
      type: Number,
      default: 20,
    },
    showArchived: {
      type: Boolean,
      default: false,
    },
    sortBy: {
      type: String,
      enum: ['date', 'priority', 'subject', 'sender'],
      default: 'date',
    },
    sortOrder: {
      type: String,
      enum: ['asc', 'desc'],
      default: 'desc',
    },
  },
  
  // =============================================
  // فیلترهای ذخیره شده
  // =============================================
  savedFilters: [{
    name: { type: String, required: true },
    filter: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
  }],
  
  // =============================================
  // نشان‌ها (Bookmarks)
  // =============================================
  bookmarks: [{
    letter: { type: mongoose.Schema.Types.ObjectId, ref: 'Letter' },
    note: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  }],
  
  // =============================================
  // آخرین فعالیت
  // =============================================
  lastActivity: {
    type: Date,
    default: Date.now,
  },
  
}, { timestamps: true });

// =============================================
// ✅ ایندکس‌ها
// =============================================
DashboardSchema.index({ user: 1 });

// =============================================
// ✅ متدها
// =============================================

// دریافت کارتابل کامل کاربر
DashboardSchema.methods.getFullDashboard = async function() {
  const Letter = mongoose.model('Letter');
  const Referral = mongoose.model('Referral');
  const Notification = mongoose.model('Notification');
  
  // دریافت آمار
  const stats = {
    inbox: await Letter.countDocuments({ receiver: this.user, status: 'registered' }),
    outbox: await Letter.countDocuments({ sender: this.user, status: 'registered' }),
    pending: await Letter.countDocuments({ 
      'referrals.to': this.user,
      'referrals.status': 'pending',
    }),
    unread: await Notification.countDocuments({ user: this.user, isRead: false }),
    overdue: await Referral.countDocuments({ 
      to: this.user,
      status: { $in: ['pending', 'read'] },
      dueDate: { $lt: new Date() },
    }),
  };
  
  // دریافت آخرین نامه‌ها
  const recentLetters = await Letter.find({
    $or: [
      { sender: this.user },
      { receiver: this.user },
      { 'referrals.to': this.user },
    ],
  })
    .populate('sender', 'fullName username')
    .populate('receiver', 'fullName username')
    .populate('secretariat', 'name code')
    .sort({ createdAt: -1 })
    .limit(10);
  
  return {
    stats,
    recentLetters,
  };
};

// =============================================
// ✅ استاتیک‌ها
// =============================================

// دریافت یا ایجاد کارتابل برای کاربر
DashboardSchema.statics.getOrCreate = async function(userId) {
  let dashboard = await this.findOne({ user: userId });
  if (!dashboard) {
    dashboard = new this({
      user: userId,
      settings: {
        defaultView: 'inbox',
        itemsPerPage: 20,
        showArchived: false,
        sortBy: 'date',
        sortOrder: 'desc',
      },
      savedFilters: [],
      bookmarks: [],
    });
    await dashboard.save();
  }
  return dashboard;
};

module.exports = mongoose.models.Dashboard || mongoose.model('Dashboard', DashboardSchema);
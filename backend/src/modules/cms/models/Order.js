// backend/src/modules/cms/models/Order.js
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    // =============================================
    // شماره سفارش
    // =============================================
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },

    // =============================================
    // کاربر
    // =============================================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    guestEmail: {
      type: String,
      default: '',
      trim: true,
    },

    // =============================================
    // آیتم‌های سفارش
    // =============================================
    items: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      variant: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      name: { type: String, required: true },
      sku: { type: String, default: '' },
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true },
      total: { type: Number, required: true },
    }],

    // =============================================
    // مبالغ
    // =============================================
    subtotal: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    shipping: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'IRR',
    },

    // =============================================
    // آدرس‌ها
    // =============================================
    billingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'IR' },
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'IR' },
    },

    // =============================================
    // پرداخت
    // =============================================
    payment: {
      method: {
        type: String,
        enum: ['credit_card', 'bank_transfer', 'cod', 'wallet', 'zarinpal'],
        required: true,
      },
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
      },
      transactionId: { type: String, default: '' },
      paidAt: { type: Date, default: null },
      details: { type: mongoose.Schema.Types.Mixed, default: {} },
    },

    // =============================================
    // حمل و نقل
    // =============================================
    shipping: {
      method: { type: String, default: '' },
      trackingNumber: { type: String, default: '' },
      carrier: { type: String, default: '' },
      shippedAt: { type: Date, default: null },
      deliveredAt: { type: Date, default: null },
    },

    // =============================================
    // وضعیت سفارش
    // =============================================
    status: {
      type: String,
      enum: [
        'pending',
        'processing',
        'shipped',
        'delivered',
        'completed',
        'cancelled',
        'refunded',
      ],
      default: 'pending',
    },

    // =============================================
    // تاریخچه وضعیت
    // =============================================
    statusHistory: [{
      status: { type: String, required: true },
      note: { type: String, default: '' },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now },
    }],

    // =============================================
    // یادداشت‌ها
    // =============================================
    notes: {
      type: String,
      default: '',
    },
    adminNotes: {
      type: String,
      default: '',
    },

    // =============================================
    // متادیتا
    // =============================================
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// =============================================
// ✅ ایندکس‌ها
// =============================================
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ user: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'payment.status': 1 });

// =============================================
// ✅ میدلورها
// =============================================

// تولید شماره سفارش
OrderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    this.orderNumber = `ORD-${year}${month}${day}-${random}`;
  }
  next();
});

// =============================================
// ✅ متدهای نمونه
// =============================================

// تغییر وضعیت
OrderSchema.methods.changeStatus = async function(status, note = '', userId = null) {
  this.status = status;
  this.statusHistory.push({ status, note, user: userId });
  await this.save();
  return this;
};

// پرداخت موفق
OrderSchema.methods.markAsPaid = async function(transactionId, details = {}) {
  this.payment.status = 'paid';
  this.payment.transactionId = transactionId;
  this.payment.paidAt = new Date();
  this.payment.details = details;
  await this.changeStatus('processing', 'پرداخت با موفقیت انجام شد');
  return this;
};

// ارسال سفارش
OrderSchema.methods.markAsShipped = async function(trackingNumber, carrier = '') {
  this.shipping.trackingNumber = trackingNumber;
  this.shipping.carrier = carrier;
  this.shipping.shippedAt = new Date();
  await this.changeStatus('shipped', 'سفارش ارسال شد');
  return this;
};

// تحویل سفارش
OrderSchema.methods.markAsDelivered = async function() {
  this.shipping.deliveredAt = new Date();
  await this.changeStatus('delivered', 'سفارش تحویل داده شد');
  return this;
};

// تکمیل سفارش
OrderSchema.methods.markAsCompleted = async function() {
  await this.changeStatus('completed', 'سفارش تکمیل شد');
  return this;
};

// لغو سفارش
OrderSchema.methods.cancel = async function(reason = '') {
  await this.changeStatus('cancelled', `لغو سفارش: ${reason}`);
  // بازگرداندن موجودی
  for (const item of this.items) {
    const Product = mongoose.model('Product');
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
  }
  return this;
};

// بازگشت وجه
OrderSchema.methods.refund = async function(reason = '') {
  await this.changeStatus('refunded', `بازگشت وجه: ${reason}`);
  this.payment.status = 'refunded';
  await this.save();
  return this;
};

// =============================================
// ✅ متدهای استاتیک
// =============================================

// دریافت سفارشات کاربر
OrderSchema.statics.getByUser = function(userId, options = {}) {
  const { status, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const filter = { user: userId };
  if (status) filter.status = status;

  return this.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('items.product', 'name slug images')
    .lean();
};

// دریافت آمار سفارشات
OrderSchema.statics.getStats = function() {
  return Promise.all([
    this.countDocuments({ status: 'pending' }),
    this.countDocuments({ status: 'processing' }),
    this.countDocuments({ status: 'shipped' }),
    this.countDocuments({ status: 'delivered' }),
    this.countDocuments({ status: 'completed' }),
    this.countDocuments({ status: 'cancelled' }),
    this.countDocuments({ status: 'refunded' }),
    this.aggregate([
      { $match: { status: { $in: ['completed', 'delivered', 'shipped'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
    ]),
  ]).then(([pending, processing, shipped, delivered, completed, cancelled, refunded, revenue]) => ({
    pending,
    processing,
    shipped,
    delivered,
    completed,
    cancelled,
    refunded,
    total: pending + processing + shipped + delivered + completed + cancelled + refunded,
    totalRevenue: revenue[0]?.totalRevenue || 0,
  }));
};

// دریافت سفارشات اخیر
OrderSchema.statics.getRecent = function(limit = 10) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'fullName username email')
    .populate('items.product', 'name slug')
    .lean();
};

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
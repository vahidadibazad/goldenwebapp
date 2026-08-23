// backend/src/modules/cms/services/ecommerceService.js
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const CacheService = require('../../../services/cacheService');

class EcommerceService {

  // =============================================
  // مدیریت محصولات
  // =============================================

  static async createProduct(data, userId) {
    const product = new Product({
      ...data,
      createdBy: userId,
      updatedBy: userId,
    });
    await product.save();
    await CacheService.clearModule('cms:products:');
    return product;
  }

  static async getProducts(options = {}) {
    const cacheKey = `cms:products:${JSON.stringify(options)}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const result = await Product.getPublished(options);
    await CacheService.set(cacheKey, result, 120);
    return result;
  }

  static async getProductById(id) {
    const cacheKey = `cms:product:${id}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const product = await Product.findById(id)
      .populate('categories', 'name slug')
      .populate('tags', 'name slug')
      .lean();

    if (product) {
      await CacheService.set(cacheKey, product, 3600);
    }
    return product;
  }

  static async getProductBySlug(slug) {
    const cacheKey = `cms:product:slug:${slug}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const product = await Product.getBySlug(slug);
    if (product) {
      await CacheService.set(cacheKey, product, 3600);
    }
    return product;
  }

  static async updateProduct(id, data, userId) {
    const product = await Product.findById(id);
    if (!product) throw new Error('محصول یافت نشد');

    Object.assign(product, data);
    product.updatedBy = userId;
    await product.save();

    await CacheService.delete(`cms:product:${id}`);
    await CacheService.delete(`cms:product:slug:${product.slug}`);
    await CacheService.clearModule('cms:products:');
    return product;
  }

  static async deleteProduct(id) {
    const product = await Product.findByIdAndDelete(id);
    if (!product) throw new Error('محصول یافت نشد');

    await CacheService.delete(`cms:product:${id}`);
    await CacheService.delete(`cms:product:slug:${product.slug}`);
    await CacheService.clearModule('cms:products:');
    return product;
  }

  // =============================================
  // مدیریت سفارشات
  // =============================================

  static async createOrder(data, userId) {
    const order = new Order({
      ...data,
      user: userId,
    });
    await order.save();

    // کاهش موجودی
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        await product.decrementStock(item.quantity);
        await product.incrementSales(item.quantity);
      }
    }

    await CacheService.clearModule('cms:orders:');
    return order;
  }

  static async getOrders(options = {}) {
    const { user, status, page = 1, limit = 20 } = options;
    const filter = {};

    if (user) filter.user = user;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('items.product', 'name slug images')
        .populate('user', 'fullName username email')
        .lean(),
      Order.countDocuments(filter),
    ]);

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  static async getOrderById(id) {
    const order = await Order.findById(id)
      .populate('items.product', 'name slug images')
      .populate('user', 'fullName username email')
      .lean();

    if (!order) throw new Error('سفارش یافت نشد');
    return order;
  }

  static async updateOrderStatus(id, status, note = '', userId = null) {
    const order = await Order.findById(id);
    if (!order) throw new Error('سفارش یافت نشد');

    await order.changeStatus(status, note, userId);
    await CacheService.delete(`cms:order:${id}`);
    await CacheService.clearModule('cms:orders:');
    return order;
  }

  static async cancelOrder(id, reason = '', userId = null) {
    const order = await Order.findById(id);
    if (!order) throw new Error('سفارش یافت نشد');

    await order.cancel(reason);
    await CacheService.delete(`cms:order:${id}`);
    await CacheService.clearModule('cms:orders:');
    return order;
  }

  static async getOrderStats() {
    const cacheKey = 'cms:orders:stats';
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const stats = await Order.getStats();
    await CacheService.set(cacheKey, stats, 300);
    return stats;
  }
}

module.exports = EcommerceService;

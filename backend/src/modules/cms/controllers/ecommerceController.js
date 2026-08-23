// backend/src/modules/cms/controllers/ecommerceController.js
const EcommerceService = require('../services/ecommerceService');
const logAudit = require('../../../utils/auditLogger');

class EcommerceController {

  // =============================================
  // محصولات
  // =============================================

  static async getProducts(req, res) {
    try {
      const { category, tag, search, featured, bestSeller, minPrice, maxPrice, sort, page, limit } = req.query;
      const result = await EcommerceService.getProducts({
        category,
        tag,
        search,
        featured: featured === 'true',
        bestSeller: bestSeller === 'true',
        minPrice: parseFloat(minPrice),
        maxPrice: parseFloat(maxPrice),
        sort,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getProductById(req, res) {
    try {
      const product = await EcommerceService.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ success: false, error: 'محصول یافت نشد' });
      }
      res.json({ success: true, data: product });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getProductBySlug(req, res) {
    try {
      const product = await EcommerceService.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ success: false, error: 'محصول یافت نشد' });
      }
      // افزایش بازدید
      await Product.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } });
      res.json({ success: true, data: product });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async createProduct(req, res) {
    try {
      const product = await EcommerceService.createProduct(req.body, req.user.id);
      await logAudit(req, 'CREATE', 'CMS_PRODUCT', { productId: product._id });
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async updateProduct(req, res) {
    try {
      const product = await EcommerceService.updateProduct(req.params.id, req.body, req.user.id);
      await logAudit(req, 'UPDATE', 'CMS_PRODUCT', { productId: product._id });
      res.json({ success: true, data: product });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async deleteProduct(req, res) {
    try {
      await EcommerceService.deleteProduct(req.params.id);
      await logAudit(req, 'DELETE', 'CMS_PRODUCT', { productId: req.params.id });
      res.json({ success: true, message: 'محصول با موفقیت حذف شد' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // =============================================
  // سفارشات
  // =============================================

  static async createOrder(req, res) {
    try {
      const order = await EcommerceService.createOrder(req.body, req.user.id);
      await logAudit(req, 'CREATE', 'CMS_ORDER', { orderId: order._id });
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async getOrders(req, res) {
    try {
      const { status, page, limit } = req.query;
      const result = await EcommerceService.getOrders({
        user: req.user.id,
        status,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getOrderById(req, res) {
    try {
      const order = await EcommerceService.getOrderById(req.params.id);
      res.json({ success: true, data: order });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  static async updateOrderStatus(req, res) {
    try {
      const { status, note } = req.body;
      const order = await EcommerceService.updateOrderStatus(
        req.params.id,
        status,
        note || '',
        req.user.id
      );
      await logAudit(req, 'UPDATE', 'CMS_ORDER', { orderId: order._id, action: 'change_status' });
      res.json({ success: true, data: order });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async cancelOrder(req, res) {
    try {
      const { reason } = req.body;
      const order = await EcommerceService.cancelOrder(
        req.params.id,
        reason || '',
        req.user.id
      );
      await logAudit(req, 'UPDATE', 'CMS_ORDER', { orderId: order._id, action: 'cancel' });
      res.json({ success: true, data: order });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async getOrderStats(req, res) {
    try {
      const stats = await EcommerceService.getOrderStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = EcommerceController;
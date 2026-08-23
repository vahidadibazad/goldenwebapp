// backend/src/modules/cms/routes/ecommerceRoutes.js
const router = require('express').Router();
const EcommerceController = require('../controllers/ecommerceController');
const { protect, checkPermission } = require('../../../middleware/auth');

// =============================================
// مسیرهای عمومی (بدون احراز هویت)
// =============================================

// دریافت محصولات
router.get('/public/products', EcommerceController.getProducts);
router.get('/public/products/:slug', EcommerceController.getProductBySlug);

// =============================================
// مسیرهای محافظت‌شده (با احراز هویت)
// =============================================

// مدیریت محصولات
router.get('/products', protect, checkPermission('cms.view_products'), EcommerceController.getProducts);
router.get('/products/:id', protect, checkPermission('cms.view_products'), EcommerceController.getProductById);
router.post('/products', protect, checkPermission('cms.create_products'), EcommerceController.createProduct);
router.put('/products/:id', protect, checkPermission('cms.edit_products'), EcommerceController.updateProduct);
router.delete('/products/:id', protect, checkPermission('cms.delete_products'), EcommerceController.deleteProduct);

// مدیریت سفارشات
router.get('/orders/stats', protect, checkPermission('cms.view_orders'), EcommerceController.getOrderStats);
router.get('/orders', protect, checkPermission('cms.view_orders'), EcommerceController.getOrders);
router.get('/orders/:id', protect, checkPermission('cms.view_orders'), EcommerceController.getOrderById);
router.post('/orders', protect, checkPermission('cms.create_orders'), EcommerceController.createOrder);
router.patch('/orders/:id/status', protect, checkPermission('cms.edit_orders'), EcommerceController.updateOrderStatus);
router.patch('/orders/:id/cancel', protect, checkPermission('cms.edit_orders'), EcommerceController.cancelOrder);

module.exports = router;
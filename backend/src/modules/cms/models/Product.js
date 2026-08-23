// backend/src/modules/cms/models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    // =============================================
    // اطلاعات پایه
    // =============================================
    name: {
      type: String,
      required: [true, 'نام محصول الزامی است'],
      trim: true,
      maxlength: [200, 'نام محصول نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد'],
    },
    slug: {
      type: String,
      required: [true, 'اسلاگ محصول الزامی است'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'توضیحات محصول الزامی است'],
      trim: true,
    },
    shortDescription: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'توضیحات کوتاه نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد'],
    },

    // =============================================
    // قیمت و موجودی
    // =============================================
    price: {
      type: Number,
      required: [true, 'قیمت محصول الزامی است'],
      min: [0, 'قیمت نمی‌تواند منفی باشد'],
    },
    salePrice: {
      type: Number,
      default: null,
      min: [0, 'قیمت فروش نمی‌تواند منفی باشد'],
    },
    stock: {
      type: Number,
      required: [true, 'موجودی محصول الزامی است'],
      min: [0, 'موجودی نمی‌تواند منفی باشد'],
      default: 0,
    },
    stockStatus: {
      type: String,
      enum: ['in_stock', 'out_of_stock', 'on_backorder'],
      default: 'in_stock',
    },
    sku: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },

    // =============================================
    // تصاویر
    // =============================================
    images: [{
      url: { type: String, required: true },
      alt: { type: String, default: '' },
      isMain: { type: Boolean, default: false },
      order: { type: Number, default: 0 },
    }],
    featuredImage: {
      type: String,
      default: '',
    },

    // =============================================
    // دسته‌بندی و برچسب‌ها
    // =============================================
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    }],
    tags: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tag',
    }],

    // =============================================
    // متغیرها (Variants)
    // =============================================
    variants: [{
      name: { type: String, required: true },
      options: [{
        name: { type: String, required: true },
        price: { type: Number, default: 0 },
        stock: { type: Number, default: 0 },
        sku: { type: String, default: '' },
        isDefault: { type: Boolean, default: false },
      }],
    }],

    // =============================================
    // ویژگی‌ها (Attributes)
    // =============================================
    attributes: [{
      name: { type: String, required: true },
      value: { type: String, required: true },
      visible: { type: Boolean, default: true },
      variation: { type: Boolean, default: false },
    }],

    // =============================================
    // حمل و نقل
    // =============================================
    shipping: {
      weight: { type: Number, default: 0 },
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      free: { type: Boolean, default: false },
      cost: { type: Number, default: 0 },
      international: { type: Boolean, default: false },
    },

    // =============================================
    // SEO
    // =============================================
    seo: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      keywords: [String],
    },

    // =============================================
    // وضعیت
    // =============================================
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },

    // =============================================
    // آمار
    // =============================================
    ratings: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, min: 1, max: 5, required: true },
      comment: { type: String, default: '' },
      createdAt: { type: Date, default: Date.now },
    }],
    averageRating: {
      type: Number,
      default: 0,
    },
    totalSales: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },

    // =============================================
    // تاریخ‌ها
    // =============================================
    publishedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ sku: 1 }, { unique: true, sparse: true });
ProductSchema.index({ status: 1, publishedAt: -1 });
ProductSchema.index({ categories: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ isBestSeller: 1 });
ProductSchema.index({ totalSales: -1 });
ProductSchema.index({ averageRating: -1 });

// ایندکس Full-Text
ProductSchema.index(
  {
    name: 'text',
    description: 'text',
    shortDescription: 'text',
    'attributes.value': 'text',
    'seo.keywords': 'text',
  },
  {
    weights: {
      name: 10,
      description: 5,
      shortDescription: 3,
      'attributes.value': 2,
      'seo.keywords': 1,
    },
    name: 'product_fulltext_index',
    default_language: 'none',
  }
);

// =============================================
// ✅ ویرچوال‌ها
// =============================================
ProductSchema.virtual('isInStock').get(function() {
  return this.stock > 0;
});

ProductSchema.virtual('isOnSale').get(function() {
  return this.salePrice !== null && this.salePrice < this.price;
});

ProductSchema.virtual('displayPrice').get(function() {
  return this.isOnSale ? this.salePrice : this.price;
});

ProductSchema.virtual('discountPercent').get(function() {
  if (!this.isOnSale) return 0;
  return Math.round(((this.price - this.salePrice) / this.price) * 100);
});

ProductSchema.virtual('ratingCount').get(function() {
  return this.ratings.length;
});

// =============================================
// ✅ متدهای نمونه
// =============================================

// افزایش فروش
ProductSchema.methods.incrementSales = async function(quantity = 1) {
  this.totalSales += quantity;
  await this.save();
  return this;
};

// کاهش موجودی
ProductSchema.methods.decrementStock = async function(quantity = 1) {
  if (this.stock < quantity) {
    throw new Error('موجودی کافی نیست');
  }
  this.stock -= quantity;
  if (this.stock === 0) {
    this.stockStatus = 'out_of_stock';
  }
  await this.save();
  return this;
};

// افزایش موجودی
ProductSchema.methods.incrementStock = async function(quantity = 1) {
  this.stock += quantity;
  if (this.stock > 0 && this.stockStatus === 'out_of_stock') {
    this.stockStatus = 'in_stock';
  }
  await this.save();
  return this;
};

// افزایش بازدید
ProductSchema.methods.incrementView = async function() {
  this.viewCount += 1;
  await this.save();
  return this;
};

// اضافه کردن امتیاز
ProductSchema.methods.addRating = async function(userId, rating, comment = '') {
  // بررسی تکراری نبودن
  const existing = this.ratings.find(r => r.user.toString() === userId.toString());
  if (existing) {
    existing.rating = rating;
    existing.comment = comment;
    existing.createdAt = new Date();
  } else {
    this.ratings.push({ user: userId, rating, comment });
  }

  // محاسبه میانگین
  const total = this.ratings.reduce((sum, r) => sum + r.rating, 0);
  this.averageRating = total / this.ratings.length;
  await this.save();
  return this;
};

// انتشار
ProductSchema.methods.publish = async function(userId) {
  this.status = 'published';
  this.publishedAt = new Date();
  this.updatedBy = userId;
  await this.save();
  return this;
};

// بایگانی
ProductSchema.methods.archive = async function() {
  this.status = 'archived';
  await this.save();
  return this;
};

// =============================================
// ✅ متدهای استاتیک
// =============================================

// دریافت محصولات منتشرشده
ProductSchema.statics.getPublished = function(options = {}) {
  const {
    category,
    tag,
    search,
    featured,
    bestSeller,
    minPrice,
    maxPrice,
    sort = 'newest',
    page = 1,
    limit = 20,
  } = options;

  const skip = (page - 1) * limit;
  const filter = { status: 'published' };

  if (category) filter.categories = category;
  if (tag) filter.tags = tag;
  if (featured) filter.isFeatured = true;
  if (bestSeller) filter.isBestSeller = true;
  if (minPrice !== undefined) filter.price = { $gte: minPrice };
  if (maxPrice !== undefined) {
    filter.price = { ...filter.price, $lte: maxPrice };
  }
  if (search) {
    filter.$text = { $search: search };
  }

  let sortOption = { publishedAt: -1 };
  switch (sort) {
    case 'newest':
      sortOption = { publishedAt: -1 };
      break;
    case 'price_low':
      sortOption = { displayPrice: 1 };
      break;
    case 'price_high':
      sortOption = { displayPrice: -1 };
      break;
    case 'popular':
      sortOption = { totalSales: -1 };
      break;
    case 'rating':
      sortOption = { averageRating: -1 };
      break;
  }

  let query = this.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .populate('categories', 'name slug')
    .populate('tags', 'name slug');

  if (search) {
    query = query.sort({ score: { $meta: 'textScore' } });
  }

  return Promise.all([
    query.lean(),
    this.countDocuments(filter),
  ]).then(([data, total]) => ({
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }));
};

// دریافت محصول با اسلاگ
ProductSchema.statics.getBySlug = function(slug) {
  return this.findOne({ slug, status: 'published' })
    .populate('categories', 'name slug')
    .populate('tags', 'name slug')
    .lean();
};

// دریافت محصولات مرتبط
ProductSchema.statics.getRelated = function(productId, categoryId, limit = 4) {
  return this.find({
    _id: { $ne: productId },
    categories: categoryId,
    status: 'published',
  })
    .sort({ totalSales: -1 })
    .limit(limit)
    .lean();
};

// دریافت محصولات ویژه
ProductSchema.statics.getFeatured = function(limit = 6) {
  return this.find({ status: 'published', isFeatured: true })
    .sort({ totalSales: -1 })
    .limit(limit)
    .lean();
};

// دریافت محصولات پرفروش
ProductSchema.statics.getBestSellers = function(limit = 6) {
  return this.find({ status: 'published' })
    .sort({ totalSales: -1 })
    .limit(limit)
    .lean();
};

module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema);
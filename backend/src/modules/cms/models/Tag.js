// backend/src/modules/cms/models/Tag.js
const mongoose = require('mongoose');

const TagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'نام برچسب الزامی است'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'اسلاگ برچسب الزامی است'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '#1677ff',
    },
    icon: {
      type: String,
      default: '🏷️',
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// ایندکس‌ها
TagSchema.index({ slug: 1 });
TagSchema.index({ name: 'text' });
TagSchema.index({ usageCount: -1 });

// متدهای نمونه
TagSchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  await this.save();
  return this;
};

TagSchema.methods.decrementUsage = async function() {
  this.usageCount = Math.max(0, this.usageCount - 1);
  await this.save();
  return this;
};

// متدهای استاتیک
TagSchema.statics.getPopular = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ usageCount: -1 })
    .limit(limit)
    .lean();
};

TagSchema.statics.search = function(query) {
  return this.find({
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { slug: { $regex: query, $options: 'i' } },
    ],
  }).limit(20);
};

module.exports = mongoose.models.Tag || mongoose.model('Tag', TagSchema);
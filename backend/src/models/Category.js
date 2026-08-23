const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'نام دسته‌بندی الزامی است'],
      trim: true,
    },
    module: {
      type: String,
      enum: ['hardware', 'document', 'credential'],
      required: [true, 'ماژول مربوطه الزامی است'],
    },
    description: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '📁',
    },
    color: {
      type: String,
      default: '#64748b',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// هر دسته‌بندی باید برای یک ماژول یکتا باشد
CategorySchema.index({ name: 1, module: 1 }, { unique: true });

module.exports = mongoose.models.Category || mongoose.model('Category', CategorySchema);
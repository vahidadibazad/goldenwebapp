// backend/src/models/Hardware.js
const mongoose = require('mongoose');
const EnumValue = require('./EnumValue');

const hardwareSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'نام دستگاه الزامی است'],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'دسته‌بندی الزامی است'],
    },
    serialNumber: {
      type: String,
      required: [true, 'شماره سریال الزامی است'],
      unique: true,
      trim: true,
    },
    purchaseDate: {
      type: String,
      required: [true, 'تاریخ خرید الزامی است'],
    },
    warrantyExpire: {
      type: String,
      required: [true, 'تاریخ انقضای گارانتی الزامی است'],
    },
    price: {
      type: Number,
      required: [true, 'قیمت الزامی است'],
      min: [0, 'قیمت نمی‌تواند منفی باشد'],
    },
    
    // =============================================
    // ✅ تغییر: status از EnumValue استفاده می‌کند
    // =============================================
    status: {
      type: String,
      ref: 'EnumValue',
      default: null,
    },
    
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// =============================================
// ✅ متدهای کمکی
// =============================================
hardwareSchema.methods.getStatusLabel = async function() {
  if (!this.status) return null;
  const enumValue = await EnumValue.findOne({ 
    group: 'hardware_status', 
    key: this.status 
  });
  return enumValue ? enumValue.label : this.status;
};

hardwareSchema.statics.getStatusOptions = async function() {
  const enumValues = await EnumValue.find({ 
    group: 'hardware_status', 
    isActive: true 
  }).sort({ order: 1 });
  return enumValues.map(ev => ({
    value: ev.key,
    label: ev.label,
    color: ev.color,
    icon: ev.icon,
  }));
};

// =============================================
// ایندکس‌ها
// =============================================
hardwareSchema.index(
  { name: 'text', serialNumber: 'text', description: 'text' },
  {
    weights: {
      name: 10,
      serialNumber: 5,
      description: 2,
    },
    name: 'hardware_text_index',
  }
);

module.exports = mongoose.models.Hardware || mongoose.model('Hardware', hardwareSchema);
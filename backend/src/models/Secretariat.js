const mongoose = require('mongoose');

const SecretariatSchema = new mongoose.Schema({
  // =============================================
  // اطلاعات پایه
  // =============================================
  name: {
    type: String,
    required: [true, 'نام دبیرخانه الزامی است'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'کد دبیرخانه الزامی است'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  
  // =============================================
  // نوع دبیرخانه
  // =============================================
  type: {
    type: String,
    enum: ['main', 'sub', 'temporary'],
    default: 'main',
  },
  
  // =============================================
  // دبیرخانه والد (برای دبیرخانه‌های فرعی)
  // =============================================
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Secretariat',
    default: null,
  },
  
  // =============================================
  // مسئول دبیرخانه
  // =============================================
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // =============================================
  // کارمندان دبیرخانه
  // =============================================
  staff: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  
  // =============================================
  // واحدهای تحت پوشش
  // =============================================
  departments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  }],
  
  // =============================================
  // تنظیمات
  // =============================================
  settings: {
    autoNumbering: { type: Boolean, default: true },
    requireSignature: { type: Boolean, default: true },
    maxReferralLevel: { type: Number, default: 5 },
    defaultPriority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  },
  
  // =============================================
  // فعال/غیرفعال
  // =============================================
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // =============================================
  // آمار
  // =============================================
  stats: {
    totalLetters: { type: Number, default: 0 },
    pendingLetters: { type: Number, default: 0 },
    todayLetters: { type: Number, default: 0 },
  },
  
}, { timestamps: true });

// =============================================
// ✅ ایندکس‌ها
// =============================================
SecretariatSchema.index({ code: 1 });
SecretariatSchema.index({ type: 1, parent: 1 });
SecretariatSchema.index({ manager: 1 });

// =============================================
// ✅ متدها
// =============================================
SecretariatSchema.methods.getFullHierarchy = async function() {
  const children = await mongoose.model('Secretariat').find({ parent: this._id });
  return {
    ...this.toObject(),
    children,
  };
};

SecretariatSchema.statics.getMainSecretariats = function() {
  return this.find({ type: 'main', isActive: true }).sort({ name: 1 });
};

SecretariatSchema.statics.getByDepartment = function(departmentId) {
  return this.find({ departments: departmentId, isActive: true }).sort({ name: 1 });
};

module.exports = mongoose.models.Secretariat || mongoose.model('Secretariat', SecretariatSchema);
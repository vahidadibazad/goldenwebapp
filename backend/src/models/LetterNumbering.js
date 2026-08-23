const mongoose = require('mongoose');

const LetterNumberingSchema = new mongoose.Schema({
  // =============================================
  // اطلاعات پایه
  // =============================================
  name: {
    type: String,
    required: [true, 'نام الگو الزامی است'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'کد الگو الزامی است'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  
  // =============================================
  // نوع نامه
  // =============================================
  letterType: {
    type: String,
    enum: ['incoming', 'outgoing', 'internal'],
    required: true,
  },
  
  // =============================================
  // فرمت شماره‌گذاری
  // =============================================
  format: {
    type: String,
    required: true,
    default: '{type}-{year}-{month}-{seq}',
    description: 'متغیرها: {type}, {year}, {month}, {day}, {seq}, {department}, {secretariat}',
  },
  
  // =============================================
  // جداکننده
  // =============================================
  separator: {
    type: String,
    default: '-',
  },
  
  // =============================================
  // طول شماره سریال
  // =============================================
  seqLength: {
    type: Number,
    default: 4,
    min: 1,
    max: 10,
  },
  
  // =============================================
  // فعال/غیرفعال
  // =============================================
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // =============================================
  // دبیرخانه مرتبط
  // =============================================
  secretariat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Secretariat',
    default: null,
  },
  
  // =============================================
  // اطلاعات ایجادکننده
  // =============================================
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
}, { timestamps: true });

// =============================================
// ✅ ایندکس‌ها
// =============================================
LetterNumberingSchema.index({ letterType: 1, isActive: 1 });
LetterNumberingSchema.index({ secretariat: 1 });

// =============================================
// ✅ متد تولید شماره
// =============================================
LetterNumberingSchema.methods.generateNumber = async function(departmentCode = '', secretariatCode = '') {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // پیدا کردن آخرین شماره
  const Letter = mongoose.model('Letter');
  const lastLetter = await Letter.findOne({
    letterType: this.letterType,
    numberingCode: this.code,
  }).sort({ seq: -1 });
  
  let seq = 1;
  if (lastLetter && lastLetter.seq) {
    seq = lastLetter.seq + 1;
  }
  
  const seqStr = String(seq).padStart(this.seqLength, '0');
  
  // جایگزینی متغیرها
  const typeMap = {
    incoming: 'و',
    outgoing: 'ص',
    internal: 'د',
  };
  
  let number = this.format
    .replace(/{type}/g, typeMap[this.letterType] || this.letterType)
    .replace(/{year}/g, year)
    .replace(/{month}/g, month)
    .replace(/{day}/g, day)
    .replace(/{seq}/g, seqStr)
    .replace(/{department}/g, departmentCode)
    .replace(/{secretariat}/g, secretariatCode);
  
  return { number, seq };
};

module.exports = mongoose.models.LetterNumbering || mongoose.model('LetterNumbering', LetterNumberingSchema);
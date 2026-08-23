const LetterNumbering = require('../models/LetterNumbering');
const Letter = require('../models/Letter');

class LetterNumberingService {

  // =============================================
  // ۱. تولید شماره جدید
  // =============================================
  static async generateNumber(letterType, secretariatId, departmentCode = '') {
    const numbering = await LetterNumbering.findOne({
      letterType,
      secretariat: secretariatId,
      isActive: true,
    });

    if (!numbering) {
      throw new Error('الگوی شماره‌گذاری برای این دبیرخانه یافت نشد');
    }

    const Secretariat = require('../models/Secretariat');
    const secretariat = await Secretariat.findById(secretariatId);
    if (!secretariat) {
      throw new Error('دبیرخانه یافت نشد');
    }

    const result = await numbering.generateNumber(departmentCode, secretariat.code);
    
    return {
      number: result.number,
      seq: result.seq,
      numberingCode: numbering.code,
    };
  }

  // =============================================
  // ۲. ایجاد الگوی شماره‌گذاری جدید
  // =============================================
  static async createNumbering(data, userId) {
    const numbering = new LetterNumbering({
      ...data,
      createdBy: userId,
    });
    await numbering.save();
    return numbering;
  }

  // =============================================
  // ۳. دریافت الگوهای شماره‌گذاری
  // =============================================
  static async getNumberings(secretariatId = null) {
    const filter = { isActive: true };
    if (secretariatId) filter.secretariat = secretariatId;
    
    return LetterNumbering.find(filter)
      .populate('secretariat', 'name code')
      .sort({ letterType: 1, name: 1 });
  }
}

module.exports = LetterNumberingService;
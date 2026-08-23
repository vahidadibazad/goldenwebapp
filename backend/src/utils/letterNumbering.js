// backend/src/utils/letterNumbering.js
const Document = require('../models/Document');

const toPersianNumber = (num) => {
  const map = {
    '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
    '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
  };
  return String(num).replace(/[0-9]/g, d => map[d]);
};

const typeMap = {
  incoming: 'و',
  outgoing: 'خ',
  internal: 'د',
  urgent: 'ف',
  confidential: 'م'
};

const generatePersianLetterNumber = async (type, departmentCode = 'عمومی') => {
  const now = new Date();
  const year = toPersianNumber(now.getFullYear());
  const month = toPersianNumber(String(now.getMonth() + 1).padStart(2, '0'));
  
  // پیدا کردن آخرین شماره برای این نوع در ماه جاری
  const prefix = `${typeMap[type] || 'ع'}-${year}-${month}`;
  const lastLetter = await Document.findOne({
    documentType: 'letter',
    letterNumber: { $regex: `^${prefix}` }
  }).sort({ letterNumber: -1 });

  let sequence = 1;
  if (lastLetter) {
    const parts = lastLetter.letterNumber.split('-');
    if (parts.length >= 4) {
      const lastSeq = parseInt(parts[3].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
      if (!isNaN(lastSeq)) sequence = lastSeq + 1;
    }
  }

  const seqNum = toPersianNumber(String(sequence).padStart(4, '0'));
  return `${prefix}-${seqNum}-${departmentCode}`;
};

module.exports = { generatePersianLetterNumber };
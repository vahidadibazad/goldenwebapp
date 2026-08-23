const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { toPersianNumber } = require('./numberHelper');

const generatePDF = async (data, options) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'portrait',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const filePath = path.join(__dirname, '../../reports', `${Date.now()}.pdf`);
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // عنوان
      doc.fontSize(20).text(options.title, { align: 'center' });
      doc.moveDown();

      // تاریخ
      doc.fontSize(12).text(`تاریخ: ${toPersianDate(new Date())}`, { align: 'left' });
      doc.moveDown();

      // جدول
      const tableData = data.map((row) => 
        options.columns.map((col) => col.accessor(row))
      );

      // ... رسم جدول با pdfkit

      doc.end();

      writeStream.on('finish', () => {
        resolve(filePath);
      });

      writeStream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generatePDF };
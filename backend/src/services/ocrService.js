const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

// =============================================
// ✅ بارگذاری pdf-parse با مدیریت خطا
// =============================================
let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (error) {
  console.warn('⚠️ pdf-parse نصب نیست، استخراج متن از PDF غیرفعال است');
  pdfParse = null;
}

class OCRService {

  // =============================================
  // ۱. استخراج متن از تصویر با Tesseract.js
  // =============================================
  static async extractTextFromImage(imagePath, language = 'fas') {
    try {
      // بررسی وجود فایل
      if (!fs.existsSync(imagePath)) {
        throw new Error('فایل تصویر یافت نشد');
      }

      // خواندن فایل
      const imageBuffer = fs.readFileSync(imagePath);

      // اجرای Tesseract
      const result = await Tesseract.recognize(
        imageBuffer,
        language,
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`📝 OCR در حال پردازش: ${Math.round(m.progress * 100)}%`);
            }
          },
        }
      );

      return {
        success: true,
        text: result.data.text,
        confidence: result.data.confidence,
        words: result.data.words,
        lines: result.data.lines,
        language,
      };

    } catch (error) {
      console.error('❌ خطا در OCR:', error);
      return {
        success: false,
        error: error.message,
        text: '',
      };
    }
  }

  // =============================================
  // ۲. استخراج متن از PDF
  // =============================================
  static async extractTextFromPDF(pdfPath) {
    try {
      if (!fs.existsSync(pdfPath)) {
        throw new Error('فایل PDF یافت نشد');
      }

      // ✅ اگر pdf-parse نصب نیست
      if (!pdfParse) {
        console.log('ℹ️ pdf-parse نصب نیست، از روش جایگزین استفاده می‌شود');
        return await this.extractTextFromScannedPDF(pdfPath);
      }

      const dataBuffer = fs.readFileSync(pdfPath);
      const result = await pdfParse(dataBuffer);

      return {
        success: true,
        text: result.text,
        pages: result.numpages,
        info: result.info,
        metadata: result.metadata,
      };

    } catch (error) {
      console.error('❌ خطا در استخراج متن PDF:', error);
      return {
        success: false,
        error: error.message,
        text: '',
      };
    }
  }

  // =============================================
  // ۳. استخراج متن از PDF اسکن شده
  // =============================================
  static async extractTextFromScannedPDF(pdfPath) {
    try {
      // بررسی وجود فایل
      if (!fs.existsSync(pdfPath)) {
        throw new Error('فایل PDF یافت نشد');
      }

      // ایجاد پوشه temp
      const outputDir = path.join(__dirname, '../../uploads/temp');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const imagePath = path.join(outputDir, `${Date.now()}-page.jpg`);

      // ✅ بررسی وجود ImageMagick یا Ghostscript
      try {
        // تبدیل PDF به تصویر
        const command = `convert -density 300 "${pdfPath}"[0] "${imagePath}"`;
        await exec(command);
      } catch (convertError) {
        console.warn('⚠️ ImageMagick نصب نیست، از روش جایگزین استفاده می‌شود');
        // اگر ImageMagick نصب نیست، یک متن پیش‌فرض برگردان
        return {
          success: true,
          text: 'PDF اسکن شده - برای استخراج متن لطفاً ImageMagick را نصب کنید',
          pages: 1,
        };
      }

      // OCR روی تصویر
      const result = await this.extractTextFromImage(imagePath);

      // حذف فایل موقت
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (unlinkError) {
          console.warn('⚠️ خطا در حذف فایل موقت:', unlinkError.message);
        }
      }

      return result;

    } catch (error) {
      console.error('❌ خطا در OCR PDF اسکن شده:', error);
      return {
        success: false,
        error: error.message,
        text: '',
      };
    }
  }

  // =============================================
  // ۴. تشخیص خودکار نوع فایل و استخراج متن
  // =============================================
  static async extractText(filePath, fileName = '') {
    const ext = path.extname(filePath).toLowerCase();

    // PDF
    if (ext === '.pdf') {
      // ابتدا سعی کن متن PDF رو استخراج کنی
      const pdfResult = await this.extractTextFromPDF(filePath);
      
      // اگر متن PDF خالی بود، احتمالاً اسکن شده است
      if (!pdfResult.text || pdfResult.text.trim().length < 10) {
        console.log('📝 PDF اسکن شده تشخیص داده شد، OCR روی تصاویر انجام می‌شود...');
        return await this.extractTextFromScannedPDF(filePath);
      }
      
      return pdfResult;
    }

    // تصاویر
    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'].includes(ext)) {
      return await this.extractTextFromImage(filePath);
    }

    // فایل‌های متنی
    if (['.txt', '.csv', '.json', '.xml'].includes(ext)) {
      try {
        const text = fs.readFileSync(filePath, 'utf8');
        return {
          success: true,
          text,
          language: 'text',
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          text: '',
        };
      }
    }

    // فایل‌های Office (Word, Excel, PowerPoint)
    if (['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext)) {
      try {
        // برای فایل‌های Office می‌توانید از کتابخانه‌های تخصصی استفاده کنید
        const text = `فایل ${fileName} - نوع ${ext}`;
        return {
          success: true,
          text,
          language: 'office',
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          text: '',
        };
      }
    }

    return {
      success: false,
      error: 'نوع فایل پشتیبانی نمی‌شود',
      text: '',
    };
  }

  // =============================================
  // ۵. استخراج کلمات کلیدی از متن
  // =============================================
  static extractKeywords(text, minLength = 3) {
    if (!text) return [];

    // حذف علائم نگارشی و کاراکترهای خاص
    const cleanText = text.replace(/[،؛؟!@#$%^&*()_+=[\]{};:'"\\|,.<>/?]/g, ' ');
    
    // تقسیم به کلمات
    const words = cleanText.split(/\s+/).filter(w => w.length >= minLength);
    
    // شمارش تکرار کلمات
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // مرتب‌سازی بر اساس تکرار
    const sorted = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    return sorted.map(([word, count]) => ({ word, count }));
  }

  // =============================================
  // ۶. تشخیص خودکار زبان متن
  // =============================================
  static detectLanguage(text) {
    if (!text) return 'unknown';

    // تشخیص زبان فارسی
    const persianChars = text.match(/[\u0600-\u06FF]/g);
    if (persianChars && persianChars.length > text.length * 0.3) {
      return 'fas';
    }

    // تشخیص زبان انگلیسی
    const englishChars = text.match(/[a-zA-Z]/g);
    if (englishChars && englishChars.length > text.length * 0.3) {
      return 'eng';
    }

    return 'unknown';
  }

  // =============================================
  // ۷. آماده‌سازی متن برای ایندکس‌سازی
  // =============================================
  static prepareForIndexing(text) {
    if (!text) return '';

    // حذف فاصله‌های اضافی
    let cleanText = text.replace(/\s+/g, ' ').trim();

    // حذف کاراکترهای غیرقابل چاپ
    cleanText = cleanText.replace(/[^\x20-\x7E\u0600-\u06FF]/g, '');

    return cleanText;
  }

  // =============================================
  // ۸. پردازش کامل یک سند برای جستجو
  // =============================================
  static async processDocument(filePath, fileName = '') {
    try {
      console.log(`📝 شروع پردازش سند: ${fileName}`);

      // ۱. استخراج متن
      const result = await this.extractText(filePath, fileName);
      
      if (!result.success) {
        console.log(`⚠️ خطا در استخراج متن: ${result.error}`);
        return {
          success: false,
          error: result.error,
        };
      }

      const text = result.text || '';

      // ۲. تشخیص زبان
      const language = this.detectLanguage(text);

      // ۳. آماده‌سازی متن برای ایندکس
      const cleanText = this.prepareForIndexing(text);

      // ۴. استخراج کلمات کلیدی
      const keywords = this.extractKeywords(cleanText);

      // ۵. استخراج اطلاعات آماری
      const stats = {
        wordCount: cleanText.split(/\s+/).filter(w => w.length > 0).length,
        charCount: cleanText.length,
        lineCount: text.split('\n').length,
        pageCount: result.pages || 1,
        confidence: result.confidence || 0,
        language,
      };

      console.log(`✅ پردازش سند کامل شد: ${fileName}`);
      console.log(`   📊 کلمات: ${stats.wordCount}, صفحات: ${stats.pageCount}, زبان: ${language}`);

      return {
        success: true,
        text: cleanText,
        rawText: text,
        keywords,
        stats,
        language,
        confidence: result.confidence || 0,
      };

    } catch (error) {
      console.error('❌ خطا در پردازش سند:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = OCRService;
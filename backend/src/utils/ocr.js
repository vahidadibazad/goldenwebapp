const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');

// =============================================
// پیکربندی OCR
// =============================================
const OCR_CONFIG = {
  // Tesseract.js برای OCR ساده
  tesseract: {
    enabled: true,
    language: 'fas',
  },
  // API سرویس‌های ابری (اختیاری)
  cloud: {
    enabled: false,
    provider: 'google', // google, azure, aws
    apiKey: process.env.OCR_API_KEY || '',
  },
};

// =============================================
// OCR با Tesseract.js
// =============================================
const ocrWithTesseract = async (imagePath) => {
  return new Promise((resolve, reject) => {
    const tesseract = spawn('tesseract', [imagePath, 'stdout', '-l', 'fas']);
    
    let output = '';
    let error = '';
    
    tesseract.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    tesseract.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    tesseract.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Tesseract error: ${error}`));
      }
    });
  });
};

// =============================================
// استخراج متن از تصویر
// =============================================
const extractTextFromImage = async (imagePath) => {
  try {
    // بررسی وجود فایل
    if (!fs.existsSync(imagePath)) {
      throw new Error('فایل تصویر یافت نشد');
    }
    
    let text = '';
    
    if (OCR_CONFIG.tesseract.enabled) {
      text = await ocrWithTesseract(imagePath);
    }
    
    // اگر Tesseract کار نکرد، از API ابری استفاده کن
    if (!text && OCR_CONFIG.cloud.enabled) {
      text = await ocrWithCloudAPI(imagePath);
    }
    
    return {
      success: true,
      text,
      confidence: text.length > 0 ? 0.8 : 0,
    };
  } catch (error) {
    console.error('❌ خطا در OCR:', error);
    return {
      success: false,
      error: error.message,
      text: '',
    };
  }
};

// =============================================
// OCR با API ابری
// =============================================
const ocrWithCloudAPI = async (imagePath) => {
  // پیاده‌سازی برای سرویس‌های مختلف
  // اینجا فقط نمونه برای Google Cloud Vision
  try {
    const imageData = fs.readFileSync(imagePath).toString('base64');
    
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${OCR_CONFIG.cloud.apiKey}`,
      {
        requests: [{
          image: { content: imageData },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          imageContext: { languageHints: ['fa'] },
        }],
      }
    );
    
    const text = response.data.responses?.[0]?.fullTextAnnotation?.text || '';
    return text;
  } catch (error) {
    console.error('❌ خطا در Cloud OCR:', error);
    return '';
  }
};

// =============================================
// پردازش سند PDF
// =============================================
const extractTextFromPDF = async (pdfPath) => {
  try {
    // استفاده از pdftotext (نیاز به نصب poppler-utils)
    return new Promise((resolve, reject) => {
      const pdftotext = spawn('pdftotext', [pdfPath, '-']);
      
      let output = '';
      let error = '';
      
      pdftotext.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      pdftotext.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      pdftotext.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new Error(`PDF text error: ${error}`));
        }
      });
    });
  } catch (error) {
    console.error('❌ خطا در استخراج متن PDF:', error);
    return '';
  }
};

// =============================================
// استخراج کلمات کلیدی از متن
// =============================================
const extractKeywords = (text) => {
  if (!text) return [];
  
  // حذف علائم نگارشی
  const cleanText = text.replace(/[،؛؟!.,;:]/g, ' ');
  
  // تقسیم به کلمات
  const words = cleanText.split(/\s+/).filter(w => w.length > 2);
  
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
};

// =============================================
// تشخیص خودکار موضوع از متن
// =============================================
const detectSubject = (text) => {
  if (!text) return 'سایر';
  
  // کلمات کلیدی برای تشخیص موضوع
  const keywords = {
    مالی: ['فاکتور', 'قرارداد', 'پرداخت', 'حساب', 'دریافت', 'تراکنش', 'بودجه', 'هزینه'],
    حقوقی: ['قانون', 'شکایت', 'دادگاه', 'خسارت', 'ماده', 'قرارداد', 'امضا'],
    پرسنلی: ['کارمند', 'حقوق', 'مرخصی', 'ارزیابی', 'استخدام', 'پرسنل', 'بیمه'],
    فنی: ['سرور', 'شبکه', 'راه‌اندازی', 'آی‌پی', 'دستگاه', 'سخت‌افزار', 'نرم‌افزار'],
    مدیریتی: ['جلسه', 'گزارش', 'بخشنامه', 'اطلاعیه', 'دستورالعمل', 'صورت‌جلسه'],
  };
  
  let bestCategory = 'سایر';
  let maxScore = 0;
  
  for (const [category, words] of Object.entries(keywords)) {
    let score = 0;
    words.forEach(word => {
      if (text.includes(word)) score++;
    });
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }
  
  return bestCategory;
};

module.exports = {
  extractTextFromImage,
  extractTextFromPDF,
  extractKeywords,
  detectSubject,
};
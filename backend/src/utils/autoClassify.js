// =============================================
// دسته‌بندی خودکار اسناد بر اساس کلمات کلیدی
// =============================================
const keywords = {
  مالی: ['فاکتور', 'قرارداد', 'پرداخت', 'حساب', 'دریافت', 'تراکنش', 'صورتحساب', 'هزینه', 'درآمد', 'بودجه'],
  فنی: ['سرور', 'شبکه', 'راه‌اندازی', 'آی‌پی', 'دستگاه', 'سخت‌افزار', 'نرم‌افزار', 'کابل', 'سوئیچ', 'روتر'],
  پرسنلی: ['کارمند', 'حقوق', 'مرخصی', 'ارزیابی', 'استخدام', 'پرسنل', 'کارگزینی', 'بیمه', 'مزایا'],
  حقوقی: ['قانون', 'شکایت', 'دادگاه', 'بیمه', 'خسارت', 'ماده', 'قرارداد', 'امضا', 'تنظیم‌نامه'],
  عمومی: ['بخشنامه', 'اطلاعیه', 'جلسه', 'گزارش', 'صورت‌جلسه', 'دستورالعمل', 'آموزش'],
};

const autoClassify = (text) => {
  if (!text || typeof text !== 'string') return { category: 'سایر', score: 0 };

  const lowerText = text.toLowerCase();
  let bestCategory = 'سایر';
  let maxScore = 0;
  let matchedWords = [];

  for (const [category, words] of Object.entries(keywords)) {
    let score = 0;
    const found = [];
    words.forEach(word => {
      if (lowerText.includes(word)) {
        score += 1;
        found.push(word);
      }
    });
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
      matchedWords = found;
    }
  }

  return {
    category: bestCategory,
    score: maxScore,
    matchedWords,
    confidence: maxScore > 3 ? 'high' : maxScore > 1 ? 'medium' : 'low',
  };
};

module.exports = autoClassify;
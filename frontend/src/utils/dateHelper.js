import moment from 'moment-jalaali';

// تبدیل تاریخ میلادی یا رشته به شمسی
export const toPersianDate = (date) => {
  if (!date) return '-';
  
  // اگر تاریخ از قبل به صورت رشته شمسی است (مثل 1403/05/01)
  if (typeof date === 'string' && /^\d{4}\/\d{2}\/\d{2}$/.test(date)) {
    return date;
  }
  
  try {
    // اگر تاریخ میلادی است
    const persianDate = moment(date);
    if (persianDate.isValid()) {
      return persianDate.format('jYYYY/jMM/jDD');
    }
    return date;
  } catch (error) {
    console.error('خطا در تبدیل تاریخ:', error);
    return date;
  }
};

// تبدیل تاریخ شمسی به میلادی (برای ارسال به بک‌اند)
export const toGregorianDate = (persianDate) => {
  if (!persianDate) return null;
  try {
    return moment(persianDate, 'jYYYY/jMM/jDD').toDate();
  } catch (error) {
    console.error('خطا در تبدیل تاریخ به میلادی:', error);
    return null;
  }
};
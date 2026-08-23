// تبدیل اعداد انگلیسی به فارسی
export const toPersianNumber = (num) => {
  if (!num && num !== 0) return '-';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

// تبدیل قیمت به فارسی با جداکننده
export const toPersianPrice = (price) => {
  if (!price && price !== 0) return '-';
  return toPersianNumber(price.toLocaleString());
};
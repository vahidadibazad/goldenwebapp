// =============================================
// موتور جستجوی هوشمند با امتیازدهی
// =============================================
const searchEngine = (query, data) => {
  if (!query || !data || data.length === 0) return [];

  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);

  const results = data.map(item => {
    let score = 0;
    
    // تبدیل تمام فیلدهای قابل جستجو به متن
    const searchableText = [
      item.name,
      item.title,
      item.description,
      item.systemName,
      item.serialNumber,
      item.username,
      item.tags?.join(' ') || '',
      item.category,
      item.fullName,
      item.email,
    ].filter(Boolean).join(' ').toLowerCase();

    // محاسبه امتیاز برای هر کلمه
    searchTerms.forEach(term => {
      if (searchableText.includes(term)) {
        score += 10;
        
        // امتیاز بیشتر برای تطابق کامل
        if (item.name?.toLowerCase().includes(term)) score += 20;
        if (item.title?.toLowerCase().includes(term)) score += 20;
        if (item.serialNumber?.toLowerCase().includes(term)) score += 15;
        if (item.tags?.some(t => t.toLowerCase().includes(term))) score += 15;
        if (item.systemName?.toLowerCase().includes(term)) score += 15;
      }
    });

    return { ...item, score, _type: getItemType(item) };
  });

  return results
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);
};

// تشخیص نوع آیتم
const getItemType = (item) => {
  if (item.serialNumber !== undefined) return 'hardware';
  if (item.systemName !== undefined) return 'credential';
  if (item.filePath !== undefined) return 'document';
  if (item.title && item.description) return 'document';
  if (item.username && item.password) return 'credential';
  return 'unknown';
};

module.exports = searchEngine;
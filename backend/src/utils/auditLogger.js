const AuditLog = require('../models/AuditLog');

const logAudit = async (req, action, module, details = {}) => {
  try {
    // اگر کاربر لاگین نکرده، از لاگ صرف‌نظر کن
    if (!req.user) return;

    await AuditLog.create({
      user: req.user.id,
      username: req.user.username,
      action,
      module,
      details,
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || '',
    });
  } catch (error) {
    console.error('❌ خطا در ثبت لاگ:', error.message);
  }
};

module.exports = logAudit;
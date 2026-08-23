const AuditLog = require('../models/AuditLog');
const UAParser = require('ua-parser-js');

const logAdvanced = async (req, action, module, details = {}, changes = {}) => {
  try {
    const parser = new UAParser(req.headers['user-agent']);
    const browser = parser.getBrowser().name || 'unknown';
    const os = parser.getOS().name || 'unknown';

    await AuditLog.create({
      user: req.user.id,
      username: req.user.username,
      action,
      module,
      details,
      changes,
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: `${browser} / ${os}`,
    });
  } catch (error) {
    console.error('❌ خطا در ثبت لاگ:', error);
  }
};

module.exports = logAdvanced;
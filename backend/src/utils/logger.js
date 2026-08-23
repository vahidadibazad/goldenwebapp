// backend/src/utils/logger.js
const fs = require('fs');
const path = require('path');

// =============================================
// ✅ ایجاد پوشه لاگ در صورت عدم وجود
// =============================================
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// =============================================
// ✅ رنگ‌های ANSI برای ترمینال
// =============================================
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

// =============================================
// ✅ سطوح لاگ
// =============================================
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
};

const LOG_LEVEL_NAMES = {
  0: 'ERROR',
  1: 'WARN',
  2: 'INFO',
  3: 'DEBUG',
  4: 'TRACE',
};

const LOG_COLORS = {
  0: colors.red,
  1: colors.yellow,
  2: colors.blue,
  3: colors.cyan,
  4: colors.gray,
};

// =============================================
// ✅ سطح لاگ فعلی (از محیط یا پیش‌فرض)
// =============================================
const currentLevel = process.env.LOG_LEVEL ? 
  LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] : 
  LOG_LEVELS.INFO;

// =============================================
// ✅ کلاس Logger پیشرفته
// =============================================
class Logger {
  constructor() {
    this.logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
    this.errorFile = path.join(logDir, `error-${new Date().toISOString().split('T')[0]}.log`);
    this.performanceFile = path.join(logDir, `performance-${new Date().toISOString().split('T')[0]}.log`);
    
    // ایجاد فایل‌های لاگ در صورت عدم وجود
    [this.logFile, this.errorFile, this.performanceFile].forEach(file => {
      if (!fs.existsSync(file)) {
        fs.writeFileSync(file, '');
      }
    });
  }

  // =============================================
  // ✅ فرمت زمان
  // =============================================
  _getTimestamp() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
  }

  // =============================================
  // ✅ نوشتن در فایل
  // =============================================
  _writeToFile(file, message) {
    try {
      fs.appendFileSync(file, message + '\n');
    } catch (error) {
      console.error('❌ خطا در نوشتن لاگ:', error);
    }
  }

  // =============================================
  // ✅ لاگ اصلی
  // =============================================
  _log(level, message, ...args) {
    if (level > currentLevel) return;

    const timestamp = this._getTimestamp();
    const levelName = LOG_LEVEL_NAMES[level];
    const color = LOG_COLORS[level];
    const prefix = `${color}[${levelName}]${colors.reset}`;
    const fullMessage = `${timestamp} [${levelName}] ${message}`;

    // نمایش در کنسول
    if (args.length > 0) {
      console.log(`${prefix} ${message}`, ...args);
    } else {
      console.log(`${prefix} ${message}`);
    }

    // نوشتن در فایل
    this._writeToFile(this.logFile, fullMessage);

    // اگر خطا بود، در فایل خطا هم ذخیره کن
    if (level === LOG_LEVELS.ERROR) {
      this._writeToFile(this.errorFile, fullMessage);
    }
  }

  // =============================================
  // ✅ متدهای عمومی
  // =============================================
  error(message, ...args) {
    this._log(LOG_LEVELS.ERROR, message, ...args);
  }

  warn(message, ...args) {
    this._log(LOG_LEVELS.WARN, message, ...args);
  }

  info(message, ...args) {
    this._log(LOG_LEVELS.INFO, message, ...args);
  }

  debug(message, ...args) {
    this._log(LOG_LEVELS.DEBUG, message, ...args);
  }

  trace(message, ...args) {
    this._log(LOG_LEVELS.TRACE, message, ...args);
  }

  // =============================================
  // ✅ لاگ عملکرد (Performance)
  // =============================================
  performance(operation, duration, metadata = {}) {
    const timestamp = this._getTimestamp();
    const message = `${timestamp} [PERF] ${operation} - ${duration}ms ${JSON.stringify(metadata)}`;
    
    console.log(`${colors.green}[PERF]${colors.reset} ${operation} - ${duration}ms`);
    this._writeToFile(this.performanceFile, message);
  }

  // =============================================
  // ✅ لاگ کوئری (Query)
  // =============================================
  query(collection, operation, filter, duration) {
    const timestamp = this._getTimestamp();
    const message = `${timestamp} [QUERY] ${collection}.${operation} - ${duration}ms`;
    
    if (currentLevel >= LOG_LEVELS.DEBUG) {
      console.log(`${colors.cyan}[QUERY]${colors.reset} ${collection}.${operation} - ${duration}ms`);
    }
    this._writeToFile(this.logFile, message);
  }

  // =============================================
  // ✅ لاگ API
  // =============================================
  api(req, res, duration) {
    const timestamp = this._getTimestamp();
    const method = req.method;
    const url = req.url;
    const status = res.statusCode;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    const statusColor = status >= 400 ? colors.red : status >= 300 ? colors.yellow : colors.green;
    const message = `${timestamp} [API] ${method} ${url} - ${statusColor}${status}${colors.reset} - ${duration}ms - ${ip}`;
    
    console.log(message);
    this._writeToFile(this.logFile, `[API] ${method} ${url} - ${status} - ${duration}ms - ${ip} - ${userAgent}`);
  }

  // =============================================
  // ✅ جداساز خط
  // =============================================
  divider() {
    console.log(`${colors.gray}${'═'.repeat(60)}${colors.reset}`);
  }

  // =============================================
  // ✅ عنوان
  // =============================================
  title(message) {
    console.log(`\n${colors.cyan}${colors.bold}📌 ${message}${colors.reset}\n`);
  }

  // =============================================
  // ✅ لاگ خطای کامل با استک
  // =============================================
  errorWithStack(error, context = {}) {
    const timestamp = this._getTimestamp();
    const message = `${timestamp} [ERROR] ${error.message}\nStack: ${error.stack}\nContext: ${JSON.stringify(context)}`;
    
    console.error(`${colors.bgRed}${colors.bold} ERROR ${colors.reset} ${error.message}`);
    console.error(error.stack);
    
    this._writeToFile(this.errorFile, message);
    this._writeToFile(this.logFile, message);
  }

  // =============================================
  // ✅ لاگ با موفقیت
  // =============================================
  success(message, ...args) {
    const timestamp = this._getTimestamp();
    console.log(`${colors.green}✅ ${message}${colors.reset}`, ...args);
    this._writeToFile(this.logFile, `${timestamp} [SUCCESS] ${message}`);
  }
}

// =============================================
// ✅ ایجاد نمونه و export
// =============================================
const logger = new Logger();

module.exports = logger;
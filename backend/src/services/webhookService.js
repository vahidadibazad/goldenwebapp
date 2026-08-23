// backend/src/services/webhookService.js
const Webhook = require('../models/Webhook');
const axios = require('axios');
const crypto = require('crypto');

/**
 * سرویس وب‌هوک پیشرفته
 * پشتیبانی از ارسال رویدادها به سیستم‌های خارجی
 */
class WebhookService {

  // =============================================
  // ۱. ارسال رویداد به وب‌هوک‌ها
  // =============================================
  static async dispatchEvent(event, data, context = {}) {
    try {
      // پیدا کردن وب‌هوک‌های فعال برای این رویداد
      const webhooks = await Webhook.find({
        'settings.active': true,
        events: event,
      });

      if (webhooks.length === 0) {
        console.log(`ℹ️ هیچ وب‌هوکی برای رویداد ${event} یافت نشد`);
        return;
      }

      console.log(`📡 ارسال رویداد ${event} به ${webhooks.length} وب‌هوک`);

      // ارسال به همه وب‌هوک‌ها (همزمان)
      const promises = webhooks.map(webhook => 
        this.sendWebhook(webhook, event, data, context)
      );

      await Promise.all(promises);

    } catch (error) {
      console.error(`❌ خطا در ارسال رویداد ${event}:`, error);
    }
  }

  // =============================================
  // ۲. ارسال به یک وب‌هوک خاص
  // =============================================
  static async sendWebhook(webhook, event, data, context = {}) {
    try {
      // اعمال فیلترها
      if (!webhook.applyFilters(data)) {
        console.log(`⏭️ وب‌هوک ${webhook.name} به دلیل فیلترها نادیده گرفته شد`);
        return;
      }

      // ساخت payload
      const payload = {
        event,
        timestamp: new Date().toISOString(),
        data,
        context: {
          webhookId: webhook._id,
          webhookName: webhook.name,
          ...context,
        },
        signature: this.generateSignature(webhook, data),
      };

      // ارسال درخواست
      const response = await this._sendRequest(webhook, payload);

      // ثبت آمار موفق
      await webhook.recordCall(true);

      console.log(`✅ وب‌هوک ${webhook.name} با موفقیت ارسال شد`);

      return {
        success: true,
        response: response.data,
        status: response.status,
      };

    } catch (error) {
      console.error(`❌ خطا در ارسال وب‌هوک ${webhook.name}:`, error);

      // ثبت آمار ناموفق
      await webhook.recordCall(false, error.message);

      return {
        success: false,
        error: error.message,
        retry: true,
      };
    }
  }

  // =============================================
  // ۳. ارسال درخواست به وب‌هوک
  // =============================================
  static async _sendRequest(webhook, payload) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Correspondence-System/2.0',
        'X-Webhook-ID': webhook._id.toString(),
        'X-Webhook-Name': webhook.name,
        'X-Event-Timestamp': new Date().toISOString(),
      },
      timeout: webhook.settings.timeout || 5000,
      maxRedirects: 5,
    };

    // احراز هویت
    switch (webhook.auth.type) {
      case 'basic':
        const auth = Buffer.from(
          `${webhook.auth.username}:${webhook.auth.password}`
        ).toString('base64');
        config.headers.Authorization = `Basic ${auth}`;
        break;

      case 'bearer':
        config.headers.Authorization = `Bearer ${webhook.auth.token}`;
        break;

      case 'api_key':
        config.headers[webhook.auth.apiKeyHeader || 'X-API-Key'] = webhook.auth.apiKey;
        break;

      default:
        // بدون احراز هویت
        break;
    }

    // ارسال درخواست با تلاش مجدد
    let attempts = 0;
    let lastError = null;

    while (attempts < (webhook.settings.retryCount || 3)) {
      try {
        const response = await axios.post(webhook.url, payload, config);
        return response;
      } catch (error) {
        lastError = error;
        attempts++;

        if (attempts < webhook.settings.retryCount) {
          const delay = webhook.settings.retryDelay || 1000;
          await new Promise(resolve => setTimeout(resolve, delay * attempts));
        }
      }
    }

    throw lastError || new Error('همه تلاش‌ها ناموفق بود');
  }

  // =============================================
  // ۴. تولید امضای دیجیتال برای وب‌هوک
  // =============================================
  static generateSignature(webhook, data) {
    try {
      const payload = JSON.stringify(data);
      const secret = process.env.WEBHOOK_SECRET || 'default-secret';
      
      return crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
    } catch (error) {
      console.error('❌ خطا در تولید امضا:', error);
      return '';
    }
  }

  // =============================================
  // ۵. ایجاد وب‌هوک جدید
  // =============================================
  static async createWebhook(data, userId) {
    const {
      name,
      url,
      events,
      auth = { type: 'none' },
      settings = {},
      filters = {},
    } = data;

    // اعتبارسنجی
    if (!name || !url || !events || events.length === 0) {
      throw new Error('نام، آدرس و حداقل یک رویداد الزامی است');
    }

    // بررسی تکراری نبودن URL
    const existing = await Webhook.findOne({ url, 'settings.active': true });
    if (existing) {
      throw new Error('وب‌هوکی با این آدرس قبلاً ثبت شده است');
    }

    const webhook = new Webhook({
      name,
      url,
      events,
      auth,
      settings: {
        retryCount: settings.retryCount || 3,
        retryDelay: settings.retryDelay || 1000,
        timeout: settings.timeout || 5000,
        active: true,
      },
      filters,
      createdBy: userId,
    });

    await webhook.save();

    return webhook;
  }

  // =============================================
  // ۶. تست وب‌هوک
  // =============================================
  static async testWebhook(webhookId) {
    const webhook = await Webhook.findById(webhookId);
    if (!webhook) {
      throw new Error('وب‌هوک یافت نشد');
    }

    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'این یک تست از سامانه مکاتبات است',
        test: true,
      },
    };

    return this._sendRequest(webhook, testPayload);
  }

  // =============================================
  // ۷. دریافت آمار وب‌هوک‌ها
  // =============================================
  static async getStats(userId = null) {
    const filter = {};
    if (userId) filter.createdBy = userId;

    const webhooks = await Webhook.find(filter);

    const total = webhooks.length;
    const active = webhooks.filter(w => w.settings.active).length;
    const totalCalls = webhooks.reduce((sum, w) => sum + (w.stats?.totalCalls || 0), 0);
    const totalFailed = webhooks.reduce((sum, w) => sum + (w.stats?.failedCalls || 0), 0);

    return {
      total,
      active,
      inactive: total - active,
      totalCalls,
      totalFailed,
      successRate: totalCalls > 0 ? ((totalCalls - totalFailed) / totalCalls * 100).toFixed(2) : 0,
      webhooks: webhooks.map(w => ({
        id: w._id,
        name: w.name,
        url: w.url,
        events: w.events,
        isActive: w.settings.active,
        stats: w.stats,
        createdAt: w.createdAt,
      })),
    };
  }
}

module.exports = WebhookService;
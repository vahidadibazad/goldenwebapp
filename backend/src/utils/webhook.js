const https = require('https');
const http = require('http');
const url = require('url');
const Webhook = require('../models/Webhook');

const request = (webhookUrl, data, options = {}) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(webhookUrl);
    const isHttps = parsedUrl.protocol === 'https:';
    const lib = isHttps ? https : http;

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.path || '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Correspondence-System/1.0',
        ...(options.headers || {}),
      },
      timeout: options.timeout || 5000,
    };

    const req = lib.request(reqOptions, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ data: parsed, status: res.statusCode });
        } catch {
          resolve({ data: responseData, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => { reject(error); });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('درخواست timeout شد'));
    });

    if (data) {
      const jsonData = JSON.stringify(data);
      req.setHeader('Content-Length', Buffer.byteLength(jsonData));
      req.write(jsonData);
    }
    req.end();
  });
};

const sendWebhook = async (webhookId, event, data) => {
  try {
    const webhook = await Webhook.findById(webhookId);
    if (!webhook || !webhook.settings.active) {
      return { success: false, error: 'وب‌هوک غیرفعال است' };
    }
    if (!webhook.events.includes(event)) {
      return { success: false, error: 'رویداد پشتیبانی نمی‌شود' };
    }

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      webhook: { id: webhook._id, name: webhook.name },
    };

    const reqOptions = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Correspondence-System/1.0',
      },
      timeout: webhook.settings.timeout || 5000,
    };

    switch (webhook.auth.type) {
      case 'basic':
        const auth = Buffer.from(`${webhook.auth.username}:${webhook.auth.password}`).toString('base64');
        reqOptions.headers.Authorization = `Basic ${auth}`;
        break;
      case 'bearer':
        reqOptions.headers.Authorization = `Bearer ${webhook.auth.token}`;
        break;
      case 'api_key':
        reqOptions.headers[webhook.auth.apiKeyHeader || 'X-API-Key'] = webhook.auth.apiKey;
        break;
    }

    let attempts = 0;
    let lastError = null;
    while (attempts < (webhook.settings.retryCount || 3)) {
      try {
        const response = await request(webhook.url, payload, reqOptions);
        await webhook.recordCall(true);
        return { success: true, response: response.data };
      } catch (error) {
        lastError = error.message;
        attempts++;
        if (attempts < webhook.settings.retryCount) {
          await new Promise(resolve => setTimeout(resolve, webhook.settings.retryDelay || 1000));
        }
      }
    }

    await webhook.recordCall(false, lastError);
    return { success: false, error: lastError };
  } catch (error) {
    console.error('❌ خطا در ارسال وب‌هوک:', error);
    return { success: false, error: error.message };
  }
};

const sendToAllWebhooks = async (event, data) => {
  try {
    const webhooks = await Webhook.find({ 'settings.active': true, events: event });
    const results = [];
    for (const webhook of webhooks) {
      const result = await sendWebhook(webhook._id, event, data);
      results.push({ webhook: webhook.name, ...result });
    }
    return results;
  } catch (error) {
    console.error('❌ خطا در ارسال به همه وب‌هوک‌ها:', error);
    return [];
  }
};

module.exports = { sendWebhook, sendToAllWebhooks };
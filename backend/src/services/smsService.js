const Kavenegar = require('kavenegar');

/**
 * سرویس ارسال پیامک
 * پشتیبانی از کاوه‌نگار
 */
class SmsService {
  
  static getClient() {
    const apiKey = process.env.KAVENEGAR_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ کلید API کاوه‌نگار تنظیم نشده است');
      return null;
    }
    return Kavenegar.KavenegarApi(apiKey);
  }

  static async sendSMS(phoneNumber, message) {
    try {
      const client = this.getClient();
      if (!client) {
        throw new Error('سرویس پیامک پیکربندی نشده است');
      }

      const sender = process.env.SMS_SENDER || '1000596446';

      return new Promise((resolve, reject) => {
        client.Send({
          sender,
          receptor: phoneNumber,
          message,
        }, (response, status) => {
          if (status === 200) {
            console.log(`✅ SMS ارسال شد به ${phoneNumber}`);
            resolve(response);
          } else {
            console.error('❌ خطا در ارسال SMS:', status);
            reject(new Error('خطا در ارسال SMS'));
          }
        });
      });
    } catch (error) {
      console.error('❌ خطا در ارسال SMS:', error);
      throw error;
    }
  }

  static async sendOTP(phoneNumber, code) {
    const message = `کد تایید شما: ${code}\n\nاین کد تا ۵ دقیقه معتبر است.`;
    return this.sendSMS(phoneNumber, message);
  }
}

module.exports = SmsService;
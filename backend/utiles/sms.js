const Kavenegar = require('kavenegar');

const sendSMS = async (phoneNumber, message) => {
  try {
    const apiKey = process.env.KAVENEGAR_API_KEY;
    const sender = process.env.SMS_SENDER || '1000596446';
    
    const kavenegar = Kavenegar.KavenegarApi(apiKey);
    
    return new Promise((resolve, reject) => {
      kavenegar.Send({
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
    return null;
  }
};

const sendOTP = async (phoneNumber, code) => {
  const message = `کد تایید شما: ${code}\n\nاین کد تا ۵ دقیقه معتبر است.`;
  return sendSMS(phoneNumber, message);
};

module.exports = { sendSMS, sendOTP };